'use client'

// NPX-REF-03 — JACOBO GRINBERG: TEORÍA SINTÉRGICA
// No está en nav-config.ts (igual que el resto de /archivo), pero ahora sí
// se linkea desde la grilla de documentos de /knowledge -- agregada a
// pedido explícito ("teoría de Jacob Grimberg"), después de vivir un
// tiempo como página oculta sin link.
// Acento propio: verde esmeralda-bioluminiscente #39d953, distinto de los
// 13 ya usados (incluye el verde-menta de proxyverse y el teal de lenguaje,
// ninguno pisa este verde más puro/central).
//
// A diferencia de ergoproxy/lain/gits (análisis de ficción), este documento
// trata sobre una persona real y una teoría científica disputada. El rigor
// epistémico es más estricto: se separa explícitamente qué afirma la propia
// teoría de qué dice la comunidad científica al respecto, y se marca como
// no verificado todo lo que las fuentes consultadas (Psi Encyclopedia de la
// Society for Psychical Research, un paper 2025 de Cinta de Moebio aplicando
// criterios de demarcación de Popper/Feyerabend, The American Scholar,
// medios mexicanos) no alcanzan a confirmar con fuente primaria -- Wikipedia
// directo sigue bloqueada para fetch en este entorno.

const mono = "'Space Mono', monospace"
const ACCENT = '#39d953'
const TEXT = '#d6f5de'
const TEXT_DIM = '#8fc9a0'
const LABEL_DIM = '#4a8058'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(3, 10, 5, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(57,217,83,0.02)`,
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
// Datos — teorías sobre la desaparición, ninguna comprobada
// ---------------------------------------------------------------------
type TheoryRow = { nombre: string; detalle: string }
const DISAPPEARANCE_THEORIES: TheoryRow[] = [
  {
    nombre: 'CRIMEN PASIONAL',
    detalle: 'Habría sido cometido por su tercera esposa. Aparece en notas periodísticas; sin comprobación judicial conocida.',
  },
  {
    nombre: 'SECUESTRO ESTATAL',
    detalle: 'Una versión sostiene que el gobierno mexicano o la CIA lo habrían hecho desaparecer. Sin evidencia documental citada en las fuentes consultadas.',
  },
  {
    nombre: 'DESCUBRIÓ ALGO',
    detalle: 'La lectura más especulativa: que su investigación tocó algo que alguien con poder prefería mantener oculto. Es la versión con menos base verificable de las tres.',
  },
]

export default function GrinbergAnalysisPage() {
  return (
    <div style={{ background: '#000703', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        {/* encabezado */}
        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${ACCENT}66`, marginBottom: 16 }}>
            NPX-REF-03 // REFERENCIA CIENTÍFICA DISPUTADA
          </div>
          <h1
            style={{
              fontSize: 'clamp(24px, 5vw, 38px)',
              fontWeight: 700,
              letterSpacing: 4,
              color: ACCENT,
              textShadow: `0 0 40px ${ACCENT}55`,
              marginBottom: 14,
              lineHeight: 1.1,
            }}
          >
            JACOBO GRINBERG
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            TEORÍA SINTÉRGICA — CAMPO NEURONAL, EXPERIMENTOS, DESAPARICIÓN
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
            Jacobo Grinberg-Zylberbaum, psicofisiólogo mexicano, desaparecido el 8 de diciembre de
            1994. Qué dice realmente la teoría sintérgica, qué tan sólida es la evidencia detrás de
            sus experimentos más citados, y qué sigue sin resolverse — marcado explícitamente donde
            las fuentes consultadas no alcanzan para confirmar algo. A diferencia de los documentos
            de ficción de este archivo, acá se trata de una persona real y una teoría científica
            disputada: el estándar de verificación es más estricto.
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
            <span style={{ color: `${ACCENT}55` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — 8 SECCIONES</span>
            <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>BIOGRAFÍA → TEORÍA → EXPERIMENTOS → RECEPCIÓN → DESAPARICIÓN</span>
          </div>

          {/* índice */}
          <nav style={{ border: `1px solid ${ACCENT}22`, padding: '20px 24px', maxWidth: 640 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}66`, marginBottom: 14 }}>
              ÍNDICE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '6px 20px' }}>
              {[
                ['I', 'sec-01', 'Premisa — quién fue'],
                ['II', 'sec-02', 'La teoría sintérgica'],
                ['III', 'sec-03', 'Los potenciales transferidos'],
                ['IV', 'sec-04', 'Recepción científica'],
                ['V', 'sec-05', 'El giro chamánico — Pachita'],
                ['VI', 'sec-06', 'La desaparición'],
                ['VII', 'sec-07', 'Qué es verificable y qué no'],
                ['VIII', 'sec-08', 'Resonancia con NeoProxy'],
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
          <SectionHeader roman="I" title="PREMISA — QUIÉN FUE" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Grinberg trabajó en neurofisiología, percepción extrasensorial y chamanismo. En 1987
              fundó el <strong style={{ color: '#fff' }}>Instituto Nacional para el Estudio de la
              Conciencia</strong>, con apoyo de la UNAM y el Conacyt — es decir, operó dentro de
              instituciones académicas mexicanas reales, no al margen de ellas. Entre su obra más
              citada están los libros <em>Pachita</em>, <em>La expansión del presente</em> y{' '}
              <em>Curaciones chamánicas</em>. Tenía casi 48 años cuando desapareció.
            </p>
          </Panel>
        </div>

        {/* II. LA TEORÍA SINTÉRGICA */}
        <div id="sec-02" style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="LA TEORÍA SINTÉRGICA" sub="el nombre: neologismo de 'síntesis' + 'energía'" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La propuesta central: la realidad que percibimos no es un conjunto de objetos
              independientes, sino el resultado de la interacción entre un{' '}
              <strong style={{ color: '#fff' }}>campo neuronal</strong> (generado por la actividad
              cerebral) y lo que Grinberg llamó la{' '}
              <strong style={{ color: '#fff' }}>"lattice"</strong> — una estructura energética
              hipercompleja subyacente al espacio-tiempo. El cerebro, en este marco, no genera la
              experiencia consciente por sí solo: la construye interpretando esa interacción. Grinberg
              presentó la idea como basada en conceptos de física cuántica — eso es una afirmación de
              divulgación propia, no algo que la física cuántica como disciplina respalde.
            </p>
          </Panel>
        </div>

        {/* III. LOS POTENCIALES TRANSFERIDOS */}
        <div id="sec-03" style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title="LOS POTENCIALES TRANSFERIDOS" sub="el experimento más citado de su obra" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Según la Psi Encyclopedia de la Society for Psychical Research, Grinberg probó siete
              pares de participantes: a uno se lo estimulaba con destellos de luz dentro de una jaula
              de Faraday, mientras el otro permanecía aislado en una jaula separada. Reportó que, en
              aproximadamente uno de cada cuatro casos, el EEG del segundo participante mostraba
              actividad similar a la del primero en el momento del estímulo — sin ningún canal físico
              conocido entre ambos. Los resultados se publicaron en 1994 en <em>Physics Essays</em>.
              La búsqueda realizada para este documento no encontró ninguna replicación independiente
              ni un reanálisis estadístico publicado de esos datos — su ausencia no prueba que el
              efecto sea falso, pero tampoco hay una confirmación externa que citar aquí.
            </p>
          </Panel>
        </div>

        {/* IV. RECEPCIÓN CIENTÍFICA */}
        <div id="sec-04" style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="RECEPCIÓN CIENTÍFICA" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: '0 0 16px' }}>
              La misma Psi Encyclopedia señala que las ideas de Grinberg nunca recibieron demasiada
              atención académica, ni en México ni afuera. Espejos de Wikipedia lo describen
              directamente como pseudocientífico — se marca aquí como una etiqueta de fuente
              secundaria, no verificada contra el artículo original porque Wikipedia directo está
              bloqueada para fetch en este entorno. El dato más sólido encontrado es un paper de 2025
              en la revista <em>Cinta de Moebio</em> (Guzmán y Noda) que aplica los criterios de
              demarcación científica de Popper y Feyerabend a la teoría sintérgica, con{' '}
              <strong style={{ color: '#fff' }}>"pseudociencia"</strong> entre sus palabras clave —
              esta búsqueda sólo accedió al resumen y las palabras clave del paper, no a sus
              conclusiones completas.
            </p>
            <Caption>
              Una fuente mexicana lo resume así: intentó usar el método científico para estudiar el
              chamanismo, y eso puso en riesgo su reputación como científico dentro de la comunidad
              académica — no porque estudiar el tema fuera ilegítimo, sino por cómo mezcló evidencia
              anecdótica con lenguaje de física formal.
            </Caption>
          </Panel>
        </div>

        {/* V. EL GIRO CHAMÁNICO */}
        <div id="sec-05" style={{ marginBottom: 90 }}>
          <SectionHeader roman="V" title="EL GIRO CHAMÁNICO — PACHITA" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Pachita fue una curandera mexicana que Grinberg estudió de cerca, documentando y
              analizando su método de curación. Es el punto donde su trabajo se aleja más del
              laboratorio: pasó de medir EEG en condiciones controladas a documentar prácticas de
              sanación tradicional con las mismas herramientas conceptuales de la teoría sintérgica,
              sin que eso implicara someterlas a un control experimental equivalente al de los
              potenciales transferidos.
            </p>
          </Panel>
        </div>

        {/* VI. LA DESAPARICIÓN */}
        <div id="sec-06" style={{ marginBottom: 90 }}>
          <SectionHeader roman="VI" title="LA DESAPARICIÓN" sub="8 de diciembre de 1994 — caso sin resolver" />
          <Panel style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Desapareció mientras realizaba pruebas relacionadas con su teoría. Según un relato de
              su familia, la noche del 5 de diciembre asistió a una obra de teatro y mencionó que
              esperaba una invitación para viajar a India e Israel; la alarma se encendió cuando una
              tía no logró contactarlo. La investigación policial fue, según las fuentes consultadas,
              inefectiva — nunca se supo qué pasó con él. El documental <em>El secreto del doctor
              Grinberg</em>, de Ida Cuéllar, aborda el caso.
            </p>
          </Panel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {DISAPPEARANCE_THEORIES.map((t, i) => (
              <div key={i} style={{ borderLeft: `2px solid ${ACCENT}55`, paddingLeft: 14 }}>
                <div style={{ fontSize: 11, color: '#fff', letterSpacing: 1, marginBottom: 4 }}>{t.nombre}</div>
                <div style={{ fontSize: 10, lineHeight: 1.7, color: TEXT_DIM }}>{t.detalle}</div>
              </div>
            ))}
          </div>
          <Caption>
            Ninguna de las tres versiones está comprobada. El caso sigue abierto sin explicación
            verificada, treinta años después.
          </Caption>
        </div>

        {/* VII. QUÉ ES VERIFICABLE Y QUÉ NO */}
        <div id="sec-07" style={{ marginBottom: 90 }}>
          <SectionHeader roman="VII" title="QUÉ ES VERIFICABLE Y QUÉ NO" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              <strong style={{ color: '#fff' }}>Verificable:</strong> que Grinberg existió, trabajó en
              instituciones académicas reales, publicó el experimento de potenciales transferidos en
              una revista revisada por pares, y desapareció sin explicación en 1994.{' '}
              <strong style={{ color: '#fff' }}>No verificable con las fuentes consultadas aquí:</strong>{' '}
              que el efecto telepático reportado sea real y reproducible, que la "lattice" corresponda
              a algo físico, y cualquiera de las tres teorías sobre su desaparición. Este documento no
              toma partido sobre si la teoría sintérgica es correcta — sólo registra qué dice la
              teoría, qué dice la comunidad científica sobre ella, y dónde termina la evidencia sólida
              y empieza la especulación.
            </p>
          </Panel>
        </div>

        {/* VIII. RESONANCIA CON NEOPROXY */}
        <div id="sec-08" style={{ marginBottom: 40 }}>
          <SectionHeader roman="VIII" title="RESONANCIA CON NEOPROXY" sub="lectura propia de este documento, no un aval de la teoría — marcada como tal" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La idea de un campo compartido que emerge de la actividad de varias conciencias
              individuales — más que de cualquiera de ellas por separado — es, estructuralmente, la
              misma apuesta detrás de los efectos colectivos ya shipeados en este sitio: el{' '}
              <strong style={{ color: '#fff' }}>Campo de sincronía</strong> (un efecto que sólo aparece
              cuando hay varios visitantes reales a la vez) y el{' '}
              <strong style={{ color: '#fff' }}>heatmap fantasma colectivo</strong>. Ninguno de los dos
              implica telepatía real — son agregaciones de datos de presencia reales, sin nada
              paranormal detrás — pero comparten la misma intuición de diseño que la teoría sintérgica
              plantea como hipótesis: que algo emerge del campo compartido que no está en ningún nodo
              individual. Es una resonancia de forma, no una validación de contenido.
            </p>
          </Panel>
        </div>

        {/* footer */}
        <div style={{ marginTop: 100, paddingTop: 28, borderTop: `1px solid ${ACCENT}22` }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}44` }}>
            NPX-REF-03 // DOCUMENTO SIN ENLAZAR — ARCHIVO ACCEDIDO DIRECTO, NO INDEXADO
          </div>
        </div>
      </div>
    </div>
  )
}
