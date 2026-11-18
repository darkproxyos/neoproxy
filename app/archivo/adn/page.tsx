'use client'

// NPX-ARC-15 — ADN
// Pedido explícito: extenso, riguroso, detallista, estilo NeoProxy. Mismo
// estándar que el resto de /archivo: el crédito real y contestado de
// Rosalind Franklin en el descubrimiento de la estructura (sección I) se
// trata como hecho histórico documentado, no como anécdota de relleno; el
// debate todavía abierto sobre cuánto del genoma no codificante es
// funcional (sección VIII) se marca como abierto, no como resuelto.
// Acento propio: coral/salmón #ff8577, distinto de los 25 ya usados en el
// resto del Codex (ni el rojo vivo de Autoorganización #e63946, ni el rosa
// magenta de Mente #ff4fa3, ni el naranja de Metacognición #ff7a3d).

import { useEffect, useState } from 'react'
import Link from 'next/link'

const mono = "'Space Mono', monospace"
const ACCENT = '#ff8577'
const TEXT = '#f7e2de'
const TEXT_DIM = '#cfa8a0'
const LABEL_DIM = '#8a5a52'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(14, 4, 2, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(255,133,119,0.03)`,
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
  ['I', 'sec-01', 'El descubrimiento de la estructura — y el crédito que tardó'],
  ['II', 'sec-02', 'Estructura química — la doble hélice en detalle'],
  ['III', 'sec-03', 'El código genético — codones y universalidad'],
  ['IV', 'sec-04', 'Replicación — semiconservativa, confirmada en 1958'],
  ['V', 'sec-05', 'Del ADN a la proteína — el dogma central'],
  ['VI', 'sec-06', 'El Proyecto Genoma Humano — de 2003 a 2022'],
  ['VII', 'sec-07', 'CRISPR — de defensa bacteriana a terapia aprobada'],
  ['VIII', 'sec-08', 'ADN no codificante y epigenética — el debate abierto'],
  ['IX', 'sec-09', 'ADN como información'],
  ['X', 'sec-10', 'Resonancia con NeoProxy'],
]

export default function AdnPage() {
  const [visible, setVisible] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.adn-section'))
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
    <div style={{ background: '#070202', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        <Link href="/knowledge" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${ACCENT}aa`, textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← VOLVER AL CODEX
        </Link>

        {/* encabezado */}
        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${ACCENT}66`, marginBottom: 16 }}>
            NPX-ARC-15 // REFERENCIA TÉCNICA
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
            ADN
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            LA MOLÉCULA, EL CÓDIGO, Y EL CRÉDITO QUE TARDÓ DÉCADAS EN REPARTIRSE BIEN
          </div>
          <p
            style={{
              fontSize: 11.5, lineHeight: 2.1, letterSpacing: 0.3, color: TEXT_DIM, maxWidth: 660,
              borderLeft: `1px solid ${ACCENT}33`, paddingLeft: 24, marginBottom: 32,
            }}
          >
            De la doble hélice a CRISPR, con el mismo cuidado que el resto del Codex: lo que está
            matemáticamente cerrado (la complementariedad de bases, el mecanismo de replicación)
            tratado distinto de lo que sigue en debate activo dentro de la propia genética (cuánto
            del genoma no codificante es, de verdad, funcional).
          </p>

          <div
            style={{
              display: 'inline-grid', gridTemplateColumns: 'auto auto', gap: '4px 24px', fontSize: 9,
              letterSpacing: 1, color: `${ACCENT}99`, border: `1px solid ${ACCENT}33`, padding: '12px 18px',
              marginBottom: 32,
            }}
          >
            <span style={{ color: `${ACCENT}55` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>BIOLOGÍA MOLECULAR, GENÉTICA — REFERENCIA TÉCNICA</span>
            <span style={{ color: `${ACCENT}55` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — 10 SECCIONES</span>
            <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>ESTRUCTURA → CÓDIGO → REPLICACIÓN → GENOMA → EDICIÓN → INFORMACIÓN</span>
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

        {/* I. DESCUBRIMIENTO */}
        <div id="sec-01" className={`adn-section ${visible['sec-01'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="I" title="EL DESCUBRIMIENTO DE LA ESTRUCTURA" sub="Nature, 1953 — y el crédito que tardó décadas en repartirse bien" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              James Watson y Francis Crick publicaron el modelo de la doble hélice en <em>Nature</em> en
              1953, en un paper de apenas una página que terminaba con una de las frases más
              deliberadamente subestimadas de la historia de la ciencia: "no se nos ha escapado que el
              apareamiento específico que postulamos sugiere inmediatamente un posible mecanismo de copia
              para el material genético". No llegaron ahí solos ni desde cero.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Rosalind Franklin, trabajando en el King's College de Londres, produjo los datos de
              difracción de rayos X más decisivos para llegar a ese modelo — en particular la imagen
              conocida como "Foto 51", una difracción nítida de ADN en su forma B que mostraba con
              claridad el patrón de hélice. Watson vio esa imagen (mostrada por Maurice Wilkins, colega de
              Franklin, sin su autorización directa) antes de que Franklin publicara su propio análisis
              completo, y esos datos fueron determinantes para que Watson y Crick cerraran el modelo
              correcto.
            </p>
            <Caption>
              El Premio Nobel de Fisiología o Medicina de 1962 lo compartieron Watson, Crick y Wilkins.
              Franklin había muerto en 1958, de cáncer de ovario, a los 37 años — el Comité Nobel no
              otorga el premio póstumamente, así que nunca fue candidata formal, independientemente de
              cuánto hubiera pesado su trabajo. El desequilibrio real entre su contribución y el
              reconocimiento que recibió en vida está ampliamente documentado en historia de la ciencia
              (incluida la propia correspondencia y las memorias de Watson, que décadas después matizó el
              tono con el que la había descrito originalmente) — se trata acá como hecho histórico, no
              como anécdota de color.
            </Caption>
          </Panel>
        </div>

        {/* II. ESTRUCTURA QUIMICA */}
        <div id="sec-02" className={`adn-section ${visible['sec-02'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="ESTRUCTURA QUÍMICA" sub="la doble hélice, en detalle real" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              El ADN (ácido desoxirribonucleico) es un polímero de dos cadenas enrolladas entre sí en
              hélice, cada una formada por una secuencia de <strong style={{ color: '#fff' }}>nucleótidos</strong>.
              Cada nucleótido tiene tres partes: un azúcar (desoxirribosa), un grupo fosfato, y una de
              cuatro <strong style={{ color: '#fff' }}>bases nitrogenadas</strong> — adenina (A), timina
              (T), citosina (C) y guanina (G). El azúcar y el fosfato forman el esqueleto estructural de
              cada cadena; las bases sobresalen hacia el centro de la hélice.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Lo que mantiene unidas a las dos cadenas es la <strong style={{ color: '#fff' }}>complementariedad
              de bases</strong>: adenina solo empareja con timina (dos puentes de hidrógeno), citosina solo
              con guanina (tres puentes de hidrógeno) — nunca A con C, ni G con T. Esta regla, tan simple,
              es la que hace posible todo lo que sigue en este documento: si conocés la secuencia de una
              cadena, la otra queda determinada por completo.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Las dos cadenas son <strong style={{ color: '#fff' }}>antiparalelas</strong>: corren en
              direcciones químicas opuestas (una va 5'→3', la otra 3'→5', en la nomenclatura real de los
              carbonos del azúcar) — no es un detalle decorativo, es justamente lo que permite que las
              bases queden enfrentadas correctamente a lo largo de toda la hélice sin forzar la geometría
              de la molécula.
            </p>
          </Panel>
        </div>

        {/* III. CODIGO GENETICO */}
        <div id="sec-03" className={`adn-section ${visible['sec-03'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title="EL CÓDIGO GENÉTICO" sub="descifrado durante los años 60" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              La información se lee en tripletes de bases llamados <strong style={{ color: '#fff' }}>codones</strong>.
              Hay 64 codones posibles (4³) para codificar 20 aminoácidos estándar más las señales de inicio
              y de corte (stop) de una proteína — lo que significa que el código es{' '}
              <strong style={{ color: '#fff' }}>degenerado</strong>: casi todos los aminoácidos tienen más
              de un codón que los codifica (la leucina, por ejemplo, puede codificarse con seis tripletes
              distintos). Esto no es ineficiencia, funciona como una capa real de tolerancia a errores
              puntuales de copia.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              El descifrado real del código —qué triplete corresponde a qué aminoácido— se atribuye en
              buena parte a Marshall Nirenberg y Heinrich Matthaei, con experimentos clave publicados desde
              1961, y a Har Gobind Khorana, que completó buena parte del mapeo restante durante esa misma
              década. Nirenberg y Khorana compartieron el Premio Nobel de Fisiología o Medicina de 1968 por
              este trabajo (junto con Robert Holley, por su trabajo sobre la estructura del ARN de
              transferencia).
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              El código es, con pocas excepciones conocidas (algunas variantes menores en mitocondrias y en
              ciertos microorganismos), prácticamente <strong style={{ color: '#fff' }}>universal</strong>:
              el mismo triplete codifica el mismo aminoácido en una bacteria, un hongo, una planta y un ser
              humano. Esa universalidad es, en sí misma, una de las evidencias más fuertes y citadas de
              ancestro común compartido por toda la vida conocida en la Tierra.
            </p>
          </Panel>
        </div>

        {/* IV. REPLICACION */}
        <div id="sec-04" className={`adn-section ${visible['sec-04'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="REPLICACIÓN" sub="semiconservativa, confirmada experimentalmente en 1958" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              La enzima <strong style={{ color: '#fff' }}>ADN polimerasa</strong> recorre cada cadena
              separada de la hélice original y construye una cadena nueva complementaria, base por base,
              siguiendo la misma regla de emparejamiento de la sección II. El resultado son dos moléculas
              de ADN, cada una con una cadena vieja (de la molécula original) y una cadena recién
              sintetizada — eso es exactamente lo que se llama un mecanismo{' '}
              <strong style={{ color: '#fff' }}>semiconservativo</strong>.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Watson y Crick ya habían propuesto este mecanismo como la consecuencia lógica más directa de
              su propio modelo estructural en 1953, pero seguía siendo una hipótesis hasta que Matthew
              Meselson y Franklin Stahl la confirmaron experimentalmente en 1958: marcaron ADN de bacterias
              con un isótopo pesado de nitrógeno, las dejaron replicarse en un medio con nitrógeno normal, y
              separaron el ADN resultante por densidad — el patrón de bandas que obtuvieron coincidía
              exactamente con lo que predice un mecanismo semiconservativo, y no con los otros dos modelos
              rivales que se discutían en ese momento (conservativo y dispersivo). Es, todavía hoy, uno de
              los experimentos más citados en biología molecular por lo limpio de su diseño.
            </p>
          </Panel>
        </div>

        {/* V. DOGMA CENTRAL */}
        <div id="sec-05" className={`adn-section ${visible['sec-05'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="V" title="DEL ADN A LA PROTEÍNA" sub="el 'dogma central' de Francis Crick" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <strong style={{ color: '#fff' }}>Transcripción</strong>: la ARN polimerasa copia un gen del
              ADN a una molécula de ARN mensajero (ARNm), usando uracilo en vez de timina pero con la misma
              lógica de complementariedad de bases.{' '}
              <strong style={{ color: '#fff' }}>Traducción</strong>: el ribosoma lee ese ARNm codón por
              codón, y el ARN de transferencia (ARNt) — que lleva pegado el aminoácido correspondiente a
              cada codón — va entregando los aminoácidos en el orden correcto para que se encadenen en una
              proteína.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Francis Crick formuló esto como el <strong style={{ color: '#fff' }}>dogma central</strong>
              de la biología molecular: la información fluye de ADN a ARN y de ARN a proteína, pero no al
              revés — una proteína no puede "escribirse" de vuelta en una secuencia de ADN. Hay excepciones
              reales y bien documentadas al flujo ADN→ARN (los retrovirus, como el VIH, copian ARN a ADN
              usando una enzima llamada transcriptasa reversa), pero el flujo proteína→ácido nucleico, que
              es lo que el dogma central prohíbe en sentido estricto, se sostiene sin excepción conocida.
            </p>
          </Panel>
        </div>

        {/* VI. PROYECTO GENOMA HUMANO */}
        <div id="sec-06" className={`adn-section ${visible['sec-06'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VI" title="EL PROYECTO GENOMA HUMANO" sub="de un borrador en 2000 a una secuencia de verdad completa en 2022" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              El Proyecto Genoma Humano (un consorcio internacional público, compitiendo en paralelo con el
              esfuerzo privado de Celera Genomics liderado por Craig Venter) anunció un borrador conjunto de
              la secuencia en el año 2000, y declaró la secuencia "completa" en 2003 — fecha elegida
              simbólicamente para coincidir con el 50º aniversario del paper de Watson y Crick. El costo
              total del proyecto original rondó los 3.000 millones de dólares a lo largo de más de una
              década de trabajo.
            </p>
            <Caption>
              Esa "completitud" de 2003 tenía huecos reales: regiones altamente repetitivas y
              estructuralmente complejas del genoma (en particular cerca de los centrómeros y telómeros de
              los cromosomas) quedaron sin resolver, porque la tecnología de secuenciación de la época no
              podía leerlas de forma confiable. Recién en 2022, un consorcio distinto —Telomere-to-Telomere
              (T2T)— publicó la primera secuencia verdaderamente completa, de extremo a extremo, de un
              genoma humano, usando tecnologías de secuenciación de lectura larga que no existían en 2003.
            </Caption>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: '16px 0 0' }}>
              La caída de costo es, en sí misma, uno de los datos más citados de toda la genómica aplicada:
              secuenciar un genoma humano completo hoy cuesta, según el proveedor y la profundidad de
              lectura, del orden de unos pocos cientos de dólares — una caída de varios órdenes de magnitud
              en poco más de veinte años, más rápida que la que describió la Ley de Moore para los
              semiconductores en ese mismo período.
            </p>
          </Panel>
        </div>

        {/* VII. CRISPR */}
        <div id="sec-07" className={`adn-section ${visible['sec-07'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VII" title="CRISPR" sub="de defensa bacteriana a terapia humana aprobada" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              CRISPR (Clustered Regularly Interspaced Short Palindromic Repeats) no se inventó de cero: es
              un sistema inmune real que las bacterias usan desde hace millones de años para defenderse de
              virus, guardando fragmentos del ADN viral como una memoria para reconocerlo y cortarlo si
              vuelve a aparecer. Francisco Mojica, en la Universidad de Alicante, identificó y caracterizó
              estas secuencias repetidas en arqueas y bacterias durante los años 90, antes incluso de que el
              nombre "CRISPR" se formalizara como tal a comienzos de los 2000.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Jennifer Doudna y Emmanuelle Charpentier demostraron en 2012 que el sistema CRISPR-Cas9 podía
              programarse para cortar cualquier secuencia de ADN deseada, no solo la de un virus — convertir
              una defensa bacteriana específica en una herramienta de edición genética de propósito general,
              mucho más simple y accesible que los métodos de edición que existían antes. Ganaron el Premio
              Nobel de Química 2020 por este trabajo.
            </p>
            <Caption>
              Aplicación real y ya en uso clínico: Casgevy (exagamglogene autotemcel), una terapia basada en
              CRISPR-Cas9, recibió aprobación regulatoria en 2023 (primero en el Reino Unido, y ese mismo
              año la FDA en Estados Unidos) para el tratamiento de anemia falciforme y beta-talasemia —
              edita directamente las células madre sanguíneas del propio paciente fuera del cuerpo, antes de
              reinfundirlas. No es un experimento de laboratorio: es un tratamiento aprobado, con pacientes
              reales tratados.
            </Caption>
          </Panel>
        </div>

        {/* VIII. ADN NO CODIFICANTE */}
        <div id="sec-08" className={`adn-section ${visible['sec-08'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VIII" title="ADN NO CODIFICANTE Y EPIGENÉTICA" sub="el debate que la propia genética todavía no cerró" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Solo una fracción pequeña del genoma humano —del orden del 1-2%— codifica directamente
              proteínas. El resto incluye regiones regulatorias con función real y bien establecida
              (promotores, potenciadores, genes que producen ARN no codificante con roles conocidos en la
              regulación de otros genes), pero también una porción enorme cuya función específica, si la
              tiene, no está completamente establecida.
            </p>
            <Caption>
              El debate sobre cuánto de ese ADN "no codificante" es funcional versus genuinamente inerte —
              lo que popularmente se llamó "ADN basura" — sigue activo dentro de la propia comunidad
              científica, no está cerrado. Algunos estudios a gran escala (como el proyecto ENCODE)
              reportaron actividad bioquímica detectable en una fracción muy grande del genoma, pero hay
              desacuerdo real y publicado sobre si "actividad bioquímica detectable" equivale a "función
              biológica real" — no es lo mismo, y tratarlos como sinónimos fue, en sí mismo, motivo de
              crítica científica pública.
            </Caption>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: '16px 0 0' }}>
              La <strong style={{ color: '#fff' }}>epigenética</strong> es una capa real y bien
              establecida de regulación que no cambia la secuencia de bases: la metilación del ADN (agregar
              un grupo metilo a ciertas bases, típicamente silenciando la expresión de un gen cercano) y la
              modificación de histonas (las proteínas alrededor de las cuales se enrolla el ADN, cuya
              forma de empaquetado afecta qué tan accesible está un gen para ser transcripto) determinan,
              en buena medida, qué genes se expresan en qué célula y en qué momento — el mismo ADN, leído
              distinto.
            </p>
          </Panel>
        </div>

        {/* IX. ADN COMO INFORMACION */}
        <div id="sec-09" className={`adn-section ${visible['sec-09'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IX" title="ADN COMO INFORMACIÓN" sub="la analogía real, y sus límites reales" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              El ADN comparte con cualquier código digital la lógica de{' '}
              <strong style={{ color: '#fff' }}>información discreta codificada en una secuencia</strong>:
              un alfabeto finito (cuatro bases, en vez de dos dígitos binarios), leído en unidades fijas
              (codones de tres bases, en vez de bytes de ocho bits), con reglas de traducción exactas entre
              un nivel y el siguiente. Es, en el sentido técnico que{' '}
              <Link href="/knowledge?entry=shannon" style={{ color: '#fff', textDecoration: 'underline' }}>
                Claude Shannon
              </Link>{' '}
              le dio a la palabra "información" en 1948, un canal real con una capacidad real de
              transportar y preservar una señal a través del tiempo y de generaciones.
            </p>
            <Caption>
              La analogía tiene límites reales que conviene no borrar: un código digital se ejecuta sobre
              un sustrato que distingue de forma limpia entre "programa" y "máquina que lo corre", mientras
              que el ADN no se "ejecuta" solo — necesita toda la maquinaria celular (ribosomas, enzimas,
              el entorno químico completo) para que la secuencia se vuelva algo, y esa misma maquinaria es,
              a su vez, producto de otra parte del propio ADN. No es una cinta que un lector externo
              interpreta; es un código que construye, con ayuda, su propio lector.
            </Caption>
          </Panel>
        </div>

        {/* X. RESONANCIA */}
        <div id="sec-10" className={`adn-section ${visible['sec-10'] ? 'is-visible' : ''}`} style={{ marginBottom: 0 }}>
          <SectionHeader roman="X" title="RESONANCIA CON NEOPROXY" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <Link href="/knowledge/sintesis" style={{ color: '#fff', textDecoration: 'underline' }}>Síntesis</Link>{' '}
              ya planteó que todo este Codex pregunta, en registros distintos, si la realidad es materia o
              información codificada en un límite. El ADN es, de los casos reales de este archivo, el más
              literal: una molécula que es, simultáneamente, sustancia química con masa y forma, y un
              código que se copia, se lee y se traduce — no una metáfora sobre información, el caso real
              más antiguo y más probado de información codificada en materia que se conoce.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Y la vida tal como la conocemos tampoco llegó a su forma actual en un solo paso: la
              simbiogénesis de{' '}
              <Link href="/knowledge?entry=margulis" style={{ color: '#fff', textDecoration: 'underline' }}>
                Lynn Margulis
              </Link>{' '}
              —la idea, hoy evidencia aceptada, de que las mitocondrias y los cloroplastos fueron alguna vez
              bacterias independientes que terminaron viviendo dentro de otra célula— es otra forma real de
              organización que no está escrita en ningún gen individual: es una relación completa entre
              genomas distintos, conviviendo dentro de la misma membrana.
            </p>
          </Panel>
        </div>

        {/* footer */}
        <div style={{ marginTop: 100, paddingTop: 28, borderTop: `1px solid ${ACCENT}22` }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}44` }}>
            NPX-ARC-15 // REFERENCIA TÉCNICA DEL CODEX
          </div>
        </div>
      </div>

      <style>{`
        .adn-section { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .adn-section.is-visible { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .adn-section { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
