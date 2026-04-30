import Link from 'next/link'

export default function MemoryLab() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', zIndex: 1 }}>
      <div style={{ maxWidth: '760px', width: '100%' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: '#4a6080', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.8rem' }}>// memory</div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 800, color: 'white', marginBottom: '1.5rem', lineHeight: 1 }}>
          Memory <span style={{ color: '#ff3cac' }}>Lab</span>
        </h1>
        <p style={{ color: '#4a6080', maxWidth: '480px', marginBottom: '3rem' }}>
          El módulo más único del sistema. Un archivo vivo de conversaciones con IA, procesos creativos, errores y descubrimientos. El diario del OS.
        </p>

        <div style={{ padding: '2rem', border: '1px solid #ff3cac', background: 'rgba(255,60,172,0.03)', marginBottom: '2rem' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: '#ff3cac', marginBottom: '1rem' }}>// módulo en desarrollo</div>
          <p style={{ color: '#c8daf0', fontSize: '0.9rem' }}>
            Próximamente: log de conversaciones con agentes IA, historial de especímenes generados, fragmentos de memoria persistentes via IndexedDB/Dexie.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {['proceso', 'errores', 'descubrimientos', 'diario', 'IndexedDB', 'agentes'].map(t => (
            <span key={t} style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', padding: '0.2rem 0.6rem', border: '1px solid #0f1f35', color: '#4a6080' }}>{t}</span>
          ))}
        </div>

        <div style={{ marginTop: '3rem' }}>
          <Link href="/npos" style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: '#4a6080', textDecoration: 'none' }}>← NPos OS</Link>
        </div>
      </div>
    </div>
  )
}
