// Tipos compartidos entre Server Actions y Client Components

export interface RubricCriterio {
  nombre: string
  destacado: string
  adecuado: string
  basico: string
  insuficiente: string
}

export interface RubricType {
  criterios: RubricCriterio[]
}
