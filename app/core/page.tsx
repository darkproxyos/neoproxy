import Link from 'next/link'

export default function Core() {
  return (
    <main style={{ padding: 40, fontFamily: 'Space Mono, monospace', background: '#020408', color: '#fff', minHeight: '100vh' }}>
      <nav style={{ marginBottom: '40px', display: 'flex', gap: '20px', flexWrap: 'wrap', borderBottom: '1px solid #0f1f35', paddingBottom: '20px', fontSize: '10px', letterSpacing: '2px' }}>
        <Link href="/portal" style={{ color: '#00d4ff', textDecoration: 'none' }}>[ PORTAL ]</Link>
        <Link href="/modules" style={{ color: '#4a6080', textDecoration: 'none' }}>[ MODULES ]</Link>
        <Link href="/core" style={{ color: '#fff', textDecoration: 'none' }}>[ CORE ]</Link>
        <Link href="/artifacts" style={{ color: '#4a6080', textDecoration: 'none' }}>[ ARTIFACTS ]</Link>
        <Link href="/manifesto" style={{ color: '#4a6080', textDecoration: 'none' }}>[ MANIFESTO ]</Link>
        <Link href="/shop" style={{ color: '#4a6080', textDecoration: 'none' }}>[ SHOP ]</Link>
        <Link href="/npos" style={{ color: '#00d4ff', textDecoration: 'none', border: '1px solid #00d4ff', padding: '2px 6px' }}>[ ACCESS NPOS ]</Link>
      </nav>
      <div style={{ marginTop: '4rem', textAlign: 'left', maxWidth: '800px', margin: '4rem auto' }}>
        <h1 style={{ fontSize: '3rem', letterSpacing: '10px', color: '#00d4ff', textAlign: 'center' }}>CORE_KERNEL</h1>
        
        <div style={{ marginTop: '4rem', display: 'grid', gap: '3rem' }}>
          <section>
            <h2 style={{ fontSize: '14px', color: '#00ff9d', letterSpacing: '4px' }}>[01] THE_NEURAL_BACKBONE</h2>
            <p style={{ color: '#4a6080', marginTop: '1rem', lineHeight: '1.8' }}>
              The Core is not a server; it is a consensus. Every transaction, every generative seed, and every artifact extraction is validated by the distributed kernel. It ensures that no geometry is duplicated and every digital soul remains unique within the network.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '14px', color: '#b400ff', letterSpacing: '4px' }}>[02] PROTOCOL_OVERRIDE</h2>
            <p style={{ color: '#4a6080', marginTop: '1rem', lineHeight: '1.8' }}>
              Intention is converted into executable geometry through the Stardust Engine. The Core manages the entropy levels of the system, ensuring that the balance between chaotic generation and structural integrity is maintained for physical fabrication.
            </p>
          </section>

          <div style={{ marginTop: '2rem', padding: '2rem', border: '1px solid #0f1f35', display: 'block', textAlign: 'center' }}>
            <p style={{ color: '#00ff9d', fontSize: '12px' }}>STATUS: STABLE_SYNC</p>
            <p style={{ color: '#4a6080', fontSize: '12px' }}>UPTIME: 99.9982%</p>
            <p style={{ color: '#4a6080', fontSize: '10px', marginTop: '10px' }}>IDENT_HASH: 0x884291X_CORE_PRIME</p>
          </div>
        </div>
      </div>
    </main>
  )
}
