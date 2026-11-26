import Link from 'next/link'
import { FAMILY_COLOR } from '@/lib/specimens/families'
import { GEO, GEO_ORDER } from '@/lib/specimens/geo-specs'

const mono = "'Space Mono', monospace"
const ACCENT = '#9fe8ff'

export default function GeometriasPage() {
  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative', overflowX: 'hidden' }}>
      <div className="crt-scanlines" /><div className="tech-grid" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '104px 24px 100px' }}>
        <div style={{ fontSize: 10.5, letterSpacing: 6, color: `${ACCENT}aa`, marginBottom: 14 }}>NPX-GEO // GABINETE DE CURIOSIDADES DE UN MUNDO QUE NO EXISTIÓ</div>
        <h1 style={{ fontSize: 'clamp(28px, 6vw, 46px)', letterSpacing: 5, color: ACCENT, textShadow: `0 0 40px ${ACCENT}44`, margin: '0 0 16px', lineHeight: 1.1 }}>GEOMETRÍAS</h1>
        <p style={{ fontSize: 12, lineHeight: 2, color: '#9fb4cc', maxWidth: 800, margin: '0 0 10px' }}>
          Objetos exactos, con nombre y teorema, que se exploran con parámetros y se descargan como STL. Aquí nada evoluciona ni desaparece:
          es la contraparte de <Link href="/especimenes/laboratorio" style={{ color: ACCENT }}>ESPECÍMENES</Link>, donde las formas nacen, mutan y mueren.
          Cada pieza se calcula en tu navegador; el STL sale a 60 mm de alto o ancho, con el análisis de imprimibilidad a la vista.
        </p>
        <p style={{ fontSize: 11, lineHeight: 1.9, color: '#6f86a3', maxWidth: 800, margin: '0 0 36px' }}>
          Son versiones propias de ideas clásicas, no reproducciones fieles. Cada página indica en qué se inspira y qué simplifica.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
          {GEO_ORDER.map((f) => {
            const c = FAMILY_COLOR[f], s = GEO[f]
            return (
              <Link key={f} href={`/geometrias/${f}`} className="press" style={{ display: 'block', textDecoration: 'none', color: 'inherit', background: '#080c12', border: `1px solid ${c}33`, borderTop: `2px solid ${c}` }}>
                <img src={`/geometrias/thumbs/${f}.webp`} alt={`${s.title}: ejemplo`} loading="lazy" width={320} height={320} style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '1 / 1', background: '#070a10' }} />
                <div style={{ padding: '14px 16px 18px' }}>
                  <div style={{ fontSize: 12, letterSpacing: 2.5, color: c }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: '#8fa8c4', margin: '6px 0 10px' }}>{s.tagline}</div>
                  <div style={{ fontSize: 11, lineHeight: 1.8, color: '#6f86a3' }}>{s.concept.split('. ')[0]}.</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
