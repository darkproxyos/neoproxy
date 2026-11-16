'use client'

// NPX-ARN-00 — GRIMORIOS Y SISTEMAS OCCIDENTALES
// Primer documento de Codex Arcanum (ver /knowledge/arcanum), la tercera
// pata del Codex junto a los documentos de archivo (/archivo/*) y el
// espacio 3D (/lab/codex). Mismo estándar de rigor que el resto del
// archivo: cada atribución legendaria queda marcada como tal (la
// Clavícula de Salomón no la escribió Salomón; el Corpus Hermético no es
// egipcio antiguo), y el documento no toma partido sobre si algún
// sistema "funciona" en el sentido que sus practicantes le dieron --
// documenta manuscritos, fechas y personas reales, nada más. Cierra
// citando el método de Spare que ya corre, de verdad, en
// /experimental/sigilo -- esto no es ficción adyacente al sitio, es el
// trasfondo real de algo ya shippeado.
// Acento propio: oxblood/rojo sello de cera #8b1538, distinto de todos
// los acentos ya usados en /archivo y /knowledge (ningún otro documento
// usa un rojo profundo en vez de rosa/magenta/fucsia).

import { useEffect, useState } from 'react'
import Link from 'next/link'

const mono = "'Space Mono', monospace"
const ACCENT = '#8b1538'
const TEXT = '#f0d6da'
const TEXT_DIM = '#c88f98'
const LABEL_DIM = '#80444a'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(10, 3, 5, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(139,21,56,0.03)`,
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

const TOC: [string, string, string][] = [
  ['I', 'sec-01', 'Heka — el nombre como acto (Egipto)'],
  ['II', 'sec-02', 'El Corpus Hermético y el mito de su propia antigüedad'],
  ['III', 'sec-03', 'Los grimorios salomónicos'],
  ['IV', 'sec-04', 'Agrippa y la Filosofía Oculta'],
  ['V', 'sec-05', 'Dee, Kelley y el sistema Enoquiano'],
  ['VI', 'sec-06', 'El revival del siglo XIX'],
  ['VII', 'sec-07', 'Crowley y Thelema'],
  ['VIII', 'sec-08', 'Magia del caos — Spare y Carroll'],
  ['IX', 'sec-09', 'Resonancia con NeoProxy'],
]

export default function GrimoriosPage() {
  const [visible, setVisible] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.arn-section'))
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
    <div style={{ background: '#070203', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        <Link href="/knowledge/arcanum" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${ACCENT}aa`, textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← VOLVER A CODEX ARCANUM
        </Link>

        {/* encabezado */}
        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${ACCENT}66`, marginBottom: 16 }}>
            NPX-ARN-00 // HISTORIA VERIFICABLE
          </div>
          <h1
            style={{
              fontSize: 'clamp(22px, 4.6vw, 36px)',
              fontWeight: 700,
              letterSpacing: 3,
              color: ACCENT,
              textShadow: `0 0 40px ${ACCENT}55`,
              marginBottom: 14,
              lineHeight: 1.15,
            }}
          >
            GRIMORIOS Y SISTEMAS OCCIDENTALES
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            DE HEKA A LA MAGIA DEL CAOS
          </div>
          <p
            style={{
              fontSize: 11.5,
              lineHeight: 2.1,
              letterSpacing: 0.3,
              color: TEXT_DIM,
              maxWidth: 640,
              borderLeft: `1px solid ${ACCENT}33`,
              paddingLeft: 24,
              marginBottom: 32,
            }}
          >
            Un linaje real de manuscritos, personas y fechas verificables — no una lista de hechizos.
            Cada sistema acá documentado dejó un registro histórico concreto (un papiro, un manuscrito,
            una orden fundada con nombre y acta) y cada atribución legendaria (Salomón, el Egipto
            faraónico) queda marcada como tal, separada de lo que el registro real permite confirmar.
            El primer documento de <strong style={{ color: '#fff' }}>Codex Arcanum</strong>, la tercera
            pata del Codex: la misma pregunta de siempre, la versión más antigua de la respuesta.
          </p>

          {/* sello */}
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
            <span style={{ color: `${ACCENT}55` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>HISTORIA DEL ESOTERISMO OCCIDENTAL — NO CANON NEOPROXY</span>
            <span style={{ color: `${ACCENT}55` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — 9 SECCIONES</span>
            <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>EGIPTO → HERMETISMO → GRIMORIOS → RENACIMIENTO → REVIVAL → CAOS</span>
          </div>

          {/* índice */}
          <nav style={{ border: `1px solid ${ACCENT}22`, padding: '20px 24px', maxWidth: 680 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}66`, marginBottom: 14 }}>
              ÍNDICE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '6px 20px' }}>
              {TOC.map(([roman, id, label]) => (
                <a key={id} href={`#${id}`} style={{ fontSize: 10.5, color: TEXT_DIM, textDecoration: 'none', display: 'flex', gap: 10 }}>
                  <span style={{ color: `${ACCENT}88`, width: 24, flexShrink: 0 }}>{roman}</span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </nav>
        </div>

        {/* I. HEKA */}
        <div id="sec-01" className={`arn-section ${visible['sec-01'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="I" title="HEKA — EL NOMBRE COMO ACTO" sub="Egipto antiguo, atestiguado en textos funerarios reales" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              <strong style={{ color: '#fff' }}>Heka</strong> era, para los antiguos egipcios, tanto el
              nombre de una fuerza real del cosmos como el de una práctica concreta: la idea de que
              conocer y pronunciar el nombre verdadero de algo —un dios, un demonio, una enfermedad— daba
              poder efectivo sobre eso. No es una metáfora moderna leída sobre Egipto: aparece documentada
              en los Textos de las Pirámides (hacia 2400–2300 a.C.) y, más tarde, en el Libro de los
              Muertos, como la fuerza que los propios dioses usan para crear y sostener el mundo. Es el
              registro escrito más antiguo de una idea que después va a reaparecer, con otro nombre, en
              cada sistema de este documento: que el lenguaje no solo describe el mundo, sino que puede
              actuar sobre él.
            </p>
          </Panel>
        </div>

        {/* II. CORPUS HERMETICO */}
        <div id="sec-02" className={`arn-section ${visible['sec-02'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="EL CORPUS HERMÉTICO Y EL MITO DE SU PROPIA ANTIGÜEDAD" sub="el mejor ejemplo de este documento de 'se creyó milenario, la filología demostró que no'" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              El Corpus Hermeticum —textos atribuidos a Hermes Trismegisto, fusión legendaria del dios
              egipcio Thot y el griego Hermes— se presentó durante más de mil años como sabiduría del
              Egipto faraónico, anterior incluso a Moisés. En 1614 el filólogo Isaac Casaubon analizó el
              griego de los textos y demostró, por el vocabulario y la gramática, que fueron escritos en
              el Egipto greco-romano, probablemente entre los siglos II y III d.C. — contemporáneos del
              cristianismo primitivo, no de los faraones. El dato no invalida el contenido filosófico del
              Corpus (su idea central, "como es arriba es abajo", sigue citada en todo este documento);
              invalida la fecha que sus propios lectores le habían creído durante un milenio entero.
            </p>
          </Panel>
        </div>

        {/* III. GRIMORIOS SALOMONICOS */}
        <div id="sec-03" className={`arn-section ${visible['sec-03'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title="LOS GRIMORIOS SALOMÓNICOS" sub="atribución legendaria, manuscritos reales mucho más tardíos" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              La <strong style={{ color: '#fff' }}>Clavícula de Salomón</strong> (Key of Solomon) se
              presenta como escrita por el rey bíblico Salomón. Los manuscritos más antiguos que de
              verdad existen son del Renacimiento italiano —no hay ningún fragmento anterior—, lo que
              hace de la autoría de Salomón una atribución pseudoepigráfica: una forma habitual, en estos
              géneros, de darle autoridad a un texto nuevo poniéndole el nombre de alguien ya legendario.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              El <strong style={{ color: '#fff' }}>Picatrix</strong> (originalmente Ghāyat al-Ḥakīm, "la
              meta del sabio") sí tiene un origen verificable: un tratado árabe de magia astrológica y
              talismánica escrito hacia los siglos X–XI, traducido al latín en el siglo XIII por encargo
              directo de Alfonso X de Castilla. Acá la cadena de transmisión es real y rastreable de
              punta a punta — a diferencia de la Clavícula, nadie pretende que lo haya escrito un rey
              bíblico.
            </p>
          </Panel>
        </div>

        {/* IV. AGRIPPA */}
        <div id="sec-04" className={`arn-section ${visible['sec-04'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="AGRIPPA Y LA FILOSOFÍA OCULTA" sub="Renacimiento, autor real, fecha real, síntesis real" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Heinrich Cornelius Agrippa von Nettesheim publicó <em>De Occulta Philosophia</em> en 1533 —
              a diferencia de los documentos anteriores, acá no hay atribución legendaria: Agrippa existió,
              firmó el texto con su nombre, y lo escribió como una síntesis deliberada de neoplatonismo,
              cábala judía y lo que él mismo llamaba "magia natural" (el estudio de propiedades ocultas en
              plantas, piedras y astros, no invocación de espíritus). El libro organiza el cosmos en tres
              mundos —elemental, celeste, intelectual— y es, probablemente, el intento más sistemático de
              toda la época de poner la magia ceremonial en la misma forma que la filosofía natural de su
              tiempo: capítulos, categorías, correspondencias tabuladas.
            </p>
          </Panel>
        </div>

        {/* V. DEE Y KELLEY */}
        <div id="sec-05" className={`arn-section ${visible['sec-05'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="V" title="DEE, KELLEY Y EL SISTEMA ENOQUIANO" sub="documentado en diarios personales reales, conservados hasta hoy" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              John Dee —matemático y astrónomo de la corte de Isabel I de Inglaterra, una figura de la
              ciencia real de su época, no un ocultista marginal— pasó buena parte de la década de 1580
              realizando sesiones de videncia junto a Edward Kelley, que actuaba como médium. De esas
              sesiones salió el llamado sistema Enoquiano: un alfabeto propio, un idioma completo y una
              serie de "Llaves" o invocaciones. La fuente de todo esto no es un manuscrito anónimo sino
              los diarios personales de Dee, que existen y se conservan en archivos reales — uno de los
              pocos casos de este documento donde el registro histórico documenta, minuto a minuto, el
              momento en que un sistema mágico fue inventado.
            </p>
          </Panel>
        </div>

        {/* VI. REVIVAL SIGLO XIX */}
        <div id="sec-06" className={`arn-section ${visible['sec-06'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VI" title="EL REVIVAL DEL SIGLO XIX" sub="Éliphas Lévi y la Golden Dawn — orden real, acta fundacional real" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Alphonse Louis Constant, bajo el seudónimo <strong style={{ color: '#fff' }}>Éliphas
              Lévi</strong>, publicó a mediados del siglo XIX una síntesis propia de cábala, tarot y
              magia ceremonial que terminó fijando buena parte de la imagen popular moderna de "lo
              mágico" — sin pretender, a diferencia de los grimorios anteriores, que su obra fuera
              antigua. Era, y se sabía, una construcción nueva.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La Hermetic Order of the Golden Dawn se fundó en Londres en 1888 por William Westcott, Samuel
              Liddell MacGregor Mathers y William Woodman — una orden real, con actas y rituales de grado
              documentados, construida sobre unos manuscritos cifrados de origen disputado (los "Cipher
              Manuscripts"). Formalizó un sistema completo de correspondencias (tarot, astrología, cábala,
              los cuatro elementos) que casi todo el esoterismo occidental posterior —incluido lo que
              viene después en este documento— sigue usando como vocabulario común.
            </p>
          </Panel>
        </div>

        {/* VII. CROWLEY */}
        <div id="sec-07" className={`arn-section ${visible['sec-07'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VII" title="CROWLEY Y THELEMA" sub="miembro real de la Golden Dawn, texto fundacional con fecha exacta" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Aleister Crowley fue miembro real de la Golden Dawn antes de romper con la orden y fundar su
              propio sistema, Thelema, a partir de <em>Liber AL vel Legis</em> (1904) — un texto que
              Crowley describió como dictado por una inteligencia no humana, Aiwass, durante tres días en
              El Cairo. El documento no toma postura sobre esa afirmación: lo verificable es que el
              manuscrito existe, tiene fecha, y que la frase que lo resume ("Haz tu voluntad, esa será
              toda la Ley") se volvió, para bien o para mal, el lema más citado del esoterismo del siglo
              XX. La influencia real de Crowley sobre todo lo que sigue en este documento es más fácil de
              rastrear que casi cualquier otra cosa escrita acá.
            </p>
          </Panel>
        </div>

        {/* VIII. MAGIA DEL CAOS */}
        <div id="sec-08" className={`arn-section ${visible['sec-08'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VIII" title="MAGIA DEL CAOS — SPARE Y CARROLL" sub="el único capítulo de este documento cuyo método corre, hoy, como código real en este sitio" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Austin Osman Spare, artista e ilustrador inglés de principios del siglo XX, propuso un
              método propio para condensar una intención en un único símbolo —un sigilo—: escribir la
              frase, quitar las vocales y las letras repetidas, y fundir las letras que quedan en una
              sola forma gráfica. El paso siguiente, documentado en sus propios escritos, es "cargar" ese
              sigilo llevando la atención a un estado de absorción intensa (lo que llamaba gnosis) y
              después olvidar conscientemente su significado literal — la creencia activa, en su
              planteo, interfiere con el efecto.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Peter J. Carroll formalizó esto, junto con otros practicantes, en 1976 bajo el nombre de
              <strong style={{ color: '#fff' }}> magia del caos</strong> y fundó el IOT (Illuminates of
              Thanateros) — un sistema deliberadamente sin dogma fijo, que trata cualquier creencia,
              incluida la propia, como una herramienta a usar y descartar, no como una verdad a defender.
              Es la idea más cercana, de todo este documento, al espíritu con el que NeoProxy ya trata su
              propio lore: una estructura simbólica fuerte, usada como forma, sin pedirle a nadie que la
              sostenga como creencia literal.
            </p>
          </Panel>
        </div>

        {/* IX. RESONANCIA */}
        <div id="sec-09" className={`arn-section ${visible['sec-09'] ? 'is-visible' : ''}`} style={{ marginBottom: 40 }}>
          <SectionHeader roman="IX" title="RESONANCIA CON NEOPROXY" sub="esto no es lectura propia a distancia — es lo que ya corre en el sitio" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              A diferencia del resto de los documentos del Codex, acá la resonancia no es una lectura
              simbólica forzada: el método del capítulo VIII —reducción de letras, fusión en un glifo
              sobre una rueda fija— es, literalmente, el algoritmo que corre en{' '}
              <Link href="/experimental/sigilo" style={{ color: '#fff', textDecoration: 'underline' }}>
                /experimental/sigilo
              </Link>
              , determinístico como el resto de las herramientas de este sitio. Esa página suma ahora,
              además, el paso de carga que Spare describió: un ritual de respiración cronometrado, seguido
              de un cierre honesto sobre el mecanismo psicológico real detrás (atención sostenida + el
              efecto de cierre que cualquier ritual estructurado produce) — nunca presentado como algo
              sobrenatural. El resto de los sistemas de este documento —heka, hermetismo, los grimorios,
              Dee, la Golden Dawn, Thelema— son el linaje histórico que le da a ese código su contexto
              real, no una decoración narrativa puesta encima después.
            </p>
          </Panel>
        </div>

        {/* footer */}
        <div style={{ marginTop: 100, paddingTop: 28, borderTop: `1px solid ${ACCENT}22` }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}44` }}>
            NPX-ARN-00 // PRIMER DOCUMENTO DE CODEX ARCANUM
          </div>
        </div>
      </div>

      <style>{`
        .arn-section { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .arn-section.is-visible { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .arn-section { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
