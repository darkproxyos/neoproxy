'use client'

// NPX-REF-04 — JEAN-PIERRE GARNIER MALET: TEORÍA DEL DESDOBLAMIENTO DEL TIEMPO
// Ruta oculta: no se linkea desde ningún lado del sitio (ni nav-config.ts,
// ni Codex Cogito, ni ninguna otra página) ni tiene un link de vuelta en
// sí misma -- mismo tratamiento "sin enlazar" que el resto de /archivo
// (ergoproxy NPX-REF-00, lain NPX-REF-01, gits NPX-REF-02, grinberg
// NPX-REF-03).
// Acento propio: magenta-violeta profundo #b31ba3, distinto de los 14 ya
// usados -- más oscuro y más saturado que el fucsia de gits y el rosa de
// mente, para no leerse como el mismo color en pantalla.
//
// Igual que la página de Grinberg: persona real, teoría física disputada.
// Estándar de verificación estricto -- se separa explícitamente qué afirma
// la teoría de qué dice (o no dice) la comunidad de física al respecto. La
// búsqueda realizada no encontró ninguna fuente que confirmara de forma
// independiente las credenciales institucionales que se le atribuyen a
// Garnier Malet (CNES) ni el supuesto aval del American Institute of
// Physics -- ambos quedan marcados como no verificados, no como falsos ni
// como ciertos.

const mono = "'Space Mono', monospace"
const ACCENT = '#b31ba3'
const TEXT = '#f0d6ec'
const TEXT_DIM = '#c88fbc'
const LABEL_DIM = '#80447a'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(10, 3, 9, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(179,27,163,0.02)`,
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

export default function GarnierMaletAnalysisPage() {
  return (
    <div style={{ background: '#060004', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        {/* encabezado */}
        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${ACCENT}66`, marginBottom: 16 }}>
            NPX-REF-04 // REFERENCIA CIENTÍFICA DISPUTADA
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
            JEAN-PIERRE GARNIER MALET
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            TEORÍA DEL DESDOBLAMIENTO DEL TIEMPO
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
            Qué afirma exactamente la teoría del "doble" y el tiempo desdoblado, qué de eso tiene
            respaldo verificable, y qué queda en el terreno de la divulgación sin fuente primaria —
            marcado explícitamente donde las fuentes consultadas no alcanzan para confirmar algo. Como
            el documento sobre Jacobo Grinberg, trata sobre una persona real y una afirmación física
            disputada: el estándar de verificación es el mismo, estricto.
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
            <span style={{ color: `${ACCENT}55` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>REFERENCIA CIENTÍFICA DISPUTADA — NO CANON NEOPROXY</span>
            <span style={{ color: `${ACCENT}55` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — 7 SECCIONES</span>
            <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>PREMISA → TESIS → VALIDACIÓN → RECEPCIÓN</span>
          </div>

          {/* índice */}
          <nav style={{ border: `1px solid ${ACCENT}22`, padding: '20px 24px', maxWidth: 640 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}66`, marginBottom: 14 }}>
              ÍNDICE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '6px 20px' }}>
              {[
                ['I', 'sec-01', 'Premisa — quién dice ser'],
                ['II', 'sec-02', 'La tesis central'],
                ['III', 'sec-03', 'El "doble" y el sueño'],
                ['IV', 'sec-04', 'Afirmaciones de validación'],
                ['V', 'sec-05', 'Recepción de la física'],
                ['VI', 'sec-06', 'Qué es verificable y qué no'],
                ['VII', 'sec-07', 'Resonancia con NeoProxy'],
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
          <SectionHeader roman="I" title="PREMISA — QUIÉN DICE SER" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Las fuentes de divulgación presentan a Jean-Pierre Garnier Malet como doctor en Física,
              especialista en mecánica de fluidos, y autor de la{' '}
              <strong style={{ color: '#fff' }}>teoría del desdoblamiento del tiempo</strong>,
              formulada hacia 1988. La búsqueda hecha para este documento no encontró ninguna fuente
              independiente que confirmara una afiliación institucional concreta (se buscó
              específicamente una conexión con el CNES francés) ni un perfil de publicaciones
              verificable a su nombre en bases académicas — ese dato se deja marcado como no
              verificado, ni confirmado ni descartado.
            </p>
          </Panel>
        </div>

        {/* II. LA TESIS CENTRAL */}
        <div id="sec-02" style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="LA TESIS CENTRAL" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La teoría sostiene que el tiempo se "desdobla", y que el ser humano se desdobla con él:
              viviríamos simultáneamente un segundo en un{' '}
              <strong style={{ color: '#fff' }}>tiempo consciente</strong> y miles de millones de
              segundos en otro tiempo imperceptible, paralelo. En ese tiempo paralelo existiría un{' '}
              <strong style={{ color: '#fff' }}>"doble"</strong> — no una metáfora, sino, según la
              propia teoría, otro "yo" real, que explora distintas variantes de la misma situación
              antes de que la versión consciente la viva.
            </p>
          </Panel>
        </div>

        {/* III. EL DOBLE Y EL SUEÑO */}
        <div id="sec-03" style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title={'EL "DOBLE" Y EL SUEÑO'} />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Según la teoría, la información se intercambia entre ambos tiempos a través de
              "aperturas" — y ese intercambio sería más intenso durante la fase{' '}
              <strong style={{ color: '#fff' }}>REM</strong> del sueño. Es el mecanismo que la
              divulgación popular usa para explicar corazonadas, premoniciones o la sensación de
              "ya haber vivido esto": serían, en este marco, información enviada de vuelta por el
              doble desde su propio futuro relativo.
            </p>
          </Panel>
        </div>

        {/* IV. AFIRMACIONES DE VALIDACIÓN */}
        <div id="sec-04" style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="AFIRMACIONES DE VALIDACIÓN" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Material promocional alrededor de la teoría afirma que el desdoblamiento del tiempo "ha
              sido probado científicamente", y al menos un sitio de divulgación sostiene que fue
              avalada por el <strong style={{ color: '#fff' }}>American Institute of Physics</strong>{' '}
              de Nueva York. Ninguna de las fuentes revisadas para este documento aporta una
              publicación revisada por pares ni una fuente primaria que sostenga esa afirmación — se
              deja marcada explícitamente como no confirmada, no como falsa.
            </p>
          </Panel>
        </div>

        {/* V. RECEPCIÓN DE LA FÍSICA */}
        <div id="sec-05" style={{ marginBottom: 90 }}>
          <SectionHeader roman="V" title="RECEPCIÓN DE LA FÍSICA" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Las notas periodísticas revisadas reconocen que la teoría genera controversia, pero no
              citan ninguna réplica, refutación o evaluación formal publicada por una institución de
              física. Que la comunidad de física no la trate como ciencia establecida no requiere cita
              adicional: ninguna de las fuentes de divulgación consultadas presenta evidencia de que
              la teoría circule, se discuta o se cite dentro de la literatura de física revisada por
              pares — su presencia pública está casi enteramente en medios de divulgación, canales de
              YouTube y literatura de autoayuda, no en revistas científicas.
            </p>
          </Panel>
        </div>

        {/* VI. QUÉ ES VERIFICABLE Y QUÉ NO */}
        <div id="sec-06" style={{ marginBottom: 90 }}>
          <SectionHeader roman="VI" title="QUÉ ES VERIFICABLE Y QUÉ NO" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              <strong style={{ color: '#fff' }}>Verificable:</strong> que Garnier Malet existe, que
              publica y da conferencias sobre esta teoría desde fines de los 80, y que tiene una
              audiencia real en el mundo hispanohablante. <strong style={{ color: '#fff' }}>No
              verificable con las fuentes consultadas aquí:</strong> cualquier afiliación
              institucional concreta, el supuesto aval del American Institute of Physics, y, sobre
              todo, la tesis física central — que el tiempo se desdobla y que existe un "doble"
              real intercambiando información con la conciencia despierta. Este documento no toma
              partido sobre si la teoría es correcta; registra qué afirma, qué tan respaldado está
              cada punto, y dónde termina la evidencia citable y empieza la promoción.
            </p>
          </Panel>
        </div>

        {/* VII. RESONANCIA CON NEOPROXY */}
        <div id="sec-07" style={{ marginBottom: 40 }}>
          <SectionHeader roman="VII" title="RESONANCIA CON NEOPROXY" sub="lectura propia de este documento, no un aval de la teoría — marcada como tal" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La imagen de dos tiempos simultáneos que se intercambian información a través de
              "aperturas" tiene un paralelo estructural directo en una función ya shipeada del sitio:
              el <strong style={{ color: '#fff' }}>eco de sesión anterior en AgentChannel</strong>,
              donde una sesión actual de un agente puede traer de vuelta un fragmento de una sesión
              pasada — información cruzando entre dos momentos que normalmente estarían separados. No
              hay nada físicamente desdoblado ahí: es persistencia de datos entre ejecuciones, leída
              con una metáfora narrativa. Pero es la misma clase de gesto que este sitio ya usa en
              otros lugares (el generador de sigilos, Voluntad Verdadera): tomar una estructura con
              peso simbólico fuerte y usarla como forma, sin que eso implique tratarla como física
              verificada.
            </p>
          </Panel>
        </div>

        {/* footer */}
        <div style={{ marginTop: 100, paddingTop: 28, borderTop: `1px solid ${ACCENT}22` }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}44` }}>
            NPX-REF-04 // DOCUMENTO SIN ENLAZAR — ARCHIVO ACCEDIDO DIRECTO, NO INDEXADO
          </div>
        </div>
      </div>
    </div>
  )
}
