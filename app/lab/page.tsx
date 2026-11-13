import Link from 'next/link'
import LabCanvas from './LabCanvas'

export const metadata = { title: 'LABORATORIO // NeoProxy' }

const mono = "'Space Mono', monospace"
const ORANGE = '#ff8c1a'

export default function LabPage() {
  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/experimental" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A EXPERIMENTAL
        </Link>

        <div style={{ fontSize: 9, color: `${ORANGE}66`, letterSpacing: 6, marginBottom: 16 }}>
          // LABORATORIO — EN CONSTRUCCIÓN
        </div>
        <h1 style={{
          fontSize: 40, fontWeight: 700, letterSpacing: 6, color: ORANGE,
          textShadow: `0 0 40px ${ORANGE}44`, marginBottom: 16, lineHeight: 1,
        }}>
          LABORATORIO
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 620, marginBottom: 12 }}>
          Esta página arranca de cero: un espacio real para dibujar y probar cosas, no un catálogo
          de links a otras páginas. Lo que antes vivía acá adentro (Proxygenesis, Atractores del
          Caos, Hemibrain) se mudó al catálogo de <Link href="/experimental" style={{ color: ORANGE }}>/experimental</Link>,
          donde siguen funcionando igual que siempre.
        </p>
        <p style={{ fontSize: 10, color: '#4a6080', letterSpacing: 1, lineHeight: 1.9, maxWidth: 620, marginBottom: 56 }}>
          Lo de abajo es lo único que existe hoy — un canvas de dibujo libre. Se va a ir sumando
          más con el tiempo, acá mismo.
        </p>

        <div style={{ fontSize: 10, color: ORANGE, letterSpacing: 4, marginBottom: 22 }}>
          CANVAS
        </div>

        <LabCanvas />
      </div>
    </div>
  )
}
