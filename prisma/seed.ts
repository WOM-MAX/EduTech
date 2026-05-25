import { PrismaClient, NivelBloom } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as xlsx from 'xlsx'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Helper to determine order
function getOrdenNivel(nombre: string): number {
  if (nombre.includes('1° Básico')) return 1;
  if (nombre.includes('2° Básico')) return 2;
  if (nombre.includes('3° Básico')) return 3;
  if (nombre.includes('4° Básico')) return 4;
  if (nombre.includes('5° Básico')) return 5;
  if (nombre.includes('6° Básico')) return 6;
  if (nombre.includes('7° Básico')) return 7;
  if (nombre.includes('8° Básico')) return 8;
  if (nombre.includes('I Medio')) return 9;
  if (nombre.includes('II Medio')) return 10;
  if (nombre.includes('III Medio') || nombre.includes('3 Y 4 Medio') || nombre.includes('III y IV Medio') || nombre.includes('3° y 4° medio')) return 11;
  if (nombre.includes('IV Medio')) return 12;
  return 99; // Default for electives
}

// Map Bloom level
function mapBloom(nivel: string): NivelBloom {
  const upper = nivel.trim().toUpperCase();
  switch (upper) {
    case 'RECORDAR': return NivelBloom.RECORDAR;
    case 'COMPRENDER': return NivelBloom.COMPRENDER;
    case 'APLICAR': return NivelBloom.APLICAR;
    case 'ANALIZAR': return NivelBloom.ANALIZAR;
    case 'EVALUAR': return NivelBloom.EVALUAR;
    case 'CREAR': return NivelBloom.CREAR;
    default: return NivelBloom.COMPRENDER; // Fallback
  }
}

async function main() {
  console.log('Iniciando seed de datos curriculares...')

  const filePath = path.join(__dirname, '../BASES DE DATOS/planes_consolidados_master.xlsx')
  const workbook = xlsx.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const data = xlsx.utils.sheet_to_json(sheet) as any[]

  console.log(`Leídas ${data.length} filas del Excel master.`)

  // Cache para evitar consultas constantes
  const nivelesCache = new Map<string, number>()
  const asignaturasCache = new Map<string, number>()
  const ejesCache = new Map<string, number>() // key: "asignaturaId_ejeName"

  for (const row of data) {
    const cursoStr = String(row['Curso']).trim();
    const asignaturaStr = String(row['Asignatura']).trim();
    const ejeStr = String(row['Eje Curricular']).trim().toUpperCase(); // Normalización de casing
    const codigoOA = String(row['Nº de OA'] || '').trim();
    const descripcion = String(row['Descripción del OA'] || '').trim();
    const bloomStr = String(row['Nivel Cognitivo (Bloom)'] || '').trim();
    const indicadores = String(row['Indicadores de Evaluación'] || '').trim();

    if (!cursoStr || !asignaturaStr || !codigoOA) continue;

    // 1. Nivel Educativo
    if (!nivelesCache.has(cursoStr)) {
      const nivel = await prisma.nivelEducativo.upsert({
        where: { nombre: cursoStr },
        update: {},
        create: { nombre: cursoStr, orden: getOrdenNivel(cursoStr) }
      })
      nivelesCache.set(cursoStr, nivel.id)
    }
    const nivelId = nivelesCache.get(cursoStr)!

    // 2. Asignatura
    if (!asignaturasCache.has(asignaturaStr)) {
      const asignatura = await prisma.asignatura.upsert({
        where: { nombre: asignaturaStr },
        update: {},
        create: { nombre: asignaturaStr }
      })
      asignaturasCache.set(asignaturaStr, asignatura.id)
    }
    const asignaturaId = asignaturasCache.get(asignaturaStr)!

    // 3. Eje Curricular
    const ejeKey = `${asignaturaId}_${ejeStr}`
    if (!ejesCache.has(ejeKey)) {
      const eje = await prisma.ejeCurricular.upsert({
        where: { nombre_asignaturaId: { nombre: ejeStr, asignaturaId } },
        update: {},
        create: { nombre: ejeStr, asignaturaId }
      })
      ejesCache.set(ejeKey, eje.id)
    }
    const ejeId = ejesCache.get(ejeKey)!

    // 4. Objetivo de Aprendizaje
    await prisma.objetivoAprendizaje.upsert({
      where: {
        codigo_nivelEducativoId_asignaturaId_ejeCurricularId: {
          codigo: codigoOA,
          nivelEducativoId: nivelId,
          asignaturaId: asignaturaId,
          ejeCurricularId: ejeId
        }
      },
      update: {
        descripcion,
        nivelBloom: mapBloom(bloomStr),
        indicadores
      },
      create: {
        codigo: codigoOA,
        descripcion,
        nivelBloom: mapBloom(bloomStr),
        indicadores,
        nivelEducativoId: nivelId,
        asignaturaId: asignaturaId,
        ejeCurricularId: ejeId
      }
    })
  }

  console.log('Seed completado exitosamente con 1522 OAs aproximados.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
