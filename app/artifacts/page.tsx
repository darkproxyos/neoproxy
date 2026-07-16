import Link from 'next/link'
import ArtifactViewer from '@/components/ArtifactViewer'

export default function Artifacts() {
  return (
<<<<<<< HEAD
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
=======
    <main style={{ 
      background: '#0a0a0a', 
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif',
      color: '#e4e4e7'
    }}>
      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>
        <Link 
          href="/portal" 
          style={{ 
            color: '#71717a', 
            textDecoration: 'none', 
            fontSize: 12,
            display: 'inline-block',
            marginBottom: 32
          }}
        >
          ← Back to Portal
        </Link>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 400px', 
          gap: 48,
          marginTop: 32
        }}>
          {/* 3D Viewer */}
          <div style={{ 
            height: '600px',
            background: '#0f0f0f',
            border: '1px solid #1f1f23',
            borderRadius: 12,
            overflow: 'hidden'
          }}>
            <ArtifactViewer modelPath="/models/mascara.glb" />
          </div>

          {/* Specs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div style={{ 
                fontSize: 10, 
                color: '#71717a', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                marginBottom: 8
              }}>
                Proxy Masks Series
              </div>
              <h1 style={{ 
                fontSize: 28, 
                fontWeight: 600, 
                marginBottom: 8,
                lineHeight: 1.2
              }}>
                RELIC-001 // PROXY MASK MK-I
              </h1>
              <div style={{ 
                fontSize: 12, 
                color: '#71717a',
                fontFamily: '"JetBrains Mono", "Space Mono", monospace'
              }}>
                Unique seed: 0x7F3A2C9B
              </div>
            </div>

            <div style={{ 
              padding: '24px 0', 
              borderTop: '1px solid #1f1f23',
              borderBottom: '1px solid #1f1f23'
            }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ 
                  fontSize: 10, 
                  color: '#71717a', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  marginBottom: 4
                }}>
                  Materials
                </div>
                <div style={{ fontSize: 14, color: '#e4e4e7' }}>
                  Resin printing con pigmentación custom
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ 
                  fontSize: 10, 
                  color: '#71717a', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  marginBottom: 4
                }}>
                  Production
                </div>
                <div style={{ 
                  fontSize: 14, 
                  color: '#e4e4e7',
                  fontFamily: '"JetBrains Mono", "Space Mono", monospace'
                }}>
                  1 of 1 units
                </div>
              </div>

              <div>
                <div style={{ 
                  fontSize: 10, 
                  color: '#71717a', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  marginBottom: 4
                }}>
                  Fabrication
                </div>
                <div style={{ fontSize: 14, color: '#e4e4e7' }}>
                  Santiago, Chile
                </div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: '#71717a', lineHeight: 1.6 }}>
              Proxy Mask Mk-I geometry translated to physical resin. 
              Carries unique seed hash burned after materialization. 
              No two relics share the same geometry.
            </div>
          </div>
>>>>>>> 9fec4e1 (feat(artifacts): mascara 3D viewer with Draco compression)
        </div>
      </div>
    </main>
  )
}
