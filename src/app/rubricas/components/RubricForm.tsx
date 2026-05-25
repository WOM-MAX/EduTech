"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getNivelesEducativos, getAsignaturas, getEjes, getOAs, obtenerRubricaIndicadores, obtenerRubricaActividad } from "@/actions/rubricas"
import type { RubricType } from "@/types/rubricas"
import RubricDownload from "./RubricDownload"

// Custom Select Component for Premium Look
function CustomSelect({ value, options, onChange, placeholder }: { value: string, options: {value: string, label: string}[], onChange: (val: string) => void, placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(o => o.value.toString() === value.toString())

  return (
    <div className="custom-select-container" style={{ position: 'relative', width: '100%' }}>
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '14px 20px',
          background: 'rgba(0, 0, 0, 0.3)',
          border: `1px solid ${isOpen ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.15)'}`,
          borderRadius: '12px',
          color: selectedOption ? 'white' : 'rgba(255,255,255,0.5)',
          fontFamily: "'Outfit', sans-serif",
          fontSize: '15px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: isOpen ? '0 0 0 3px rgba(0, 51, 255, 0.2)' : 'inset 0 2px 4px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '8px',
          background: 'rgba(0, 0, 100, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          zIndex: 50,
          maxHeight: '300px',
          overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
        }} className="custom-scrollbar">
          <div 
            onClick={() => { onChange(""); setIsOpen(false) }}
            style={{ padding: '12px 20px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            {placeholder}
          </div>
          {options.map((opt, idx) => (
            <div 
              key={idx}
              onClick={() => { onChange(String(opt.value)); setIsOpen(false) }}
              className="custom-select-option"
              style={{
                padding: '12px 20px',
                cursor: 'pointer',
                color: 'white',
                fontSize: '14px',
                transition: 'background 0.2s',
                background: String(value) === String(opt.value) ? 'rgba(0, 51, 255, 0.3)' : 'transparent',
                borderLeft: String(value) === String(opt.value) ? '4px solid var(--accent-primary)' : '4px solid transparent'
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RubricForm() {
  const router = useRouter()
  
  const [niveles, setNiveles] = useState<any[]>([])
  const [asignaturas, setAsignaturas] = useState<any[]>([])
  const [ejes, setEjes] = useState<any[]>([])
  const [oas, setOAs] = useState<any[]>([])

  const [selectedNivel, setSelectedNivel] = useState("")
  const [selectedAsignatura, setSelectedAsignatura] = useState("")
  const [selectedEje, setSelectedEje] = useState("")
  const [selectedOA, setSelectedOA] = useState("")

  // Navegación por pestañas (Tabs)
  const [currentStep, setCurrentStep] = useState(1) // Pestaña activa: 1, 2 o 3
  const [maxStepReached, setMaxStepReached] = useState(1) // Hasta dónde ha desbloqueado

  // Modos y flujos
  const [selectedMode, setSelectedMode] = useState<"actividad" | "indicadores" | null>(null)

  // Estado ruta Indicadores
  const [selectedIndicadores, setSelectedIndicadores] = useState<string[]>([])
  
  // Estado ruta Actividad
  const [selectedNivelBloom, setSelectedNivelBloom] = useState<string>("")

  const [loading, setLoading] = useState(false)
  const [editableRubric, setEditableRubric] = useState<RubricType | null>(null)
  const [error, setError] = useState("")

  // Modal Post-Descarga
  const [showDownloadModal, setShowDownloadModal] = useState(false)

  const oaActivo = oas.find(oa => oa.id.toString() === selectedOA)
  const indicadoresList = oaActivo?.indicadores 
    ? oaActivo.indicadores.split('\n').filter((i: string) => i.trim().length > 0)
    : []

  useEffect(() => {
    getNivelesEducativos().then(setNiveles)
    getAsignaturas().then(setAsignaturas)
  }, [])

  // Invalidación Nivel/Asignatura
  const handleNivelChange = (val: string) => {
    if (val !== selectedNivel) {
      setSelectedNivel(val)
      setEditableRubric(null)
      setMaxStepReached(1)
      setCurrentStep(1)
    }
  }

  const handleAsignaturaChange = (val: string) => {
    if (val !== selectedAsignatura) {
      setSelectedAsignatura(val)
      setEditableRubric(null)
      setMaxStepReached(1)
      setCurrentStep(1)
    }
  }

  useEffect(() => {
    if (selectedNivel && selectedAsignatura) {
      getEjes(Number(selectedNivel), Number(selectedAsignatura)).then(setEjes)
      setSelectedEje("")
      setSelectedOA("")
      resetSelection()
      setOAs([])
    } else {
      setEjes([])
      setOAs([])
    }
  }, [selectedNivel, selectedAsignatura])

  // Invalidación Eje
  const handleEjeChange = (val: string) => {
    if (val !== selectedEje) {
      setSelectedEje(val)
      setEditableRubric(null)
      setMaxStepReached(1)
      setCurrentStep(1)
    }
  }

  useEffect(() => {
    if (selectedNivel && selectedAsignatura && selectedEje) {
      getOAs(Number(selectedNivel), Number(selectedAsignatura), Number(selectedEje)).then(setOAs)
      setSelectedOA("")
      resetSelection()
    } else {
      setOAs([])
    }
  }, [selectedNivel, selectedAsignatura, selectedEje])

  // Invalidación OA
  const handleOAChange = (val: string) => {
    if (val !== selectedOA) {
      setSelectedOA(val)
      resetSelection()
      setEditableRubric(null)
      if (val) {
        setMaxStepReached(2)
        setCurrentStep(2)
      } else {
        setMaxStepReached(1)
        setCurrentStep(1)
      }
    }
  }

  const resetSelection = () => {
    setSelectedMode(null)
    setSelectedIndicadores([])
    setSelectedNivelBloom("")
    setError("")
  }

  const handleModeChange = (mode: "actividad" | "indicadores") => {
    if (selectedMode !== mode) {
      setSelectedMode(mode)
      setSelectedIndicadores([])
      setSelectedNivelBloom("")
      setEditableRubric(null) // Borra rúbrica si cambia de modo
      setMaxStepReached(2) // Bloquea pestaña 3
    }
  }

  const toggleIndicador = (indicador: string) => {
    setEditableRubric(null) // Invalida la rúbrica anterior si edita indicadores
    setMaxStepReached(2)
    setSelectedIndicadores(prev => 
      prev.includes(indicador)
        ? prev.filter(i => i !== indicador)
        : [...prev, indicador]
    )
  }

  const handleGenerate = async () => {
    if (!selectedOA || !selectedMode) return
    setLoading(true)
    setError("")
    setEditableRubric(null)

    let result: RubricType | { error: string }

    if (selectedMode === "indicadores") {
      if (selectedIndicadores.length < 3 || selectedIndicadores.length > 6) {
        setError("Recomendación pedagógica: Seleccione entre 3 y 6 indicadores.")
        setLoading(false)
        return
      }
      const selectedIndexes = selectedIndicadores
        .map(ind => indicadoresList.indexOf(ind))
        .filter(idx => idx !== -1)
      result = await obtenerRubricaIndicadores(Number(selectedOA), selectedIndexes)
    } else {
      if (!selectedNivelBloom) {
        setError("Debe seleccionar una actividad.")
        setLoading(false)
        return
      }
      result = await obtenerRubricaActividad(Number(selectedOA), selectedNivelBloom)
    }
    
    if ('error' in result) {
      setError(result.error)
      setLoading(false)
      return
    }

    setEditableRubric(JSON.parse(JSON.stringify(result)))
    setMaxStepReached(3)
    setCurrentStep(3)
    setLoading(false)
  }

  const handleCellChange = (index: number, field: string, value: string) => {
    if (!editableRubric) return
    const newCriterios = [...editableRubric.criterios]
    newCriterios[index] = { ...newCriterios[index], [field]: value }
    setEditableRubric({ criterios: newCriterios })
  }

  const handleRemoveCriterion = (index: number) => {
    if (!editableRubric) return
    const newCriterios = editableRubric.criterios.filter((_, i) => i !== index)
    setEditableRubric({ criterios: newCriterios })
  }

  const handleAddCriterion = () => {
    if (!editableRubric) return
    const newCriterios = [...editableRubric.criterios, {
      nombre: "Nuevo Criterio (Escribe aquí)",
      destacado: "Describe el nivel destacado...",
      adecuado: "Describe el nivel adecuado...",
      basico: "Describe el nivel básico...",
      insuficiente: "Describe el nivel insuficiente..."
    }]
    setEditableRubric({ criterios: newCriterios })
  }

  const startNewRubric = () => {
    setSelectedNivel("")
    setSelectedAsignatura("")
    setSelectedEje("")
    setSelectedOA("")
    resetSelection()
    setEditableRubric(null)
    setCurrentStep(1)
    setMaxStepReached(1)
    setShowDownloadModal(false)
  }

  const renderStep1 = () => (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderRadius: '16px', color: 'rgba(255,255,255,0.8)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--accent-primary)', marginBottom: '8px' }}>Contexto Curricular</h3>
        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
          Seleccione el Objetivo de Aprendizaje (OA) que desea evaluar. 
          <br/><span style={{opacity: 0.7, fontSize: '12px'}}>*Cambiar estos valores reiniciará el progreso.</span>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ zIndex: 40 }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Nivel Educativo</label>
          <CustomSelect 
            value={selectedNivel} 
            onChange={handleNivelChange} 
            options={niveles.map(n => ({ value: n.id, label: n.nombre }))} 
            placeholder="Seleccione Nivel..." 
          />
        </div>
        <div style={{ zIndex: 39 }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Asignatura</label>
          <CustomSelect 
            value={selectedAsignatura} 
            onChange={handleAsignaturaChange} 
            options={asignaturas.map(a => ({ value: a.id, label: a.nombre }))} 
            placeholder="Seleccione Asignatura..." 
          />
        </div>
      </div>

      {ejes.length > 0 && (
        <div style={{ zIndex: 38 }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Eje Curricular</label>
          <CustomSelect 
            value={selectedEje} 
            onChange={handleEjeChange} 
            options={ejes.map(e => ({ value: e.id, label: e.nombre }))} 
            placeholder="Seleccione Eje..." 
          />
        </div>
      )}

      {oas.length > 0 && (
        <div style={{ zIndex: 37 }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Objetivo de Aprendizaje (OA)</label>
          <CustomSelect 
            value={selectedOA} 
            onChange={handleOAChange} 
            options={oas.map(oa => ({ value: oa.id, label: `${oa.codigo}: ${oa.descripcion.substring(0, 80)}...` }))} 
            placeholder="Seleccione OA..." 
          />
        </div>
      )}

      {selectedOA && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px' }}>
          <button 
            className="btn-primary" 
            onClick={() => setCurrentStep(2)}
            style={{ width: '100%', maxWidth: '300px' }}
          >
            Siguiente: Ruta Metodológica →
          </button>
        </div>
      )}
    </div>
  )

  const renderStep2 = () => {
    if (!oaActivo) return null;

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
          ¿Cómo desea evaluar el objetivo <strong>{oaActivo.codigo}</strong>? Elija una ruta pedagógica para construir su instrumento.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Ruta Actividad */}
          <div 
            className="route-card"
            style={{ 
              borderColor: selectedMode === 'actividad' ? 'var(--accent-secondary)' : 'rgba(255,255,255,0.1)', 
              background: selectedMode === 'actividad' ? 'rgba(255, 0, 178, 0.05)' : 'rgba(0,0,0,0.2)',
              cursor: 'pointer', userSelect: 'none'
            }}
            onClick={() => handleModeChange('actividad')}
          >
            <h4 style={{ fontWeight: 'bold', color: 'white', marginBottom: '8px', fontSize: '16px', cursor: 'pointer', userSelect: 'none' }}>💡 Ruta por Actividad Sugerida</h4>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px', lineHeight: '1.5', cursor: 'pointer', userSelect: 'none' }}>
              Evalúa el desempeño integral del estudiante en una tarea auténtica propuesta por el Mineduc.
            </p>
            
            {selectedMode === 'actividad' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                {oaActivo.sugerenciasActividades && Object.keys(oaActivo.sugerenciasActividades).length > 0 ? (
                  Object.entries(oaActivo.sugerenciasActividades as any).map(([nivel, actividad]) => (
                    <div 
                      key={nivel}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditableRubric(null);
                        setMaxStepReached(2);
                        setSelectedNivelBloom(nivel);
                      }}
                      className="activity-item"
                      style={{ 
                        borderColor: selectedNivelBloom === nivel ? 'var(--accent-secondary)' : 'rgba(255,255,255,0.1)',
                        background: selectedNivelBloom === nivel ? 'rgba(255, 0, 178, 0.1)' : 'transparent',
                        color: selectedNivelBloom === nivel ? 'white' : 'rgba(255,255,255,0.7)',
                        cursor: 'pointer', userSelect: 'none'
                      }}
                    >
                      <strong style={{ display: 'block', textTransform: 'capitalize', marginBottom: '4px', color: 'var(--accent-secondary)', fontSize: '13px', cursor: 'pointer', userSelect: 'none' }}>{nivel}</strong>
                      <span style={{ fontSize: '13px', lineHeight: '1.4', cursor: 'pointer', userSelect: 'none' }}>{String(actividad)}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '13px', color: '#ff4444', fontStyle: 'italic' }}>No hay actividades sugeridas para este OA.</p>
                )}
              </div>
            )}
          </div>

          {/* Ruta Indicadores */}
          <div 
            className="route-card"
            style={{ 
              borderColor: selectedMode === 'indicadores' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', 
              background: selectedMode === 'indicadores' ? 'rgba(0, 51, 255, 0.05)' : 'rgba(0,0,0,0.2)',
              cursor: 'pointer', userSelect: 'none'
            }}
            onClick={() => handleModeChange('indicadores')}
          >
            <h4 style={{ fontWeight: 'bold', color: 'white', marginBottom: '8px', fontSize: '16px', cursor: 'pointer', userSelect: 'none' }}>🎯 Ruta por Indicadores (Recomendado)</h4>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px', lineHeight: '1.5', cursor: 'pointer', userSelect: 'none' }}>
              Construye una rúbrica a medida seleccionando qué conductas específicas evaluarás.
            </p>
            
            {selectedMode === 'indicadores' && (
              <div className="animate-fade-in" style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                <div style={{ background: 'rgba(0, 51, 255, 0.1)', padding: '12px', borderRadius: '8px', borderLeft: '4px solid var(--accent-primary)', fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>
                  Seleccione entre <strong>3 y 6 indicadores</strong> para garantizar una evaluación integral.
                </div>
                <div className="custom-scrollbar" style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '8px' }}>
                  {indicadoresList.map((indicador: string, idx: number) => (
                    <label key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', userSelect: 'none', fontSize: '13px', color: 'rgba(255,255,255,0.8)', padding: '8px', borderRadius: '4px', transition: 'background 0.2s' }} className="indicador-label">
                      <input 
                        type="checkbox" 
                        checked={selectedIndicadores.includes(indicador)}
                        onChange={() => toggleIndicador(indicador)}
                        style={{ marginTop: '2px', accentColor: 'var(--accent-primary)', width: '16px', height: '16px', flexShrink: 0, cursor: 'pointer' }}
                      />
                      <span style={{ lineHeight: '1.4', cursor: 'pointer', userSelect: 'none' }}>{indicador}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedMode && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px' }}>
            {editableRubric ? (
              <button className="btn-primary" onClick={() => setCurrentStep(3)} style={{ width: '100%', maxWidth: '300px' }}>
                Siguiente: Ver Rúbrica →
              </button>
            ) : (
              <button className="btn-primary" onClick={handleGenerate} disabled={loading} style={{ opacity: loading ? 0.7 : 1, width: '100%', maxWidth: '300px' }}>
                {loading ? 'Generando Rúbrica...' : 'Siguiente: Crear Rúbrica →'}
              </button>
            )}
          </div>
        )}
        
        {error && <div style={{ padding: '16px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', borderRadius: '12px', color: '#ffaaaa', fontSize: '14px', marginTop: '16px' }}>{error}</div>}
      </div>
    )
  }

  const renderStep3 = () => {
    if (!editableRubric) return null;

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ background: 'rgba(0, 51, 255, 0.1)', border: '1px solid rgba(0, 51, 255, 0.3)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', margin: 0 }}>
            <strong>Rúbrica Generada Exitosamente.</strong> 
            {selectedMode === 'indicadores' 
              ? ` Basada en ${selectedIndicadores.length} indicadores curriculares.`
              : ` Basada en actividad nivel cognitivo: ${selectedNivelBloom}.`}
          </p>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', background: 'rgba(0, 51, 255, 0.2)', padding: '4px 12px', borderRadius: '20px' }}>
            ✏️ Haz clic en los textos para editar directamente
          </span>
        </div>

        <div style={{ overflowX: 'auto', marginBottom: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', padding: '4px' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '16px', color: 'rgba(255,255,255,0.6)', width: '20%', fontWeight: '500' }}>Criterio / Dimensión</th>
                <th style={{ padding: '16px', color: 'var(--accent-primary)', width: '20%', fontWeight: '500' }}>Destacado (Nivel 4)</th>
                <th style={{ padding: '16px', color: 'var(--accent-quaternary)', width: '20%', fontWeight: '500' }}>Adecuado (Nivel 3)</th>
                <th style={{ padding: '16px', color: 'var(--accent-tertiary)', width: '20%', fontWeight: '500' }}>Básico (Nivel 2)</th>
                <th style={{ padding: '16px', color: '#ff4444', width: '20%', fontWeight: '500' }}>Insuficiente (Nivel 1)</th>
              </tr>
            </thead>
            <tbody>
              {editableRubric.criterios.map((c, i) => (
                <tr key={i} className="rubric-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px', position: 'relative' }}>
                    <button 
                      onClick={() => handleRemoveCriterion(i)}
                      title="Eliminar criterio"
                      className="delete-btn"
                      style={{ position: 'absolute', top: '16px', left: '-8px', background: 'none', border: 'none', color: '#ff4444', opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer' }}
                    >🗑️</button>
                    <textarea
                      value={c.nombre}
                      onChange={(e) => handleCellChange(i, 'nombre', e.target.value)}
                      className="editable-cell"
                      style={{ fontWeight: 'bold', color: 'white' }}
                    />
                  </td>
                  <td style={{ padding: '16px' }}>
                    <textarea value={c.destacado} onChange={(e) => handleCellChange(i, 'destacado', e.target.value)} className="editable-cell" />
                  </td>
                  <td style={{ padding: '16px' }}>
                    <textarea value={c.adecuado} onChange={(e) => handleCellChange(i, 'adecuado', e.target.value)} className="editable-cell" />
                  </td>
                  <td style={{ padding: '16px' }}>
                    <textarea value={c.basico} onChange={(e) => handleCellChange(i, 'basico', e.target.value)} className="editable-cell" />
                  </td>
                  <td style={{ padding: '16px' }}>
                    <textarea value={c.insuficiente} onChange={(e) => handleCellChange(i, 'insuficiente', e.target.value)} className="editable-cell" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button 
          onClick={handleAddCriterion}
          style={{ 
            width: '100%', 
            padding: '16px', 
            border: '1px dashed rgba(255,255,255,0.2)', 
            borderRadius: '12px', 
            color: 'rgba(255,255,255,0.6)', 
            background: 'rgba(255,255,255,0.02)', 
            cursor: 'pointer', 
            transition: 'all 0.2s',
            fontSize: '14px',
            fontWeight: '500'
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
        >
          + Agregar Criterio Adicional
        </button>

        <div style={{ marginTop: '16px' }}>
          <h4 style={{ color: 'white', marginBottom: '16px', fontSize: '18px' }}>Descargar Documento</h4>
          <RubricDownload
            rubrica={editableRubric}
            oaNombre={oaActivo?.codigo || ''}
            oaTextoCompleto={oaActivo?.descripcion || ''}
            ejeNombre={ejes.find(e => e.id.toString() === selectedEje)?.nombre || ''}
            nivelNombre={niveles.find(n => n.id.toString() === selectedNivel)?.nombre || ''}
            asignaturaNombre={asignaturas.find(a => a.id.toString() === selectedAsignatura)?.nombre || ''}
            selectedMode={selectedMode}
            actividadNivel={selectedNivelBloom}
            actividadTexto={oaActivo?.sugerenciasActividades?.[selectedNivelBloom] ? String(oaActivo.sugerenciasActividades[selectedNivelBloom]) : undefined}
            indicadoresSeleccionados={selectedIndicadores}
            onComplete={() => setShowDownloadModal(true)}
          />
        </div>
      </div>
    )
  }

  // Estilos dinámicos para las pestañas
  const getTabStyle = (stepNumber: number) => {
    const isActive = currentStep === stepNumber;
    const isCompleted = maxStepReached > stepNumber;
    const isUnlocked = maxStepReached >= stepNumber;
    
    let color = 'rgba(255,255,255,0.3)';
    let bgColor = 'transparent';
    let borderColor = 'transparent';

    if (isActive) {
      if (stepNumber === 1) { color = 'var(--accent-primary)'; borderColor = 'var(--accent-primary)'; bgColor = 'rgba(0, 51, 255, 0.1)'; }
      if (stepNumber === 2) { color = 'var(--accent-secondary)'; borderColor = 'var(--accent-secondary)'; bgColor = 'rgba(255, 0, 178, 0.1)'; }
      if (stepNumber === 3) { color = 'var(--accent-quaternary)'; borderColor = 'var(--accent-quaternary)'; bgColor = 'rgba(0, 255, 77, 0.1)'; }
    } else if (isCompleted) {
      // Pestaña completada: Verde Esmeralda
      color = '#00FF88';
      borderColor = '#00FF88';
      bgColor = 'rgba(0, 255, 136, 0.05)';
    } else if (isUnlocked) {
      color = 'white';
    }

    return {
      padding: '16px 24px',
      cursor: isUnlocked ? 'pointer' : 'not-allowed',
      color: color,
      background: bgColor,
      borderBottom: isActive ? `3px solid ${borderColor}` : isCompleted ? `2px solid ${borderColor}` : `1px solid transparent`,
      fontWeight: isActive || isCompleted ? 'bold' : 'normal',
      fontSize: '15px',
      flex: 1,
      textAlign: 'center' as const,
      transition: 'all 0.3s ease',
      opacity: isUnlocked ? 1 : 0.5,
      boxShadow: isActive ? `inset 0 -10px 20px -10px ${bgColor}` : 'none'
    }
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        textarea.editable-cell {
          width: 100% !important;
          min-height: 140px !important;
          background-color: rgba(0, 0, 0, 0.3) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
          font-family: inherit !important;
          font-size: 11.5px !important;
          line-height: 1.5 !important;
          resize: vertical !important;
          padding: 10px !important;
          border-radius: 8px !important;
          transition: all 0.2s !important;
        }
        textarea.editable-cell:hover {
          border-color: rgba(255, 255, 255, 0.4) !important;
          background-color: rgba(0, 0, 0, 0.5) !important;
        }
        textarea.editable-cell:focus {
          outline: none !important;
          border-color: #0033ff !important;
          background-color: rgba(0, 0, 0, 0.7) !important;
          box-shadow: 0 0 0 2px rgba(0, 51, 255, 0.3) !important;
        }
      `}} />

      {/* Modal Post-Descarga */}
      {showDownloadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-fade-in glass-panel" style={{ padding: '40px', maxWidth: '400px', textAlign: 'center', background: 'rgba(10, 20, 60, 0.95)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ color: 'white', fontSize: '24px', marginBottom: '8px' }}>¡Rúbrica Descargada!</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '32px', fontSize: '14px', lineHeight: '1.5' }}>
              Tu rúbrica se ha guardado en tu equipo con éxito. ¿Qué te gustaría hacer ahora?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button 
                className="btn-primary" 
                onClick={startNewRubric}
              >
                Crear Nueva Rúbrica
              </button>
              <button 
                onClick={() => router.push('/')}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '12px 24px', borderRadius: '50px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 'bold' }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
              >
                Volver al Inicio
              </button>
            </div>
            <button 
              onClick={() => setShowDownloadModal(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', marginTop: '24px', cursor: 'pointer', textDecoration: 'underline', fontSize: '12px' }}
            >
              Cerrar esta ventana
            </button>
          </div>
        </div>
      )}

      {/* Header Premium */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
          Constructor de Rúbricas
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--accent-tertiary)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '600' }}>
          Asistente Paso a Paso
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '0', marginBottom: '40px', overflow: 'visible' }}>
        
        {/* Tabs Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', overflow: 'hidden' }}>
          <div 
            style={getTabStyle(1)} 
            onClick={() => maxStepReached >= 1 && setCurrentStep(1)}
          >
            {maxStepReached > 1 ? '✓ Contexto Curricular' : '1. Contexto Curricular'}
          </div>
          <div 
            style={getTabStyle(2)} 
            onClick={() => maxStepReached >= 2 && setCurrentStep(2)}
          >
            {maxStepReached > 2 ? '✓ Ruta Metodológica' : '2. Ruta Metodológica'}
          </div>
          <div 
            style={getTabStyle(3)} 
            onClick={() => maxStepReached >= 3 && setCurrentStep(3)}
          >
            3. Revisión y Descarga
          </div>
        </div>

        {/* Tab Content Area */}
        <div style={{ padding: '32px' }}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

      </div>

      <style jsx>{`
        .custom-select-option:hover {
          background: rgba(255,255,255,0.1) !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.3);
        }
        .route-card, .route-card * {
          cursor: pointer !important;
          user-select: none !important;
        }
        .route-card {
          border-radius: 16px;
          padding: 24px;
          border: 2px solid;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .route-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          border-color: rgba(255,255,255,0.3) !important;
        }
        .activity-item, .activity-item * {
          cursor: pointer !important;
          user-select: none !important;
        }
        .activity-item {
          padding: 12px;
          border-radius: 8px;
          border: 1px solid;
          transition: all 0.2s;
        }
        .activity-item:hover {
          background: rgba(255,255,255,0.05) !important;
        }
        .indicador-label:hover {
          background: rgba(255,255,255,0.05);
        }
        .rubric-row:hover {
          background: rgba(255,255,255,0.02);
        }
        .rubric-row:hover .delete-btn {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  )
}
