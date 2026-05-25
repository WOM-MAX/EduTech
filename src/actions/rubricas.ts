"use server"

import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import type { RubricType } from "@/types/rubricas"

export async function getNivelesEducativos() {
  return await prisma.nivelEducativo.findMany({ orderBy: { orden: 'asc' } })
}

export async function getAsignaturas() {
  return await prisma.asignatura.findMany({ orderBy: { nombre: 'asc' } })
}

export async function getEjes(nivelEducativoId: number, asignaturaId: number) {
  const oas = await prisma.objetivoAprendizaje.findMany({
    where: { nivelEducativoId, asignaturaId },
    select: { ejeCurricular: true },
    distinct: ['ejeCurricularId']
  })
  return oas.map(oa => oa.ejeCurricular).sort((a, b) => a.nombre.localeCompare(b.nombre))
}

export async function getOAs(nivelEducativoId: number, asignaturaId: number, ejeCurricularId: number) {
  return await prisma.objetivoAprendizaje.findMany({
    where: { nivelEducativoId, asignaturaId, ejeCurricularId },
    orderBy: { codigo: 'asc' }
  })
}

export async function obtenerRubricaIndicadores(oaId: number, indicadoresIndexes: number[]): Promise<RubricType | { error: string }> {
  try {
    if (indicadoresIndexes.length === 0) return { error: "Debe seleccionar al menos un indicador." }

    const master = await prisma.rubricaMaster.findUnique({
      where: { objetivoAprendizajeId: oaId },
      include: {
        criterios: {
          orderBy: { id: 'asc' }
        }
      }
    })

    if (!master || master.criterios.length === 0) {
      return { error: "Rúbrica no encontrada para este OA." }
    }

    const criteriosFinales = indicadoresIndexes
      .map(idx => master.criterios[idx])
      .filter(Boolean)

    if (criteriosFinales.length === 0) return { error: "No se pudieron recuperar las filas de la rúbrica." }

    return {
      criterios: criteriosFinales
    }
  } catch (error: any) {
    console.error("Error obteniendo rúbrica por indicadores:", error)
    return { error: "Error al acceder a la base de datos" }
  }
}

export async function obtenerRubricaActividad(oaId: number, nivelBloom: string): Promise<RubricType | { error: string }> {
  try {
    const hashKey = `ACTIVITY_${oaId}_${nivelBloom}`
    const cache = await prisma.rubricaCache.findUnique({
      where: { hashKey }
    })
    
    if (!cache) return { error: "Rúbrica de actividad no encontrada. Generación masiva en proceso..." }
    
    return {
      criterios: cache.criterios as any
    }
  } catch (error: any) {
    console.error("Error obteniendo rúbrica de actividad:", error)
    return { error: "Error al acceder a la base de datos" }
  }
}
