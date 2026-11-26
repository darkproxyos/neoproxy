'use client'

import { useEffect, useRef, useState } from 'react'

// ARCHIVO / PRINCIPIO HOLOGRÁFICO — página oculta, sin link desde ningún
// otro lugar del sitio (no está en nav-config.ts; se llega desde la grilla
// de documentos de /knowledge o tipeando /archivo/holografia directo).
// Mismo lenguaje visual que el resto de /archivo: fondo casi negro, Space
// Mono, paneles de vidrio con borde de color y glow. Acento propio: índigo
// eléctrico #6c5ce7, distinto de los ya usados en el sitio (fabricación
// azul, laboratorio naranja, experimental rojo, conocimiento violeta,
// proxyverse verde-menta, manifiesto dorado, particulas cian, mente
// magenta, lenguaje verde-teal, alimentación verde-lima).
//
// Física teórica real, no especulación sin anclaje: cada fórmula y fecha es
// verificable. La Sección IX y la XIV son deliberadamente honestas sobre
// los límites reales de la idea — AdS/CFT es una dualidad matemática
// probada en un universo de juguete (anti-de Sitter, curvatura negativa),
// NO una descripción confirmada de nuestro universo real (de Sitter,
// expansión acelerada). Esa distinción es el eje de todo el documento.

const mono = "'Space Mono', monospace"
const ACCENT = '#6c5ce7'
const TEXT = '#c8daf0'
const TEXT_DIM = '#8fb8d6'
const LABEL_DIM = '#4a6080'

// ---------------------------------------------------------------------------
// Bloques de layout reutilizables (mismo patrón que /archivo/alimentacion)
// ---------------------------------------------------------------------------

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(10, 8, 20, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(108,92,231,0.03)`,
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
        <h2 style={{ fontSize: 'clamp(18px, 3vw, 24px)', letterSpacing: 5, color: ACCENT, textShadow: `0 0 24px ${ACCENT}44`, margin: 0, fontWeight: 700 }}>
          {title}
        </h2>
      </div>
      {sub && <div style={{ fontSize: 11, letterSpacing: 1, color: LABEL_DIM, marginTop: 8, paddingLeft: 32 }}>{sub}</div>}
    </div>
  )
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, lineHeight: 1.8, letterSpacing: 0.5, color: LABEL_DIM, marginTop: 14, borderLeft: `2px solid ${ACCENT}33`, paddingLeft: 12 }}>
      {children}
    </div>
  )
}

function Stat({ label, value, color = ACCENT }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 10.5 }}>
      <span style={{ color: `${color}99`, letterSpacing: 1.5 }}>{label}</span>
      <span style={{ color: '#e8f2ff', letterSpacing: 0.3, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 12.5, lineHeight: 2, letterSpacing: 0.3, color: TEXT_DIM, marginTop: 0, marginBottom: 14 }}>{children}</p>
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span style={{ color: '#fff', fontWeight: 700 }}>{children}</span>
}

// ---------------------------------------------------------------------------
// Datos — volumen vs. área al escalar (la intuición detrás de la cota)
// ---------------------------------------------------------------------------
type ScaleRow = { size: number; area: number; volume: number }
const SCALE_ROWS: ScaleRow[] = [1, 2, 4, 8, 16].map(size => ({ size, area: 6 * size * size, volume: size * size * size }))

function VolumeAreaChart() {
  const maxVal = Math.max(...SCALE_ROWS.map(r => r.volume))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {SCALE_ROWS.map(r => (
        <div key={r.size} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 70, fontSize: 11.5, color: '#fff', letterSpacing: 1, flexShrink: 0 }}>L = {r.size}</div>
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: `${(r.area / maxVal) * 100}%`, minWidth: 2, height: 9, background: `${ACCENT}99`, borderRadius: 2 }} />
              <span style={{ fontSize: 10, color: `${ACCENT}cc` }}>área = {r.area}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: `${(r.volume / maxVal) * 100}%`, minWidth: 2, height: 9, background: '#ffffff33', borderRadius: 2 }} />
              <span style={{ fontSize: 10, color: TEXT_DIM }}>volumen = {r.volume}</span>
            </div>
          </div>
        </div>
      ))}
      <div style={{ fontSize: 10.5, letterSpacing: 0.5, color: LABEL_DIM, marginTop: 4 }}>
        Cubo de lado L: el área de su superficie crece como L², el volumen como L³ — al duplicar el tamaño, el volumen
        se multiplica por 8 pero el área solo por 4. Si lo máximo que un objeto puede contener (información, entropía)
        escala con su área y no con su volumen, un objeto grande tiene proporcionalmente mucha menos "capacidad por
        volumen" de lo que la intuición cotidiana esperaría.
      </div>
    </div>
  )
}

function HologramSphere() {
  return (
    <svg viewBox="0 0 640 260" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <circle cx="220" cy="130" r="92" fill={`${ACCENT}10`} stroke={ACCENT} strokeWidth={2.4} />
      {Array.from({ length: 26 }).map((_, i) => {
        const a = (i / 26) * Math.PI * 2
        const r = 18 + (i % 5) * 14
        const x = 220 + Math.cos(a) * r
        const y = 130 + Math.sin(a) * r * 0.9
        return <circle key={i} cx={x} cy={y} r={1.6} fill={`${ACCENT}55`} />
      })}
      <text x="220" y="240" fontSize="11" letterSpacing="2" fill={ACCENT} fontFamily={mono} textAnchor="middle">VOLUMEN (bulk)</text>
      <text x="220" y="130" fontSize="8.5" letterSpacing="0.3" fill={TEXT_DIM} fontFamily={mono} textAnchor="middle">N grados de libertad</text>

      <line x1="330" y1="130" x2="400" y2="130" stroke={`${ACCENT}aa`} strokeWidth={2} strokeDasharray="3,4" />
      <path d="M392,124 l10,6 l-10,6 Z" fill={ACCENT} />
      <text x="365" y="115" fontSize="8.5" letterSpacing="0.5" fill={ACCENT} fontFamily={mono} textAnchor="middle">codifica</text>

      <circle cx="500" cy="130" r="92" fill="none" stroke={ACCENT} strokeWidth={3.5} />
      <text x="500" y="240" fontSize="11" letterSpacing="2" fill={ACCENT} fontFamily={mono} textAnchor="middle">FRONTERA (boundary)</text>
      <text x="500" y="130" fontSize="8.5" letterSpacing="0.3" fill={TEXT_DIM} fontFamily={mono} textAnchor="middle">misma N, una dimensión menos</text>
    </svg>
  )
}

function AdsCftDiagram() {
  return (
    <svg viewBox="0 0 640 260" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <ellipse cx="320" cy="60" rx="220" ry="34" fill="none" stroke={ACCENT} strokeWidth={2.6} />
      <path d="M100,60 C70,120 70,180 100,230" fill="none" stroke={ACCENT} strokeWidth={2.6} />
      <path d="M540,60 C570,120 570,180 540,230" fill="none" stroke={ACCENT} strokeWidth={2.6} />
      <ellipse cx="320" cy="230" rx="220" ry="34" fill="none" stroke={`${ACCENT}55`} strokeWidth={1.6} strokeDasharray="4,5" />
      {Array.from({ length: 10 }).map((_, i) => (
        <line key={i} x1={100 + i * 44} y1={55 + Math.sin(i) * 3} x2={100 + i * 44} y2={228} stroke={`${ACCENT}22`} strokeWidth={1} />
      ))}
      <text x="320" y="38" fontSize="10.5" letterSpacing="1.5" fill={ACCENT} fontFamily={mono} textAnchor="middle">FRONTERA — CFT (sin gravedad, N=4 Super Yang-Mills)</text>
      <text x="320" y="150" fontSize="10.5" letterSpacing="1.5" fill={TEXT_DIM} fontFamily={mono} textAnchor="middle">INTERIOR — cuerdas + gravedad cuántica (AdS₅ × S⁵)</text>
      <text x="320" y="250" fontSize="8.5" letterSpacing="0.3" fill={LABEL_DIM} fontFamily={mono} textAnchor="middle">dos teorías, descripciones exactamente equivalentes — Maldacena, 1997</text>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Línea de tiempo
// ---------------------------------------------------------------------------
type TimelineEntry = { year: string; title: string; detail: string }
const TIMELINE: TimelineEntry[] = [
  { year: '1972–73', title: 'Bekenstein propone la entropía del agujero negro', detail: 'Jacob Bekenstein conjetura que un agujero negro tiene entropía real, proporcional al área de su horizonte de sucesos — no a su volumen. La idea choca con la intuición pero resuelve una contradicción real con la segunda ley de la termodinámica.' },
  { year: '1974–75', title: 'Hawking: los agujeros negros radian', detail: 'Stephen Hawking muestra, usando teoría cuántica de campos en un fondo curvo, que un agujero negro emite radiación térmica y se evapora — y deriva el coeficiente exacto de la fórmula de Bekenstein: S = A/4 en unidades de Planck. Nace la paradoja de la información.' },
  { year: '1981', title: 'La cota de Bekenstein', detail: 'Bekenstein formaliza el límite general: la entropía máxima de cualquier sistema físico está acotada por su energía y su tamaño, no solo en el caso específico de un agujero negro.' },
  { year: '1993', title: "Reducción dimensional de 't Hooft", detail: "Gerard 't Hooft publica \"Dimensional Reduction in Quantum Gravity\": propone que una teoría de gravedad cuántica en un volumen puede describirse enteramente con grados de libertad en su frontera." },
  { year: '1995', title: 'Susskind nombra el principio', detail: 'Leonard Susskind publica "The World as a Hologram", formaliza y bautiza el principio holográfico apoyándose en teoría de cuerdas.' },
  { year: '1997', title: 'Maldacena — la correspondencia AdS/CFT', detail: 'Juan Maldacena publica la conjetura AdS/CFT: una teoría de cuerdas con gravedad en un espacio anti-de Sitter es exactamente equivalente a una teoría de campos conforme sin gravedad en su frontera. El paper más citado en la historia de la física teórica.' },
  { year: '2001', title: 'Strominger propone dS/CFT', detail: 'Andrew Strominger extiende la idea hacia espacios de Sitter (curvatura positiva, como el universo real) — mucho menos desarrollada y mucho menos confirmada que AdS/CFT (ver Sección IX).' },
  { year: '2006', title: 'Fórmula de Ryu-Takayanagi', detail: 'Shinsei Ryu y Tadashi Takayanagi dan una receta geométrica para calcular la entropía de entrelazamiento cuántico de una región de la frontera, a partir del área de una superficie mínima en el interior — la misma forma que Bekenstein-Hawking, generalizada.' },
  { year: '2010', title: 'El entrelazamiento construye el espacio', detail: 'Mark Van Raamsdonk argumenta, con un ejemplo de cálculo concreto, que si se desentrelazan dos partes de la teoría de frontera, el espacio-tiempo interior correspondiente literalmente se desgarra en dos — el entrelazamiento no vive en el espacio, lo sostiene.' },
  { year: '2013', title: 'ER = EPR', detail: 'Maldacena y Susskind conjeturan que el entrelazamiento cuántico (pares EPR) y los agujeros de gusano (puentes Einstein-Rosen) son, en el fondo, la misma cosa descripta en dos lenguajes distintos.' },
  { year: '2014–17', title: 'El Holómetro de Fermilab', detail: 'El experimento liderado por Craig Hogan busca "ruido holográfico" — una granularidad cuántica del espacio-tiempo a escala de Planck predicha por un modelo específico. Resultado: nulo, dentro de la sensibilidad del instrumento. Descarta ese modelo puntual, no al principio holográfico ni a AdS/CFT en general (ver Sección X).' },
]

function TimelineRow({ entry, isLast }: { entry: TimelineEntry; isLast: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14, flexShrink: 0 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 10px ${ACCENT}aa`, flexShrink: 0, marginTop: 4 }} />
        {!isLast && <div style={{ width: 1, flexGrow: 1, background: `${ACCENT}33`, marginTop: 4 }} />}
      </div>
      <div style={{ paddingBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: ACCENT, letterSpacing: 1, textShadow: `0 0 10px ${ACCENT}55` }}>{entry.year}</span>
          <span style={{ fontSize: 12, letterSpacing: 1, color: '#fff' }}>{entry.title}</span>
        </div>
        <div style={{ fontSize: 11, lineHeight: 1.7, color: TEXT_DIM, marginTop: 6, maxWidth: 580 }}>{entry.detail}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Fronteras abiertas
// ---------------------------------------------------------------------------
type Frontier = { title: string; detail: string }
const FRONTIERS: Frontier[] = [
  { title: 'NO HAY VERSIÓN RIGUROSA PARA UN UNIVERSO COMO EL NUESTRO', detail: 'AdS/CFT está probada (en el sentido de "extensamente verificada en miles de cálculos", no de "demostrada matemáticamente desde cero") para espacios anti-de Sitter, de curvatura negativa. El universo real tiene curvatura aproximadamente plana y expansión acelerada — se describe mejor como de Sitter. La extensión dS/CFT existe como propuesta desde 2001, pero es mucho más especulativa y mucho menos desarrollada.' },
  { title: 'NINGUNA CONFIRMACIÓN EXPERIMENTAL DIRECTA', detail: 'Todo lo que respalda la holografía hoy es matemático e indirecto: consistencia interna de AdS/CFT, cálculos que coinciden con otros métodos en casos donde se puede comparar. El Holómetro buscó una firma física directa y no la encontró — un resultado real, no un fracaso oculto, que acotó un modelo específico sin resolver la pregunta de fondo.' },
  { title: '¿ER=EPR ES LITERAL O UNA ANALOGÍA ÚTIL?', detail: 'Que el entrelazamiento y los agujeros de gusano sean "la misma cosa" sigue siendo una conjetura activa, no un teorema. Algunos físicos la toman como literal (el espacio-tiempo ES entrelazamiento, en algún sentido preciso todavía no completamente formalizado); otros, como una correspondencia matemática profunda sin comprometerse todavía con qué es "más fundamental".' },
  { title: 'ALTERNATIVAS QUE NO NECESITAN HOLOGRAFÍA', detail: 'La gravedad cuántica de bucles y las triangulaciones dinámicas causales son programas de investigación serios sobre gravedad cuántica que no dependen del principio holográfico ni de la teoría de cuerdas. Si alguno de esos programas resulta correcto, la holografía podría terminar siendo una propiedad de un modelo particular (cuerdas/AdS) y no un rasgo necesario de toda la física fundamental.' },
  { title: 'GRAVEDAD ENTRÓPICA — UNA VÍA QUE PERDIÓ TRACCIÓN', detail: 'Erik Verlinde propuso en 2010 derivar la gravedad entera como una fuerza entrópica emergente, inspirado en estas ideas. La propuesta generó mucho interés inicial pero no logró reproducir observaciones cosmológicas clave con la precisión necesaria y hoy no tiene el respaldo mayoritario que tuvo al principio — vale como ejemplo honesto de una idea seria que no prosperó, no como ciencia establecida.' },
]

// ---------------------------------------------------------------------------
// Sección con reveal — IntersectionObserver (mismo patrón que alimentación)
// ---------------------------------------------------------------------------
function Section({ idx, registerRef, visible, children, last, id }: {
  idx: number
  registerRef: (idx: number) => (el: HTMLDivElement | null) => void
  visible: boolean[]
  children: React.ReactNode
  last?: boolean
  id?: string
}) {
  return (
    <div
      id={id}
      ref={registerRef(idx)}
      data-idx={idx}
      className={`hlg-section ${visible[idx] ? 'is-visible' : ''}`}
      style={{
        maxWidth: 780, margin: '0 auto', padding: idx === 0 ? '0 24px 120px' : `100px 24px ${last ? 60 : 120}px`,
        borderTop: idx === 0 ? undefined : `1px solid ${ACCENT}14`,
        scrollMarginTop: 40,
      }}
    >
      {children}
    </div>
  )
}

const TOTAL_SECTIONS = 14

export default function HolografiaPage() {
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const [visible, setVisible] = useState<boolean[]>(() => Array(TOTAL_SECTIONS).fill(false))

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const idx = Number((entry.target as HTMLElement).dataset.idx)
        setVisible(prev => {
          if (prev[idx]) return prev
          const next = [...prev]
          next[idx] = true
          return next
        })
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' })
    sectionRefs.current.forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const registerRef = (idx: number) => (el: HTMLDivElement | null) => { sectionRefs.current[idx] = el }
  let sIdx = 0
  const nextIdx = () => sIdx++

  return (
    <div style={{ background: '#000205', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* encabezado */}
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '104px 24px 0' }}>
          <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 6, color: `${ACCENT}66`, marginBottom: 16 }}>
            NPX-HLG-00 // DOCUMENTO TÉCNICO ARCHIVADO
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: 700, letterSpacing: 8, color: ACCENT, textShadow: `0 0 40px ${ACCENT}55`, marginBottom: 14, lineHeight: 1.05 }}>
            PRINCIPIO HOLOGRÁFICO
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            GRAVEDAD, ENTROPÍA Y LA INFORMACIÓN EN EL BORDE DEL UNIVERSO
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 2.1, letterSpacing: 0.3, color: TEXT_DIM, maxWidth: 640, borderLeft: `1px solid ${ACCENT}33`, paddingLeft: 24, marginBottom: 32 }}>
            Toda la información de un volumen de espacio podría estar codificada por completo en su
            frontera — en una superficie con una dimensión menos. No nació como metáfora: salió de
            entender por qué la entropía de un agujero negro depende de su área y no de su volumen.
            Desde ahí se volvió una herramienta de cálculo real (Sección VI) y una pregunta todavía
            abierta sobre si el espacio-tiempo mismo es un efecto emergente de datos cuánticos
            entrelazados en un borde (Secciones VII–IX). Catorce capas, de la pista original a los
            límites reales de qué tan lejos llega la idea hoy.
          </p>

          {/* sello */}
          <div style={{ display: 'inline-grid', gridTemplateColumns: 'auto auto', gap: '4px 24px', fontSize: 10.5, letterSpacing: 1, color: `${ACCENT}99`, border: `1px solid ${ACCENT}33`, padding: '12px 18px', marginBottom: 32, maxWidth: 640 }}>
            <span style={{ color: `${ACCENT}55` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>FÍSICA TEÓRICA — SIN CONFIRMACIÓN EXPERIMENTAL DIRECTA</span>
            <span style={{ color: `${ACCENT}55` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — 14 SECCIONES</span>
            <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>REFERENCIA EDUCATIVA — DISTINGUE HERRAMIENTA MATEMÁTICA PROBADA DE ESPECULACIÓN SOBRE NUESTRO UNIVERSO REAL</span>
          </div>

          {/* índice */}
          <nav style={{ border: `1px solid ${ACCENT}22`, padding: '20px 24px', maxWidth: 640, marginBottom: 90 }}>
            <div style={{ fontSize: 10.5, letterSpacing: 3, color: `${ACCENT}66`, marginBottom: 14 }}>ÍNDICE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0 20px' }}>
              {[
                ['I', 'sec-01', 'Introducción'],
                ['II', 'sec-02', 'Entropía de agujeros negros'],
                ['III', 'sec-03', 'La cota de Bekenstein'],
                ['IV', 'sec-04', 'Radiación de Hawking y la paradoja'],
                ['V', 'sec-05', 'El principio holográfico'],
                ['VI', 'sec-06', 'AdS/CFT — la correspondencia de Maldacena'],
                ['VII', 'sec-07', 'Gravedad emergente y ER=EPR'],
                ['VIII', 'sec-08', 'Entropía de entrelazamiento'],
                ['IX', 'sec-09', '¿Es nuestro universo un holograma?'],
                ['X', 'sec-10', 'Buscando evidencia — el Holómetro'],
                ['XI', 'sec-11', 'Holografía y teoría de cuerdas'],
                ['XII', 'sec-12', 'Implicancias filosóficas'],
                ['XIII', 'sec-13', 'Línea de tiempo'],
                ['XIV', 'sec-14', 'Fronteras abiertas'],
              ].map(([roman, id, label]) => (
                <a key={id} href={`#${id}`} style={{ fontSize: 11.5, color: TEXT_DIM, textDecoration: 'none', display: 'flex', gap: 10, padding: '7px 0' }}>
                  <span style={{ color: `${ACCENT}88`, width: 26, flexShrink: 0 }}>{roman}</span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </nav>
        </div>

        {/* I. INTRODUCCIÓN */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-01">
          <SectionHeader roman="I" title="INTRODUCCIÓN" />
          <P>
            Pensá en cuánta información cabe, en principio, dentro de una habitación. La intuición
            dice: depende de su volumen — una habitación más grande permite más cosas adentro. El
            principio holográfico dice algo distinto y mucho menos intuitivo: el límite real no lo
            pone el volumen, lo pone el <Mono>área de su superficie</Mono>. Toda la información que
            puede existir dentro de una región del espacio puede, en principio, describirse por
            completo con datos codificados en su frontera — una superficie con una dimensión menos que
            el volumen que encierra.
          </P>
          <P>
            Esto no nació de una intuición filosófica. Nació de un problema muy concreto de física de
            agujeros negros en los años 70 (Sección II), se formalizó como principio general en los 90
            (Sección V), y en 1997 se convirtió en una herramienta de cálculo matemáticamente precisa
            (Sección VI) — hoy una de las más usadas en física teórica, aunque sigue sin estar probado
            que describa literalmente nuestro propio universo (Sección IX).
          </P>
          <Caption>
            Convención de este documento: "probado" se usa en el sentido de física teórica —
            extensamente verificado por consistencia interna y por coincidir con otros métodos de
            cálculo en los casos donde se puede comparar — no en el sentido de demostración matemática
            completa desde los axiomas, ni de confirmación experimental directa (que no existe todavía
            para ninguna de estas ideas, ver Sección X).
          </Caption>
        </Section>

        {/* II. ENTROPÍA DE AGUJEROS NEGROS */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-02">
          <SectionHeader roman="II" title="ENTROPÍA DE AGUJEROS NEGROS" sub="la pista que lo empezó todo" />
          <P>
            Un agujero negro parece el lugar perfecto para que la información simplemente desaparezca
            — nada escapa de su horizonte de sucesos, ni siquiera la luz. Pero eso entra en conflicto
            directo con la segunda ley de la termodinámica: si algo con entropía cae en un agujero
            negro y esa entropía se esfuma sin dejar rastro, la entropía total del universo podría
            bajar — algo que la termodinámica prohíbe.
          </P>
          <P>
            Jacob Bekenstein resolvió la tensión en 1972–73 proponiendo que el agujero negro mismo
            tiene una entropía real — y que esa entropía es proporcional al <Mono>área de su
            horizonte</Mono>, no a su volumen:
          </P>
          <Panel>
            <Stat label="ENTROPÍA DE BEKENSTEIN-HAWKING" value="S = A / 4 (en unidades de Planck)" />
            <Caption>
              A es el área del horizonte de sucesos. El coeficiente exacto (el "/4") lo derivó Stephen
              Hawking en 1974–75 usando teoría cuántica de campos sobre un fondo curvo — confirmando el
              cálculo de Bekenstein con precisión, no solo la proporcionalidad general.
            </Caption>
          </Panel>
          <P>
            Es la primera pista real de holografía: la cantidad máxima de información asociada a una
            región de espacio-tiempo no escala con su volumen, como esperaría la intuición, sino con su
            superficie.
          </P>
        </Section>

        {/* III. LA COTA DE BEKENSTEIN */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-03">
          <SectionHeader roman="III" title="LA COTA DE BEKENSTEIN" sub="de un caso particular a un límite universal" />
          <P>
            En 1981 Bekenstein generalizó la idea más allá de los agujeros negros: cualquier sistema
            físico, de energía E, confinado en una esfera de radio R, tiene una entropía máxima posible
            — un techo real para la cantidad de información que puede contener, sea lo que sea ese
            sistema.
          </P>
          <Panel>
            <Stat label="COTA DE BEKENSTEIN" value="S ≤ 2π k_B R E / (ħ c)" />
            <Caption>
              k_B es la constante de Boltzmann, ħ la constante de Planck reducida, c la velocidad de la
              luz. El agujero negro resulta ser, en este sentido preciso, el objeto más "denso en
              información" que puede existir con ese tamaño y esa energía — satura la cota.
            </Caption>
          </Panel>
          <VolumeAreaChart />
        </Section>

        {/* IV. RADIACIÓN DE HAWKING Y LA PARADOJA */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-04">
          <SectionHeader roman="IV" title="RADIACIÓN DE HAWKING Y LA PARADOJA DE LA INFORMACIÓN" />
          <P>
            Si un agujero negro tiene temperatura y entropía reales, por las leyes normales de la
            termodinámica también debería <Mono>radiar</Mono> y, eventualmente, evaporarse. Hawking lo
            demostró en 1974–75: el efecto combinado de la mecánica cuántica cerca del horizonte hace
            que el agujero negro emita radiación térmica (hoy "radiación de Hawking") y pierda masa
            lentamente, hasta desaparecer por completo en escalas de tiempo astronómicas.
          </P>
          <P>
            Ahí aparece la paradoja: si todo lo que cayó alguna vez en el agujero negro —estrellas,
            naves, lo que sea, con toda su información específica— termina convertido en radiación
            térmica genérica que no conserva ningún detalle de lo que entró, esa información se
            perdió para siempre cuando el agujero negro termina de evaporarse. Eso viola la unitariedad
            de la mecánica cuántica, un principio que dice que la información nunca se destruye, solo
            se reorganiza. La tensión entre "la relatividad general dice que se pierde" y "la mecánica
            cuántica dice que no puede perderse" se sostuvo sin resolución limpia durante décadas — y
            es una de las motivaciones reales, no solo abstractas, detrás de perseguir la holografía:
            si la información del interior está codificada también en la frontera, puede salir
            codificada en los detalles sutiles de la radiación misma, sin violar nada.
          </P>
        </Section>

        {/* V. EL PRINCIPIO HOLOGRÁFICO */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-05">
          <SectionHeader roman="V" title="EL PRINCIPIO HOLOGRÁFICO" sub="de la pista de un caso a una afirmación general" />
          <P>
            Gerard 't Hooft dio el salto en 1993: si la entropía de un agujero negro —el objeto más
            extremo que permite la física— escala con área y no con volumen, quizás eso no sea una
            rareza de los agujeros negros sino un rasgo de la gravedad cuántica en general. Propuso que
            una teoría completa de gravedad cuántica en una región del espacio debería poder
            describirse enteramente con grados de libertad viviendo en su frontera, una dimensión
            menos.
          </P>
          <Panel>
            <HologramSphere />
          </Panel>
          <P>
            Leonard Susskind formalizó y bautizó la idea en 1995, apoyándose en resultados de teoría de
            cuerdas que apuntaban en la misma dirección: el <Mono>principio holográfico</Mono>. Todavía
            era, en ese momento, una conjetura general sin un ejemplo concreto y calculable donde
            funcionara de punta a punta.
          </P>
        </Section>

        {/* VI. AdS/CFT */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-06">
          <SectionHeader roman="VI" title="AdS/CFT — LA CORRESPONDENCIA DE MALDACENA" sub="de la conjetura a la herramienta de cálculo" />
          <P>
            En 1997 Juan Maldacena encontró el primer ejemplo concreto, preciso y calculable: una
            teoría de cuerdas con gravedad, viviendo en un espacio anti-de Sitter (AdS, un espacio de
            curvatura negativa con una frontera bien definida en el infinito), es exactamente
            equivalente a una teoría de campos conforme (CFT) sin gravedad, viviendo en esa frontera.
          </P>
          <Panel>
            <AdsCftDiagram />
          </Panel>
          <P>
            Es el paper más citado en la historia de la física teórica — y no solo por lo elegante de
            la idea: se convirtió en una herramienta real de cálculo. Problemas intratables del lado
            con gravedad (cuerdas fuertemente acopladas) a veces se vuelven tratables del lado sin
            gravedad, y viceversa — hoy se usa incluso fuera de la gravedad cuántica, para estudiar
            sistemas de materia condensada y plasma de quarks y gluones fuertemente acoplados
            ("AdS/CMT", una aplicación práctica de la dualidad que no tiene nada que ver, en apariencia,
            con agujeros negros).
          </P>
          <Caption>
            Es una conjetura, no un teorema demostrado desde los axiomas — pero lleva más de 25 años de
            verificaciones cruzadas, sin ninguna contradicción encontrada, en miles de cálculos
            independientes.
          </Caption>
        </Section>

        {/* VII. GRAVEDAD EMERGENTE Y ER=EPR */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-07">
          <SectionHeader roman="VII" title="GRAVEDAD EMERGENTE Y ER = EPR" />
          <P>
            Si la frontera (sin gravedad) y el interior (con gravedad) describen exactamente lo mismo,
            una pregunta se vuelve inevitable: ¿de dónde sale el espacio-tiempo del interior, si la
            frontera ni siquiera lo necesita para existir? En 2010 Mark Van Raamsdonk dio un argumento
            concreto: si se desentrelaza matemáticamente la teoría de la frontera en dos mitades
            independientes, el espacio-tiempo del interior correspondiente se desgarra literalmente en
            dos regiones desconectadas. El entrelazamiento cuántico no vive dentro del espacio — en
            este marco, lo sostiene.
          </P>
          <P>
            En 2013 Maldacena y Susskind llevaron la idea un paso más allá con la conjetura{' '}
            <Mono>ER = EPR</Mono>: el entrelazamiento cuántico entre dos partículas (un par EPR, por
            Einstein-Podolsky-Rosen) y un agujero de gusano que conecta dos regiones del espacio-tiempo
            (un puente de Einstein-Rosen) podrían ser, en el fondo, la misma cosa descripta en dos
            lenguajes distintos — geometría de un lado, información cuántica del otro.
          </P>
        </Section>

        {/* VIII. ENTROPÍA DE ENTRELAZAMIENTO */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-08">
          <SectionHeader roman="VIII" title="ENTROPÍA DE ENTRELAZAMIENTO" sub="fórmula de Ryu-Takayanagi (2006)" />
          <P>
            Shinsei Ryu y Tadashi Takayanagi dieron, en 2006, una receta geométrica concreta: la
            entropía de entrelazamiento cuántico de una región cualquiera de la frontera es igual al
            área de la superficie mínima, dentro del interior, que comparte el mismo borde que esa
            región — dividida por 4G, exactamente la misma forma que la fórmula de Bekenstein-Hawking,
            ahora generalizada a cualquier región, no solo al horizonte completo de un agujero negro.
          </P>
          <Panel>
            <Stat label="FÓRMULA DE RYU-TAKAYANAGI" value="S_A = Área(γ_A) / 4G" />
            <Caption>
              γ_A es la superficie mínima en el interior homóloga a la región A de la frontera. La
              fórmula convirtió la entropía de entrelazamiento —un concepto puramente de información
              cuántica— en algo literalmente medible con geometría.
            </Caption>
          </Panel>
        </Section>

        {/* IX. ¿ES NUESTRO UNIVERSO UN HOLOGRAMA? */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-09">
          <SectionHeader roman="IX" title="¿ES NUESTRO UNIVERSO UN HOLOGRAMA?" sub="la pregunta honesta, sin atajos" />
          <P>
            Acá es donde hay que frenar la intuición. AdS/CFT funciona —y está extensamente verificada—
            en espacios <Mono>anti-de Sitter</Mono>: curvatura negativa, sin expansión acelerada, con
            una frontera bien definida "en el infinito" donde vive la teoría dual. Nuestro universo
            real no es así: tiene curvatura aproximadamente plana y una expansión que se está{' '}
            <Mono>acelerando</Mono> por efecto de la energía oscura — se describe mejor como un espacio
            de Sitter.
          </P>
          <P>
            Existe una propuesta de extensión, dS/CFT (Strominger, 2001), pero está muchísimo menos
            desarrollada y verificada que AdS/CFT — entre otras razones porque un espacio de Sitter no
            tiene el tipo de frontera cómoda, en el infinito espacial, que hace que AdS/CFT sea tan
            calculable. Decir sin matices que "vivimos en un holograma" extiende una herramienta
            probada en un universo de juguete a una afirmación sobre el universo real que todavía no
            está respaldada con el mismo rigor.
          </P>
          <Caption>
            Esta distinción —AdS probado, dS especulativo— es, para este documento, el punto más
            importante de todo el tema.
          </Caption>
        </Section>

        {/* X. BUSCANDO EVIDENCIA */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-10">
          <SectionHeader roman="X" title="BUSCANDO EVIDENCIA — EL HOLÓMETRO DE FERMILAB" />
          <P>
            Entre 2014 y 2017, un experimento liderado por el físico Craig Hogan en el Fermilab buscó
            una firma física directa: si el espacio-tiempo tiene una granularidad holográfica a escala
            de Planck, un par de interferómetros láser superpuestos y correlacionados deberían detectar
            un "ruido" cuántico característico en la posición misma del espacio. El resultado fue
            nulo — no se detectó ese ruido, dentro de la sensibilidad del instrumento.
          </P>
          <P>
            Importa la letra chica: el modelo que el Holómetro puso a prueba era una propuesta
            específica de Hogan sobre cómo se manifestaría la holografía como ruido observable — no una
            predicción estándar de AdS/CFT ni del principio holográfico en general. El resultado
            descarta esa versión puntual; no es, ni se presenta honestamente como, una refutación de la
            holografía como idea.
          </P>
          <Caption>
            Sigue sin existir, a la fecha de este documento, ninguna confirmación experimental directa
            de que la holografía describa físicamente nuestro universo.
          </Caption>
        </Section>

        {/* XI. HOLOGRAFÍA Y TEORÍA DE CUERDAS */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-11">
          <SectionHeader roman="XI" title="HOLOGRAFÍA Y TEORÍA DE CUERDAS" />
          <P>
            La holografía no se inventó dentro de la teoría de cuerdas, pero encontró ahí su realización
            más concreta y mejor entendida: AdS/CFT nació como un resultado de teoría de cuerdas
            (dualidades entre configuraciones de D-branas), no como una idea aparte que la teoría de
            cuerdas simplemente adoptó. Eso deja abierta una pregunta real: si el principio holográfico
            es un rasgo necesario de cualquier teoría correcta de gravedad cuántica, o si es, en cambio,
            una propiedad específica de la teoría de cuerdas que no tiene por qué valer en otros
            programas de gravedad cuántica (Sección XIV).
          </P>
        </Section>

        {/* XII. IMPLICANCIAS FILOSÓFICAS */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-12">
          <SectionHeader roman="XII" title="IMPLICANCIAS FILOSÓFICAS" sub="y una advertencia contra la lectura fácil" />
          <P>
            La divulgación popular convirtió "vivimos en un holograma" en un titular llamativo, cercano
            a "la realidad es una ilusión" — una lectura que la física real no respalda de esa forma.
            Lo que de verdad está en juego es más preciso y, en todo caso, más interesante: que el
            espacio-tiempo y la gravedad misma podrían no ser ingredientes fundamentales de la
            realidad, sino fenómenos <Mono>emergentes</Mono> — efectivos a gran escala, construidos a
            partir de datos cuánticos entrelazados en un sustrato sin geometría propia.
          </P>
          <P>
            Eso no dice que "nada es real" — dice que lo que llamamos "espacio" podría ser, en el
            sentido más literal, información organizada de una manera particular, de la misma forma
            que la temperatura es real y medible aunque "emerja" del movimiento promedio de moléculas
            que, individualmente, no tienen temperatura. Tomarse en serio la idea no requiere ninguna
            metafísica new age — requiere tomarse en serio las matemáticas, con todos los límites reales
            descriptos en las Secciones IX y XIV.
          </P>
        </Section>

        {/* XIII. LÍNEA DE TIEMPO */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-13">
          <SectionHeader roman="XIII" title="LÍNEA DE TIEMPO" sub="de la entropía de un agujero negro a ER=EPR" />
          <Panel>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {TIMELINE.map((entry, i) => (
                <TimelineRow key={entry.year + entry.title} entry={entry} isLast={i === TIMELINE.length - 1} />
              ))}
            </div>
          </Panel>
        </Section>

        {/* XIV. FRONTERAS ABIERTAS */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-14" last>
          <div style={{ fontSize: 10.5, letterSpacing: 6, color: `${ACCENT}55`, marginBottom: 10 }}>
            TERRENO ABIERTO // SIN CONSENSO, A DIFERENCIA DE TODO LO ANTERIOR
          </div>
          <h2 style={{ fontSize: 19, letterSpacing: 4, color: ACCENT, textShadow: `0 0 22px ${ACCENT}44`, fontWeight: 700, margin: '0 0 18px' }}>
            FRONTERAS ABIERTAS
          </h2>
          <P>
            Todo lo anterior distingue, sección a sección, qué está matemáticamente bien establecido
            (las fórmulas, las fechas, la consistencia interna de AdS/CFT) de lo que es especulación
            física honesta. Esta sección reúne, explícitamente como tales, los puntos donde la
            comunidad de física teórica no tiene consenso cerrado.
          </P>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FRONTIERS.map(f => (
              <Panel key={f.title}>
                <div style={{ fontSize: 12.5, letterSpacing: 1.5, color: ACCENT, marginBottom: 10, textShadow: `0 0 10px ${ACCENT}44` }}>{f.title}</div>
                <div style={{ fontSize: 11.5, lineHeight: 1.8, color: TEXT_DIM }}>{f.detail}</div>
              </Panel>
            ))}
          </div>
        </Section>

        {/* footer */}
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px 140px', textAlign: 'center' }}>
          <div style={{ fontSize: 10.5, letterSpacing: 4, color: `${ACCENT}33` }}>
            NPX-HLG-00 // DOCUMENTO SIN ENLAZAR — ARCHIVO ACCEDIDO DIRECTO, NO INDEXADO
          </div>
        </div>
      </div>

      <style>{`
        .hlg-section { opacity: 0; transform: translateY(26px); transition: opacity 0.8s ease, transform 0.8s ease; }
        .hlg-section.is-visible { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .hlg-section { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
