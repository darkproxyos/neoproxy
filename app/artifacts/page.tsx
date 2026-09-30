import Link from 'next/link'
import { agents } from '@/components/proxyverse/agents'

const genos = agents.find(a => a.id === 'genos')!

export default function Artifacts() {
  return (
    <main style={{ padding: '104px 40px 40px', fontFamily: 'Space Mono, monospace', background: '#020408', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ marginTop: '2rem', color: '#00d4ff' }}>RELICS_&_ARTIFACTS</h1>

      <Link href={`/proxyverse/${genos.id}`} style={{
        display: 'block', marginTop: '2rem', maxWidth: 600, padding: '16px 20px',
        border: `1px solid ${genos.color}33`, background: `${genos.color}0a`, textDecoration: 'none',
      }}>
        <div style={{ fontSize: 9, color: genos.color, letterSpacing: 2, marginBottom: 6 }}>
          {genos.name} // {genos.role}
        </div>
        <p style={{ fontSize: 11, color: '#c8daf0', letterSpacing: 0.5, lineHeight: 1.8, fontStyle: 'italic', margin: 0 }}>
          "{genos.quote}"
        </p>
      </Link>

      <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        <div style={{ border: '1px solid #0f1f35', padding: '20px' }}>
          <h3 style={{ fontSize: '14px' }}>NP-RING-01</h3>
          <p style={{ color: '#4a6080', fontSize: '12px', marginTop: '10px' }}>The first physical extraction. Generative geometry translated to ABS resin.</p>
          <Link href="/shop/drop01" style={{ color: '#00d4ff', fontSize: '10px', textDecoration: 'none', display: 'block', marginTop: '20px' }}>VER_DROP_ACTUAL →</Link>
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
