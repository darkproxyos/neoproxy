'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const mono = "'Space Mono', monospace"

// SÍNTESIS — el ensayo que faltaba: no un documento más del Codex, sino
// uno que lee los otros doce (filosofía + 6 referencias técnicas +
// 5 páginas antes ocultas) y busca qué dicen entre sí que ninguno dice
// solo. Mismo mecanismo que /knowledge/filosofia (capítulos en orden,
// scroll-reveal, un argumento continuo) pero un nivel más arriba: ahí los
// nodos eran personas (entries.ts), acá son documentos enteros. Cada dato
// citado abajo viene de los documentos reales -- fechas, cifras y nombres
// verificados contra el archivo antes de escribir esto, no completados de
// memoria. Acento cian (#00d4ff): el mismo color que Filosofía reserva
// para su propio capítulo de síntesis -- ya es, en este sitio, "el color
// que ata lo demás".

type Anchor = {
  label: string
  code: string
  href: string
  pull: string
  color: string
}

type Chapter = {
  roman: string
  title: string
  sub?: string
  anchors: Anchor[]
  prose: string[]
}

const CHAPTERS: Chapter[] = [
  {
    roman: 'I',
    title: 'EL BORDE QUE GUARDA TODO',
    sub: 'dónde termina Partículas y dónde empieza Holografía',
    anchors: [
      { label: 'PARTÍCULAS', code: 'NPX-ARC-01', href: '/archivo/particulas', pull: 'lo que no explica en absoluto', color: '#5fd4ff' },
      { label: 'PRINCIPIO HOLOGRÁFICO', code: 'NPX-ARC-05', href: '/archivo/holografia', pull: 'S ≤ A / 4', color: '#6c5ce7' },
    ],
    prose: [
      'Partículas es el documento más exhaustivo del Codex y también el más humilde: enumera las tres generaciones de quarks y leptones, la masa real del quark top (≈173 GeV/c²), el 58.2% de probabilidad de que un Higgs decaiga en un par de quarks bottom — y después, en su Sección XIII, se detiene en seco. Materia oscura, energía oscura, gravedad cuántica: todo eso queda marcado, sin vueltas, como "sin confirmación experimental directa hasta la fecha".',
      'Holografía empieza exactamente ahí. No resuelve la grieta de Partículas — la mira desde otro ángulo. En 1974 Bekenstein calculó que un agujero negro tiene entropía proporcional al área de su horizonte, no al volumen que encierra: S ≤ A / 4. Si la cantidad máxima de información de una región depende de su superficie y no de su interior, entonces tal vez la gravedad cuántica — lo que Partículas no puede explicar — no sea un problema de más partículas, sino de que el volumen nunca fue la unidad correcta para empezar.',
      'El propio documento se cuida de vender esto como respuesta: la correspondencia AdS/CFT de Maldacena (1997) está matemáticamente probada, pero en un universo de juguete que no es el nuestro. La versión que sí describiría este universo — dS/CFT — es, en sus propias palabras, mucho menos desarrollada. Es la honestidad que atraviesa después todo el resto del Codex: una cosa es la ecuación que funciona, otra es afirmar que el mundo real obedece esa ecuación.',
    ],
  },
  {
    roman: 'II',
    title: 'LA RED QUE SE CONFUNDE CON LA MENTE',
    sub: 'dos recortes de la misma apuesta, el mismo lugar donde los dos se frenan',
    anchors: [
      { label: 'MENTE', code: 'NPX-ARC-02', href: '/archivo/mente', pull: 'el problema difícil', color: '#ff4fa3' },
      { label: 'CIENCIA COGNITIVA', code: 'NPX-ARC-06', href: '/archivo/cognitiva', pull: 'pseudociencia (2023)', color: '#22e06b' },
    ],
    prose: [
      'Mente sube de la neurona individual al cerebro completo sin pedir disculpas: anatomía, neurotransmisores, los cuatro lóbulos, lo que cada técnica de neuroimagen puede ver y lo que pierde. Todo eso es, en sus propios términos, consenso clínico — hasta la Sección XII, donde el documento se detiene a nombrar cuatro teorías de la consciencia (el problema difícil de Chalmers, 1995; los correlatos neuronales de Crick y Koch; la Información Integrada de Tononi; el Espacio de Trabajo Global de Baars y Dehaene) sin elegir ninguna, porque no hay consenso que elegir.',
      'Ciencia Cognitiva no es el mismo documento con otro nombre — es, dice el propio Codex, "distinto del recorte neurocientífico de Mente": arranca en 1956, en Dartmouth, el mismo año que "el número mágico siete" de Miller, y llega hasta la cognición 4E (embodied, embedded, enacted, extended) de Varela y Clark. Pero termina parado en el mismo borde que Mente, desde el otro lado: en 2023, 124 investigadores firmaron una carta abierta calificando la Teoría de la Información Integrada de Tononi — la misma que Mente nombra sin tomar partido — de "pseudociencia", por no ser falsable.',
      'Dos documentos, dos disciplinas, el mismo punto exacto donde ambos se quedan sin poder avanzar más. No es redundancia: es la misma pared, fotografiada desde dos habitaciones distintas.',
    ],
  },
  {
    roman: 'III',
    title: 'LO QUE ENTRA POR LA BOCA Y POR EL OÍDO',
    sub: 'comida y lenguaje, leídos los dos como señal antes que como sustancia',
    anchors: [
      { label: 'ALIMENTACIÓN', code: 'NPX-ARC-04', href: '/archivo/alimentacion', pull: '90% de la serotonina', color: '#b4e61d' },
      { label: 'LENGUAJE', code: 'NPX-ARC-03', href: '/archivo/lenguaje', pull: '¿entiende algo?', color: '#2ee6b8' },
    ],
    prose: [
      'Alimentación podría haber sido un documento de calorías. No lo es: su hilo real es que cada molécula que cruza el intestino termina siendo una instrucción — energía, precursor de neurotransmisor, señal para una bacteria. El dato que más rápido desarma cualquier certeza heredada: la cifra de "diez bacterias por cada célula humana", repetida durante décadas, fue recalculada en 2016 (Sender, Fuchs, Milo) a una proporción mucho más cercana a 1 a 1. Y el 90% de la serotonina del cuerpo no se produce en el cerebro, sino en el intestino.',
      'Lenguaje, en apariencia, no tiene nada que ver con esto — y sin embargo hace el mismo movimiento con el sonido que Alimentación hace con la comida: lo trata como código antes que como materia. La jerarquía de Chomsky, los fonemas, la sintaxis recursiva, un linaje que arranca con Pāṇini hacia el 350 a.C., quince siglos antes de que nadie llamara a esto "lingüística formal".',
      'Y las dos páginas terminan preguntando, cada una por su lado, exactamente lo mismo que pregunta Ciencia Cognitiva: Lenguaje cierra sus Fronteras Abiertas con la duda de si un modelo entrenado solo con estadística "entiende" algo; Ciencia Cognitiva cierra con la misma duda, en otras palabras. Ningún documento cita al otro. Los tres llegan solos al mismo lugar.',
    ],
  },
  {
    roman: 'IV',
    title: 'LA FICCIÓN QUE YA LO HABÍA VIVIDO',
    sub: 'Ghost in the Shell, Lain, Ergo Proxy — tres fechas que no son casualidad',
    anchors: [
      { label: 'GHOST IN THE SHELL', code: 'NPX-REF-02', href: '/archivo/gits', pull: 'ghost in the machine', color: '#d946ef' },
      { label: 'SERIAL EXPERIMENTS LAIN', code: 'NPX-REF-01', href: '/archivo/lain', pull: 'Dios está en el Wired', color: '#4f6bff' },
      { label: 'ERGO PROXY', code: 'NPX-REF-00', href: '/archivo/ergoproxy', pull: 'cogito, ergo Proxy', color: '#c9703a' },
    ],
    prose: [
      'Ghost in the Shell se estrenó en 1995. Ese mismo año, David Chalmers publicó el paper que le puso nombre al problema difícil de la consciencia — el mismo que Mente y Ciencia Cognitiva, treinta años después, siguen sin poder cerrar. La película no citaba el paper; el paper no sabía de la película. Las dos llegaron, el mismo año, al mismo borde: ¿qué queda de alguien cuando se le puede describir hasta el último bit y todavía falta algo?',
      'Ergo Proxy se estrenó en 2006. Ese mismo año, Ryu y Takayanagi publicaron la fórmula que calcula la entropía de entrelazamiento como el área de una superficie mínima — la pieza que terminó de convertir la holografía de especulación elegante en herramienta de cálculo real. Ergo Proxy no sabe nada de eso: solo cuenta la historia de una criatura que descubre que ella creó a quienes creía que la habían creado a ella, un "cogito, ergo Proxy" leído como eco directo de Descartes. Pero la pregunta de fondo — ¿qué pasa cuando el origen de algo no está afuera de eso, sino adentro? — es, otra vez, la misma.',
      'Lain, en el medio (1998), no necesita una coincidencia de fecha para hacer su parte: literalmente dramatiza lo que Bateson y Wiener describen en abstracto en el capítulo II de Filosofía — que el yo no es una sustancia encerrada en un cuerpo, sino un patrón que puede existir copiado, editado, presente en más de un lugar. Lain no ancla ese patrón a una ecuación. Lo vive como una pérdida: borrarse de la Wired, al final, no es una victoria.',
      'Ninguna de las tres series citó a los físicos ni a los filósofos de los capítulos anteriores. No hacía falta. El borde era el mismo borde, y la ficción llegó ahí por su cuenta, con el único instrumento que tenía: una historia en vez de una ecuación.',
    ],
  },
  {
    roman: 'V',
    title: 'DONDE LA EVIDENCIA SE TERMINA',
    sub: 'Grinberg y Garnier Malet hacen el mismo movimiento del capítulo I — sin la ecuación que lo sostenga',
    anchors: [
      { label: 'JACOBO GRINBERG', code: 'NPX-REF-03', href: '/archivo/grinberg', pull: 'potenciales transferidos', color: '#39d953' },
      { label: 'GARNIER MALET', code: 'NPX-REF-04', href: '/archivo/garniermalet', pull: '"aperturas" entre tiempos', color: '#b31ba3' },
    ],
    prose: [
      'La teoría sintérgica de Jacobo Grinberg propone que la realidad emerge de un campo neuronal interactuando con una retícula hipercompleja debajo del espacio-tiempo — información cruzando un límite para volverse experiencia. Grinberg publicó un experimento real (siete parejas, jaulas de Faraday, una correlación de EEG de aproximadamente uno en cuatro) en una revista con revisión por pares, Physics Essays, en 1994. Ese mismo año, el 8 de diciembre, desapareció sin explicación. Nadie volvió a replicar el experimento de forma independiente.',
      'Jean-Pierre Garnier Malet propone, desde 1988, que el tiempo se desdobla y que cada persona vive, en paralelo, un segundo consciente y miles de millones de segundos en otro tiempo imperceptible — con intercambio de información entre ambos a través de "aperturas", más intensas durante el sueño REM. Ninguna fuente independiente consultada para ese documento pudo confirmar su afiliación institucional ni el aval de la American Institute of Physics que su material de divulgación sugiere.',
      'La forma de las dos afirmaciones es idéntica a la del capítulo I: información codificada o cruzando un límite, en vez de residiendo en el volumen de algo. Es el mismo gesto que Bekenstein hizo en 1972 y que Maldacena formalizó en 1997 — pero sin la cota matemática exacta del primero, sin la correspondencia demostrada del segundo. Es lo que esa misma idea se ve obligada a parecer antes de que alguien consiga medirla, o mientras nadie consiga medirla nunca.',
      'Ninguno de los dos documentos lo esconde. Los dos terminan con una sección que separa, en una lista explícita, qué parte de la afirmación es verificable (que la persona existió, que publicó, que tiene audiencia real) de qué parte no lo es (el campo, la retícula, el doble, la apertura). El Codex no está para fallar a favor o en contra. Está para dejar esa línea marcada donde de verdad está.',
    ],
  },
  {
    roman: 'VI',
    title: 'SÍNTESIS',
    anchors: [],
    prose: [
      'Doce documentos. Uno solo pregunta lo mismo, doce veces, en doce idiomas distintos: ¿la realidad está hecha de materia, o de información guardada en un límite? Partículas la hace en masas y branching ratios. Holografía la hace en el área de un horizonte. Mente y Ciencia Cognitiva la hacen en neuronas y en teorías rivales de la consciencia. Alimentación la hace en serotonina intestinal. Lenguaje la hace en fonemas. Ghost in the Shell, Lain y Ergo Proxy la hacen en una pantalla, sin una sola ecuación, y llegan lo mismo. Grinberg y Garnier Malet la hacen también — del lado donde todavía nadie puede confirmar nada.',
      'Hay una asimetría real entre los dos grupos, y vale la pena nombrarla en vez de disolverla: los cinco documentos de ficción y teoría disputada (Ergo Proxy, Lain, Ghost in the Shell, Grinberg, Garnier Malet) terminan, cada uno, mirando hacia adentro — hacia una función real ya shipeada de este mismo sitio (Prototype, el eco de sesión de AgentChannel, el Campo de Sincronía). Los seis documentos de archivo técnico no hacen eso nunca: se quedan mirando hacia afuera, hacia la física, la neurociencia, la lingüística, sin volver sobre NeoProxy. Filosofía es el único que está parado en el medio — tiene la forma de un documento duro, en capítulos y citas textuales, pero termina citando, no a un filósofo más, sino las líneas reales del propio manifiesto de este sitio.',
      'Esa es, quizás, la única cosa nueva que no estaba ya escrita en ninguno de los doce por separado: que el Codex entero tiene la misma estructura que describe. Un centro denso de referencias verificadas (los seis documentos técnicos), una frontera donde la misma pregunta se dramatiza sin resolverse (la ficción), y un borde exterior donde se intenta responder sin tener todavía con qué (las dos teorías disputadas) — exactamente la forma que Holografía le atribuye a un agujero negro: toda la información real, codificada en el borde, no en el centro.',
    ],
  },
]

export default function SintesisPage() {
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const [visible, setVisible] = useState<boolean[]>(() => Array(CHAPTERS.length).fill(false))

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const idx = Number((entry.target as HTMLElement).dataset.idx)
        setVisible((prev) => {
          if (prev[idx]) return prev
          const next = [...prev]
          next[idx] = true
          return next
        })
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.2, rootMargin: '0px 0px -80px 0px' })

    sectionRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const registerRef = (idx: number) => (el: HTMLDivElement | null) => {
    sectionRefs.current[idx] = el
  }

  return (
    <div style={{ background: '#000205', minHeight: '100vh', fontFamily: mono, color: '#c8daf0', position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '104px 24px 0' }}>
          <Link href="/knowledge" className="press" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none' }}>
            ← VOLVER AL CODEX
          </Link>

          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: '#00d4ff44', marginTop: 56, marginBottom: 16 }}>
            NPX-KNW-SIN // DOCE DOCUMENTOS, UNA SOLA PREGUNTA
          </div>
          <h1 style={{
            fontSize: 'clamp(30px, 6vw, 44px)', fontWeight: 700, letterSpacing: 10, color: '#00d4ff',
            textShadow: '0 0 40px rgba(0,212,255,0.35)', marginBottom: 32, lineHeight: 1,
          }}>
            SÍNTESIS
          </h1>

          <p style={{
            fontFamily: mono, fontSize: 11, lineHeight: 2.1, letterSpacing: 0.5, color: '#8fb8d6',
            maxWidth: 640, marginBottom: 100, borderLeft: '1px solid #00d4ff22', paddingLeft: 24,
          }}>
            No es un resumen de los otros doce documentos del Codex. Es una lectura de los doce juntos,
            buscando qué dicen entre sí que ninguno dice solo — similitudes reales, diferencias reales,
            y al menos una conexión que no estaba escrita en ningún archivo por separado hasta este.
            Cada dato citado abajo es verificable contra el documento de origen; cada link va al lugar
            exacto donde se puede confirmar.
          </p>
        </div>

        {CHAPTERS.map((chapter, idx) => (
          <div
            key={chapter.roman}
            ref={registerRef(idx)}
            data-idx={idx}
            className={`sin-section ${visible[idx] ? 'is-visible' : ''}`}
            style={{
              maxWidth: 780, margin: '0 auto', padding: '0 24px 160px',
              borderTop: idx === 0 ? undefined : '1px solid #00d4ff14',
              paddingTop: idx === 0 ? 0 : 100,
            }}
          >
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
                <span style={{ fontSize: 13, color: '#00d4ff66', letterSpacing: 2 }}>{chapter.roman}</span>
                <h2 style={{ fontSize: 22, letterSpacing: 6, color: '#00d4ff', textShadow: '0 0 24px rgba(0,212,255,0.3)', margin: 0 }}>
                  {chapter.title}
                </h2>
              </div>
              {chapter.sub && (
                <div style={{ fontSize: 10, letterSpacing: 0.5, color: '#4a6080', marginTop: 10, paddingLeft: 32, maxWidth: 560 }}>
                  {chapter.sub}
                </div>
              )}
            </div>

            {chapter.anchors.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}>
                {chapter.anchors.map((a) => (
                  <div key={a.code} style={{
                    border: `1px solid ${a.color}44`, padding: '10px 16px', minWidth: 180,
                  }}>
                    <div style={{ fontSize: 8, letterSpacing: 1.5, color: `${a.color}99`, marginBottom: 6 }}>
                      {a.code} // {a.label}
                    </div>
                    <div style={{ fontSize: 13, color: '#fff', letterSpacing: 0.3 }}>
                      {a.pull}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {chapter.prose.map((p, i) => (
              <p key={i} style={{ fontSize: 12, lineHeight: 2.1, color: '#9fb8d6', letterSpacing: 0.3, marginBottom: 18, maxWidth: 620 }}>
                {p}
              </p>
            ))}

            {chapter.anchors.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 24 }}>
                {chapter.anchors.map((a) => (
                  <Link key={a.code} href={a.href} style={{
                    fontSize: 9, letterSpacing: 1.5, color: `${a.color}aa`, textDecoration: 'none',
                  }}>
                    → LEER {a.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px 140px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, borderTop: '1px solid #00d4ff14', paddingTop: 40 }}>
            <Link href="/knowledge/filosofia" className="press" style={{ fontSize: 9, letterSpacing: 2, color: '#b06bffaa', textDecoration: 'none' }}>
              → LA MISMA PREGUNTA EN PERSONAS: FILOSOFÍA
            </Link>
            <Link href="/lab/codex" className="press" style={{ fontSize: 9, letterSpacing: 2, color: '#00d4ffaa', textDecoration: 'none' }}>
              → LA MISMA PREGUNTA EN PUNTOS DE LUZ: EL ESPACIO 3D
            </Link>
            <Link href="/manifesto" className="press" style={{ fontSize: 9, letterSpacing: 2, color: '#ffb800aa', textDecoration: 'none' }}>
              → LEER EL MANIFIESTO COMPLETO
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .sin-section {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .sin-section.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        @media (prefers-reduced-motion: reduce) {
          .sin-section { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
