'use client'

// NPX-ARC-09 — SEMIÓTICA
// Pedido explícito, parte de una tanda de documentos sobre autoorganización,
// cibernética, semiótica y hermenéutica. Mismo estándar que el resto de
// /archivo: separa lo bien establecido (Saussure, Peirce, Barthes,
// Baudrillard -- décadas de uso académico consolidado) de lo más
// especulativo/de nicho (biosemiótica, programa de investigación
// interdisciplinario sin el mismo consenso).
// Acento propio: amarillo vivo #ffd60a, distinto de los 19 ya usados en
// el resto del Codex (ni el dorado viejo de Dinero #b8860b, ni el ámbar
// de Arcanum #c9a24d, ni el amarillo-verde de Alimentación #b4e61d).

import { useEffect, useState } from 'react'
import Link from 'next/link'

const mono = "'Space Mono', monospace"
const ACCENT = '#ffd60a'
const TEXT = '#f5f0dc'
const TEXT_DIM = '#c9c2a0'
const LABEL_DIM = '#8a8350'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(10, 9, 2, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(255,214,10,0.03)`,
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
    <div style={{
      fontSize: 9.5, lineHeight: 1.8, letterSpacing: 0.5, color: LABEL_DIM, marginTop: 14,
      borderLeft: `2px solid ${ACCENT}33`, paddingLeft: 12,
    }}>
      {children}
    </div>
  )
}

const TOC: [string, string, string][] = [
  ['I', 'sec-01', 'Qué es un signo — Saussure'],
  ['II', 'sec-02', 'La tríada de Peirce'],
  ['III', 'sec-03', 'Connotación y mito — Barthes'],
  ['IV', 'sec-04', 'El simulacro — Baudrillard'],
  ['V', 'sec-05', 'Biosemiótica — el signo más allá de lo humano'],
  ['VI', 'sec-06', 'Resonancia con NeoProxy'],
]

export default function SemioticaPage() {
  const [visible, setVisible] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.sem-section'))
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const id = (entry.target as HTMLElement).id
        setVisible((prev) => (prev[id] ? prev : { ...prev, [id]: true }))
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' })
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ background: '#070602', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        <Link href="/knowledge" className="press" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${ACCENT}aa`, textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← VOLVER AL CODEX
        </Link>

        {/* encabezado */}
        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${ACCENT}66`, marginBottom: 16 }}>
            NPX-ARC-09 // REFERENCIA TÉCNICA
          </div>
          <h1
            style={{
              fontSize: 'clamp(28px, 6vw, 42px)',
              fontWeight: 700,
              letterSpacing: 6,
              color: ACCENT,
              textShadow: `0 0 40px ${ACCENT}55`,
              marginBottom: 14,
              lineHeight: 1.1,
            }}
          >
            SEMIÓTICA
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            EL SIGNO, EL SENTIDO Y EL LÍMITE ENTRE LO QUE REPRESENTA Y LO QUE ES
          </div>
          <p
            style={{
              fontSize: 11.5, lineHeight: 2.1, letterSpacing: 0.3, color: TEXT_DIM, maxWidth: 660,
              borderLeft: `1px solid ${ACCENT}33`, paddingLeft: 24, marginBottom: 32,
            }}
          >
            Cómo un signo —una palabra, una imagen, un gesto— produce sentido, y qué pasa cuando el signo
            deja de remitir a algo real y empieza a remitirse solo a sí mismo. Con el mismo cuidado que el
            resto del Codex: lo consolidado académicamente desde hace más de un siglo (Saussure, Peirce)
            tratado distinto de un programa de investigación todavía abierto (biosemiótica).
          </p>

          <div
            style={{
              display: 'inline-grid', gridTemplateColumns: 'auto auto', gap: '4px 24px', fontSize: 9,
              letterSpacing: 1, color: `${ACCENT}99`, border: `1px solid ${ACCENT}33`, padding: '12px 18px',
              marginBottom: 32,
            }}
          >
            <span style={{ color: `${ACCENT}55` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>SEMIÓTICA, TEORÍA DEL SIGNO — REFERENCIA TÉCNICA</span>
            <span style={{ color: `${ACCENT}55` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — 6 SECCIONES</span>
            <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>EL SIGNO → LA TRÍADA → MITO → SIMULACRO → BIOSEMIÓTICA → RESONANCIA</span>
          </div>

          <nav style={{ border: `1px solid ${ACCENT}22`, padding: '20px 24px', maxWidth: 680 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}66`, marginBottom: 14 }}>
              ÍNDICE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '6px 20px' }}>
              {TOC.map(([roman, id, label]) => (
                <a key={id} href={`#${id}`} style={{ fontSize: 10.5, color: TEXT_DIM, textDecoration: 'none', display: 'flex', gap: 10 }}>
                  <span style={{ color: `${ACCENT}88`, width: 28, flexShrink: 0 }}>{roman}</span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </nav>
        </div>

        {/* I. SAUSSURE */}
        <div id="sec-01" className={`sem-section ${visible['sec-01'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="I" title="QUÉ ES UN SIGNO" sub="Ferdinand de Saussure, Curso de lingüística general (1916, póstumo)" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Saussure murió en 1913 sin publicar su teoría general del signo — el <em>Curso de
              lingüística general</em> que la expone salió en 1916, armado por sus alumnos Charles Bally y
              Albert Sechehaye a partir de apuntes de clase. Ahí define el{' '}
              <strong style={{ color: '#fff' }}>signo</strong> como la unión de un{' '}
              <strong style={{ color: '#fff' }}>significante</strong> (la forma: un sonido, una grafía) y
              un <strong style={{ color: '#fff' }}>significado</strong> (el concepto que evoca) — y aclara
              algo que sigue siendo el punto de partida de toda la disciplina: esa unión es{' '}
              <strong style={{ color: '#fff' }}>arbitraria</strong>. No hay ningún parecido natural entre
              el sonido "árbol" y un árbol real; si lo hubiera, no habría idiomas distintos para la misma
              cosa.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Lo segundo, menos intuitivo: un signo no tiene valor por sí solo, lo tiene por su{' '}
              <strong style={{ color: '#fff' }}>diferencia</strong> con los demás signos del sistema. "Gato"
              significa lo que significa en parte porque no es "pato", ni "plato" — el sentido es
              relacional, no una esencia que el signo cargue de por sí.
            </p>
          </Panel>
        </div>

        {/* II. PEIRCE */}
        <div id="sec-02" className={`sem-section ${visible['sec-02'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="LA TRÍADA DE PEIRCE" sub="Charles Sanders Peirce, 1839-1914 — tradición paralela a Saussure, no una corrección" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Mientras Saussure armaba su modelo en Europa, el filósofo y lógico estadounidense Charles
              Sanders Peirce desarrollaba el suyo por su cuenta, desde una tradición distinta (el
              pragmatismo, no la lingüística estructural) y con tres categorías en vez de dos:{' '}
              <strong style={{ color: '#fff' }}>icono</strong> (se parece físicamente a lo que representa,
              como un dibujo o una foto), <strong style={{ color: '#fff' }}>índice</strong> (conectado por
              causa o contigüidad real, como el humo respecto del fuego, o una huella respecto del pie que
              la dejó), y <strong style={{ color: '#fff' }}>símbolo</strong> (conexión puramente
              convencional, aprendida — la inmensa mayoría de las palabras de cualquier idioma).
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              No es que uno de los dos modelos esté "más evolucionado" que el otro — son dos formas
              distintas y compatibles de cortar el mismo problema, y ambas siguen citándose hoy según la
              pregunta: Saussure cuando interesa el sistema de diferencias (lingüística), Peirce cuando
              interesa el tipo de conexión entre signo y objeto (semiótica visual, lógica, biosemiótica —
              sección V).
            </p>
          </Panel>
        </div>

        {/* III. BARTHES */}
        <div id="sec-03" className={`sem-section ${visible['sec-03'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title="CONNOTACIÓN Y MITO" sub="Roland Barthes, Mitologías (1957)" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Barthes agrega una capa: todo signo tiene un significado literal (<strong style={{ color: '#fff' }}>
              denotación</strong>) y, encima, una capa de sentido cultural añadido que se vuelve tan
              habitual que deja de notarse como construida (<strong style={{ color: '#fff' }}>connotación</strong>).
              Cuando esa connotación se naturaliza al punto de parecer un hecho obvio del mundo en vez de
              una convención cultural, Barthes la llama, en sentido técnico, <strong style={{ color: '#fff' }}>
              "mito"</strong>.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Su ejemplo real más citado: la tapa de una revista francesa con un soldado negro saludando a
              la bandera francesa. Denota, literalmente, a un hombre saludando. Connota —sin decirlo, sin
              necesitar texto— que el imperio francés trata bien a todos sus súbditos sin distinción de
              raza. Barthes no dice que esa segunda lectura sea falsa a propósito: dice que funciona
              precisamente porque nadie la ve como una construcción, sino como algo que la imagen
              simplemente "es".
            </p>
          </Panel>
        </div>

        {/* IV. BAUDRILLARD */}
        <div id="sec-04" className={`sem-section ${visible['sec-04'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="EL SIMULACRO" sub="Jean Baudrillard, Simulacros y simulación (1981)" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <Link href="/knowledge?entry=baudrillard" style={{ color: '#fff', textDecoration: 'underline' }}>
                Jean Baudrillard
              </Link>
              , ya una entrada real de este Codex, lleva la idea de connotación de Barthes a su extremo:
              propone cuatro órdenes del simulacro. En el primero, el signo refleja fielmente una realidad
              que existe aparte de él. En el segundo y el tercero, empieza a distorsionarla y después a
              enmascarar que no hay nada detrás. En el cuarto —la <strong style={{ color: '#fff' }}>
              hiperrealidad</strong>— el signo ya no remite a ningún original: es autosuficiente, y buscar
              "lo real" detrás de él es buscar algo que ya no existe como referencia separada.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Es la misma lógica de Saussure (sección I) —el signo vale por su relación con otros signos,
              no por una conexión directa con la cosa— llevada hasta el punto en que la cosa deja de ser
              necesaria del todo.
            </p>
          </Panel>
        </div>

        {/* V. BIOSEMIOTICA */}
        <div id="sec-05" className={`sem-section ${visible['sec-05'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="V" title="BIOSEMIÓTICA" sub="el signo más allá de lo humano — campo de nicho, no consenso cerrado" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Thomas Sebeok acuñó en 1963 el término <strong style={{ color: '#fff' }}>zoosemiótica</strong>{' '}
              para estudiar la comunicación animal (cantos, feromonas, posturas) con las herramientas de
              Peirce — señales que funcionan como índice o icono sin que haga falta lenguaje humano detrás.
              Jesper Hoffmeyer, desde los años 90, amplió la idea a <strong style={{ color: '#fff' }}>
              biosemiótica</strong>: la señalización celular, la regulación genética, incluso el sistema
              inmune, leídos como sistemas que procesan e interpretan señales, no solo reacciones
              químicas mecánicas.
            </p>
            <Caption>
              A diferencia de las secciones I a IV —con más de un siglo de uso académico consolidado
              detrás— la biosemiótica es un programa de investigación interdisciplinario activo, sin el
              mismo consenso cerrado: cuánto de la metáfora "interpretación" aplica de verdad a una célula,
              o si es una forma útil de hablar más que una descripción literal, sigue debatido. Se incluye
              acá como lo que es, territorio abierto, no como hecho establecido.
            </Caption>
          </Panel>
        </div>

        {/* VI. RESONANCIA */}
        <div id="sec-06" className={`sem-section ${visible['sec-06'] ? 'is-visible' : ''}`} style={{ marginBottom: 0 }}>
          <SectionHeader roman="VI" title="RESONANCIA CON NEOPROXY" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <Link href="/archivo/lenguaje" style={{ color: '#fff', textDecoration: 'underline' }}>
                Lenguaje
              </Link>
              , ya en este Codex, trata la estructura del habla —sintaxis, la jerarquía de Chomsky—. Este
              documento extiende esa misma línea hacia el sentido: no cómo se arma una oración
              gramaticalmente válida, sino cómo cualquier signo, gramatical o no, produce significado.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              El glifo hexagrama que lleva DarkProxy en el canon (<em>public/canon/darkproxy-v1.png</em>)
              es, en los términos exactos de la sección II, un <strong style={{ color: '#fff' }}>
              símbolo</strong> puro de Peirce: no se parece a lo que representa, no hay conexión causal
              entre el glifo y la identidad de root — es puro acuerdo, sostenido solo porque el sitio entero
              decidió que significa eso. No hace falta que un signo imite o derive de algo real para que
              funcione de verdad como signo.
            </p>
          </Panel>
        </div>

        {/* footer */}
        <div style={{ marginTop: 100, paddingTop: 28, borderTop: `1px solid ${ACCENT}22` }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}44` }}>
            NPX-ARC-09 // REFERENCIA TÉCNICA DEL CODEX
          </div>
        </div>
      </div>

      <style>{`
        .sem-section { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .sem-section.is-visible { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .sem-section { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
