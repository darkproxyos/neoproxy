'use client'

// NPX-ARC-13 — COMPUTACIÓN CUÁNTICA
// Pedido explícito: extenso, riguroso, detallista. Campo con mucho hype
// mediático real -- cada sección separa con cuidado (a) física/matemática
// sólidamente establecida (secciones I-IV, VII), de (b) resultados
// experimentales reales pero con controversia real documentada (sección
// VI, "supremacía cuántica"), de (c) anuncios comerciales recientes que
// la comunidad todavía debate (sección V, el chip topológico de
// Microsoft). Ninguno de los tres se presenta con el mismo peso.
// Acento propio: azul marino profundo #1b3a6b, distinto de todos los
// usados en el resto del Codex (ni el cian de Partículas #5fd4ff, ni el
// índigo de Cibernética #3a4ba0 -- este es más oscuro y más apagado que
// ambos).

import { useEffect, useState } from 'react'
import Link from 'next/link'

const mono = "'Space Mono', monospace"
const ACCENT = '#1b3a6b'
const ACCENT_BRIGHT = '#4d7fc9'
const TEXT = '#dce8f5'
const TEXT_DIM = '#aec0d8'
const LABEL_DIM = '#5a7596'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(4, 8, 16, 0.6)',
        border: `1px solid ${ACCENT_BRIGHT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT_BRIGHT}11, inset 0 0 40px rgba(27,58,107,0.08)`,
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
        <span style={{ fontSize: 13, color: `${ACCENT_BRIGHT}66`, letterSpacing: 2 }}>{roman}</span>
        <h2
          style={{
            fontSize: 'clamp(18px, 3vw, 24px)',
            letterSpacing: 5,
            color: ACCENT_BRIGHT,
            textShadow: `0 0 24px ${ACCENT_BRIGHT}44`,
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
    <div style={{
      fontSize: 11, lineHeight: 1.8, letterSpacing: 0.5, color: LABEL_DIM, marginTop: 14,
      borderLeft: `2px solid ${ACCENT_BRIGHT}33`, paddingLeft: 12,
    }}>
      {children}
    </div>
  )
}

const TOC: [string, string, string][] = [
  ['I', 'sec-01', 'El bit clásico vs. el qubit — superposición'],
  ['II', 'sec-02', 'Entrelazamiento — de Einstein a Zeilinger'],
  ['III', 'sec-03', 'Puertas cuánticas y circuitos'],
  ['IV', 'sec-04', 'Algoritmos con ventaja demostrada — Shor y Grover'],
  ['V', 'sec-05', 'Arquitecturas de hardware real — y el debate topológico'],
  ['VI', 'sec-06', 'Supremacía cuántica — un término contestado'],
  ['VII', 'sec-07', 'El problema real — corrección de errores'],
  ['VIII', 'sec-08', 'Qué NO es la computación cuántica'],
  ['IX', 'sec-09', 'Dónde estamos — la era NISQ'],
  ['X', 'sec-10', 'Resonancia con NeoProxy'],
]

export default function ComputacionCuanticaPage() {
  const [visible, setVisible] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.cuant-section'))
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
    <div style={{ background: '#030509', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        <Link href="/knowledge" className="press tap-ext" style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 3, color: `${ACCENT_BRIGHT}aa`, textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← VOLVER AL CODEX
        </Link>

        {/* encabezado */}
        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 6, color: `${ACCENT_BRIGHT}66`, marginBottom: 16 }}>
            NPX-ARC-13 // REFERENCIA TÉCNICA
          </div>
          <h1
            style={{
              fontSize: 'clamp(26px, 5.5vw, 40px)',
              fontWeight: 700,
              letterSpacing: 4,
              color: ACCENT_BRIGHT,
              textShadow: `0 0 40px ${ACCENT_BRIGHT}55`,
              marginBottom: 14,
              lineHeight: 1.1,
            }}
          >
            COMPUTACIÓN CUÁNTICA
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 2, color: TEXT_DIM, marginBottom: 32 }}>
            QUBITS, ENTRELAZAMIENTO Y POR QUÉ TODAVÍA NO EXISTE UNA MÁQUINA ÚTIL A GRAN ESCALA
          </div>
          <p
            style={{
              fontSize: 12.5, lineHeight: 2.1, letterSpacing: 0.3, color: TEXT_DIM, maxWidth: 680,
              borderLeft: `1px solid ${ACCENT_BRIGHT}33`, paddingLeft: 24, marginBottom: 32,
            }}
          >
            Pocos campos tienen tanta distancia entre lo que se anuncia en un titular y lo que la física
            realmente puede sostener hoy. Este documento separa, sección por sección, la matemática ya
            demostrada (secciones I-IV, VII) de los resultados experimentales reales pero disputados
            (sección VI) y de los anuncios comerciales que la propia comunidad de física todavía discute
            (sección V) — sin bajarle el rigor a ninguno de los tres, pero sin tratarlos como si pesaran
            lo mismo.
          </p>

          <div
            style={{
              display: 'inline-grid', gridTemplateColumns: 'auto auto', gap: '4px 24px', fontSize: 10.5,
              letterSpacing: 1, color: `${ACCENT_BRIGHT}99`, border: `1px solid ${ACCENT_BRIGHT}33`, padding: '12px 18px',
              marginBottom: 32,
            }}
          >
            <span style={{ color: `${ACCENT_BRIGHT}55` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>FÍSICA CUÁNTICA, CIENCIA DE LA COMPUTACIÓN — REFERENCIA TÉCNICA</span>
            <span style={{ color: `${ACCENT_BRIGHT}55` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — 10 SECCIONES</span>
            <span style={{ color: `${ACCENT_BRIGHT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>QUBIT → ENTRELAZAMIENTO → ALGORITMOS → HARDWARE → ESTADO ACTUAL REAL</span>
          </div>

          <nav style={{ border: `1px solid ${ACCENT_BRIGHT}22`, padding: '20px 24px', maxWidth: 700 }}>
            <div style={{ fontSize: 10.5, letterSpacing: 3, color: `${ACCENT_BRIGHT}66`, marginBottom: 14 }}>
              ÍNDICE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '6px 20px' }}>
              {TOC.map(([roman, id, label]) => (
                <a key={id} href={`#${id}`} style={{ fontSize: 11.5, color: TEXT_DIM, textDecoration: 'none', display: 'flex', gap: 10, padding: '7px 0' }}>
                  <span style={{ color: `${ACCENT_BRIGHT}88`, width: 28, flexShrink: 0 }}>{roman}</span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </nav>
        </div>

        {/* I. QUBIT */}
        <div id="sec-01" className={`cuant-section ${visible['sec-01'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="I" title="EL BIT CLÁSICO VS. EL QUBIT" sub="superposición — física establecida, sin controversia" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Un bit clásico vale 0 o 1, siempre, en cualquier momento en que se lo consulte — es un
              interruptor con dos posiciones y nada intermedio. Un <strong style={{ color: '#fff' }}>qubit</strong>{' '}
              (quantum bit) puede existir en una <strong style={{ color: '#fff' }}>superposición</strong>:
              una combinación lineal de los estados |0⟩ y |1⟩, matemáticamente escrita como{' '}
              <span style={{ color: ACCENT_BRIGHT }}>α|0⟩ + β|1⟩</span>, donde α y β son números complejos
              (las "amplitudes") cuyos módulos al cuadrado dan la probabilidad de obtener 0 o 1 si se mide
              el qubit en ese instante — y esas probabilidades tienen que sumar exactamente 1 (|α|² + |β|²
              = 1). No es que el qubit "sea 0 y 1 a la vez" en un sentido literal y cómodo de imaginar: es
              que su estado real, antes de medir, es ese vector en un espacio de dos dimensiones complejas,
              y la medición lo colapsa a uno de los dos resultados clásicos de forma irreversible.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              La representación geométrica estándar de un único qubit es la{' '}
              <strong style={{ color: '#fff' }}>esfera de Bloch</strong>: cualquier estado puro de un qubit
              corresponde a un punto en la superficie de una esfera de radio 1, con los polos norte y sur
              representando los estados clásicos |0⟩ y |1⟩, y cualquier otro punto de la superficie
              representando una superposición distinta (con una fase relativa entre α y β que no tiene
              análogo clásico en absoluto — esa fase es, en buena medida, el recurso extra que la
              computación cuántica explota y que un bit clásico simplemente no tiene dónde guardar).
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Esto por sí solo no es lo que hace poderosa a la computación cuántica — un bit clásico con
              ruido también puede describirse con una distribución de probabilidad. Lo que de verdad
              distingue al cómputo cuántico aparece cuando se combinan muchos qubits (sección II en
              adelante): ahí la cantidad de números necesarios para describir el sistema completo crece
              exponencialmente con la cantidad de qubits, no linealmente — y esa explosión de "espacio de
              estados" es, en términos muy generales, de dónde sale la ventaja computacional real de las
              secciones IV y VI.
            </p>
          </Panel>
        </div>

        {/* II. ENTRELAZAMIENTO */}
        <div id="sec-02" className={`cuant-section ${visible['sec-02'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="ENTRELAZAMIENTO — DE EINSTEIN A ZEILINGER" sub="de objeción filosófica a Premio Nobel de Física 2022" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              En 1935, Albert Einstein, Boris Podolsky y Nathan Rosen publicaron el paper hoy conocido
              como <strong style={{ color: '#fff' }}>EPR</strong>: un argumento pensado como objeción a la
              mecánica cuántica, no como celebración de ella. Mostraron que la teoría predice que dos
              partículas pueden quedar correlacionadas de tal forma que medir una determina instantáneamente
              el resultado de medir la otra, sin importar qué tan lejos estén separadas — algo que a
              Einstein le resultaba tan incómodo que, en correspondencia privada posterior, lo describió
              como <em>"spukhafte Fernwirkung"</em>, "acción fantasmal a distancia". Para Einstein y sus
              coautores, esto era evidencia de que la mecánica cuántica estaba incompleta: tenía que haber
              "variables ocultas" locales que explicaran la correlación sin violar que nada viaja más rápido
              que la luz.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Durante casi tres décadas esto fue, en la práctica, una discusión filosófica sin forma de
              zanjarse experimentalmente — hasta que el físico John Stewart Bell, en 1964, derivó lo que
              hoy se llama las <strong style={{ color: '#fff' }}>desigualdades de Bell</strong>: una
              predicción numérica concreta que cualquier teoría de variables ocultas locales tendría que
              cumplir, y que la mecánica cuántica predice que se viola. De golpe, una pregunta de
              interpretación filosófica se volvió una pregunta de laboratorio con una respuesta medible.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Alain Aspect realizó, en 1982, uno de los primeros experimentos rigurosos que mostraron una
              violación real de las desigualdades de Bell, cerrando objeciones experimentales importantes
              de esa época. Experimentos posteriores — con participación central de John Clauser y Anton
              Zeilinger, cerrando "loopholes" (vacíos experimentales) adicionales a lo largo de las décadas
              siguientes — terminaron de confirmar que la naturaleza se comporta como predice la mecánica
              cuántica, no como lo exigiría una teoría de variables ocultas locales. Los tres — Aspect,
              Clauser y Zeilinger — recibieron el <strong style={{ color: '#fff' }}>Premio Nobel de Física
              2022</strong> explícitamente por estos experimentos sobre entrelazamiento cuántico.
            </p>
          </Panel>
        </div>

        {/* III. PUERTAS */}
        <div id="sec-03" className={`cuant-section ${visible['sec-03'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title="PUERTAS CUÁNTICAS Y CIRCUITOS" sub="el análogo reversible de la lógica booleana clásica" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Una computadora clásica se programa componiendo puertas lógicas (AND, OR, NOT) sobre bits. Una
              computadora cuántica se programa componiendo <strong style={{ color: '#fff' }}>puertas
              cuánticas</strong> sobre qubits — con una diferencia estructural importante: toda puerta
              cuántica tiene que ser <strong style={{ color: '#fff' }}>unitaria</strong> (preserva la norma
              del vector de estado) y, por lo tanto, <strong style={{ color: '#fff' }}>reversible</strong>:
              a diferencia de una puerta AND clásica (que no se puede "deshacer" para recuperar las dos
              entradas a partir de la salida), toda puerta cuántica tiene una inversa exacta.
            </p>
            <div style={{ overflowX: 'auto', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${ACCENT_BRIGHT}44` }}>
                    <th style={{ textAlign: 'left', padding: '6px 10px', color: ACCENT_BRIGHT }}>PUERTA</th>
                    <th style={{ textAlign: 'left', padding: '6px 10px', color: ACCENT_BRIGHT }}>QUBITS</th>
                    <th style={{ textAlign: 'left', padding: '6px 10px', color: ACCENT_BRIGHT }}>QUÉ HACE</th>
                  </tr>
                </thead>
                <tbody style={{ color: TEXT_DIM }}>
                  <tr style={{ borderBottom: `1px solid ${ACCENT_BRIGHT}18` }}>
                    <td style={{ padding: '6px 10px' }}>Pauli-X</td>
                    <td style={{ padding: '6px 10px' }}>1</td>
                    <td style={{ padding: '6px 10px' }}>el "NOT cuántico" — intercambia |0⟩ y |1⟩</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${ACCENT_BRIGHT}18` }}>
                    <td style={{ padding: '6px 10px' }}>Pauli-Y / Pauli-Z</td>
                    <td style={{ padding: '6px 10px' }}>1</td>
                    <td style={{ padding: '6px 10px' }}>rotaciones de 180° sobre otros dos ejes de la esfera de Bloch</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${ACCENT_BRIGHT}18` }}>
                    <td style={{ padding: '6px 10px' }}>Hadamard (H)</td>
                    <td style={{ padding: '6px 10px' }}>1</td>
                    <td style={{ padding: '6px 10px' }}>crea superposición: lleva |0⟩ a una mezcla igual de |0⟩ y |1⟩</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 10px' }}>CNOT</td>
                    <td style={{ padding: '6px 10px' }}>2</td>
                    <td style={{ padding: '6px 10px' }}>invierte el segundo qubit solo si el primero está en |1⟩ — la puerta de dos qubits básica para generar entrelazamiento</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Una secuencia de Hadamard seguida de CNOT sobre dos qubits inicializados en |00⟩ es, de hecho,
              la receta de circuito más citada para producir un par entrelazado (un "par de Bell") — la
              demostración de laboratorio más directa de lo descrito en la sección II.
            </p>
          </Panel>
        </div>

        {/* IV. ALGORITMOS */}
        <div id="sec-04" className={`cuant-section ${visible['sec-04'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="ALGORITMOS CON VENTAJA DEMOSTRADA" sub="Shor (1994) y Grover (1996) — matemática probada, no proyección" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Peter Shor publicó en 1994 un algoritmo que factoriza números enteros grandes en tiempo
              polinomial en una computadora cuántica — un problema para el cual no se conoce ningún
              algoritmo clásico eficiente, y del cual depende directamente la seguridad de{' '}
              <strong style={{ color: '#fff' }}>RSA</strong>, uno de los sistemas de criptografía de clave
              pública más usados del mundo (la seguridad de RSA descansa, precisamente, en que factorizar
              el producto de dos primos muy grandes sea intratable con computación clásica). Esto no es una
              estimación ni una conjetura: es un resultado matemático demostrado sobre lo que una
              computadora cuántica ideal, sin ruido, podría hacer — la brecha entre ese resultado teórico y
              una máquina real capaz de ejecutarlo a la escala necesaria para romper RSA de uso actual es,
              precisamente, el tema de las secciones V y VII.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Lov Grover publicó en 1996 un algoritmo distinto: una forma de buscar un elemento específico
              en una lista desordenada de N elementos en aproximadamente √N pasos, en vez de los N pasos
              que requiere, en el peor caso, cualquier algoritmo clásico — una mejora cuadrática, no
              exponencial como la de Shor, pero igualmente demostrada con rigor matemático. Esta diferencia
              importa en la práctica: una mejora cuadrática es valiosa pero mucho menos transformadora que
              una exponencial, y es un ejemplo útil de por qué no toda "ventaja cuántica" significa lo
              mismo en magnitud.
            </p>
          </Panel>
        </div>

        {/* V. HARDWARE */}
        <div id="sec-05" className={`cuant-section ${visible['sec-05'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="V" title="ARQUITECTURAS DE HARDWARE REAL" sub="y el debate real sobre los qubits topológicos" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              No hay una sola forma de construir un qubit físico, y compiten varias arquitecturas reales
              hoy: <strong style={{ color: '#fff' }}>circuitos superconductores</strong> (la línea que
              siguen IBM y Google, qubits hechos de uniones Josephson enfriadas a temperaturas cercanas al
              cero absoluto), <strong style={{ color: '#fff' }}>iones atrapados</strong> (la línea de IonQ
              y Quantinuum, usando campos electromagnéticos para suspender átomos individuales ionizados) y
              arquitecturas <strong style={{ color: '#fff' }}>fotónicas</strong> (codificando información en
              estados de luz). Cada arquitectura tiene ventajas y desventajas reales distintas —
              conectividad, tiempos de coherencia, facilidad de fabricación — y no hay consenso en la
              comunidad de que una vaya a "ganarle" definitivamente a las demás.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Una cuarta línea, los <strong style={{ color: '#fff' }}>qubits topológicos</strong>, promete
              en teoría una protección natural contra el ruido mucho mayor que las anteriores, codificando
              información en propiedades topológicas globales de un sistema físico (en vez de en el estado
              frágil de una partícula individual) — pero es, de las cuatro, la que menos evidencia
              experimental sólida y ampliamente replicada tiene detrás.
            </p>
            <Caption>
              En 2025, Microsoft anunció un chip de este tipo ("Majorana 1"), presentándolo como un avance
              hacia qubits topológicos funcionales. El anuncio generó un debate real y público dentro de la
              comunidad de física de la materia condensada: varios investigadores señalaron que la
              evidencia presentada en ese momento no alcanzaba, para una parte significativa del campo, el
              estándar de verificación independiente y revisión por pares que suele exigirse antes de
              aceptar un resultado de esta magnitud como establecido — Microsoft ya había tenido, años
              antes, que retractar una publicación relacionada con partículas de Majorana por errores en el
              análisis de datos. Esto se incluye acá como controversia real y documentada, no como logro
              cerrado ni como fraude — ambos extremos serían deshonestos.
            </Caption>
          </Panel>
        </div>

        {/* VI. SUPREMACIA */}
        <div id="sec-06" className={`cuant-section ${visible['sec-06'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VI" title="SUPREMACÍA CUÁNTICA — UN TÉRMINO CONTESTADO" sub="Google, 2019 — y lo que pasó después" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              En 2019, Google anunció que su procesador de 53 qubits superconductores, llamado{' '}
              <strong style={{ color: '#fff' }}>Sycamore</strong>, había resuelto una tarea de muestreo
              estadístico específica (sin aplicación práctica directa, diseñada para ser difícil
              clásicamente) en aproximadamente 200 segundos — una tarea que, según su propia estimación,
              habría tomado alrededor de 10.000 años a la supercomputadora clásica más potente disponible
              en ese momento. La prensa lo tituló ampliamente como el primer logro de{' '}
              <strong style={{ color: '#fff' }}>"supremacía cuántica"</strong>: una tarea cualquiera, sin
              necesidad de ser útil, donde una computadora cuántica supera demostrablemente a cualquier
              computadora clásica posible.
            </p>
            <Caption>
              IBM cuestionó públicamente esa estimación casi de inmediato, argumentando que con suficiente
              espacio de almacenamiento en disco (no solo memoria RAM) la misma tarea podría resolverse
              clásicamente en días, no en milenios — una diferencia de magnitud enorme sobre la propia
              estimación de Google. En los años siguientes, mejoras reales en algoritmos clásicos de
              simulación redujeron todavía más esa brecha estimada para esta y tareas similares. Nada de
              esto invalida que Sycamore hiciera algo real y que las superposiciones/entrelazamientos
              involucrados sean genuinos — pero "supremacía cuántica" como hito cerrado, consensuado y
              estable en el tiempo es, hoy, una simplificación. La comunidad usa cada vez más "ventaja
              cuántica" (quantum advantage) como término más cauto, caso por caso, en vez de una afirmación
              general y definitiva.
            </Caption>
          </Panel>
        </div>

        {/* VII. ERRORES */}
        <div id="sec-07" className={`cuant-section ${visible['sec-07'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VII" title="EL PROBLEMA REAL — CORRECCIÓN DE ERRORES" sub="el cuello de botella central de todo el campo, no un detalle menor" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Un qubit físico es extremadamente frágil: cualquier interacción no controlada con el entorno
              —calor residual, vibraciones, radiación electromagnética de fondo— destruye la superposición
              y el entrelazamiento en un proceso llamado <strong style={{ color: '#fff' }}>decoherencia</strong>,
              típicamente en microsegundos o menos según la arquitectura. Esto significa que un algoritmo
              cuántico real tiene una ventana de tiempo extremadamente corta antes de que el ruido arruine
              el cálculo.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La solución teórica, la <strong style={{ color: '#fff' }}>corrección de errores cuánticos</strong>,
              existe matemáticamente desde los años 90 (Shor y otros demostraron que es posible, lo cual en
              sí mismo no era obvio dado que medir un qubit para "chequear" su error lo colapsa) — pero
              exige redundancia física enorme: códigos como el <strong style={{ color: '#fff' }}>código de
              superficie</strong> necesitan, según las estimaciones actuales más citadas, del orden de
              cientos a más de mil qubits físicos ruidosos por cada <strong style={{ color: '#fff' }}>qubit
              lógico</strong> confiable. Esta proporción — no un detalle de ingeniería menor, sino el
              obstáculo central y reconocido por todo el campo — es la razón concreta y específica de por
              qué todavía no existe una computadora cuántica útil, tolerante a fallos y de uso general a
              gran escala: construir algo con miles de qubits lógicos confiables implicaría, hoy, millones
              de qubits físicos — varios órdenes de magnitud por encima de cualquier dispositivo existente.
            </p>
          </Panel>
        </div>

        {/* VIII. MITOS */}
        <div id="sec-08" className={`cuant-section ${visible['sec-08'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VIII" title="QUÉ NO ES LA COMPUTACIÓN CUÁNTICA" sub="dos mitos mediáticos comunes, desmentidos con la física de arriba" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <strong style={{ color: '#fff' }}>Mito 1: "va a reemplazar a las computadoras clásicas".</strong>{' '}
              Falso para la inmensa mayoría de las tareas. Una computadora cuántica no es más rápida de
              forma general — tiene ventaja demostrada (sección IV) solo para una clase específica y
              relativamente acotada de problemas matemáticos (factorización, búsqueda no estructurada,
              simulación de sistemas cuánticos, cierta optimización). Para navegar internet, escribir un
              documento o correr la mayoría del software que existe, una computadora cuántica no ofrece
              ninguna ventaja — y probablemente nunca la ofrezca, porque el tipo de estructura matemática
              que esas tareas requieren no es la que la superposición y el entrelazamiento aceleran.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              <strong style={{ color: '#fff' }}>Mito 2: "prueba todas las soluciones posibles en
              paralelo".</strong> Es la simplificación más repetida y más engañosa. La superposición (sección
              I) no es "N cómputos clásicos corriendo simultáneamente, de los cuales uno elegís al final" —
              si lo fuera, la medición simplemente devolvería al azar una de esas N respuestas, que es
              inútil. La ventaja real de los algoritmos cuánticos (sección IV) viene de diseñar el circuito
              para que las amplitudes de las respuestas incorrectas se cancelen entre sí por{' '}
              <strong style={{ color: '#fff' }}>interferencia destructiva</strong>, mientras que la amplitud
              de la respuesta correcta se refuerza por interferencia constructiva — un mecanismo mucho más
              sutil y restrictivo que "probar todo a la vez", y que solo funciona para problemas con la
              estructura matemática adecuada para organizar esa interferencia.
            </p>
          </Panel>
        </div>

        {/* IX. NISQ */}
        <div id="sec-09" className={`cuant-section ${visible['sec-09'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IX" title="DÓNDE ESTAMOS — LA ERA NISQ" sub="John Preskill, 2018" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              El físico John Preskill acuñó en 2018 el término <strong style={{ color: '#fff' }}>NISQ</strong>{' '}
              (Noisy Intermediate-Scale Quantum, "cuántico ruidoso de escala intermedia") para describir, con
              precisión y sin exagerar, el estado real del campo: dispositivos con decenas a unos pocos
              miles de qubits físicos, sin corrección de errores completa (sección VII), suficientes para
              investigación y para explorar si existe ventaja cuántica en problemas específicos, pero no
              para garantizar ninguna aplicación de uso general confiable todavía.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Las aplicaciones consideradas más prometedoras a corto y mediano plazo no son criptografía
              rota ni inteligencia artificial acelerada de forma genérica — son más específicas y más
              modestas: simulación de moléculas y materiales (donde el comportamiento cuántico real de los
              electrones es, literalmente, lo que se quiere simular, así que una computadora cuántica es la
              herramienta natural) y ciertos problemas de optimización combinatoria. Nadie con credibilidad
              real en el campo da hoy una fecha confiable para la llegada de computación cuántica
              tolerante a fallos y de uso general — cualquier afirmación con fecha concreta sobre eso,
              viniendo de cualquier fuente, merece el mismo escepticismo que cualquier otra predicción
              tecnológica sin base verificable.
            </p>
          </Panel>
        </div>

        {/* X. RESONANCIA */}
        <div id="sec-10" className={`cuant-section ${visible['sec-10'] ? 'is-visible' : ''}`} style={{ marginBottom: 0 }}>
          <SectionHeader roman="X" title="RESONANCIA CON NEOPROXY" />
          <Panel>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Este documento comparte sustrato directo con dos que ya existen en el Codex:{' '}
              <Link href="/archivo/particulas" style={{ color: '#fff', textDecoration: 'underline' }}>Partículas</Link>{' '}
              describe el mismo marco cuántico de campos que subyace a los qubits de la sección I, y{' '}
              <Link href="/archivo/holografia" style={{ color: '#fff', textDecoration: 'underline' }}>Principio
              Holográfico</Link> trata información cuántica aplicada a un dominio completamente distinto — la
              entropía de un agujero negro y la correspondencia AdS/CFT — mostrando que el entrelazamiento de
              la sección II no es una curiosidad de laboratorio aislada, sino un concepto que atraviesa
              dominios de la física que en apariencia no tienen nada que ver entre sí.
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Una aclaración que vale la pena hacer explícita, para no mezclar dos cosas distintas: el azar
              genuino de las tres monedas del{' '}
              <Link href="/arcano/yijing" style={{ color: '#fff', textDecoration: 'underline' }}>oráculo del
              Yi Jing</Link> (ver ese documento, sección IV) y la indeterminación cuántica de la medición
              descrita en la sección I de este documento no son el mismo fenómeno con otro nombre. El azar
              de una moneda real es, en última instancia, determinista y solo impredecible en la práctica
              por desconocer con precisión total las condiciones iniciales del lanzamiento (el mismo tipo de
              impredecibilidad que describe la sección caótica de{' '}
              <Link href="/archivo/autoorganizacion" style={{ color: '#fff', textDecoration: 'underline' }}>Autoorganización</Link>).
              La indeterminación cuántica, en cambio, no es ignorancia sobre una variable oculta que ya
              tenía un valor definido antes de medir — las desigualdades de Bell de la sección II son,
              precisamente, la demostración experimental de que esa diferencia es real y medible, no una
              cuestión de interpretación.
            </p>
          </Panel>
        </div>

        {/* footer */}
        <div style={{ marginTop: 100, paddingTop: 28, borderTop: `1px solid ${ACCENT_BRIGHT}22` }}>
          <div style={{ fontSize: 10.5, letterSpacing: 3, color: `${ACCENT_BRIGHT}44` }}>
            NPX-ARC-13 // REFERENCIA TÉCNICA DEL CODEX
          </div>
        </div>
      </div>

      <style>{`
        .cuant-section { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .cuant-section.is-visible { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .cuant-section { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
