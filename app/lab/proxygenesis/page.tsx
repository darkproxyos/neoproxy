import Link from 'next/link'

export const metadata = { title: 'PROXYGENESIS // NeoProxy' }

const mono = "'Space Mono', monospace"
const VIOLET = '#b400ff'

// Punto de entrada de PROXYGENESIS (cara pública del NMK). Todavía no corre
// kernel -- eso es Fase 1 del plan (lib/nmk/*), pendiente de OK explícito.
// Esta página solo establece la ruta, el acento visual (violeta) y dice la
// verdad sobre su propio estado, sin aparentar un sistema que no existe.
export default function ProxygenesisPage() {
  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/lab" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A EXPERIMENTAL
        </Link>

        <div style={{ fontSize: 9, color: `${VIOLET}44`, letterSpacing: 6, marginBottom: 16 }}>
          // NMK — NEOPROXY MORPHOGENETIC KERNEL
        </div>
        <h1 style={{
          fontSize: 36, fontWeight: 700, letterSpacing: 6, color: VIOLET,
          textShadow: `0 0 40px ${VIOLET}44`, marginBottom: 16, lineHeight: 1,
        }}>
          PROXYGENESIS
        </h1>
        <p style={{ fontSize: 13, color: '#8fb8d6', lineHeight: 1.9, maxWidth: 560, marginBottom: 32 }}>
          Un laboratorio de embriología digital. Acá no se diseñan objetos — se diseñan leyes: un
          genoma y un campo de reglas locales, y un organismo crece solo a partir de eso. El
          genoma es el Ghost. La malla que resulta es el Shell. Lo que se imprime es apenas un
          fósil — el archivo <code>.npxdna</code> es lo que realmente vale.
        </p>

        <div style={{
          border: `1px solid ${VIOLET}33`, background: `${VIOLET}0a`, padding: '16px 20px', marginBottom: 32,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffb800', boxShadow: '0 0 8px #ffb800' }} />
            <span style={{ fontSize: 9, letterSpacing: 2, color: '#ffb800' }}>EN DESARROLLO // SIN KERNEL TODAVÍA</span>
          </div>
          <p style={{ fontSize: 11, color: '#4a6080', lineHeight: 1.8 }}>
            Esta página todavía no corre nada — es el punto de entrada mientras se construye el
            motor (campos escalares, Growth Tips, scheduler de 8 fases). Cuando el primer
            organismo crezca en pantalla, va a aparecer acá.
          </p>
        </div>

        <div style={{ fontSize: 9, letterSpacing: 2, color: '#4a6080', lineHeight: 2 }}>
          NPX-EXP-GENESIS // v0.0 — PRE-KERNEL
        </div>
      </div>
    </div>
  )
}
