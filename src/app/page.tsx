import { prisma } from "@/lib/prisma";

export default async function Home() {
  // Queries a la base de datos para mostrar estadísticas reales
  const oasCount = await prisma.objetivoAprendizaje.count();
  const asignaturasCount = await prisma.asignatura.count();
  const ejesCount = await prisma.ejeCurricular.count();

  return (
    <div style={{ padding: '20px 0' }}>
      <header style={{ marginBottom: '50px' }}>
        <h1 className="text-gradient" style={{ fontSize: '42px', marginBottom: '10px' }}>
          Plataforma de Acompañamiento EdTech
        </h1>
        <p style={{ fontSize: '18px', maxWidth: '800px' }}>
          Sistema integral alineado con el currículum chileno. Explora los módulos de Inteligencia Artificial, Simuladores y Evaluación Formativa.
        </p>
      </header>

      {/* Stats Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '60px' }}>
        
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--accent-tertiary)', fontSize: '48px', marginBottom: '10px' }}>{oasCount}</h3>
          <p style={{ fontWeight: 600 }}>Objetivos de Aprendizaje</p>
          <p style={{ fontSize: '12px', marginTop: '10px' }}>Sincronizados y catalogados por taxonomía de Bloom</p>
        </div>

        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--accent-quaternary)', fontSize: '48px', marginBottom: '10px' }}>{asignaturasCount}</h3>
          <p style={{ fontWeight: 600 }}>Asignaturas Core</p>
          <p style={{ fontSize: '12px', marginTop: '10px' }}>De 1° Básico a IV Medio</p>
        </div>

        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--accent-secondary)', fontSize: '48px', marginBottom: '10px' }}>{ejesCount}</h3>
          <p style={{ fontWeight: 600 }}>Ejes Curriculares</p>
          <p style={{ fontSize: '12px', marginTop: '10px' }}>Normalizados y estructurados</p>
        </div>

      </section>

      {/* Modules Grid */}
      <h2 style={{ fontSize: '28px', marginBottom: '30px' }}>Módulos del Sistema</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
        
        {/* Module 1 */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ background: 'rgba(0, 51, 255, 0.1)', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '20px' }}>
            🧠
          </div>
          <h3 style={{ fontSize: '22px', marginBottom: '10px', color: 'var(--text-main)' }}>Rúbricas Inteligentes</h3>
          <p style={{ flexGrow: 1, marginBottom: '24px' }}>
            Generación de rúbricas DUA alineadas al MBE mediante Inteligencia Artificial (LangChain).
          </p>
          <button className="btn-primary" style={{ alignSelf: 'flex-start' }}>Abrir Módulo</button>
        </div>

        {/* Module 2 */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ background: 'rgba(255, 0, 178, 0.1)', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '20px' }}>
            📐
          </div>
          <h3 style={{ fontSize: '22px', marginBottom: '10px', color: 'var(--text-main)' }}>Simuladores 3D</h3>
          <p style={{ flexGrow: 1, marginBottom: '24px' }}>
            Laboratorios virtuales con Three.js y Matter.js para ciencias naturales y matemáticas.
          </p>
          <button className="btn-primary" style={{ alignSelf: 'flex-start' }}>Abrir Módulo</button>
        </div>

        {/* Module 3 */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ background: 'rgba(255, 204, 0, 0.1)', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '20px' }}>
            🎓
          </div>
          <h3 style={{ fontSize: '22px', marginBottom: '10px', color: 'var(--text-main)' }}>Carrera Docente</h3>
          <p style={{ flexGrow: 1, marginBottom: '24px' }}>
            Acompañamiento directivo, bitácora interactiva y ecosistema ágil de observación de aula.
          </p>
          <button className="btn-primary" style={{ alignSelf: 'flex-start' }}>Abrir Módulo</button>
        </div>

      </div>
    </div>
  );
}
