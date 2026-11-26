'use client'

// NPX-ARC-16 — WETWARE
// Pedido explícito: el cuerpo humano, "cómo funciona todo lo posible",
// reescrito directamente en términos de informática -- el humano como
// biomáquina, lenguaje NeoProxy, con anatomía real debajo de cada
// analogía, no decoración. El nombre se eligió junto al usuario:
// "wetware" es un término real del vocabulario cyberpunk (de la novela
// homónima de Rudy Rucker, 1988) para el cerebro/sistema nervioso como
// el "hardware" biológico -- mismo linaje que ya ancla la estética del
// sitio (Ghost in the Shell, Lain).
// Primera fase a propósito: solo texto. El usuario ya avisó que después
// viene una fase ilustrada/animada/interactiva -- este documento es la
// base factual sobre la que se va a construir eso, no el resultado
// final.
// Mismo criterio de honestidad que el resto del Codex, reforzado: cada
// sección tiene un Caption marcando hasta dónde la analogía es útil y
// dónde se rompe -- el cuerpo no "es" una computadora, es una
// herramienta de traducción que ilumina algunos patrones reales y
// oscurece otros. Acento magenta profundo #c90076, distinto de los ya
// usados en el resto del Codex.

import { useEffect, useState } from 'react'
import Link from 'next/link'

const mono = "'Space Mono', monospace"
const ACCENT = '#c90076'
const TEXT = '#f5e0ec'
const TEXT_DIM = '#c9a0bc'
const LABEL_DIM = '#8a5070'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(10, 2, 7, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(201,0,118,0.03)`,
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
        <h2 style={{
          fontSize: 'clamp(18px, 3vw, 24px)', letterSpacing: 5, color: ACCENT,
          textShadow: `0 0 24px ${ACCENT}44`, margin: 0,
        }}>
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
  ['I', 'sec-01', 'Arquitectura general — el mapa de capas'],
  ['II', 'sec-02', 'El procesador central — el cerebro'],
  ['III', 'sec-03', 'La red de baja latencia — sistema nervioso periférico'],
  ['IV', 'sec-04', 'Mensajería asíncrona — sistema endocrino'],
  ['V', 'sec-05', 'La fuente de alimentación — sistema circulatorio'],
  ['VI', 'sec-06', 'El puerto de E/S de gases — sistema respiratorio'],
  ['VII', 'sec-07', 'El pipeline ETL — sistema digestivo'],
  ['VIII', 'sec-08', 'El firewall — sistema inmune'],
  ['IX', 'sec-09', 'El firmware — ADN y epigenética'],
  ['X', 'sec-10', 'El recolector de basura — linfático, renal, hepático'],
  ['XI', 'sec-11', 'Chasis y actuadores — sistema musculoesquelético'],
  ['XII', 'sec-12', 'Periféricos de entrada — los sentidos'],
  ['XIII', 'sec-13', 'El ciclo de mantenimiento — el sueño'],
  ['XIV', 'sec-14', 'Fin de ciclo — envejecimiento y apoptosis'],
]

export default function WetwarePage() {
  const [visible, setVisible] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.wtw-section'))
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
    <div style={{ background: '#080206', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        <Link href="/knowledge" className="press tap-ext" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${ACCENT}aa`, textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← VOLVER AL CODEX
        </Link>

        {/* encabezado */}
        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${ACCENT}66`, marginBottom: 16 }}>
            NPX-ARC-16 // REFERENCIA TÉCNICA
          </div>
          <h1 style={{
            fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 700, letterSpacing: 6, color: ACCENT,
            textShadow: `0 0 40px ${ACCENT}55`, marginBottom: 14, lineHeight: 1.1,
          }}>
            WETWARE
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            EL CUERPO HUMANO, REESCRITO COMO ARQUITECTURA DE SISTEMA — ANATOMÍA REAL, NO DECORACIÓN
          </div>
          <p style={{
            fontSize: 11.5, lineHeight: 2.1, letterSpacing: 0.3, color: TEXT_DIM, maxWidth: 660,
            borderLeft: `1px solid ${ACCENT}33`, paddingLeft: 24, marginBottom: 32,
          }}>
            "Wetware" es un término real del vocabulario cyberpunk (Rudy Rucker, 1988): el cerebro y el
            sistema nervioso como el hardware biológico, en paralelo directo con software/hardware. Este
            documento extiende esa idea al cuerpo entero — cada sistema real, con su analogía
            computacional más precisa, y un límite explícito de hasta dónde esa analogía sirve y dónde
            se rompe.
          </p>

          <div style={{
            display: 'inline-grid', gridTemplateColumns: 'auto auto', gap: '4px 24px', fontSize: 9,
            letterSpacing: 1, color: `${ACCENT}99`, border: `1px solid ${ACCENT}33`, padding: '12px 18px',
            marginBottom: 32,
          }}>
            <span style={{ color: `${ACCENT}55` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>ANATOMÍA Y FISIOLOGÍA HUMANA, TRADUCIDA A ARQUITECTURA DE SISTEMA</span>
            <span style={{ color: `${ACCENT}55` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — 14 SECCIONES — FASE 1/3: TEXTO</span>
            <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>SISTEMA NERVIOSO → CIRCULATORIO → DIGESTIVO → INMUNE → GENÉTICO → ESTRUCTURAL → SENSORIAL → CICLO DE VIDA</span>
          </div>

          <Link href="/lab/wetware" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none',
            border: `1px solid ${ACCENT}55`, padding: '12px 18px', marginBottom: 28, maxWidth: 680,
            background: `${ACCENT}0d`,
          }}>
            <span style={{ fontSize: 9, letterSpacing: 2, color: ACCENT }}>→ PROBAR LA VERSIÓN 3D</span>
            <span style={{ fontSize: 9, letterSpacing: 1, color: TEXT_DIM }}>
              holograma interactivo — 4 de estos 14 sistemas marcados sobre una figura orbitable
            </span>
          </Link>

          <nav style={{ border: `1px solid ${ACCENT}22`, padding: '20px 24px', maxWidth: 680 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}66`, marginBottom: 14 }}>ÍNDICE</div>
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

        {/* I. ARQUITECTURA GENERAL */}
        <div id="sec-01" className={`wtw-section ${visible['sec-01'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="I" title="ARQUITECTURA GENERAL — EL MAPA DE CAPAS" sub="antes del detalle, cómo se organiza todo lo que sigue" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Un sistema de cómputo real se piensa en capas: hardware (los componentes físicos),
              firmware (instrucciones grabadas en el hardware mismo), sistema operativo (gestiona
              recursos y procesos), red (comunica componentes entre sí), seguridad (filtra lo que
              entra), y mantenimiento (limpieza y reparación en segundo plano). El cuerpo tiene una
              estructura de capas real y equivalente, no forzada: <strong style={{ color: '#fff' }}>hardware</strong> es
              el chasis óseo y los órganos; <strong style={{ color: '#fff' }}>firmware</strong> es el ADN, grabado en
              cada célula antes de que el sistema arranque; <strong style={{ color: '#fff' }}>sistema
              operativo</strong> es el sistema nervioso autónomo, administrando recursos sin pedir
              permiso consciente; <strong style={{ color: '#fff' }}>red</strong> es el sistema circulatorio y
              linfático; <strong style={{ color: '#fff' }}>seguridad</strong> es el sistema inmune; y{' '}
              <strong style={{ color: '#fff' }}>mantenimiento</strong> es el sueño y la reparación celular
              continua.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Ninguna de estas capas corre sola. El resto de este documento baja cada una al sistema
              real que le corresponde — con la anatomía primero, la analogía después, nunca al revés.
            </p>
          </Panel>
        </div>

        {/* II. CEREBRO */}
        <div id="sec-02" className={`wtw-section ${visible['sec-02'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="EL PROCESADOR CENTRAL — EL CEREBRO" sub="~86 mil millones de núcleos, cada uno lentísimo, todos en paralelo" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              El cerebro humano tiene, según el recuento moderno (Suzana Herculano-Houzel, 2009, que
              reemplazó el "100 mil millones" popular de décadas de citas sin verificar), aproximadamente{' '}
              <strong style={{ color: '#fff' }}>86 mil millones de neuronas</strong>, cada una conectada a
              miles de otras. La corteza cerebral se organiza en lóbulos con funciones relativamente
              especializadas (frontal: planificación y control; occipital: visión; temporal: memoria y
              lenguaje) — el equivalente más cercano no es un único procesador, sino un{' '}
              <strong style={{ color: '#fff' }}>clúster de núcleos especializados</strong> que se reparten
              tareas distintas y se comunican constantemente entre sí.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              El hipocampo funciona como memoria de trabajo activa que consolida información hacia
              almacenamiento distribuido en la corteza durante el sueño (ver sección XIII) — un proceso
              real parecido a mover datos de una caché rápida y volátil a almacenamiento permanente, no
              una copia instantánea.
            </p>
            <Caption>
              Dónde se rompe la analogía: una neurona transmite a un máximo de ~120 metros por segundo
              en los axones más rápidos (mielinizados) — millones de veces más lento que una señal
              eléctrica en un cable de cobre, que viaja a una fracción apreciable de la velocidad de la
              luz. El cerebro no gana por velocidad de señal individual: gana por paralelismo masivo y
              por plasticidad (las conexiones cambian con el uso, algo que el hardware de silicio no
              hace solo). Es la misma precisión que ya exige el documento de Redes Neuronales
              (/archivo/redes-neuronales) al comparar neurona biológica con neurona artificial — acá
              aplica igual.
            </Caption>
          </Panel>
        </div>

        {/* III. SISTEMA NERVIOSO PERIFERICO */}
        <div id="sec-03" className={`wtw-section ${visible['sec-03'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title="LA RED DE BAJA LATENCIA" sub="sistema nervioso periférico y reflejos" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Los nervios periféricos son el cableado físico que conecta el procesador central con el
              resto del chasis — la médula espinal funciona como el <strong style={{ color: '#fff' }}>bus
              troncal</strong> por el que pasa casi todo ese tráfico antes de ramificarse.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Un reflejo (como retirar la mano de algo caliente, o el reflejo rotuliano que prueba
              cualquier control médico) no pasa por el cerebro antes de actuar: la señal entra, hace un
              salto corto en la médula espinal, y sale de vuelta como orden motora — el equivalente real
              a una <strong style={{ color: '#fff' }}>interrupción de hardware</strong> que salta al
              procesador central para ganar tiempo en una emergencia. El cerebro se entera del dolor
              después, no antes, de que la mano ya se movió.
            </p>
          </Panel>
        </div>

        {/* IV. SISTEMA ENDOCRINO */}
        <div id="sec-04" className={`wtw-section ${visible['sec-04'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="MENSAJERÍA ASÍNCRONA — SISTEMA ENDOCRINO" sub="broadcast de alto alcance, no mensajes punto a punto" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Si el sistema nervioso es mensajería directa y rápida (un pulso eléctrico, un destinatario
              puntual), el sistema endocrino es el opuesto exacto: glándulas que liberan hormonas{' '}
              <strong style={{ color: '#fff' }}>directamente al torrente sanguíneo</strong>, sin un
              destinatario fijo — cualquier célula con el receptor correcto la recibe, en segundos o
              minutos, no milisegundos.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La adrenalina liberada por las glándulas suprarrenales es el ejemplo más claro: una sola
              señal de "modo de emergencia" que sube el ritmo cardíaco, redirige sangre a los músculos y
              dilata las pupilas, todo en simultáneo, sin que el cerebro tenga que avisarle a cada órgano
              por separado. Es, literalmente, un mensaje de{' '}
              <strong style={{ color: '#fff' }}>broadcast de baja prioridad y alto alcance</strong>, no
              una llamada directa.
            </p>
          </Panel>
        </div>

        {/* V. SISTEMA CIRCULATORIO */}
        <div id="sec-05" className={`wtw-section ${visible['sec-05'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="V" title="LA FUENTE DE ALIMENTACIÓN — SISTEMA CIRCULATORIO" sub="~5 litros por minuto, en reposo" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              El corazón bombea en reposo alrededor de <strong style={{ color: '#fff' }}>5 litros de
              sangre por minuto</strong> (el "gasto cardíaco" estándar en un adulto sano) — una fuente de
              poder con cuatro cámaras, cierta redundancia parcial de circuito, y un ritmo que se ajusta
              solo según la demanda real medida (frecuencia cardíaca sube con el ejercicio, no por
              decisión consciente).
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La sangre es el bus de transporte real: oxígeno y glucosa como combustible y datos,
              glóbulos blancos patrullando como unidades de seguridad activas (ver sección VIII),
              hormonas viajando como los mensajes de broadcast de la sección anterior. La presión
              arterial es, en términos de sistema, el <strong style={{ color: '#fff' }}>voltaje</strong> de
              esa red de distribución — demasiado baja y los componentes más lejanos no reciben
              suficiente, demasiado alta y el cableado (las arterias) se daña con el tiempo.
            </p>
          </Panel>
        </div>

        {/* VI. SISTEMA RESPIRATORIO */}
        <div id="sec-06" className={`wtw-section ${visible['sec-06'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VI" title="EL PUERTO DE E/S DE GASES" sub="sistema respiratorio" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Los alvéolos pulmonares son, con bastante literalidad, un puerto de entrada/salida:
              entra oxígeno del aire hacia la sangre, sale dióxido de carbono de la sangre hacia el
              aire, por simple diferencia de concentración a través de una membrana finísima.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Lo que de verdad regula cuánto respirás no es el nivel de oxígeno (como mucha gente
              asume) sino sensores que miden <strong style={{ color: '#fff' }}>CO₂ disuelto en sangre</strong>,
              en el tronco encefálico — un <strong style={{ color: '#fff' }}>bucle de retroalimentación</strong> real:
              sube el CO₂, sube la frecuencia respiratoria, baja el CO₂, baja la frecuencia. El mismo
              principio de control que ya tiene su propio documento en /archivo/cibernetica, corriendo
              acá sin que lo decidas conscientemente ni un segundo.
            </p>
          </Panel>
        </div>

        {/* VII. SISTEMA DIGESTIVO */}
        <div id="sec-07" className={`wtw-section ${visible['sec-07'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VII" title="EL PIPELINE ETL — SISTEMA DIGESTIVO" sub="extract, transform, load — literal" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Un pipeline ETL real toma datos crudos de afuera (extract), los convierte a un formato
              utilizable (transform), y los deposita donde el sistema los puede usar (load). El sistema
              digestivo hace exactamente eso con la comida: la boca y el estómago{' '}
              <strong style={{ color: '#fff' }}>extraen</strong> (digestión mecánica y química inicial), el
              intestino delgado <strong style={{ color: '#fff' }}>transforma</strong> (enzimas que rompen
              macromoléculas en unidades absorbibles — proteínas en aminoácidos, almidones en azúcares
              simples) y <strong style={{ color: '#fff' }}>carga</strong> directamente al torrente
              sanguíneo a través de la pared intestinal.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              El hígado funciona como una etapa de post-procesamiento que casi todo ese flujo atraviesa
              antes de distribuirse al resto del sistema: filtra toxinas, regula la cantidad de glucosa
              liberada según la demanda real, y almacena excedentes — el mismo rol que cumpliría un
              proceso intermedio que normaliza y valida datos antes de que lleguen al resto de la
              aplicación.
            </p>
          </Panel>
        </div>

        {/* VIII. SISTEMA INMUNE */}
        <div id="sec-08" className={`wtw-section ${visible['sec-08'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VIII" title="EL FIREWALL — SISTEMA INMUNE" sub="detección por firma, base de datos de amenazas, y el falso positivo que peor sale" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Los anticuerpos reconocen patógenos por su forma específica (el antígeno) — exactamente el
              mismo principio que un antivirus detectando malware por{' '}
              <strong style={{ color: '#fff' }}>firma conocida</strong>. Las células de memoria
              inmunológica (linfocitos B y T de memoria) guardan ese reconocimiento durante años,
              a veces décadas — una <strong style={{ color: '#fff' }}>base de datos de amenazas
              conocidas</strong> real. Una vacuna funciona entrenando esa base de datos con una versión
              inactiva o fragmentada del patógeno, sin correr el riesgo real de la infección completa.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La inflamación es una respuesta de contención real (más flujo sanguíneo, más células de
              defensa concentradas en la zona) — el equivalente a poner en cuarentena un segmento de red
              mientras se investiga. Y la autoinmunidad es, en estos términos, el desastre más temido de
              cualquier sistema de seguridad real: un{' '}
              <strong style={{ color: '#fff' }}>falso positivo</strong> catastrófico, donde el sistema de
              defensa ataca procesos legítimos del propio organismo por error de reconocimiento.
            </p>
          </Panel>
        </div>

        {/* IX. ADN / FIRMWARE */}
        <div id="sec-09" className={`wtw-section ${visible['sec-09'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IX" title="EL FIRMWARE — ADN Y EPIGENÉTICA" sub="la anatomía completa de esto ya tiene su propio documento" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              La estructura química del ADN, el código genético, la replicación y CRISPR ya tienen su
              documento propio y profundo en este Codex:{' '}
              <Link href="/archivo/adn" style={{ color: '#fff', textDecoration: 'underline' }}>ADN</Link>.
              Acá va solo la pieza que falta ahí: la analogía de sistema específica.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              El ADN es <strong style={{ color: '#fff' }}>firmware</strong>: instrucciones grabadas en
              cada célula desde antes de que el sistema arranque, que no cambian con el uso normal. La{' '}
              <strong style={{ color: '#fff' }}>epigenética</strong> — qué genes se expresan y cuáles
              quedan silenciados, sin alterar la secuencia de bases en sí — es, con bastante precisión,{' '}
              <strong style={{ color: '#fff' }}>configuración en tiempo de ejecución</strong>: el mismo
              firmware exacto puede comportarse distinto según qué "flags" están activados, sin
              reescribir una sola línea del código fuente.
            </p>
          </Panel>
        </div>

        {/* X. SISTEMA LINFATICO/RENAL/HEPATICO */}
        <div id="sec-10" className={`wtw-section ${visible['sec-10'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="X" title="EL RECOLECTOR DE BASURA" sub="sistema linfático, renal y hepático" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Los riñones filtran alrededor de <strong style={{ color: '#fff' }}>180 litros de plasma
              sanguíneo por día</strong> — un proceso continuo de limpieza con un throughput medible de
              verdad, reabsorbiendo casi todo el agua y los solutos útiles y excretando apenas 1 a 2
              litros como orina. Es, en términos de sistema, un{' '}
              <strong style={{ color: '#fff' }}>recolector de basura (garbage collector)</strong> que
              corre en segundo plano, sin pausar nada más, todo el tiempo.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              El sistema linfático es un segundo proceso de recolección, más lento y menos centralizado
              — drena líquido sobrante de los tejidos y filtra patógenos a través de los ganglios
              linfáticos antes de devolver ese líquido a la circulación. Dos recolectores de basura
              corriendo en paralelo, con prioridades y velocidades distintas.
            </p>
          </Panel>
        </div>

        {/* XI. MUSCULOESQUELETICO */}
        <div id="sec-11" className={`wtw-section ${visible['sec-11'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="XI" title="CHASIS Y ACTUADORES" sub="sistema musculoesquelético" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Los huesos son el <strong style={{ color: '#fff' }}>chasis estructural</strong> — rígido
              donde hace falta soporte, articulado donde hace falta movimiento, con las articulaciones
              funcionando como juntas mecánicas reales con grados de libertad definidos (una bisagra en
              el codo, una rótula de movimiento amplio en el hombro).
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Los músculos son <strong style={{ color: '#fff' }}>actuadores</strong> reales: el sarcómero
              (la unidad contráctil mínima, filamentos de actina y miosina deslizándose uno sobre otro)
              es, literalmente, un motor lineal microscópico que convierte energía química (ATP) en
              fuerza mecánica — no una metáfora floja, es el mismo principio físico que mueve cualquier
              actuador lineal real, a otra escala.
            </p>
          </Panel>
        </div>

        {/* XII. SENTIDOS */}
        <div id="sec-12" className={`wtw-section ${visible['sec-12'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="XII" title="PERIFÉRICOS DE ENTRADA — LOS SENTIDOS" sub="cada uno con su propio protocolo de conversión analógico-digital" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Cada sentido es un sensor especializado que convierte un tipo de energía física distinta en
              el mismo formato final: potenciales de acción, el único "idioma" que el sistema nervioso
              entiende. La retina convierte fotones en señal eléctrica (fototransducción); la cóclea
              convierte vibración mecánica del aire en señal eléctrica según la frecuencia; los
              receptores de la piel convierten presión, temperatura y daño tisular en señal eléctrica.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Es, con precisión real, un{' '}
              <strong style={{ color: '#fff' }}>conversor analógico-digital</strong> por cada tipo de
              estímulo — la señal de entrada es continua (luz, sonido, presión), pero lo que viaja por el
              nervio hacia el procesador central es discreto: el potencial de acción dispara entero o no
              dispara, no hay un "medio pulso".
            </p>
          </Panel>
        </div>

        {/* XIII. SUEÑO */}
        <div id="sec-13" className={`wtw-section ${visible['sec-13'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="XIII" title="EL CICLO DE MANTENIMIENTO — EL SUEÑO" sub="no es apagado, es mantenimiento activo" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              La analogía más común y más floja es "dormir es apagar el sistema". La real es otra:
              dormir es un <strong style={{ color: '#fff' }}>ciclo de mantenimiento programado</strong> con
              el sistema todavía corriendo, no un apagado. Durante el sueño el cerebro consolida memoria
              (mueve información de almacenamiento temporal a distribuido, ver sección II) y, más
              reciente y menos conocido: el{' '}
              <strong style={{ color: '#fff' }}>sistema glinfático</strong> (descrito recién en 2012 por
              el laboratorio de Maiken Nedergaard) limpia activamente desechos metabólicos del cerebro —
              incluida beta-amiloide, asociada a enfermedad de Alzheimer — con un flujo medido entre 60%
              y 90% más alto durante el sueño que despierto.
            </p>
            <Caption>
              El hallazgo del sistema glinfático es relativamente reciente (2012 en adelante) comparado
              con el resto de la anatomía de este documento, que tiene siglos de estudio detrás — se
              marca la diferencia de solidez a propósito, mismo criterio de todo el Codex.
            </Caption>
          </Panel>
        </div>

        {/* XIV. ENVEJECIMIENTO */}
        <div id="sec-14" className={`wtw-section ${visible['sec-14'] ? 'is-visible' : ''}`} style={{ marginBottom: 0 }}>
          <SectionHeader roman="XIV" title="FIN DE CICLO — ENVEJECIMIENTO Y APOPTOSIS" sub="shutdown controlado, no crash — y los límites reales de esta traducción entera" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Cada vez que una célula se divide, los telómeros (los extremos protectores de los
              cromosomas) se acortan un poco. Leonard Hayflick demostró en 1961 que las células humanas
              normales tienen un número finito de divisiones posibles antes de dejar de dividirse — el{' '}
              <strong style={{ color: '#fff' }}>límite de Hayflick</strong>, con la enzima telomerasa
              (cuyo rol real le valió el Nobel de Fisiología o Medicina 2009 a Blackburn, Greider y
              Szostak) como la pieza que puede retrasarlo en ciertas células.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              La <strong style={{ color: '#fff' }}>apoptosis</strong> (muerte celular programada) es un
              proceso ordenado y activo que la propia célula ejecuta sobre sí misma cuando corresponde —
              el equivalente real a un{' '}
              <strong style={{ color: '#fff' }}>shutdown controlado de un proceso</strong>, limpio, sin
              afectar a los vecinos. La necrosis (muerte celular por daño agudo, no programada) es el
              equivalente real a un <strong style={{ color: '#fff' }}>crash</strong>: desordenado, y daña
              el tejido alrededor.
            </p>
            <Caption>
              Nota de honestidad general para todo este documento, no solo esta sección: el cuerpo no
              "decide" nada como lo decide un programa — es bioquímica real, sin intención, sin código
              fuente que alguien escribió a propósito. Lo que sí es real es el PATRÓN: control
              retroalimentado (sección VI, ver /archivo/cibernetica), procesamiento en pipeline (sección
              VII), detección por firma (sección VIII), shutdown ordenado vs. crash (acá). La
              traducción a lenguaje de sistema ilumina esos patrones reales — no significa que el cuerpo
              sea, literalmente, una computadora. Mismo cuidado que ya exige /archivo/redes-neuronales
              al comparar neurona real con neurona artificial: la metáfora es una herramienta, no una
              equivalencia.
            </Caption>
          </Panel>
        </div>

        {/* footer */}
        <div style={{ marginTop: 100, paddingTop: 28, borderTop: `1px solid ${ACCENT}22` }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}44` }}>
            NPX-ARC-16 // REFERENCIA TÉCNICA DEL CODEX — FASE 1/3 (TEXTO). ILUSTRADO/ANIMADO: PENDIENTE.
          </div>
        </div>
      </div>

      <style>{`
        .wtw-section { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .wtw-section.is-visible { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .wtw-section { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
