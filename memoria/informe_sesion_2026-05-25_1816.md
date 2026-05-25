# Informe — Sesión 25 de Mayo 2026

## Resumen Ejecutivo
Se realizó una refactorización mayor del **Constructor de Rúbricas** de la plataforma EduTech, transformando la interfaz de un formulario con scroll vertical a una experiencia premium basada en pestañas exclusivas, con lógica inteligente de invalidación y cierre de ciclo post-descarga.

---

## 1. Navegación por Pestañas Exclusivas

**Archivos modificados:** `src/app/rubricas/components/RubricForm.tsx`

### Problema
El formulario mostraba los 3 pasos apilados verticalmente, obligando al usuario a hacer scroll. Esto desperdiciaba espacio, especialmente en el Paso 3 donde la tabla de la rúbrica necesita el máximo espacio posible.

### Solución
- Implementamos 3 pestañas mutuamente exclusivas: **Contexto Curricular**, **Ruta Metodológica** y **Revisión y Descarga**.
- Solo se renderiza el contenido de la pestaña activa (`currentStep`).
- Las pestañas se desbloquean progresivamente (`maxStepReached`).

### Diseño Visual de las Pestañas
- **Activa (Paso 1):** Azul (`--accent-primary`) 
- **Activa (Paso 2):** Magenta (`--accent-secondary`) 
- **Activa (Paso 3):** Verde (`--accent-quaternary`) 
- **Completada:** Verde Esmeralda (`#00FF88`) con ✓
- **Bloqueada:** Gris 30% opacidad

---

## 2. Lógica de Invalidación Inteligente

### Problema
Si el usuario regresaba al Paso 1 y cambiaba la asignatura, la rúbrica del Paso 3 quedaba desactualizada con datos incoherentes.

### Solución
Se implementaron interceptores (`handleNivelChange`, `handleAsignaturaChange`, `handleEjeChange`, `handleOAChange`) que:
1. Detectan si el valor realmente cambió (evitan resets innecesarios).
2. Borran `editableRubric` (la rúbrica generada).
3. Resetean `maxStepReached` a 1 o 2 según corresponda.
4. Bloquean el acceso a pestañas posteriores.

---

## 3. Modal Post-Descarga (Cierre de Ciclo)

**Archivos modificados:** `RubricForm.tsx`, `RubricDownload.tsx`

### Problema
Tras descargar la rúbrica, el usuario quedaba "abandonado" en la pantalla.

### Solución
- Se añadió un callback `onComplete` a `RubricDownload` que se ejecuta 1.5 segundos después de cada descarga.
- En `RubricForm`, ese callback activa un **Modal Glassmorphism** centrado con:
  - Botón **"Crear Nueva Rúbrica"** → Reset total al Paso 1
  - Botón **"Volver al Inicio"** → `router.push('/')`

---

## 4. Cabeceras Dinámicas en Documentos Descargables

**Archivos modificados:** `RubricDownload.tsx`

### Problema
Los PDFs, Word y Excel siempre mostraban solo el código del OA genérico, sin indicar la ruta metodológica que generó la rúbrica.

### Solución
Se añadieron props al componente (`selectedMode`, `actividadNivel`, `actividadTexto`, `indicadoresSeleccionados`).
La cabecera del documento ahora muestra dinámicamente el contexto metodológico.

**Ruta por Actividad:** Muestra el Nivel Cognitivo y la descripción de la actividad.
**Ruta por Indicadores:** Muestra una lista numerada con los indicadores específicos seleccionados.
Y además, se restauró la visualización de la descripción completa del Objetivo de Aprendizaje.

---

## 5. Correcciones de UX

- **Menús desplegables (`CustomSelect`) cortados:** Cambió `overflow: hidden` a `overflow: visible` en el panel contenedor.
- **Cursor de texto (barra vertical) en tarjetas:** Inyección de `cursor: pointer` + `userSelect: none` inline.
- **Celdas editables:** Tag `<style dangerouslySetInnerHTML>` global con fondo oscuro transparente, texto blanco, bordes sutiles, `min-height: 140px` y `font-size: 11.5px` para evadir el aislamiento de CSS de Next.js.
- **Bug de tipos string/number en CustomSelect:** Forzar `String(opt.value)` en todos los onChange.
