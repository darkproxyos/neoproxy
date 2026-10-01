import Link from 'next/link'
import Image from 'next/image'
import { agents } from '@/components/proxyverse/agents'
import { categories, pieces } from '@/components/gallery/pieces'

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

      <div style={{ marginTop: '5rem' }}>
        <h2 style={{ fontSize: 13, letterSpacing: 3, color: '#00d4ff', borderBottom: '1px solid #0f1f35', paddingBottom: 16 }}>
          GALERÍA_NEOPROXY // IMPRESIÓN_3D_&_RESINA
        </h2>
        <p style={{ color: '#4a6080', fontSize: '11px', lineHeight: 1.8, maxWidth: 680, marginTop: '14px' }}>
          Registro fotográfico del taller físico. No todo tiene checkout — algunas piezas son relicto,
          otras son prueba de proceso. Ordenadas por lo que son, no por cuándo se hicieron.
        </p>

        {categories.map(cat => {
          const catPieces = pieces.filter(p => p.category === cat.id)
          return (
            <section key={cat.id} style={{ marginTop: '3.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: 12, letterSpacing: 2, color: cat.color, margin: 0 }}>{cat.label}</h3>
                <span style={{ fontSize: 10, color: '#4a6080' }}>{catPieces.length} piezas</span>
              </div>
              <p style={{ color: '#4a6080', fontSize: '10px', lineHeight: 1.7, maxWidth: 600, marginTop: '8px', fontStyle: 'italic' }}>
                {cat.blurb}
              </p>

              <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '18px' }}>
                {catPieces.map(piece => (
                  <div key={piece.id} style={{ border: `1px solid ${cat.color}22`, background: `${cat.color}08` }}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', borderBottom: `1px solid ${cat.color}22` }}>
                      <Image
                        src={piece.src}
                        alt={piece.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ padding: '14px 16px' }}>
                      <h4 style={{ fontSize: 10, letterSpacing: 1, color: cat.color, margin: 0 }}>{piece.title}</h4>
                      <p style={{ fontSize: 9, color: '#4a6080', letterSpacing: 0.5, marginTop: 6 }}>{piece.material}</p>
                      <p style={{ fontSize: 10, color: '#c8daf0', lineHeight: 1.7, marginTop: 10 }}>{piece.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
