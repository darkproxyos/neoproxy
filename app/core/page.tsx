import Link from 'next/link'

export default function Core() {
  return (
    <main style={{ padding: 40, fontFamily: 'Space Mono, monospace', background: '#020408', color: '#fff', minHeight: '100vh' }}>
      <Link href="/portal" style={{ color: '#00d4ff', textDecoration: 'none', fontSize: '12px' }}>← BACK_TO_PORTAL</Link>
      <div style={{ marginTop: '4rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', letterSpacing: '10px', color: '#00d4ff' }}>CORE_KERNEL</h1>
        <p style={{ color: '#4a6080', marginTop: '1rem', maxWidth: '600px', margin: '1rem auto' }}>
          The central processing unit. Where intention becomes protocol. 
          The foundation of the NeoProxy network architecture.
        </p>
        <div style={{ marginTop: '4rem', padding: '2rem', border: '1px solid #0f1f35', display: 'inline-block' }}>
          <p style={{ color: '#00ff9d', fontSize: '12px' }}>STATUS: STABLE_SYNC</p>
          <p style={{ color: '#4a6080', fontSize: '12px' }}>UPTIME: 99.9982%</p>
        </div>
      </div>
    </main>
  )
}
