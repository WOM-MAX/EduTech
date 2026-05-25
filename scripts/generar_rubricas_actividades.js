require('dotenv').config()
const { Pool } = require('pg')
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai')
const { z } = require('zod')

const RubricSchema = z.object({
  criterios: z.array(z.object({
    nombre: z.string().describe("Nombre de la dimensión o criterio a evaluar (ej: Técnica de modelado, Explicación oral, Uso de colores)"),
    destacado: z.string().describe("Descripción del nivel Destacado (el estudiante domina completamente)"),
    adecuado: z.string().describe("Descripción del nivel Adecuado (el estudiante cumple el criterio estándar)"),
    basico: z.string().describe("Descripción del nivel Básico (el estudiante cumple parcialmente con ayuda)"),
    insuficiente: z.string().describe("Descripción del nivel Insuficiente (el estudiante no logra el criterio mínimo)")
  })).describe("Lista de criterios. DEBE HABER EXACTAMENTE 4 CRITERIOS DIFERENTES para evaluar la actividad de forma integral.")
})

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  temperature: 0.2,
  apiKey: process.env.GEMINI_API_KEY
})
const structuredLlm = llm.withStructuredOutput(RubricSchema)

const delay = ms => new Promise(res => setTimeout(res, ms))

async function processActivity(client, oa, nivelBloom, actividadText) {
  const hashKey = `ACTIVITY_${oa.id}_${nivelBloom}`
  
  // Revisar si ya existe
  const { rows: existing } = await client.query(
    `SELECT id FROM "RubricaCache" WHERE "hashKey" = $1`,
    [hashKey]
  )
  
  if (existing.length > 0) return { ok: true, status: 'skipped' }

  const prompt = `
Eres un experto en evaluación educativa chilena y diseño DUA.
Se ha diseñado una actividad pedagógica para el siguiente Objetivo de Aprendizaje (OA).

Nivel: ${oa.nivel}
Asignatura: ${oa.asignatura}
OA: ${oa.codigo} - ${oa.descripcion}

ACTIVIDAD A EVALUAR:
"${actividadText}" (Nivel cognitivo: ${nivelBloom})

INSTRUCCIÓN CRÍTICA:
La actividad es compleja y requiere ser evaluada en MÚLTIPLES dimensiones.
Crea EXACTAMENTE 4 criterios de evaluación distintos que permitan calificar el desempeño del estudiante en esta actividad específica.
Redacta las expectativas para cada nivel de desempeño (Destacado, Adecuado, Básico, Insuficiente) para cada criterio.
`

  try {
    const result = await structuredLlm.invoke(prompt)
    
    await client.query('BEGIN')
    
    // Convertir el JSON de criterios a string
    const criteriosJson = JSON.stringify(result.criterios)
    
    // Insertar en RubricaCache
    await client.query(
      `INSERT INTO "RubricaCache" ("objetivoAprendizajeId", "contexto", "hashKey", "criterios", "createdAt") 
       VALUES ($1, $2, $3, $4, NOW())`,
      [oa.id, actividadText, hashKey, criteriosJson]
    )
    
    await client.query('COMMIT')
    return { ok: true, status: 'created' }
  } catch (error) {
    await client.query('ROLLBACK')
    return { ok: false, error: error.message }
  }
}

async function main() {
  const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL
  const pool = new Pool({ 
    connectionString: connStr, 
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000
  })

  console.log("🔍 Obteniendo OAs para generar rúbricas de Actividades...")
  
  const { rows: oas } = await pool.query(`
    SELECT oa.id, oa.codigo, oa.descripcion,
           oa."sugerenciasActividades",
           ne.nombre as nivel, a.nombre as asignatura
    FROM "ObjetivoAprendizaje" oa
    JOIN "NivelEducativo" ne ON oa."nivelEducativoId" = ne.id
    JOIN "Asignatura" a ON oa."asignaturaId" = a.id
    WHERE oa."sugerenciasActividades" IS NOT NULL
    ORDER BY oa.id
  `)

  // Aplanar todas las actividades a procesar
  const tasks = []
  for (const oa of oas) {
    if (typeof oa.sugerenciasActividades === 'object') {
      for (const [nivelBloom, actividadText] of Object.entries(oa.sugerenciasActividades)) {
        if (typeof actividadText === 'string' && actividadText.trim() !== '') {
          tasks.push({ oa, nivelBloom, actividadText })
        }
      }
    }
  }

  console.log(`📊 Se encontraron ${tasks.length} actividades para procesar.`)
  if (tasks.length === 0) {
    await pool.end()
    return
  }

  console.log(`⏱️  Tiempo estimado: ~${Math.ceil(tasks.length / 5 * 1.5)} segundos\n`)

  const BATCH_SIZE = 5
  let okCount = 0
  let skipCount = 0
  let errCount = 0
  const startTime = Date.now()

  // Wrapper que usa pool directamente (auto-reconnect) en lugar de un solo client
  async function processWithPool(oa, nivelBloom, actividadText) {
    const hashKey = `ACTIVITY_${oa.id}_${nivelBloom}`
    
    try {
      const { rows: existing } = await pool.query(
        `SELECT id FROM "RubricaCache" WHERE "hashKey" = $1`, [hashKey]
      )
      if (existing.length > 0) return { ok: true, status: 'skipped' }

      const prompt = `
Eres un experto en evaluación educativa chilena y diseño DUA.
Se ha diseñado una actividad pedagógica para el siguiente Objetivo de Aprendizaje (OA).

Nivel: ${oa.nivel}
Asignatura: ${oa.asignatura}
OA: ${oa.codigo} - ${oa.descripcion}

ACTIVIDAD A EVALUAR:
"${actividadText}" (Nivel cognitivo: ${nivelBloom})

INSTRUCCIÓN CRÍTICA:
La actividad es compleja y requiere ser evaluada en MÚLTIPLES dimensiones.
Crea EXACTAMENTE 4 criterios de evaluación distintos que permitan calificar el desempeño del estudiante en esta actividad específica.
Redacta las expectativas para cada nivel de desempeño (Destacado, Adecuado, Básico, Insuficiente) para cada criterio.
`
      const result = await structuredLlm.invoke(prompt)
      const criteriosJson = JSON.stringify(result.criterios)
      
      await pool.query(
        `INSERT INTO "RubricaCache" ("objetivoAprendizajeId", "contexto", "hashKey", "criterios", "createdAt") 
         VALUES ($1, $2, $3, $4, NOW())`,
        [oa.id, actividadText, hashKey, criteriosJson]
      )
      
      return { ok: true, status: 'created' }
    } catch (error) {
      return { ok: false, error: error.message }
    }
  }

  for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
    const batch = tasks.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(tasks.length / BATCH_SIZE)
    
    const results = await Promise.all(batch.map(t => processWithPool(t.oa, t.nivelBloom, t.actividadText)))
    
    for (const r of results) {
      if (r.ok) {
        if (r.status === 'skipped') skipCount++
        else okCount++
        process.stdout.write(r.status === 'skipped' ? '⏭️ ' : '✅ ')
      } else {
        errCount++
        console.error(`\n❌ Error: ${r.error}`)
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
    const progress = ((i + batch.length) / tasks.length * 100).toFixed(1)
    process.stdout.write(` [Lote ${batchNum}/${totalBatches}] ${progress}% | ${elapsed}s\n`)

    if (i + BATCH_SIZE < tasks.length) {
      await delay(1500)
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n🎉 ¡GENERACIÓN DE RÚBRICAS DE ACTIVIDADES COMPLETADA!`)
  console.log(`   ✅ Creadas: ${okCount}`)
  console.log(`   ⏭️ Omitidas (ya existían): ${skipCount}`)
  console.log(`   ❌ Errores: ${errCount}`)
  console.log(`   ⏱️  Tiempo total: ${totalTime} segundos`)

  await pool.end()
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })

