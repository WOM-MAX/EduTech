# Informe de Sesión - Refactorización de Arquitectura Rúbricas (BD Master)
**Fecha y Hora:** 24 de Mayo de 2026, 14:20 hrs.

## 1. Contexto y Problema Resuelto
Se detectó una dependencia insostenible de la API de Gemini (costos y escalabilidad) y un bug crítico en la generación de rúbricas donde no se respetaba la cantidad de indicadores seleccionados.

**Decisión Arquitectónica:** Se migró de un modelo "100% LLM en tiempo real" a un modelo híbrido "Base de Datos Maestra + IA Opcional".

## 2. Acciones Realizadas

### A. Modelo de Datos (Prisma)
- Se actualizaron los modelos en `schema.prisma` agregando `RubricaMaster`, `CriterioMaster` y `RubricaCache`.
- Se aplicó el push a la base de datos de Neon (`npx prisma db push`).

### B. Generación de Base de Datos Maestra (Seeding)
- Se creó el script masivo `scripts/generar_rubricas_master.js`.
- **Estrategia de Contexto:** El script fue modificado para incluir la inteligencia pedagógica previamente generada (`sugerenciasActividades`, `erroresFrecuentes`, `estrategiasDua`) directo en el prompt. Así, la "rúbrica genérica" en realidad está altamente contextualizada a las estrategias DUA del OA.
- El script se dejó corriendo en segundo plano para procesar los 1,482 OAs restantes.

### C. Backend (Server Actions)
- En `src/actions/rubricas.ts`, se creó la función `obtenerRubricaMaster(oaId)` para leer los criterios pre-generados de forma instantánea ($0 costo, 0 latencia).
- Se renombró la función original a `refinarConIA` para mantenerla como una opción avanzada.

### D. Frontend (UI)
- En `src/app/rubricas/components/RubricForm.tsx`, se refactorizó la botonera.
- Ahora existe un flujo principal **"Obtener Rúbrica DUA (Instantáneo)"** (usando la BD Master).
- Si el profesor decide escribir un contexto propio (llenando el *textarea*), se habilita un botón secundario **"✨ Refinar con IA (Personalizar)"**.

## 3. Estado Actual
La plataforma ya no tiene una fuga de dinero por llamadas a la API innecesarias. El módulo de rúbricas tiene ahora una arquitectura sólida, gratuita en su uso estándar, pero que retiene el poder de la IA para casos donde la personalización manual sea requerida.

## 4. Próximos Pasos
- Esperar que el script masivo finalice (tomará un par de horas en procesar los ~1,500 OAs).
- Probar el sistema completo (Frontend a DB).
- Aplicar este mismo patrón arquitectónico a los siguientes módulos (SIMCE, PAES, Guías).
