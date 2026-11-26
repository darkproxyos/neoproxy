// /home-galeria — pedido explícito: "que en menú Home haya página Home
// con todos los Home como galería". Server Component simple (sin
// interactividad propia, solo Links) listando las tres variantes reales
// de home index que elige app/page.tsx al azar -- acá se entra a
// cualquiera a propósito, sin depender del azar. Linkeada desde HOME en
// el menú (components/nav-config.ts), que pasó de link directo a grupo
// con dos ítems: "ALEATORIO" (/, el selector de siempre) y "GALERÍA"
// (acá). Mismo patrón visual de tarjeta que /experimental y /games
// (código + título + blurb + color de acento propio, sin inventar un
// layout nuevo).

import Link from 'next/link'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'

const HOMES = [
  {
    id: 'nube', code: 'HOME · NUBE', title: 'LA NUBE', href: '/home-3d', color: '#00d4ff',
    blurb: 'La home cinemática de siempre — Ergo Proxy / Lain en vez de Ghost in the Shell. Secciones del sitio como nodos flotando dispersos en una nube de partículas digitales, cámara libre orbitando despacio, los siete procesos del Proxyverso a la deriva entre ellos.',
    tag: 'CÁMARA LIBRE — ORBITÁ CON EL MOUSE',
  },
  {
    id: 'grafico', code: 'HOME · MAPA', title: 'EL MAPA', href: '/home-grafico', color: '#00d4ff',
    blurb: 'El sitio entero como un solo árbol navegable, mismo estilo que /experimental/cartografia. Cada nodo es una ruta real — tocá cualquiera para entrar directo. Árbol radial, círculos anidados, o mosaico: la forma se elige arriba.',
    tag: 'TOCÁ UN NODO PARA ENTRAR — ZOOM Y ARRASTRE REALES',
  },
  {
    id: 'senal', code: 'HOME · SEÑAL', title: 'RUIDO → SEÑAL', href: '/home-senal', color: '#9d4edd',
    blurb: 'Pieza cinemática puramente visual y auditiva — sin una palabra en pantalla. Estática real (visual y sonora) que se autoorganiza hasta resolver en un teseracto de 16 vértices, cámara dirigida, audio 100% generativo con Web Audio API.',
    tag: 'REQUIERE UN CLICK PARA ACTIVAR AUDIO — MEJOR CON SONIDO',
  },
]

export const metadata = { title: 'GALERÍA DE HOME // NeoProxy' }

export default function HomeGaleriaPage() {
  return (
    <div style={{ background: '#01040a', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '104px 24px 100px' }}>
        <Link href="/" className="press tap-ext" style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 3, color: `${CYAN}aa`, textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>
          ← VOLVER A HOME (ALEATORIO)
        </Link>

        <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 6, color: `${CYAN}66`, marginBottom: 16 }}>
          NPX-HOME-GALERÍA // TODAS LAS ENTRADAS REALES AL SITIO
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 700, letterSpacing: 6, color: CYAN, textShadow: `0 0 40px ${CYAN}44`, marginBottom: 16, lineHeight: 1 }}>
          GALERÍA DE HOME
        </h1>
        <p style={{ fontSize: 12.5, lineHeight: 2, color: '#8fb8d6', maxWidth: 680, marginBottom: 56 }}>
          Cada visita a <Link href="/" style={{ color: '#fff', textDecoration: 'underline' }}>/</Link> elige una de estas tres al azar —
          acá están las tres juntas, para entrar a cualquiera directo sin depender de la suerte.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {HOMES.map((h) => (
            <Link key={h.id} href={h.href} className="press" style={{
              display: 'block', textDecoration: 'none', color: 'inherit', padding: 24,
              background: 'rgba(2,4,8,0.8)', border: `1px solid ${h.color}33`,
              borderLeft: `3px solid ${h.color}`,
            }}>
              <div style={{ fontSize: 10.5, letterSpacing: 2, color: `${h.color}aa`, marginBottom: 12 }}>{h.code}</div>
              <div style={{ fontSize: 20, letterSpacing: 2, color: '#fff', marginBottom: 10 }}>{h.title}</div>
              <p style={{ fontSize: 12, color: '#8fb8d6', lineHeight: 1.8, marginBottom: 16 }}>{h.blurb}</p>
              <div style={{ fontSize: 10, letterSpacing: 1, color: `${h.color}cc` }}>{h.tag}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
