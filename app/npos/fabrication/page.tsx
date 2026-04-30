import Link from 'next/link'

export default function FabricationLab() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', zIndex: 1 }}>
      <div style={{ maxWidth: '760px', width: '100%' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: '#4a6080', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.8rem' }}>// fabrication</div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 800, color: 'white', marginBottom: '1.5rem', lineHeight: 1 }}>
          Fabrication <span style={{ color: '#7b2fff' }}>Lab</span>
        </h1>
        <p style={{ color: '#4a6080', maxWidth: '480px', marginBottom: '3rem' }}>
          La conexión entre el sistema digital y el taller físico. Resina UV, slicing, LEDs, servos, micro mecanismos. El arte sale del sistema y cobra forma en el mundo real.
        </p>

        <div style={{ padding: '2rem', border: '1px solid #7b2fff', background: 'rgba(123,47,255,0.04)', marginBottom: '2rem' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: '#7b2fff', marginBottom: '1rem' }}>// módulo en desarrollo</div>
          <p style={{ color: '#c8daf0', fontSize: '0.9rem' }}>
            Próximamente: conexión via Web Serial con impresoras 3D, slicing automático desde Lab, gestión de especímenes físicos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {['resina UV', 'slicing', 'LEDs', 'electrónica', 'servos', 'micro mecanismos'].map(t => (
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
