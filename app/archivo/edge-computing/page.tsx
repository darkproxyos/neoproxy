'use client'

// NPX-ARC-18 — EDGE COMPUTING
// Pedido explícito, amplio: edge computing, lo que se sabe y lo que queda
// por explorar. Puente real hacia el siguiente documento del Codex
// (/archivo/computacion-no-convencional): la sección IX de acá explica
// por qué FPGA es, en la práctica, la pieza de hardware que mejor encaja
// con edge computing real -- el interés explícito del usuario.
// Acento naranja-señal #ff4500, nuevo y distinto de todos los ya usados.

import { useEffect, useState } from 'react'
import Link from 'next/link'

const mono = "'Space Mono', monospace"
const ACCENT = '#ff4500'
const TEXT = '#ffe0d0'
const TEXT_DIM = '#d4a088'
const LABEL_DIM = '#8a5a40'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(10, 4, 2, 0.55)', border: `1px solid ${ACCENT}33`, borderRadius: 4,
      boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(255,69,0,0.03)`, padding: '28px 26px', ...style,
    }}>
      {children}
    </div>
  )
}

function SectionHeader({ roman, title, sub }: { roman: string; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
        <span style={{ fontSize: 13, color: `${ACCENT}66`, letterSpacing: 2 }}>{roman}</span>
        <h2 style={{ fontSize: 'clamp(18px, 3vw, 24px)', letterSpacing: 5, color: ACCENT, textShadow: `0 0 24px ${ACCENT}44`, margin: 0 }}>
          {title}
        </h2>
      </div>
      {sub && <div style={{ fontSize: 11, letterSpacing: 1, color: LABEL_DIM, marginTop: 8, paddingLeft: 32 }}>{sub}</div>}
    </div>
  )
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, lineHeight: 1.8, letterSpacing: 0.5, color: LABEL_DIM, marginTop: 14, borderLeft: `2px solid ${ACCENT}33`, paddingLeft: 12 }}>
      {children}
    </div>
  )
}

const TOC: [string, string, string][] = [
  ['I', 'sec-01', 'Qué resuelve de verdad — el límite físico de la velocidad de la luz'],
  ['II', 'sec-02', 'El continuo cloud-fog-edge — no es una dicotomía'],
  ['III', 'sec-03', 'Por qué ahora — IoT, sensores, y el volumen que no tiene sentido centralizar'],
  ['IV', 'sec-04', '5G y MEC — el estándar real detrás de la promesa de latencia'],
  ['V', 'sec-05', 'Edge AI — inferencia en el dispositivo, no entrenamiento'],
  ['VI', 'sec-06', 'El CDN como el edge computing original'],
  ['VII', 'sec-07', 'Edge industrial — donde la nube no puede ser la respuesta'],
  ['VIII', 'sec-08', 'Lo que el edge no resuelve solo'],
  ['IX', 'sec-09', 'Edge y FPGA — dónde se cruzan de verdad'],
  ['X', 'sec-10', 'Lo que queda por explorar'],
]

export default function EdgeComputingPage() {
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.edg-section'))
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
    <div style={{ background: '#0a0301', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        <Link href="/knowledge" className="press tap-ext" style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 3, color: `${ACCENT}aa`, textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← VOLVER AL CODEX
        </Link>

        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 6, color: `${ACCENT}66`, marginBottom: 16 }}>
            NPX-ARC-18 // REFERENCIA TÉCNICA
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 700, letterSpacing: 6, color: ACCENT, textShadow: `0 0 40px ${ACCENT}55`, marginBottom: 14, lineHeight: 1.1 }}>
            EDGE COMPUTING
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            PROCESAR DONDE PASAN LAS COSAS, NO DONDE ESTÁ EL DATACENTER
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 2.1, letterSpacing: 0.3, color: TEXT_DIM, maxWidth: 660, borderLeft: `1px solid ${ACCENT}33`, paddingLeft: 24, marginBottom: 32 }}>
            No es una moda de marketing de "la nube pero más cerca". Es una respuesta real a un límite
            físico real — y la pieza de hardware que mejor encaja con esa respuesta, FPGA, es
            exactamente la puerta de entrada al siguiente documento del Codex.
          </p>

          <div style={{ display: 'inline-grid', gridTemplateColumns: 'auto auto', gap: '4px 24px', fontSize: 10.5, letterSpacing: 1, color: `${ACCENT}99`, border: `1px solid ${ACCENT}33`, padding: '12px 18px', marginBottom: 32 }}>
            <span style={{ color: `${ACCENT}55` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>ARQUITECTURA DE SISTEMAS DISTRIBUIDOS — DEL CDN AL SILICIO RECONFIGURABLE</span>
            <span style={{ color: `${ACCENT}55` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — X SECCIONES</span>
            <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>LATENCIA → CLOUD/FOG/EDGE → 5G/MEC → EDGE AI → INDUSTRIAL → FPGA</span>
          </div>

          <nav style={{ border: `1px solid ${ACCENT}22`, padding: '20px 24px', maxWidth: 680 }}>
            <div style={{ fontSize: 10.5, letterSpacing: 3, color: `${ACCENT}66`, marginBottom: 14 }}>ÍNDICE</div>
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

        <div id="sec-01" className={`edg-section ${visible['sec-01'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="I" title="QUÉ RESUELVE DE VERDAD" sub="el límite físico de la velocidad de la luz" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Mandar un dato a un datacenter y recibir la respuesta no es instantáneo por un límite que
              ninguna optimización de software puede saltar: la luz tarda, como mínimo,{' '}
              <strong style={{ color: '#fff' }}>~67 milisegundos</strong> en dar una vuelta ida y vuelta
              alrededor de la Tierra por fibra óptica (y en la práctica, con routers, conmutadores y
              congestión real de red, los números reales son bastante peores). Para un video que carga
              con un segundo de margen, es irrelevante. Para un auto que frena, un brazo robótico
              quirúrgico, o una red eléctrica reaccionando a una falla, un salto de ida y vuelta a un
              datacenter lejano puede ser, literalmente, demasiado tarde.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              <strong style={{ color: '#fff' }}>Edge computing</strong> es la respuesta a ese límite
              físico, no a una preferencia de diseño: procesar el dato lo más cerca posible de donde se
              genera — en el propio dispositivo, en una antena cercana, en un servidor regional a pocos
              kilómetros — en vez de mandarlo entero a un datacenter central y esperar la vuelta.
            </p>
            <Caption>
              Una segunda razón, real y a veces más determinante que la latencia: ancho de banda y
              privacidad. Una sola cámara de seguridad 4K genera más datos por hora de los que cualquier
              red razonable quiere mandar enteros a la nube las 24 horas — y mandar video crudo de una
              casa a un tercero plantea una pregunta de privacidad que procesar localmente evita de raíz.
            </Caption>
          </Panel>
        </div>

        <div id="sec-02" className={`edg-section ${visible['sec-02'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="EL CONTINUO CLOUD-FOG-EDGE" sub="no es una dicotomía" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              "Edge vs. cloud" es una simplificación — en sistemas reales conviven varios niveles a la
              vez, cada uno resolviendo una parte distinta del problema:{' '}
              <strong style={{ color: '#fff' }}>cloud</strong> (datacenters centrales, cómputo masivo sin
              límite práctico de potencia, pero lejos), <strong style={{ color: '#fff' }}>fog</strong>{' '}
              (un término acuñado por Cisco en 2012: servidores regionales, un salto de red, no dos o
              tres — el término describe justamente eso: niebla, más cerca del suelo que la nube) y{' '}
              <strong style={{ color: '#fff' }}>edge</strong> propiamente dicho (el propio dispositivo o
              su gateway inmediato, cero saltos de red externos).
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La decisión de diseño real en cualquier sistema distribuido moderno no es "¿edge o cloud?"
              sino "¿qué procesamiento va en cada nivel?" — un auto autónomo real procesa localmente
              (edge) lo que decide en milisegundos (frenar), manda a un servidor regional (fog) lo que
              necesita agregarse con otros autos cercanos (tráfico), y sube a la nube (cloud) lo que
              entrena modelos nuevos para la próxima actualización de software — las tres capas, siempre,
              no una eligiendo reemplazar a la otra.
            </p>
            <Caption>
              Esto mismo aparece, con otro nombre, en la arquitectura de NeoProxy: Pusher (realtime,
              latencia baja, estado efímero) y Turso (persistencia, consultado bajo demanda) no compiten
              — cada uno resuelve una capa distinta del mismo problema. Ver /experimental/anatomia.
            </Caption>
          </Panel>
        </div>

        <div id="sec-03" className={`edg-section ${visible['sec-03'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title="POR QUÉ AHORA" sub="IoT, sensores, y el volumen que no tiene sentido centralizar" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Edge computing como idea no es nueva — lo nuevo es la escala real del problema que la hizo
              indispensable: miles de millones de sensores IoT (cámaras, medidores inteligentes,
              wearables, sensores industriales) generando datos todo el tiempo, la mayoría de ellos sin
              nada interesante que reportar la mayor parte del tiempo. Mandar el 100% de ese flujo crudo
              a un datacenter central, siempre, es un desperdicio real de ancho de banda y de energía —
              no solo de dinero.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La solución real que el edge habilita es filtrar en el origen: un sensor de vibración en
              una máquina industrial puede procesar localmente y mandar a la nube solo cuando detecta una
              anomalía real, no un stream constante de números normales. El volumen de datos "interesante"
              que de verdad necesita viajar lejos termina siendo una fracción pequeña del total generado
              — el filtrado edge es lo que hace viable, en la práctica, tener sensores por todas partes
              sin que la red colapse.
            </p>
            <Caption>
              Esto conecta directo con la sección III de /archivo/cibernetica: Ashby y la "ley de la
              variedad requerida" — un sistema que procesa en el origen necesita, igual, suficiente
              variedad interna para distinguir señal de ruido antes de decidir qué vale la pena mandar.
            </Caption>
          </Panel>
        </div>

        <div id="sec-04" className={`edg-section ${visible['sec-04'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="5G Y MEC" sub="el estándar real detrás de la promesa de latencia" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Una de las promesas centrales de 5G es latencia de red de{' '}
              <strong style={{ color: '#fff' }}>~1 milisegundo</strong> (contra ~50ms típicos de 4G/LTE)
              — pero esa latencia tan baja en la red es inútil si el dato, igual, tiene que viajar cientos
              de kilómetros hasta un datacenter central y volver. El estándar real que cierra ese círculo
              es <strong style={{ color: '#fff' }}>MEC</strong> (Multi-access Edge Computing, definido
              formalmente por ETSI — el instituto europeo de estándares de telecomunicaciones — desde
              2014): colocar capacidad de cómputo real dentro de la infraestructura de la propia red
              celular, en la torre o cerca de ella, no en un datacenter lejano.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Con MEC, una aplicación puede correr literalmente a metros de la antena a la que se conectó
              el teléfono — el "último salto" de radio sigue siendo rápido por diseño de 5G, y el
              procesamiento ya no agrega la distancia que lo volvía irrelevante. Es la pieza de
              infraestructura que hace que cosas como realidad aumentada en tiempo real, vehículos
              conectados o control remoto de maquinaria sean, en los hechos, posibles sobre red celular.
            </p>
            <Caption>
              MEC no es gratis: requiere desplegar y mantener hardware de cómputo real en miles de sitios
              físicos distintos (cada torre, o cerca de ella) en vez de unos pocos datacenters — la
              sección VIII vuelve sobre ese costo real de operar así.
            </Caption>
          </Panel>
        </div>

        <div id="sec-05" className={`edg-section ${visible['sec-05'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="V" title="EDGE AI" sub="inferencia en el dispositivo, no entrenamiento" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Entrenar una red neuronal grande (ver /archivo/redes-neuronales) sigue siendo trabajo de
              datacenter — necesita enormes cantidades de datos y de cómputo concentrado. Pero una vez
              entrenada, usar esa red para hacer una predicción puntual (<strong style={{ color: '#fff' }}>
              inferencia</strong>) es mucho más barato, y cada vez más, eso corre directo en el
              dispositivo: el <strong style={{ color: '#fff' }}>Neural Engine</strong> de Apple (desde el
              A11 Bionic, 2017) procesa reconocimiento facial y de voz sin mandar nada a un servidor; la{' '}
              <strong style={{ color: '#fff' }}>Edge TPU</strong> de Google (Coral, 2019) es un chip
              dedicado, del tamaño de una moneda, pensado específicamente para correr modelos ya
              entrenados con bajísimo consumo.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              El ejemplo más exigente real es la conducción autónoma: el hardware de cómputo a bordo de
              un auto (como el FSD Computer de Tesla, con chips propios diseñados específicamente para
              ese fin) tiene que decidir en milisegundos, sin depender de que haya señal de red en ese
              instante — ahí "edge" no es una optimización de costos, es un requisito de seguridad real:
              el auto no puede esperar una respuesta de la nube para frenar.
            </p>
            <Caption>
              El costo real de mover inferencia al edge: los modelos tienen que comprimirse (cuantización,
              poda de parámetros) para correr con el presupuesto de memoria y energía de un chip chico —
              casi siempre a costa de algo de precisión frente al modelo original de datacenter.
            </Caption>
          </Panel>
        </div>

        <div id="sec-06" className={`edg-section ${visible['sec-06'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VI" title="EL CDN COMO EL EDGE COMPUTING ORIGINAL" sub="de cachear archivos a ejecutar código real" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <strong style={{ color: '#fff' }}>Akamai</strong> (fundada en 1998, a partir de
              investigación del MIT) resolvió, mucho antes de que existiera la palabra "edge computing",
              exactamente el mismo problema de fondo: poner copias de un sitio web en servidores
              distribuidos geográficamente cerca de cada usuario, en vez de servir todo desde un único
              origen lejano. Un CDN (content delivery network) clásico es, en ese sentido real, la primera
              forma masiva y exitosa de computación en el borde — aunque durante años solo sirviera
              archivos estáticos cacheados, no ejecutara lógica real.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Lo que cambió de verdad en los últimos años es que esos mismos puntos de presencia
              distribuidos empezaron a ejecutar <strong style={{ color: '#fff' }}>código real</strong>, no
              solo cachear archivos:{' '}
              <strong style={{ color: '#fff' }}>Cloudflare Workers</strong> (2017) y{' '}
              <strong style={{ color: '#fff' }}>Fastly Compute</strong> corren funciones de JavaScript o
              WebAssembly en cientos de ubicaciones a la vez, arrancando en milisegundos — la diferencia
              real con una función serverless de datacenter central no es el modelo de programación, es
              exclusivamente la distancia física al usuario.
            </p>
            <Caption>
              Vercel (donde se despliega este mismo sitio) usa exactamente esta arquitectura para su
              Edge Runtime — algunas de las rutas reales de NeoProxy (middleware.ts entre ellas) corren,
              en producción, en ese mismo modelo de ejecución distribuida.
            </Caption>
          </Panel>
        </div>

        <div id="sec-07" className={`edg-section ${visible['sec-07'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VII" title="EDGE INDUSTRIAL" sub="donde la nube no puede ser la respuesta" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              En control industrial real, el problema no es solo latencia promedio baja — es{' '}
              <strong style={{ color: '#fff' }}>determinismo</strong>: una respuesta que siempre llega
              dentro de un plazo garantizado, no "casi siempre rápido". Un PLC (controlador lógico
              programable) manejando una línea de ensamblaje, o el firmware de un marcapasos, no puede
              depender de una conexión de red que podría, en el peor momento, estar caída o congestionada.
              Esa clase de sistemas corre, por diseño, completamente local — "edge" ahí no es una elección
              de arquitectura moderna, es la única opción que siempre existió.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Lo que sí cambió con el edge computing moderno es que esos sistemas, antes aislados por
              necesidad, hoy pueden combinar ese control local determinístico con analítica real conectada
              — un gateway industrial procesa el control crítico en tiempo real localmente, y en paralelo
              manda telemetría agregada a la nube para mantenimiento predictivo, sin que una caída de
              internet afecte nunca el control real de la máquina.
            </p>
            <Caption>
              Esta es, en el fondo, la misma distinción que la sección III de /archivo/wetware hace entre
              el sistema nervioso autónomo (reflejos locales, sin pasar por el cerebro) y la decisión
              consciente — el reflejo rotuliano no espera a la nube.
            </Caption>
          </Panel>
        </div>

        <div id="sec-08" className={`edg-section ${visible['sec-08'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VIII" title="LO QUE EL EDGE NO RESUELVE SOLO" sub="el costo real de operar miles de nodos" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Mover cómputo al borde no elimina problemas de sistemas distribuidos — los multiplica por la
              cantidad de nodos reales. Actualizar software en un datacenter central es una operación;
              actualizar firmware de forma segura en diez mil dispositivos edge dispersos geográficamente,
              algunos con conectividad intermitente, es un problema de ingeniería real y mucho más difícil
              — una actualización mal aplicada puede dejar un dispositivo inaccesible físicamente para
              siempre ("bricked"), sin forma remota de arreglarlo.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La seguridad física es otro problema real que el cloud centralizado no tiene en la misma
              escala: un servidor de datacenter está detrás de controles de acceso físico serios; un
              dispositivo edge puede estar en una calle, un auto, o la casa de un usuario — accesible
              físicamente por cualquiera con intención de manipularlo. Diseñar para edge real exige asumir
              que el hardware mismo puede ser comprometido, no solo la red.
            </p>
            <Caption>
              Herramientas reales de orquestación de edge (KubeEdge, AWS Greengrass, Azure IoT Edge)
              existen específicamente para atacar el problema de gestionar miles de nodos — pero ninguna
              resuelve el problema físico de fondo, solo lo hacen más manejable.
            </Caption>
          </Panel>
        </div>

        <div id="sec-09" className={`edg-section ${visible['sec-09'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IX" title="EDGE Y FPGA" sub="dónde se cruzan de verdad" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Un chip edge real necesita tres cosas a la vez, casi siempre en tensión entre sí: bajo
              consumo de energía (muchos dispositivos edge corren a batería o con presupuesto térmico
              chico), latencia determinística (sección VII), y la capacidad de actualizarse cuando el
              algoritmo que corre encima cambia. Una CPU de propósito general cumple la tercera
              perfectamente pero es ineficiente en las dos primeras; un ASIC (chip diseñado a medida para
              una sola tarea) es excelente en las dos primeras pero no se puede modificar después de
              fabricado — si el algoritmo cambia, hay que fabricar un chip nuevo.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Una <strong style={{ color: '#fff' }}>FPGA</strong> (field-programmable gate array) es la
              respuesta real a esa tensión: silicio reconfigurable, cuya lógica interna se puede
              reprogramar por completo después de fabricado, pero que una vez configurado para una tarea
              específica corre esa tarea con la latencia determinística y el consumo de energía mucho más
              cercano al de un ASIC que al de una CPU genérica. Para inferencia de IA en el edge en
              particular, una FPGA puede implementar exactamente la arquitectura de red neuronal necesaria
              — ni más genérica (y lenta) que una CPU, ni tan rígida (y cara de iterar) como un ASIC.
            </p>
            <Caption>
              Esto es apenas la entrada a FPGA como hardware — el documento siguiente del Codex,{' '}
              <Link href="/archivo/computacion-no-convencional" style={{ color: '#fff', textDecoration: 'underline' }}>
                COMPUTACIÓN NO CONVENCIONAL
              </Link>, la trata en profundidad real: qué es por dentro, cómo se programa, y por qué es la
              plataforma de experimentación real para casi todas las arquitecturas de cómputo
              "alternativas" que existen hoy.
            </Caption>
          </Panel>
        </div>

        <div id="sec-10" className={`edg-section ${visible['sec-10'] ? 'is-visible' : ''}`} style={{ marginBottom: 0 }}>
          <SectionHeader roman="X" title="LO QUE QUEDA POR EXPLORAR" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <strong style={{ color: '#fff' }}>WebAssembly como el runtime universal del edge</strong>{' '}
              es, hoy, un problema activamente en desarrollo, no cerrado: la promesa de ejecutar el mismo
              binario compilado, con seguridad real por sandboxing, en cualquier nodo edge sin importar
              el hardware exacto detrás — el estándar WASI (WebAssembly System Interface) sigue
              evolucionando para cubrir los casos reales que esto necesita (acceso a archivos, redes,
              GPU) de forma portable.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <strong style={{ color: '#fff' }}>IA generativa corriendo local</strong> (modelos de lenguaje
              chicos pero reales ejecutándose enteros en un teléfono o una FPGA de borde, sin ninguna
              llamada a un servidor) está recién empezando a ser viable en 2024-2025 — la pregunta real
              abierta es cuánta capacidad se puede comprimir en cuánto silicio antes de que deje de ser
              útil.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Y la pregunta de orquestación sigue sin respuesta definitiva: ¿quién decide, en vivo, qué
              parte de un cómputo corre en el dispositivo, cuál en el nodo fog más cercano, y cuál sube a
              la nube? Hoy esa decisión casi siempre se programa a mano, caso por caso — un sistema real
              que decidiera eso dinámicamente, según latencia y carga medidas en el momento, es un
              problema de ingeniería todavía abierto, no resuelto por ningún estándar único.
            </p>
            <Caption>
              Es, en estructura, el mismo problema de "quién decide y con qué información" que un
              scheduler de sistema operativo resuelve para procesos en una sola máquina (ver
              /archivo/linux, sección V) — acá, sin resolver todavía, a escala de miles de máquinas
              distintas.
            </Caption>
          </Panel>
        </div>
      </div>

      <style>{`
        .edg-section { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .edg-section.is-visible { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .edg-section { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
