'use client'

// NPX-ARC-10 — HERMENÉUTICA
// Pedido explícito: documentar la teoría de la interpretación como parte
// de la tanda de nuevos documentos (junto a semiótica, autoorganización
// y cibernética) que el usuario propuso y que ampliamos entrelazando con
// lo que ya existe en el Codex. Mismo estándar de rigor que el resto de
// /archivo: separa lo que es un método con pasos reproducibles (CBT,
// semiótica estructural) de lo que es una descripción filosófica de cómo
// funciona la comprensión misma -- sin método verificable paso a paso,
// pero sin que eso la vuelva menos real, es otra categoría de
// conocimiento (ver sección VI).
// Acento propio: teal-slate apagado #4a7c82, distinto de todos los ya
// usados en el Codex (incluidos los otros tres de esta misma tanda:
// #ffd60a semiótica, #e63946 autoorganización, #3a4ba0 cibernética).

import { useEffect, useState } from 'react'
import Link from 'next/link'

const mono = "'Space Mono', monospace"
const ACCENT = '#4a7c82'
const TEXT = '#e4ecec'
const TEXT_DIM = '#a8c0c0'
const LABEL_DIM = '#5a7878'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(4, 10, 10, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(74,124,130,0.04)`,
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
  ['I', 'sec-01', 'Orígenes — de la exégesis a la disciplina general'],
  ['II', 'sec-02', 'Dilthey y las ciencias del espíritu'],
  ['III', 'sec-03', 'Heidegger — comprender como modo de ser'],
  ['IV', 'sec-04', 'Gadamer — el círculo hermenéutico'],
  ['V', 'sec-05', 'Los maestros de la sospecha'],
  ['VI', 'sec-06', 'Aplicación moderna y nota honesta'],
  ['VII', 'sec-07', 'Resonancia con NeoProxy'],
]

export default function HermeneuticaPage() {
  const [visible, setVisible] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.her-section'))
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
    <div style={{ background: '#040707', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        <Link href="/knowledge" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${ACCENT}aa`, textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← VOLVER AL CODEX
        </Link>

        {/* encabezado */}
        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${ACCENT}66`, marginBottom: 16 }}>
            NPX-ARC-10 // REFERENCIA TÉCNICA
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
            HERMENÉUTICA
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            LA TEORÍA DE LA INTERPRETACIÓN — CÓMO SE ENTIENDE LO QUE SE ENTIENDE
          </div>
          <p
            style={{
              fontSize: 11.5, lineHeight: 2.1, letterSpacing: 0.3, color: TEXT_DIM, maxWidth: 660,
              borderLeft: `1px solid ${ACCENT}33`, paddingLeft: 24, marginBottom: 32,
            }}
          >
            De la exégesis bíblica a la filosofía de la comprensión — con el mismo cuidado que el resto
            del Codex: separar lo que es un método con pasos reproducibles de lo que es una descripción
            filosófica de cómo funciona entender algo, sin que eso la vuelva un conocimiento más débil,
            solo distinto.
          </p>

          <div
            style={{
              display: 'inline-grid', gridTemplateColumns: 'auto auto', gap: '4px 24px', fontSize: 9,
              letterSpacing: 1, color: `${ACCENT}99`, border: `1px solid ${ACCENT}33`, padding: '12px 18px',
              marginBottom: 32,
            }}
          >
            <span style={{ color: `${ACCENT}55` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>FILOSOFÍA, TEORÍA DE LA INTERPRETACIÓN — REFERENCIA TÉCNICA</span>
            <span style={{ color: `${ACCENT}55` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — 7 SECCIONES</span>
            <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>ORÍGENES → DILTHEY → HEIDEGGER → GADAMER → SOSPECHA → APLICACIÓN</span>
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

        {/* I. ORIGENES */}
        <div id="sec-01" className={`her-section ${visible['sec-01'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="I" title="ORÍGENES — DE LA EXÉGESIS A LA DISCIPLINA GENERAL" sub="Friedrich Schleiermacher, inicios del siglo XIX" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              La hermenéutica nace como oficio concreto, no como teoría abstracta: la exégesis bíblica y la
              filología clásica necesitaban reglas para interpretar textos antiguos, oscuros o traducidos,
              donde el sentido original no era evidente. Durante siglos fue un conjunto de técnicas
              dispersas, específicas de cada disciplina —una cosa para interpretar la Biblia, otra para
              interpretar leyes romanas, otra para textos clásicos.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Friedrich Schleiermacher, teólogo y filósofo alemán de inicios del siglo XIX, dio el paso que
              convierte esas técnicas sueltas en una disciplina: propuso una{' '}
              <strong style={{ color: '#fff' }}>hermenéutica general</strong>, un conjunto de principios
              sobre cómo se interpreta cualquier texto, no solo el sagrado. La pregunta deja de ser "¿cómo
              leo esta Biblia?" y pasa a ser "¿qué hace, en general, que entender un texto sea posible?".
            </p>
          </Panel>
        </div>

        {/* II. DILTHEY */}
        <div id="sec-02" className={`her-section ${visible['sec-02'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="DILTHEY Y LAS CIENCIAS DEL ESPÍRITU" sub="Wilhelm Dilthey, fines del siglo XIX" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Wilhelm Dilthey trazó una distinción que todavía organiza buena parte de las humanidades: las{' '}
              <strong style={{ color: '#fff' }}>Naturwissenschaften</strong> (ciencias naturales) buscan{' '}
              <em>explicar</em> fenómenos por leyes causales generales —por qué cae una piedra, siempre
              igual, en cualquier contexto. Las <strong style={{ color: '#fff' }}>Geisteswissenschaften</strong>{' '}
              (ciencias del espíritu o humanas) buscan <em>comprender</em> (Verstehen) un sentido vivido
              —por qué alguien escribió esta carta, en este momento, con esta intención— que no se repite
              igual en ningún otro caso.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Esto no es Dilthey diciendo que las ciencias humanas son más débiles que las naturales —es
              un argumento de que usan un método distinto porque su objeto es distinto: una ley física no
              tiene intención, un texto o una acción humana sí.
            </p>
          </Panel>
        </div>

        {/* III. HEIDEGGER */}
        <div id="sec-03" className={`her-section ${visible['sec-03'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title="HEIDEGGER — COMPRENDER COMO MODO DE SER" sub="Ser y tiempo, 1927" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <Link href="/knowledge?entry=heidegger" style={{ color: '#fff', textDecoration: 'underline' }}>
                Martin Heidegger
              </Link>{' '}
              —ya una entrada real de este Codex— da el giro que separa la hermenéutica filosófica de la
              hermenéutica como técnica de lectura. En <em>Ser y tiempo</em> (1927), comprender no es una
              operación intelectual que se le agrega después a un objeto neutro que primero se percibe sin
              sentido: es la estructura misma de estar-en-el-mundo (Dasein). Antes de analizar nada ya
              entendemos las cosas desde un "para qué" —un martillo se entiende, de entrada, como lo que
              sirve para clavar, no como una forma geométrica que después se interpreta como herramienta.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La consecuencia es fuerte: no hay un punto cero, sin interpretación previa, desde el cual
              empezar a entender algo desde cero. Siempre llegamos ya entendiendo algo, de algún modo,
              antes de poder preguntarnos qué es.
            </p>
          </Panel>
        </div>

        {/* IV. GADAMER */}
        <div id="sec-04" className={`her-section ${visible['sec-04'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="GADAMER — EL CÍRCULO HERMENÉUTICO" sub="Verdad y método (Wahrheit und Methode), 1960" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Hans-Georg Gadamer, alumno de Heidegger, formalizó el{' '}
              <strong style={{ color: '#fff' }}>círculo hermenéutico</strong>: entender el todo de un texto
              requiere ya entender sus partes, y entender las partes requiere ya tener una idea previa del
              todo. Leído como defecto lógico sería un círculo vicioso —pero Gadamer sostiene que es,
              literalmente, cómo funciona de hecho la comprensión: uno arranca con una expectativa del
              sentido general, la revisa a medida que lee cada parte, y esa revisión cambia a su vez cómo
              se entiende el todo. No es un error a corregir, es el proceso mismo.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Su segunda idea central, la <strong style={{ color: '#fff' }}>fusión de horizontes</strong>:
              interpretar un texto antiguo siempre mezcla el horizonte histórico en que ese texto fue
              escrito con el horizonte propio de quien lo lee hoy. No existe una lectura neutral, suspendida
              fuera de la historia —toda interpretación parte de dónde y cuándo está el que interpreta,
              y eso no es un sesgo a eliminar, es la condición misma de poder entender algo del pasado.
            </p>
          </Panel>
        </div>

        {/* V. SOSPECHA */}
        <div id="sec-05" className={`her-section ${visible['sec-05'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="V" title="LOS MAESTROS DE LA SOSPECHA" sub="Paul Ricoeur, Freud y la filosofía, 1970" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Paul Ricoeur llamó "maestros de la sospecha" a tres pensadores que leen un texto —o un
              síntoma, o una ideología— no para recuperar amablemente su sentido manifiesto, sino para
              desenmascarar lo que ese texto oculta de sí mismo sin saberlo: Marx (la ideología esconde
              intereses de clase), {' '}
              <Link href="/knowledge?entry=nietzsche" style={{ color: '#fff', textDecoration: 'underline' }}>
                Nietzsche
              </Link>{' '}
              —ya otra entrada real de este Codex— (la moral esconde voluntad de poder) y Freud (el
              discurso consciente esconde deseo reprimido).
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Esto agrega una capa que Gadamer no tenía en el mismo lugar: interpretar no es solo revelar
              con buena fe lo que un texto dice de verdad, también puede ser cuestionar lo que dice sobre
              sí mismo —leer contra el grano, no solo con él.
            </p>
          </Panel>
        </div>

        {/* VI. APLICACION Y NOTA HONESTA */}
        <div id="sec-06" className={`her-section ${visible['sec-06'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VI" title="APLICACIÓN MODERNA Y NOTA HONESTA" sub="dónde este marco sigue trabajando hoy, y qué tipo de conocimiento es" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              La hermenéutica jurídica —cómo se interpreta un texto constitucional o una ley ambigua— y la
              crítica literaria académica son campos reales que siguen usando, con otro vocabulario, el
              círculo hermenéutico y la fusión de horizontes de Gadamer: ningún juez ni ningún crítico lee
              un texto desde cero, sin tradición interpretativa previa.
            </p>
            <Caption>
              A diferencia de la terapia cognitivo-conductual o de la semiótica estructural —que ofrecen
              pasos o reglas que se pueden aplicar y verificar una por una— la hermenéutica filosófica no
              es un método con procedimiento reproducible. Es una descripción de cómo funciona la
              comprensión misma, no una receta para comprender mejor paso a paso. Eso no la hace más floja
              ni menos real: es otra categoría de conocimiento, tan legítima como un método empírico pero
              validada de otro modo —por su coherencia y su poder de iluminar casos concretos, no por un
              ensayo controlado.
            </Caption>
          </Panel>
        </div>

        {/* VII. RESONANCIA */}
        <div id="sec-07" className={`her-section ${visible['sec-07'] ? 'is-visible' : ''}`} style={{ marginBottom: 0 }}>
          <SectionHeader roman="VII" title="RESONANCIA CON NEOPROXY" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              <Link href="/archivo/metacognicion" style={{ color: '#fff', textDecoration: 'underline' }}>
                Metacognición
              </Link>
              , ya en este Codex, describe en su sección III notar un pensamiento propio y preguntarse qué
              es, en vez de estar fundido con él. Visto desde acá, eso es, en sentido estricto, un acto
              hermenéutico: el círculo de Gadamer de la sección IV —entender la parte desde una idea previa
              del todo, y corregir esa idea del todo con cada parte nueva— corriendo no sobre un texto
              externo sino sobre la propia mente, en tiempo real, mientras pasa.
            </p>
          </Panel>
        </div>

        {/* footer */}
        <div style={{ marginTop: 100, paddingTop: 28, borderTop: `1px solid ${ACCENT}22` }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}44` }}>
            NPX-ARC-10 // REFERENCIA TÉCNICA DEL CODEX
          </div>
        </div>
      </div>

      <style>{`
        .her-section { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .her-section.is-visible { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .her-section { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
