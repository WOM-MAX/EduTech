require('dotenv').config()
const { Pool } = require('pg')
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai')
const { z } = require('zod')

const RubricSchema = z.object({
  criterios: z.array(z.object({
    nombre: z.string().describe("El indicador de evaluación exacto que se está evaluando en este criterio"),
    destacado: z.string().describe("Descripción del nivel Destacado (el estudiante domina completamente)"),
    adecuado: z.string().describe("Descripción del nivel Adecuado (el estudiante cumple el criterio estándar)"),
    basico: z.string().describe("Descripción del nivel Básico (el estudiante cumple parcialmente con ayuda)"),
    insuficiente: z.string().describe("Descripción del nivel Insuficiente (el estudiante no logra el criterio mínimo)")
  })).describe("Lista de criterios. DEBE HABER EXACTAMENTE UN CRITERIO POR CADA INDICADOR.")
})

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",  // Verificado: sin thinking, $0.23 para los 906 OAs restantes
  temperature: 0.2,
  apiKey: process.env.GEMINI_API_KEY
})
const structuredLlm = llm.withStructuredOutput(RubricSchema)

const delay = ms => new Promise(res => setTimeout(res, ms))

async function processOA(client, oa) {
  const indicadoresList = oa.indicadores.split('\n').filter(i => i.trim().length > 0)
  
  if (indicadoresList.length === 0) {
     return { ok: false, id: oa.id, codigo: oa.codigo, error: "No hay indicadores" }
  }

  const actividadesText = oa.sugerenciasActividades ? JSON.stringify(oa.sugerenciasActividades, null, 2) : "No especificadas"
  const erroresText = oa.erroresFrecuentes ? JSON.stringify(oa.erroresFrecuentes) : "No especificados"
  const estrategiasText = oa.estrategiasDua ? JSON.stringify(oa.estrategiasDua, null, 2) : "No especificadas"

  const prompt = `
Eres un experto en currículum chileno (Mineduc) y diseño DUA.
Debes crear los criterios de una rúbrica formativa (Decreto 67) para el siguiente Objetivo de Aprendizaje (OA):

Nivel: ${oa.nivel}
Asignatura: ${oa.asignatura}
Código OA: ${oa.codigo}
Descripción del OA: ${oa.descripcion}
Nivel Cognitivo Bloom Oficial: ${oa.nivelBloom}

CONTEXTO PEDAGÓGICO DE LA RÚBRICA:
Errores Frecuentes a observar: ${erroresText}
Estrategias DUA: ${estrategiasText}
Actividades Sugeridas (Usa estas actividades como el contexto base para imaginar cómo el estudiante demostrará su aprendizaje):
${actividadesText}

INSTRUCCIÓN CRÍTICA:
Aquí tienes la lista EXACTA de indicadores de evaluación para este OA:
${indicadoresList.map(i => `- ${i}`).join('\n')}

DEBES generar EXACTAMENTE ${indicadoresList.length} criterios.
Cada criterio debe corresponder 1 a 1 a cada uno de los indicadores listados arriba.
No agrupes indicadores. No omitas ninguno.
Usa lenguaje claro y observable para cada nivel (Destacado, Adecuado, Básico, Insuficiente).
`

  try {
    const result = await structuredLlm.invoke(prompt)
    
    // Iniciar transacción
    await client.query('BEGIN')
    
    // 1. Insertar RubricaMaster
    const rubricaRes = await client.query(
      `INSERT INTO "RubricaMaster" ("objetivoAprendizajeId", "updatedAt") 
       VALUES ($1, NOW()) RETURNING id`,
      [oa.id]
    )
    const rubricaId = rubricaRes.rows[0].id
    
    // 2. Insertar cada CriterioMaster
    for (const criterio of result.criterios) {
      await client.query(
        `INSERT INTO "CriterioMaster" ("nombre", "destacado", "adecuado", "basico", "insuficiente", "rubricaMasterId")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [criterio.nombre, criterio.destacado, criterio.adecuado, criterio.basico, criterio.insuficiente, rubricaId]
      )
    }
    
    await client.query('COMMIT')
    return { ok: true, id: oa.id, codigo: oa.codigo }
  } catch (error) {
    await client.query('ROLLBACK')
    return { ok: false, id: oa.id, codigo: oa.codigo, error: error.message }
  }
}

async function main() {
  const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL
  const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } })
  const client = await pool.connect()

  console.log("🔍 Obteniendo OAs pendientes de Rúbrica Master...")
  
  const { rows: oas } = await client.query(`
    SELECT oa.id, oa.codigo, oa.descripcion, oa."nivelBloom", oa.indicadores,
           oa."sugerenciasActividades", oa."conceptosClave", oa."erroresFrecuentes", oa."estrategiasDua",
           ne.nombre as nivel, a.nombre as asignatura
    FROM "ObjetivoAprendizaje" oa
    JOIN "NivelEducativo" ne ON oa."nivelEducativoId" = ne.id
    JOIN "Asignatura" a ON oa."asignaturaId" = a.id
    LEFT JOIN "RubricaMaster" rm ON rm."objetivoAprendizajeId" = oa.id
    WHERE rm.id IS NULL
    ORDER BY oa.id
  `)

  console.log(`📊 Se encontraron ${oas.length} OAs sin rúbrica master.`)
  if (oas.length === 0) {
    console.log("No hay nada que procesar.")
    client.release()
    await pool.end()
    return
  }

  console.log(`⏱️  Tiempo estimado: ~${Math.ceil(oas.length / 5 * 1.5)} segundos\n`)

  const BATCH_SIZE = 5
  let okCount = 0
  let errCount = 0
  const startTime = Date.now()

  for (let i = 0; i < oas.length; i += BATCH_SIZE) {
    const batch = oas.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(oas.length / BATCH_SIZE)
    
    const results = await Promise.all(batch.map(oa => processOA(client, oa)))
    
    for (const r of results) {
      if (r.ok) {
        okCount++
        process.stdout.write(`✅ `)
      } else {
        errCount++
        console.error(`\n❌ OA ${r.codigo}: ${r.error}`)
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
    const progress = ((i + batch.length) / oas.length * 100).toFixed(1)
    process.stdout.write(` [Lote ${batchNum}/${totalBatches}] ${progress}% | ${elapsed}s\n`)

    if (i + BATCH_SIZE < oas.length) {
      await delay(1500)
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n🎉 ¡GENERACIÓN DE RÚBRICAS MASIVA COMPLETADA!`)
  console.log(`   ✅ Exitosos: ${okCount}`)
  console.log(`   ❌ Errores: ${errCount}`)
  console.log(`   ⏱️  Tiempo total: ${totalTime} segundos`)

  client.release()
  await pool.end()
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
