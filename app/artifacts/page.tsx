import Link from 'next/link'

export default function Artifacts() {
  return (
    <main style={{ padding: 40, fontFamily: 'Space Mono, monospace', background: '#020408', color: '#fff', minHeight: '100vh' }}>
      <nav style={{ marginBottom: '40px', display: 'flex', gap: '20px', flexWrap: 'wrap', borderBottom: '1px solid #0f1f35', paddingBottom: '20px', fontSize: '10px', letterSpacing: '2px' }}>
        <Link href="/portal" style={{ color: '#00d4ff', textDecoration: 'none' }}>[ PORTAL ]</Link>
        <Link href="/modules" style={{ color: '#4a6080', textDecoration: 'none' }}>[ MODULES ]</Link>
        <Link href="/core" style={{ color: '#4a6080', textDecoration: 'none' }}>[ CORE ]</Link>
        <Link href="/artifacts" style={{ color: '#fff', textDecoration: 'none' }}>[ ARTIFACTS ]</Link>
        <Link href="/manifesto" style={{ color: '#4a6080', textDecoration: 'none' }}>[ MANIFESTO ]</Link>
        <Link href="/shop" style={{ color: '#4a6080', textDecoration: 'none' }}>[ SHOP ]</Link>
        <Link href="/npos" style={{ color: '#00d4ff', textDecoration: 'none', border: '1px solid #00d4ff', padding: '2px 6px' }}>[ ACCESS NPOS ]</Link>
      </nav>
      <h1 style={{ marginTop: '2rem', color: '#00d4ff' }}>RELICS_&_ARTIFACTS</h1>
      
      <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        <div style={{ border: '1px solid #0f1f35', padding: '20px' }}>
          <h3 style={{ fontSize: '14px' }}>NP-RING-01</h3>
          <p style={{ color: '#4a6080', fontSize: '12px', marginTop: '10px' }}>The first physical extraction. Generative geometry translated to ABS resin.</p>
          <Link href="/shop/drop01" style={{ color: '#00d4ff', fontSize: '10px', textDecoration: 'none', display: 'block', marginTop: '20px' }}>VIEW_COLLECTION →</Link>
        </div>
        <div style={{ border: '1px solid #0f1f35', padding: '20px', opacity: 0.5 }}>
          <h3 style={{ fontSize: '14px' }}>NP-CORE-NODE</h3>
          <p style={{ color: '#4a6080', fontSize: '12px', marginTop: '10px' }}>Physical interface for network synchronization. Under development.</p>
          <span style={{ color: '#4a6080', fontSize: '10px', display: 'block', marginTop: '20px' }}>[DORMANT]</span>
        </div>
      </div>
    </main>
  )
}
