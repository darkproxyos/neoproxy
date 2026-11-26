'use client'

// NPX-ARC-08 — METACOGNICIÓN
// Pedido explícito: diálogo interno, voz mental, cómo pensar/hablarse
// mejor, cómo identificar las propias fallas de pensamiento. Mismo
// estándar que el resto de /archivo: separa lo que tiene respaldo
// empírico fuerte y replicado (Beck/Burns, Kross, Pennebaker) de lo que
// es un modelo clínico real pero con mucha menos evidencia controlada
// detrás (IFS de Schwartz) -- ninguno de los dos se presenta como si
// tuviera el mismo peso.
// Acento propio: naranja vivo #ff7a3d, distinto de los 15 ya usados en
// el resto del Codex (ni el marrón-naranja de Ergo Proxy #c9703a, ni el
// dorado viejo de Dinero #b8860b, ni el ámbar de Arcanum #c9a24d).

import { useEffect, useState } from 'react'
import Link from 'next/link'

const mono = "'Space Mono', monospace"
const ACCENT = '#ff7a3d'
const TEXT = '#f5e8dc'
const TEXT_DIM = '#c9b4a0'
const LABEL_DIM = '#8a6a50'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(12, 6, 2, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(255,122,61,0.03)`,
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
        <div style={{ fontSize: 11, letterSpacing: 1, color: LABEL_DIM, marginTop: 8, paddingLeft: 32 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, lineHeight: 1.8, letterSpacing: 0.5, color: LABEL_DIM, marginTop: 14,
      borderLeft: `2px solid ${ACCENT}33`, paddingLeft: 12,
    }}>
      {children}
    </div>
  )
}

const TOC: [string, string, string][] = [
  ['I', 'sec-01', 'El diálogo interno — qué dice la ciencia'],
  ['II', 'sec-02', 'De dónde viene esa voz — Vygotsky'],
  ['III', 'sec-03', 'Metacognición — pensar sobre el pensamiento'],
  ['IV', 'sec-04', 'El catálogo de errores — Beck, Burns y la CBT'],
  ['V', 'sec-05', 'Autodistancia — hablarte por tu nombre'],
  ['VI', 'sec-06', 'Escribir el pensamiento — Pennebaker'],
  ['VII', 'sec-07', 'Las voces no son una sola — IFS'],
  ['VIII', 'sec-08', 'Protocolo — cómo juntarlo todo'],
  ['IX', 'sec-09', 'Resonancia con NeoProxy'],
]

export default function MetacognicionPage() {
  const [visible, setVisible] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.mtc-section'))
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
    <div style={{ background: '#070301', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        <Link href="/knowledge" className="press tap-ext" style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 3, color: `${ACCENT}aa`, textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← VOLVER AL CODEX
        </Link>

        {/* encabezado */}
        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 6, color: `${ACCENT}66`, marginBottom: 16 }}>
            NPX-ARC-08 // REFERENCIA TÉCNICA
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
            METACOGNICIÓN
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            DIÁLOGO INTERNO, VOZ MENTAL Y CÓMO IDENTIFICAR TUS PROPIOS ERRORES DE PENSAMIENTO
          </div>
          <p
            style={{
              fontSize: 12.5, lineHeight: 2.1, letterSpacing: 0.3, color: TEXT_DIM, maxWidth: 660,
              borderLeft: `1px solid ${ACCENT}33`, paddingLeft: 24, marginBottom: 32,
            }}
          >
            Cómo pensás, cómo te hablás, y cómo notar tus propios errores de pensamiento antes de que te
            arrastren — con el mismo cuidado que el resto del Codex: lo que tiene décadas de estudios
            controlados detrás (la terapia cognitivo-conductual, la autodistancia de Kross) tratado
            distinto de lo que es un modelo clínico real pero con mucha menos evidencia acumulada (IFS).
          </p>

          <div
            style={{
              display: 'inline-grid', gridTemplateColumns: 'auto auto', gap: '4px 24px', fontSize: 10.5,
              letterSpacing: 1, color: `${ACCENT}99`, border: `1px solid ${ACCENT}33`, padding: '12px 18px',
              marginBottom: 32,
            }}
          >
            <span style={{ color: `${ACCENT}55` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>PSICOLOGÍA COGNITIVA, TERAPIA COGNITIVO-CONDUCTUAL — REFERENCIA TÉCNICA</span>
            <span style={{ color: `${ACCENT}55` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — 9 SECCIONES</span>
            <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>CIENCIA DEL HABLA INTERNA → ORIGEN → METACOGNICIÓN → TÉCNICAS → PROTOCOLO</span>
          </div>

          <nav style={{ border: `1px solid ${ACCENT}22`, padding: '20px 24px', maxWidth: 680 }}>
            <div style={{ fontSize: 10.5, letterSpacing: 3, color: `${ACCENT}66`, marginBottom: 14 }}>
              ÍNDICE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '6px 20px' }}>
              {TOC.map(([roman, id, label]) => (
                <a key={id} href={`#${id}`} style={{ fontSize: 11.5, color: TEXT_DIM, textDecoration: 'none', display: 'flex', gap: 10, padding: '7px 0' }}>
                  <span style={{ color: `${ACCENT}88`, width: 28, flexShrink: 0 }}>{roman}</span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </nav>
        </div>

        {/* I. EL DIALOGO INTERNO */}
        <div id="sec-01" className={`mtc-section ${visible['sec-01'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="I" title="EL DIÁLOGO INTERNO — QUÉ DICE LA CIENCIA" sub="no hay una sola forma 'normal' de pensar" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Russell T. Hurlburt (Universidad de Nevada, Las Vegas) desarrolló el{' '}
              <strong style={{ color: '#fff' }}>Descriptive Experience Sampling</strong> (DES): un beeper
              que suena en momentos al azar del día real de alguien, y esa persona anota, de inmediato, qué
              había exactamente en su experiencia justo en ese instante — no lo que cree que piensa en
              general, sino lo que de verdad estaba pasando ahí. Después de décadas de este método,
              encontró algo que sorprende a la mayoría: la cantidad de habla interna varía muchísimo entre
              personas. Hay quienes narran casi todo en palabras dentro de la cabeza, y hay quienes piensan
              mayormente en imágenes, sensaciones corporales o nada verbal reconocible — sin que eso sea un
              problema ni una falla, es variación real entre cerebros sanos.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Charles Fernyhough sintetiza esta línea de investigación en <em>The Voices Within</em>{' '}
              (2016): el habla interna, cuando existe, activa zonas del cerebro muy parecidas a las que se
              usan para hablar en voz alta (incluida el área de Broca) — pensar en palabras y hablar
              comparten buena parte del mismo circuito, aunque uno se quede callado.
            </p>
          </Panel>
        </div>

        {/* II. VYGOTSKY */}
        <div id="sec-02" className={`mtc-section ${visible['sec-02'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="DE DÓNDE VIENE ESA VOZ" sub="Lev Vygotsky, 1934" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Lev Vygotsky, en <em>Pensamiento y lenguaje</em> (publicado póstumo en 1934), documentó algo
              que cualquiera puede observar en un patio de jardín de infantes: los chicos chicos hablan en
              voz alta solos mientras juegan, narrando lo que hacen. Su hipótesis, hoy ampliamente aceptada
              en psicología del desarrollo, es que esa <strong style={{ color: '#fff' }}>habla
              privada</strong> no desaparece — se interioriza, se vuelve más fragmentada y silenciosa con
              la edad, y termina siendo el habla interna adulta.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La consecuencia práctica de esto es directa: si tu voz interna viene de haber interiorizado
              habla social real (de quien te corrigió, te calmó o te exigió de chico), el tono con el que
              te hablás hoy no es un rasgo fijo de personalidad — es algo aprendido por repetición, y por
              lo tanto algo que se puede reaprender con el mismo mecanismo, a propósito.
            </p>
          </Panel>
        </div>

        {/* III. METACOGNICION */}
        <div id="sec-03" className={`mtc-section ${visible['sec-03'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title="METACOGNICIÓN — PENSAR SOBRE EL PENSAMIENTO" sub="John Flavell, 1979" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              John H. Flavell acuñó el término <strong style={{ color: '#fff' }}>metacognición</strong> en
              un paper de 1979: el conocimiento y control que una persona tiene sobre sus propios procesos
              de pensamiento. No es "pensar más" ni "pensar mejor" en el sentido de tener más datos — es la
              capacidad de notar un pensamiento mientras pasa, y preguntarse qué es, en vez de estar
              completamente fundido con él y tratarlo como un hecho del mundo.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Steven C. Hayes, en la Terapia de Aceptación y Compromiso (ACT, con respaldo empírico real
              aunque más reciente que la CBT clásica), le da nombre a esta misma distancia:{' '}
              <strong style={{ color: '#fff' }}>defusión cognitiva</strong>, separar el pensamiento del
              que piensa. El ejercicio más citado es simple: imaginar cada pensamiento como una hoja que
              cae en un arroyo y se la ve pasar, sin subirse a ella ni discutirle.
            </p>
          </Panel>
        </div>

        {/* IV. CBT DISTORSIONES */}
        <div id="sec-04" className={`mtc-section ${visible['sec-04'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="EL CATÁLOGO DE ERRORES — BECK, BURNS Y LA CBT" sub="la terapia con el respaldo empírico más fuerte de este documento" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Aaron Beck fundó, desde los años 60 y 70, la terapia cognitiva: la idea de que no es la
              situación la que genera la emoción directamente, sino la interpretación automática que
              hacemos de ella — y que esa interpretación se puede identificar, cuestionar y cambiar. Es,
              según décadas de metaanálisis, una de las psicoterapias con más evidencia controlada detrás
              para ansiedad y depresión.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              David Burns popularizó ese trabajo en <em>Feeling Good</em> (1980), catalogando los{' '}
              <strong style={{ color: '#fff' }}>errores de pensamiento</strong> más comunes con nombre y
              apellido — lo que los hace útiles es exactamente eso, que tienen nombre, así que una vez que
              los conocés se vuelven más fáciles de cazar en tiempo real:
            </p>
            <ul style={{ fontSize: 12.5, lineHeight: 2.1, color: TEXT_DIM, margin: '0 0 16px', paddingLeft: 20 }}>
              <li><strong style={{ color: '#fff' }}>Todo o nada:</strong> "si no sale perfecto, fue un fracaso total".</li>
              <li><strong style={{ color: '#fff' }}>Catastrofizar:</strong> saltar al peor escenario posible sin evidencia real.</li>
              <li><strong style={{ color: '#fff' }}>Lectura de mente:</strong> asumir lo que otro piensa de vos sin que lo haya dicho.</li>
              <li><strong style={{ color: '#fff' }}>Razonamiento emocional:</strong> "me siento un fraude, entonces lo soy".</li>
              <li><strong style={{ color: '#fff' }}>Sobregeneralizar:</strong> un dato puntual se vuelve "siempre me pasa esto".</li>
              <li><strong style={{ color: '#fff' }}>Filtro mental:</strong> quedarte solo con el detalle negativo e ignorar el resto.</li>
            </ul>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La técnica clínica real que se deriva de esto es el <strong style={{ color: '#fff' }}>thought
              record</strong> (registro de pensamiento): escribir el pensamiento automático tal cual
              apareció, identificar cuál de estos patrones es, y recién después evaluar qué evidencia real
              lo sostiene. El orden importa — nombrar el patrón antes de discutirlo evita pelear con el
              pensamiento desde adentro de la misma distorsión.
            </p>
          </Panel>
        </div>

        {/* V. AUTODISTANCIA KROSS */}
        <div id="sec-05" className={`mtc-section ${visible['sec-05'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="V" title="AUTODISTANCIA — HABLARTE POR TU NOMBRE" sub="Ethan Kross, Universidad de Michigan" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Ethan Kross y colegas publicaron en 2014 (<em>Journal of Personality and Social
              Psychology</em>) un hallazgo replicado desde entonces: hablarte en segunda o tercera persona
              —usando tu propio nombre, "vos podés con esto" en vez de "yo no puedo con esto"— reduce la
              ansiedad y mejora el desempeño bajo presión, comparado con el autodiálogo en primera
              persona. No es un truco de distancia fría: te corre del lugar de estar atrapado adentro del
              problema al de estar mirando algo que te está pasando, sin perder que es tuyo.
            </p>
            <Caption>
              Kross junta esta línea de investigación en <em>Chatter: The Voice in Our Head, Why It
              Matters, and How to Harness It</em> (2021). Es psicología experimental con estudios
              controlados y replicación, no una afirmación motivacional sin respaldo.
            </Caption>
          </Panel>
        </div>

        {/* VI. PENNEBAKER */}
        <div id="sec-06" className={`mtc-section ${visible['sec-06'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VI" title="ESCRIBIR EL PENSAMIENTO" sub="James Pennebaker, Universidad de Texas en Austin" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Desde 1986, James Pennebaker viene estudiando la <strong style={{ color: '#fff' }}>escritura
              expresiva</strong>: escribir, sin editar ni mostrarle a nadie, sobre una experiencia
              emocionalmente significativa durante 15-20 minutos, unos pocos días seguidos. Comparado con
              escribir sobre temas neutros, se asocia con mejoras medibles en estado de ánimo y, en varios
              estudios, en marcadores de salud física — el efecto es real y replicado muchas veces, aunque
              moderado y variable según el estudio, no una cura garantizada.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Lo que parece importar no es desahogarse en el sentido de "sacarlo afuera" — es que poner un
              pensamiento difuso en palabras, afuera de la cabeza, lo vuelve un objeto que se puede mirar
              en vez de una sensación que te atraviesa. Es, en términos de la sección III, una forma simple
              de practicar metacognición sin necesitar ningún método clínico de por medio.
            </p>
          </Panel>
        </div>

        {/* VII. IFS */}
        <div id="sec-07" className={`mtc-section ${visible['sec-07'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VII" title="LAS VOCES NO SON UNA SOLA" sub="Richard Schwartz — Internal Family Systems" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Richard Schwartz desarrolló, desde los años 80, el Internal Family Systems (IFS): un modelo
              clínico que trata a la mente como compuesta naturalmente por varias <strong style={{ color: '#fff' }}>
              "partes"</strong> (un crítico interno, un protector, una parte herida que se evita) alrededor
              de un núcleo estable ("Self"). Se usa activamente en terapia, en particular de trauma, y
              encaja con algo que mucha gente nota: su diálogo interno no es siempre la misma voz con el
              mismo tono.
            </p>
            <Caption>
              A diferencia de la CBT (sección IV) y de la investigación de Kross (sección V) — con décadas
              de ensayos controlados y metaanálisis detrás — IFS tiene una base de evidencia mucho más
              chica: algunos ensayos controlados puntuales (por ejemplo en estrés postraumático y en
              artritis reumatoide asociada a angustia), no el volumen acumulado de la terapia cognitiva.
              Se usa clínicamente en serio, pero no tiene el mismo peso estadístico — se incluye acá
              honesto en esa diferencia, no mezclado como si pesara lo mismo.
            </Caption>
          </Panel>
        </div>

        {/* VIII. PROTOCOLO */}
        <div id="sec-08" className={`mtc-section ${visible['sec-08'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VIII" title="PROTOCOLO — CÓMO JUNTARLO TODO" sub="nada de esto funciona separado de la práctica repetida" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Ningún ítem de esta lista es nuevo por separado — lo que cambia algo es hacerlos en este
              orden, cuando un pensamiento te pega fuerte:
            </p>
            <ul style={{ fontSize: 12.5, lineHeight: 2.1, color: TEXT_DIM, margin: '0 0 16px', paddingLeft: 20 }}>
              <li><strong style={{ color: '#fff' }}>1. Anotalo tal cual apareció</strong> — la versión cruda, no la editada (sección VI).</li>
              <li><strong style={{ color: '#fff' }}>2. Nombrá el patrón</strong> — ¿cuál de la lista de la sección IV es?</li>
              <li><strong style={{ color: '#fff' }}>3. Hablate por tu nombre</strong> — reformulá en segunda persona, como se lo dirías a alguien más (sección V).</li>
              <li><strong style={{ color: '#fff' }}>4. Preguntá la evidencia real</strong> — ¿qué prueba concreta tenés de que esto es cierto?</li>
              <li><strong style={{ color: '#fff' }}>5. Soltalo si no hay acción</strong> — no todo pensamiento necesita respuesta. A veces metacognición es solo verlo pasar (sección III).</li>
            </ul>
            <Caption>
              Esto no reemplaza terapia cuando la voz interna es persistentemente dura o la angustia es
              fuerte y sostenida — es un protocolo de uso diario sobre el pensamiento ordinario, no una
              intervención clínica. Un terapeuta formado en CBT trabaja con exactamente este marco, con
              seguimiento real.
            </Caption>
          </Panel>
        </div>

        {/* IX. RESONANCIA */}
        <div id="sec-09" className={`mtc-section ${visible['sec-09'] ? 'is-visible' : ''}`} style={{ marginBottom: 0 }}>
          <SectionHeader roman="IX" title="RESONANCIA CON NEOPROXY" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              El paso 1 del protocolo de la sección VIII —anotar el pensamiento tal cual apareció, antes de
              analizarlo— es, sin que se haya pensado con ese nombre al construirla, exactamente lo que
              hace la{' '}
              <Link href="/preview/darkproxy" style={{ color: '#fff', textDecoration: 'underline' }}>
                Segunda Mente
              </Link>{' '}
              del panel de DarkProxy: un campo, lo que pienses, se guarda ya. El análisis (si hay una
              acción concreta adentro) viene después, nunca antes de que la captura cruda ya exista.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Y el acto mismo de notar un pensamiento mientras pasa —la metacognición de la sección III— es
              un bucle que se mira a sí mismo, el mismo terreno que ya tiene su propio documento en este
              Codex en la figura de{' '}
              <Link href="/knowledge?entry=hofstadter" style={{ color: '#fff', textDecoration: 'underline' }}>
                Douglas Hofstadter
              </Link>{' '}
              y su "bucle extraño": una mente que se vuelve objeto de sí misma no es una metáfora
              decorativa acá — es, literalmente, de qué se trata este documento entero.
            </p>
          </Panel>
        </div>

        {/* footer */}
        <div style={{ marginTop: 100, paddingTop: 28, borderTop: `1px solid ${ACCENT}22` }}>
          <div style={{ fontSize: 10.5, letterSpacing: 3, color: `${ACCENT}44` }}>
            NPX-ARC-08 // REFERENCIA TÉCNICA DEL CODEX
          </div>
        </div>
      </div>

      <style>{`
        .mtc-section { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .mtc-section.is-visible { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .mtc-section { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
