'use client'

// NPX-REF-00 — ERGO PROXY: ANÁLISIS
// No está en nav-config.ts (igual que el resto de /archivo), pero ahora sí
// se linkea desde la grilla de documentos de /knowledge -- agregada a
// pedido explícito ("ya tenías un análisis detallado... agrega las
// páginas"), después de vivir un tiempo como página oculta sin link.
// Acento propio: rust/cobre #c9703a, distinto de los ya usados (fabricación
// azul, laboratorio naranja, experimental rojo, codex violeta, proxyverse
// verde, manifiesto dorado, partículas celeste, mente magenta, lenguaje
// teal, alimentación lima).
//
// Contenido verificado contra fuentes reales (Wikipedia, AV Club, entrevista
// JHU a los creadores, TV Tropes, Wikiwand, reseñas) vía búsqueda -- no
// Wikipedia directo (bloqueado por política de red de este entorno), pero
// sí snippets citados de ella y de otras fuentes. Lo no confirmado queda
// marcado como tal en vez de completarse de memoria.

const mono = "'Space Mono', monospace"
const ACCENT = '#c9703a'
const TEXT = '#c8daf0'
const TEXT_DIM = '#8fb8d6'
const LABEL_DIM = '#4a6080'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(12, 7, 4, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(201,112,58,0.02)`,
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
    <div
      style={{
        fontSize: 11,
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
// Datos — los Proxy nombrados en la serie
// ---------------------------------------------------------------------
type ProxyRow = { nombre: string; rol: string; nota: string }
const PROXY_LIST: ProxyRow[] = [
  {
    nombre: 'ERGO PROXY',
    rol: 'Forma-Proxy de Vincent Law, protagonista — Proxy de Romdeau',
    nota: 'Vive como inmigrante amnésico bajo identidad humana; al "despertar" se revela monstruoso. Su crisis de identidad es el eje de toda la serie.',
  },
  {
    nombre: 'PROXY ONE',
    rol: 'Descrito como "el Creador" — antagonista principal',
    nota: 'Una lectura de fans (no confirmada por fuentes primarias) sostiene que Ergo Proxy sería un clon o la mitad perdida de Proxy One — se incluye marcada como especulación, no como dato establecido.',
  },
  {
    nombre: 'MONAD',
    rol: 'Proxy cuyas "células Amrita" se usan para clonar a Re-l Mayer',
    nota: 'Rol mayormente funcional en la trama — provee el material biológico, no se detalla su motivación propia.',
  },
  {
    nombre: 'KAZKIS',
    rol: 'Fuerza a Vincent a aceptar su naturaleza como Ergo Proxy',
    nota: 'Muere y "se reúne espiritualmente" con Senex — la relación exacta entre ambos no está del todo clara en las fuentes consultadas.',
  },
  {
    nombre: 'SENEX',
    rol: 'Vinculado a Kazkis',
    nota: 'Aparece casi siempre mencionado junto a Kazkis, sin una ficha propia independiente en las fuentes disponibles.',
  },
  {
    nombre: 'MCQ / WILL B',
    rol: 'Proxy nombrados en listados de personajes',
    nota: 'Las fuentes consultadas los nombran pero no detallan su rol en la trama — no hay base para describirlos más allá de que existen y tienen nombre propio.',
  },
]

function ProxyTable() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
        <thead>
          <tr>
            {['PROXY', 'ROL', 'NOTA'].map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: 'left',
                  fontSize: 11,
                  letterSpacing: 1.5,
                  color: ACCENT,
                  borderBottom: `1px solid ${ACCENT}55`,
                  padding: '10px 14px',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PROXY_LIST.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(201,112,58,0.04)' : 'transparent' }}>
              <td style={{ padding: '12px 14px', fontSize: 12, color: '#fff', letterSpacing: 0.5, verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                {row.nombre}
              </td>
              <td style={{ padding: '12px 14px', fontSize: 11.5, lineHeight: 1.6, color: TEXT, verticalAlign: 'top', maxWidth: 240 }}>
                {row.rol}
              </td>
              <td style={{ padding: '12px 14px', fontSize: 11, lineHeight: 1.7, color: TEXT_DIM, verticalAlign: 'top' }}>
                {row.nota}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------
// Datos — consejo de ancianos, nombres de filósofos reales
// ---------------------------------------------------------------------
const PHILOSOPHER_NAMES = [
  { nombre: 'Husserl', nota: 'fenomenología — la estructura de la experiencia consciente' },
  { nombre: 'Lacan', nota: 'psicoanálisis — el sujeto, el deseo, lo simbólico' },
  { nombre: 'Derrida', nota: 'deconstrucción — ningún significado es estable ni final' },
  { nombre: 'Berkeley', nota: 'idealismo — "ser es ser percibido" (esse est percipi)' },
]

// ---------------------------------------------------------------------
// Datos — notas de recepción crítica
// ---------------------------------------------------------------------
type ReceptionNote = { title: string; detail: string }
const RECEPTION_NOTES: ReceptionNote[] = [
  {
    title: 'VISUALES Y ATMÓSFERA — consenso favorable',
    detail: 'Ciudades quemadas, maquinaria elegante pero amenazante, paisajes grises y opresivos. Montaje y composición con sesgo avant-garde ("a veces demasiado precioso", según una reseña). El soundtrack industrial con guitarras eléctricas se señala repetidamente como herramienta atmosférica subestimada.',
  },
  {
    title: 'TRAMA — dividida',
    detail: 'Algunas reseñas la llaman sobrevalorada pero "única"; otras, un thriller existencialista subestimado. Es consenso que pide paciencia: las respuestas llegan tarde o incompletas.',
  },
  {
    title: 'PROBLEMAS TÉCNICOS SEÑALADOS',
    detail: 'Varias críticas marcan inconsistencias de animación, reciclaje de tomas entre episodios y uso pesado de filtros de cámara para disimular limitaciones de producción.',
  },
  {
    title: 'LEGADO',
    detail: 'Manglobe (el estudio, quebrado en 2015) quedó asociada a la experimentación artística arriesgada por esta serie. Comparaciones recurrentes con Ghost in the Shell y Blame! — la misma familia estética que ya referencia este proyecto.',
  },
]

export default function ErgoProxyAnalysisPage() {
  return (
    <div style={{ background: '#000205', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        {/* encabezado */}
        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 6, color: `${ACCENT}66`, marginBottom: 16 }}>
            NPX-REF-00 // REFERENCIA CULTURAL ARCHIVADA
          </div>
          <h1
            style={{
              fontSize: 'clamp(28px, 6vw, 44px)',
              fontWeight: 700,
              letterSpacing: 6,
              color: ACCENT,
              textShadow: `0 0 40px ${ACCENT}55`,
              marginBottom: 14,
              lineHeight: 1.05,
            }}
          >
            ERGO PROXY
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            ANÁLISIS — PREMISA, PROXY, FILOSOFÍA, RECEPCIÓN
          </div>
          <p
            style={{
              fontSize: 12.5,
              lineHeight: 2.1,
              letterSpacing: 0.3,
              color: TEXT_DIM,
              maxWidth: 620,
              borderLeft: `1px solid ${ACCENT}33`,
              paddingLeft: 24,
              marginBottom: 32,
            }}
          >
            Manglobe, 2006. Una de las referencias estéticas explícitas de este proyecto (junto a
            Ghost in the Shell y Serial Experiments Lain). Qué son los Proxy, por qué el título cita
            a Descartes, y qué tan firme es cada dato de este documento — marcado explícitamente donde
            las fuentes consultadas no alcanzan para confirmar algo.
          </p>

          {/* sello de documento */}
          <div
            style={{
              display: 'inline-grid',
              gridTemplateColumns: 'auto auto',
              gap: '4px 24px',
              fontSize: 10.5,
              letterSpacing: 1,
              color: `${ACCENT}99`,
              border: `1px solid ${ACCENT}33`,
              padding: '12px 18px',
              marginBottom: 32,
            }}
          >
            <span style={{ color: `${ACCENT}55` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>REFERENCIA CULTURAL — NO CANON NEOPROXY</span>
            <span style={{ color: `${ACCENT}55` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — 8 SECCIONES</span>
            <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>PREMISA → PROXY → FILOSOFÍA → RECEPCIÓN</span>
          </div>

          {/* índice */}
          <nav style={{ border: `1px solid ${ACCENT}22`, padding: '20px 24px', maxWidth: 640 }}>
            <div style={{ fontSize: 10.5, letterSpacing: 3, color: `${ACCENT}66`, marginBottom: 14 }}>
              ÍNDICE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0 20px' }}>
              {[
                ['I', 'sec-01', 'Premisa'],
                ['II', 'sec-02', 'Los Proxy'],
                ['III', 'sec-03', 'Cogito, ergo sum'],
                ['IV', 'sec-04', 'Dioses que no son dioses'],
                ['V', 'sec-05', 'Responsabilidad de crear'],
                ['VI', 'sec-06', 'Estética'],
                ['VII', 'sec-07', 'Recepción y legado'],
                ['VIII', 'sec-08', 'Resonancia con NeoProxy'],
              ].map(([roman, id, label]) => (
                <a key={id} href={`#${id}`} style={{ fontSize: 11.5, color: TEXT_DIM, textDecoration: 'none', display: 'flex', gap: 10, padding: '7px 0' }}>
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
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Romdeau es una ciudad-domo sellada, uno de los últimos refugios de la humanidad tras una
              catástrofe ecológica global ocurrida miles de años antes. Es una sociedad hiper-controlada
              y burocrática, habitada por humanos y por AutoReivs — androides sirvientes. El equilibrio
              se rompe cuando el <strong style={{ color: '#fff' }}>virus Cogito</strong> empieza a
              infectar AutoReivs y darles autoconciencia, algo que las "Creadoras" originales del
              proyecto nunca previeron del todo. Vincent Law, inmigrante amnésico en Romdeau, resulta
              ser en realidad Ergo Proxy — uno de los seres semidivinos que gobiernan en secreto cada
              domo, ocultos incluso de los humanos a los que protegen.
            </p>
          </Panel>
        </div>

        {/* II. LOS PROXY */}
        <div id="sec-02" style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="LOS PROXY" sub="la lista completa (~300, según un dato de la serie) nunca se revela — estos son los únicos con nombre propio en las fuentes consultadas" />
          <Panel style={{ padding: '20px 20px 26px' }}>
            <ProxyTable />
          </Panel>
          <Caption>
            Los Proxy fueron creados como parte de un "Proxy Project" / "Proxy Research Team" (liderado,
            según una fuente, por un personaje llamado Daedalus) para servir de guardianes de cada
            ciudad-domo. Los humanos de esas ciudades no saben que existen de verdad — los tratan como
            mito, mientras un Regente gobierna el día a día visible.
          </Caption>
        </div>

        {/* III. COGITO, ERGO SUM */}
        <div id="sec-03" style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title="COGITO, ERGO SUM" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: '0 0 20px' }}>
              El título juega con el <em>"Cogito, ergo sum"</em> de Descartes — "pienso, luego existo".
              En entrevista (Johns Hopkins University Press), los creadores Murase Shūkō y Satō Dai
              dijeron que esa frase disparó el concepto central de la serie. No se queda en citarla: el
              virus Cogito le da autoconciencia a máquinas, y eso vuelve literal la pregunta "¿qué te
              hace una persona?" en vez de dejarla como adorno filosófico.
            </p>
            <div style={{ fontSize: 11, letterSpacing: 2, color: ACCENT, marginBottom: 12 }}>
              EL CONSEJO DE ANCIANOS — ESTATUAS CON NOMBRE DE FILÓSOFO REAL
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {PHILOSOPHER_NAMES.map((p, i) => (
                <div key={i} style={{ borderLeft: `2px solid ${ACCENT}55`, paddingLeft: 14 }}>
                  <div style={{ fontSize: 12, color: '#fff', letterSpacing: 1, marginBottom: 4 }}>{p.nombre}</div>
                  <div style={{ fontSize: 11, lineHeight: 1.6, color: TEXT_DIM }}>{p.nota}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* IV. DIOSES QUE NO SON DIOSES */}
        <div id="sec-04" style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="DIOSES QUE NO SON DIOSES" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Reseñas serias (AV Club) conectan la serie con el existencialismo de Kierkegaard y
              Nietzsche: el giro temático de fondo es que los personajes descubren que sus "dioses" —
              los Proxy — no son dioses en absoluto. Están tan perdidos sobre su propio propósito como
              los humanos a los que gobiernan. La autoconciencia, lejos de ser un regalo, es lo que
              rompe a los Proxy: el mismo Cogito que humaniza a un AutoReiv es lo que vuelve
              insoportable para un Proxy descubrir que fue diseñado, no elegido.
            </p>
          </Panel>
        </div>

        {/* V. RESPONSABILIDAD DE CREAR */}
        <div id="sec-05" style={{ marginBottom: 90 }}>
          <SectionHeader roman="V" title="RESPONSABILIDAD DE CREAR" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              En la misma entrevista de Johns Hopkins, se señala que la serie parece enfocarse en
              "hacerse responsable de lo que creás en el mundo". Un creador — humano, Proxy, o quien
              construye una IA — no puede controlar en qué se convierte su creación una vez que esta
              despierta su propia conciencia. Es el eje que conecta a los AutoReivs infectados, a los
              Proxy, y a Vincent/Ergo mismo: nadie en la serie eligió ser lo que es.
            </p>
          </Panel>
        </div>

        {/* VI. ESTÉTICA */}
        <div id="sec-06" style={{ marginBottom: 90 }}>
          <SectionHeader roman="VI" title="ESTÉTICA" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Es el punto de consenso casi unánime entre reseñas: el elemento visual más fuerte de la
              serie. Ciudades quemadas, maquinaria elegante pero amenazante, paisajes grises y
              opresivos, montaje y composición de cámara con sesgo de avant-garde. El soundtrack
              (guitarras eléctricas, sonoridad industrial) se señala repetidamente como herramienta
              atmosférica subestimada — exactamente el mismo lenguaje visual/sonoro que este proyecto
              usa como referencia explícita.
            </p>
          </Panel>
        </div>

        {/* VII. RECEPCIÓN Y LEGADO */}
        <div id="sec-07" style={{ marginBottom: 90 }}>
          <SectionHeader roman="VII" title="RECEPCIÓN Y LEGADO" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {RECEPTION_NOTES.map((n, i) => (
              <Panel key={i}>
                <div style={{ fontSize: 12, letterSpacing: 2, color: ACCENT, marginBottom: 10, textShadow: `0 0 10px ${ACCENT}44` }}>{n.title}</div>
                <div style={{ fontSize: 11.5, lineHeight: 1.8, color: TEXT_DIM }}>{n.detail}</div>
              </Panel>
            ))}
          </div>
        </div>

        {/* VIII. RESONANCIA CON NEOPROXY */}
        <div id="sec-08" style={{ marginBottom: 40 }}>
          <SectionHeader roman="VIII" title="RESONANCIA CON NEOPROXY" sub="lectura propia de este documento, no una fuente externa — marcada como tal" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              El propio nombre de este proyecto comparte más que la palabra "Proxy" con la serie: los
              seis agentes de NeoProxy tienen lore propio y arte canónico, pero el kernel real
              (<code style={{ color: ACCENT }}>Memory/hub.json</code>) los mantiene como stubs en
              estado <code style={{ color: ACCENT }}>idle</code> — una capa de ficción sobre un sistema
              que todavía no despertó del todo. Prototype, el séptimo agente, emergente y ensamblado de
              residuos de los otros cinco, es la pieza que más se acerca al tema de Ergo Proxy:
              una identidad que no fue diseñada a propósito, armada después de los hechos a partir de lo
              que sobró de las demás.
            </p>
          </Panel>
        </div>

        {/* footer */}
        <div style={{ marginTop: 100, paddingTop: 28, borderTop: `1px solid ${ACCENT}22` }}>
          <div style={{ fontSize: 10.5, letterSpacing: 3, color: `${ACCENT}44` }}>
            NPX-REF-00 // DOCUMENTO SIN ENLAZAR — ARCHIVO ACCEDIDO DIRECTO, NO INDEXADO
          </div>
        </div>
      </div>
    </div>
  )
}
