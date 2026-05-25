# Informe de Sesión — App EdTech Chile
**Fecha:** 2026-05-22  
**Hora:** 20:43 (hora local, UTC-4)  
**Estado:** ✅ Sesión finalizada — Pendiente aprobación del plan

---

## Resumen de la Sesión

En esta sesión se realizaron tareas de **preparación y planificación** para la Fase 1 del proyecto. No se modificó código fuente; se investigó el estado actual del proyecto, se analizaron los datos curriculares y se diseñó el plan de implementación completo.

---

## Lo que se hizo hoy

### 1. Regla de Memoria (Regla 0)
Se agregó la **Regla 0 — Memoria del Proyecto** en `reglas.md` con prioridad máxima:
- Al inicio de cada sesión, el agente DEBE leer todos los archivos en `memoria/` antes de cualquier otra acción.
- Al finalizar cada sesión o tarea significativa, se genera/actualiza un informe en `memoria/`.
- Esto evita perder contexto entre sesiones.

**Archivo modificado:** `reglas.md` (nueva sección 0 al inicio)

### 2. Análisis de Datos Curriculares
Se inspeccionaron los 11 archivos Excel en `BASES DE DATOS/` con los siguientes hallazgos:

| Dato | Valor |
|------|-------|
| Archivo master | `planes_consolidados_master.xlsx` |
| Hojas | "Planes Consolidados" + "Resumen y Métricas" |
| Total de OAs | **1,522** |
| Asignaturas | **11** |
| Ejes curriculares | **~150** (con inconsistencias de casing) |
| Niveles cognitivos (Bloom) | **6**: Recordar, Comprender, Aplicar, Analizar, Evaluar, Crear |
| Columnas | Curso, Asignatura, Eje Curricular, Nº de OA, Descripción del OA, Nivel Cognitivo (Bloom), Indicadores de Evaluación |

**Problema detectado:** Hay ejes curriculares duplicados por diferencias de casing (ej. `ESCRITURA` vs `Escritura`, `Vida activa y saludable` vs `VIDA ACTIVA Y SALUDABLE`). Se resuelve con normalización automática en la migración.

### 3. Diagnóstico del Entorno
Se verificó el estado de las herramientas necesarias:

| Herramienta | Estado |
|-------------|--------|
| Node.js | ✅ v22.21.0 |
| npm/npx | ✅ v10.9.4 |
| Python | ✅ Disponible (con pandas) |
| PostgreSQL | ❌ **No instalado** |
| Docker | ❌ **No instalado** |
| Paquetes npm (22) | ✅ Instalados en `node_modules/` |

### 4. Diseño del Plan de Implementación
Se creó el plan completo para la Fase 1, documentado a continuación.

---

## Plan de Implementación — Fase 1: Fundación del Proyecto

### Paso 1: Instalar PostgreSQL en Windows
- Descargar el instalador oficial desde [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
- Instalar con opciones por defecto (puerto `5432`, incluir pgAdmin)
- Crear base de datos `edutech_db` con usuario `edutech_admin`

> ⚠️ **Acción manual requerida**: El usuario debe descargar e instalar PostgreSQL antes de continuar.

### Paso 2: Inicializar Next.js
Comando planificado:
```bash
npx -y create-next-app@latest ./ --typescript --app --src-dir --use-npm --eslint --yes --empty
```

Flags clave:
- `--typescript` — TypeScript (ya teníamos @types)
- `--app` — App Router moderno con Server Components
- `--src-dir` — Código en `src/` separado de datos
- `--empty` — Sin boilerplate
- **Sin `--tailwind`** — Cumple regla Zero-Tailwind

> ⚠️ Esto regenera `package.json`. Después se reinstalan las 22 dependencias existentes.

### Paso 3: Estructura de Carpetas Propuesta

```
app-edutech/
├── BASES DE DATOS/              # Excel curriculares (preservado)
├── FUENTES/                     # Docs de arquitectura (preservado)
├── memoria/                     # Informes de sesión (preservado)
├── prisma/
│   ├── schema.prisma            # [NEW] Modelo de BD
│   └── seed.ts                  # [NEW] Script de migración Excel → PostgreSQL
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Layout raíz con tipografía premium
│   │   ├── page.tsx             # Landing/Dashboard principal
│   │   ├── globals.css          # Design system Zero-Tailwind
│   │   └── api/                 # API Routes (futuro)
│   ├── components/              # Componentes reutilizables
│   ├── lib/
│   │   ├── prisma.ts            # Singleton del cliente Prisma
│   │   └── bloom.ts             # Constantes y tipos de taxonomía Bloom
│   └── types/
│       └── curriculum.ts        # Tipos TypeScript del currículo
├── scripts/
│   └── migrate-excel.ts         # Script de migración Excel → BD
├── reglas.md
├── .env                         # DATABASE_URL
└── tsconfig.json
```

### Paso 4: Modelo de Base de Datos (Prisma)

Diseño normalizado:

```
Asignatura (11)
  └── EjeCurricular (~150, normalizado)
        └── ObjetivoAprendizaje (1,522)
              ├── NivelEducativo (1° Básico → IV Medio)
              ├── NivelBloom (enum: 6 valores)
              ├── Código ("OA 1", "OA 12", etc.)
              ├── Descripción
              └── Indicadores de Evaluación
```

Modelos adicionales (stubs para Fase 2):
- `Rubrica` → vinculada a OA
- `Evaluacion` → vinculada a OA
- `Guia` → vinculada a OA

Enum `NivelBloom`: `RECORDAR | COMPRENDER | APLICAR | ANALIZAR | EVALUAR | CREAR`

### Paso 5: Migración de Datos (Excel → PostgreSQL)
1. Lee `planes_consolidados_master.xlsx` (hoja "Planes Consolidados")
2. Extrae cursos únicos → crea `NivelEducativo` con orden correcto
3. Extrae asignaturas únicas → crea `Asignatura`
4. Extrae ejes por asignatura → crea `EjeCurricular` (normalizando nombre)
5. Crea los 1,522 `ObjetivoAprendizaje` con todas las relaciones
6. Muestra resumen de migración

### Paso 6: Design System Inicial (Zero-Tailwind)
- Variables CSS con la paleta tetrádica: `#0000B1`, `#0033FF`, `#FF00B2`, `#FFCC00`, `#00FF4D`
- Google Fonts (Inter/Outfit)
- Dashboard landing con estadísticas del currículo
- Cards con glassmorphism mostrando los 9 módulos
- Micro-animaciones de entrada

### Verificación Planificada
```bash
npm run build              # Next.js compila
npx prisma generate        # Cliente Prisma generado
npx prisma migrate dev     # Migración de BD
npx prisma db seed         # Seed de datos (1,522 OAs)
npx prisma studio          # GUI para verificar datos
npm run dev                # Dashboard en el navegador
```

---

## Preguntas Pendientes para la Próxima Sesión

| # | Pregunta | Opciones |
|---|----------|----------|
| 1 | ¿Instalar PostgreSQL nativo o Docker Desktop? | Nativo (recomendado) / Docker |
| 2 | ¿Puerto estándar 5432? | Sí / Otro |
| 3 | ¿Nombre de BD `edutech_db` con usuario `edutech_admin`? | Sí / Otro |
| 4 | ¿Apruebas la normalización automática de ejes curriculares? | Sí / No |

---

## Próximos Pasos (siguiente sesión)

1. ✅ ~~Crear regla de memoria~~ (completado)
2. ✅ ~~Analizar datos curriculares~~ (completado)
3. ✅ ~~Diseñar plan de implementación~~ (completado)
4. ⬜ **Obtener aprobación del plan** ← AQUÍ QUEDAMOS
5. ⬜ Instalar PostgreSQL
6. ⬜ Inicializar Next.js
7. ⬜ Crear modelo Prisma y migrar BD
8. ⬜ Ejecutar seed con los 1,522 OAs
9. ⬜ Crear design system y dashboard inicial

---

## Archivos de la Sesión

| Archivo | Acción |
|---------|--------|
| `reglas.md` | Modificado (Regla 0 agregada) |
| `memoria/informe_sesion_2026-05-22.md` | Creado (este archivo) |
| `scratch_inspect.py` | Creado (script temporal de inspección, se puede eliminar) |
