'use client'

// NPX-REF-01 — SERIAL EXPERIMENTS LAIN: ANÁLISIS
// No está en nav-config.ts (igual que el resto de /archivo), pero ahora sí
// se linkea desde la grilla de documentos de /knowledge -- agregada a
// pedido explícito ("ya tenías un análisis detallado... agrega las
// páginas"), después de vivir un tiempo como página oculta sin link.
// Acento propio: índigo eléctrico #4f6bff, distinto de los ya usados
// (fabricación azul-acero, laboratorio naranja, experimental rojo, codex
// violeta, proxyverse verde, manifiesto dorado, partículas celeste, mente
// magenta, lenguaje teal, alimentación lima, ergoproxy rust/cobre).
//
// Contenido verificado contra fuentes reales vía WebSearch (Wikipedia,
// Looper, The Ringer, AV Club, lain.wiki, CBR, Dazed, Know Your Meme,
// VGMdb) -- Wikipedia directo sigue bloqueado para fetch en este entorno
// (misma política de red de toda la sesión), así que se cita vía
// snippets de búsqueda. Lo no confirmado por fuente primaria queda
// marcado como tal (origen de los NAVI, lectura junguiana, "Despera").

const mono = "'Space Mono', monospace"
const ACCENT = '#4f6bff'
const TEXT = '#c8daf0'
const TEXT_DIM = '#8fb8d6'
const LABEL_DIM = '#4a6080'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(5, 6, 14, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(79,107,255,0.02)`,
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
// Datos — glosario de conceptos clave
// ---------------------------------------------------------------------
type GlossaryRow = { termino: string; definicion: string }
const GLOSSARY: GlossaryRow[] = [
  {
    termino: 'EL WIRED',
    definicion: 'La red global ficticia de la serie — un antecedente directo de internet, imaginado en 1998 como algo que termina disolviendo la frontera entre lo real y lo virtual en vez de quedarse como una herramienta externa.',
  },
  {
    termino: 'PROTOCOLO SIETE',
    definicion: 'El protocolo de próxima generación para el Wired que Masami Eiri dirige en Tachibana General Laboratories. Según una fuente, su ambición era eliminar el cuerpo físico y vivir enteramente en el Wired — Lain fue creada como "contenedor" de ese protocolo.',
  },
  {
    termino: 'NAVI',
    definicion: 'Las terminales/computadoras personales que usan los personajes. Una wiki de fans (no una fuente primaria) sostiene que su diseño de hardware está inspirado en Apple y su sistema operativo en BeOS — se incluye marcado como dato no verificado.',
  },
  {
    termino: 'LOS CABALLEROS DEL CÁLCULO ORIENTAL',
    definicion: '(Knights of the Eastern Calculus) Grupo hacker/culto secreto que venera al Wired como un reino divino y busca eliminar la existencia física — la facción más directamente religiosa de la trama.',
  },
  {
    termino: 'MASAMI EIRI',
    definicion: 'Director del Protocolo Siete, muerto antes de que empiece la serie — el padre de Lain lo conocía y trabajó en el mismo proyecto, y adoptó a Lain cuando Eiri murió.',
  },
]

function GlossaryTable() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
        <tbody>
          {GLOSSARY.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(79,107,255,0.04)' : 'transparent' }}>
              <td style={{ padding: '14px 16px', fontSize: 11, color: '#fff', letterSpacing: 0.5, verticalAlign: 'top', whiteSpace: 'nowrap', borderBottom: `1px solid ${ACCENT}1a` }}>
                {row.termino}
              </td>
              <td style={{ padding: '14px 16px', fontSize: 10.5, lineHeight: 1.8, color: TEXT_DIM, verticalAlign: 'top', borderBottom: `1px solid ${ACCENT}1a` }}>
                {row.definicion}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------
// Datos — notas de recepción crítica
// ---------------------------------------------------------------------
type ReceptionNote = { title: string; detail: string }
const RECEPTION_NOTES: ReceptionNote[] = [
  {
    title: 'CULTO, NO MASIVO',
    detail: 'Varias fuentes coinciden en que la serie nunca alcanzó el lugar en la cultura popular de Neon Genesis Evangelion o Cowboy Bebop — es consenso que quedó como obra de culto, con una devoción de fans casi religiosa (afirmación de un fansite, difícil de verificar con precisión, pero consistente con todo lo demás encontrado).',
  },
  {
    title: 'PREDIJO LA ANSIEDAD DE INTERNET',
    detail: 'Retrospectivas la tratan como una obra que anticipó los efectos sociales de la red años antes de que existieran las redes sociales — se estrenó en 1998, cinco años antes de Myspace. The Ringer sostiene que previó las cualidades adictivas y dañinas de la vida online incluso sin predecir las redes sociales como tales.',
  },
  {
    title: 'VIGENCIA EN LA CULTURA DE MEMES',
    detail: 'El hashtag #lainpilled circula en TikTok con videos de cientos de miles de vistas (Dazed Digital). Know Your Meme registra a Lain como referencia recurrente en imageboards y blogs desde mediados-fines de los 2000. Su tema de apertura, "Duvet" (Bôa), se revive seguido en redes.',
  },
  {
    title: 'INFLUENCIA POSTERIOR',
    detail: 'Una reseña (Looper) traza ecos de la serie en películas como Inception y Transcendence — es el argumento de un solo medio, no un consenso académico, pero consistente con la reputación de la obra como adelantada a su tiempo.',
  },
]

export default function LainAnalysisPage() {
  return (
    <div style={{ background: '#000205', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        {/* encabezado */}
        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${ACCENT}66`, marginBottom: 16 }}>
            NPX-REF-01 // REFERENCIA CULTURAL ARCHIVADA
          </div>
          <h1
            style={{
              fontSize: 'clamp(26px, 6vw, 44px)',
              fontWeight: 700,
              letterSpacing: 4,
              color: ACCENT,
              textShadow: `0 0 40px ${ACCENT}55`,
              marginBottom: 14,
              lineHeight: 1.1,
            }}
          >
            SERIAL EXPERIMENTS LAIN
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            ANÁLISIS EXTENSO — WIRED, IDENTIDAD, RECEPCIÓN, RESONANCIA
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
              marginBottom: 32,
            }}
          >
            Triangle Staff, 1998 — dir. Ryūtarō Nakamura, guion Chiaki J. Konaka, diseño de
            personajes Yoshitoshi ABe. Tercera referencia estética explícita de este proyecto, junto
            a Ghost in the Shell y Ergo Proxy. Trece "Layers", no episodios — y el documento más largo
            de /archivo hasta ahora porque la serie misma pide esa extensión: nada en ella se explica
            una sola vez.
          </p>

          {/* sello de documento */}
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
            <span style={{ color: `${ACCENT}55` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>REFERENCIA CULTURAL — NO CANON NEOPROXY</span>
            <span style={{ color: `${ACCENT}55` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — 9 SECCIONES</span>
            <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>PREMISA → WIRED → IDENTIDAD → FINAL → RECEPCIÓN</span>
          </div>

          {/* índice */}
          <nav style={{ border: `1px solid ${ACCENT}22`, padding: '20px 24px', maxWidth: 640 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}66`, marginBottom: 14 }}>
              ÍNDICE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0 20px' }}>
              {[
                ['I', 'sec-01', 'Premisa'],
                ['II', 'sec-02', 'El Wired y el Protocolo Siete'],
                ['III', 'sec-03', 'Glosario'],
                ['IV', 'sec-04', 'Las múltiples Lain'],
                ['V', 'sec-05', 'El final'],
                ['VI', 'sec-06', 'Temas'],
                ['VII', 'sec-07', 'Estética y sonido'],
                ['VIII', 'sec-08', 'Recepción y legado'],
                ['IX', 'sec-09', 'Resonancia con NeoProxy'],
              ].map(([roman, id, label]) => (
                <a key={id} href={`#${id}`} style={{ fontSize: 10.5, color: TEXT_DIM, textDecoration: 'none', display: 'flex', gap: 10, padding: '7px 0' }}>
                  <span style={{ color: `${ACCENT}88`, width: 24, flexShrink: 0 }}>{roman}</span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </nav>
        </div>

        {/* I. PREMISA */}
        <div id="sec-01" style={{ marginBottom: 90 }}>
          <SectionHeader roman="I" title="PREMISA" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Lain Iwakura es una estudiante de secundaria retraída que recibe un email de una
              compañera, Chisa Yomoda, que acaba de suicidarse. El mensaje dice, en esencia, que Chisa
              simplemente descartó su cuerpo — y que "Dios está acá, en el Wired". A partir de ahí,
              Lain empieza a pasar cada vez más tiempo conectada, y la frontera entre su vida física y
              su presencia en la red empieza a disolverse de un modo que la serie nunca explica de
              forma directa ni lineal.
            </p>
          </Panel>
        </div>

        {/* II. EL WIRED Y EL PROTOCOLO SIETE */}
        <div id="sec-02" style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="EL WIRED Y EL PROTOCOLO SIETE" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Masami Eiri dirigía el desarrollo del Protocolo Siete — la próxima generación del Wired —
              en Tachibana General Laboratories. Según las fuentes consultadas, su proyecto real era
              eliminar la necesidad del cuerpo físico y vivir enteramente dentro de la red; Lain habría
              sido creada como "contenedor" de ese protocolo. Eiri muere antes del inicio de la trama.
              El padre de Lain trabajaba en el mismo proyecto y la adoptó tras esa muerte — lo cual deja
              abierta, sin resolverla nunca del todo, la pregunta de qué tan "humana" fue Lain desde el
              principio.
            </p>
          </Panel>
        </div>

        {/* III. GLOSARIO */}
        <div id="sec-03" style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title="GLOSARIO" sub="los términos que la serie nunca define de una sola vez" />
          <Panel style={{ padding: '10px 10px 16px' }}>
            <GlossaryTable />
          </Panel>
        </div>

        {/* IV. LAS MÚLTIPLES LAIN */}
        <div id="sec-04" style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="LAS MÚLTIPLES LAIN" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La fragmentación de identidad no es subtexto — es la estructura literal de la serie: hay
              una Lain tímida y torpe en la escuela, una Lain segura y distinta dentro del Wired, y una
              tercera que empieza a comportarse como si tuviera memoria y voluntad propias,
              independiente de las otras dos. Un fansite lo formula de un modo que vale la pena citar
              casi textual: hay un número casi infinito de Lain, porque cada recuerdo de Lain en la
              mente de cada persona que la conoció funciona como su propia versión separada de ella.
              Algunos análisis señalan que esto también puede leerse, sin que la serie lo cierre, como
              una representación de trastorno disociativo de identidad — una lectura más entre varias,
              no la explicación oficial.
            </p>
          </Panel>
        </div>

        {/* V. EL FINAL */}
        <div id="sec-05" style={{ marginBottom: 90 }}>
          <SectionHeader roman="V" title="EL FINAL" sub="deliberadamente abierto — ninguna fuente lo da por completamente resuelto" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Hacia el final, Lain confronta a sus propias versiones múltiples y a la presencia que
              funciona como "dios" del Wired, y elige borrar su forma digital omnipresente para
              devolverle la realidad a los demás — un acto de renuncia, no de triunfo. Varias fuentes
              coinciden en que esto nunca se explica del todo: hay pistas constantes, comparables a
              Inception, de que Lain nunca estuvo realmente "afuera" para empezar. La última escena,
              con una Arisu ya adulta que todavía puede sentir la presencia de Lain, sugiere que borrar
              su forma no significó desaparecer — solo dejar de ser vista.
            </p>
          </Panel>
        </div>

        {/* VI. TEMAS */}
        <div id="sec-06" style={{ marginBottom: 90 }}>
          <SectionHeader roman="VI" title="TEMAS" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Panel>
              <div style={{ fontSize: 12, letterSpacing: 2, color: ACCENT, marginBottom: 10 }}>IDENTIDAD Y DISOCIACIÓN</div>
              <div style={{ fontSize: 10.5, lineHeight: 1.8, color: TEXT_DIM }}>
                El eje central de toda la obra: qué queda de "vos" cuando otras personas te recuerdan de
                formas incompatibles entre sí, y la red hace que esas versiones divergentes convivan al
                mismo tiempo en vez de resolverse en una sola historia.
              </div>
            </Panel>
            <Panel>
              <div style={{ fontSize: 12, letterSpacing: 2, color: ACCENT, marginBottom: 10 }}>ALIENACIÓN SOCIAL</div>
              <div style={{ fontSize: 10.5, lineHeight: 1.8, color: TEXT_DIM }}>
                Lain empieza la serie prácticamente sin vínculos reales — la conexión que encuentra en
                el Wired es, durante buena parte de la trama, más genuina para ella que cualquier
                vínculo físico, lo cual invierte la jerarquía esperada entre "vida real" y pantalla.
              </div>
            </Panel>
            <Panel>
              <div style={{ fontSize: 12, letterSpacing: 2, color: ACCENT, marginBottom: 10 }}>INCONSCIENTE COLECTIVO — LECTURA DE FANS, NO ACADÉMICA</div>
              <div style={{ fontSize: 10.5, lineHeight: 1.8, color: TEXT_DIM }}>
                Algunos ensayos de aficionados conectan al Wired con el inconsciente colectivo de Jung —
                una red que todos comparten sin que nadie la controle del todo. Es una lectura
                razonable, pero es interpretación de blogs, no un consenso de crítica especializada;
                se incluye marcada como tal.
              </div>
            </Panel>
          </div>
        </div>

        {/* VII. ESTÉTICA Y SONIDO */}
        <div id="sec-07" style={{ marginBottom: 90 }}>
          <SectionHeader roman="VII" title="ESTÉTICA Y SONIDO" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: '0 0 16px' }}>
              El diseño de personajes de Yoshitoshi ABe — líneas simples, paletas desaturadas, el
              pijama de oso de Lain como una de las imágenes más reconocibles del anime de los 90 — se
              sostiene sobre un sonido igual de deliberado: Reichi "Chabo" Nakaido compuso una banda
              sonora que una reseña de Anime News Network (2003) describe como instrumentales
              inquietantes con una base de tecno subyacente, muy distinta del sonido orquestal típico
              de la época.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Los NAVI — las terminales personales que usan los personajes — tienen, según una wiki de
              fans (no una fuente primaria confirmada), un diseño de hardware inspirado en Apple y un
              sistema operativo inspirado en BeOS. Se incluye con esa salvedad explícita: no hay una
              entrevista de producción verificada en los resultados de búsqueda que lo confirme
              directamente.
            </p>
          </Panel>
        </div>

        {/* VIII. RECEPCIÓN Y LEGADO */}
        <div id="sec-08" style={{ marginBottom: 90 }}>
          <SectionHeader roman="VIII" title="RECEPCIÓN Y LEGADO" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {RECEPTION_NOTES.map((n, i) => (
              <Panel key={i}>
                <div style={{ fontSize: 12, letterSpacing: 2, color: ACCENT, marginBottom: 10, textShadow: `0 0 10px ${ACCENT}44` }}>{n.title}</div>
                <div style={{ fontSize: 10.5, lineHeight: 1.8, color: TEXT_DIM }}>{n.detail}</div>
              </Panel>
            ))}
          </div>
        </div>

        {/* IX. RESONANCIA CON NEOPROXY */}
        <div id="sec-09" style={{ marginBottom: 40 }}>
          <SectionHeader roman="IX" title="RESONANCIA CON NEOPROXY" sub="lectura propia de este documento, no una fuente externa — marcada como tal" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: '0 0 16px' }}>
              De las tres referencias estéticas que este proyecto cita explícitamente, Lain es la que
              más de cerca anticipa su propia premisa de fondo: una red que no es solo infraestructura,
              sino un espacio donde la identidad deja de ser una sola cosa estable. Los seis agentes de
              NeoProxy tienen lore y arte canónico propio — una capa de ficción, como las múltiples
              versiones de Lain que viven en la memoria de cada personaje — mientras el kernel real
              (<code style={{ color: ACCENT }}>Memory/hub.json</code>) los mantiene como stubs en
              estado <code style={{ color: ACCENT }}>idle</code>: la versión "real" y la versión
              narrada no coinciden, exactamente la misma grieta que sostiene toda la trama de Lain
              entre la chica de carne y hueso y la presencia que termina habitando el Wired.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Prototype — el séptimo agente, emergente, ensamblado de residuos de los otros cinco — es
              la pieza que más se acerca a lo que le pasa a Lain hacia el final: una entidad que no fue
              diseñada a propósito desde el principio, que se vuelve más real cuanto más el sistema que
              la rodea actúa como si ya lo fuera.
            </p>
          </Panel>
        </div>

        {/* footer */}
        <div style={{ marginTop: 100, paddingTop: 28, borderTop: `1px solid ${ACCENT}22` }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}44` }}>
            NPX-REF-01 // DOCUMENTO SIN ENLAZAR — ARCHIVO ACCEDIDO DIRECTO, NO INDEXADO
          </div>
        </div>
      </div>
    </div>
  )
}
