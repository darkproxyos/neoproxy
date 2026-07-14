import Link from 'next/link'

export default function Modules() {
  return (
    <main style={{ padding: 40, fontFamily: 'Space Mono, monospace', background: '#020408', color: '#00d4ff', minHeight: '100vh' }}>
      <nav style={{ marginBottom: '40px', display: 'flex', gap: '20px', flexWrap: 'wrap', borderBottom: '1px solid #0f1f35', paddingBottom: '20px', fontSize: '10px', letterSpacing: '2px' }}>
        <Link href="/portal" style={{ color: '#00d4ff', textDecoration: 'none' }}>[ PORTAL ]</Link>
        <Link href="/modules" style={{ color: '#fff', textDecoration: 'none' }}>[ MODULES ]</Link>
        <Link href="/core" style={{ color: '#4a6080', textDecoration: 'none' }}>[ CORE ]</Link>
        <Link href="/artifacts" style={{ color: '#4a6080', textDecoration: 'none' }}>[ ARTIFACTS ]</Link>
        <Link href="/manifesto" style={{ color: '#4a6080', textDecoration: 'none' }}>[ MANIFESTO ]</Link>
        <Link href="/shop" style={{ color: '#4a6080', textDecoration: 'none' }}>[ SHOP ]</Link>
        <Link href="/npos" style={{ color: '#00d4ff', textDecoration: 'none', border: '1px solid #00d4ff', padding: '2px 6px' }}>[ ACCESS NPOS ]</Link>
      </nav>
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
