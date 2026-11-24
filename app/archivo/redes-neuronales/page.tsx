'use client'

// NPX-ARC-14 — REDES NEURONALES ARTIFICIALES
// Pedido explícito: extenso, riguroso, detallista, estilo NeoProxy --
// funcionamiento, tipos, orígenes, hasta ahora y futuro. McCulloch,
// Perceptrón, Transformer y Hopfield ya eran entradas reales de
// components/knowledge/entries.ts sin documento de archivo que las
// agrupara -- mismo patrón que Autoorganización y Cibernética en esta
// misma sesión. Mismo estándar de rigor que el resto del Codex: separa
// lo técnicamente sólido (cómo funciona una neurona, backprop, los tipos
// de arquitectura) de lo que sigue siendo debate real y abierto (si
// escalar basta para llegar a inteligencia general), y marca con cuidado
// dónde la metáfora biológica del nombre "neuronal" se simplifica.
// Acento propio: gris-azul acero #8fa3b0, distinto de los 23 ya usados
// en el resto del Codex.

import { useEffect, useState } from 'react'
import Link from 'next/link'

const mono = "'Space Mono', monospace"
const ACCENT = '#8fa3b0'
const TEXT = '#e4ecf0'
const TEXT_DIM = '#b8c8d0'
const LABEL_DIM = '#6a7a82'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(6, 10, 12, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(143,163,176,0.03)`,
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

function Mono({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: mono, color: '#9ad8ff', letterSpacing: 0.5 }}>{children}</span>
}

const TOC: [string, string, string][] = [
  ['I', 'sec-01', 'Orígenes — McCulloch, Pitts y el Perceptrón'],
  ['II', 'sec-02', 'El invierno de la IA — Minsky y Papert'],
  ['III', 'sec-03', 'Cómo funciona una neurona artificial'],
  ['IV', 'sec-04', 'Retropropagación — lo que hizo entrenable al campo'],
  ['V', 'sec-05', 'Tipos de red — MLP, CNN, RNN, LSTM'],
  ['VI', 'sec-06', 'Transformers — atención en vez de recurrencia'],
  ['VII', 'sec-07', 'Paradigmas de aprendizaje'],
  ['VIII', 'sec-08', 'Redes generativas — de las GAN a la difusión'],
  ['IX', 'sec-09', 'Hopfield y la memoria asociativa'],
  ['X', 'sec-10', 'La metáfora biológica, con honestidad'],
  ['XI', 'sec-11', 'Hasta ahora y el futuro real del campo'],
  ['XII', 'sec-12', 'Resonancia con NeoProxy'],
]

export default function RedesNeuronalesPage() {
  const [visible, setVisible] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.rna-section'))
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
    <div style={{ background: '#050708', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        <Link href="/knowledge" className="press" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${ACCENT}aa`, textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← VOLVER AL CODEX
        </Link>

        {/* encabezado */}
        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${ACCENT}66`, marginBottom: 16 }}>
            NPX-ARC-14 // REFERENCIA TÉCNICA
          </div>
          <h1
            style={{
              fontSize: 'clamp(26px, 5.4vw, 40px)',
              fontWeight: 700,
              letterSpacing: 5,
              color: ACCENT,
              textShadow: `0 0 40px ${ACCENT}55`,
              marginBottom: 14,
              lineHeight: 1.1,
            }}
          >
            REDES NEURONALES ARTIFICIALES
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 2.5, color: TEXT_DIM, marginBottom: 32 }}>
            FUNCIONAMIENTO, TIPOS, ORÍGENES, HASTA AHORA Y EL FUTURO REAL DEL CAMPO
          </div>
          <p
            style={{
              fontSize: 11.5, lineHeight: 2.1, letterSpacing: 0.3, color: TEXT_DIM, maxWidth: 680,
              borderLeft: `1px solid ${ACCENT}33`, paddingLeft: 24, marginBottom: 32,
            }}
          >
            De la primera neurona matemática de 1943 a la arquitectura que corre, ahora mismo, en el
            modelo que escribe este documento — con el mismo cuidado del resto del Codex: lo que es
            ingeniería sólida y verificable (cómo funciona una neurona, por qué entrena una red)
            tratado distinto de lo que sigue siendo debate real, sin consenso, entre investigadores
            serios.
          </p>

          <div
            style={{
              display: 'inline-grid', gridTemplateColumns: 'auto auto', gap: '4px 24px', fontSize: 9,
              letterSpacing: 1, color: `${ACCENT}99`, border: `1px solid ${ACCENT}33`, padding: '12px 18px',
              marginBottom: 32,
            }}
          >
            <span style={{ color: `${ACCENT}55` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>APRENDIZAJE AUTOMÁTICO, HISTORIA DE LA COMPUTACIÓN — REFERENCIA TÉCNICA</span>
            <span style={{ color: `${ACCENT}55` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — 12 SECCIONES</span>
            <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>1943 → INVIERNO DE LA IA → BACKPROP → TRANSFORMERS → NOBEL 2024 → FUTURO ABIERTO</span>
          </div>

          <nav style={{ border: `1px solid ${ACCENT}22`, padding: '20px 24px', maxWidth: 700 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}66`, marginBottom: 14 }}>
              ÍNDICE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '6px 20px' }}>
              {TOC.map(([roman, id, label]) => (
                <a key={id} href={`#${id}`} style={{ fontSize: 10.5, color: TEXT_DIM, textDecoration: 'none', display: 'flex', gap: 10 }}>
                  <span style={{ color: `${ACCENT}88`, width: 28, flexShrink: 0 }}>{roman}</span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </nav>
        </div>

        {/* I. ORIGENES */}
        <div id="sec-01" className={`rna-section ${visible['sec-01'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="I" title="ORÍGENES — MCCULLOCH, PITTS Y EL PERCEPTRÓN" sub="1943 y 1958 — antes de que existiera el término 'inteligencia artificial'" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <Link href="/knowledge?entry=mcculloch" style={{ color: '#fff', textDecoration: 'underline' }}>Warren McCulloch</Link> (neurofisiólogo,
              ya entrada real de este Codex) y Walter Pitts (lógico, entonces adolescente) publicaron
              en 1943 "A Logical Calculus of the Ideas Immanent in Nervous Activity": el primer modelo
              matemático de una neurona, reducida a una unidad binaria que se activa o no según si la
              suma de sus entradas supera un umbral. No pretendía simular un cerebro — era, ante todo, un
              argumento lógico: que una red de esas unidades simples podía, en principio, computar
              cualquier función expresable en lógica proposicional. Es, literalmente, anterior al
              nacimiento formal del campo que hoy llamamos inteligencia artificial, acuñado recién en la
              conferencia de Dartmouth de 1956.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Frank Rosenblatt, psicólogo de Cornell, dio el siguiente paso real en 1958 con el{' '}
              <Link href="/knowledge?entry=perceptron" style={{ color: '#fff', textDecoration: 'underline' }}>
                Perceptrón
              </Link>
              : a diferencia del modelo de McCulloch-Pitts, que no se entrenaba (sus pesos se fijaban a
              mano), el Perceptrón incorporaba una regla de aprendizaje real — ajustar los pesos de cada
              entrada en función del error cometido, repetido ejemplo por ejemplo hasta converger. Era,
              por primera vez, una máquina que aprendía de datos en vez de ejecutar reglas programadas de
              antemano, y la prensa de la época (incluido el New York Times) lo cubrió con un entusiasmo
              que, en retrospectiva, se adelantó varias décadas a lo que la tecnología de ese momento
              realmente podía sostener.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Ese entusiasmo temprano, y el freno real que vino después, es el tema de la sección
              siguiente.
            </p>
          </Panel>
        </div>

        {/* II. INVIERNO DE LA IA */}
        <div id="sec-02" className={`rna-section ${visible['sec-02'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="EL INVIERNO DE LA IA" sub="Minsky y Papert, 1969 — un freno real, no una leyenda" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Marvin Minsky y Seymour Papert publicaron en 1969 el libro <em>Perceptrons</em>, con una
              demostración matemática rigurosa y difícil de discutir: el perceptrón simple, de una sola
              capa, es incapaz de resolver problemas que no son linealmente separables — es decir, que no
              se pueden dividir con una sola línea (o un solo plano, en más dimensiones) entre una clase y
              otra. El ejemplo canónico es la función lógica XOR ("o exclusivo"): no existe ninguna línea
              recta que separe correctamente sus cuatro combinaciones posibles de entrada en las dos
              salidas correctas.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              La demostración en sí no era un callejón sin salida —apilar varias capas sí puede resolver
              XOR, algo que los propios autores sabían— pero no existía todavía, en 1969, un método
              práctico y eficiente para entrenar más de una capa. El resultado fue un freno real y
              documentado en la historia del campo: buena parte de la financiación y el interés académico
              en redes neuronales se secó por más de una década, desplazándose hacia otros enfoques de
              inteligencia artificial basados en reglas simbólicas explícitas.
            </p>
            <Caption>
              Es un error común (y falso) tratar esto como si Minsky y Papert hubieran "matado" a las
              redes neuronales por error o mala fe. Su matemática era correcta; lo que faltaba era el
              método de entrenamiento multicapa de la sección IV, todavía sin resolver de forma práctica
              en ese momento.
            </Caption>
          </Panel>
        </div>

        {/* III. COMO FUNCIONA */}
        <div id="sec-03" className={`rna-section ${visible['sec-03'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title="CÓMO FUNCIONA UNA NEURONA ARTIFICIAL" sub="la pieza mínima de todo lo que sigue" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Una neurona artificial hace, en esencia, dos operaciones en orden. Primero, una{' '}
              <strong style={{ color: '#fff' }}>suma ponderada</strong>: cada entrada se multiplica por un
              peso propio (un número que la red ajusta durante el entrenamiento) y se suman todos esos
              productos, más un término adicional llamado <strong style={{ color: '#fff' }}>sesgo</strong>{' '}
              (bias), que permite desplazar el punto en el que la neurona empieza a activarse. En notación
              simple: <Mono>z = (w₁x₁ + w₂x₂ + ... + wₙxₙ) + b</Mono>.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Segundo, ese resultado <Mono>z</Mono> pasa por una{' '}
              <strong style={{ color: '#fff' }}>función de activación no lineal</strong> — históricamente
              la sigmoide (aplasta cualquier valor entre 0 y 1) o la tangente hiperbólica, y en la
              práctica moderna casi siempre ReLU (<Mono>f(z) = max(0, z)</Mono>, cero para cualquier
              entrada negativa, la misma entrada sin cambios si es positiva), preferida hoy por ser más
              simple de calcular y por entrenar mejor en redes profundas.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La no linealidad no es un detalle técnico menor: es la pieza que hace que apilar capas
              tenga sentido. Sin ella, cualquier cantidad de capas de sumas ponderadas se podría colapsar,
              matemáticamente, en una sola transformación lineal equivalente — y una transformación lineal
              nunca puede aprender una función tan simple como XOR (sección II). La no linealidad es lo
              que le da a una red profunda una capacidad de representación genuinamente mayor que la de
              una red de una sola capa.
            </p>
          </Panel>
        </div>

        {/* IV. BACKPROP */}
        <div id="sec-04" className={`rna-section ${visible['sec-04'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="RETROPROPAGACIÓN — LO QUE HIZO ENTRENABLE AL CAMPO" sub="Rumelhart, Hinton y Williams, 1986 (con antecedentes en Werbos, años 70)" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              La <strong style={{ color: '#fff' }}>retropropagación</strong> (backpropagation) resuelve el
              problema práctico que el invierno de la IA había dejado pendiente: cómo ajustar los pesos de
              una red con varias capas ocultas, no solo una. La idea, popularizada en un paper de 1986 de
              David Rumelhart, Geoffrey Hinton y Ronald Williams —aunque la matemática de base, aplicar la
              regla de la cadena del cálculo diferencial para propagar el error desde la salida hacia
              atrás, capa por capa, tiene antecedentes menos conocidos y más tempranos, incluido trabajo
              de Paul Werbos en los años 70— consiste en calcular cuánto contribuyó cada peso individual
              al error final, y corregirlo en la dirección que reduce ese error, un poco en cada paso.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Esto no fue solamente una idea matemática elegante: fue lo que convirtió a las redes
              neuronales en algo entrenable en la práctica, a escala, por primera vez. Sin un método
              eficiente para calcular ese gradiente del error capa por capa, entrenar una red de más de
              una o dos capas era computacionalmente inviable. Backpropagation sigue siendo, casi cuarenta
              años después, el método base sobre el que se entrena la inmensa mayoría de las redes que
              existen hoy, incluidas las de la sección VI.
            </p>
          </Panel>
        </div>

        {/* V. TIPOS DE RED */}
        <div id="sec-05" className={`rna-section ${visible['sec-05'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="V" title="TIPOS DE RED — MLP, CNN, RNN, LSTM" sub="cuatro arquitecturas, cuatro problemas distintos que resolver" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              El <strong style={{ color: '#fff' }}>perceptrón multicapa</strong> (MLP) es la arquitectura
              feedforward más básica: varias capas de neuronas como las de la sección III, cada una
              conectada por completo a la siguiente, la información fluyendo siempre hacia adelante sin
              ciclos. Funciona bien para datos sin estructura espacial o temporal obvia, pero escala mal
              cuando la entrada es, por ejemplo, una imagen de miles de píxeles: cada conexión completa
              entre capas crecería a un número de parámetros poco práctico.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Las <strong style={{ color: '#fff' }}>redes convolucionales</strong> (CNN) resuelven
              exactamente ese problema, con contribuciones reales de Yann LeCun desde fines de los años 80
              (la arquitectura LeNet, aplicada originalmente a reconocer dígitos escritos a mano para
              lectura automática de cheques bancarios): en vez de conectar cada neurona con cada píxel,
              aplican un mismo filtro pequeño —compartido, reutilizado— que se desliza sobre toda la
              imagen, detectando el mismo patrón local (un borde, una textura) sin importar en qué parte
              de la imagen aparezca. Esa idea de peso compartido es la que hizo viable, computacionalmente,
              trabajar con imágenes de alta resolución.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Las <strong style={{ color: '#fff' }}>redes recurrentes</strong> (RNN) están diseñadas para
              datos secuenciales —texto, audio, series de tiempo— manteniendo una especie de memoria
              interna que se actualiza paso a paso a medida que la secuencia avanza. El problema práctico
              real que arrastran es el <strong style={{ color: '#fff' }}>gradiente que se desvanece</strong>:
              en secuencias largas, la señal de error que debería viajar hacia atrás muchos pasos en el
              tiempo se vuelve, numéricamente, cada vez más chica hasta desaparecer, y la red pierde la
              capacidad de aprender dependencias lejanas en el tiempo.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La solución real a ese problema específico fue <strong style={{ color: '#fff' }}>LSTM</strong>{' '}
              (Long Short-Term Memory), propuesta por Sepp Hochreiter y Jürgen Schmidhuber en 1997: una
              variante de RNN con compuertas internas explícitas que decide, en cada paso, qué información
              vale la pena conservar en la memoria de largo plazo y qué se puede olvidar — un mecanismo
              diseñado a propósito para que el gradiente pueda viajar distancias mucho mayores sin
              desvanecerse.
            </p>
          </Panel>
        </div>

        {/* VI. TRANSFORMERS */}
        <div id="sec-06" className={`rna-section ${visible['sec-06'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VI" title="TRANSFORMERS — ATENCIÓN EN VEZ DE RECURRENCIA" sub="Vaswani et al., 'Attention Is All You Need', 2017" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              El paper{' '}
              <Link href="/knowledge?entry=transformer" style={{ color: '#fff', textDecoration: 'underline' }}>
                "Attention Is All You Need"
              </Link>{' '}
              (Ashish Vaswani y colegas, Google, 2017) propuso reemplazar por completo la recurrencia de
              las RNN/LSTM por un <strong style={{ color: '#fff' }}>mecanismo de atención</strong>: en vez
              de procesar una secuencia paso a paso, guardando memoria del pasado, el modelo mira la
              secuencia entera de una sola vez y aprende a pesar qué tan relevante es cada posición
              respecto de cada otra posición, en paralelo, sin importar qué tan lejos estén entre sí.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La consecuencia práctica fue enorme: al no depender de un procesamiento secuencial paso a
              paso, el entrenamiento se puede paralelizar de forma masiva en hardware moderno (GPUs/TPUs),
              algo que las RNN, por su naturaleza secuencial, no permitían con la misma eficiencia. Esta
              es, de manera literal y sin exagerar, la arquitectura detrás de los modelos de lenguaje que
              existen hoy — incluido el modelo que redactó este mismo documento.
            </p>
          </Panel>
        </div>

        {/* VII. PARADIGMAS */}
        <div id="sec-07" className={`rna-section ${visible['sec-07'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VII" title="PARADIGMAS DE APRENDIZAJE" sub="tres formas distintas de que una red aprenda algo" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              El <strong style={{ color: '#fff' }}>aprendizaje supervisado</strong> entrena con ejemplos
              que ya tienen la respuesta correcta conocida (una imagen etiquetada "gato", un email
              etiquetado "spam") — la red ajusta sus pesos para minimizar el error respecto de esas
              etiquetas reales. El <strong style={{ color: '#fff' }}>no supervisado</strong> trabaja sin
              ninguna etiqueta: busca estructura o patrones por sí solo, como agrupar datos similares
              entre sí (clustering) sin que nadie le haya dicho de antemano cuáles son los grupos
              correctos.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              El <strong style={{ color: '#fff' }}>aprendizaje por refuerzo</strong> no usa ejemplos
              etiquetados ni busca estructura oculta: un agente toma acciones en un entorno y recibe una
              señal de recompensa o castigo, ajustando su comportamiento para maximizar la recompensa
              acumulada en el tiempo. El hito público más citado de este paradigma es real y verificable:
              AlphaGo, de DeepMind, venciendo al campeón Lee Sedol en Go en 2016 — un juego que, por su
              espacio de posibilidades casi incalculable, se consideraba durante décadas fuera del alcance
              de la fuerza bruta computacional pura.
            </p>
          </Panel>
        </div>

        {/* VIII. GENERATIVAS */}
        <div id="sec-08" className={`rna-section ${visible['sec-08'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VIII" title="REDES GENERATIVAS — DE LAS GAN A LA DIFUSIÓN" sub="Goodfellow et al., 2014 — y el cambio real de paradigma desde 2020-2022" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Ian Goodfellow y colegas propusieron en 2014 las{' '}
              <strong style={{ color: '#fff' }}>GAN</strong> (Generative Adversarial Networks, redes
              generativas antagónicas): dos redes entrenadas juntas y enfrentadas, una{' '}
              <strong style={{ color: '#fff' }}>generadora</strong> que intenta producir datos sintéticos
              cada vez más convincentes, y una <strong style={{ color: '#fff' }}>discriminadora</strong>{' '}
              que intenta distinguir lo real de lo generado — ambas mejorando por la presión constante de
              la otra, en una competencia de suma cero que, bien entrenada, termina produciendo
              generaciones difíciles de distinguir de datos reales.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Desde aproximadamente 2020-2022, la generación de imágenes migró en la práctica comercial
              hacia los <strong style={{ color: '#fff' }}>modelos de difusión</strong>: en vez de una
              competencia adversaria, aprenden a revertir, paso a paso, un proceso de agregado de ruido
              progresivo sobre una imagen, hasta poder generar una imagen nueva a partir de ruido puro.
              DALL-E 2, Stable Diffusion y Midjourney son ejemplos reales y verificables de esa transición
              — en la mayoría de aplicaciones comerciales de imagen actuales, la difusión superó en
              calidad y estabilidad de entrenamiento a las GAN, que hoy se usan menos para ese fin
              específico.
            </p>
          </Panel>
        </div>

        {/* IX. HOPFIELD */}
        <div id="sec-09" className={`rna-section ${visible['sec-09'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IX" title="HOPFIELD Y LA MEMORIA ASOCIATIVA" sub="1982 — y el Nobel de Física 2024" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              John Hopfield propuso en 1982 un tipo de red muy distinto de todo lo anterior en este
              documento: una <strong style={{ color: '#fff' }}>red de memoria asociativa</strong>,
              inspirada directamente en la física estadística de sistemas de espines magnéticos (el modelo
              de Ising). En vez de aprender a mapear una entrada a una salida, una red de Hopfield
              almacena patrones completos y, dada una versión parcial o ruidosa de uno de esos patrones,
              converge hacia la versión completa y limpia almacenada más parecida — una memoria que se
              reconstruye a sí misma, no que se busca en una tabla.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              En 2024, John{' '}
              <Link href="/knowledge?entry=hopfield" style={{ color: '#fff', textDecoration: 'underline' }}>
                Hopfield
              </Link>{' '}
              y Geoffrey Hinton recibieron juntos el Premio Nobel de Física, citados explícitamente por
              sus contribuciones fundacionales al aprendizaje automático con redes neuronales artificiales
              —el comité destacó en particular el uso de herramientas y conceptos de la física estadística
              para construir estos modelos—, un reconocimiento notable viniendo del campo de física antes
              que del de computación, y un dato muy reciente que vale la pena verificar en su fuente
              oficial antes de citarlo con más detalle del que aquí se afirma.
            </p>
          </Panel>
        </div>

        {/* X. METAFORA BIOLOGICA */}
        <div id="sec-10" className={`rna-section ${visible['sec-10'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="X" title="LA METÁFORA BIOLÓGICA, CON HONESTIDAD" sub="el nombre es real, la fidelidad biológica no tanto" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              El nombre "red neuronal" no es puro marketing: McCulloch era neurofisiólogo y el modelo de
              1943 (sección I) sí partió de pensar cómo se activa o no una neurona biológica real. Pero la
              distancia entre una neurona artificial —una suma ponderada y una función no lineal, sección
              III— y una neurona biológica real es enorme.
            </p>
            <Caption>
              Una neurona biológica tiene miles de dendritas con geometría propia, se comunica con
              decenas de neurotransmisores químicos distintos (no un solo número), cambia físicamente su
              propia estructura sináptica con la experiencia (plasticidad), y opera en el tiempo de forma
              continua, no en pasos discretos sincronizados como una red artificial. Para el detalle real
              de cómo funciona una neurona biológica, ver{' '}
              <Link href="/archivo/mente" style={{ color: '#fff', textDecoration: 'underline' }}>
                /archivo/mente
              </Link>
              . Una red neuronal artificial es una abstracción matemática útil para aprender funciones
              complejas de datos — no un modelo biológicamente fiel del cerebro, y presentarla como tal
              sería, directamente, impreciso.
            </Caption>
          </Panel>
        </div>

        {/* XI. HASTA AHORA Y FUTURO */}
        <div id="sec-11" className={`rna-section ${visible['sec-11'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="XI" title="HASTA AHORA Y EL FUTURO REAL DEL CAMPO" sub="escala sin precedente histórico — y un debate real, sin resolver" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Los modelos actuales operan a una escala sin precedente histórico: desde cientos de miles de
              millones hasta billones de parámetros, entrenados con volúmenes de datos y de cómputo que no
              tienen comparación con nada anterior a esta década. Líneas de investigación activas y reales
              incluyen arquitecturas de <strong style={{ color: '#fff' }}>mixture-of-experts</strong>{' '}
              (activar solo una fracción de la red para cada entrada, en vez de toda ella, para ganar
              eficiencia sin perder capacidad), técnicas de razonamiento explícito en varios pasos antes de
              responder, y modelos genuinamente multimodales que integran texto, imagen, audio y video
              dentro de una misma arquitectura entrenada en conjunto.
            </p>
            <Caption>
              Si simplemente escalar estas arquitecturas —más datos, más parámetros, más cómputo— basta
              por sí solo para llegar a algo parecido a una inteligencia general es un debate real y
              abierto entre investigadores serios del campo, sin consenso en ninguna dirección. Este
              documento no toma partido en esa pregunta: la registra como abierta porque lo está,
              verificablemente, hoy.
            </Caption>
          </Panel>
        </div>

        {/* XII. RESONANCIA */}
        <div id="sec-12" className={`rna-section ${visible['sec-12'] ? 'is-visible' : ''}`} style={{ marginBottom: 0 }}>
          <SectionHeader roman="XII" title="RESONANCIA CON NEOPROXY" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              McCulloch,{' '}
              <Link href="/knowledge?entry=perceptron" style={{ color: '#fff', textDecoration: 'underline' }}>Perceptrón</Link>,{' '}
              <Link href="/knowledge?entry=transformer" style={{ color: '#fff', textDecoration: 'underline' }}>Transformer</Link>{' '}
              y{' '}
              <Link href="/knowledge?entry=hopfield" style={{ color: '#fff', textDecoration: 'underline' }}>Hopfield</Link>{' '}
              ya eran entradas reales de este Codex, sembradas sin que ningún documento las agrupara —el
              mismo patrón que ya tuvieron Autoorganización y Cibernética antes de este documento.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Y la sección VI no es solo historia: el chat de /proxyverse y la Segunda Mente del panel de
              DarkProxy corren, en este mismo instante en que alguien lee esto, sobre exactamente esa
              arquitectura — atención en vez de recurrencia, la misma que describió el paper de 2017.
            </p>
          </Panel>
        </div>

        {/* footer */}
        <div style={{ marginTop: 100, paddingTop: 28, borderTop: `1px solid ${ACCENT}22` }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}44` }}>
            NPX-ARC-14 // REFERENCIA TÉCNICA DEL CODEX
          </div>
        </div>
      </div>

      <style>{`
        .rna-section { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .rna-section.is-visible { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .rna-section { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
