import RubricForm from "./components/RubricForm"

export const metadata = {
  title: 'Rúbricas Inteligentes | EdTech',
  description: 'Generación de Rúbricas DUA con Inteligencia Artificial',
}

export default function RubricasPage() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '10px', color: 'white' }}>Rúbricas Inteligentes</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>
        Genera rúbricas formativas alineadas al Mineduc y al Diseño Universal de Aprendizaje (DUA) en segundos.
      </p>

      <RubricForm />
    </div>
  )
}
