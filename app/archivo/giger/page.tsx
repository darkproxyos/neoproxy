'use client'

// NPX-REF-05 — GIGER: ANÁLISIS
// CLAUDE.md describe la estética del proyecto como "Ghost in the Shell,
// Ergo Proxy, Serial Experiments Lain, Giger" -- los primeros tres ya
// tenían su documento de análisis (/archivo/gits, /archivo/ergoproxy,
// /archivo/lain). Giger era el único de los cuatro pilares nombrados
// explícitamente sin el suyo propio. 'giger' ya es una entrada real de
// components/knowledge/entries.ts (cluster 'estetica') -- se enlaza
// desde la sección I y la IX, no se reescribe esa entrada.
// Acento propio: hueso/ceniza apagado #8a8176 -- el único tono neutro
// desaturado de todo el Codex, a propósito: la paleta real de Giger es
// cromo, hueso y negro, no un color de neón más.

import { useEffect, useState } from 'react'
import Link from 'next/link'

const mono = "'Space Mono', monospace"
const ACCENT = '#8a8176'
const TEXT = '#e4ddd2'
const TEXT_DIM = '#b8ad9e'
const LABEL_DIM = '#766c5e'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(10, 9, 7, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(138,129,118,0.04)`,
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
  ['I', 'sec-01', 'Quién fue Giger'],
  ['II', 'sec-02', 'El biomecanoide — la fusión sin costura'],
  ['III', 'sec-03', 'Necronomicón (1977) — el libro que llegó a Hollywood'],
  ['IV', 'sec-04', 'El Dune que nunca se filmó — Jodorowsky, 1975'],
  ['V', 'sec-05', 'Alien (1979) — el diseño que ganó un Oscar'],
  ['VI', 'sec-06', 'Influencias reales — de Dalí a una farmacia familiar'],
  ['VII', 'sec-07', 'Más allá del xenomorfo'],
  ['VIII', 'sec-08', 'Recepción y legado'],
  ['IX', 'sec-09', 'Resonancia con NeoProxy'],
]

export default function GigerPage() {
  const [visible, setVisible] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.gig-section'))
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
    <div style={{ background: '#080706', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        <Link href="/knowledge" className="press tap-ext" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${ACCENT}aa`, textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← VOLVER AL CODEX
        </Link>

        {/* encabezado */}
        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${ACCENT}66`, marginBottom: 16 }}>
            NPX-REF-05 // ANÁLISIS CULTURAL
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
            GIGER
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            LA ESTÉTICA BIOMECÁNICA — EL CUARTO PILAR VISUAL DE NEOPROXY, SIN DOCUMENTO PROPIO HASTA AHORA
          </div>
          <p
            style={{
              fontSize: 11.5, lineHeight: 2.1, letterSpacing: 0.3, color: TEXT_DIM, maxWidth: 660,
              borderLeft: `1px solid ${ACCENT}33`, paddingLeft: 24, marginBottom: 32,
            }}
          >
            CLAUDE.md, el propio archivo de instrucciones de este repositorio, nombra la estética de
            NeoProxy como <em>"Ghost in the Shell, Ergo Proxy, Serial Experiments Lain, Giger"</em>.
            Los primeros tres ya tenían su análisis en este Codex. Hans Ruedi Giger —el único nombre
            propio de esa lista, no un título de serie— nunca tuvo el suyo. Esto lo cierra: biografía,
            técnica, las dos producciones que lo formaron antes de Alien, el diseño que le ganó un
            Oscar, y lo que de su vocabulario visual ya está, de hecho, en el canon real del sitio.
          </p>

          <div
            style={{
              display: 'inline-grid', gridTemplateColumns: 'auto auto', gap: '4px 24px', fontSize: 9,
              letterSpacing: 1, color: `${ACCENT}99`, border: `1px solid ${ACCENT}33`, padding: '12px 18px',
              marginBottom: 32,
            }}
          >
            <span style={{ color: `${ACCENT}55` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>REFERENCIA CULTURAL — NO CANON NEOPROXY</span>
            <span style={{ color: `${ACCENT}55` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — 9 SECCIONES</span>
            <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>BIOGRAFÍA → TÉCNICA → PRODUCCIÓN → LEGADO → RESONANCIA</span>
          </div>

          <nav style={{ border: `1px solid ${ACCENT}22`, padding: '20px 24px', maxWidth: 680 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}66`, marginBottom: 14 }}>
              ÍNDICE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '6px 20px' }}>
              {TOC.map(([roman, id, label]) => (
                <a key={id} href={`#${id}`} style={{ fontSize: 10.5, color: TEXT_DIM, textDecoration: 'none', display: 'flex', gap: 10, padding: '7px 0' }}>
                  <span style={{ color: `${ACCENT}88`, width: 28, flexShrink: 0 }}>{roman}</span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </nav>
        </div>

        {/* I. QUIEN FUE GIGER */}
        <div id="sec-01" className={`gig-section ${visible['sec-01'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="I" title="QUIÉN FUE GIGER" sub="Hans Ruedi Giger, Suiza, 1940–2014" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Hans Ruedi Giger nació en 1940 en Coira (Chur), capital del cantón de los Grisones, en
              Suiza, y murió en Zúrich en 2014. Su padre era farmacéutico, dueño de una farmacia familiar
              donde Giger pasó buena parte de su infancia rodeado de frascos de vidrio, instrumental
              médico y láminas de anatomía — una exposición temprana a la estética clínica que después se
              reconoce con claridad en su obra adulta: cuerpos abiertos, tejido expuesto, superficies que
              parecen preservadas más que vivas.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Estudió diseño industrial y arquitectura en la{' '}
              <strong style={{ color: '#fff' }}>Schule für Gestaltung</strong> (Escuela de Diseño) de
              Zúrich, pero su técnica central como pintor —el <strong style={{ color: '#fff' }}>
              aerógrafo</strong> sobre óleo— la desarrolló de forma mayormente autodidacta, fuera de un
              programa formal de bellas artes. Esa combinación —formación técnica/industrial más una
              práctica pictórica autoenseñada— explica buena parte de por qué su obra lee simultáneamente
              como ingeniería y como pintura de carne, sin que ninguna de las dos lecturas se imponga
              sobre la otra.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Ya es, además, una entrada real de este Codex:{' '}
              <Link href="/knowledge?entry=giger" style={{ color: '#fff', textDecoration: 'underline' }}>
                H. R. Giger
              </Link>{' '}
              figura en el cluster ESTÉTICA de <em>components/knowledge/entries.ts</em> desde antes de
              que existiera este documento — este análisis no reemplaza esa entrada corta, la extiende.
            </p>
          </Panel>
        </div>

        {/* II. BIOMECANOIDE */}
        <div id="sec-02" className={`gig-section ${visible['sec-02'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="EL BIOMECANOIDE — LA FUSIÓN SIN COSTURA" sub="su concepto propio, no una etiqueta puesta después por la crítica" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Giger llamó <strong style={{ color: '#fff' }}>"biomecanoide"</strong> a su propio vocabulario
              visual: no una máquina con partes de cuerpo pegadas encima, ni un cuerpo con cables de
              adorno — un tejido único donde la pregunta "¿esto es orgánico o es industrial?" deja de
              tener respuesta posible, porque los dos términos ya se fusionaron en un solo material. No es
              un robot disfrazado de monstruo ni un monstruo con tornillos: es una sola sustancia que el
              ojo humano insiste en querer separar en dos categorías, sin lograrlo nunca del todo.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              La técnica es inseparable del concepto. El <strong style={{ color: '#fff' }}>aerógrafo</strong>{' '}
              —una pistola que pulveriza pintura en una niebla continua, sin la pincelada discreta de un
              pincel— es lo que permite el degradado sin borde entre una superficie de hueso y una de
              metal pulido, entre un tendón y un cable, entre piel y placa blindada. Si Giger hubiera
              trabajado con líneas duras y contornos cerrados (la vía más habitual del diseño de
              criaturas de ciencia ficción de su época), la fusión se habría leído como un collage de dos
              materiales distintos puestos uno junto al otro. El aerógrafo elimina esa costura: no hay
              borde que marque dónde termina lo vivo y empieza lo construido.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Su paleta, además, es deliberadamente limitada: grises de cromo pulido, negros profundos,
              blancos de hueso, y apenas algún acento de rosa u ocre orgánico — nunca el color saturado
              que domina buena parte del diseño de criaturas de cine comercial. Esa restricción de paleta
              es, en sí misma, parte del efecto: una criatura sin color vivo se lee como algo que nunca
              estuvo del todo vivo en el sentido cálido y familiar de la palabra, aunque respire, sangre o
              se reproduzca.
            </p>
          </Panel>
        </div>

        {/* III. NECRONOMICON */}
        <div id="sec-03" className={`gig-section ${visible['sec-03'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title="NECRONOMICÓN (1977)" sub="el libro que llegó a Hollywood antes que el propio Giger" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              En 1977, Giger publicó <em>HR Giger's Necronomicon</em>, una recopilación a gran formato de
              buena parte de su obra temprana en pintura y escultura — el título toma prestado el nombre
              del libro ficticio de H. P. Lovecraft, sin pretender ser una ilustración literal de esa
              mitología, más bien una declaración de intenciones sobre el tono: un libro de horror
              cósmico, erótico y mecánico a la vez.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Ese libro —no un book de presentación hecho para la ocasión, sino la obra ya existente de
              Giger reunida en un volumen— es, según relatos documentados de la producción de{' '}
              <em>Alien</em>, lo que puso sus imágenes en manos de <strong style={{ color: '#fff' }}>Dan
              O'Bannon</strong>, guionista de la película, quien se lo mostró al director{' '}
              <strong style={{ color: '#fff' }}>Ridley Scott</strong> antes de que se decidiera contratar
              a Giger para diseñar la criatura. En otras palabras: Giger no entró al proyecto por un
              casting de diseñadores de efectos especiales — entró porque su libro ya circulaba entre
              gente de cine que buscaba exactamente ese tono y no sabía todavía que tenía nombre y autor.
            </p>
          </Panel>
        </div>

        {/* IV. DUNE JODOROWSKY */}
        <div id="sec-04" className={`gig-section ${visible['sec-04'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="EL DUNE QUE NUNCA SE FILMÓ" sub="Alejandro Jodorowsky, 1975 — antes de Alien, no después" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Antes de <em>Alien</em>, Giger ya era parte de un proyecto que terminó sin filmarse:{' '}
              <strong style={{ color: '#fff' }}>Dune</strong>, la adaptación que el director chileno{' '}
              <strong style={{ color: '#fff' }}>Alejandro Jodorowsky</strong> intentó armar en 1975, con un
              equipo que incluía también a Moebius (Jean Giraud) en diseño de personajes y storyboard, y
              a H. R. Giger específicamente encargado del diseño visual del planeta y la casa{' '}
              <strong style={{ color: '#fff' }}>Harkonnen</strong> — los antagonistas de la novela de
              Frank Herbert, cuya estética industrial y corrupta encajaba de forma natural con su
              vocabulario biomecánico.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La película nunca se filmó — el financiamiento colapsó antes de empezar el rodaje — pero el
              proyecto no desapareció sin dejar rastro: buena parte del mismo equipo creativo (incluido
              Giger) terminó, años después, trabajando en otras producciones de ciencia ficción de la
              época, entre ellas <em>Alien</em>. Este recorrido está documentado con detalle en el
              documental <em>Jodorowsky's Dune</em> (2013), que reconstruye el proyecto completo a partir
              de entrevistas con los sobrevivientes del equipo original, incluido el propio Giger.
            </p>
          </Panel>
        </div>

        {/* V. ALIEN */}
        <div id="sec-05" className={`gig-section ${visible['sec-05'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="V" title="ALIEN (1979)" sub="el diseño que le ganó un Oscar" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              En <em>Alien</em> (dirigida por Ridley Scott, 1979), Giger diseñó tres piezas centrales del
              universo visual de la película: el <strong style={{ color: '#fff' }}>xenomorfo</strong>{' '}
              (la criatura adulta), el <strong style={{ color: '#fff' }}>"Space Jockey"</strong> (el
              piloto alienígena fosilizado que encuentra la tripulación, hoy conocido en el canon
              expandido de la franquicia como un "Ingeniero"), y el diseño interior de la{' '}
              <strong style={{ color: '#fff' }}>nave derelict</strong> donde se encuentra ese piloto — un
              espacio orgánico, costillar, que no se lee como una nave construida sino como el interior de
              un cuerpo. Ese trabajo le ganó a Giger el <strong style={{ color: '#fff' }}>Oscar a Mejores
              Efectos Visuales de 1980</strong>, compartido con el resto del equipo de efectos de la
              película — un reconocimiento verificable, no una leyenda de fan.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              El diseño del ciclo de vida del xenomorfo —huevo, luego el <em>facehugger</em> que implanta
              un embrión en un huésped vivo, luego el <em>chestburster</em> que emerge desde adentro del
              cuerpo del huésped, y finalmente el adulto bípedo con cola y cabeza alargada sin ojos
              visibles— no es una secuencia de monstruos sueltos: es una pieza de diseño biológico
              coherente de principio a fin, cada etapa derivada visualmente de la anterior, como si fuera
              una especie real con una anatomía reproductiva propia y consistente.
            </p>
            <Caption>
              El propio Giger fue explícito y reiterado en entrevistas sobre la carga sexual deliberada
              del diseño: formas que evocan genitales masculinos y femeninos conviven a propósito en la
              misma criatura (la cabeza alargada del xenomorfo, la boca interior que se proyecta hacia
              adelante, la forma del facehugger). No es una lectura impuesta después por la crítica —es
              una intención declarada por el propio autor, parte central de por qué el diseño genera el
              nivel de horror corporal que genera.
            </Caption>
          </Panel>
        </div>

        {/* VI. INFLUENCIAS */}
        <div id="sec-06" className={`gig-section ${visible['sec-06'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VI" title="INFLUENCIAS REALES" sub="de Dalí a una farmacia en Coira" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Giger reconoció abiertamente la influencia del surrealismo, en particular de{' '}
              <strong style={{ color: '#fff' }}>Salvador Dalí</strong> — las formas que se derriten o
              mutan en otra cosa sin perder coherencia visual, y la convivencia de lo erótico con lo
              perturbador en una misma imagen, son recursos que comparte con el surrealismo español sin
              ser una copia de su estilo.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Más cercano en el tiempo y el lugar: Giger tuvo vínculo directo con{' '}
              <strong style={{ color: '#fff' }}>Ernst Fuchs</strong> y el movimiento conocido como{' '}
              <strong style={{ color: '#fff' }}>Wiener Schule des Phantastischen Realismus</strong>{' '}
              (Escuela Fantástica de Viena), un grupo de pintores centroeuropeos de posguerra que
              combinaba técnica pictórica clásica, de capas finas al óleo, con imaginería onírica y
              simbólica — una tradición que le dio a Giger parte de su disciplina técnica, distinta de la
              ilustración comercial de ciencia ficción de su época.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Pero la influencia más citada por el propio Giger en entrevistas no viene del mundo del
              arte: su infancia en la farmacia de su padre, rodeado de frascos, instrumental quirúrgico y
              láminas de anatomía, lo expuso desde chico a una estética médica que después reaparece,
              transformada, en sus superficies — cuerpos abiertos, tejido expuesto, un aire de preservación
              clínica más que de vida espontánea.
            </p>
          </Panel>
        </div>

        {/* VII. MAS ALLA DEL XENOMORFO */}
        <div id="sec-07" className={`gig-section ${visible['sec-07'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VII" title="MÁS ALLÁ DEL XENOMORFO" sub="bares, discos y su regreso al cine" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Giger diseñó espacios físicos reales y visitables con su mismo vocabulario biomecánico: los{' '}
              <strong style={{ color: '#fff' }}>Giger Bar</strong>, bares temáticos con columnas y
              mobiliario que replican huesos y estructuras orgánico-mecánicas a escala arquitectónica,
              instalados en Núremberg (Alemania) y en Gruyères (Suiza) — este último todavía en
              funcionamiento junto al museo que se menciona en la sección siguiente.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              En música, diseñó la portada del álbum <em>Koo Koo</em> (1981) de{' '}
              <strong style={{ color: '#fff' }}>Debbie Harry</strong> (de Blondie) — una imagen con agujas
              clavadas en el rostro de la cantante, deliberadamente perturbadora— y trabajó con las bandas
              de metal <strong style={{ color: '#fff' }}>Celtic Frost</strong> y{' '}
              <strong style={{ color: '#fff' }}>Danzig</strong>, cuya estética oscura y ritual encajaba de
              forma natural con su repertorio visual.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Volvió al cine de ciencia ficción con diseños para <em>Alien 3</em> (1992, retomando y
              reinterpretando al xenomorfo que él mismo había originado) y para{' '}
              <em>Species</em> (1995), donde diseñó a Sil, la criatura humanoide-alienígena protagonista —
              otra variación sobre el mismo problema central de toda su obra: un cuerpo que no termina de
              decidir si es humano, animal o máquina.
            </p>
          </Panel>
        </div>

        {/* VIII. RECEPCION Y LEGADO */}
        <div id="sec-08" className={`gig-section ${visible['sec-08'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VIII" title="RECEPCIÓN Y LEGADO" sub="un museo real, y una influencia que hay que nombrar con cuidado" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              El <strong style={{ color: '#fff' }}>Museo HR Giger</strong> abrió en 1998 en el{' '}
              <strong style={{ color: '#fff' }}>Château St. Germain</strong>, en Gruyères, Suiza — un
              museo real que existe hoy, se puede visitar, y exhibe pinturas, esculturas y mobiliario
              original del artista, además del Giger Bar contiguo mencionado en la sección anterior. No es
              un archivo digital ni una colección dispersa: es un edificio físico dedicado enteramente a
              su obra, en el pueblo suizo donde vivió buena parte de su vida adulta.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Su influencia visual sobre el <strong style={{ color: '#fff' }}>body horror</strong> y el
              diseño biopunk posterior en cine, videojuegos e ilustración es evidente a simple vista en
              décadas de obra de otros creadores.
            </p>
            <Caption>
              Una precisión necesaria: la obra de Giger es contemporánea a la de{' '}
              <strong style={{ color: '#fff' }}>David Cronenberg</strong> en cine (ambos activos y
              desarrollando su vocabulario de horror corporal desde los años 70), y comparten territorio
              temático — pero no hay una línea documentada de influencia directa confirmada en un sentido
              o en el otro entre ambos. Tratarlos como "maestro y discípulo" sería inventar una causalidad
              que las fuentes no confirman; lo correcto es describirlos como dos recorridos paralelos
              sobre un mismo territorio, no uno derivado del otro.
            </Caption>
          </Panel>
        </div>

        {/* IX. RESONANCIA */}
        <div id="sec-09" className={`gig-section ${visible['sec-09'] ? 'is-visible' : ''}`} style={{ marginBottom: 0 }}>
          <SectionHeader roman="IX" title="RESONANCIA CON NEOPROXY" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Este documento cierra un vacío real, no decorativo: de los cuatro pilares estéticos que
              CLAUDE.md nombra explícitamente para describir el proyecto, Giger era el único sin su
              propio análisis en el Codex, mientras que Ghost in the Shell, Ergo Proxy y Serial
              Experiments Lain ya lo tenían.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              El canon real del sitio ya muestra parte de ese vocabulario, de forma honesta y no total: el
              retrato de{' '}
              <Link href="/proxyverse/d" style={{ color: '#fff', textDecoration: 'underline' }}>D</Link>
              {' '}(<em>public/canon/d-v1.jpg</em>) combina una carapace roja-púrpura con costillas
              exoesqueléticas y tendones orgánicos tejidos directamente en la armadura — el mismo problema
              visual de Giger, cuerpo y estructura sin frontera clara entre ambos, aunque resuelto con otra
              paleta (neón saturado, no el cromo y hueso desaturado de Giger) y otra técnica (ilustración
              digital de línea marcada, no el degradado continuo de aerógrafo). Es un parentesco de
              vocabulario, no una copia de estilo — y ese parentesco parcial, declarado así, es más preciso
              que inflarlo a una influencia directa que esta página no puede confirmar sección por sección
              de cada pieza de arte canónica del sitio.
            </p>
          </Panel>
        </div>

        {/* footer */}
        <div style={{ marginTop: 100, paddingTop: 28, borderTop: `1px solid ${ACCENT}22` }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}44` }}>
            NPX-REF-05 // ANÁLISIS CULTURAL DEL CODEX
          </div>
        </div>
      </div>

      <style>{`
        .gig-section { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .gig-section.is-visible { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .gig-section { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
