'use client'

// NPX-NSC-00 — ATLAS DE LA MENTE
// Ruta oculta: no se linkea desde ningún lado del sitio (ni nav-config.ts
// ni ninguna otra página). Solo accesible tipeando /archivo/mente a mano.
// Infografía densa de neurociencia y ciencia cognitiva, en español, con el
// mismo lenguaje visual que el resto del sitio (Space Mono, paneles de
// vidrio con glow, fondo casi negro) pero con acento propio: magenta
// neural #ff4fa3, distinto de los acentos ya usados en otras secciones
// (fabricación azul, laboratorio naranja, experimental rojo, conocimiento
// violeta, proxyverse verde, manifiesto dorado).

const mono = "'Space Mono', monospace"
const ACCENT = '#ff4fa3'
const TEXT = '#c8daf0'
const TEXT_DIM = '#8fb8d6'
const LABEL_DIM = '#4a6080'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(10, 4, 10, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(255,79,163,0.02)`,
        padding: '28px 26px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function SectionHeader({ roman, title, sub }: { roman: string; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
        <span style={{ fontSize: 13, color: `${ACCENT}66`, letterSpacing: 2 }}>{roman}</span>
        <h2
          style={{
            fontSize: 'clamp(18px, 3vw, 24px)',
            letterSpacing: 5,
            color: ACCENT,
            textShadow: `0 0 24px ${ACCENT}44`,
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>
      {sub && (
        <div style={{ fontSize: 10, letterSpacing: 1, color: LABEL_DIM, marginTop: 8, paddingLeft: 32 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9.5,
        lineHeight: 1.8,
        letterSpacing: 0.5,
        color: LABEL_DIM,
        marginTop: 14,
        borderLeft: `2px solid ${ACCENT}33`,
        paddingLeft: 12,
      }}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------
// 1. Diagrama de neurona + sinapsis
// ---------------------------------------------------------------------
function NeuronDiagram() {
  const myelin = [
    { x: 262, w: 58 },
    { x: 334, w: 58 },
    { x: 406, w: 58 },
    { x: 478, w: 58 },
    { x: 550, w: 58 },
  ]
  return (
    <svg viewBox="0 0 900 430" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <radialGradient id="somaGrad" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#3a0f2a" />
          <stop offset="100%" stopColor="#1a0612" />
        </radialGradient>
      </defs>

      {/* dendritas */}
      {[
        'M150,185 L95,140 M95,140 L72,118 M95,140 L108,112',
        'M135,170 L72,160 M72,160 L40,148 M72,160 L52,180',
        'M132,205 L58,205 M58,205 L28,195 M58,205 L30,222',
        'M140,240 L78,262 M78,262 L48,258 M78,262 L62,285',
        'M160,255 L120,300 M120,300 L98,318',
      ].map((d, i) => (
        <path key={i} d={d} stroke={`${ACCENT}99`} strokeWidth={2} fill="none" strokeLinecap="round" />
      ))}
      <text x="40" y="95" fontSize="11" letterSpacing="1.5" fill={ACCENT} fontFamily={mono}>
        DENDRITAS
      </text>
      <text x="40" y="110" fontSize="8" letterSpacing="0.5" fill={LABEL_DIM} fontFamily={mono}>
        reciben señales de otras neuronas
      </text>

      {/* soma */}
      <ellipse cx="190" cy="212" rx="72" ry="58" fill="url(#somaGrad)" stroke={ACCENT} strokeWidth={2} />
      <circle cx="195" cy="208" r="24" fill="#120308" stroke={`${ACCENT}bb`} strokeWidth={1.5} />
      <text x="166" y="212" fontSize="8.5" letterSpacing="0.5" fill={TEXT} fontFamily={mono} textAnchor="middle">
        núcleo
      </text>
      <text x="190" y="305" fontSize="11" letterSpacing="1.5" fill={ACCENT} fontFamily={mono} textAnchor="middle">
        SOMA
      </text>
      <text x="190" y="320" fontSize="8" letterSpacing="0.5" fill={LABEL_DIM} fontFamily={mono} textAnchor="middle">
        cuerpo celular
      </text>

      {/* núcleo del axón (línea base) */}
      <line x1="256" y1="212" x2="630" y2="212" stroke={`${ACCENT}55`} strokeWidth={3} />

      {/* vaina de mielina — segmentos, con nódulos de Ranvier entre ellos */}
      {myelin.map((seg, i) => (
        <rect
          key={i}
          x={seg.x}
          y={194}
          width={seg.w}
          height={36}
          rx={16}
          fill={`${ACCENT}26`}
          stroke={ACCENT}
          strokeWidth={1.5}
        />
      ))}
      {/* nódulos de Ranvier: los huecos entre segmentos */}
      {myelin.slice(0, -1).map((seg, i) => {
        const gapX = seg.x + seg.w
        const nextX = myelin[i + 1].x
        const midX = (gapX + nextX) / 2
        return (
          <g key={i}>
            <circle cx={midX} cy={212} r={3.5} fill="#fff" />
          </g>
        )
      })}

      <text x="440" y="175" fontSize="10" letterSpacing="1" fill={ACCENT} fontFamily={mono} textAnchor="middle">
        VAINA DE MIELINA
      </text>
      <text x="440" y="188" fontSize="7.5" letterSpacing="0.3" fill={LABEL_DIM} fontFamily={mono} textAnchor="middle">
        oligodendrocitos (SNC) / células de Schwann (SNP)
      </text>

      <line x1="298" y1="212" x2="298" y2="250" stroke={`${ACCENT}88`} strokeWidth={1} strokeDasharray="2,2" />
      <text x="298" y="265" fontSize="9" letterSpacing="0.5" fill="#fff" fontFamily={mono} textAnchor="middle">
        nódulo de Ranvier
      </text>
      <text x="298" y="278" fontSize="7.5" letterSpacing="0.3" fill={LABEL_DIM} fontFamily={mono} textAnchor="middle">
        conducción saltatoria — mucho más rápida
      </text>

      <text x="440" y="235" fontSize="11" letterSpacing="2" fill={`${ACCENT}99`} fontFamily={mono} textAnchor="middle">
        AXÓN
      </text>

      {/* terminales axónicas */}
      {[
        { x1: 630, y1: 212, x2: 700, y2: 160 },
        { x1: 630, y1: 212, x2: 710, y2: 212 },
        { x1: 630, y1: 212, x2: 700, y2: 264 },
      ].map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={ACCENT} strokeWidth={2.5} />
      ))}
      {[
        { x: 700, y: 160 },
        { x: 710, y: 212 },
        { x: 700, y: 264 },
      ].map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={9} fill={`${ACCENT}33`} stroke={ACCENT} strokeWidth={2} />
      ))}
      <text x="760" y="160" fontSize="10" letterSpacing="1" fill={ACCENT} fontFamily={mono}>
        TERMINALES
      </text>
      <text x="760" y="173" fontSize="10" letterSpacing="1" fill={ACCENT} fontFamily={mono}>
        AXÓNICAS
      </text>
      <text x="745" y="290" fontSize="7.5" letterSpacing="0.3" fill={LABEL_DIM} fontFamily={mono} textAnchor="middle">
        (botones sinápticos)
      </text>
    </svg>
  )
}

function SynapseInset() {
  return (
    <svg viewBox="0 0 420 260" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* membrana presináptica */}
      <rect x="20" y="20" width="380" height="18" fill={`${ACCENT}22`} stroke={ACCENT} strokeWidth={1.5} />
      <text x="20" y="14" fontSize="8.5" letterSpacing="0.5" fill={ACCENT} fontFamily={mono}>
        MEMBRANA PRESINÁPTICA
      </text>

      {/* vesículas sinápticas con neurotransmisor */}
      {[70, 130, 190, 250, 310].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={56} r={13} fill="none" stroke={`${ACCENT}aa`} strokeWidth={1.5} />
          {[[-4, -3], [3, 2], [-2, 4], [4, -4]].map((d, j) => (
            <circle key={j} cx={x + d[0]} cy={56 + d[1]} r={1.6} fill="#fff" />
          ))}
        </g>
      ))}
      <text x="20" y="90" fontSize="8" letterSpacing="0.3" fill={LABEL_DIM} fontFamily={mono}>
        vesículas sinápticas (neurotransmisor)
      </text>

      {/* neurotransmisor liberado cruzando la hendidura */}
      {[90, 150, 210, 270].map((x, i) => (
        <circle key={i} cx={x} cy={125 + (i % 2) * 10} r={2.2} fill="#fff" opacity={0.85} />
      ))}

      {/* hendidura sináptica */}
      <text x="210" y="150" fontSize="9" letterSpacing="1" fill="#fff" fontFamily={mono} textAnchor="middle">
        HENDIDURA SINÁPTICA
      </text>

      {/* membrana postsináptica con receptores */}
      <rect x="20" y="186" width="380" height="18" fill={`${ACCENT}22`} stroke={ACCENT} strokeWidth={1.5} />
      {[70, 130, 190, 250, 310].map((x, i) => (
        <path
          key={i}
          d={`M${x},186 L${x - 8},168 M${x},186 L${x + 8},168`}
          stroke={ACCENT}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
      ))}
      <text x="20" y="222" fontSize="8.5" letterSpacing="0.5" fill={ACCENT} fontFamily={mono}>
        MEMBRANA POSTSINÁPTICA
      </text>
      <text x="20" y="240" fontSize="8" letterSpacing="0.3" fill={LABEL_DIM} fontFamily={mono}>
        receptores postsinápticos
      </text>
    </svg>
  )
}

// ---------------------------------------------------------------------
// 2. Potencial de acción
// ---------------------------------------------------------------------
function ActionPotentialGraph() {
  // mapeo mV -> y : rango -90..+40 mV sobre 40..280 px (invertido)
  const yOf = (v: number) => 280 - (v + 90) * (240 / 130)
  const yRest = yOf(-70)
  const yThresh = yOf(-55)
  const yPeak = yOf(35)
  const yUndershoot = yOf(-80)

  const path = `
    M40,${yRest}
    L150,${yRest}
    L170,${yThresh}
    L210,${yPeak}
    L250,${yRest}
    L270,${yUndershoot}
    L340,${yRest}
    L420,${yRest}
  `

  return (
    <svg viewBox="0 0 460 320" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* ejes */}
      <line x1="40" y1="20" x2="40" y2="300" stroke={LABEL_DIM} strokeWidth={1} />
      <line x1="40" y1="300" x2="430" y2="300" stroke={LABEL_DIM} strokeWidth={1} />
      <text x="225" y="316" fontSize="9" letterSpacing="1.5" fill={LABEL_DIM} fontFamily={mono} textAnchor="middle">
        TIEMPO (ms)
      </text>
      <text x="14" y="160" fontSize="9" letterSpacing="1.5" fill={LABEL_DIM} fontFamily={mono} transform="rotate(-90 14 160)" textAnchor="middle">
        mV
      </text>

      {/* guías horizontales */}
      <line x1="40" y1={yRest} x2="430" y2={yRest} stroke={`${ACCENT}33`} strokeWidth={1} strokeDasharray="4,4" />
      <text x="430" y={yRest - 4} fontSize="9" fill={TEXT_DIM} fontFamily={mono} textAnchor="end">
        −70 mV (reposo)
      </text>

      <line x1="40" y1={yThresh} x2="210" y2={yThresh} stroke={`${ACCENT}33`} strokeWidth={1} strokeDasharray="4,4" />
      <text x="45" y={yThresh - 4} fontSize="9" fill={TEXT_DIM} fontFamily={mono}>
        −55 mV (umbral)
      </text>

      {/* zona de período refractario */}
      <rect x="250" y="20" width="90" height="280" fill={`${ACCENT}08`} stroke={`${ACCENT}22`} strokeWidth={1} />
      <text x="295" y="34" fontSize="8" letterSpacing="0.5" fill={`${ACCENT}aa`} fontFamily={mono} textAnchor="middle">
        PERÍODO
      </text>
      <text x="295" y="46" fontSize="8" letterSpacing="0.5" fill={`${ACCENT}aa`} fontFamily={mono} textAnchor="middle">
        REFRACTARIO
      </text>

      {/* curva del potencial de acción */}
      <path d={path} fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinejoin="round" />

      {/* marcadores */}
      <circle cx="210" cy={yPeak} r="3.5" fill="#fff" />
      <text x="210" y={yPeak - 10} fontSize="9" fill="#fff" fontFamily={mono} textAnchor="middle">
        +30 / +40 mV (pico)
      </text>

      <text x="160" y={(yRest + yThresh) / 2 - 6} fontSize="8" fill={TEXT_DIM} fontFamily={mono} textAnchor="middle">
        despolarización
      </text>
      <text x="160" y={(yRest + yThresh) / 2 + 6} fontSize="7.5" fill={LABEL_DIM} fontFamily={mono} textAnchor="middle">
        (entrada de Na⁺)
      </text>

      <text x="238" y={(yPeak + yRest) / 2} fontSize="8" fill={TEXT_DIM} fontFamily={mono} textAnchor="middle">
        repolarización
      </text>
      <text x="238" y={(yPeak + yRest) / 2 + 12} fontSize="7.5" fill={LABEL_DIM} fontFamily={mono} textAnchor="middle">
        (salida de K⁺)
      </text>

      <circle cx="270" cy={yUndershoot} r="3" fill="#fff" />
      <text x="270" y={yUndershoot + 16} fontSize="8" fill={TEXT_DIM} fontFamily={mono} textAnchor="middle">
        hiperpolarización
      </text>
    </svg>
  )
}

// ---------------------------------------------------------------------
// 3. Tabla de neurotransmisores
// ---------------------------------------------------------------------
type NTRow = { nombre: string; tipo: string; funcion: string; origen: string }
const NEUROTRANSMITTERS: NTRow[] = [
  {
    nombre: 'Glutamato',
    tipo: 'Excitador',
    funcion: 'Principal excitador del SNC — plasticidad sináptica, aprendizaje, memoria.',
    origen: 'Potenciación a largo plazo en el hipocampo.',
  },
  {
    nombre: 'GABA',
    tipo: 'Inhibidor',
    funcion: 'Principal inhibidor del SNC — regula la excitabilidad neuronal, ansiedad.',
    origen: 'Ácido gamma-aminobutírico, distribuido en todo el SNC.',
  },
  {
    nombre: 'Dopamina',
    tipo: 'Modulador',
    funcion: 'Motivación, recompensa, movimiento voluntario.',
    origen: 'Vía nigroestriatal y área tegmental ventral; su déficit en la sustancia negra se asocia al Parkinson.',
  },
  {
    nombre: 'Serotonina',
    tipo: 'Modulador',
    funcion: 'Estado de ánimo, sueño, apetito.',
    origen: 'Núcleos del rafe.',
  },
  {
    nombre: 'Acetilcolina',
    tipo: 'Excitador / Modulador',
    funcion: 'Activación muscular en uniones neuromusculares; atención y memoria en el SNC.',
    origen: 'Núcleo basal de Meynert.',
  },
  {
    nombre: 'Noradrenalina',
    tipo: 'Modulador',
    funcion: 'Alerta, respuesta de lucha o huida.',
    origen: 'Locus coeruleus. (También llamada norepinefrina.)',
  },
]

function NeurotransmitterTable() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
        <thead>
          <tr>
            {['NEUROTRANSMISOR', 'TIPO', 'FUNCIÓN PRINCIPAL', 'ORIGEN / RELEVANCIA'].map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: 'left',
                  fontSize: 9.5,
                  letterSpacing: 1.5,
                  color: ACCENT,
                  borderBottom: `1px solid ${ACCENT}55`,
                  padding: '10px 14px',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {NEUROTRANSMITTERS.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,79,163,0.03)' : 'transparent' }}>
              <td style={{ padding: '12px 14px', fontSize: 11, color: '#fff', letterSpacing: 0.5, verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                {row.nombre}
              </td>
              <td style={{ padding: '12px 14px', fontSize: 9.5, color: TEXT_DIM, verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                {row.tipo}
              </td>
              <td style={{ padding: '12px 14px', fontSize: 10.5, lineHeight: 1.6, color: TEXT, verticalAlign: 'top' }}>
                {row.funcion}
              </td>
              <td style={{ padding: '12px 14px', fontSize: 10, lineHeight: 1.6, color: TEXT_DIM, verticalAlign: 'top' }}>
                {row.origen}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------
// 4. Anatomía cerebral
// ---------------------------------------------------------------------
function BrainDiagram() {
  return (
    <svg viewBox="0 0 700 420" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* contorno general del cerebro (vista lateral, simplificada) */}
      <path
        d="M90,210
           C90,140 160,70 280,58
           C380,48 470,70 530,110
           C580,70 630,80 648,120
           C660,150 645,175 615,185
           C640,205 645,240 615,268
           C590,292 545,300 505,295
           C470,330 400,340 340,325
           C260,340 170,320 130,275
           C100,255 85,235 90,210 Z"
        fill="#0a0410"
        stroke={ACCENT}
        strokeWidth={2}
      />

      {/* lóbulo frontal */}
      <path d="M90,210 C90,140 160,70 280,58 C340,54 380,65 400,95 C390,160 340,210 260,230 C190,245 120,235 90,210 Z"
        fill={`${ACCENT}22`} stroke={`${ACCENT}99`} strokeWidth={1} />
      {/* lóbulo parietal */}
      <path d="M400,95 C440,80 480,85 505,110 C500,150 470,185 420,200 C370,215 330,215 300,200 C330,220 370,218 400,200 C440,185 460,150 430,115 C420,105 410,100 400,95 Z"
        fill={`${ACCENT}33`} stroke={`${ACCENT}99`} strokeWidth={1} />
      {/* lóbulo occipital */}
      <path d="M505,110 C560,95 605,110 615,150 C620,180 600,210 565,225 C530,235 500,225 480,205 C500,185 510,150 505,110 Z"
        fill={`${ACCENT}44`} stroke={`${ACCENT}99`} strokeWidth={1} />
      {/* lóbulo temporal */}
      <path d="M260,230 C300,220 350,225 390,245 C410,260 415,280 400,295 C370,315 320,318 280,305 C240,292 220,265 230,245 C240,235 250,232 260,230 Z"
        fill={`${ACCENT}1a`} stroke={`${ACCENT}99`} strokeWidth={1} />
      {/* cerebelo */}
      <path d="M480,205 C510,215 525,240 515,260 C505,278 480,282 460,272 C445,262 445,240 455,222 C462,212 470,207 480,205 Z"
        fill="#1a0a14" stroke={ACCENT} strokeWidth={1.5} />
      {/* tronco encefálico */}
      <path d="M420,260 C430,280 428,300 418,315 C410,326 398,330 390,322 C384,308 388,285 400,270 C406,263 414,260 420,260 Z"
        fill="#1a0a14" stroke={ACCENT} strokeWidth={1.5} />

      {/* etiquetas con línea guía */}
      {[
        { x: 160, y: 40, tx: 220, ty: 130, label: 'LÓBULO FRONTAL', sub: 'funciones ejecutivas, área de Broca, corteza motora' },
        { x: 460, y: 48, tx: 450, ty: 100, label: 'LÓBULO PARIETAL', sub: 'integración sensorial, procesamiento espacial' },
        { x: 640, y: 60, tx: 560, ty: 130, label: 'LÓBULO OCCIPITAL', sub: 'procesamiento visual' },
        { x: 170, y: 355, tx: 290, ty: 280, label: 'LÓBULO TEMPORAL', sub: 'audición, área de Wernicke, memoria (hipocampo)' },
        { x: 560, y: 320, tx: 495, ty: 250, label: 'CEREBELO', sub: 'coordinación motora, equilibrio' },
        { x: 560, y: 380, tx: 408, ty: 310, label: 'TRONCO ENCEFÁLICO', sub: 'mesencéfalo, protuberancia, bulbo — funciones vitales' },
      ].map((l, i) => (
        <g key={i}>
          <line x1={l.tx} y1={l.ty} x2={l.x} y2={l.y} stroke={`${ACCENT}55`} strokeWidth={1} strokeDasharray="2,2" />
          <text x={l.x} y={l.y} fontSize="9.5" letterSpacing="1" fill={ACCENT} fontFamily={mono}>
            {l.label}
          </text>
          <text x={l.x} y={l.y + 13} fontSize="7.5" letterSpacing="0.2" fill={LABEL_DIM} fontFamily={mono}>
            {l.sub.length > 42 ? l.sub.slice(0, 42) + '…' : l.sub}
          </text>
        </g>
      ))}
    </svg>
  )
}

const LIMBIC_STRUCTURES = [
  { nombre: 'Tálamo', fn: 'relevo de la información sensorial hacia la corteza' },
  { nombre: 'Hipotálamo', fn: 'homeostasis — temperatura, hambre, ciclos circadianos' },
  { nombre: 'Hipocampo', fn: 'consolidación de la memoria' },
  { nombre: 'Amígdala', fn: 'procesamiento del miedo y la emoción' },
]

function LimbicInset() {
  return (
    <svg viewBox="0 0 420 220" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* corte medial simplificado — estructuras internas, no visibles en la vista lateral de arriba */}
      <path
        d="M30,180 C30,100 90,40 180,30 C260,22 330,50 360,100 C375,130 365,165 330,185 C270,210 170,212 100,198 C60,190 32,188 30,180 Z"
        fill="none"
        stroke={`${ACCENT}55`}
        strokeWidth={1.5}
        strokeDasharray="4,3"
      />
      <circle cx="195" cy="95" r="20" fill={`${ACCENT}33`} stroke={ACCENT} strokeWidth={1.5} />
      <text x="195" y="99" fontSize="7" fill="#fff" fontFamily={mono} textAnchor="middle">tálamo</text>

      <circle cx="195" cy="135" r="13" fill={`${ACCENT}44`} stroke={ACCENT} strokeWidth={1.5} />
      <text x="195" y="138" fontSize="6" fill="#fff" fontFamily={mono} textAnchor="middle">hipotál.</text>

      <ellipse cx="270" cy="150" rx="30" ry="12" fill={`${ACCENT}22`} stroke={ACCENT} strokeWidth={1.5} />
      <text x="270" y="153" fontSize="6.5" fill="#fff" fontFamily={mono} textAnchor="middle">hipocampo</text>

      <circle cx="248" cy="120" r="10" fill={`${ACCENT}55`} stroke={ACCENT} strokeWidth={1.5} />
      <text x="248" y="123" fontSize="6" fill="#fff" fontFamily={mono} textAnchor="middle">amíg.</text>
    </svg>
  )
}

// ---------------------------------------------------------------------
// 5. Procesos cognitivos — tarjetas
// ---------------------------------------------------------------------
function CardBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        borderLeft: `2px solid ${ACCENT}55`,
        paddingLeft: 20,
        marginBottom: 36,
      }}
    >
      <h3
        style={{
          fontSize: 13,
          letterSpacing: 2.5,
          color: ACCENT,
          textShadow: `0 0 16px ${ACCENT}33`,
          margin: '0 0 12px 0',
        }}
      >
        {title}
      </h3>
      <div style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, letterSpacing: 0.3 }}>{children}</div>
    </div>
  )
}

export default function MentePage() {
  return (
    <div style={{ background: '#000205', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        {/* encabezado */}
        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${ACCENT}66`, marginBottom: 16 }}>
            NPX-NSC-00 // DOCUMENTO TÉCNICO ARCHIVADO
          </div>
          <h1
            style={{
              fontSize: 'clamp(30px, 6vw, 46px)',
              fontWeight: 700,
              letterSpacing: 8,
              color: ACCENT,
              textShadow: `0 0 40px ${ACCENT}55`,
              marginBottom: 14,
              lineHeight: 1.05,
            }}
          >
            ATLAS DE LA MENTE
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            NEUROCIENCIA Y CIENCIA COGNITIVA
          </div>
          <p
            style={{
              fontSize: 11.5,
              lineHeight: 2.1,
              letterSpacing: 0.3,
              color: TEXT_DIM,
              maxWidth: 620,
              borderLeft: `1px solid ${ACCENT}33`,
              paddingLeft: 24,
            }}
          >
            De la célula al proceso: cómo una neurona dispara, cómo un pulso eléctrico se vuelve señal
            química, cómo un cerebro completo produce memoria, atención, lenguaje y decisión. Cinco
            capas, de abajo hacia arriba.
          </p>
        </div>

        {/* I. ANATOMÍA DE LA NEURONA */}
        <div style={{ marginBottom: 90 }}>
          <SectionHeader roman="I" title="ANATOMÍA DE LA NEURONA" />
          <Panel>
            <NeuronDiagram />
            <Caption>
              La señal eléctrica viaja desde las dendritas, a través del soma, por el axón — la vaina
              de mielina (formada por oligodendrocitos en el SNC y células de Schwann en el SNP) aísla
              segmentos del axón; entre segmento y segmento quedan expuestos los nódulos de Ranvier, y el
              impulso "salta" de nódulo a nódulo (conducción saltatoria) en vez de propagarse de forma
              continua — así es mucho más rápida.
            </Caption>
          </Panel>

          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: TEXT_DIM, marginBottom: 12 }}>
              DETALLE — LA SINAPSIS
            </div>
            <Panel>
              <SynapseInset />
              <Caption>
                Al llegar al botón sináptico, el impulso dispara la liberación de las vesículas
                sinápticas: el neurotransmisor cruza la hendidura sináptica y se une a receptores
                específicos en la membrana postsináptica, iniciando (o inhibiendo) una nueva señal en la
                neurona siguiente.
              </Caption>
            </Panel>
          </div>
        </div>

        {/* II. EL POTENCIAL DE ACCIÓN */}
        <div style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="EL POTENCIAL DE ACCIÓN" />
          <Panel>
            <ActionPotentialGraph />
            <Caption>
              En reposo, el interior de la neurona está a unos −70 mV respecto del exterior. Un estímulo
              suficiente abre canales de Na⁺ y despolariza la membrana; si cruza el umbral (≈ −55 mV), se
              dispara el potencial de acción completo — un pico cercano a +30/+40 mV. Canales de K⁺ se
              abren y repolarizan la membrana, con una breve hiperpolarización por debajo del reposo antes
              de volver a él. Durante el período refractario que sigue, la neurona no puede disparar otro
              potencial de acción (o necesita un estímulo mucho mayor) — esto fija un límite superior a la
              frecuencia de disparo.
            </Caption>
          </Panel>
        </div>

        {/* III. NEUROTRANSMISORES */}
        <div style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title="NEUROTRANSMISORES PRINCIPALES" />
          <Panel style={{ padding: '20px 20px 26px' }}>
            <NeurotransmitterTable />
          </Panel>
        </div>

        {/* IV. ANATOMÍA CEREBRAL */}
        <div style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="ANATOMÍA CEREBRAL" sub="vista lateral — los cuatro lóbulos, cerebelo, tronco encefálico" />
          <Panel>
            <BrainDiagram />
            <Caption>
              Frontal: funciones ejecutivas, planificación, control de impulsos, corteza motora y área de
              Broca (producción del lenguaje). Parietal: integración sensorial y procesamiento espacial.
              Temporal: audición, área de Wernicke (comprensión del lenguaje) y, por su conexión con el
              hipocampo, memoria. Occipital: procesamiento visual. El cerebelo coordina el movimiento y el
              equilibrio; el tronco encefálico (mesencéfalo, protuberancia, bulbo raquídeo) regula
              funciones vitales — respiración, ritmo cardíaco.
            </Caption>
          </Panel>

          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: TEXT_DIM, marginBottom: 12 }}>
              DETALLE — SISTEMA LÍMBICO (corte medial, estructuras internas)
            </div>
            <Panel>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(220px, 1fr)', gap: 24, alignItems: 'center' }}>
                <LimbicInset />
                <div>
                  {LIMBIC_STRUCTURES.map((s, i) => (
                    <div key={i} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, letterSpacing: 1.5, color: ACCENT }}>{s.nombre.toUpperCase()}</div>
                      <div style={{ fontSize: 10.5, lineHeight: 1.7, color: TEXT_DIM }}>{s.fn}</div>
                    </div>
                  ))}
                </div>
              </div>
              <Caption>
                No son visibles desde la vista lateral de arriba — son estructuras internas, profundas,
                que solo se aprecian en un corte medial del cerebro. Hipotálamo, hipocampo y amígdala
                suelen agruparse junto con otras estructuras bajo el nombre de "sistema límbico",
                asociado a emoción, memoria y regulación homeostática; el tálamo actúa como estación de
                relevo entre casi toda la información sensorial y la corteza.
              </Caption>
            </Panel>
          </div>
        </div>

        {/* V. PROCESOS COGNITIVOS */}
        <div style={{ marginBottom: 40 }}>
          <SectionHeader roman="V" title="PROCESOS COGNITIVOS" />
          <Panel>
            <CardBlock title="MEMORIA">
              Se distinguen al menos tres sistemas según su duración y capacidad. La <b style={{ color: '#fff' }}>memoria sensorial</b>{' '}
              retiene la información bruta de los sentidos por fracciones de segundo. La{' '}
              <b style={{ color: '#fff' }}>memoria de trabajo</b> (o de corto plazo) tiene capacidad
              limitada — la estimación clásica de Miller (1956) es de 7±2 ítems, aunque revisiones
              posteriores la ubican más cerca de 4. La <b style={{ color: '#fff' }}>memoria de largo plazo</b>{' '}
              se divide en explícita/declarativa (episódica: eventos vividos en primera persona;
              semántica: hechos y conocimiento general) e implícita/no declarativa (procedimental:
              habilidades motoras automatizadas; priming: la exposición previa a un estímulo influye en
              una respuesta posterior sin recuerdo consciente de esa exposición).
            </CardBlock>

            <CardBlock title="ATENCIÓN">
              Selectiva — filtrar un estímulo relevante entre varios que compiten por el procesamiento.
              Dividida — atender a más de una tarea a la vez, con el costo de rendimiento que eso implica.
              Sostenida — mantener el foco atencional de forma estable a lo largo del tiempo.
            </CardBlock>

            <CardBlock title="LENGUAJE">
              El área de Broca (lóbulo frontal) produce el habla; el área de Wernicke (lóbulo temporal)
              la comprende; ambas se conectan por el fascículo arqueado. Su daño produce afasias
              distintas: la <b style={{ color: '#fff' }}>afasia de Broca</b> deja un habla no fluida,
              esforzada, con comprensión relativamente preservada; la{' '}
              <b style={{ color: '#fff' }}>afasia de Wernicke</b> deja un habla fluida pero sin sentido
              real, con comprensión alterada.
            </CardBlock>

            <CardBlock title="FUNCIÓN EJECUTIVA">
              Depende sobre todo de la corteza prefrontal: planificación de secuencias de acción,
              inhibición de respuestas automáticas o impulsivas, sostenimiento de la memoria de trabajo y
              flexibilidad cognitiva para cambiar de estrategia cuando el contexto cambia.
            </CardBlock>

            <CardBlock title="TOMA DE DECISIONES">
              La teoría del proceso dual (popularizada por Kahneman) describe dos modos de pensar que
              coexisten: el <b style={{ color: '#fff' }}>Sistema 1</b> — rápido, intuitivo, automático,
              de bajo esfuerzo — y el <b style={{ color: '#fff' }}>Sistema 2</b> — lento, deliberado,
              esforzado, capaz de corregir al Sistema 1 pero con un costo cognitivo real.
            </CardBlock>

            <CardBlock title="NEUROPLASTICIDAD">
              El sistema nervioso reorganiza sus propias conexiones en respuesta a la experiencia. La
              regla de Hebb lo resume en una línea: <i>"las neuronas que se activan juntas, se conectan
              entre sí"</i> — la base celular del aprendizaje asociativo, y el mecanismo que subyace a la
              potenciación a largo plazo mencionada en la sección de neurotransmisores.
            </CardBlock>
          </Panel>
        </div>

        {/* footer */}
        <div style={{ marginTop: 100, paddingTop: 28, borderTop: `1px solid ${ACCENT}22` }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}44` }}>
            NPX-NSC-00 // DOCUMENTO SIN ENLAZAR — ARCHIVO ACCEDIDO DIRECTO, NO INDEXADO
          </div>
        </div>
      </div>
    </div>
  )
}
