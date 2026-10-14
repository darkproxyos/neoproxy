import Link from 'next/link'

export const metadata = { title: 'REALIDAD AUMENTADA // NeoProxy' }

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'

interface ArEntry {
  id: string
  code: string
  title: string
  href: string
  blurb: string
  controls: string
}

const CATALOG: ArEntry[] = [
  {
    id: 'neocam',
    code: 'NPX-AR-NEOCAM',
    title: 'NEOCAM',
    href: '/realidad-aumentada/neocam',
    blurb: 'La cámara con todos los efectos: 16 modos de imagen (neón, térmica, nocturna, glitch, matrix, holograma, toon, VHS, pixel, blueprint, calor, silueta, cuerpo, infrarrojo, aura) generados en vivo por código — sin filtros de terceros. Máscaras de privacidad facial, HUD, trails, ghost, reactividad a audio y movimiento, cubos físicos y un minijuego con las manos.',
    controls: 'REQUIERE CÁMARA (Y MICRÓFONO PARA AUDIO)',
  },
  {
    id: 'mascara',
    code: 'NPX-AR-MASK',
    title: 'MÁSCARA KITSUNE',
    href: '/realidad-aumentada/mascara',
    blurb: 'Face tracking real con MediaPipe: una máscara 3D de kitsune sigue tu cara en vivo por cámara, posición y rotación incluidas.',
    controls: 'REQUIERE CÁMARA',
  },
  {
    id: 'clasico',
    code: 'NPX-AR-CLASSIC',
    title: 'MODO CLÁSICO',
    href: '/realidad-aumentada/index.html',
    blurb: 'El filtro original: maquillaje y mechones punk dibujados sobre tracking facial, con 6 paletas de color, partículas, glitch y 3 modos de cámara (normal, térmica, nocturna).',
    controls: 'REQUIERE CÁMARA',
  },
]

export default function RealidadAumentadaHubPage() {
  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER AL INICIO
        </Link>

        <div style={{ fontSize: 9, color: `${CYAN}66`, letterSpacing: 6, marginBottom: 16 }}>
          // REALIDAD AUMENTADA — TRACKING FACIAL Y DE CUERPO EN EL NAVEGADOR
        </div>
        <h1 style={{
          fontSize: 40, fontWeight: 700, letterSpacing: 6, color: CYAN,
          textShadow: `0 0 40px ${CYAN}44`, marginBottom: 16, lineHeight: 1,
        }}>
          REALIDAD AUMENTADA
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 620, marginBottom: 56 }}>
          Cámara web real, procesada en vivo con MediaPipe (cara, segmentación de persona, manos) y canvas —
          todo corre en tu navegador, nada se sube a un servidor. Tres herramientas, de la más completa a la más simple.
        </p>

        <div style={{ fontSize: 10, color: CYAN, letterSpacing: 4, marginBottom: 22 }}>CATÁLOGO</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {CATALOG.map(entry => (
            <Link key={entry.id} href={entry.href} className="artifact-card" style={{ display: 'block', padding: 24, textDecoration: 'none', color: 'inherit' }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: '#4a6080', marginBottom: 12 }}>{entry.code}</div>
              <div style={{ fontSize: 20, letterSpacing: 2, color: '#fff', marginBottom: 10 }}>{entry.title}</div>
              <p style={{ fontSize: 11, color: '#8fb8d6', lineHeight: 1.8, marginBottom: 16 }}>{entry.blurb}</p>
              <div style={{ fontSize: 8, letterSpacing: 1, color: '#3a4a60' }}>{entry.controls}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
