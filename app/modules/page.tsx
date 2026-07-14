import Link from 'next/link'

export default function Modules() {
  return (
    <main style={{ padding: 40, fontFamily: 'Space Mono, monospace', background: '#020408', color: '#00d4ff', minHeight: '100vh' }}>
      <Link href="/portal" style={{ color: '#4a6080', textDecoration: 'none', fontSize: '12px' }}>← BACK_TO_PORTAL</Link>
      <h1 style={{ marginTop: '2rem', letterSpacing: '4px' }}>SYSTEM_MODULES</h1>

      <div style={{ display: 'grid', gap: '2rem', marginTop: '3rem', maxWidth: '800px' }}>
        <section style={{ borderLeft: '2px solid #00d4ff', paddingLeft: '1.5rem' }}>
          <h3 style={{ color: '#fff' }}>GEN_LAB [ACTIVE]</h3>
          <p style={{ color: '#4a6080' }}>Procedural geometry engine for artifact generation. Accessible via NPos.</p>
        </section>

        <section style={{ borderLeft: '2px solid #4a6080', paddingLeft: '1.5rem' }}>
          <h3 style={{ color: '#fff' }}>SIGNAL_ECONOMY [STABLE]</h3>
          <p style={{ color: '#4a6080' }}>Distributed credit system for network participation and resource acquisition.</p>
        </section>

        <section style={{ borderLeft: '2px solid #4a6080', paddingLeft: '1.5rem' }}>
          <h3 style={{ color: '#fff' }}>COHERENCE_MONITOR [SYNCING]</h3>
          <p style={{ color: '#4a6080' }}>Real-time analysis of network stability and entropy levels.</p>
        </section>
      </div>
    </main>
  )
}
