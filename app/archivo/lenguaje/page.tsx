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

type IpaEntry = { symbol: string; name: string; example: string }
const IPA_TABLE: IpaEntry[] = [
  { symbol: '[p]', name: 'oclusiva bilabial sorda', example: '"pato"' },
  { symbol: '[b]', name: 'oclusiva bilabial sonora', example: '"bato"' },
  { symbol: '[m]', name: 'nasal bilabial', example: '"mano"' },
  { symbol: '[s]', name: 'fricativa alveolar sorda', example: '"sol"' },
  { symbol: '[a]', name: 'vocal abierta central', example: '"casa"' },
  { symbol: '[i]', name: 'vocal cerrada anterior', example: '"vino"' },
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

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

const TOTAL_SECTIONS = 9 // 6 niveles + jerarquía de Chomsky + familias + sociolingüística

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
              maxWidth: 640, marginBottom: 90, borderLeft: `1px solid ${TEAL}33`, paddingLeft: 24,
            }}
          >
            La lingüística estudia el lenguaje humano como objeto formal: no cómo "debería" hablarse,
            sino cómo funciona realmente un sistema que cualquier humano sano adquiere sin instrucción
            explícita. Se organiza en niveles de análisis anidados — de la onda sonora física hasta el
            significado en contexto — cada uno con su propia unidad mínima y su propia maquinaria.
            Ese recorrido, nivel por nivel, es el cuerpo de este documento.
          </p>
        </div>

        {/* ===================== NIVELES DE ANÁLISIS ===================== */}

        {/* I. FONÉTICA */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible}>
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
          <Panel style={{ marginTop: 20 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: `${TEAL}99`, marginBottom: 14 }}>
              MUESTRA DE NOTACIÓN AFI
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
              {IPA_TABLE.map(entry => (
                <div key={entry.symbol} style={{ borderLeft: `2px solid ${TEAL}55`, paddingLeft: 12 }}>
                  <div style={{ fontSize: 16, color: '#eafff6', marginBottom: 4 }}>{entry.symbol}</div>
                  <div style={{ fontSize: 9.5, color: '#9fb8d6', lineHeight: 1.6 }}>{entry.name}</div>
                  <div style={{ fontSize: 9, color: `${TEAL}99`, marginTop: 2 }}>{entry.example}</div>
                </div>
              ))}
            </div>
          </Panel>
        </Section>

        {/* II. FONOLOGÍA */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible}>
          <LevelHeader roman="II" title="FONOLOGÍA" />
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
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible}>
          <LevelHeader roman="III" title="MORFOLOGÍA" />
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
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible}>
          <LevelHeader roman="IV" title="SINTAXIS" />
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
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible}>
          <LevelHeader roman="V" title="SEMÁNTICA" />
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
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible}>
          <LevelHeader roman="VI" title="PRAGMÁTICA" />
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

        {/* ===================== JERARQUÍA DE CHOMSKY ===================== */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible}>
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
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible}>
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

        {/* ===================== SOCIOLINGÜÍSTICA ===================== */}
        <Section idx={nextIdx()} registerRef={registerRef} visible={visible} last>
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
  idx, registerRef, visible, children, last,
}: {
  idx: number
  registerRef: (idx: number) => (el: HTMLDivElement | null) => void
  visible: boolean[]
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div
      ref={registerRef(idx)}
      data-idx={idx}
      className={`lng-section ${visible[idx] ? 'is-visible' : ''}`}
      style={{
        maxWidth: 780, margin: '0 auto', padding: idx === 0 ? '0 24px 120px' : `100px 24px ${last ? 60 : 120}px`,
        borderTop: idx === 0 ? undefined : `1px solid ${TEAL}14`,
      }}
    >
      {children}
    </div>
  )
}
