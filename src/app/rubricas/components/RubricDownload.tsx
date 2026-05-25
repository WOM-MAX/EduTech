"use client"

import type { RubricType } from "@/types/rubricas"

interface RubricDownloadProps {
  rubrica: RubricType
  oaNombre: string
  oaTextoCompleto?: string
  ejeNombre?: string
  nivelNombre: string
  asignaturaNombre: string
  selectedMode?: "actividad" | "indicadores" | null
  actividadNivel?: string
  actividadTexto?: string
  indicadoresSeleccionados?: string[]
  onComplete?: () => void
}

export default function RubricDownload({ rubrica, oaNombre, oaTextoCompleto, ejeNombre, nivelNombre, asignaturaNombre, selectedMode, actividadNivel, actividadTexto, indicadoresSeleccionados, onComplete }: RubricDownloadProps) {
  const filename = `Rubrica_${asignaturaNombre}_${oaNombre}`.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_]/g, '_').substring(0, 60)
  const titulo = `Rúbrica: ${oaNombre}`
  const subtitulo = `${nivelNombre} — ${asignaturaNombre}`
  const ejeText = ejeNombre ? `Eje Curricular: ${ejeNombre}` : ''

  // Construir texto de contexto metodológico según la ruta elegida
  const buildMetodologiaLabel = (): string => {
    if (selectedMode === 'actividad' && actividadNivel) {
      return `Actividad Sugerida (Nivel Cognitivo: ${actividadNivel.charAt(0).toUpperCase() + actividadNivel.slice(1)})`
    }
    if (selectedMode === 'indicadores' && indicadoresSeleccionados && indicadoresSeleccionados.length > 0) {
      return 'Basado en los siguientes indicadores de evaluación:'
    }
    return ''
  }

  const buildMetodologiaDetalle = (): string => {
    if (selectedMode === 'actividad' && actividadTexto) {
      return actividadTexto
    }
    if (selectedMode === 'indicadores' && indicadoresSeleccionados && indicadoresSeleccionados.length > 0) {
      return indicadoresSeleccionados.map((ind, i) => `  ${i + 1}. ${ind}`).join('\n')
    }
    return ''
  }

  const metodologiaLabel = buildMetodologiaLabel()
  const metodologiaDetalle = buildMetodologiaDetalle()

  const downloadPDF = async () => {
    try {
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })

      // Header
      doc.setFontSize(16)
      doc.setTextColor(30, 58, 138)
      doc.text(titulo, 14, 20)
      doc.setFontSize(11)
      doc.setTextColor(100, 100, 100)
      doc.text(subtitulo, 14, 28)

      let startY = 34

      if (ejeText) {
        doc.setFontSize(10)
        doc.setTextColor(80, 80, 80)
        doc.text(ejeText, 14, startY)
        startY += 6
      }

      // Descripción del OA
      if (oaTextoCompleto) {
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        const splitOaText = doc.splitTextToSize(oaTextoCompleto, doc.internal.pageSize.width - 28)
        doc.text(splitOaText, 14, startY)
        startY += (splitOaText.length * 4) + 4
      }

      // Contexto Metodológico
      if (metodologiaLabel) {
        doc.setFontSize(10)
        doc.setTextColor(30, 58, 138)
        doc.setFont('helvetica', 'bold')
        doc.text(metodologiaLabel, 14, startY)
        startY += 6
        doc.setFont('helvetica', 'normal')

        if (metodologiaDetalle) {
          doc.setFontSize(9)
          doc.setTextColor(60, 60, 60)
          const splitDetalle = doc.splitTextToSize(metodologiaDetalle, doc.internal.pageSize.width - 28)
          doc.text(splitDetalle, 14, startY)
          startY += (splitDetalle.length * 4) + 4
        }
      }

      // Línea separadora visual
      startY += 2
      doc.setDrawColor(200, 210, 230)
      doc.setLineWidth(0.3)
      doc.line(14, startY, doc.internal.pageSize.width - 14, startY)
      startY += 6

      // Table
      const headers = [['Criterio', 'Destacado', 'Adecuado', 'Básico', 'Insuficiente']]
      const body = rubrica.criterios.map(c => [c.nombre, c.destacado, c.adecuado, c.basico, c.insuficiente])

      autoTable(doc, {
        head: headers,
        body: body,
        startY: startY,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 4,
          valign: 'top',
          lineWidth: 0.3
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 'auto' },
          4: { cellWidth: 'auto' }
        },
        alternateRowStyles: { fillColor: [240, 245, 255] },
        margin: { left: 14, right: 14 }
      })

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages ? (doc as any).internal.getNumberOfPages() : doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text('Generado por EduTech — Plataforma de Inteligencia Pedagógica DUA', 14, doc.internal.pageSize.height - 10)
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10)
      }

      doc.save(`${filename}.pdf`)
      if (onComplete) {
        setTimeout(onComplete, 1500)
      }
    } catch (error) {
      console.error("Error al generar PDF:", error)
      alert("Hubo un error al generar el PDF. Puedes descargar la versión en Word o Excel.")
    }
  }

  const downloadExcel = async () => {
    const XLSX = await import('xlsx')

    const data: any[] = []
    
    // Add header rows to Excel
    data.push({ 'Criterio': titulo })
    data.push({ 'Criterio': subtitulo })
    if (ejeText) data.push({ 'Criterio': ejeText })
    
    // Descripción del OA
    if (oaTextoCompleto) {
      data.push({ 'Criterio': oaTextoCompleto })
    }

    // Contexto Metodológico
    if (metodologiaLabel) {
      data.push({ 'Criterio': '' }) // Spacer
      data.push({ 'Criterio': metodologiaLabel })
      if (selectedMode === 'actividad' && actividadTexto) {
        data.push({ 'Criterio': actividadTexto })
      }
      if (selectedMode === 'indicadores' && indicadoresSeleccionados) {
        indicadoresSeleccionados.forEach((ind, i) => {
          data.push({ 'Criterio': `  ${i + 1}. ${ind}` })
        })
      }
    }

    data.push({}) // Empty row separator
    
    // Header names
    data.push({
      'Criterio': 'Criterio',
      'Destacado': 'Destacado',
      'Adecuado': 'Adecuado',
      'Básico': 'Básico',
      'Insuficiente': 'Insuficiente'
    })

    rubrica.criterios.forEach(c => {
      data.push({
        'Criterio': c.nombre,
        'Destacado': c.destacado,
        'Adecuado': c.adecuado,
        'Básico': c.basico,
        'Insuficiente': c.insuficiente
      })
    })

    const ws = XLSX.utils.json_to_sheet(data, { skipHeader: true })

    // Column widths
    ws['!cols'] = [
      { wch: 25 },
      { wch: 40 },
      { wch: 40 },
      { wch: 40 },
      { wch: 40 }
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Rúbrica')
    XLSX.writeFile(wb, `${filename}.xlsx`)
    if (onComplete) {
      setTimeout(onComplete, 1500)
    }
  }

  const downloadWord = async () => {
    const docx = await import('docx')
    const { saveAs } = await import('file-saver')

    const headerRow = new docx.TableRow({
      tableHeader: true,
      children: ['Criterio', 'Destacado', 'Adecuado', 'Básico', 'Insuficiente'].map(text =>
        new docx.TableCell({
          shading: { fill: '1e3a8a', type: docx.ShadingType.SOLID },
          children: [new docx.Paragraph({
            children: [new docx.TextRun({ text, bold: true, color: 'ffffff', size: 20, font: 'Calibri' })],
            alignment: docx.AlignmentType.CENTER
          })],
          verticalAlign: docx.VerticalAlign.CENTER,
          width: { size: text === 'Criterio' ? 2000 : 2000, type: docx.WidthType.DXA }
        })
      )
    })

    const dataRows = rubrica.criterios.map((c, i) =>
      new docx.TableRow({
        children: [c.nombre, c.destacado, c.adecuado, c.basico, c.insuficiente].map((text, j) =>
          new docx.TableCell({
            shading: i % 2 === 1 ? { fill: 'f0f5ff', type: docx.ShadingType.SOLID } : undefined,
            children: [new docx.Paragraph({
              children: [new docx.TextRun({
                text,
                bold: j === 0,
                size: 18,
                font: 'Calibri'
              })]
            })],
            verticalAlign: docx.VerticalAlign.TOP
          })
        )
      })
    )

    // Construir los children del documento Word dinámicamente
    const docChildren: any[] = [
      new docx.Paragraph({
        children: [new docx.TextRun({ text: titulo, bold: true, size: 32, color: '1e3a8a', font: 'Calibri' })],
        spacing: { after: 100 }
      }),
      new docx.Paragraph({
        children: [new docx.TextRun({ text: subtitulo, size: 22, color: '666666', font: 'Calibri' })],
        spacing: { after: ejeText ? 100 : 200 }
      }),
    ]

    if (ejeText) {
      docChildren.push(new docx.Paragraph({
        children: [new docx.TextRun({ text: ejeText, size: 20, color: '444444', font: 'Calibri', bold: true })],
        spacing: { after: 100 }
      }))
    }

    // Descripción del OA
    if (oaTextoCompleto) {
      docChildren.push(new docx.Paragraph({
        children: [new docx.TextRun({ text: oaTextoCompleto, size: 18, color: '666666', font: 'Calibri' })],
        spacing: { after: 150 }
      }))
    }

    // Contexto Metodológico en Word
    if (metodologiaLabel) {
      docChildren.push(new docx.Paragraph({
        children: [new docx.TextRun({ text: metodologiaLabel, size: 20, color: '1e3a8a', font: 'Calibri', bold: true })],
        spacing: { before: 100, after: 80 }
      }))

      if (selectedMode === 'actividad' && actividadTexto) {
        docChildren.push(new docx.Paragraph({
          children: [new docx.TextRun({ text: actividadTexto, size: 18, color: '333333', font: 'Calibri', italics: true })],
          spacing: { after: 200 }
        }))
      }

      if (selectedMode === 'indicadores' && indicadoresSeleccionados) {
        indicadoresSeleccionados.forEach(ind => {
          docChildren.push(new docx.Paragraph({
            children: [new docx.TextRun({ text: ind, size: 18, color: '333333', font: 'Calibri' })],
            bullet: { level: 0 },
            spacing: { after: 40 }
          }))
        })
        // Espacio después de la lista
        docChildren.push(new docx.Paragraph({ children: [], spacing: { after: 150 } }))
      }
    }

    // Tabla y footer
    docChildren.push(
      new docx.Table({
        rows: [headerRow, ...dataRows],
        width: { size: 100, type: docx.WidthType.PERCENTAGE }
      }),
      new docx.Paragraph({
        children: [new docx.TextRun({ text: '\nGenerado por EduTech — Plataforma de Inteligencia Pedagógica DUA', size: 16, color: '999999', font: 'Calibri' })],
        spacing: { before: 400 }
      })
    )

    const doc = new docx.Document({
      sections: [{
        properties: {
          page: {
            size: { orientation: docx.PageOrientation.LANDSCAPE }
          }
        },
        children: docChildren
      }]
    })

    const blob = await docx.Packer.toBlob(doc)
    saveAs(blob, `${filename}.docx`)
    if (onComplete) {
      setTimeout(onComplete, 1500)
    }
  }

  const btnStyle = (color: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: `rgba(${color}, 0.15)`,
    border: `1px solid rgba(${color}, 0.4)`,
    borderRadius: '10px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.2s',
    fontFamily: 'inherit'
  })

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '20px' }}>
      <button
        onClick={downloadPDF}
        style={btnStyle('220, 50, 50')}
        onMouseOver={e => { e.currentTarget.style.background = 'rgba(220, 50, 50, 0.3)' }}
        onMouseOut={e => { e.currentTarget.style.background = 'rgba(220, 50, 50, 0.15)' }}
      >
        📄 Descargar PDF
      </button>
      <button
        onClick={downloadExcel}
        style={btnStyle('34, 139, 34')}
        onMouseOver={e => { e.currentTarget.style.background = 'rgba(34, 139, 34, 0.3)' }}
        onMouseOut={e => { e.currentTarget.style.background = 'rgba(34, 139, 34, 0.15)' }}
      >
        📊 Descargar Excel
      </button>
      <button
        onClick={downloadWord}
        style={btnStyle('50, 100, 220')}
        onMouseOver={e => { e.currentTarget.style.background = 'rgba(50, 100, 220, 0.3)' }}
        onMouseOut={e => { e.currentTarget.style.background = 'rgba(50, 100, 220, 0.15)' }}
      >
        📝 Descargar Word
      </button>
    </div>
  )
}
