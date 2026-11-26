'use client'

import { useEffect, useRef, useState } from 'react'

// ARCHIVO / CIENCIA COGNITIVA — página oculta, sin link desde ningún otro
// lugar del sitio (no está en nav-config.ts; se llega desde la grilla de
// documentos de /knowledge o tipeando /archivo/cognitiva directo). Mismo
// lenguaje visual que el resto de /archivo. Acento propio: verde esmeralda
// #22e06b, distinto de los ya usados en el sitio (fabricación azul,
// laboratorio naranja, experimental rojo, conocimiento violeta, proxyverse
// verde-menta, manifiesto dorado, particulas cian, mente magenta, lenguaje
// verde-teal, alimentación verde-lima, holografía índigo).
//
// La Sección IX retoma directamente la entrada de Jean-Pierre Changeux
// agregada al Codex Cogito (components/knowledge/entries.ts) — no es
// casualidad, es el mismo tema desde otro ángulo. La Sección X (el problema
// difícil de la conciencia) y la XIV son deliberadamente honestas sobre
// qué sigue sin resolverse en el campo, incluida la controversia real de
// 2023 alrededor de la Teoría de la Información Integrada.

const mono = "'Space Mono', monospace"
const ACCENT = '#22e06b'
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
        background: 'rgba(4, 16, 10, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(34,224,107,0.03)`,
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
// Diagrama — arquitectura de memoria (Atkinson-Shiffrin + Baddeley)
// ---------------------------------------------------------------------------
function MemoryDiagram() {
  return (
    <svg viewBox="0 0 640 220" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {[
        { x: 20, w: 140, label: 'MEMORIA SENSORIAL', sub: 'cientos de ms' },
        { x: 220, w: 190, label: 'MEMORIA DE TRABAJO', sub: '≈ 15–30 seg sin repasar' },
        { x: 470, w: 150, label: 'LARGO PLAZO', sub: 'años — en principio, ilimitada' },
      ].map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={60} width={b.w} height={70} rx={4} fill={`${ACCENT}10`} stroke={ACCENT} strokeWidth={1.8} />
          <text x={b.x + b.w / 2} y={90} fontSize="10" letterSpacing="1" fill={ACCENT} fontFamily={mono} textAnchor="middle">{b.label}</text>
          <text x={b.x + b.w / 2} y={108} fontSize="8.5" letterSpacing="0.3" fill={TEXT_DIM} fontFamily={mono} textAnchor="middle">{b.sub}</text>
        </g>
      ))}
      <path d="M160,95 L220,95" stroke={`${ACCENT}aa`} strokeWidth={1.8} markerEnd="url(#arrow)" />
      <path d="M410,95 L470,95" stroke={`${ACCENT}aa`} strokeWidth={1.8} markerEnd="url(#arrow)" />
      <path d="M315,130 C315,165 220,165 220,130" stroke={`${ACCENT}66`} strokeWidth={1.4} fill="none" strokeDasharray="3,4" />
      <text x="270" y="185" fontSize="8" letterSpacing="0.3" fill={LABEL_DIM} fontFamily={mono} textAnchor="middle">repaso / consolidación</text>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={ACCENT} />
        </marker>
      </defs>
    </svg>
  )
}

type System = { title: string; detail: string }
const SYSTEMS: System[] = [
  { title: 'SISTEMA 1 — RÁPIDO', detail: 'Automático, intuitivo, sin esfuerzo consciente — reconocer una cara, completar "pan y...", frenar ante un objeto que aparece de golpe. Corre todo el tiempo, en paralelo, y es el que genera la mayoría de los sesgos cognitivos (Sección VIII) precisamente porque opera por atajos.' },
  { title: 'SISTEMA 2 — LENTO', detail: 'Deliberado, secuencial, exige esfuerzo y atención — multiplicar 27×34 de cabeza, llenar un formulario, evaluar un argumento complejo. Se agota con el uso (fatiga de decisión) y, en general, el Sistema 1 propone y el Sistema 2 revisa — cuando tiene tiempo y energía para hacerlo.' },
]

type EEntry = { letter: string; title: string; detail: string }
const FOUR_E: EEntry[] = [
  { letter: 'E', title: 'EMBODIED (corporizada)', detail: 'La cognición depende de las características específicas del cuerpo que la sostiene, no solo del cerebro como si fuera intercambiable por cualquier otro soporte.' },
  { letter: 'E', title: 'EMBEDDED (embebida)', detail: 'La mente resuelve problemas apoyándose activamente en la estructura del entorno, no solo con representaciones internas — un cocinero no memoriza una receta entera, la tiene al lado.' },
  { letter: 'E', title: 'ENACTED (enactuada)', detail: 'La percepción y la cognición emergen de la interacción activa entre organismo y ambiente, no de procesar pasivamente datos sensoriales ya dados.' },
  { letter: 'E', title: 'EXTENDED (extendida)', detail: 'Una libreta, un teléfono, un mapa pueden funcionar como parte literal del proceso cognitivo, no solo como una ayuda externa — la propuesta de la "mente extendida" de Clark y Chalmers, 1998.' },
]

// ---------------------------------------------------------------------------
// Línea de tiempo
// ---------------------------------------------------------------------------
type TimelineEntry = { year: string; title: string; detail: string }
const TIMELINE: TimelineEntry[] = [
  { year: '1950', title: 'Lashley no encuentra el engrama', detail: 'Karl Lashley publica "In Search of the Engram" tras décadas de lesionar distintas zonas de la corteza en ratas entrenadas: no logra ubicar la memoria en un punto específico. Concluye que está distribuida — un resultado que empuja a estudiar la mente por su función, no solo por su ubicación física exacta.' },
  { year: '1956', title: 'Dartmouth y "el número mágico siete"', detail: 'John McCarthy organiza la Conferencia de Dartmouth y acuña el término "inteligencia artificial". El mismo año, George Miller publica "The Magical Number Seven, Plus or Minus Two" sobre los límites de la memoria de trabajo — ambos, piezas fundadoras del enfoque de "procesamiento de información" en psicología.' },
  { year: '1957', title: 'Chomsky, Estructuras Sintácticas', detail: 'Noam Chomsky propone una gramática generativa formal y la hipótesis de una facultad del lenguaje innata — estructura universal subyacente a todas las lenguas humanas.' },
  { year: '1959', title: 'Chomsky revisa a Skinner', detail: 'La reseña de Chomsky al libro conductista "Verbal Behavior" de B. F. Skinner se considera, convencionalmente, el golpe de apertura simbólico de la revolución cognitiva contra el conductismo.' },
  { year: '1960', title: '"Plans and the Structure of Behavior"', detail: 'Miller, Galanter y Pribram proponen explícitamente a la computadora como modelo de la mente — una de las piezas que ayuda a darle nombre al nuevo paradigma.' },
  { year: '1967', title: 'Neisser bautiza el campo', detail: 'Ulric Neisser publica "Cognitive Psychology" — el libro que le da nombre y forma a la disciplina como tal.' },
  { year: '1968', title: 'Modelo multi-almacén', detail: 'Atkinson y Shiffrin proponen el modelo de memoria sensorial → memoria de corto plazo → memoria de largo plazo.' },
  { year: '1976', title: 'Hipótesis del sistema de símbolos físicos', detail: 'Allen Newell y Herbert Simon, en su discurso del Premio Turing, proponen que un sistema de símbolos físicos tiene los medios necesarios y suficientes para la acción inteligente general — la mente como cómputo simbólico.' },
  { year: '1979', title: 'Se funda la Cognitive Science Society', detail: 'Se consolida institucionalmente el campo como disciplina propia, con su propia sociedad y su revista (Cognitive Science).' },
  { year: '1982', title: 'Marr, Vision', detail: 'David Marr propone, póstumamente, el marco de tres niveles (computacional, algorítmico, de implementación) para especificar qué significa explicar un proceso cognitivo — todavía en uso.' },
  { year: '1987', title: 'Darwinismo neuronal', detail: 'Gerald Edelman publica "Neural Darwinism" — un marco de variación y selección a nivel de grupos neuronales, desarrollado en paralelo e independiente de la estabilización selectiva de sinapsis de Changeux.' },
  { year: '1991', title: 'The Embodied Mind', detail: 'Francisco Varela, Evan Thompson y Eleanor Rosch publican el libro fundacional de la cognición corporizada, cruzando ciencia cognitiva con fenomenología y filosofía budista.' },
  { year: '1995', title: 'El problema difícil', detail: 'David Chalmers distingue formalmente los "problemas fáciles" de la cognición (explicar funciones) del "problema difícil" (explicar la experiencia subjetiva misma).' },
  { year: '2004', title: 'Teoría de la Información Integrada', detail: 'Giulio Tononi propone medir la conciencia con una cantidad matemática, Φ (phi) — una de las teorías más citadas y más debatidas del campo (ver Sección X).' },
  { year: '2010s', title: 'El giro del aprendizaje profundo', detail: 'Las redes neuronales profundas y, hacia el final de la década, los modelos de lenguaje a gran escala, reabren con fuerza el debate simbólico/conexionista desde un terreno nuevo.' },
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
  { title: 'EL PROBLEMA DIFÍCIL SIGUE SIN RESOLVERSE', detail: 'Explicar por qué hay experiencia subjetiva asociada a ciertos procesos físicos —y no solo explicar los procesos mismos— no tiene todavía una respuesta aceptada por consenso. No es falta de datos: es, para muchos filósofos de la mente, un problema de otra naturaleza.' },
  { title: 'LA TEORÍA DE LA INFORMACIÓN INTEGRADA, EN DISPUTA ABIERTA', detail: 'En 2023, una carta abierta firmada por 124 investigadores calificó a la Teoría de la Información Integrada (IIT) de "pseudociencia" por no ser falsable de forma práctica — una controversia real y pública dentro del campo, no una opinión marginal. Sus defensores respondieron con fuerza. El debate sigue abierto, sin resolución consensuada a la fecha de este documento.' },
  { title: 'SIMBÓLICO VS. CONEXIONISTA, RECONFIGURADO', detail: 'La vieja disputa entre representaciones simbólicas explícitas y redes distribuidas sin símbolos no se cerró — el éxito del aprendizaje profundo la reabrió en términos nuevos, sin que ninguno de los dos bandos históricos haya quedado claramente confirmado.' },
  { title: '¿QUÉ DICEN LOS MODELOS DE LENGUAJE SOBRE LA COGNICIÓN HUMANA?', detail: 'Es una pregunta genuinamente disputada entre especialistas, no una curiosidad menor: si el comportamiento de un modelo de lenguaje entrenado para predecir texto es evidencia relevante sobre cómo funciona la cognición humana, o si es un fenómeno de naturaleza distinta que produce salidas parecidas por un camino completamente diferente. Ninguna de las dos posturas tiene hoy el respaldo mayoritario del campo.' },
  { title: 'LA RELACIÓN MENTE-CEREBRO SIGUE FILOSÓFICAMENTE ABIERTA', detail: 'El fisicalismo (la mente es, en algún sentido, el cerebro) es la postura dominante entre especialistas, pero minorías serias dentro de la filosofía de la mente —incluyendo variantes de panpsiquismo— siguen activas en la discusión académica, no como curiosidad histórica sino como posiciones defendidas hoy.' },
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
      className={`cog-section ${visible[idx] ? 'is-visible' : ''}`}
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

export default function CienciaCognitivaPage() {
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
            NPX-COG-00 // DOCUMENTO TÉCNICO ARCHIVADO
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: 700, letterSpacing: 8, color: ACCENT, textShadow: `0 0 40px ${ACCENT}55`, marginBottom: 14, lineHeight: 1.05 }}>
            CIENCIA COGNITIVA
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            CÓMO SE ESTUDIA UNA MENTE DESDE AFUERA Y DESDE ADENTRO
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 2.1, letterSpacing: 0.3, color: TEXT_DIM, maxWidth: 640, borderLeft: `1px solid ${ACCENT}33`, paddingLeft: 24, marginBottom: 32 }}>
            La mente no es un objeto que se pueda abrir como un reloj. La ciencia cognitiva nació de
            apostar que se la podía estudiar igual: como un sistema que procesa información, con
            partes que se pueden aislar, medir y poner a prueba — tomando prestado de la psicología, la
            lingüística, la neurociencia, la filosofía y la inteligencia artificial, sin pertenecer del
            todo a ninguna. Catorce capas, desde la pregunta original hasta el problema que sigue sin
            resolverse: cómo la actividad eléctrica de un órgano se convierte en experiencia.
          </p>

          {/* sello */}
          <div style={{ display: 'inline-grid', gridTemplateColumns: 'auto auto', gap: '4px 24px', fontSize: 10.5, letterSpacing: 1, color: `${ACCENT}99`, border: `1px solid ${ACCENT}33`, padding: '12px 18px', marginBottom: 32, maxWidth: 640 }}>
            <span style={{ color: `${ACCENT}55` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>INTERDISCIPLINARIA — SIN UN MÉTODO ÚNICO</span>
            <span style={{ color: `${ACCENT}55` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — 14 SECCIONES</span>
            <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>REFERENCIA EDUCATIVA — EL PROBLEMA DIFÍCIL DE LA CONCIENCIA (SECCIÓN X) SIGUE ABIERTO, NO RESUELTO</span>
          </div>

          {/* índice */}
          <nav style={{ border: `1px solid ${ACCENT}22`, padding: '20px 24px', maxWidth: 640, marginBottom: 90 }}>
            <div style={{ fontSize: 10.5, letterSpacing: 3, color: `${ACCENT}66`, marginBottom: 14 }}>ÍNDICE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0 20px' }}>
              {[
                ['I', 'sec-01', 'Introducción'],
                ['II', 'sec-02', 'La revolución cognitiva'],
                ['III', 'sec-03', 'Dartmouth y el nacimiento de la IA'],
                ['IV', 'sec-04', 'La mente como computadora'],
                ['V', 'sec-05', 'Arquitectura de la memoria'],
                ['VI', 'sec-06', 'Percepción'],
                ['VII', 'sec-07', 'Lenguaje y pensamiento'],
                ['VIII', 'sec-08', 'Razonamiento y sesgos'],
                ['IX', 'sec-09', 'El cerebro como sustrato'],
                ['X', 'sec-10', 'Conciencia y el problema difícil'],
                ['XI', 'sec-11', 'Cognición corporizada'],
                ['XII', 'sec-12', 'IA y modelos de la mente'],
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
            La ciencia cognitiva no es una disciplina con un método propio, como la química o la
            física — es un punto de encuentro. Toma el experimento controlado de la psicología, el
            formalismo de la lingüística, la precisión mecanicista de la informática, las preguntas de
            siglos de la filosofía de la mente y, más recientemente, la medición directa de la
            neurociencia — y las usa juntas sobre un mismo objeto: cómo un sistema, biológico o
            artificial, adquiere, representa y usa información para comportarse de forma inteligente.
          </P>
          <P>
            Nació como reacción a un paradigma anterior —el conductismo— que se negaba explícitamente a
            hablar de lo que pasa "adentro" de la mente (Sección II), y pasó por al menos tres grandes
            giros desde entonces: el cómputo simbólico de los años 70-80 (Sección IV), la cognición
            corporizada de los 90 (Sección XI) y el aprendizaje profundo de los 2010 en adelante
            (Sección XII) — cada uno cambiando, en parte, qué se entiende por "explicar la mente".
          </P>
          <Caption>
            Este documento no asume una postura filosófica cerrada sobre qué es la mente — describe el
            campo tal como se desarrolló, con sus propios debates internos marcados como tales, en
            especial en las Secciones X y XIV.
          </Caption>
        </Section>

        {/* II. LA REVOLUCIÓN COGNITIVA */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-02">
          <SectionHeader roman="II" title="LA REVOLUCIÓN COGNITIVA" sub="contra el conductismo" />
          <P>
            Hasta mediados del siglo XX, el conductismo dominaba la psicología experimental: B. F.
            Skinner sostenía que la ciencia debía limitarse a estímulos y respuestas observables,
            tratando la mente como una "caja negra" fuera de los límites legítimos de estudio
            científico. Dos golpes reales empezaron a abrir esa caja.
          </P>
          <P>
            Primero, un resultado experimental: Karl Lashley pasó décadas lesionando distintas zonas de
            la corteza de ratas entrenadas, buscando el punto exacto donde se guarda un recuerdo —y no
            lo encontró. Concluyó, en 1950, que la memoria está <Mono>distribuida</Mono>, no localizada
            en un único lugar — un hallazgo que empuja a estudiar la función del sistema, no solo su
            anatomía puntual.
          </P>
          <P>
            Segundo, un golpe teórico: en 1959 Noam Chomsky publicó una reseña demoledora del libro de
            Skinner "Verbal Behavior", argumentando que el lenguaje —su complejidad, su productividad,
            lo rápido que lo adquiere un niño con datos limitados y ruidosos— no puede explicarse solo
            con condicionamiento por estímulo-respuesta. Hace falta estructura interna. Esa reseña se
            cita, convencionalmente, como el golpe de apertura de la revolución cognitiva.
          </P>
        </Section>

        {/* III. DARTMOUTH */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-03">
          <SectionHeader roman="III" title="DARTMOUTH Y EL NACIMIENTO DE LA IA" sub="1956 — el mismo año, dos fundaciones" />
          <P>
            En el verano de 1956, John McCarthy organizó en Dartmouth College un taller de dos meses
            que hoy se considera el nacimiento formal de la inteligencia artificial como campo — ahí se
            acuña el término mismo, con Marvin Minsky, Nathaniel Rochester y Claude Shannon (ya
            presente en el Codex Cogito) entre los participantes.
          </P>
          <P>
            El mismo año, George Miller publicó "The Magical Number Seven, Plus or Minus Two": la
            memoria de trabajo humana tiene una capacidad limitada, de aproximadamente 7 elementos —
            una de las primeras mediciones cuantitativas y precisas de un límite estructural de la
            mente, en el mismo espíritu de "procesamiento de información" que la nueva IA.
          </P>
        </Section>

        {/* IV. LA MENTE COMO COMPUTADORA */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-04">
          <SectionHeader roman="IV" title="LA MENTE COMO COMPUTADORA" sub="la hipótesis del sistema de símbolos físicos" />
          <P>
            Allen Newell y Herbert Simon formalizaron en 1976 la apuesta central de la ciencia
            cognitiva temprana: un <Mono>sistema de símbolos físicos</Mono> —algo que manipula
            representaciones discretas según reglas— tiene los medios necesarios y suficientes para la
            acción inteligente general. La mente, en esta visión, es cómputo: procesamiento de símbolos
            sobre representaciones, en principio independiente de si el soporte físico es un cerebro de
            carbono o un circuito de silicio.
          </P>
          <Panel>
            <Stat label="HIPÓTESIS DEL SISTEMA DE SÍMBOLOS FÍSICOS" value="Newell & Simon, 1976 (discurso del Premio Turing)" />
            <Caption>
              Es la idea que hizo posible, por primera vez, estudiar "la cognición" sin estudiar
              directamente neuronas — a nivel de representación y algoritmo. Esa separación de niveles
              se formaliza después con el marco de Marr (Sección VI).
            </Caption>
          </Panel>
        </Section>

        {/* V. ARQUITECTURA DE LA MEMORIA */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-05">
          <SectionHeader roman="V" title="ARQUITECTURA DE LA MEMORIA" />
          <Panel>
            <MemoryDiagram />
            <Caption>
              Modelo multi-almacén de Atkinson y Shiffrin (1968). La "memoria de trabajo" se refinó
              después (Baddeley y Hitch, 1974) en componentes propios: un ejecutivo central, un bucle
              fonológico para información verbal, una agenda visoespacial, y —agregada en 2000— un
              búfer episódico que integra información de distintas fuentes.
            </Caption>
          </Panel>
        </Section>

        {/* VI. PERCEPCIÓN */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-06">
          <SectionHeader roman="VI" title="PERCEPCIÓN" sub="de los datos crudos a la forma organizada" />
          <P>
            Los psicólogos de la Gestalt, a principios del siglo XX, ya habían mostrado que la
            percepción no ensambla pasivamente átomos sensoriales sueltos: los organiza activamente
            según principios como proximidad, similitud y cierre — "el todo es distinto de la suma de
            sus partes" no es una frase poética, es una descripción literal de cómo funciona la visión.
          </P>
          <P>
            David Marr propuso, en 1982, un marco de tres niveles para especificar con precisión qué
            significa "explicar" un proceso cognitivo como la visión: el nivel <Mono>computacional</Mono>{' '}
            (qué problema se resuelve y por qué), el <Mono>algorítmico</Mono> (qué representación y
            procedimiento lo resuelven) y el de <Mono>implementación</Mono> (cómo se realiza
            físicamente, en neuronas o en silicio). El marco se sigue usando hoy, fuera incluso de la
            visión, para ordenar qué tipo de pregunta se está haciendo sobre cualquier proceso mental.
          </P>
        </Section>

        {/* VII. LENGUAJE Y PENSAMIENTO */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-07">
          <SectionHeader roman="VII" title="LENGUAJE Y PENSAMIENTO" />
          <P>
            La <Mono>gramática universal</Mono> de Chomsky propone una facultad del lenguaje innata,
            compartida por toda la especie, con parámetros que se fijan según la lengua específica a la
            que un niño está expuesto — el argumento central es la "pobreza del estímulo": los niños
            adquieren estructuras gramaticales complejas a partir de datos limitados y a veces
            gramaticalmente incorrectos, más rápido y de forma más uniforme de lo que un aprendizaje
            puramente estadístico explicaría con facilidad.
          </P>
          <P>
            La hipótesis <Mono>Sapir-Whorf</Mono> plantea una pregunta distinta: ¿el lenguaje que uno
            habla moldea cómo piensa? La versión fuerte (determinismo lingüístico — el lenguaje
            determina el pensamiento) está mayormente descartada. La versión débil (relatividad
            lingüística — el lenguaje influye en patrones habituales de pensamiento y percepción) tiene
            evidencia real a favor, por ejemplo en estudios sobre categorización de colores y sobre
            cómo distintas lenguas codifican el espacio.
          </P>
        </Section>

        {/* VIII. RAZONAMIENTO Y SESGOS */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-08">
          <SectionHeader roman="VIII" title="RAZONAMIENTO Y SESGOS" sub="Kahneman y Tversky — Sistema 1 / Sistema 2" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {SYSTEMS.map(s => (
              <Panel key={s.title}>
                <div style={{ fontSize: 12, letterSpacing: 2, color: ACCENT, marginBottom: 10, textShadow: `0 0 10px ${ACCENT}44` }}>{s.title}</div>
                <div style={{ fontSize: 11.5, lineHeight: 1.8, color: TEXT_DIM }}>{s.detail}</div>
              </Panel>
            ))}
          </div>
          <P>
            Daniel Kahneman y Amos Tversky documentaron, desde los años 70, heurísticas sistemáticas que
            el Sistema 1 usa como atajo —y que producen errores predecibles, no aleatorios— como el
            anclaje (dejarse influir por un número irrelevante visto antes de estimar otro) o la
            aversión a la pérdida (perder algo duele más de lo que place ganar lo mismo). Kahneman
            recibió el Nobel de Economía en 2002 por este programa de investigación, sin ser economista
            de formación.
          </P>
        </Section>

        {/* IX. EL CEREBRO COMO SUSTRATO */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-09">
          <SectionHeader roman="IX" title="EL CEREBRO COMO SUSTRATO" sub="de la caja negra computacional a la neurociencia cognitiva" />
          <P>
            La ciencia cognitiva temprana podía, en buena medida, ignorar el cerebro: lo que importaba
            era el nivel de representación y algoritmo (Sección VI), no la implementación. Eso cambió
            con herramientas de medición cerebral cada vez mejores — y con marcos teóricos que
            conectaban directamente desarrollo neuronal con función cognitiva.
          </P>
          <P>
            Jean-Pierre Changeux —ya presente en el Codex Cogito de este sitio— propuso en 1973 que el
            cerebro infantil fabrica muchas más sinapsis de las que va a necesitar, y que la experiencia
            decide cuáles sobreviven: las que se usan se estabilizan, las que no se usan se retraen.
            Gerald Edelman llegó, de forma independiente, a un marco con el mismo espíritu de variación
            y selección —"darwinismo neuronal"— en 1987. Ninguno de los dos reemplaza al otro; son dos
            formulaciones del mismo tipo de idea: el cerebro adulto no está construido según un plano,
            es lo que quedó después de un proceso de selección guiado por la actividad.
          </P>
        </Section>

        {/* X. CONCIENCIA Y EL PROBLEMA DIFÍCIL */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-10">
          <SectionHeader roman="X" title="CONCIENCIA Y EL PROBLEMA DIFÍCIL" />
          <P>
            David Chalmers distinguió, en 1995, dos tipos de problemas sobre la mente. Los{' '}
            <Mono>problemas fáciles</Mono> —que no son triviales, solo tratables con el método
            estándar— incluyen explicar cómo el cerebro integra información, cómo reporta sus propios
            estados, cómo dirige la atención. El <Mono>problema difícil</Mono> es otro, cualitativamente
            distinto: por qué todo ese procesamiento viene acompañado de experiencia subjetiva —por qué
            hay "algo que se siente" ser un sistema así, en vez de que todo ese procesamiento ocurra "a
            oscuras", sin nadie adentro.
          </P>
          <P>
            Dos teorías influyentes intentan abordarlo desde ángulos distintos. La{' '}
            <Mono>Teoría de la Información Integrada</Mono> (Giulio Tononi, desde 2004) propone una
            cantidad matemática, Φ (phi), que mediría cuánta información integra un sistema de forma
            irreducible — y sostiene que la conciencia ES esa integración. La{' '}
            <Mono>Teoría del Espacio de Trabajo Global</Mono> (Bernard Baars, 1988; con correlatos
            neuronales propuestos después por Stanislas Dehaene) sostiene que un contenido se vuelve
            consciente cuando se difunde globalmente y queda disponible para múltiples sistemas
            cerebrales a la vez, en vez de quedar encapsulado en un módulo aislado.
          </P>
          <Caption>
            Ninguna de las dos resuelve, por consenso aceptado, el problema difícil tal como lo planteó
            Chalmers — ver la controversia real sobre la IIT en la Sección XIV.
          </Caption>
        </Section>

        {/* XI. COGNICIÓN CORPORIZADA */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-11">
          <SectionHeader roman="XI" title="COGNICIÓN CORPORIZADA Y SITUADA" sub="la crítica al modelo puramente simbólico" />
          <P>
            En 1991, Francisco Varela, Evan Thompson y Eleanor Rosch publicaron "The Embodied Mind",
            cuestionando que la cognición sea manipulación de símbolos internos desconectada del cuerpo
            y del entorno. Propusieron, en cambio, la <Mono>enacción</Mono>: la mente emerge de la
            interacción dinámica y activa entre un organismo y su ambiente — con referencias explícitas
            a la fenomenología de Merleau-Ponty y a la filosofía budista.
          </P>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FOUR_E.map(e => (
              <Panel key={e.title}>
                <div style={{ fontSize: 12.5, letterSpacing: 1.5, color: ACCENT, marginBottom: 10, textShadow: `0 0 10px ${ACCENT}44` }}>{e.title}</div>
                <div style={{ fontSize: 11.5, lineHeight: 1.8, color: TEXT_DIM }}>{e.detail}</div>
              </Panel>
            ))}
          </div>
        </Section>

        {/* XII. IA Y MODELOS DE LA MENTE */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-12">
          <SectionHeader roman="XII" title="INTELIGENCIA ARTIFICIAL Y MODELOS DE LA MENTE" />
          <P>
            Durante décadas, la IA simbólica (reglas explícitas, lógica, búsqueda en árboles) y el
            conexionismo (redes neuronales distribuidas, sin reglas explícitas, aprendidas por ejemplo)
            compitieron como dos visiones rivales de cómo modelar la cognición — el volumen "Parallel
            Distributed Processing" de Rumelhart y McClelland (1986) fue, en su momento, el manifiesto
            más influyente del segundo bando.
          </P>
          <P>
            Los modelos de lenguaje actuales reabrieron esa disputa en términos nuevos, y conviene ser
            preciso sobre qué son: sistemas estadísticos entrenados para predecir la siguiente palabra
            de un texto, no modelos diseñados para replicar la arquitectura cognitiva humana. Que
            produzcan salidas que invitan a compararlos con el razonamiento humano no implica,
            automáticamente, que compartan sus mecanismos — es, hoy, una de las preguntas más disputadas
            del campo, no una curiosidad resuelta (Sección XIV).
          </P>
        </Section>

        {/* XIII. LÍNEA DE TIEMPO */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-13">
          <SectionHeader roman="XIII" title="LÍNEA DE TIEMPO" sub="de Lashley al aprendizaje profundo" />
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
            Todo lo anterior describe hitos, experimentos y marcos con respaldo histórico verificable.
            Esta sección es distinta a propósito: reúne, explícitamente como tales, los debates activos
            del campo — incluida una controversia pública real, no solo desacuerdos académicos de bajo
            perfil.
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
            NPX-COG-00 // DOCUMENTO SIN ENLAZAR — ARCHIVO ACCEDIDO DIRECTO, NO INDEXADO
          </div>
        </div>
      </div>

      <style>{`
        .cog-section { opacity: 0; transform: translateY(26px); transition: opacity 0.8s ease, transform 0.8s ease; }
        .cog-section.is-visible { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .cog-section { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
