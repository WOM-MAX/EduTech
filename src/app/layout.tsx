import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "App EdTech Chile | Dashboard Premium",
  description: "Plataforma educativa integral con IA, rúbricas y simuladores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <div className="dashboard-container animate-fade-in">
          {/* Sidebar */}
          <aside className="glass-panel" style={{ position: 'relative', margin: '20px', borderRadius: '24px', padding: '30px 20px', borderRight: '1px solid var(--glass-border)' }}>
            <div style={{ marginBottom: '40px', padding: '0 10px' }}>
              <h2 className="text-gradient-accent" style={{ fontSize: '24px', margin: 0 }}>EdTech Chile</h2>
              <p style={{ fontSize: '12px', marginTop: '5px', color: 'var(--accent-quaternary)' }}>• Mineduc Aligned</p>
            </div>
            
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link href="/" style={{ padding: '12px 16px', background: 'var(--glass-highlight)', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, color: 'white', textDecoration: 'none' }}>
                📊 Dashboard
              </Link>
              <Link href="/rubricas" style={{ padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', opacity: 0.7, transition: '0.2s', color: 'white', textDecoration: 'none' }}>
                📋 Rúbricas IA
              </Link>
              <div style={{ padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', opacity: 0.7, transition: '0.2s' }}>
                📝 SIMCE / PAES
              </div>
              <div style={{ padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', opacity: 0.7, transition: '0.2s' }}>
                🎮 Simuladores
              </div>
              <div style={{ padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', opacity: 0.7, transition: '0.2s' }}>
                🎓 Carrera Docente
              </div>
            </nav>
            
            <div style={{ position: 'absolute', bottom: '30px', left: '20px', right: '20px' }}>
              <div style={{ padding: '20px', background: 'rgba(0, 51, 255, 0.1)', borderRadius: '16px', border: '1px solid rgba(0, 51, 255, 0.3)', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', marginBottom: '10px', color: 'white' }}>Estado de la BD</p>
                <div style={{ display: 'inline-block', padding: '4px 10px', background: 'var(--accent-quaternary)', color: '#000', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                  CONECTADA
                </div>
              </div>
            </div>
          </aside>
          
          {/* Main Content */}
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
