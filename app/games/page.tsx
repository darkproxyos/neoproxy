import Link from 'next/link'

export const metadata = { title: 'PROXYGAMES // NeoProxy' }

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'

type GameStatus = 'jugable' | 'demo'

interface GameEntry {
  id: string
  code: string
  title: string
  href: string
  status: GameStatus
  blurb: string
  controls: string
}

// Descripciones verificadas contra el código real de cada página — no
// inventar mecánicas que no existen. Planet no tiene ningún input handler
// (sin keydown, sin mouse, sin colisión): es un flythrough automático, no
// un juego jugable, y se etiqueta como tal.
const CATALOG: GameEntry[] = [
  {
    id: 'wired',
    code: 'NPX-EXP-WIRED',
    title: 'THE WIRED',
    href: '/games/wired',
    status: 'jugable',
    blurb: 'Vuelo en primera persona por la capa entre capas. Absorbé fragmentos de memoria antes de que tu coherencia caiga a cero — la señal corrupta te acerca a la disolución.',
    controls: 'WASD / FLECHAS · ESPACIO · SHIFT',
  },
  {
    id: 'spaceship',
    code: 'NPX-EXP-SPECTRUM',
    title: 'ESPECTRO',
    href: '/games/spaceship',
    status: 'jugable',
    blurb: 'Esquivá obstáculos cruzando las siete bandas del espectro electromagnético, de radio a gamma, con escudo y puntaje en tiempo real.',
    controls: 'WASD / FLECHAS — DODGE',
  },
  {
    id: 'planet',
    code: 'NPX-EXP-FLYBY',
    title: 'FLYBY',
    href: '/games/planet',
    status: 'demo',
    blurb: 'Sobrevuelo automático de una nave a través de un túnel de anillos y un campo estelar. Todavía sin controles — demo visual, no jugable.',
    controls: 'SIN CONTROLES — AUTOPLAY',
  },
  {
    id: 'trickster',
    code: 'NPX-EXP-TRICKSTER',
    title: 'TRICKSTER // CAMPO DE PRUEBA',
    href: '/games/trickster',
    status: 'demo',
    blurb: 'El primer personaje jugable del catálogo — generado y traído desde afuera, corriendo con esqueleto y animación real (Mixamo) en una escena propia. El salto todavía es animación procedural, sin clip propio.',
    controls: 'WASD / FLECHAS — ESPACIO SALTA',
  },
  {
    id: 'trickster-mirror',
    code: 'NPX-EXP-MIRROR',
    title: 'TRICKSTER // ESPEJO',
    href: '/games/trickster-mirror',
    status: 'demo',
    blurb: 'Trickster en reposo copia tus movimientos de cabeza y brazos en tiempo real, leídos con la cámara del dispositivo (MediaPipe Pose, corre entero en el navegador). Sin piernas ni torso — solo lo que una webcam frontal puede ver bien.',
    controls: 'CÁMARA — SIN TECLADO',
  },
]

export default function GamesHubPage() {
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

        <div style={{ fontSize: 9, color: `${CYAN}44`, letterSpacing: 6, marginBottom: 16 }}>
          // PROXYGAMES — ESTUDIO
        </div>
        <h1 style={{
          fontSize: 40, fontWeight: 700, letterSpacing: 6, color: CYAN,
          textShadow: `0 0 40px ${CYAN}44`, marginBottom: 16, lineHeight: 1,
        }}>
          PROXYGAMES
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 620, marginBottom: 12 }}>
          El brazo de juegos de NeoProxy. Cada título vive adentro del Proxyverse — mundos jugables
          en vez de solo narrados. Esto recién arranca: cuatro experimentos ya corriendo, y la línea
          de producción se está armando recién ahora.
        </p>
        <p style={{ fontSize: 10, color: '#4a6080', letterSpacing: 1, lineHeight: 1.9, maxWidth: 620, marginBottom: 56 }}>
          Catálogo en vivo — lo que ves abajo es exactamente el build que corre en producción, no una maqueta.
        </p>

        <div style={{ fontSize: 10, color: '#00ffcc', letterSpacing: 4, marginBottom: 22 }}>
          CATÁLOGO
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 32 }}>
          {CATALOG.map(game => (
            <Link
              key={game.id}
              href={game.href}
              className="artifact-card"
              style={{ display: 'block', padding: 24, textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 8 }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: '#4a6080' }}>{game.code}</div>
                <div style={{
                  fontSize: 8, letterSpacing: 1.5, padding: '3px 8px', whiteSpace: 'nowrap',
                  color: game.status === 'jugable' ? '#00ffcc' : '#ffb800',
                  border: `1px solid ${game.status === 'jugable' ? '#00ffcc44' : '#ffb80044'}`,
                }}>
                  {game.status === 'jugable' ? 'JUGABLE' : 'DEMO'}
                </div>
              </div>
              <div style={{ fontSize: 20, letterSpacing: 2, color: '#fff', marginBottom: 10 }}>{game.title}</div>
              <p style={{ fontSize: 11, color: '#8fb8d6', lineHeight: 1.8, marginBottom: 16 }}>{game.blurb}</p>
              <div style={{ fontSize: 8, letterSpacing: 1, color: '#3a4a60' }}>{game.controls}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
