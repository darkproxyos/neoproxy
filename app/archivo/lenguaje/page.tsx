'use client'

import { useEffect, useRef, useState } from 'react'

// ARCHIVO / LENGUAJE — página oculta, sin link desde ningún otro lugar del
// sitio (no está en nav-config.ts, no se referencia desde ninguna otra
// ruta). Solo se llega tipeando /archivo/lenguaje directo en la barra.
// Infografía de lingüística, en español, con el mismo lenguaje visual que
// /knowledge/filosofia y el resto del sitio: fondo casi negro, paneles de
// vidrio con borde de color y glow, tipografía Space Mono, headers en
// mayúscula con letter-spacing. Acento propio de esta página: verde-teal
// #2ee6b8, distinto de los acentos ya usados en el resto del sitio
// (fabricación azul, laboratorio naranja, experimental rojo, conocimiento
// violeta, proxyverse verde-menta, manifiesto dorado, y los dos hermanos
// ocultos en cian/magenta).

const mono = "'Space Mono', monospace"
const TEAL = '#2ee6b8'

// ---------------------------------------------------------------------------
// Datos de contenido
// ---------------------------------------------------------------------------

// inventario consonántico del español general — fonema AFI, modo, punto,
// sonoridad y ejemplo; variantes dialectales señaladas donde corresponde
type ConsonantEntry = { symbol: string; manner: string; place: string; voicing: string; example: string; note?: string }
const SPANISH_CONSONANTS: ConsonantEntry[] = [
  { symbol: '/p/', manner: 'Oclusiva', place: 'Bilabial', voicing: 'Sorda', example: '"pato"' },
  { symbol: '/b/', manner: 'Oclusiva', place: 'Bilabial', voicing: 'Sonora', example: '"bato"', note: 'aproximante [β] entre vocales' },
  { symbol: '/t/', manner: 'Oclusiva', place: 'Dental', voicing: 'Sorda', example: '"tos"' },
  { symbol: '/d/', manner: 'Oclusiva', place: 'Dental', voicing: 'Sonora', example: '"dedo"', note: 'aproximante [ð] entre vocales' },
  { symbol: '/k/', manner: 'Oclusiva', place: 'Velar', voicing: 'Sorda', example: '"casa"' },
  { symbol: '/g/', manner: 'Oclusiva', place: 'Velar', voicing: 'Sonora', example: '"gato"', note: 'aproximante [ɣ] entre vocales' },
  { symbol: '/f/', manner: 'Fricativa', place: 'Labiodental', voicing: 'Sorda', example: '"foco"' },
  { symbol: '/θ/', manner: 'Fricativa', place: 'Interdental', voicing: 'Sorda', example: '"cielo"', note: 'solo en dialectos con distinción (centro-norte de España)' },
  { symbol: '/s/', manner: 'Fricativa', place: 'Alveolar', voicing: 'Sorda', example: '"sol"' },
  { symbol: '/x/', manner: 'Fricativa', place: 'Velar', voicing: 'Sorda', example: '"jamón"', note: 'varía a [h] en Caribe y Centroamérica' },
  { symbol: '/tʃ/', manner: 'Africada', place: 'Postalveolar', voicing: 'Sorda', example: '"chico"' },
  { symbol: '/m/', manner: 'Nasal', place: 'Bilabial', voicing: 'Sonora', example: '"mano"' },
  { symbol: '/n/', manner: 'Nasal', place: 'Alveolar', voicing: 'Sonora', example: '"nido"' },
  { symbol: '/ɲ/', manner: 'Nasal', place: 'Palatal', voicing: 'Sonora', example: '"niño"' },
  { symbol: '/l/', manner: 'Lateral', place: 'Alveolar', voicing: 'Sonora', example: '"luna"' },
  { symbol: '/ʝ/', manner: 'Fricativa/lateral', place: 'Palatal', voicing: 'Sonora', example: '"calle"', note: 'yeísmo (mayoritario); [ʎ] lateral solo en zonas con lleísmo' },
  { symbol: '/ɾ/', manner: 'Vibrante simple', place: 'Alveolar', voicing: 'Sonora', example: '"pero"' },
  { symbol: '/r/', manner: 'Vibrante múltiple', place: 'Alveolar', voicing: 'Sonora', example: '"perro"' },
  { symbol: '/w/', manner: 'Aproximante', place: 'Labiovelar', voicing: 'Sonora', example: '"hueso"' },
  { symbol: '/j/', manner: 'Aproximante', place: 'Palatal', voicing: 'Sonora', example: '"hielo"' },
]

// ---------------------------------------------------------------------------
// Datos — línea de tiempo de la lingüística como ciencia
// ---------------------------------------------------------------------------
type TimelineEntry = { year: string; title: string; detail: string }
const LINGUISTICS_TIMELINE: TimelineEntry[] = [
  { year: '~350 a.C.', title: 'Gramática de Pāṇini', detail: 'El gramático sánscrito Pāṇini escribe el Aṣṭādhyāyī, una descripción formal y sistemática del sánscrito tan precisa que anticipa la noción moderna de regla generativa — más de 2000 años antes de Chomsky' },
  { year: 'Siglo XIX', title: 'Gramática comparada', detail: 'Los neogramáticos (Grimm, Verner, Brugmann) formalizan el cambio sonoro regular entre lenguas emparentadas — la "ley de Grimm" explica correspondencias sistemáticas entre el germánico y otras lenguas indoeuropeas, sentando las bases de la lingüística histórica como ciencia' },
  { year: '1916', title: 'Curso de lingüística general', detail: 'Publicado póstumamente a partir de apuntes de clase de Ferdinand de Saussure — distingue langue (el sistema abstracto compartido) de parole (el habla individual), y establece la arbitrariedad del signo lingüístico. Funda la lingüística moderna como disciplina' },
  { year: '1930s', title: 'Hipótesis Sapir-Whorf', detail: 'Edward Sapir y Benjamin Lee Whorf proponen que la lengua que hablamos moldea cómo pensamos (relatividad lingüística) — su versión fuerte (determinismo lingüístico) está hoy mayoritariamente descartada; versiones débiles siguen siendo objeto de estudio empírico' },
  { year: '1957', title: 'Estructuras sintácticas', detail: 'Noam Chomsky publica Syntactic Structures — la gramática generativa reemplaza al estructuralismo descriptivo como paradigma dominante, y la sintaxis pasa a modelarse con reglas formales explícitas' },
  { year: '1960s', title: 'Variación sociolingüística', detail: 'William Labov estudia estadísticamente la variación del habla en Nueva York (el estudio de la "r" postvocálica en grandes almacenes) — funda la sociolingüística variacionista como campo empírico riguroso' },
  { year: '1966', title: 'ELIZA', detail: 'Joseph Weizenbaum crea el primer programa capaz de simular una conversación (un terapeuta rogeriano) con reglas de coincidencia de patrones — el origen simbólico del procesamiento del lenguaje natural computacional' },
  { year: '2013', title: 'Word2Vec', detail: 'Representaciones vectoriales de palabras entrenadas por contexto (Mikolov et al.) — la distribución estadística de una palabra en grandes corpus empieza a capturar relaciones semánticas reales, computacionalmente' },
  { year: '2017', title: 'Transformers', detail: '"Attention Is All You Need" (Vaswani et al.) introduce la arquitectura detrás de los modelos de lenguaje modernos — un cambio de paradigma tan grande para el PLN computacional como lo fue la gramática generativa para la lingüística teórica' },
]

// ---------------------------------------------------------------------------
// Datos — tipología lingüística
// ---------------------------------------------------------------------------
const WORD_ORDER_TYPOLOGY = {
  label: 'Orden de palabras (sujeto, verbo, objeto)',
  rows: [
    { order: 'SOV', pct: 'el más común', examples: 'japonés, turco, latín clásico' },
    { order: 'SVO', pct: 'segundo más común', examples: 'español, inglés, mandarín' },
    { order: 'VSO', pct: 'menos común', examples: 'irlandés, árabe clásico, galés' },
    { order: 'VOS / OVS / OSV', pct: 'raros', examples: 'malgache (VOS); algunas lenguas amazónicas (OVS/OSV)' },
  ],
}
const MORPHOLOGICAL_TYPOLOGY: { label: string; detail: string; examples: string }[] = [
  { label: 'Aislante / analítica', detail: 'Cada palabra es invariable, una sola unidad — la gramática se expresa con orden y palabras separadas, no con afijos', examples: 'mandarín, vietnamita' },
  { label: 'Aglutinante', detail: 'Las palabras se arman pegando una secuencia de afijos, cada uno con un solo significado claramente segmentable', examples: 'turco, japonés, finés' },
  { label: 'Fusional', detail: 'Un solo afijo codifica varios significados gramaticales a la vez (género + número + caso, por ejemplo), sin que se puedan separar limpiamente', examples: 'español, latín, ruso' },
  { label: 'Polisintética', detail: 'Una sola palabra puede incorporar lo que en otras lenguas serían varias palabras u oraciones completas (verbo + objeto + modificadores)', examples: 'inuktitut, mohawk' },
]

// ---------------------------------------------------------------------------
// Datos — adquisición del lenguaje
// ---------------------------------------------------------------------------
type AcquisitionStage = { age: string; stage: string; detail: string }
const ACQUISITION_STAGES: AcquisitionStage[] = [
  { age: '0–6 meses', stage: 'Balbuceo', detail: 'Produce sonidos silábicos repetidos ("bababa") independientemente de la lengua del entorno — incluso bebés sordos balbucean con las manos si están expuestos a lengua de señas' },
  { age: '~12 meses', stage: 'Etapa de una palabra', detail: 'Primeras palabras aisladas con función comunicativa real, generalmente referidas a objetos y personas del entorno inmediato' },
  { age: '~18–24 meses', stage: 'Etapa de dos palabras', detail: 'Combina dos palabras con relaciones semánticas simples ("more juice", "papá auto") — el inicio de la sintaxis real' },
  { age: '~2–3 años', stage: 'Habla telegráfica', detail: 'Oraciones cortas que omiten morfemas gramaticales pero mantienen el orden básico de palabras y las unidades de contenido' },
  { age: '~3–5 años', stage: 'Sobregeneralización', detail: 'Aplica reglas morfológicas regulares a casos irregulares ("goed" en vez de "went", "rompido" en vez de "roto") — evidencia de que el niño extrae y aplica una regla, no que memoriza o imita' },
]

// ---------------------------------------------------------------------------
// Datos — lingüística computacional y PLN
// ---------------------------------------------------------------------------
type NlpTopic = { title: string; detail: string }
const NLP_TOPICS: NlpTopic[] = [
  { title: 'MODELOS DE N-GRAMAS', detail: 'El enfoque estadístico más simple: la probabilidad de la próxima palabra depende solo de las N palabras anteriores. Funciona razonablemente para tareas acotadas, pero no puede capturar dependencias de largo alcance en una oración.' },
  { title: 'SEMÁNTICA DISTRIBUCIONAL', detail: '"Conocerás una palabra por la compañía que frecuenta" (J.R. Firth, 1957) — la idea de que el significado de una palabra puede aproximarse por los contextos en los que aparece, sin necesidad de definirlo explícitamente. Base teórica de los embeddings de palabras modernos (Word2Vec, GloVe).' },
  { title: 'GRAMÁTICAS FORMALES Y PARSERS', detail: 'La conexión directa con la Sección IX (jerarquía de Chomsky): un parser sintáctico aplica reglas de una gramática formal para reconstruir la estructura jerárquica de una oración — el puente histórico entre la lingüística teórica y la ingeniería del lenguaje.' },
  { title: 'ATENCIÓN Y TRANSFORMERS', detail: 'La arquitectura detrás de los modelos de lenguaje actuales no procesa palabra por palabra en secuencia estricta — calcula, para cada palabra, cuánto "atender" a cada otra palabra de la entrada, sin importar la distancia entre ellas. Resolvió el problema de las dependencias de largo alcance que limitaba a los n-gramas.' },
  { title: '¿ENTIENDEN LENGUAJE LOS MODELOS GRANDES?', detail: 'Pregunta activamente debatida, no resuelta: si un modelo entrenado solo con la forma distribucional del texto (sin referencia directa al mundo) puede decirse que "entiende" el significado, o si solo reproduce patrones estadísticos sofisticados sin ningún correlato de comprensión real — una versión moderna y muy concreta del viejo problema filosófico del "cuarto chino" de Searle (1980).' },
]

// ---------------------------------------------------------------------------
// Datos — fronteras abiertas (debates sin resolver)
// ---------------------------------------------------------------------------
type OpenDebate = { title: string; detail: string }
const OPEN_DEBATES: OpenDebate[] = [
  { title: 'INNATISMO VS. EMERGENTISMO', detail: 'Chomsky y la Gramática Universal sostienen que existe una capacidad lingüística innata, específica de la especie. Enfoques basados en el uso (Michael Tomasello y otros) sostienen que la gramática emerge de mecanismos cognitivos generales (categorización, memoria, imitación) aplicados a la exposición masiva al habla — sin necesidad de postular un módulo lingüístico innato específico. Sigue siendo uno de los debates centrales de la teoría lingüística.' },
  { title: '¿TIENEN LENGUAJE OTRAS ESPECIES?', detail: 'Proyectos como los de Washoe (chimpancé, lengua de señas) o Kanzi (bonobo, símbolos léxicos) mostraron comunicación simbólica compleja en grandes simios, pero la evidencia de que alcancen sintaxis recursiva comparable a la humana es, como mínimo, muy disputada — gran parte de la comunidad lingüística distingue la comunicación simbólica (que sí comparten varias especies) del lenguaje con gramática recursiva (que, hasta ahora, parece exclusivamente humano).' },
  { title: 'EL ORIGEN DEL LENGUAJE (GLOSOGÉNESIS)', detail: 'Cómo y cuándo apareció el lenguaje en la especie humana es, posiblemente, el problema más difícil de la lingüística — no deja fósiles directos. Las hipótesis van desde una mutación genética puntual relativamente reciente hasta una evolución gradual de sistemas comunicativos preexistentes a lo largo de cientos de miles de años. La Sociedad Lingüística de París llegó a prohibir formalmente el tema como objeto de debate académico en 1866, por considerarlo irresoluble con la evidencia disponible — la prohibición ya no rige, pero el problema de fondo sigue sin resolverse.' },
  { title: 'RELATIVIDAD LINGÜÍSTICA, VERSIÓN DÉBIL', detail: 'Pese al rechazo de la versión fuerte de Sapir-Whorf, estudios experimentales modernos (ej. sobre cómo distintas lenguas codifican el espacio, el tiempo o el color) muestran efectos reales, aunque modestos, de la estructura de una lengua sobre ciertas tareas cognitivas no lingüísticas — cuánto y en qué condiciones exactas sigue siendo un área activa de investigación, no una pregunta cerrada.' },
]

type ChomskyLevel = { tag: string; title: string; w: number; h: number; labelY: number; centered: boolean }
const CHOMSKY_LEVELS: ChomskyLevel[] = [
  { tag: 'TIPO 0', title: 'RECURSIVAMENTE ENUMERABLES', w: 600, h: 380, labelY: 0, centered: false },
  { tag: 'TIPO 1', title: 'SENSIBLES AL CONTEXTO', w: 500, h: 300, labelY: 0, centered: false },
  { tag: 'TIPO 2', title: 'LIBRES DE CONTEXTO', w: 400, h: 210, labelY: 0, centered: false },
  { tag: 'TIPO 3', title: 'REGULARES', w: 260, h: 90, labelY: 0, centered: true },
]

// ---------------------------------------------------------------------------
// Diagramas SVG
// ---------------------------------------------------------------------------

type TreeNode = { x: number; y: number; label: string; terminal?: boolean }

function SyntaxTree() {
  const nodes: TreeNode[] = [
    { x: 320, y: 36, label: 'S' },
    { x: 170, y: 134, label: 'SN' },
    { x: 470, y: 134, label: 'SV' },
    { x: 110, y: 228, label: 'Det' },
    { x: 250, y: 228, label: 'N' },
    { x: 470, y: 228, label: 'V' },
    { x: 110, y: 302, label: 'El', terminal: true },
    { x: 250, y: 302, label: 'gato', terminal: true },
    { x: 470, y: 302, label: 'duerme', terminal: true },
  ]
  const edges: [number, number][] = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [3, 6], [4, 7], [5, 8]]

  return (
    <svg viewBox="0 0 580 330" style={{ width: '100%', height: 'auto', maxWidth: 480, display: 'block', margin: '0 auto' }}>
      {edges.map(([a, b], i) => {
        const pa = nodes[a]
        const pb = nodes[b]
        const y1 = pa.y + (pa.terminal ? 9 : 17)
        const y2 = pb.y - (pb.terminal ? 9 : 17)
        return <line key={i} x1={pa.x} y1={y1} x2={pb.x} y2={y2} stroke={`${TEAL}70`} strokeWidth={1.3} />
      })}
      {nodes.map((n, i) => (
        <g key={i}>
          {!n.terminal && (
            <rect
              x={n.x - 27} y={n.y - 17} width={54} height={34} rx={4}
              fill="rgba(46,230,184,0.06)" stroke={`${TEAL}aa`} strokeWidth={1}
            />
          )}
          <text
            x={n.x} y={n.y + 5} textAnchor="middle" fontFamily={mono}
            fontSize={n.terminal ? 13 : 13} fontWeight={n.terminal ? 700 : 400}
            fill={n.terminal ? '#eafff6' : TEAL} letterSpacing={0.5}
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

function ChomskyHierarchy() {
  // rectángulos anidados, centrados sobre un viewBox de 640x420
  const cx = 320
  const cy = 210
  const boxes = CHOMSKY_LEVELS.map(lvl => ({
    ...lvl,
    x: cx - lvl.w / 2,
    y: cy - lvl.h / 2,
  }))

  return (
    <svg viewBox="0 0 640 420" style={{ width: '100%', height: 'auto', maxWidth: 560, display: 'block', margin: '0 auto' }}>
      {boxes.map((b, i) => {
        const opacity = 0.9 - i * 0.14
        return (
          <rect
            key={i}
            x={b.x} y={b.y} width={b.w} height={b.h} rx={10}
            fill="none"
            stroke={TEAL}
            strokeOpacity={opacity}
            strokeWidth={1.4}
          />
        )
      })}
      {boxes.map((b, i) => (
        <text
          key={`label-${i}`}
          x={b.centered ? cx : b.x + 16}
          y={b.centered ? cy - 4 : b.y + 24}
          textAnchor={b.centered ? 'middle' : 'start'}
          fontFamily={mono}
          fontSize={11}
          fontWeight={700}
          letterSpacing={1.5}
          fill={TEAL}
        >
          {b.tag}
        </text>
      ))}
      {boxes.map((b, i) => (
        <text
          key={`sub-${i}`}
          x={b.centered ? cx : b.x + 16}
          y={b.centered ? cy + 16 : b.y + 40}
          textAnchor={b.centered ? 'middle' : 'start'}
          fontFamily={mono}
          fontSize={9}
          letterSpacing={0.5}
          fill="#9fb8d6"
        >
          {b.title}
        </text>
      ))}
    </svg>
  )
}

type FamilyBranch = { x: number; label: string; leaves: string[] }
function LanguageFamilyTree() {
  const rootX = 380
  const rootY = 28
  const branchY = 140
  const leafY = 226
  const branches: FamilyBranch[] = [
    { x: 110, label: 'GERMÁNICAS', leaves: ['alemán', 'inglés', 'neerlandés'] },
    { x: 300, label: 'ROMÁNICAS', leaves: ['español', 'francés', 'italiano', 'portugués'] },
    { x: 490, label: 'ESLAVAS', leaves: ['ruso', 'polaco', 'checo'] },
    { x: 650, label: 'INDOIRANÍES', leaves: ['hindi', 'persa'] },
  ]
  // offsets horizontales de cada hoja dentro de su rama
  const leafOffsets: Record<string, number[]> = {
    GERMÁNICAS: [-68, 0, 68],
    ROMÁNICAS: [-84, -28, 28, 84],
    ESLAVAS: [-60, 0, 60],
    INDOIRANÍES: [-40, 40],
  }

  return (
    <svg viewBox="0 0 760 260" style={{ width: '100%', height: 'auto', maxWidth: 680, display: 'block', margin: '0 auto' }}>
      {/* raíz → ramas */}
      {branches.map((b, i) => (
        <line key={`r-${i}`} x1={rootX} y1={rootY + 14} x2={b.x} y2={branchY - 16} stroke={`${TEAL}70`} strokeWidth={1.3} />
      ))}
      {/* ramas → hojas */}
      {branches.map((b, bi) =>
        leafOffsets[b.label].map((off, li) => (
          <line key={`l-${bi}-${li}`} x1={b.x} y1={branchY + 10} x2={b.x + off} y2={leafY - 10} stroke={`${TEAL}45`} strokeWidth={1} />
        ))
      )}

      {/* raíz */}
      <rect x={rootX - 92} y={rootY - 15} width={184} height={30} rx={5} fill="rgba(46,230,184,0.08)" stroke={TEAL} strokeWidth={1.2} />
      <text x={rootX} y={rootY + 5} textAnchor="middle" fontFamily={mono} fontSize={11} fontWeight={700} letterSpacing={1} fill={TEAL}>
        PROTOINDOEUROPEO
      </text>

      {/* ramas */}
      {branches.map((b, i) => (
        <g key={`branch-${i}`}>
          <rect x={b.x - 62} y={branchY - 15} width={124} height={30} rx={5} fill="rgba(46,230,184,0.05)" stroke={`${TEAL}aa`} strokeWidth={1} />
          <text x={b.x} y={branchY + 5} textAnchor="middle" fontFamily={mono} fontSize={9.5} fontWeight={700} letterSpacing={0.5} fill={TEAL}>
            {b.label}
          </text>
        </g>
      ))}

      {/* hojas */}
      {branches.map((b, bi) =>
        leafOffsets[b.label].map((off, li) => (
          <text
            key={`leaf-${bi}-${li}`}
            x={b.x + off} y={leafY + 4} textAnchor="middle"
            fontFamily={mono} fontSize={9} fill="#c8daf0" letterSpacing={0.2}
          >
            {b.leaves[li]}
          </text>
        ))
      )}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Bloques de layout reutilizables
// ---------------------------------------------------------------------------

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(5, 14, 12, 0.55)',
        border: `1px solid ${TEAL}33`,
        boxShadow: `0 0 28px ${TEAL}0f, inset 0 0 40px rgba(0,0,0,0.3)`,
        padding: '26px 28px',
        borderRadius: 2,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function LevelHeader({ roman, title }: { roman: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 18 }}>
      <span style={{ fontSize: 13, color: `${TEAL}77`, letterSpacing: 2 }}>{roman}</span>
      <h2
        style={{
          fontSize: 19, letterSpacing: 4, color: TEAL, textShadow: `0 0 22px ${TEAL}44`,
          fontWeight: 700, margin: 0,
        }}
      >
        {title}
      </h2>
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12, lineHeight: 2, letterSpacing: 0.3, color: '#9fb8d6', marginTop: 0, marginBottom: 14 }}>
      {children}
    </p>
  )
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span style={{ color: '#eafff6', fontWeight: 700 }}>{children}</span>
}

function TimelineRow({ entry, isLast }: { entry: TimelineEntry; isLast: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14, flexShrink: 0 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: TEAL, boxShadow: `0 0 10px ${TEAL}aa`, flexShrink: 0, marginTop: 4 }} />
        {!isLast && <div style={{ width: 1, flexGrow: 1, background: `${TEAL}33`, marginTop: 4 }} />}
      </div>
      <div style={{ paddingBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: TEAL, letterSpacing: 1, textShadow: `0 0 10px ${TEAL}55` }}>{entry.year}</span>
          <span style={{ fontSize: 11, letterSpacing: 1, color: '#eafff6' }}>{entry.title}</span>
        </div>
        <div style={{ fontSize: 10, lineHeight: 1.7, color: '#9fb8d6', marginTop: 6, maxWidth: 580 }}>{entry.detail}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

const TOTAL_SECTIONS = 15

export default function LenguajePage() {
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
    }, { threshold: 0.15, rootMargin: '0px 0px -80px 0px' })

    sectionRefs.current.forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const registerRef = (idx: number) => (el: HTMLDivElement | null) => {
    sectionRefs.current[idx] = el
  }

  let sIdx = 0
  const nextIdx = () => sIdx++

  return (
    <div style={{ background: '#000205', minHeight: '100vh', fontFamily: mono, color: '#c8daf0', position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Encabezado */}
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '104px 24px 0' }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${TEAL}44`, marginBottom: 16 }}>
            NPX-LNG-00 // DOCUMENTO DE ARCHIVO — ACCESO DIRECTO
          </div>
          <h1
            style={{
              fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: 700, letterSpacing: 8, color: TEAL,
              textShadow: `0 0 40px ${TEAL}55`, marginBottom: 28, lineHeight: 1.1,
            }}
          >
            ATLAS DEL LENGUAJE
          </h1>
          <p
            style={{
              fontFamily: mono, fontSize: 11, lineHeight: 2.1, letterSpacing: 0.4, color: '#8fb8d6',
              maxWidth: 640, marginBottom: 32, borderLeft: `1px solid ${TEAL}33`, paddingLeft: 24,
            }}
          >
            La lingüística estudia el lenguaje humano como objeto formal: no cómo "debería" hablarse,
            sino cómo funciona realmente un sistema que cualquier humano sano adquiere sin instrucción
            explícita. Se organiza en niveles de análisis anidados — de la onda sonora física hasta el
            significado en contexto —, pero también en cómo varía entre lenguas, cómo se adquiere, cómo
            se modela computacionalmente, y en qué sigue sin resolverse del todo. Ese recorrido completo
            es el cuerpo de este documento.
          </p>

          {/* sello de documento */}
          <div
            style={{
              display: 'inline-grid',
              gridTemplateColumns: 'auto auto',
              gap: '4px 24px',
              fontSize: 9,
              letterSpacing: 1,
              color: `${TEAL}99`,
              border: `1px solid ${TEAL}33`,
              padding: '12px 18px',
              marginBottom: 32,
            }}
          >
            <span style={{ color: `${TEAL}55` }}>CLASIFICACIÓN</span><span style={{ color: '#eafff6' }}>NO RESTRINGIDA — CONSENSO DESCRIPTIVO</span>
            <span style={{ color: `${TEAL}55` }}>REVISIÓN</span><span style={{ color: '#eafff6' }}>02 — 15 SECCIONES</span>
            <span style={{ color: `${TEAL}55` }}>ALCANCE</span><span style={{ color: '#eafff6' }}>SONIDO → SIGNIFICADO → DEBATE ABIERTO</span>
          </div>

          {/* índice */}
          <nav style={{ border: `1px solid ${TEAL}22`, padding: '20px 24px', maxWidth: 680, marginBottom: 90 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: `${TEAL}66`, marginBottom: 14 }}>
              ÍNDICE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '6px 20px' }}>
              {[
                ['I', 'sec-01', 'Fonética'],
                ['II', 'sec-02', 'Línea de tiempo de la lingüística'],
                ['III', 'sec-03', 'Fonología'],
                ['IV', 'sec-04', 'Morfología'],
                ['V', 'sec-05', 'Sintaxis'],
                ['VI', 'sec-06', 'Semántica'],
                ['VII', 'sec-07', 'Pragmática'],
                ['VIII', 'sec-08', 'Tipología lingüística'],
                ['IX', 'sec-09', 'Jerarquía de Chomsky'],
                ['X', 'sec-10', 'Familias lingüísticas'],
                ['XI', 'sec-11', 'Adquisición del lenguaje'],
                ['XII', 'sec-12', 'Lingüística computacional y PLN'],
                ['XIII', 'sec-13', 'Sociolingüística'],
                ['XIV', 'sec-14', 'Fronteras abiertas'],
                ['XV', 'sec-15', 'Notas adicionales'],
              ].map(([roman, id, label]) => (
                <a key={id} href={`#${id}`} style={{ fontSize: 10.5, color: '#9fb8d6', textDecoration: 'none', display: 'flex', gap: 10 }}>
                  <span style={{ color: `${TEAL}88`, width: 26, flexShrink: 0 }}>{roman}</span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </nav>
        </div>

        {/* ===================== NIVELES DE ANÁLISIS ===================== */}

        {/* I. FONÉTICA */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-01">
          <LevelHeader roman="I" title="FONÉTICA" />
          <P>
            Estudia los sonidos del habla como fenómeno físico, en tres ramas: la <Mono>fonética
            articulatoria</Mono> (cómo se producen — punto de articulación: dónde se obstruye el flujo
            de aire; modo de articulación: cómo se obstruye; sonoridad: si vibran las cuerdas vocales),
            la <Mono>fonética acústica</Mono> (las propiedades físicas de la onda sonora resultante —
            frecuencia, amplitud, duración) y la <Mono>fonética auditiva</Mono> (cómo el oído y el
            sistema nervioso perciben esa onda).
          </P>
          <P>
            Para notar los sonidos sin ambigüedad —el español escrito no alcanza: la misma letra "c"
            suena distinto en "casa" y en "cielo"— se usa el <Mono>Alfabeto Fonético Internacional
            (AFI / IPA)</Mono>, un símbolo por sonido, válido para cualquier lengua del mundo.
          </P>
          <Panel style={{ marginTop: 20, padding: '20px 20px 26px' }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: `${TEAL}99`, marginBottom: 14 }}>
              INVENTARIO CONSONÁNTICO DEL ESPAÑOL GENERAL
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <thead>
                  <tr>
                    {['FONEMA', 'MODO', 'PUNTO', 'SONORIDAD', 'EJEMPLO'].map(h => (
                      <th key={h} style={{ textAlign: 'left', fontSize: 9, letterSpacing: 1.5, color: TEAL, borderBottom: `1px solid ${TEAL}55`, padding: '8px 12px', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SPANISH_CONSONANTS.map((row, i) => (
                    <tr key={row.symbol} style={{ background: i % 2 === 0 ? 'rgba(46,230,184,0.03)' : 'transparent' }}>
                      <td style={{ padding: '8px 12px', fontSize: 13, color: '#eafff6', whiteSpace: 'nowrap' }}>{row.symbol}</td>
                      <td style={{ padding: '8px 12px', fontSize: 9.5, color: '#9fb8d6', whiteSpace: 'nowrap' }}>{row.manner}</td>
                      <td style={{ padding: '8px 12px', fontSize: 9.5, color: '#9fb8d6', whiteSpace: 'nowrap' }}>{row.place}</td>
                      <td style={{ padding: '8px 12px', fontSize: 9.5, color: '#9fb8d6', whiteSpace: 'nowrap' }}>{row.voicing}</td>
                      <td style={{ padding: '8px 12px', fontSize: 9.5, color: `${TEAL}cc` }}>
                        {row.example}
                        {row.note && <span style={{ color: '#7a94ac', marginLeft: 8 }}>— {row.note}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </Section>

        {/* II. LÍNEA DE TIEMPO DE LA LINGÜÍSTICA */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-02">
          <LevelHeader roman="II" title="LÍNEA DE TIEMPO DE LA LINGÜÍSTICA" />
          <Panel>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {LINGUISTICS_TIMELINE.map((entry, i) => (
                <TimelineRow key={entry.year + entry.title} entry={entry} isLast={i === LINGUISTICS_TIMELINE.length - 1} />
              ))}
            </div>
          </Panel>
        </Section>

        {/* III. FONOLOGÍA */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-03">
          <LevelHeader roman="III" title="FONOLOGÍA" />
          <P>
            Si la fonética mide el sonido físico, la fonología estudia cómo esos sonidos funcionan como
            <Mono> sistema</Mono> dentro de una lengua particular. La unidad clave es el <Mono>fonema</Mono>
            — una unidad mental, abstracta, que distingue significados dentro de esa lengua. En español,
            /p/ y /b/ son fonemas distintos porque cambiar uno por otro cambia la palabra: "pata" ≠ "bata".
          </P>
          <P>
            Un mismo fonema, en cambio, puede sonar ligeramente distinto según el contexto sin que eso
            cambie el significado — esas variantes físicas se llaman <Mono>alófonos</Mono>. El fonema
            /d/ del español, por ejemplo, se pronuncia oclusivo en "dedo" (al inicio) y de forma más
            suave, aproximante, entre vocales — un hablante nativo ni lo nota; son el mismo fonema para
            el sistema mental de la lengua, aunque la fonética acústica registre dos sonidos distintos.
          </P>
        </Section>

        {/* III. MORFOLOGÍA */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-04">
          <LevelHeader roman="IV" title="MORFOLOGÍA" />
          <P>
            Estudia la estructura interna de las palabras. Su unidad mínima es el <Mono>morfema</Mono>:
            el fragmento más chico que todavía lleva significado o función gramatical propia — ya no se
            puede partir sin perderlo.
          </P>
          <P>
            Un morfema puede ser <Mono>libre</Mono>, si funciona como palabra por sí solo ("sol",
            "pan"), o <Mono>ligado</Mono>, si necesita pegarse a otro morfema para aparecer ("-s" del
            plural en "soles"; "des-" en "deshacer"). Dentro de una palabra con varios morfemas, la
            <Mono> raíz</Mono> (o lexema) lleva el significado central, y los <Mono>afijos</Mono>
            —prefijos antes, sufijos después— modifican o completan ese significado.
          </P>
          <P>
            Esos afijos cumplen dos funciones muy distintas. La <Mono>morfología flexiva</Mono> ajusta
            género, número, tiempo o persona sin crear una palabra nueva ni cambiar su categoría
            gramatical ("nación" → "naciones": sigue siendo el mismo sustantivo, solo en plural). La
            <Mono> morfología derivativa</Mono>, en cambio, crea palabras nuevas, a veces de otra
            categoría: "nación" (sustantivo) → "nacional" (adjetivo) → "nacionalidad" (sustantivo de
            nuevo, pero otro concepto).
          </P>
        </Section>

        {/* IV. SINTAXIS */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-05">
          <LevelHeader roman="V" title="SINTAXIS" />
          <P>
            Estudia cómo las palabras se combinan en frases y oraciones. La combinación no es una
            cadena lineal de palabras sueltas — tiene <Mono>estructura jerárquica</Mono>: las palabras
            se agrupan en sintagmas, y los sintagmas se agrupan entre sí. En "El gato duerme", la
            oración (S) se ramifica en un sintagma nominal (SN: "el gato") y un sintagma verbal (SV:
            "duerme"); dentro del SN, un determinante (Det: "el") y un nombre (N: "gato").
          </P>
          <Panel style={{ marginTop: 18, marginBottom: 18 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: `${TEAL}99`, marginBottom: 10, textAlign: 'center' }}>
              ÁRBOL SINTÁCTICO — "EL GATO DUERME"
            </div>
            <SyntaxTree />
          </Panel>
          <P>
            Esta idea de estructura jerárquica generada por reglas es el núcleo de la <Mono>gramática
            generativa</Mono> propuesta por Noam Chomsky a mediados del siglo XX. De ahí surge también
            la hipótesis de la <Mono>Gramática Universal</Mono>: la propuesta de que existe una
            capacidad lingüística innata, compartida por toda la especie, que explica por qué cualquier
            niño adquiere la gramática de su lengua materna con una exposición limitada y sin
            instrucción formal.
          </P>
        </Section>

        {/* V. SEMÁNTICA */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-06">
          <LevelHeader roman="VI" title="SEMÁNTICA" />
          <P>
            Estudia el significado. Se divide en <Mono>semántica léxica</Mono> — el significado de
            palabras individuales, y cómo se relacionan entre sí (sinonimia, antonimia, hiperonimia)— y
            <Mono> semántica composicional</Mono> — cómo el significado de una oración entera se
            construye a partir del significado de sus partes y de la estructura sintáctica que las une,
            no por simple suma.
          </P>
          <P>
            Una distinción clásica dentro de la semántica es la de <Mono>sentido y referencia</Mono>:
            dos expresiones pueden referirse exactamente al mismo objeto en el mundo (misma referencia)
            y aun así transmitir algo distinto (distinto sentido). "La estrella de la mañana" y "la
            estrella de la tarde" refieren al mismo cuerpo celeste —el planeta Venus— pero no significan
            lo mismo: alguien puede saber una cosa sin saber la otra.
          </P>
        </Section>

        {/* VI. PRAGMÁTICA */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-07">
          <LevelHeader roman="VII" title="PRAGMÁTICA" />
          <P>
            Estudia el significado en contexto — lo que un enunciado comunica más allá de su contenido
            literal. Austin y luego Searle describieron los <Mono>actos de habla</Mono>: al decir algo,
            un hablante no solo describe el mundo, también hace algo con ese decir. "Te prometo que
            vuelvo" no describe una promesa — la realiza en el mismo acto de pronunciarla (un acto de
            habla performativo).
          </P>
          <P>
            Paul Grice propuso que buena parte de la conversación cotidiana funciona porque se asume que
            ambas partes siguen ciertas <Mono>máximas conversacionales</Mono>: de <Mono>cantidad</Mono>
            (decir lo necesario, ni más ni menos), <Mono>cualidad</Mono> (decir lo que se cree
            verdadero), <Mono>relación</Mono> (ser relevante) y <Mono>manera</Mono> (ser claro y
            ordenado). Cuando un hablante parece romper una máxima a propósito, el oyente infiere un
            significado adicional no dicho literalmente — una <Mono>implicatura</Mono>. Si alguien
            pregunta "¿viniste caminando?" y la respuesta es "llovía", no responde literalmente, pero
            comunica igual —por implicatura— que no vino caminando.
          </P>
        </Section>

        {/* ===================== TIPOLOGÍA LINGÜÍSTICA ===================== */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-08">
          <div style={{ fontSize: 9, letterSpacing: 6, color: `${TEAL}55`, marginBottom: 10 }}>
            CLASIFICACIÓN // CÓMO VARÍAN LAS LENGUAS ENTRE SÍ
          </div>
          <h2
            style={{
              fontSize: 19, letterSpacing: 4, color: TEAL, textShadow: `0 0 22px ${TEAL}44`,
              fontWeight: 700, margin: '0 0 18px',
            }}
          >
            TIPOLOGÍA LINGÜÍSTICA
          </h2>
          <P>
            Pese a su enorme diversidad, las ≈7000 lenguas del mundo se agrupan en un número
            relativamente chico de patrones recurrentes. Dos ejes clásicos de clasificación:
          </P>
          <Panel style={{ marginTop: 16, marginBottom: 18, padding: '20px 20px 26px' }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: `${TEAL}99`, marginBottom: 14 }}>
              {WORD_ORDER_TYPOLOGY.label.toUpperCase()}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              {WORD_ORDER_TYPOLOGY.rows.map(row => (
                <div key={row.order} style={{ borderLeft: `2px solid ${TEAL}55`, paddingLeft: 12 }}>
                  <div style={{ fontSize: 14, color: '#eafff6', marginBottom: 4, letterSpacing: 1 }}>{row.order}</div>
                  <div style={{ fontSize: 9, color: `${TEAL}99`, marginBottom: 4 }}>{row.pct}</div>
                  <div style={{ fontSize: 9.5, color: '#9fb8d6', lineHeight: 1.6 }}>{row.examples}</div>
                </div>
              ))}
            </div>
          </Panel>
          <P>
            El segundo eje clasifica según cuánta información gramatical cargan las palabras
            individuales:
          </P>
          <Panel style={{ marginBottom: 18, padding: '20px 20px 26px' }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: `${TEAL}99`, marginBottom: 14 }}>
              TIPOLOGÍA MORFOLÓGICA
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {MORPHOLOGICAL_TYPOLOGY.map(row => (
                <div key={row.label}>
                  <div style={{ fontSize: 11.5, letterSpacing: 1, color: TEAL, marginBottom: 4 }}>{row.label.toUpperCase()}</div>
                  <div style={{ fontSize: 10, lineHeight: 1.7, color: '#9fb8d6' }}>{row.detail}</div>
                  <div style={{ fontSize: 9, color: `${TEAL}99`, marginTop: 4 }}>{row.examples}</div>
                </div>
              ))}
            </div>
          </Panel>
          <P>
            El español es, con matices, predominantemente fusional con orden SVO — pero ninguna lengua
            real cae de forma pura y exclusiva en una sola categoría de ningún eje: son puntos
            predominantes en un espacio continuo, no casillas cerradas.
          </P>
        </Section>

        {/* ===================== JERARQUÍA DE CHOMSKY ===================== */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-09">
          <div style={{ fontSize: 9, letterSpacing: 6, color: `${TEAL}55`, marginBottom: 10 }}>
            PUENTE // LINGÜÍSTICA FORMAL Y TEORÍA DE LA COMPUTACIÓN
          </div>
          <h2
            style={{
              fontSize: 19, letterSpacing: 4, color: TEAL, textShadow: `0 0 22px ${TEAL}44`,
              fontWeight: 700, margin: '0 0 18px',
            }}
          >
            JERARQUÍA DE CHOMSKY
          </h2>
          <P>
            Chomsky clasificó las gramáticas formales en cuatro niveles anidados, cada uno un caso
            particular (más restringido) del anterior. De más general a más restringido: <Mono>Tipo 0
            </Mono> (recursivamente enumerables — el nivel más permisivo, reconocible solo por una
            máquina de Turing completa), <Mono>Tipo 1</Mono> (sensibles al contexto), <Mono>Tipo 2
            </Mono> (libres de contexto — la mayoría de las gramáticas de lenguajes de programación son
            de este tipo) y <Mono>Tipo 3</Mono> (regulares — el nivel más restringido, reconocible por
            un autómata finito simple, sin memoria).
          </P>
          <Panel style={{ marginTop: 16, marginBottom: 18 }}>
            <ChomskyHierarchy />
          </Panel>
          <P>
            Las lenguas humanas no caben cómodas en el nivel más chico: parecen necesitar, como mínimo,
            el poder expresivo de una gramática libre de contexto (Tipo 2). Hay incluso fenómenos
            documentados —las llamadas <Mono>dependencias cruzadas</Mono> del neerlandés y del
            suizo-alemán, donde dos series de elementos relacionados se entrelazan en lugar de anidarse
            limpiamente— que sugieren que el lenguaje natural podría requerir, en algunos casos, algo
            todavía más expresivo que una gramática libre de contexto estricta.
          </P>
        </Section>

        {/* ===================== FAMILIAS LINGÜÍSTICAS ===================== */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-10">
          <div style={{ fontSize: 9, letterSpacing: 6, color: `${TEAL}55`, marginBottom: 10 }}>
            CLASIFICACIÓN // PARENTESCO HISTÓRICO ENTRE LENGUAS
          </div>
          <h2
            style={{
              fontSize: 19, letterSpacing: 4, color: TEAL, textShadow: `0 0 22px ${TEAL}44`,
              fontWeight: 700, margin: '0 0 18px',
            }}
          >
            FAMILIAS LINGÜÍSTICAS
          </h2>
          <P>
            Las lenguas se agrupan en familias cuando descienden, por cambio gradual a través de
            generaciones de hablantes, de una misma lengua ancestral común. La familia indoeuropea es
            una de las mejor documentadas: a partir de un <Mono>protoindoeuropeo</Mono> reconstruido
            (nunca escrito, inferido comparando sus descendientes) se ramifican, entre otras, las ramas
            germánica, románica, eslava e indoirania.
          </P>
          <Panel style={{ marginTop: 16, marginBottom: 18 }}>
            <LanguageFamilyTree />
          </Panel>
          <P>
            Esto cubre solo una familia. En el mundo existen muchas otras, completamente independientes
            —no derivadas del indoeuropeo—, como la <Mono>sino-tibetana</Mono> (mandarín, tibetano), la
            <Mono> afroasiática</Mono> (árabe, hebreo, amárico), la <Mono>austronesia</Mono> (malayo,
            tagalo, maorí) y la <Mono>niger-congoleña</Mono> (swahili, yoruba, zulú).
          </P>
        </Section>

        {/* ===================== ADQUISICIÓN DEL LENGUAJE ===================== */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-11">
          <div style={{ fontSize: 9, letterSpacing: 6, color: `${TEAL}55`, marginBottom: 10 }}>
            DESARROLLO // CÓMO SE ADQUIERE UNA LENGUA MATERNA
          </div>
          <h2
            style={{
              fontSize: 19, letterSpacing: 4, color: TEAL, textShadow: `0 0 22px ${TEAL}44`,
              fontWeight: 700, margin: '0 0 18px',
            }}
          >
            ADQUISICIÓN DEL LENGUAJE
          </h2>
          <P>
            Todo niño sano adquiere la gramática completa de su lengua materna sin instrucción formal,
            siguiendo una secuencia de etapas notablemente consistente entre lenguas muy distintas:
          </P>
          <Panel style={{ marginTop: 16, marginBottom: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {ACQUISITION_STAGES.map(s => (
                <div key={s.stage} style={{ display: 'flex', gap: 18, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 10, color: `${TEAL}99`, width: 90, flexShrink: 0 }}>{s.age}</div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 11.5, color: '#eafff6', letterSpacing: 0.5, marginBottom: 4 }}>{s.stage}</div>
                    <div style={{ fontSize: 10, lineHeight: 1.7, color: '#9fb8d6' }}>{s.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <P>
            La <Mono>hipótesis del período crítico</Mono> (Eric Lenneberg, 1967) propone que esta
            adquisición espontánea y sin esfuerzo depende de una ventana biológica — aproximadamente
            hasta la pubertad — pasada la cual aprender una lengua (materna o segunda) requiere un
            esfuerzo consciente cualitativamente distinto, y rara vez alcanza el mismo dominio nativo,
            en especial en fonología. La adquisición bilingüe simultánea (dos lenguas desde el
            nacimiento) sigue esencialmente el mismo cronograma que la monolingüe, sin retraso neto.
          </P>
        </Section>

        {/* ===================== LINGÜÍSTICA COMPUTACIONAL Y PLN ===================== */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-12">
          <div style={{ fontSize: 9, letterSpacing: 6, color: `${TEAL}55`, marginBottom: 10 }}>
            PUENTE // DE LA GRAMÁTICA FORMAL AL MODELO ESTADÍSTICO
          </div>
          <h2
            style={{
              fontSize: 19, letterSpacing: 4, color: TEAL, textShadow: `0 0 22px ${TEAL}44`,
              fontWeight: 700, margin: '0 0 18px',
            }}
          >
            LINGÜÍSTICA COMPUTACIONAL Y PLN
          </h2>
          <P>
            El procesamiento del lenguaje natural (PLN) es, en buena medida, lingüística hecha
            ejecutable — a veces aplicando directamente sus modelos formales, a veces reemplazándolos
            por completo con estadística aprendida de datos:
          </P>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {NLP_TOPICS.map(t => (
              <Panel key={t.title}>
                <div style={{ fontSize: 11.5, letterSpacing: 1.5, color: TEAL, marginBottom: 10, textShadow: `0 0 10px ${TEAL}44` }}>{t.title}</div>
                <div style={{ fontSize: 10.5, lineHeight: 1.8, color: '#9fb8d6' }}>{t.detail}</div>
              </Panel>
            ))}
          </div>
        </Section>

        {/* ===================== SOCIOLINGÜÍSTICA ===================== */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-13">
          <div style={{ fontSize: 9, letterSpacing: 6, color: `${TEAL}55`, marginBottom: 10 }}>
            NOTA // VARIACIÓN
          </div>
          <h2
            style={{
              fontSize: 19, letterSpacing: 4, color: TEAL, textShadow: `0 0 22px ${TEAL}44`,
              fontWeight: 700, margin: '0 0 18px',
            }}
          >
            SOCIOLINGÜÍSTICA
          </h2>
          <P>
            Ninguna lengua es un bloque uniforme: varía según quién habla, de dónde y en qué situación.
            El <Mono>dialecto</Mono> es la variedad geográfica (el español de Buenos Aires frente al de
            Bogotá); el <Mono>registro</Mono> es la variedad según el contexto social o el grado de
            formalidad (cómo le hablás a un amigo frente a cómo redactás un trámite); el
            <Mono> idiolecto</Mono> es la variedad propia de cada hablante individual — nadie usa la
            lengua exactamente igual que otro.
          </P>
          <P>
            Desde el punto de vista estrictamente estructural, ninguna variedad lingüística es superior
            a otra: todos los dialectos y registros tienen sistemas fonológicos, morfológicos y
            sintácticos igualmente complejos y funcionales. Las jerarquías que se les asignan en la
            práctica social —qué acento se considera "más correcto", qué variedad se enseña en la
            escuela— son convenciones sociales, no hechos de la estructura de la lengua.
          </P>
        </Section>

        {/* ===================== FRONTERAS ABIERTAS ===================== */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-14">
          <div style={{ fontSize: 9, letterSpacing: 6, color: `${TEAL}55`, marginBottom: 10 }}>
            TERRENO ABIERTO // SIN CONSENSO, A DIFERENCIA DE TODO LO ANTERIOR
          </div>
          <h2
            style={{
              fontSize: 19, letterSpacing: 4, color: TEAL, textShadow: `0 0 22px ${TEAL}44`,
              fontWeight: 700, margin: '0 0 18px',
            }}
          >
            FRONTERAS ABIERTAS
          </h2>
          <P>
            Todo lo anterior es descripción relativamente consensuada de cómo funcionan las lenguas.
            Esta sección es distinta a propósito: debates activos de la disciplina, sin resolución
            aceptada — incluidos explícitamente como tales, no como hechos establecidos.
          </P>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {OPEN_DEBATES.map(d => (
              <Panel key={d.title}>
                <div style={{ fontSize: 11.5, letterSpacing: 1.5, color: TEAL, marginBottom: 10, textShadow: `0 0 10px ${TEAL}44` }}>{d.title}</div>
                <div style={{ fontSize: 10.5, lineHeight: 1.8, color: '#9fb8d6' }}>{d.detail}</div>
              </Panel>
            ))}
          </div>
        </Section>

        {/* ===================== NOTAS ADICIONALES ===================== */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} id="sec-15" last>
          <div style={{ fontSize: 9, letterSpacing: 6, color: `${TEAL}55`, marginBottom: 10 }}>
            NOTA // ALCANCE DEL DOCUMENTO
          </div>
          <h2
            style={{
              fontSize: 19, letterSpacing: 4, color: TEAL, textShadow: `0 0 22px ${TEAL}44`,
              fontWeight: 700, margin: '0 0 18px',
            }}
          >
            NOTAS ADICIONALES
          </h2>
          <P>
            <Mono>Convención ortográfica.</Mono> Los ejemplos de este documento usan el español
            general como referencia, pero casi toda descripción fonética específica (la distinción
            /θ/-/s/, el yeísmo, la aspiración de /x/) varía por dialecto — ningún dialecto del español
            es la forma "neutra" desde la que los demás se desvían.
          </P>
          <P>
            <Mono>Lo que este documento no resuelve.</Mono> Por diseño: el debate innatismo/emergentismo
            (Sección XIV), si el lenguaje animal no humano alcanza sintaxis recursiva, el origen mismo
            del lenguaje en la especie, y si un modelo de lenguaje entrenado estadísticamente puede
            decirse que "entiende" algo (Sección XII). Son, hoy, las preguntas abiertas centrales de la
            lingüística como disciplina.
          </P>
        </Section>

        {/* Footer */}
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px 140px', textAlign: 'center' }}>
          <div style={{ fontSize: 9, letterSpacing: 4, color: `${TEAL}33` }}>
            NPX-LNG-00 // FIN DEL DOCUMENTO — ARCHIVO SIN ENLACE, SOLO ACCESIBLE POR RUTA DIRECTA
          </div>
        </div>
      </div>

      <style>{`
        .lng-section {
          opacity: 0;
          transform: translateY(26px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .lng-section.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        @media (prefers-reduced-motion: reduce) {
          .lng-section { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}

function Section({
  idx, registerRef, visible, children, last, id,
}: {
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
      className={`lng-section ${visible[idx] ? 'is-visible' : ''}`}
      style={{
        maxWidth: 780, margin: '0 auto', padding: idx === 0 ? '0 24px 120px' : `100px 24px ${last ? 60 : 120}px`,
        borderTop: idx === 0 ? undefined : `1px solid ${TEAL}14`,
        scrollMarginTop: 40,
      }}
    >
      {children}
    </div>
  )
}
