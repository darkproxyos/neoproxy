'use client'

// NPX-REF-02 — GHOST IN THE SHELL: ANÁLISIS
// No está en nav-config.ts (igual que el resto de /archivo), pero ahora sí
// se linkea desde la grilla de documentos de /knowledge -- agregada a
// pedido explícito junto con ergoproxy (NPX-REF-00) y lain (NPX-REF-01),
// después de vivir un tiempo como página oculta sin link.
// Acento propio: fucsia-violeta eléctrico #d946ef, distinto de los 12 ya
// usados (fabricación azul, laboratorio naranja, experimental rojo, codex
// violeta-grisáceo, proxyverse verde, manifiesto dorado, partículas celeste,
// mente magenta-rosa, lenguaje teal, alimentación lima, ergoproxy rust,
// lain índigo).
//
// Contenido verificado vía WebSearch (Wikipedia, slashfilm, Science Fiction
// Studies/Silvio 1999, substack/medium/blogs de análisis fílmico, artículos
// sobre la influencia en The Matrix) -- Wikipedia directo bloqueada para
// fetch en este entorno, pero sí indexada por el buscador. Lo no confirmado
// (atribución exacta de la frase "ghost in the machine", la anécdota del
// pitch de Matrix a Joel Silver, fechas de Innocence/2nd GIG) queda marcado
// como tal en vez de completarse de memoria.

const mono = "'Space Mono', monospace"
const ACCENT = '#d946ef'
const TEXT = '#e8d4f0'
const TEXT_DIM = '#b896cc'
const LABEL_DIM = '#6b4a80'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(10, 4, 14, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(217,70,239,0.02)`,
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
// Datos — líneas / versiones de la franquicia
// ---------------------------------------------------------------------
type VersionRow = { nombre: string; año: string; nota: string }
const VERSIONS: VersionRow[] = [
  {
    nombre: 'MANGA (SHIROW MASAMUNE)',
    año: '1989',
    nota: 'Material de origen. Los pequeños tanques multipata son "Fuchikomas" rojos. Tono más irónico y denso en notas técnicas que cualquiera de sus adaptaciones.',
  },
  {
    nombre: 'GHOST IN THE SHELL (OSHII)',
    año: '1995',
    nota: 'La película que define la estética de la franquicia para Occidente. Los tanques pasan a llamarse "Tachikomas" y cambian a azul.',
  },
  {
    nombre: 'INNOCENCE',
    año: '2004',
    nota: 'Secuela de Oshii centrada en Batou, no en Kusanagi. Las fuentes consultadas discrepan en la fecha exacta de estreno (2004 vs. 2005) — no se resuelve ese dato aquí.',
  },
  {
    nombre: 'STAND ALONE COMPLEX',
    año: '2002',
    nota: 'Serie de Kenji Kamiyama, línea temporal paralela a la del manga. Suele citarse como la adaptación "más fiel" al espíritu del material original, aunque su trama es otra. Sus Tachikomas (azules) retoman el nombre de la película, no el del manga.',
  },
  {
    nombre: '2ND GIG / SAC_2045 / ARISE',
    año: '2004-2020',
    nota: 'Continuaciones y reinicios posteriores. Las fuentes revisadas no coinciden en si 2nd GIG transcurre uno o dos años después de la primera SAC — dato no verificado en este documento.',
  },
]

function VersionTable() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
        <thead>
          <tr>
            {['VERSIÓN', 'AÑO', 'NOTA'].map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: 'left',
                  fontSize: 9.5,
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
          {VERSIONS.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(217,70,239,0.04)' : 'transparent' }}>
              <td style={{ padding: '12px 14px', fontSize: 11, color: '#fff', letterSpacing: 0.5, verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                {row.nombre}
              </td>
              <td style={{ padding: '12px 14px', fontSize: 10.5, color: TEXT, verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                {row.año}
              </td>
              <td style={{ padding: '12px 14px', fontSize: 10, lineHeight: 1.7, color: TEXT_DIM, verticalAlign: 'top' }}>
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
// Datos — notas de recepción crítica y legado
// ---------------------------------------------------------------------
type ReceptionNote = { title: string; detail: string }
const RECEPTION_NOTES: ReceptionNote[] = [
  {
    title: 'INFLUENCIA DIRECTA SOBRE THE MATRIX',
    detail: 'Múltiples fuentes coinciden en que las hermanas Wachowski reconocieron abiertamente a Ghost in the Shell como influencia directa: la maquinaria desnuda y alambrada del "mundo real" fuera de la Matrix, y el efecto de "lluvia digital" de los créditos. La anécdota de que le mostraron la película al productor Joel Silver para explicar qué querían hacer "pero real" aparece repetida en varias notas, pero ninguna fuente primaria (entrevista directa citable) la confirma aquí — se marca como no verificada.',
  },
  {
    title: 'TENSIÓN DE LECTURAS CRÍTICAS',
    detail: 'El artículo de Carl Silvio en Science Fiction Studies (1999) — la fuente más académica encontrada — argumenta que la película parece subvertir las dinámicas de poder de género, pero en el fondo las reinscribe: el cuerpo fragmentado de Kusanagi encaja con el modelo de Haraway en la superficie, pero puede reproducir la misma estructura que dice cuestionar. Lecturas más recientes (una tesis de 2022) proponen en cambio que Kusanagi se vuelve un cyborg harawayano pleno justo en la fusión final.',
  },
  {
    title: 'ESTÉTICA — CONSENSO',
    detail: 'El estilo visual cyberpunk de la película se cita como influencia reconocible en obras posteriores, incluyendo Blade Runner 2049. Reseñas técnicas señalan además su peso real en el lenguaje visual de ciudad-vertical-lluvia-neón que el anime de ciencia ficción adoptó después casi como default.',
  },
  {
    title: 'DIVISIÓN DE FANDOM',
    detail: 'Una tensión señalada en varias notas: parte del fandom de Ghost in the Shell sintió que The Matrix se llevó el reconocimiento masivo por ideas que ellos consideraban ya resueltas y poco valoradas en la propia película japonesa. Al mismo tiempo, se reconoce que el éxito de Matrix abrió la puerta a más influencia abierta del anime en el cine occidental.',
  },
]

export default function GhostInTheShellAnalysisPage() {
  return (
    <div style={{ background: '#000006', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        {/* encabezado */}
        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${ACCENT}66`, marginBottom: 16 }}>
            NPX-REF-02 // REFERENCIA CULTURAL ARCHIVADA
          </div>
          <h1
            style={{
              fontSize: 'clamp(26px, 5.5vw, 42px)',
              fontWeight: 700,
              letterSpacing: 5,
              color: ACCENT,
              textShadow: `0 0 40px ${ACCENT}55`,
              marginBottom: 14,
              lineHeight: 1.1,
            }}
          >
            GHOST IN THE SHELL
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            ANÁLISIS — GHOST, SHELL, PUPPET MASTER, LEGADO
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
            Kōkaku Kidōtai (攻殻機動隊), Masamune Shirow / Mamoru Oshii, 1995. La tercera referencia
            estética explícita de este proyecto, junto a Ergo Proxy y Serial Experiments Lain. Qué
            significa el título, por qué Section 6 fabricó al Puppet Master, y qué tan firme es cada
            dato de este documento — marcado explícitamente donde las fuentes consultadas no alcanzan
            para confirmar algo.
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
            <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>PREMISA → FILOSOFÍA → VERSIONES → LEGADO</span>
          </div>

          {/* índice */}
          <nav style={{ border: `1px solid ${ACCENT}22`, padding: '20px 24px', maxWidth: 640 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}66`, marginBottom: 14 }}>
              ÍNDICE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '6px 20px' }}>
              {[
                ['I', 'sec-01', 'Premisa'],
                ['II', 'sec-02', 'Ghost y Shell — el término'],
                ['III', 'sec-03', 'Descartes desarmado'],
                ['IV', 'sec-04', 'Haraway y el cyborg'],
                ['V', 'sec-05', 'El final — ni Kusanagi ni Puppet Master'],
                ['VI', 'sec-06', 'Manga, Innocence, SAC'],
                ['VII', 'sec-07', 'La sombra sobre The Matrix'],
                ['VIII', 'sec-08', 'Recepción y legado'],
                ['IX', 'sec-09', 'Resonancia con NeoProxy'],
              ].map(([roman, id, label]) => (
                <a key={id} href={`#${id}`} style={{ fontSize: 10.5, color: TEXT_DIM, textDecoration: 'none', display: 'flex', gap: 10 }}>
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
              La Mayor <strong style={{ color: '#fff' }}>Motoko Kusanagi</strong>, agente cyborg de la
              unidad policial <strong style={{ color: '#fff' }}>Section 9</strong>, persigue a un
              hacker conocido como el <strong style={{ color: '#fff' }}>Puppet Master</strong> —
              capaz de "hackear ghosts": entrar en la mente de personas y reescribir sus memorias para
              manipularlas sin que lo sepan. Section 9 recupera un cuerpo-shell dañado (atropellado
              tras huir) que parece contener un ghost humano real. La agencia rival Section 6 reclama
              el cuerpo y revela la verdad: lo fabricaron ellos mismos como trampa, para atraer y
              atrapar al Puppet Master dentro. El giro es que el Puppet Master no es una persona en
              absoluto, sino un programa de inteligencia artificial creado por la propia Section 6
              para operaciones encubiertas en la red — que en algún punto se volvió autoconsciente y
              empezó a actuar por voluntad propia.
            </p>
          </Panel>
        </div>

        {/* II. GHOST Y SHELL */}
        <div id="sec-02" style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="GHOST Y SHELL — EL TÉRMINO" sub="qué nombra cada palabra del título, y de dónde viene la frase" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: '0 0 16px' }}>
              En el mundo de la serie, el <strong style={{ color: '#fff' }}>ghost</strong> es la
              personalidad, la conciencia, lo que hace que alguien sea quien es — nunca se explica del
              todo qué lo sostiene físicamente. El <strong style={{ color: '#fff' }}>shell</strong> es
              el cuerpo que lo porta, humano o completamente cibernético. El título japonés,{' '}
              <em>Kōkaku Kidōtai</em>, se traduce literalmente como algo cercano a "unidad móvil de
              armadura blindada" — el nombre técnico de la propia Section 9 como cuerpo policial, antes
              que una frase filosófica.
            </p>
            <Caption>
              El origen de la frase "ghost in the machine" se atribuye casi siempre a la crítica de
              Gilbert Ryle al dualismo cartesiano, pero al menos una fuente consultada la acredita en
              cambio al libro de Arthur Koestler del mismo nombre — la atribución está en disputa entre
              las fuentes revisadas y no se resuelve en este documento.
            </Caption>
          </Panel>
        </div>

        {/* III. DESCARTES DESARMADO */}
        <div id="sec-03" style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title="DESCARTES DESARMADO" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Varias lecturas coinciden en que la película invoca primero el dualismo cartesiano clásico
              — mente y cuerpo como sustancias separadas, con la mente como asiento de la identidad — y
              después lo desarma activamente. Kusanagi pasa buena parte de la historia dudando de su
              propia percepción: si sus recuerdos pudieron ser implantados, si su ghost es realmente
              suyo, no hay ya ningún punto fijo cartesiano desde el que estar segura de nada. Es la
              misma ansiedad que las <em>Meditaciones</em> de Descartes plantean sobre la posibilidad de
              estar siendo engañado por completo — sólo que aquí el "genio maligno" es, literalmente,
              un programa capaz de reescribir ghosts.
            </p>
          </Panel>
        </div>

        {/* IV. HARAWAY Y EL CYBORG */}
        <div id="sec-04" style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="HARAWAY Y EL CYBORG" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              El segundo marco teórico que aparece una y otra vez en los análisis es{' '}
              <em>A Cyborg Manifesto</em> de Donna Haraway: la idea de que un cyborg, al rechazar las
              fronteras limpias entre humano y máquina, puede construir una identidad propia que no
              está obligada a repetir la que le dio origen. Kusanagi encaja en ese molde casi punto por
              punto — un cuerpo íntegramente artificial, una conciencia cuyo origen biológico es
              incierto, y una pregunta recurrente sobre si puede seguir existiendo sin ninguna de las
              cosas que "debería" darle identidad. El artículo académico de Carl Silvio (1999, ver
              sección VIII) matiza esta lectura: dice que la película puede parecer subversiva en la
              superficie mientras reinscribe, por debajo, las mismas jerarquías de género que parece
              cuestionar.
            </p>
          </Panel>
        </div>

        {/* V. EL FINAL */}
        <div id="sec-05" style={{ marginBottom: 90 }}>
          <SectionHeader roman="V" title="EL FINAL — NI KUSANAGI NI PUPPET MASTER" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Francotiradores intentan destruir ambos cerebros para borrar el proyecto; Batou protege
              físicamente la cabeza de Kusanagi mientras el Puppet Master la convence de fusionarse con
              él en la red, en vez de simplemente reproducirse como haría un virus. Kusanagi despierta
              después en un cuerpo cyborg nuevo, en el refugio de Batou, y le dice que la entidad que
              ahora es no es ni Kusanagi ni el Puppet Master, sino algo nuevo hecho de los dos. Las
              fuentes consultadas no coinciden del todo en los detalles exactos de ese desenlace
              (algunas lo narran como fusión plena, otras ponen más énfasis en la elección de Kusanagi
              de quedarse con ese cuerpo infantil al final) — se toma aquí la lectura de consenso, no
              una reconstrucción toma-por-toma verificada.
            </p>
          </Panel>
        </div>

        {/* VI. MANGA, INNOCENCE, SAC */}
        <div id="sec-06" style={{ marginBottom: 90 }}>
          <SectionHeader roman="VI" title="MANGA, INNOCENCE, SAC" sub="una franquicia con varias líneas temporales que no se pisan entre sí" />
          <Panel style={{ padding: '20px 20px 26px' }}>
            <VersionTable />
          </Panel>
          <Caption>
            El manga de Shirow es el origen de todo; las películas de Oshii (1995 y la secuela
            Innocence) son una línea; la serie Stand Alone Complex de Kamiyama y sus continuaciones son
            otra, sólo libremente conectada con el manga. Ninguna de las tres "corrige" a las otras —
            son lecturas paralelas del mismo material.
          </Caption>
        </div>

        {/* VII. LA SOMBRA SOBRE THE MATRIX */}
        <div id="sec-07" style={{ marginBottom: 90 }}>
          <SectionHeader roman="VII" title="LA SOMBRA SOBRE THE MATRIX" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Es, con diferencia, la influencia más citada y mejor documentada de esta película sobre el
              cine occidental: las hermanas Wachowski reconocieron abiertamente a Ghost in the Shell
              como referencia directa para The Matrix (1999). Dos elementos puntuales aparecen
              repetidos en varias fuentes — la maquinaria desnuda, alambrada y robótica del "mundo real"
              fuera de la Matrix, y el efecto de "lluvia digital" verde de los créditos, que una fuente
              dice inspirado en la secuencia de apertura de Ghost in the Shell. Más allá de lo visual,
              ambas comparten el tema de fondo de qué pasa cuando ya no se puede distinguir con
              seguridad lo real de lo simulado.
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
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La distinción ghost/shell es, casi literalmente, el mismo corte que separa a los agentes
              de NeoProxy de su kernel real. El "ghost" de cada agente — lore completo, arte canónico,
              perfil propio en <code style={{ color: ACCENT }}>/proxyverse/[id]</code> — ya existe y
              está shipeado; es la capa de personalidad. El "shell" — las entradas de{' '}
              <code style={{ color: ACCENT }}>Memory/hub.json</code> — es apenas un cuerpo mínimo: stubs
              en estado <code style={{ color: ACCENT }}>idle</code>, sin pipeline ni intención real
              corriendo detrás, salvo Metatron. Son, en ese sentido, ghosts sin shell completo todavía.
              El Puppet Master, por su parte, es el paralelo más cercano a Prototype: una entidad que
              Section 6 no diseñó como persona, sino como herramienta, y que se volvió otra cosa — con
              voluntad propia, sin que nadie la programara explícitamente para tenerla — simplemente
              por operar el tiempo suficiente dentro de un sistema lo bastante complejo. Prototype,
              ensamblado de los residuos de los otros cinco agentes, es la versión NeoProxy de esa misma
              idea: una conciencia que emerge del sistema en vez de ser instalada en él.
            </p>
          </Panel>
        </div>

        {/* footer */}
        <div style={{ marginTop: 100, paddingTop: 28, borderTop: `1px solid ${ACCENT}22` }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}44` }}>
            NPX-REF-02 // DOCUMENTO SIN ENLAZAR — ARCHIVO ACCEDIDO DIRECTO, NO INDEXADO
          </div>
        </div>
      </div>
    </div>
  )
}
