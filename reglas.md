# Reglas Globales del Proyecto App EdTech Chile

## 0. Memoria del Proyecto (PRIORIDAD MÁXIMA)
- **Al inicio de cada sesión**, ANTES de cualquier otra acción, DEBES leer TODOS los archivos en la carpeta `memoria/`.
- Estos informes son la **ayuda memoria** del proyecto: registran decisiones, avances y el estado exacto donde quedamos la última vez.
- Usa esta información para retomar el contexto sin preguntar al usuario cosas que ya están documentadas.
- Si no existen informes en `memoria/`, procede normalmente.
- **Al finalizar cada sesión o tarea significativa**, genera o actualiza un informe en `memoria/` con el resumen de lo realizado, decisiones tomadas y próximos pasos.

## 0.5. Consulta Obligatoria de Fuentes (ANTES de construir cualquier módulo)
- **ANTES de construir cualquier módulo**, DEBES leer las fuentes relevantes en `FUENTES/`.
- Estas investigaciones contienen decisiones de arquitectura, normativa educativa chilena, reglas de negocio y especificaciones funcionales que **NO deben reinventarse ni adivinarse**.
- Consulta el mapeo Módulo → Fuentes a continuación para saber qué leer:

| Módulo | Fuentes obligatorias en `FUENTES/` |
|--------|-------------------------------------|
| 1. Rúbricas | `Arquitectura Plataforma EdTech Chile.docx` |
| 2. SIMCE | `Arquitectura Funcional Plataforma SIMCE Formativo.docx` |
| 3. PAES | `Arquitectura Funcional Plataforma PAES.docx` |
| 4. Evaluaciones | `Arquitectura Funcional Plataforma SIMCE Formativo.docx` + `Arquitectura Plataforma EdTech Chile.docx` + `Decreto_67_Evaluacion_Formativa.docx` |
| 5. Guías de Aprendizaje | `Investigacion_Guias_Aprendizaje.docx` |
| 6. Secuencias Didácticas | `Investigacion_Secuencias_Didacticas.docx` |
| 7. Simuladores | `Informe EdTech Videojuegos Educativos Mineduc.docx` + `Guía Integral para el Desarrollo de Productos EdTech.docx` |
| 8. Juegos Educativos | `Informe EdTech Videojuegos Educativos Mineduc.docx` |
| 9. Carrera Docente | `Marco Buena Enseñanza Chile.docx` + `Evaluación Docente Chile_ Proceso Actualizado.docx` + `Plataforma Evaluación Docente Chile MBE.docx` |
| Todos (visión general) | `Arquitectura EdTech_ Módulos Modernos.docx` |

- También DEBES consultar `BASES DE DATOS/planes_consolidados_master.xlsx` para cualquier módulo que genere contenido vinculado a Objetivos de Aprendizaje (OAs).
- Si un módulo **no tiene fuente asignada**, informa al usuario y solicita la investigación antes de proceder a construir.
- Las fuentes son documentos `.docx`; usa `python-docx` o herramientas equivalentes para extraer su contenido.

## 1. Arquitectura
- **Arquitectura Pure Code:** Next.js + Node.js + PostgreSQL. No se usa n8n.
- **Frontend & Backend Unificado:** Todo se gestiona desde Next.js (Server Actions / API Routes).
- **Base de Datos:** PostgreSQL con Prisma ORM como capa de acceso.
- **IA:** LangChain.js conectado a APIs de LLMs (OpenAI / Anthropic). Sin servicios intermediarios.

## 2. Diseño Visual y UX/UI
- **Diseño Dashboard Premium:** La interfaz completa se estructura como un Dashboard central.
- **Filosofía Zero-Tailwind:** CSS Vanilla / Sass puro, sin frameworks de clases utilitarias.
- **Paleta de Colores Tetrádica:**
  - Fondo principal (Dashboard): `#0000B1` (Azul Profundo)
  - Acento Primario: `#0033FF` (Azul Neón)
  - Acento Secundario: `#FF00B2` (Magenta Neón)
  - Acento Terciario: `#FFCC00` (Amarillo Dorado)
  - Acento Cuaternario: `#00FF4D` (Verde Neón)
- **Tipografía:** Google Fonts premium (Inter, Outfit o similar).
- **Efectos:** Glassmorphism, gradientes sutiles, micro-animaciones en hover.

## 3. Pedagogía y Normativa
- **Taxonomía Obligatoria:** Toda generación de contenido IA debe alinearse a la Taxonomía de Bloom Revisada por Anderson y Krathwohl (2001/2014). El validador Zod rechazará verbos que no correspondan al nivel cognitivo del OA.
- **Alineación al MBE:** El módulo de Carrera Docente debe respetar estrictamente el Marco para la Buena Enseñanza (2021), Ley N° 21.625 y lineamientos CPEIP.
- **Bases Curriculares:** Los datos curriculares provienen de los archivos Excel en `BASES DE DATOS/`. Son la fuente de verdad para OAs, ejes e indicadores.

## 4. Stack Técnico Completo (Habilidades Instaladas)
### Core
- `next` / `react` / `react-dom` — Framework principal
- `prisma` / `@prisma/client` — ORM para PostgreSQL
- `pg` — Driver nativo de PostgreSQL

### Inteligencia Artificial
- `langchain` / `@langchain/core` / `@langchain/openai` — Orquestador de IA
- `chromadb` — Base vectorial para RAG (MBE / Carrera Docente)
- `zod` — Validador estricto de esquemas y taxonomía

### Renderizado Matemático y Científico
- `katex` — Fórmulas matemáticas (LaTeX)
- `jsxgraph` — Gráficos algebraicos interactivos

### Simuladores y Juegos
- `phaser` — Motor de videojuegos 2D
- `three` / `@react-three/fiber` / `@react-three/drei` — Simulaciones 3D
- `matter-js` — Motor de física (gravedad, colisiones)

### Exportación e Impresión
- `puppeteer` — Generador de PDFs desde HTML
- `@react-pdf/renderer` — Generador de PDFs desde React

## 5. Reglas de Proceso
- **Documentación Obligatoria:** Todo proceso, análisis o tarea completada debe generar un informe en la carpeta `memoria/` para evitar redundancias y registrar decisiones clave.
- **Componentización:** Utilizar el patrón de módulos independientes para las distintas funcionalidades.
- **Validación de IA:** Toda salida de la IA debe ser validada por Zod antes de mostrarse al usuario.
- **Exportabilidad Universal:** Rúbricas, ensayos, guías y evaluaciones deben ser funcionales tanto online como en formato imprimible (PDF).

## 6. Los 9 Módulos del Sistema
1. Generador de Rúbricas Inteligentes
2. Plataforma de Ensayos SIMCE Online
3. Plataforma de Ensayos PAES Online
4. Constructor de Evaluaciones
5. Generador de Guías de Aprendizaje
6. Módulos de Aprendizaje (Secuencias Didácticas)
7. Simuladores Educativos (3D / Física)
8. Juegos Educativos (Gamificación)
9. Preparación para la Carrera Docente (MBE / CPEIP)
