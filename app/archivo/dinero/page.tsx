'use client'

// NPX-ARC-07 — DINERO
// Pedido explícito: un documento de archivo sobre economía -- autores,
// consejos, protocolo, dinero, gastos, negocios, ventas. Mismo estándar
// que el resto de /archivo: separa con cuidado la economía conductual
// con premio Nobel real detrás (Kahneman, Thaler) de la literatura de
// desarrollo personal financiero sin ese mismo estándar (Kiyosaki,
// Eker) y de un modelo neurocientífico ya superado pero seguido usado
// en marketing (el "cerebro triuno" detrás de las neuroventas de
// Klarić) -- ninguno de los tres queda tratado igual, ni mejor ni peor
// de lo que el propio registro permite.
// Acento propio: dorado viejo/bronce de moneda #b8860b, distinto de los
// 15 ya usados en todo el Codex (ningún otro documento usa este tono
// -- más opaco que el ámbar del sitio #ffb800 y que el dorado cálido de
// Arcanum #c9a24d).

import { useEffect, useState } from 'react'
import Link from 'next/link'

const mono = "'Space Mono', monospace"
const ACCENT = '#b8860b'
const TEXT = '#f0e6d2'
const TEXT_DIM = '#c2b088'
const LABEL_DIM = '#7a6a40'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(10, 8, 2, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(184,134,11,0.03)`,
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
  ['I', 'sec-01', 'Qué es el dinero — historia real'],
  ['II', 'sec-02', 'La ciencia económica — lo que tiene ecuación'],
  ['III', 'sec-03', 'La psicología real del dinero — con premio Nobel'],
  ['IV', 'sec-04', 'Mentalidad de rico y pobre — Kiyosaki y Eker'],
  ['V', 'sec-05', 'Neuroventas — Klarić y el cerebro triuno'],
  ['VI', 'sec-06', 'Protocolos reales de manejo de dinero'],
  ['VII', 'sec-07', 'Negocios y ventas — lo que se calcula, no se intuye'],
  ['VIII', 'sec-08', 'Fronteras abiertas'],
]

export default function DineroPage() {
  const [visible, setVisible] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.din-section'))
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
    <div style={{ background: '#070502', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        <Link href="/knowledge" className="press tap-ext" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${ACCENT}aa`, textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← VOLVER AL CODEX
        </Link>

        {/* encabezado */}
        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${ACCENT}66`, marginBottom: 16 }}>
            NPX-ARC-07 // REFERENCIA TÉCNICA
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
            DINERO
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            ECONOMÍA, PSICOLOGÍA Y EL NEGOCIO REAL DETRÁS DEL CONSEJO POPULAR
          </div>
          <p
            style={{
              fontSize: 11.5, lineHeight: 2.1, letterSpacing: 0.3, color: TEXT_DIM, maxWidth: 660,
              borderLeft: `1px solid ${ACCENT}33`, paddingLeft: 24, marginBottom: 32,
            }}
          >
            Autores, consejos, protocolo, gastos, negocios, ventas — con el mismo cuidado que el resto
            del Codex: separar la economía conductual con premio Nobel real (Kahneman, Thaler) de la
            literatura de desarrollo personal financiero que popularizó "mentalidad de rico vs. pobre"
            (Kiyosaki, Eker), y de un modelo neurocientífico ya superado que sigue usándose en ventas
            (el cerebro triuno detrás de Klarić). Ninguno de los tres se trata igual.
          </p>

          <div
            style={{
              display: 'inline-grid', gridTemplateColumns: 'auto auto', gap: '4px 24px', fontSize: 9,
              letterSpacing: 1, color: `${ACCENT}99`, border: `1px solid ${ACCENT}33`, padding: '12px 18px',
              marginBottom: 32,
            }}
          >
            <span style={{ color: `${ACCENT}55` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>ECONOMÍA, FINANZAS PERSONALES Y NEUROVENTAS — REFERENCIA TÉCNICA</span>
            <span style={{ color: `${ACCENT}55` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — 8 SECCIONES</span>
            <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>HISTORIA → TEORÍA → CONDUCTA → DESARROLLO PERSONAL → VENTAS → PROTOCOLO → NEGOCIOS</span>
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

        {/* I. QUE ES EL DINERO */}
        <div id="sec-01" className={`din-section ${visible['sec-01'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="I" title="QUÉ ES EL DINERO — HISTORIA REAL" sub="de trueque a dinero digital, con fechas verificables" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Antes de la moneda, el trueque directo tenía un problema concreto: la "doble coincidencia
              de deseos" (que vos tengas lo que yo quiero y yo tenga, justo, lo que vos querés). Las
              primeras monedas acuñadas con un valor garantizado aparecen en Lidia, actual Turquía, hacia
              el 600 a.C. — electro (aleación natural de oro y plata) con un sello oficial que certificaba
              peso y pureza, para no tener que pesar y evaluar cada transacción desde cero.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              El patrón oro —cada moneda respaldada por una cantidad fija de oro físico— dominó buena
              parte de los siglos XIX y XX. El sistema de Bretton Woods (1944) ató el dólar al oro y el
              resto de las monedas al dólar; en 1971 Richard Nixon suspendió la convertibilidad del
              dólar a oro (el "Nixon Shock"), el golpe final a cualquier respaldo metálico en la economía
              global. Desde entonces el dinero es <strong style={{ color: '#fff' }}>fiduciario</strong>:
              vale porque un Estado lo exige para pagar impuestos y una sociedad entera acuerda aceptarlo,
              no porque haya un metal detrás.
            </p>
          </Panel>
        </div>

        {/* II. CIENCIA ECONOMICA */}
        <div id="sec-02" className={`din-section ${visible['sec-02'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="LA CIENCIA ECONÓMICA — LO QUE TIENE ECUACIÓN" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <strong style={{ color: '#fff' }}>Escasez</strong> y <strong style={{ color: '#fff' }}>costo
              de oportunidad</strong> son la base de toda la disciplina: los recursos son finitos, así que
              elegir una cosa siempre implica resignar la mejor alternativa que no elegiste — ese es el
              costo real de cualquier decisión, no solo lo que pagaste en dinero. La ley de oferta y
              demanda describe cómo el precio de equilibrio surge del cruce entre cuánto se ofrece y
              cuánto se quiere comprar a cada precio posible.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              El <strong style={{ color: '#fff' }}>interés compuesto</strong> — ganar interés sobre el
              interés ya ganado, no solo sobre el capital original — es, matemáticamente,{' '}
              <Mono>VF = C(1 + i)ⁿ</Mono>. La frase que lo llama "la octava maravilla del mundo" se le
              atribuye casi siempre a Einstein; ninguna fuente primaria confirma que él la haya dicho —
              queda citada acá por lo repetida que está, no como un dato verificado, el mismo criterio
              que ya aplica el Codex a cualquier atribución sin respaldo.
            </p>
          </Panel>
        </div>

        {/* III. PSICOLOGIA REAL */}
        <div id="sec-03" className={`din-section ${visible['sec-03'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title="LA PSICOLOGÍA REAL DEL DINERO" sub="economía conductual con premio Nobel real detrás" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Daniel Kahneman y Amos Tversky formularon en 1979 la <strong style={{ color: '#fff' }}>teoría
              de las perspectivas</strong>: las personas no evalúan el dinero en términos absolutos sino
              como ganancias o pérdidas relativas a un punto de referencia, y la{' '}
              <strong style={{ color: '#fff' }}>aversión a la pérdida</strong> hace que perder una suma
              duela psicológicamente más de lo que alegra ganar la misma suma. Kahneman ganó el Premio
              Nobel de Economía en 2002 — siendo psicólogo, no economista, el primero en lograrlo por este
              trabajo.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Richard Thaler formalizó la <strong style={{ color: '#fff' }}>contabilidad mental</strong>
              (mental accounting): tratamos mentalmente al dinero como si viniera en compartimentos
              separados según su origen o destino —el "dinero del aguinaldo" no se gasta igual que el
              "dinero del sueldo", aunque sea exactamente lo mismo en el banco— en vez de como un recurso
              fungible único. Ganó el Nobel de Economía en 2017. Esto no es consejo motivacional: es
              conducta documentada en estudios controlados, publicada y revisada por pares.
            </p>
          </Panel>
        </div>

        {/* IV. MENTALIDAD RICO POBRE */}
        <div id="sec-04" className={`din-section ${visible['sec-04'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="MENTALIDAD DE RICO Y POBRE" sub="Kiyosaki y Eker — desarrollo personal financiero, no economía académica" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Robert Kiyosaki publicó <em>Padre Rico, Padre Pobre</em> en 1997, contrastando los consejos
              de dos figuras paternas —una empleada y conservadora, otra empresaria— para argumentar que
              la diferencia entre riqueza y pobreza es, ante todo, una diferencia de educación financiera
              y de mentalidad, no de ingreso. Su <strong style={{ color: '#fff' }}>cuadrante del flujo de
              dinero</strong> divide a cualquier persona en cuatro categorías según de dónde sale su
              ingreso: Empleado, Autónomo, Dueño de negocio, Inversionista — y sostiene que las dos
              últimas son las que de verdad generan libertad financiera, porque no dependen de cambiar
              tiempo propio por dinero.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              T. Harv Eker, en <em>Los secretos de la mente millonaria</em> (2005), propone un{' '}
              <strong style={{ color: '#fff' }}>"money blueprint"</strong>: un patrón inconsciente sobre
              el dinero, formado en la infancia por lo que viste y escuchaste en tu casa, que determina
              buena parte de tus resultados financieros adultos hasta que se vuelve consciente y se
              reescribe a propósito.
            </p>
            <Caption>
              Ninguno de los dos libros es economía revisada por pares como el capítulo anterior: son
              literatura de desarrollo personal, con el objetivo declarado de motivar un cambio de
              comportamiento, no el de ser verificados estadísticamente. Periodistas y asesores
              financieros cuestionaron públicamente, más de una vez, la precisión de afirmaciones
              concretas de Kiyosaki sobre sus propias inversiones y patrimonio — el valor real de estos
              textos está en el marco motivacional que proponen, no en cada cifra o anécdota particular
              que citan.
            </Caption>
          </Panel>
        </div>

        {/* V. NEUROVENTAS */}
        <div id="sec-05" className={`din-section ${visible['sec-05'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="V" title="NEUROVENTAS — KLARIĆ Y EL CEREBRO TRIUNO" sub="un modelo neurocientífico superado, todavía muy usado en marketing" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Jürgen Klarić, en <em>Véndele a la mente, no a la gente</em> (2014) y <em>Estamos
              ciegos</em> (2012), sostiene que la mayoría de las decisiones de compra son inconscientes y
              que venderle a la razón ("la mente") convence menos que venderle a los impulsos más
              primitivos — y apoya buena parte de ese argumento en el modelo del{' '}
              <strong style={{ color: '#fff' }}>cerebro triuno</strong> de Paul MacLean (reptiliano,
              límbico, neocórtex), muy citado en marketing desde los años 90 porque ofrece una metáfora
              simple y vendible de "instinto vs. emoción vs. razón".
            </p>
            <Caption>
              El cerebro triuno ya no se sostiene como descripción literal de la evolución del cerebro
              humano: la neurociencia moderna lo considera un modelo superado — el cerebro no se
              construyó por capas que se van apilando una sobre otra en ese orden tan prolijo, y
              estructuras "límbicas" y "reptilianas" interactúan de formas mucho más integradas que la
              metáfora de las tres capas separadas. Sigue usado en marketing porque es fácil de explicar
              en una charla de ventas, no porque la neurociencia actual lo respalde — el mismo tipo de
              nota que el Codex ya hizo sobre la Teoría de la Información Integrada en{' '}
              <Link href="/archivo/cognitiva" style={{ color: '#fff', textDecoration: 'underline' }}>
                Ciencia Cognitiva
              </Link>
              : una idea con comunidad propia, cuestionada por el consenso científico más amplio.
            </Caption>
          </Panel>
        </div>

        {/* VI. PROTOCOLOS */}
        <div id="sec-06" className={`din-section ${visible['sec-06'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VI" title="PROTOCOLOS REALES DE MANEJO DE DINERO" sub="reglas prácticas con respaldo en planificación financiera, no motivacionales" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <strong style={{ color: '#fff' }}>Presupuesto 50/30/20</strong>: 50% del ingreso a
              necesidades fijas, 30% a deseos, 20% a ahorro o pago de deuda — una proporción de referencia
              popularizada por la senadora estadounidense Elizabeth Warren (entonces profesora de
              Harvard) en <em>All Your Worth</em> (2005), no una ley económica, pero una regla simple de
              punto de partida.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <strong style={{ color: '#fff' }}>Fondo de emergencia</strong>: el estándar más citado en
              planificación financiera personal es cubrir entre 3 y 6 meses de gastos fijos en un
              instrumento líquido, antes de destinar dinero a objetivos de inversión de más largo plazo.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              <strong style={{ color: '#fff' }}>Págate primero</strong> ("pay yourself first"): separar el
              ahorro apenas entra el ingreso, antes de pagar cualquier gasto, en vez de ahorrar "lo que
              sobra" al final del mes — invierte el orden habitual porque lo que sobra, en la práctica,
              casi siempre tiende a cero.
            </p>
          </Panel>
        </div>

        {/* VII. NEGOCIOS Y VENTAS */}
        <div id="sec-07" className={`din-section ${visible['sec-07'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VII" title="NEGOCIOS Y VENTAS — LO QUE SE CALCULA, NO SE INTUYE" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <strong style={{ color: '#fff' }}>Margen vs. markup</strong>, la confusión más común de
              cualquier negocio chico: margen es la ganancia como porcentaje del <em>precio de
              venta</em> (<Mono>(precio − costo) / precio</Mono>); markup es la ganancia como porcentaje
              del <em>costo</em> (<Mono>(precio − costo) / costo</Mono>). Un producto que cuesta $100 y se
              vende a $150 tiene un markup del 50% pero un margen del 33% — son números distintos sobre
              la misma venta, y confundirlos hace que un negocio crea que gana más de lo que gana en
              realidad.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <strong style={{ color: '#fff' }}>Punto de equilibrio</strong> (break-even): la cantidad de
              ventas a partir de la cual los ingresos cubren todos los costos fijos y variables — antes de
              ese punto, cada venta deja al negocio más cerca de no perder plata; después, cada venta es
              ganancia real.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              En negocios digitales/startups, dos métricas gobiernan casi toda decisión de inversión en
              ventas: <strong style={{ color: '#fff' }}>LTV</strong> (lifetime value, cuánto deja un
              cliente en total mientras sigue siendo cliente) y <strong style={{ color: '#fff' }}>CAC</strong>
              (costo de adquisición, cuánto cuesta conseguir ese cliente). Si CAC se acerca o supera a
              LTV, el negocio está pagando más por cada cliente de lo que ese cliente deja — sin importar
              cuántas ventas totales se hagan.
            </p>
          </Panel>
        </div>

        {/* VIII. FRONTERAS ABIERTAS */}
        <div id="sec-08" className={`din-section ${visible['sec-08'] ? 'is-visible' : ''}`} style={{ marginBottom: 40 }}>
          <SectionHeader roman="VIII" title="FRONTERAS ABIERTAS" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Este documento junta, a propósito, tres niveles de evidencia distintos bajo un mismo tema:
              economía conductual con Nobel y revisión por pares (Kahneman, Thaler), literatura de
              desarrollo personal financiero sin ese mismo estándar pero con influencia real y masiva
              (Kiyosaki, Eker), y un modelo neurocientífico que la ciencia actual considera superado pero
              que sigue vendiendo libros y charlas (el cerebro triuno detrás de Klarić). Mezclarlos sin
              avisar sería deshonesto; separarlos del todo perdería lo que de verdad pasó: los tres
              influyeron, en la práctica, en cómo millones de personas piensan su propio dinero, con
              independencia de cuánto respaldo científico tenga cada uno.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La pregunta que sigue abierta, la más vieja de la economía, es también la más nueva: qué es
              el valor y de dónde sale.{' '}
              <Link href="/knowledge?entry=zuboff" style={{ color: '#fff', textDecoration: 'underline' }}>
                Shoshana Zuboff
              </Link>
              , ya en este Codex, describe una economía donde la materia prima ya no es tu trabajo ni tu
              dinero sino tu comportamiento futuro — el mismo linaje de pregunta que corre desde las
              monedas de Lidia, con una respuesta cada vez más incómoda.
            </p>
          </Panel>
        </div>

        {/* footer */}
        <div style={{ marginTop: 100, paddingTop: 28, borderTop: `1px solid ${ACCENT}22` }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}44` }}>
            NPX-ARC-07 // REFERENCIA TÉCNICA DEL CODEX
          </div>
        </div>
      </div>

      <style>{`
        .din-section { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .din-section.is-visible { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .din-section { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: mono, color: '#00ffcc', letterSpacing: 0.5 }}>{children}</span>
}
