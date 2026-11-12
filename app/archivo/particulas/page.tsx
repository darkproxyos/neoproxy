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
// Datos — antipartículas
// ---------------------------------------------------------------------

const ANTIQUARKS: Particle[] = [
  { symbol: 'ū', name: 'ANTI-ARRIBA', charge: '−2/3', spin: '1/2', mass: '≈ 2.2 MeV/c²' },
  { symbol: 'd̄', name: 'ANTI-ABAJO', charge: '+1/3', spin: '1/2', mass: '≈ 4.7 MeV/c²' },
  { symbol: 'c̄', name: 'ANTI-ENCANTO', charge: '−2/3', spin: '1/2', mass: '≈ 1.27 GeV/c²' },
  { symbol: 's̄', name: 'ANTI-EXTRAÑO', charge: '+1/3', spin: '1/2', mass: '≈ 95 MeV/c²' },
  { symbol: 't̄', name: 'ANTI-CIMA', charge: '−2/3', spin: '1/2', mass: '≈ 173 GeV/c²' },
  { symbol: 'b̄', name: 'ANTI-FONDO', charge: '+1/3', spin: '1/2', mass: '≈ 4.18 GeV/c²' },
]

const ANTILEPTONS: Particle[] = [
  { symbol: 'e⁺', name: 'POSITRÓN', charge: '+1', spin: '1/2', mass: '≈ 0.511 MeV/c²' },
  { symbol: 'ν̄e', name: 'ANTINEUTRINO ELECTRÓNICO', charge: '0', spin: '1/2', mass: 'casi nula' },
  { symbol: 'μ⁺', name: 'ANTIMUÓN', charge: '+1', spin: '1/2', mass: '≈ 105.7 MeV/c²' },
  { symbol: 'ν̄μ', name: 'ANTINEUTRINO MUÓNICO', charge: '0', spin: '1/2', mass: 'casi nula' },
  { symbol: 'τ⁺', name: 'ANTITAU', charge: '+1', spin: '1/2', mass: '≈ 1776.9 MeV/c²' },
  { symbol: 'ν̄τ', name: 'ANTINEUTRINO TAUÓNICO', charge: '0', spin: '1/2', mass: 'casi nula' },
]

// ---------------------------------------------------------------------
// Datos — línea de tiempo de descubrimientos
// ---------------------------------------------------------------------

type TimelineEntry = { year: string; title: string; detail: string }

const DISCOVERY_TIMELINE: TimelineEntry[] = [
  { year: '1897', title: 'Electrón', detail: 'J.J. Thomson — primera partícula subatómica identificada, mide su relación carga/masa en rayos catódicos' },
  { year: '1919', title: 'Protón', detail: 'Ernest Rutherford identifica el núcleo del hidrógeno como partícula fundamental de toda la materia nuclear' },
  { year: '1932', title: 'Neutrón y positrón', detail: 'James Chadwick descubre el neutrón; Carl Anderson observa el positrón en rayos cósmicos, confirmando la antimateria predicha por Dirac en 1928' },
  { year: '1937', title: 'Muón', detail: 'Anderson y Neddermeyer lo encuentran en rayos cósmicos — inicialmente confundido con el "mesón" que predecía Yukawa' },
  { year: '1947', title: 'Pión', detail: 'Cecil Powell lo identifica en emulsión fotográfica — el verdadero mediador de Yukawa de la fuerza nuclear' },
  { year: '1956', title: 'Neutrino', detail: 'Clyde Cowan y Frederick Reines detectan el antineutrino electrónico cerca de un reactor nuclear, 26 años después de que Pauli lo postulara' },
  { year: '1964', title: 'Quarks y el barión Ω⁻', detail: 'Gell-Mann y Zweig proponen los quarks de forma independiente; el descubrimiento del Ω⁻ confirma el modelo' },
  { year: '1968–69', title: 'Estructura interna del protón', detail: 'Dispersión profundamente inelástica en SLAC muestra que el protón no es puntual — primera evidencia directa de los quarks' },
  { year: '1974', title: 'Quark charm (J/ψ)', detail: '"Revolución de Noviembre" — descubierto simultáneamente en SLAC y Brookhaven' },
  { year: '1975', title: 'Tau', detail: 'Martin Perl lo descubre en SLAC — un tercer leptón cargado, inesperado' },
  { year: '1977', title: 'Quark bottom (Upsilon)', detail: 'Fermilab' },
  { year: '1979', title: 'Gluón', detail: 'Observado indirectamente en eventos de tres chorros de partículas en el colisionador PETRA (DESY)' },
  { year: '1983', title: 'Bosones W y Z', detail: 'CERN, experimentos UA1/UA2 — Carlo Rubbia y Simon van der Meer, Nobel 1984' },
  { year: '1995', title: 'Quark top', detail: 'Fermilab, Tevatron — el último quark, con una masa sorprendentemente cercana a la del átomo de oro' },
  { year: '1998–2001', title: 'Oscilación de neutrinos', detail: 'Super-Kamiokande y SNO — implica que los neutrinos tienen masa' },
  { year: '2012', title: 'Bosón de Higgs', detail: 'CERN, ATLAS y CMS — la última pieza del Modelo Estándar, 48 años después de ser propuesto' },
  { year: '2015', title: 'Ondas gravitacionales', detail: 'LIGO detecta la fusión de dos agujeros negros — no es una partícula, pero confirma una predicción de Einstein de 1916 y abre una ventana observacional nueva para la física fundamental' },
]

// ---------------------------------------------------------------------
// Datos — canales de decaimiento del Higgs (branching ratios, mH ≈ 125 GeV)
// ---------------------------------------------------------------------

const HIGGS_BRANCHING: { channel: string; pct: number }[] = [
  { channel: 'H⁰ → bb̄', pct: 58.2 },
  { channel: 'H⁰ → W⁺W⁻*', pct: 21.4 },
  { channel: 'H⁰ → gg', pct: 8.2 },
  { channel: 'H⁰ → τ⁺τ⁻', pct: 6.3 },
  { channel: 'H⁰ → cc̄', pct: 2.9 },
  { channel: 'H⁰ → ZZ*', pct: 2.6 },
  { channel: 'H⁰ → γγ', pct: 0.23 },
]

// ---------------------------------------------------------------------
// Datos — más allá del Modelo Estándar (especulativo, sin confirmación
// experimental directa — marcado explícitamente como tal)
// ---------------------------------------------------------------------

type BsmTopic = { title: string; detail: string }

const BSM_TOPICS: BsmTopic[] = [
  {
    title: 'MATERIA OSCURA',
    detail: 'Evidencia gravitacional abrumadora (curvas de rotación galáctica, lentes gravitacionales, el fondo cósmico de microondas) de que ≈27% del universo es materia que no emite ni absorbe luz. Candidatos hipotéticos: WIMPs (partículas masivas de interacción débil), axiones, neutrinos estériles. Ninguno detectado directamente todavía, pese a décadas de búsqueda (XENON, LUX-ZEPLIN y otros detectores subterráneos).',
  },
  {
    title: 'ENERGÍA OSCURA',
    detail: '≈68% del universo — la causa de su expansión acelerada, descubierta por observaciones de supernovas tipo Ia en 1998 (Nobel de Física 2011). Su naturaleza es, hoy, completamente desconocida.',
  },
  {
    title: 'SUPERSIMETRÍA (SUSY)',
    detail: 'Hipótesis de que cada partícula del Modelo Estándar tiene un "compañero" supersimétrico con espín distinto en 1/2 (ej. selectrón para el electrón, fotino para el fotón). Buscada activamente en el LHC — sin evidencia confirmada hasta la fecha, lo que ha descartado las versiones más simples de la teoría.',
  },
  {
    title: 'GRAN UNIFICACIÓN (GUT)',
    detail: 'La conjetura de que las interacciones fuerte, débil y electromagnética se funden en una sola fuerza a energías extremas (≈10¹⁶ GeV). Las tres constantes de acoplamiento casi convergen a esa escala — de forma mucho más precisa en extensiones supersimétricas —, una de las pistas motivacionales para SUSY, aunque la convergencia por sí sola no es una prueba.',
  },
  {
    title: 'GRAVEDAD CUÁNTICA Y DIMENSIONES EXTRA',
    detail: 'Teoría de cuerdas, gravedad cuántica de lazos, modelos con dimensiones espaciales adicionales — distintos intentos de incluir la gravedad en un marco cuántico. Ninguno cuenta con confirmación experimental directa; algunos (dimensiones extra "grandes") fueron parcialmente descartados por los límites de energía ya explorados en el LHC.',
  },
]

// ---------------------------------------------------------------------
// Datos — hadrones (partículas compuestas: quarks confinados en tríos
// o pares quark-antiquark). No son partículas elementales, pero son la
// gran mayoría de la materia hadrónica observable — protón y neutrón
// incluidos — y faltaban en la primera versión de este archivo.
// ---------------------------------------------------------------------

type Hadron = {
  symbol: string
  name: string
  content: string
  charge: string
  spin: string
  mass: string
  note?: string
}

const BARYONS: Hadron[] = [
  { symbol: 'p', name: 'PROTÓN', content: 'uud', charge: '+1', spin: '1/2', mass: '≈ 938.272 MeV/c²', note: 'estable — límite experimental de vida media > 10³⁴ años, nunca se observó decaer' },
  { symbol: 'n', name: 'NEUTRÓN', content: 'udd', charge: '0', spin: '1/2', mass: '≈ 939.565 MeV/c²', note: 'libre decae en ≈ 879 s vía n → p + e⁻ + ν̄e (decaimiento beta)' },
  { symbol: 'Λ⁰', name: 'LAMBDA', content: 'uds', charge: '0', spin: '1/2', mass: '≈ 1115.7 MeV/c²', note: 'vida media ≈ 2.6×10⁻¹⁰ s — el primer barión "extraño" descubierto (1950)' },
  { symbol: 'Σ⁺/Σ⁰/Σ⁻', name: 'SIGMA', content: 'uus / uds / dds', charge: '+1 / 0 / −1', spin: '1/2', mass: '≈ 1189–1197 MeV/c²' },
  { symbol: 'Ξ⁰/Ξ⁻', name: 'XI (CASCADA)', content: 'uss / dss', charge: '0 / −1', spin: '1/2', mass: '≈ 1315–1322 MeV/c²' },
  { symbol: 'Ω⁻', name: 'OMEGA', content: 'sss', charge: '−1', spin: '3/2', mass: '≈ 1672.5 MeV/c²', note: 'predicho por Gell-Mann en 1962 y descubierto en 1964 — confirmación histórica del modelo de quarks (eightfold way)' },
]

const MESONS: Hadron[] = [
  { symbol: 'π⁺/π⁻/π⁰', name: 'PIÓN', content: 'ud̄ / dū / mezcla uū,dd̄', charge: '+1 / −1 / 0', spin: '0', mass: '≈ 139.6 / 139.6 / 135.0 MeV/c²', note: 'el mesón más liviano — mediaba la fuerza nuclear en el modelo de Yukawa (1935)' },
  { symbol: 'K⁺/K⁻/K⁰', name: 'KAÓN', content: 'us̄ / sū / ds̄', charge: '+1 / −1 / 0', spin: '0', mass: '≈ 493.7 / 493.7 / 497.6 MeV/c²', note: 'lleva extrañeza — su decaimiento inesperadamente lento llevó al descubrimiento de la extrañeza como número cuántico' },
  { symbol: 'J/ψ', name: 'J/PSI', content: 'cc̄', charge: '0', spin: '1', mass: '≈ 3096.9 MeV/c²', note: 'descubierto simultáneamente en SLAC y Brookhaven en 1974 ("Revolución de Noviembre") — confirmó la existencia del quark charm' },
  { symbol: 'Υ', name: 'UPSILON', content: 'bb̄', charge: '0', spin: '1', mass: '≈ 9460.3 MeV/c²', note: 'descubierto en Fermilab en 1977 — confirmó la existencia del quark bottom' },
]

// ---------------------------------------------------------------------
// Datos — números cuánticos y leyes de conservación
// ---------------------------------------------------------------------

type ConservationLaw = {
  name: string
  symbol: string
  conserved: string
  note: string
}

const CONSERVATION_LAWS: ConservationLaw[] = [
  { name: 'Carga eléctrica', symbol: 'Q', conserved: 'Siempre', note: 'ley exacta, ligada a la simetría de gauge U(1) electromagnética' },
  { name: 'Número bariónico', symbol: 'B', conserved: 'Siempre (observado)', note: 'bariones = +1, antibariones = −1, todo lo demás = 0 — nunca se observó violarse, aunque muchas teorías más allá del Modelo Estándar predicen una violación minúscula (decaimiento del protón, nunca detectado)' },
  { name: 'Número leptónico', symbol: 'Le, Lμ, Lτ', conserved: 'Por sabor: violado · total: conservado', note: 'la oscilación de neutrinos mezcla sabores leptónicos — el número leptónico total sigue conservado, pero cada Lℓ individual no' },
  { name: 'Extrañeza', symbol: 'S', conserved: 'Fuerte/EM: sí · Débil: no', note: 'por eso las partículas "extrañas" (con quark s) decaen lento, solo vía interacción débil' },
  { name: 'Encanto / belleza / top-ness', symbol: 'C, B′, T', conserved: 'Fuerte/EM: sí · Débil: no', note: 'mismo patrón que la extrañeza, para las generaciones 2ª y 3ª de quarks' },
  { name: 'Isospín débil / hipercarga', symbol: 'T₃, Y', conserved: 'Antes de la ruptura electrodébil', note: 'números cuánticos del sector SU(2)_L × U(1)_Y — pierden su forma simple una vez roto el grupo de simetría por el campo de Higgs' },
]

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

function HadronCard({ h, color }: { h: Hadron; color: string }) {
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
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color, textShadow: `0 0 14px ${color}66`, lineHeight: 1 }}>
          {h.symbol}
        </div>
        <div style={{ fontSize: 9.5, letterSpacing: 1.2, color: '#c8daf0' }}>{h.name}</div>
      </div>
      <div style={{ fontSize: 9, color: `${color}99`, letterSpacing: 0.5 }}>contenido: {h.content}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
        <Stat label="CARGA" value={h.charge} color={color} />
        <Stat label="SPIN" value={h.spin} color={color} />
        <Stat label="MASA" value={h.mass} color={color} />
      </div>
      {h.note && (
        <div style={{ fontSize: 8.5, lineHeight: 1.5, color: '#7a94ac', marginTop: 4, letterSpacing: 0.2 }}>
          {h.note}
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

function TimelineRow({ entry, color, isLast }: { entry: TimelineEntry; color: string; isLast: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14, flexShrink: 0 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 10px ${color}aa`,
            flexShrink: 0,
            marginTop: 4,
          }}
        />
        {!isLast && <div style={{ width: 1, flexGrow: 1, background: `${color}33`, marginTop: 4 }} />}
      </div>
      <div style={{ paddingBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color, letterSpacing: 1, textShadow: `0 0 10px ${color}55` }}>
            {entry.year}
          </span>
          <span style={{ fontSize: 11, letterSpacing: 1, color: '#e8f2ff' }}>{entry.title}</span>
        </div>
        <div style={{ fontSize: 10, lineHeight: 1.7, color: '#8fa8bc', marginTop: 6, maxWidth: 580 }}>
          {entry.detail}
        </div>
      </div>
    </div>
  )
}

function HiggsBranchingChart({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {HIGGS_BRANCHING.map(row => (
        <div key={row.channel} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 92, fontSize: 10, color: '#c8daf0', flexShrink: 0, textAlign: 'right' }}>
            {row.channel}
          </div>
          <div style={{ flexGrow: 1, height: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.max(row.pct, 1.2)}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${color}55, ${color})`,
                boxShadow: `0 0 8px ${color}66`,
              }}
            />
          </div>
          <div style={{ width: 50, fontSize: 10, color: `${color}cc`, flexShrink: 0 }}>{row.pct}%</div>
        </div>
      ))}
    </div>
  )
}

// Gráfico esquemático de "corrida" de las constantes de acoplamiento —
// ilustrativo, no a escala real: muestra la forma cualitativa (1/α crece
// linealmente con log(E) en una teoría de gauge) y cómo las tres casi
// convergen cerca de la escala GUT, no valores numéricos exactos.
function UnificationPlot({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 420 220" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <line x1={40} y1={190} x2={400} y2={190} stroke={`${color}66`} strokeWidth={1} />
      <line x1={40} y1={190} x2={40} y2={20} stroke={`${color}66`} strokeWidth={1} />
      <text x={400} y={206} fontSize={9} fill={`${color}99`} fontFamily={mono} textAnchor="end">log(E) →</text>
      <text x={14} y={24} fontSize={9} fill={`${color}99`} fontFamily={mono}>1/α</text>

      <path d="M 50 70 L 390 40" stroke={color} strokeWidth={1.4} fill="none" opacity={0.9} />
      <path d="M 50 110 L 390 44" stroke={color} strokeWidth={1.4} fill="none" opacity={0.65} />
      <path d="M 50 175 L 390 48" stroke={color} strokeWidth={1.4} fill="none" opacity={0.4} />

      <text x={55} y={64} fontSize={10} fill={color} fontFamily={mono}>1/α₁ (hipercarga)</text>
      <text x={55} y={104} fontSize={10} fill={`${color}cc`} fontFamily={mono}>1/α₂ (débil)</text>
      <text x={55} y={169} fontSize={10} fill={`${color}99`} fontFamily={mono}>1/α₃ (fuerte)</text>

      <circle cx={382} cy={44} r={4} fill="none" stroke={color} strokeWidth={1.2} strokeDasharray="2 2" />
      <text x={400} y={18} fontSize={9} fill={`${color}aa`} fontFamily={mono} textAnchor="end">≈10¹⁶ GeV (escala GUT)</text>
    </svg>
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

// Gluón = línea rizada (bucles alternados), distinta de la onda lisa del
// fotón — convención estándar en los diagramas de QCD.
function FeynmanGluon({ x1, y1, x2, y2, color }: { x1: number; y1: number; x2: number; y2: number; color: string }) {
  const loops = 6
  const dx = (x2 - x1) / loops
  const dy = (y2 - y1) / loops
  const r = Math.hypot(dx, dy) / 2
  let d = `M ${x1} ${y1}`
  for (let i = 0; i < loops; i++) {
    const endx = x1 + dx * (i + 1)
    const endy = y1 + dy * (i + 1)
    const sweep = i % 2 === 0 ? 1 : 0
    d += ` A ${r} ${r} 0 1 ${sweep} ${endx} ${endy}`
  }
  return <path d={d} stroke={color} strokeWidth={1.4} fill="none" />
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

// Diagrama 5: decaimiento del muón — μ⁻ → e⁻ + ν̄e + νμ (fuerza débil)
function DiagramMuonDecay() {
  const c = ACCENT
  return (
    <FeynmanFrame
      title="05 // DECAIMIENTO DEL MUÓN"
      caption="Un muón (μ⁻) se convierte en su propio neutrino (νμ) emitiendo un W⁻ virtual. Ese W⁻ decae de inmediato en un electrón (e⁻) y un antineutrino electrónico (ν̄e). A diferencia del decaimiento beta, acá no hay cambio de quark — es un proceso puramente leptónico, pero mediado por el mismo bosón W. μ⁻ → e⁻ + ν̄e + νμ."
    >
      <FeynmanFermion x1={20} y1={125} x2={160} y2={70} color={c} />
      <FeynmanFermion x1={160} y1={70} x2={320} y2={30} color={c} />
      <FeynmanDashed x1={160} y1={70} x2={160} y2={210} color={c} />
      <FeynmanFermion x1={160} y1={210} x2={320} y2={170} color={c} />
      <FeynmanFermion x1={160} y1={210} x2={320} y2={240} color={c} reverse />
      <circle cx={160} cy={70} r={3} fill={c} />
      <circle cx={160} cy={210} r={3} fill={c} />
      <FeynmanLabel x={60} y={115} color={c}>μ⁻</FeynmanLabel>
      <FeynmanLabel x={300} y={20} color={c}>νμ</FeynmanLabel>
      <FeynmanLabel x={185} y={140} color={c}>W⁻</FeynmanLabel>
      <FeynmanLabel x={300} y={160} color={c}>e⁻</FeynmanLabel>
      <FeynmanLabel x={295} y={248} color={c}>ν̄e</FeynmanLabel>
    </FeynmanFrame>
  )
}

// Diagrama 6: aniquilación quark-antiquark en gluones — q + q̄ → g + g
function DiagramQuarkGluonAnnihilation() {
  const c = ACCENT
  return (
    <FeynmanFrame
      title="06 // ANIQUILACIÓN QUARK-ANTIQUARK (FUERZA FUERTE)"
      caption="El análogo fuerte del diagrama 02: un quark (q) y su antiquark (q̄) se aniquilan en un vértice de QCD y se materializan como dos gluones (g, líneas rizadas) en vez de fotones. Mismo esqueleto que la aniquilación electromagnética — cambia solo qué campo media la interacción. q + q̄ → g + g."
    >
      <FeynmanFermion x1={20} y1={60} x2={150} y2={125} color={c} />
      <FeynmanFermion x1={150} y1={125} x2={20} y2={190} color={c} reverse />
      <line x1={150} y1={125} x2={250} y2={125} stroke={c} strokeWidth={1.2} strokeDasharray="2 3" opacity={0.7} />
      <FeynmanGluon x1={250} y1={125} x2={380} y2={60} color={c} />
      <FeynmanGluon x1={250} y1={125} x2={380} y2={190} color={c} />
      <circle cx={150} cy={125} r={3} fill={c} />
      <circle cx={250} cy={125} r={3} fill={c} />
      <FeynmanLabel x={60} y={50} color={c}>q</FeynmanLabel>
      <FeynmanLabel x={60} y={205} color={c}>q̄</FeynmanLabel>
      <FeynmanLabel x={200} y={115} color={c}>q virtual</FeynmanLabel>
      <FeynmanLabel x={360} y={48} color={c}>g</FeynmanLabel>
      <FeynmanLabel x={360} y={205} color={c}>g</FeynmanLabel>
    </FeynmanFrame>
  )
}

// Diagrama 7: producción de Higgs por fusión de gluones (gg → H, vía un
// lazo virtual de quarks top) — el canal de producción dominante en el LHC.
function DiagramHiggsGluonFusion() {
  const c = ACCENT
  return (
    <FeynmanFrame
      title="07 // PRODUCCIÓN DE HIGGS POR FUSIÓN DE GLUONES"
      caption="Dos gluones (g) entran desde la izquierda y se acoplan a un lazo cerrado de quarks top virtuales (el quark más pesado domina el lazo, por su enorme acoplamiento de Yukawa al Higgs). El lazo se cierra emitiendo un bosón de Higgs (H⁰, línea discontinua) hacia la derecha. Es un diagrama de lazo (loop), no de árbol — y el canal de producción de Higgs más frecuente en el LHC. gg → H⁰."
    >
      <FeynmanGluon x1={20} y1={70} x2={140} y2={100} color={c} />
      <FeynmanGluon x1={20} y1={180} x2={140} y2={150} color={c} />
      <polygon points="140,100 140,150 200,125" fill="none" stroke={c} strokeWidth={1.4} />
      <FeynmanDashed x1={200} y1={125} x2={360} y2={125} color={c} />
      <FeynmanLabel x={55} y={60} color={c}>g</FeynmanLabel>
      <FeynmanLabel x={55} y={198} color={c}>g</FeynmanLabel>
      <FeynmanLabel x={168} y={95} color={c}>t</FeynmanLabel>
      <FeynmanLabel x={168} y={168} color={c}>t</FeynmanLabel>
      <FeynmanLabel x={280} y={115} color={c}>H⁰</FeynmanLabel>
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

        {/* sello de control de documento — gesto de archivo de laboratorio,
            no decoración narrativa: campos reales (clasificación, revisión,
            alcance), consistentes con el resto del tono técnico */}
        <div
          style={{
            display: 'inline-grid',
            gridTemplateColumns: 'auto auto',
            gap: '4px 24px',
            fontSize: 9,
            letterSpacing: 1,
            color: `${ACCENT}99`,
            border: `1px solid ${ACCENT}33`,
            padding: '12px 18px',
            marginBottom: 32,
          }}
        >
          <span style={{ color: `${ACCENT}55` }}>CLASIFICACIÓN</span><span style={{ color: '#c8daf0' }}>NO RESTRINGIDA — DATOS PÚBLICOS (PDG)</span>
          <span style={{ color: `${ACCENT}55` }}>REVISIÓN</span><span style={{ color: '#c8daf0' }}>03 — 14 SECCIONES</span>
          <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: '#c8daf0' }}>MODELO ESTÁNDAR + FRONTERA ESPECULATIVA</span>
        </div>

        <p
          style={{
            fontSize: 11,
            lineHeight: 2.1,
            letterSpacing: 0.4,
            color: '#8fb8d6',
            maxWidth: 640,
            marginBottom: 48,
            borderLeft: `1px solid ${ACCENT}33`,
            paddingLeft: 22,
          }}
        >
          Inventario completo de la física de partículas conocida: las partículas elementales del
          Modelo Estándar y sus antipartículas, los hadrones compuestos que forman la materia
          nuclear ordinaria, las leyes de conservación y números cuánticos que rigen cómo decaen,
          la estructura de simetría de gauge y el mecanismo de Higgs, la mezcla de quarks y la
          violación de CP, la oscilación de neutrinos, los diagramas de Feynman que describen cada
          interacción vértice por vértice, los grandes experimentos que midieron todo esto, y lo que
          hoy sigue sin explicación. Todos los valores son los aceptados por el consenso experimental
          actual (PDG — Particle Data Group); la frontera especulativa está marcada explícitamente
          como tal. Documento técnico, sin relación con el lore del proxyverso.
        </p>

        {/* índice — ancla directa a cada sección, el gesto de "documento
            real" en vez de scroll ciego en una página ya muy larga */}
        <nav
          style={{
            marginBottom: 88,
            border: `1px solid ${ACCENT}22`,
            padding: '20px 24px',
            maxWidth: 640,
          }}
        >
          <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}66`, marginBottom: 14 }}>
            ÍNDICE
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '6px 20px' }}>
            {[
              ['I', 'sec-01', 'Modelo Estándar — partículas elementales'],
              ['II', 'sec-02', 'Línea de tiempo de descubrimientos'],
              ['III', 'sec-03', 'Antipartículas'],
              ['IV', 'sec-04', 'Partículas compuestas — hadrones'],
              ['V', 'sec-05', 'Números cuánticos y conservación'],
              ['VI', 'sec-06', 'Las cuatro interacciones fundamentales'],
              ['VII', 'sec-07', 'Simetría de gauge y el Higgs'],
              ['VIII', 'sec-08', 'Matriz CKM y violación CP'],
              ['IX', 'sec-09', 'Oscilación de neutrinos'],
              ['X', 'sec-10', 'Constantes de acoplamiento'],
              ['XI', 'sec-11', 'Diagramas de Feynman'],
              ['XII', 'sec-12', 'CERN y los grandes experimentos'],
              ['XIII', 'sec-13', 'Más allá del Modelo Estándar'],
              ['XIV', 'sec-14', 'Notas adicionales'],
            ].map(([roman, id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                style={{
                  fontSize: 10.5,
                  color: '#9fb8d6',
                  textDecoration: 'none',
                  display: 'flex',
                  gap: 10,
                }}
              >
                <span style={{ color: `${ACCENT}88`, width: 22, flexShrink: 0 }}>{roman}</span>
                <span>{label}</span>
              </a>
            ))}
          </div>
        </nav>

        {/* 2. Tabla del Modelo Estándar */}
        <div id="sec-01" style={{ marginBottom: 110 }}>
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

        {/* 3. Línea de tiempo de descubrimientos */}
        <div id="sec-02" style={{ marginBottom: 110 }}>
          <SectionTag>SECCIÓN 02</SectionTag>
          <SectionTitle roman="II">LÍNEA DE TIEMPO DE DESCUBRIMIENTOS</SectionTitle>

          <p style={{ fontSize: 11, lineHeight: 1.9, color: '#9fb8d6', maxWidth: 680, marginBottom: 40 }}>
            Ninguna de las partículas de este archivo se dedujo de un escritorio y punto — cada una
            tiene una fecha, un experimento y nombres propios detrás. Más de un siglo de física
            experimental, desde el primer electrón hasta el Higgs.
          </p>

          <GlassPanel>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {DISCOVERY_TIMELINE.map((entry, i) => (
                <TimelineRow key={entry.year + entry.title} entry={entry} color={ACCENT} isLast={i === DISCOVERY_TIMELINE.length - 1} />
              ))}
            </div>
          </GlassPanel>
        </div>

        {/* 4. Antipartículas */}
        <div id="sec-03" style={{ marginBottom: 110 }}>
          <SectionTag>SECCIÓN 03</SectionTag>
          <SectionTitle roman="III">ANTIPARTÍCULAS</SectionTitle>

          <p style={{ fontSize: 11, lineHeight: 1.9, color: '#9fb8d6', maxWidth: 680, marginBottom: 36 }}>
            Cada fermión del listado anterior tiene una antipartícula: misma masa y espín, carga
            eléctrica (y todo otro número cuántico aditivo) exactamente invertida. Los bosones de
            gauge neutros (fotón, Z⁰, Higgs) son su propia antipartícula; W⁺ y W⁻ son antipartículas
            entre sí; cada uno de los ocho gluones tiene su contraparte de color/anticolor invertido
            entre los mismos ocho estados.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 28 }}>
            <GlassPanel>
              <div style={{ fontSize: 11, letterSpacing: 3, color: ACCENT, marginBottom: 6 }}>ANTIQUARKS</div>
              <div style={{ fontSize: 9, color: '#7a94ac', marginBottom: 16, lineHeight: 1.6 }}>
                Misma masa que su quark correspondiente, carga de color invertida (anticolor)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                {ANTIQUARKS.map(p => (
                  <ParticleCard key={p.symbol} p={p} color={ACCENT} />
                ))}
              </div>
            </GlassPanel>

            <GlassPanel>
              <div style={{ fontSize: 11, letterSpacing: 3, color: ACCENT, marginBottom: 6 }}>ANTILEPTONES</div>
              <div style={{ fontSize: 9, color: '#7a94ac', marginBottom: 16, lineHeight: 1.6 }}>
                El positrón fue la primera antipartícula observada (Anderson, 1932) — confirmó la
                predicción de Dirac de 1928
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                {ANTILEPTONS.map(p => (
                  <ParticleCard key={p.symbol} p={p} color={ACCENT} />
                ))}
              </div>
            </GlassPanel>
          </div>
        </div>

        {/* 5. Partículas compuestas — hadrones */}
        <div id="sec-04" style={{ marginBottom: 110 }}>
          <SectionTag>SECCIÓN 04</SectionTag>
          <SectionTitle roman="IV">PARTÍCULAS COMPUESTAS — HADRONES</SectionTitle>

          <p style={{ fontSize: 11, lineHeight: 1.9, color: '#9fb8d6', maxWidth: 680, marginBottom: 36 }}>
            Los quarks nunca aparecen libres — el confinamiento de color los obliga a agruparse en
            hadrones. Dos familias: bariones (tres quarks, número bariónico ±1 — protón y neutrón
            son los más livianos) y mesones (un quark y un antiquark, número bariónico 0). Son estas
            partículas compuestas, no los quarks sueltos, las que forman toda la materia nuclear
            ordinaria y las que se observan directamente en un detector de colisiones.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 28 }}>
            <GlassPanel>
              <div style={{ fontSize: 11, letterSpacing: 3, color: ACCENT, marginBottom: 6 }}>BARIONES</div>
              <div style={{ fontSize: 9, color: '#7a94ac', marginBottom: 16, lineHeight: 1.6 }}>
                qqq · spin 1/2 o 3/2 · el protón y el neutrón (nucleones) son la materia de todo
                núcleo atómico
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {BARYONS.map(h => (
                  <HadronCard key={h.symbol} h={h} color={ACCENT} />
                ))}
              </div>
            </GlassPanel>

            <GlassPanel>
              <div style={{ fontSize: 11, letterSpacing: 3, color: ACCENT, marginBottom: 6 }}>MESONES</div>
              <div style={{ fontSize: 9, color: '#7a94ac', marginBottom: 16, lineHeight: 1.6 }}>
                qq̄ · spin 0 o 1 · inestables, decaen rápido — nunca forman materia ordinaria estable
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {MESONS.map(h => (
                  <HadronCard key={h.symbol} h={h} color={ACCENT} />
                ))}
              </div>
            </GlassPanel>
          </div>
        </div>

        {/* 6. Números cuánticos y leyes de conservación */}
        <div id="sec-05" style={{ marginBottom: 110 }}>
          <SectionTag>SECCIÓN 05</SectionTag>
          <SectionTitle roman="V">NÚMEROS CUÁNTICOS Y LEYES DE CONSERVACIÓN</SectionTitle>

          <p style={{ fontSize: 11, lineHeight: 1.9, color: '#9fb8d6', maxWidth: 680, marginBottom: 36 }}>
            No todo lo que se conserva, se conserva siempre de la misma manera: algunos números
            cuánticos son leyes exactas, otros solo se respetan en ciertas interacciones y se violan
            en otras — y esa diferencia es, en sí misma, una pista sobre la estructura del Modelo
            Estándar.
          </p>

          <GlassPanel style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5, minWidth: 640 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${ACCENT}33` }}>
                    {['NÚMERO CUÁNTICO', 'SÍMBOLO', '¿SE CONSERVA?', 'NOTA'].map(h => (
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
                  {CONSERVATION_LAWS.map((row, i) => (
                    <tr key={row.name} style={{ borderBottom: i < CONSERVATION_LAWS.length - 1 ? `1px solid ${ACCENT}18` : undefined }}>
                      <td style={{ padding: '14px 16px', color: '#e8f2ff', letterSpacing: 0.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{row.name}</td>
                      <td style={{ padding: '14px 16px', color: ACCENT, whiteSpace: 'nowrap' }}>{row.symbol}</td>
                      <td style={{ padding: '14px 16px', color: '#c8daf0', whiteSpace: 'nowrap' }}>{row.conserved}</td>
                      <td style={{ padding: '14px 16px', color: '#9fb8d6', minWidth: 260 }}>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassPanel>
        </div>

        {/* 7. Las cuatro interacciones fundamentales */}
        <div id="sec-06" style={{ marginBottom: 110 }}>
          <SectionTag>SECCIÓN 06</SectionTag>
          <SectionTitle roman="VI">LAS CUATRO INTERACCIONES FUNDAMENTALES</SectionTitle>

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

        {/* 8. Simetría de gauge y el mecanismo de Higgs */}
        <div id="sec-07" style={{ marginBottom: 110 }}>
          <SectionTag>SECCIÓN 07</SectionTag>
          <SectionTitle roman="VII">SIMETRÍA DE GAUGE Y EL MECANISMO DE HIGGS</SectionTitle>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680, marginBottom: 40 }}>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: '#9fb8d6', margin: 0 }}>
              El Modelo Estándar completo es una teoría de gauge con grupo de simetría{' '}
              <strong style={{ color: ACCENT }}>SU(3)_C × SU(2)_L × U(1)_Y</strong>. Cada factor
              produce sus propios bosones mediadores: SU(3)_C (cromodinámica cuántica, QCD) tiene 8
              generadores → los 8 gluones; SU(2)_L (isospín débil) actúa solo sobre partículas de
              quiralidad izquierda — la interacción débil viola paridad, algo confirmado
              experimentalmente por Chien-Shiung Wu en 1956; U(1)_Y es la hipercarga débil.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: '#9fb8d6', margin: 0 }}>
              Antes de la ruptura de simetría, SU(2)_L × U(1)_Y predice cuatro bosones de gauge sin
              masa (W¹, W², W³, B). El campo de Higgs adquiere un valor de expectación de vacío
              distinto de cero (<strong style={{ color: ACCENT }}>v ≈ 246 GeV</strong>), y esa
              ruptura espontánea de simetría mezcla W³ y B en el fotón (γ, que queda sin masa) y el
              bosón Z⁰ (que adquiere masa) — el ángulo de mezcla se llama ángulo de Weinberg (θW, con
              sin²θW ≈ 0.231). W¹ y W² se combinan en W⁺ y W⁻, ambos masivos.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: '#9fb8d6', margin: 0 }}>
              Los fermiones no reciben su masa del mismo mecanismo geométrico — la adquieren por
              acoplamiento de Yukawa al campo de Higgs, con una intensidad de acoplamiento
              proporcional a la masa de cada fermión. El quark top, con un acoplamiento de Yukawa
              cercano a 1, es la partícula elemental conocida más pesada — casi tan masiva como el
              propio valor de expectación de vacío del Higgs.
            </p>
          </div>

          <div style={{ fontSize: 10, letterSpacing: 2, color: ACCENT, marginBottom: 14 }}>
            ESTRUCTURA DEL LAGRANGIANO (esquemática)
          </div>
          <GlassPanel style={{ marginBottom: 40 }}>
            <div style={{ fontFamily: mono, fontSize: 12, color: '#e8f2ff', marginBottom: 18, letterSpacing: 1 }}>
              ℒ_SM = ℒ_gauge + ℒ_fermión + ℒ_Higgs + ℒ_Yukawa
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { term: 'ℒ_gauge = −¼ G^a_μν G^aμν − ¼ W^a_μν W^aμν − ¼ B_μν B^μν', note: 'términos cinéticos de los campos de gauge — gluones (G), W, hipercarga (B)' },
                { term: 'ℒ_fermión = Σᵢ ψ̄ᵢ iγ^μ D_μ ψᵢ', note: 'términos cinéticos de los fermiones; la derivada covariante D_μ codifica todas sus interacciones de gauge' },
                { term: 'ℒ_Higgs = |D_μ Φ|² − V(Φ), V(Φ) = μ²Φ†Φ + λ(Φ†Φ)²', note: 'el potencial de Higgs — con μ² < 0, su forma de "sombrero mexicano" rompe la simetría electrodébil' },
                { term: 'ℒ_Yukawa = −y_f Ψ̄_L Φ Ψ_R + h.c.', note: 'da masa a los fermiones por acoplamiento al Higgs — y_f distinta para cada uno, de ahí la jerarquía de masas' },
              ].map(row => (
                <div key={row.term}>
                  <div style={{ fontFamily: mono, fontSize: 11, color: ACCENT, letterSpacing: 0.5 }}>{row.term}</div>
                  <div style={{ fontSize: 9.5, color: '#7a94ac', marginTop: 4, lineHeight: 1.6 }}>{row.note}</div>
                </div>
              ))}
            </div>
          </GlassPanel>

          <div style={{ fontSize: 10, letterSpacing: 2, color: ACCENT, marginBottom: 14 }}>
            CANALES DE DECAIMIENTO DEL HIGGS (branching ratios, m_H ≈ 125 GeV)
          </div>
          <GlassPanel>
            <HiggsBranchingChart color={ACCENT} />
            <div style={{ fontSize: 9.5, lineHeight: 1.7, color: '#7a94ac', marginTop: 18 }}>
              El canal más frecuente (H⁰ → bb̄) no es el más usado para descubrirlo — el ruido de
              fondo de la fuerte lo hace casi invisible en el LHC. Los canales que realmente
              permitieron el anuncio de 2012 fueron los más raros pero más limpios: H⁰ → γγ y
              H⁰ → ZZ* → 4 leptones, pese a representar apenas una fracción minúscula del total.
            </div>
          </GlassPanel>
        </div>

        {/* 9. Mezcla de quarks — matriz CKM y violación CP */}
        <div id="sec-08" style={{ marginBottom: 110 }}>
          <SectionTag>SECCIÓN 08</SectionTag>
          <SectionTitle roman="VIII">MEZCLA DE QUARKS — MATRIZ CKM Y VIOLACIÓN CP</SectionTitle>

          <p style={{ fontSize: 11, lineHeight: 1.9, color: '#9fb8d6', maxWidth: 680, marginBottom: 32 }}>
            Los autoestados de masa de los quarks (u, c, t / d, s, b) no coinciden exactamente con
            los autoestados que participan en la interacción débil — están mezclados por la matriz
            de Cabibbo-Kobayashi-Maskawa (CKM), una matriz unitaria 3×3 compleja. Esa mezcla es lo
            que permite que un quark cambie de generación en un decaimiento débil (ej. b → c), y sus
            fases complejas son, hoy, la fuente conocida de violación de CP en el sector de quarks —
            predicha por Kobayashi y Maskawa en 1973 y confirmada experimentalmente en BaBar (SLAC) y
            Belle (KEK) a comienzos de los 2000, lo que les valió el Nobel de Física 2008.
          </p>

          <GlassPanel>
            <div style={{ fontSize: 10, letterSpacing: 2, color: ACCENT, marginBottom: 14 }}>
              |V_CKM| — MAGNITUDES APROXIMADAS (parametrización de Wolfenstein)
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 11, minWidth: 320, margin: '0 auto' }}>
                <thead>
                  <tr>
                    <th />
                    <th style={{ padding: '6px 18px', color: `${ACCENT}99`, fontWeight: 400 }}>d</th>
                    <th style={{ padding: '6px 18px', color: `${ACCENT}99`, fontWeight: 400 }}>s</th>
                    <th style={{ padding: '6px 18px', color: `${ACCENT}99`, fontWeight: 400 }}>b</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { quark: 'u', values: ['0.974', '0.225', '0.0037'], diag: 0 },
                    { quark: 'c', values: ['0.225', '0.973', '0.041'], diag: 1 },
                    { quark: 't', values: ['0.0086', '0.040', '0.999'], diag: 2 },
                  ].map(row => (
                    <tr key={row.quark}>
                      <td style={{ padding: '6px 18px', color: `${ACCENT}99` }}>{row.quark}</td>
                      {row.values.map((v, i) => (
                        <td key={i} style={{ padding: '6px 18px', textAlign: 'center', color: i === row.diag ? ACCENT : '#c8daf0' }}>
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 9.5, lineHeight: 1.7, color: '#7a94ac', marginTop: 14 }}>
              Los elementos cercanos a la diagonal (Vud, Vcs, Vtb) están cerca de 1 — un quark
              "prefiere" decaer dentro de su propia generación. Los elementos lejos de la diagonal
              son progresivamente más chicos — cambiar dos generaciones a la vez (ej. t↔d) es mucho
              menos probable que cambiar una sola (ej. t↔b).
            </div>
          </GlassPanel>
        </div>

        {/* 10. Oscilación de neutrinos */}
        <div id="sec-09" style={{ marginBottom: 110 }}>
          <SectionTag>SECCIÓN 09</SectionTag>
          <SectionTitle roman="IX">OSCILACIÓN DE NEUTRINOS</SectionTitle>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: '#9fb8d6', margin: 0 }}>
              Super-Kamiokande (neutrinos atmosféricos, Japón, 1998) y el Observatorio de Neutrinos
              de Sudbury (neutrinos solares, Canadá, 2001) mostraron que un neutrino cambia de sabor
              —electrónico, muónico, tauónico— a medida que se propaga por el espacio. Ese
              descubrimiento les valió el Nobel de Física 2015 a Takaaki Kajita y Arthur McDonald.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: '#9fb8d6', margin: 0 }}>
              La oscilación solo es posible si los neutrinos tienen masa — por minúscula que sea —
              contradiciendo la versión original del Modelo Estándar, que los postulaba exactamente
              sin masa. La probabilidad de oscilación depende de las <em>diferencias</em> entre los
              cuadrados de las masas de los tres estados de masa del neutrino, no de sus masas
              absolutas — por eso se conocen esas diferencias con precisión, pero no la escala
              absoluta de masa de ningún neutrino individual.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: '#9fb8d6', margin: 0 }}>
              Sigue abierta una pregunta central: ¿son los neutrinos partículas de Dirac (como el
              resto de los fermiones, con antipartícula distinta) o de Majorana (su propia
              antipartícula)? Los experimentos de doble decaimiento beta sin neutrinos buscan
              activamente una respuesta.
            </p>
          </div>
        </div>

        {/* 11. Constantes de acoplamiento y libertad asintótica */}
        <div id="sec-10" style={{ marginBottom: 110 }}>
          <SectionTag>SECCIÓN 10</SectionTag>
          <SectionTitle roman="X">CONSTANTES DE ACOPLAMIENTO Y LIBERTAD ASINTÓTICA</SectionTitle>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680, marginBottom: 32 }}>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: '#9fb8d6', margin: 0 }}>
              Las "constantes" de acoplamiento de cada interacción no son constantes — dependen de
              la escala de energía a la que se miden, un efecto de renormalización en teoría
              cuántica de campos: las constantes "corren" con la energía.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: '#9fb8d6', margin: 0 }}>
              La constante de estructura fina (α, que fija la intensidad electromagnética) vale
              ≈ 1/137 a baja energía, pero crece — aunque muy poco — a energías más altas. La
              constante de acoplamiento fuerte (αs) hace exactamente lo contrario: es grande a baja
              energía (de ahí el confinamiento — los quarks nunca se observan libres) pero se
              vuelve pequeña a muy alta energía o muy corta distancia, un fenómeno llamado{' '}
              <strong style={{ color: ACCENT }}>libertad asintótica</strong>.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: '#9fb8d6', margin: 0 }}>
              La libertad asintótica fue descubierta teóricamente por David Gross, David Politzer y
              Frank Wilczek (Nobel de Física 2004) y es lo que permite tratar a los quarks dentro del
              protón como casi libres en colisiones de muy alta energía — exactamente lo que se
              observó primero en los experimentos de dispersión profundamente inelástica en SLAC a
              fines de los años 60, la evidencia experimental original de que el protón tenía
              estructura interna.
            </p>
          </div>

          <GlassPanel>
            <div style={{ fontSize: 10, letterSpacing: 2, color: ACCENT, marginBottom: 10 }}>
              CORRIDA DE LAS CONSTANTES DE ACOPLAMIENTO (esquemático)
            </div>
            <UnificationPlot color={ACCENT} />
            <div style={{ fontSize: 9.5, lineHeight: 1.7, color: '#7a94ac', marginTop: 14 }}>
              Gráfico ilustrativo, no a escala real: muestra la forma cualitativa de cómo 1/α
              (inverso de cada constante de acoplamiento) crece con la energía. En extensiones
              supersimétricas del Modelo Estándar, las tres curvas convergen de forma mucho más
              precisa cerca de la escala de Gran Unificación — ver Sección XIII.
            </div>
          </GlassPanel>
        </div>

        {/* 12. Diagramas de Feynman */}
        <div id="sec-11" style={{ marginBottom: 110 }}>
          <SectionTag>SECCIÓN 11</SectionTag>
          <SectionTitle roman="XI">DIAGRAMAS DE FEYNMAN</SectionTitle>

          <p style={{ fontSize: 11, lineHeight: 1.9, color: '#9fb8d6', maxWidth: 680, marginBottom: 32 }}>
            Convención usada en todos los diagramas de esta sección: el tiempo avanza de izquierda a
            derecha. Línea recta con flecha = fermión (flecha hacia adelante = partícula, hacia
            atrás = antipartícula). Línea ondulada = fotón. Línea rizada = gluón. Línea discontinua =
            bosón W/Z o Higgs. Cada vértice es un punto de interacción real entre campos cuánticos.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 24 }}>
            <DiagramQEDVertex />
            <DiagramAnnihilation />
            <DiagramCompton />
            <DiagramBetaDecay />
            <DiagramMuonDecay />
            <DiagramQuarkGluonAnnihilation />
            <DiagramHiggsGluonFusion />
          </div>
        </div>

        {/* 13. CERN y los grandes experimentos */}
        <div id="sec-12" style={{ marginBottom: 110 }}>
          <SectionTag>SECCIÓN 12</SectionTag>
          <SectionTitle roman="XII">CERN Y LOS GRANDES EXPERIMENTOS</SectionTitle>

          <p style={{ fontSize: 11, lineHeight: 1.9, color: '#9fb8d6', maxWidth: 680, marginBottom: 32 }}>
            Casi todos los valores de este documento fueron medidos, confirmados o descubiertos en
            un puñado de laboratorios de altas energías. El más grande en operación es el Gran
            Colisionador de Hadrones (LHC) del CERN, en la frontera franco-suiza cerca de Ginebra: un
            anillo subterráneo de 27 km de circunferencia que colisiona haces de protones a energías
            de hasta 13.6 TeV (Run 3, desde 2022) — la máquina más energética jamás construida.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { name: 'ATLAS', detail: 'A Toroidal LHC ApparatuS', note: 'detector de propósito general — co-descubrió el bosón de Higgs en 2012' },
              { name: 'CMS', detail: 'Compact Muon Solenoid', note: 'segundo detector de propósito general, diseño independiente de ATLAS — la confirmación cruzada entre ambos fue clave para anunciar el Higgs' },
              { name: 'LHCb', detail: 'LHC-beauty', note: 'especializado en física del quark bottom (b) — violación de CP y decaimientos raros' },
              { name: 'ALICE', detail: 'A Large Ion Collider Experiment', note: 'colisiones de iones pesados (plomo-plomo) — recrea el plasma de quarks y gluones, el estado de la materia microsegundos después del Big Bang' },
            ].map(exp => (
              <GlassPanel key={exp.name}>
                <div style={{ fontSize: 16, fontWeight: 700, color: ACCENT, letterSpacing: 2, textShadow: `0 0 12px ${ACCENT}55` }}>
                  {exp.name}
                </div>
                <div style={{ fontSize: 9, color: `${ACCENT}99`, marginTop: 4, marginBottom: 10, letterSpacing: 0.5 }}>
                  {exp.detail}
                </div>
                <div style={{ fontSize: 9.5, lineHeight: 1.6, color: '#9fb8d6' }}>{exp.note}</div>
              </GlassPanel>
            ))}
          </div>

          <p style={{ fontSize: 11, lineHeight: 1.9, color: '#9fb8d6', maxWidth: 680, marginTop: 28 }}>
            El 4 de julio de 2012, ATLAS y CMS anunciaron conjuntamente la observación de una nueva
            partícula compatible con el bosón de Higgs — la última pieza que faltaba para confirmar
            el Modelo Estándar completo, 48 años después de que Peter Higgs y otros propusieran el
            mecanismo que lleva su nombre.
          </p>
        </div>

        {/* 14. Más allá del Modelo Estándar */}
        <div id="sec-13" style={{ marginBottom: 110 }}>
          <SectionTag>SECCIÓN 13</SectionTag>
          <SectionTitle roman="XIII">MÁS ALLÁ DEL MODELO ESTÁNDAR</SectionTitle>

          <p style={{ fontSize: 11, lineHeight: 1.9, color: '#9fb8d6', maxWidth: 680, marginBottom: 32 }}>
            Todo lo anterior es, a la vez, un éxito enorme y una lista de lo que todavía falta. El
            Modelo Estándar describe con precisión extraordinaria todo lo que mide un acelerador de
            partículas — y al mismo tiempo no explica la mayor parte del contenido del universo. Esta
            sección es, explícitamente, terreno especulativo: hipótesis activas de investigación, sin
            confirmación experimental directa hasta la fecha.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {BSM_TOPICS.map(topic => (
              <GlassPanel key={topic.title}>
                <div style={{ fontSize: 12, letterSpacing: 2, color: ACCENT, marginBottom: 10, textShadow: `0 0 10px ${ACCENT}44` }}>
                  {topic.title}
                </div>
                <div style={{ fontSize: 10.5, lineHeight: 1.8, color: '#9fb8d6' }}>{topic.detail}</div>
              </GlassPanel>
            ))}
          </div>
        </div>

        {/* 15. Notas adicionales */}
        <div id="sec-14" style={{ marginBottom: 90 }}>
          <SectionTag>SECCIÓN 14</SectionTag>
          <SectionTitle roman="XIV">NOTAS ADICIONALES</SectionTitle>

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
              <strong style={{ color: '#c8daf0' }}>Unidades naturales.</strong> Todas las masas de
              este documento se dan en eV/c² (y sus múltiplos keV, MeV, GeV) en vez de kilogramos —
              la convención estándar en física de partículas. En el sistema de unidades naturales
              (ħ = c = 1) masa, energía y momento comparten unidad; un protón "pesa" ≈ 938 MeV
              porque esa es, literalmente, su energía en reposo (E = mc², con c = 1).
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: '#9fb8d6', margin: 0 }}>
              <strong style={{ color: '#c8daf0' }}>Lo que el Modelo Estándar no explica.</strong>{' '}
              Pese a décadas de confirmación experimental precisa, el Modelo Estándar no da cuenta
              de la materia oscura, no explica la energía oscura, y no incluye una descripción
              cuántica de la gravedad — ver Sección XIII. Son, hoy, los problemas abiertos centrales
              de la física fundamental.
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
