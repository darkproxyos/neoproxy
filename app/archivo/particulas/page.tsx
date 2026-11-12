'use client'

import type { ReactNode, CSSProperties } from 'react'

// ARCHIVO/PARTÍCULAS — página oculta, sin link en ningún lugar del sitio
// (no está en components/nav-config.ts a propósito). Solo alcanzable
// tipeando /archivo/particulas directo en la URL. Mismo lenguaje visual
// que el resto del sitio (ver app/knowledge/filosofia/page.tsx y
// app/page.tsx: 'use client', objetos de estilo inline, Space Mono,
// fondo casi negro, paneles de vidrio con borde + glow de color). Color
// de acento propio de esta página: cian eléctrico #5fd4ff — no se repite
// con fabricación (#5f95c9), laboratorio (#ff8c1a), experimental
// (#cc0000), conocimiento (#6644aa), proxyverse (#00ff9d) ni manifiesto
// (#ffb800).

const mono = "'Space Mono', monospace"
const ACCENT = '#5fd4ff'

// ---------------------------------------------------------------------
// Datos — Modelo Estándar
// ---------------------------------------------------------------------

type Particle = {
  symbol: string
  name: string
  charge: string
  spin: string
  mass: string
  note?: string
}

const QUARK_GENERATIONS: { label: string; pair: [Particle, Particle] }[] = [
  {
    label: '1ra generación',
    pair: [
      { symbol: 'u', name: 'ARRIBA (up)', charge: '+2/3', spin: '1/2', mass: '≈ 2.2 MeV/c²' },
      { symbol: 'd', name: 'ABAJO (down)', charge: '−1/3', spin: '1/2', mass: '≈ 4.7 MeV/c²' },
    ],
  },
  {
    label: '2da generación',
    pair: [
      { symbol: 'c', name: 'ENCANTO (charm)', charge: '+2/3', spin: '1/2', mass: '≈ 1.27 GeV/c²' },
      { symbol: 's', name: 'EXTRAÑO (strange)', charge: '−1/3', spin: '1/2', mass: '≈ 95 MeV/c²' },
    ],
  },
  {
    label: '3ra generación',
    pair: [
      { symbol: 't', name: 'CIMA (top)', charge: '+2/3', spin: '1/2', mass: '≈ 173 GeV/c²' },
      { symbol: 'b', name: 'FONDO (bottom)', charge: '−1/3', spin: '1/2', mass: '≈ 4.18 GeV/c²' },
    ],
  },
]

const LEPTON_GENERATIONS: { label: string; pair: [Particle, Particle] }[] = [
  {
    label: '1ra generación',
    pair: [
      { symbol: 'e⁻', name: 'ELECTRÓN', charge: '−1', spin: '1/2', mass: '≈ 0.511 MeV/c²' },
      { symbol: 'νe', name: 'NEUTRINO ELECTRÓNICO', charge: '0', spin: '1/2', mass: '< 1 eV/c² (no determinada con precisión)' },
    ],
  },
  {
    label: '2da generación',
    pair: [
      { symbol: 'μ⁻', name: 'MUÓN', charge: '−1', spin: '1/2', mass: '≈ 105.7 MeV/c²' },
      { symbol: 'νμ', name: 'NEUTRINO MUÓNICO', charge: '0', spin: '1/2', mass: 'casi nula' },
    ],
  },
  {
    label: '3ra generación',
    pair: [
      { symbol: 'τ⁻', name: 'TAU', charge: '−1', spin: '1/2', mass: '≈ 1776.9 MeV/c²' },
      { symbol: 'ντ', name: 'NEUTRINO TAUÓNICO', charge: '0', spin: '1/2', mass: 'casi nula' },
    ],
  },
]

const GAUGE_BOSONS: Particle[] = [
  { symbol: 'γ', name: 'FOTÓN', charge: '0', spin: '1', mass: 'sin masa', note: 'media el electromagnetismo — alcance infinito' },
  { symbol: 'g', name: 'GLUÓN', charge: '0', spin: '1', mass: 'sin masa', note: '8 combinaciones color/anticolor — media la fuerza fuerte, alcance ~10⁻¹⁵ m (confina quarks)' },
  { symbol: 'W±', name: 'BOSÓN W', charge: '±1', spin: '1', mass: '≈ 80.4 GeV/c²', note: 'media la fuerza débil — cambia el "sabor" de quarks/leptones (ej. decaimiento beta)' },
  { symbol: 'Z⁰', name: 'BOSÓN Z', charge: '0', spin: '1', mass: '≈ 91.2 GeV/c²', note: 'media la fuerza débil — corrientes neutras' },
]

const HIGGS: Particle = {
  symbol: 'H⁰',
  name: 'BOSÓN DE HIGGS',
  charge: '0',
  spin: '0',
  mass: '≈ 125.25 GeV/c²',
  note: 'el campo de Higgs da masa al resto de las partículas elementales — excepto, se cree, los neutrinos, cuyo origen de masa sigue sin resolverse del todo',
}

// ---------------------------------------------------------------------
// Datos — interacciones fundamentales
// ---------------------------------------------------------------------

type Interaction = {
  name: string
  mediator: string
  strength: string
  range: string
  affects: string
  note?: string
}

const INTERACTIONS: Interaction[] = [
  { name: 'FUERTE', mediator: 'gluón (g)', strength: '1 (referencia)', range: '~10⁻¹⁵ m', affects: 'quarks y gluones (carga de color)' },
  { name: 'ELECTROMAGNÉTICA', mediator: 'fotón (γ)', strength: '~10⁻²', range: 'infinito', affects: 'toda partícula con carga eléctrica' },
  { name: 'DÉBIL', mediator: 'bosones W/Z', strength: '~10⁻⁶', range: '~10⁻¹⁸ m', affects: 'quarks y leptones (cambia el sabor)' },
  { name: 'GRAVITATORIA', mediator: 'gravitón (hipotético)', strength: '~10⁻³⁸', range: 'infinito', affects: 'todo lo que tiene masa-energía', note: 'no observado — no forma parte del Modelo Estándar' },
]

// ---------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------

function SectionTag({ children }: { children: string }) {
  return (
    <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 5, color: `${ACCENT}66`, marginBottom: 14 }}>
      {children}
    </div>
  )
}

function SectionTitle({ roman, children }: { roman: string; children: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 28 }}>
      <span style={{ fontSize: 12, color: `${ACCENT}55`, letterSpacing: 2 }}>{roman}</span>
      <h2
        style={{
          fontSize: 'clamp(18px, 3.4vw, 24px)',
          letterSpacing: 5,
          color: ACCENT,
          textShadow: `0 0 24px ${ACCENT}44`,
          margin: 0,
        }}
      >
        {children}
      </h2>
    </div>
  )
}

function GlassPanel({
  children,
  style,
}: {
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        background: 'rgba(8, 14, 20, 0.72)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 22px ${ACCENT}12 inset, 0 0 1px ${ACCENT}22`,
        padding: 18,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function ParticleCard({ p, color }: { p: Particle; color: string }) {
  return (
    <div
      style={{
        background: 'rgba(5, 10, 15, 0.85)',
        border: `1px solid ${color}55`,
        borderRadius: 4,
        padding: '14px 12px',
        minWidth: 0,
        boxShadow: `0 0 16px ${color}14 inset`,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          color,
          textShadow: `0 0 14px ${color}66`,
          lineHeight: 1,
        }}
      >
        {p.symbol}
      </div>
      <div style={{ fontSize: 9.5, letterSpacing: 1.2, color: '#c8daf0', lineHeight: 1.4 }}>{p.name}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
        <Stat label="CARGA" value={p.charge} color={color} />
        <Stat label="SPIN" value={p.spin} color={color} />
        <Stat label="MASA" value={p.mass} color={color} />
      </div>
      {p.note && (
        <div style={{ fontSize: 8.5, lineHeight: 1.5, color: '#7a94ac', marginTop: 4, letterSpacing: 0.2 }}>
          {p.note}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 9 }}>
      <span style={{ color: `${color}99`, letterSpacing: 1.5 }}>{label}</span>
      <span style={{ color: '#e8f2ff', letterSpacing: 0.3, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function GenerationRow({
  generations,
  color,
}: {
  generations: { label: string; pair: [Particle, Particle] }[]
  color: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {generations.map(gen => (
        <div key={gen.label}>
          <div style={{ fontSize: 8.5, letterSpacing: 2, color: `${color}77`, marginBottom: 8 }}>
            {gen.label.toUpperCase()}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            {gen.pair.map(p => (
              <ParticleCard key={p.symbol} p={p} color={color} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------
// Diagramas de Feynman — SVG inline, convención: tiempo izquierda→derecha.
// Fermiones = línea recta con flecha (flecha hacia adelante en el tiempo
// = partícula, hacia atrás = antipartícula). Fotón = línea ondulada.
// W/Z = línea discontinua.
// ---------------------------------------------------------------------

function FeynmanWave({ x1, y1, x2, y2, color }: { x1: number; y1: number; x2: number; y2: number; color: string }) {
  const segments = 10
  const dx = (x2 - x1) / segments
  const dy = (y2 - y1) / segments
  const len = Math.hypot(x2 - x1, y2 - y1)
  const nx = -(y2 - y1) / len
  const ny = (x2 - x1) / len
  const amp = 6
  let d = `M ${x1} ${y1}`
  for (let i = 1; i <= segments; i++) {
    const px = x1 + dx * i
    const py = y1 + dy * i
    const off = amp * Math.sin((i * Math.PI) / 1) * (i % 2 === 0 ? 1 : -1)
    d += ` L ${px + nx * off} ${py + ny * off}`
  }
  return <path d={d} stroke={color} strokeWidth={1.6} fill="none" />
}

function FeynmanFermion({
  x1,
  y1,
  x2,
  y2,
  color,
  reverse = false,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  reverse?: boolean
}) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const angle = reverse ? Math.atan2(y1 - y2, x1 - x2) : Math.atan2(y2 - y1, x2 - x1)
  const arrowLen = 7
  const arrowWidth = 4
  const ax = mx - Math.cos(angle) * (arrowLen / 2)
  const ay = my - Math.sin(angle) * (arrowLen / 2)
  const tipX = ax + Math.cos(angle) * arrowLen
  const tipY = ay + Math.sin(angle) * arrowLen
  const leftX = ax - Math.sin(angle) * arrowWidth
  const leftY = ay + Math.cos(angle) * arrowWidth
  const rightX = ax + Math.sin(angle) * arrowWidth
  const rightY = ay - Math.cos(angle) * arrowWidth
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.6} />
      <polygon points={`${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`} fill={color} />
    </g>
  )
}

function FeynmanDashed({ x1, y1, x2, y2, color }: { x1: number; y1: number; x2: number; y2: number; color: string }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.6} strokeDasharray="5 4" />
}

function FeynmanLabel({ x, y, children, color }: { x: number; y: number; children: string; color: string }) {
  return (
    <text x={x} y={y} fontSize={11} fill={color} fontFamily={mono} textAnchor="middle">
      {children}
    </text>
  )
}

function FeynmanFrame({
  title,
  caption,
  children,
}: {
  title: string
  caption: string
  children: ReactNode
}) {
  return (
    <GlassPanel style={{ padding: 16 }}>
      <div style={{ fontSize: 10, letterSpacing: 2, color: ACCENT, marginBottom: 10 }}>{title}</div>
      <svg viewBox="0 0 400 250" style={{ width: '100%', height: 'auto', display: 'block' }}>
        {children}
      </svg>
      <div style={{ fontSize: 10, lineHeight: 1.7, color: '#9fb8d6', marginTop: 10 }}>{caption}</div>
    </GlassPanel>
  )
}

// Diagrama 1: vértice QED básico — e⁻ entra, emite γ, sigue como e⁻.
function DiagramQEDVertex() {
  const c = ACCENT
  return (
    <FeynmanFrame
      title="01 // VÉRTICE QED BÁSICO"
      caption='Un electrón (e⁻) entra desde la izquierda, emite un fotón virtual (γ) en el vértice y continúa como e⁻. Este único vértice es el ladrillo fundamental de toda la electrodinámica cuántica: cualquier proceso con electromagnetismo se construye combinando copias de este trazo.'
    >
      <FeynmanFermion x1={30} y1={200} x2={200} y2={125} color={c} />
      <FeynmanFermion x1={200} y1={125} x2={370} y2={60} color={c} />
      <FeynmanWave x1={200} y1={125} x2={340} y2={210} color={c} />
      <circle cx={200} cy={125} r={3} fill={c} />
      <FeynmanLabel x={70} y={190} color={c}>e⁻</FeynmanLabel>
      <FeynmanLabel x={330} y={55} color={c}>e⁻</FeynmanLabel>
      <FeynmanLabel x={300} y={220} color={c}>γ</FeynmanLabel>
    </FeynmanFrame>
  )
}

// Diagrama 2: aniquilación e⁻ + e⁺ → γ + γ
function DiagramAnnihilation() {
  const c = ACCENT
  return (
    <FeynmanFrame
      title="02 // ANIQUILACIÓN ELECTRÓN-POSITRÓN"
      caption="Un electrón (e⁻) y un positrón (e⁺, su antipartícula — flecha hacia atrás en el tiempo) entran desde la izquierda y se encuentran en un vértice. Ahí se aniquilan por completo: la línea de fermión se vuelve virtual, viaja un instante, y en un segundo vértice se materializa como dos fotones (γ) que salen hacia la derecha. e⁻ + e⁺ → γ + γ."
    >
      <FeynmanFermion x1={20} y1={60} x2={150} y2={125} color={c} />
      <FeynmanFermion x1={150} y1={125} x2={20} y2={190} color={c} reverse />
      <line x1={150} y1={125} x2={250} y2={125} stroke={c} strokeWidth={1.2} strokeDasharray="2 3" opacity={0.7} />
      <FeynmanWave x1={250} y1={125} x2={380} y2={60} color={c} />
      <FeynmanWave x1={250} y1={125} x2={380} y2={190} color={c} />
      <circle cx={150} cy={125} r={3} fill={c} />
      <circle cx={250} cy={125} r={3} fill={c} />
      <FeynmanLabel x={60} y={50} color={c}>e⁻</FeynmanLabel>
      <FeynmanLabel x={60} y={205} color={c}>e⁺</FeynmanLabel>
      <FeynmanLabel x={200} y={115} color={c}>e⁻ virtual</FeynmanLabel>
      <FeynmanLabel x={360} y={48} color={c}>γ</FeynmanLabel>
      <FeynmanLabel x={360} y={205} color={c}>γ</FeynmanLabel>
    </FeynmanFrame>
  )
}

// Diagrama 3: dispersión Compton — e⁻ + γ → e⁻ + γ
function DiagramCompton() {
  const c = ACCENT
  return (
    <FeynmanFrame
      title="03 // DISPERSIÓN COMPTON"
      caption="Un electrón (e⁻) y un fotón (γ) entran desde la izquierda. En el primer vértice el electrón absorbe al fotón y queda como línea virtual; en el segundo vértice emite un nuevo fotón y sale como e⁻ real. Dos vértices QED conectados por una línea interna de electrón virtual. e⁻ + γ → e⁻ + γ."
    >
      <FeynmanFermion x1={20} y1={60} x2={150} y2={125} color={c} />
      <FeynmanWave x1={20} y1={195} x2={150} y2={125} color={c} />
      <line x1={150} y1={125} x2={250} y2={125} stroke={c} strokeWidth={1.2} strokeDasharray="2 3" opacity={0.7} />
      <FeynmanFermion x1={250} y1={125} x2={380} y2={60} color={c} />
      <FeynmanWave x1={250} y1={125} x2={380} y2={195} color={c} />
      <circle cx={150} cy={125} r={3} fill={c} />
      <circle cx={250} cy={125} r={3} fill={c} />
      <FeynmanLabel x={60} y={50} color={c}>e⁻</FeynmanLabel>
      <FeynmanLabel x={60} y={210} color={c}>γ</FeynmanLabel>
      <FeynmanLabel x={200} y={115} color={c}>e⁻ virtual</FeynmanLabel>
      <FeynmanLabel x={355} y={50} color={c}>e⁻</FeynmanLabel>
      <FeynmanLabel x={355} y={210} color={c}>γ</FeynmanLabel>
    </FeynmanFrame>
  )
}

// Diagrama 4: decaimiento beta — d → u + W⁻, W⁻ → e⁻ + ν̄e
function DiagramBetaDecay() {
  const c = ACCENT
  return (
    <FeynmanFrame
      title="04 // DECAIMIENTO BETA (FUERZA DÉBIL)"
      caption="Dentro de un neutrón, un quark down (d) se convierte en un quark up (u) emitiendo un bosón W⁻ virtual (línea discontinua). Ese W⁻ decae de inmediato en un electrón (e⁻) y un antineutrino electrónico (ν̄e). Dos vértices de interacción débil unidos por la línea interna del W⁻: d → u + W⁻, W⁻ → e⁻ + ν̄e. Es el mecanismo detrás del decaimiento beta nuclear."
    >
      <FeynmanFermion x1={20} y1={125} x2={160} y2={70} color={c} />
      <FeynmanFermion x1={160} y1={70} x2={320} y2={30} color={c} />
      <FeynmanDashed x1={160} y1={70} x2={160} y2={210} color={c} />
      <FeynmanFermion x1={160} y1={210} x2={320} y2={170} color={c} />
      <FeynmanFermion x1={160} y1={210} x2={320} y2={240} color={c} reverse />
      <circle cx={160} cy={70} r={3} fill={c} />
      <circle cx={160} cy={210} r={3} fill={c} />
      <FeynmanLabel x={60} y={115} color={c}>d</FeynmanLabel>
      <FeynmanLabel x={300} y={20} color={c}>u</FeynmanLabel>
      <FeynmanLabel x={185} y={140} color={c}>W⁻</FeynmanLabel>
      <FeynmanLabel x={300} y={160} color={c}>e⁻</FeynmanLabel>
      <FeynmanLabel x={295} y={248} color={c}>ν̄e</FeynmanLabel>
    </FeynmanFrame>
  )
}

// ---------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------

export default function ArchivoParticulasPage() {
  return (
    <div
      style={{
        background: '#000205',
        minHeight: '100vh',
        fontFamily: mono,
        color: '#c8daf0',
        position: 'relative',
      }}
    >
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 920, margin: '0 auto', padding: '96px 24px 140px' }}>
        {/* 1. Encabezado */}
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${ACCENT}55`, marginBottom: 16 }}>
          NPX-QFT-00 // DOCUMENTO TÉCNICO ARCHIVADO
        </div>
        <h1
          style={{
            fontSize: 'clamp(30px, 6vw, 46px)',
            fontWeight: 700,
            letterSpacing: 8,
            color: ACCENT,
            textShadow: `0 0 40px ${ACCENT}55`,
            marginBottom: 20,
            lineHeight: 1.05,
          }}
        >
          ATLAS DE PARTÍCULAS
        </h1>
        <p
          style={{
            fontSize: 11,
            lineHeight: 2.1,
            letterSpacing: 0.4,
            color: '#8fb8d6',
            maxWidth: 640,
            marginBottom: 88,
            borderLeft: `1px solid ${ACCENT}33`,
            paddingLeft: 22,
          }}
        >
          Mapa completo del Modelo Estándar de física de partículas: las partículas elementales
          conocidas, las cuatro interacciones fundamentales y los diagramas de Feynman que describen
          cómo interactúan. Todos los valores son los aceptados por el consenso experimental actual
          (PDG). Documento técnico, sin relación con el lore del proxyverso.
        </p>

        {/* 2. Tabla del Modelo Estándar */}
        <div style={{ marginBottom: 110 }}>
          <SectionTag>SECCIÓN 01</SectionTag>
          <SectionTitle roman="I">MODELO ESTÁNDAR — PARTÍCULAS ELEMENTALES</SectionTitle>

          <p style={{ fontSize: 11, lineHeight: 1.9, color: '#9fb8d6', maxWidth: 680, marginBottom: 36 }}>
            Doce fermiones de materia (seis quarks, seis leptones, agrupados en tres generaciones
            cada familia) más los bosones que median las interacciones entre ellos, y el bosón de
            Higgs. Cada fermión listado tiene además su antipartícula correspondiente, con la misma
            masa y espín pero carga opuesta.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 28, marginBottom: 32 }}>
            <GlassPanel>
              <div style={{ fontSize: 11, letterSpacing: 3, color: ACCENT, marginBottom: 6 }}>QUARKS</div>
              <div style={{ fontSize: 9, color: '#7a94ac', marginBottom: 16, lineHeight: 1.6 }}>
                Spin 1/2 · carga de color (rojo/verde/azul) · confinados dentro de hadrones, nunca
                libres · cada uno tiene antiquark de carga opuesta
              </div>
              <GenerationRow generations={QUARK_GENERATIONS} color={ACCENT} />
            </GlassPanel>

            <GlassPanel>
              <div style={{ fontSize: 11, letterSpacing: 3, color: ACCENT, marginBottom: 6 }}>LEPTONES</div>
              <div style={{ fontSize: 9, color: '#7a94ac', marginBottom: 16, lineHeight: 1.6 }}>
                Spin 1/2 · sin carga de color · los neutrinos apenas interactúan con la materia
                ordinaria
              </div>
              <GenerationRow generations={LEPTON_GENERATIONS} color={ACCENT} />
            </GlassPanel>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 28 }}>
            <GlassPanel>
              <div style={{ fontSize: 11, letterSpacing: 3, color: ACCENT, marginBottom: 6 }}>BOSONES DE GAUGE</div>
              <div style={{ fontSize: 9, color: '#7a94ac', marginBottom: 16, lineHeight: 1.6 }}>
                Spin 1 · mediadores de fuerza — cada interacción fundamental (salvo gravedad) tiene
                su propio bosón portador
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
                {GAUGE_BOSONS.map(p => (
                  <ParticleCard key={p.symbol} p={p} color={ACCENT} />
                ))}
              </div>
            </GlassPanel>

            <GlassPanel>
              <div style={{ fontSize: 11, letterSpacing: 3, color: ACCENT, marginBottom: 6 }}>BOSÓN DE HIGGS</div>
              <div style={{ fontSize: 9, color: '#7a94ac', marginBottom: 16, lineHeight: 1.6 }}>
                Spin 0 — el único escalar fundamental conocido
              </div>
              <ParticleCard p={HIGGS} color={ACCENT} />
            </GlassPanel>
          </div>
        </div>

        {/* 3. Las cuatro interacciones fundamentales */}
        <div style={{ marginBottom: 110 }}>
          <SectionTag>SECCIÓN 02</SectionTag>
          <SectionTitle roman="II">LAS CUATRO INTERACCIONES FUNDAMENTALES</SectionTitle>

          <GlassPanel style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5, minWidth: 640 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${ACCENT}33` }}>
                    {['INTERACCIÓN', 'MEDIADOR', 'INTENSIDAD RELATIVA', 'ALCANCE', 'AFECTA A'].map(h => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '14px 16px',
                          color: ACCENT,
                          letterSpacing: 1.5,
                          fontSize: 9,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INTERACTIONS.map((row, i) => (
                    <tr key={row.name} style={{ borderBottom: i < INTERACTIONS.length - 1 ? `1px solid ${ACCENT}18` : undefined }}>
                      <td style={{ padding: '14px 16px', color: '#e8f2ff', letterSpacing: 1, fontWeight: 700 }}>{row.name}</td>
                      <td style={{ padding: '14px 16px', color: '#c8daf0' }}>{row.mediator}</td>
                      <td style={{ padding: '14px 16px', color: '#c8daf0' }}>{row.strength}</td>
                      <td style={{ padding: '14px 16px', color: '#c8daf0' }}>{row.range}</td>
                      <td style={{ padding: '14px 16px', color: '#9fb8d6' }}>
                        {row.affects}
                        {row.note && (
                          <div style={{ fontSize: 9, color: `${ACCENT}99`, marginTop: 4 }}>{row.note}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassPanel>

          <p style={{ fontSize: 11, lineHeight: 1.9, color: '#9fb8d6', maxWidth: 680, marginTop: 24 }}>
            La gravedad todavía no está unificada con las otras tres interacciones en una teoría
            cuántica funcional. El Modelo Estándar describe con enorme precisión lo fuerte, lo
            electromagnético y lo débil, pero no incluye la gravedad — encontrar una teoría
            cuántica de la gravedad sigue siendo uno de los problemas abiertos centrales de la
            física fundamental.
          </p>
        </div>

        {/* 4. Diagramas de Feynman */}
        <div style={{ marginBottom: 110 }}>
          <SectionTag>SECCIÓN 03</SectionTag>
          <SectionTitle roman="III">DIAGRAMAS DE FEYNMAN</SectionTitle>

          <p style={{ fontSize: 11, lineHeight: 1.9, color: '#9fb8d6', maxWidth: 680, marginBottom: 32 }}>
            Convención usada en todos los diagramas de esta sección: el tiempo avanza de izquierda a
            derecha. Línea recta con flecha = fermión (flecha hacia adelante = partícula, hacia
            atrás = antipartícula). Línea ondulada = fotón. Línea discontinua = bosón W/Z o Higgs.
            Cada vértice es un punto de interacción real entre campos cuánticos.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 24 }}>
            <DiagramQEDVertex />
            <DiagramAnnihilation />
            <DiagramCompton />
            <DiagramBetaDecay />
          </div>
        </div>

        {/* 5. Notas adicionales */}
        <div style={{ marginBottom: 90 }}>
          <SectionTag>SECCIÓN 04</SectionTag>
          <SectionTitle roman="IV">NOTAS ADICIONALES</SectionTitle>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: '#9fb8d6', margin: 0 }}>
              <strong style={{ color: '#c8daf0' }}>Espín y estadística.</strong> Toda partícula
              elemental es o un fermión (spin semientero — 1/2 para quarks y leptones) o un bosón
              (spin entero — 0 para Higgs, 1 para los bosones de gauge). Los fermiones obedecen el
              principio de exclusión de Pauli: dos fermiones idénticos no pueden ocupar el mismo
              estado cuántico al mismo tiempo. Los bosones no tienen esa restricción y pueden
              acumularse en un mismo estado, lo que permite fenómenos como el láser o la
              superconductividad.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: '#9fb8d6', margin: 0 }}>
              <strong style={{ color: '#c8daf0' }}>Materia y antimateria.</strong> Cada fermión
              tiene una antipartícula correspondiente: misma masa, mismo espín, carga eléctrica (y
              otros números cuánticos) exactamente opuestos. El positrón (e⁺) es la antipartícula
              del electrón; cada quark tiene su antiquark. Cuando una partícula y su antipartícula
              se encuentran pueden aniquilarse, convirtiendo su masa en energía — ver el diagrama 02
              arriba.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: '#9fb8d6', margin: 0 }}>
              <strong style={{ color: '#c8daf0' }}>Lo que el Modelo Estándar no explica.</strong>{' '}
              Pese a décadas de confirmación experimental precisa, el Modelo Estándar no da cuenta
              de la materia oscura, no explica la energía oscura, y no incluye una descripción
              cuántica de la gravedad. Son, hoy, los problemas abiertos centrales de la física
              fundamental.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: `1px solid ${ACCENT}22`,
            paddingTop: 28,
            fontSize: 9,
            letterSpacing: 3,
            color: `${ACCENT}44`,
          }}
        >
          NPX-QFT-00 // DOCUMENTO ARCHIVADO — SIN ÍNDICE, SIN ENLACE ENTRANTE. SI LLEGASTE ACÁ FUE PORQUE SABÍAS LA RUTA.
        </div>
      </div>
    </div>
  )
}
