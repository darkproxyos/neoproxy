'use client'

// NPX-ARC-19 — COMPUTACIÓN NO CONVENCIONAL
// Pedido explícito, amplio: un recorrido real por las arquitecturas de
// cómputo que no son "CPU binaria de von Neumann" -- lo que se sabe y lo
// que queda por explorar. La sección IX (FPGA) es la más extensa a
// propósito: es el interés inmediato y explícito del usuario, y es
// además la plataforma real donde se puede experimentar con casi todo lo
// demás en este documento sin fabricar silicio dedicado. No duplica
// /archivo/computacion-cuantica, /archivo/adn ni /archivo/wetware -- los
// cita y linkea donde corresponde.
// Acento violeta "no convencional" #9d4edd, nuevo y distinto de todos los
// ya usados en el Codex.

import { useEffect, useState } from 'react'
import Link from 'next/link'

const mono = "'Space Mono', monospace"
const ACCENT = '#9d4edd'
const TEXT = '#ead8ff'
const TEXT_DIM = '#b89ad4'
const LABEL_DIM = '#6a4a8a'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(8, 2, 14, 0.55)', border: `1px solid ${ACCENT}33`, borderRadius: 4,
      boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(157,78,221,0.03)`, padding: '28px 26px', ...style,
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
      {sub && <div style={{ fontSize: 10, letterSpacing: 1, color: LABEL_DIM, marginTop: 8, paddingLeft: 32 }}>{sub}</div>}
    </div>
  )
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9.5, lineHeight: 1.8, letterSpacing: 0.5, color: LABEL_DIM, marginTop: 14, borderLeft: `2px solid ${ACCENT}33`, paddingLeft: 12 }}>
      {children}
    </div>
  )
}

const TOC: [string, string, string][] = [
  ['I', 'sec-01', 'Qué hace "convencional" a lo convencional — Von Neumann y su propio muro'],
  ['II', 'sec-02', 'Computación neuromórfica — chips que imitan la neurona, no el clock'],
  ['III', 'sec-03', 'Memristores — el cuarto elemento y la computación en memoria'],
  ['IV', 'sec-04', 'Computación óptica/fotónica — luz en vez de electrones'],
  ['V', 'sec-05', 'Cuántica y ADN — ya tienen su propio documento, acá el puente real'],
  ['VI', 'sec-06', 'Computación reversible — el límite termodinámico de borrar un bit'],
  ['VII', 'sec-07', 'Computación analógica — el resurgimiento real'],
  ['VIII', 'sec-08', 'Computación biológica real — neuronas vivas jugando al Pong'],
  ['IX', 'sec-09', 'FPGA — silicio que se reprograma, la plataforma real para experimentar con todo esto'],
  ['X', 'sec-10', 'Lo que queda por explorar de verdad'],
  ['XI', 'sec-11', 'Honestidad final — qué es producto hoy y qué sigue siendo laboratorio'],
]

export default function ComputacionNoConvencionalPage() {
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.ncv-section'))
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
    <div style={{ background: '#05020a', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        <Link href="/knowledge" className="press" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${ACCENT}aa`, textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← VOLVER AL CODEX
        </Link>

        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${ACCENT}66`, marginBottom: 16 }}>
            NPX-ARC-19 // REFERENCIA TÉCNICA
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 5.5vw, 40px)', fontWeight: 700, letterSpacing: 4, color: ACCENT, textShadow: `0 0 40px ${ACCENT}55`, marginBottom: 14, lineHeight: 1.15 }}>
            COMPUTACIÓN NO CONVENCIONAL
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            TODO LO QUE NO ES UNA CPU BINARIA CORRIENDO A UN CLOCK FIJO
          </div>
          <p style={{ fontSize: 11.5, lineHeight: 2.1, letterSpacing: 0.3, color: TEXT_DIM, maxWidth: 660, borderLeft: `1px solid ${ACCENT}33`, paddingLeft: 24, marginBottom: 32 }}>
            Un recorrido real por las arquitecturas que existen porque el modelo de cómputo que ganó
            (von Neumann, binario, silicio digital) tiene límites físicos reales que ya empezó a chocar.
            Termina donde más interés hay de seguir: FPGA, silicio que se reprograma — la plataforma
            real donde experimentar con casi todo lo de acá sin fabricar un chip a medida.
          </p>

          <div style={{ display: 'inline-grid', gridTemplateColumns: 'auto auto', gap: '4px 24px', fontSize: 9, letterSpacing: 1, color: `${ACCENT}99`, border: `1px solid ${ACCENT}33`, padding: '12px 18px', marginBottom: 32 }}>
            <span style={{ color: `${ACCENT}55` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>ARQUITECTURAS DE CÓMPUTO ALTERNATIVAS A VON NEUMANN</span>
            <span style={{ color: `${ACCENT}55` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — XI SECCIONES</span>
            <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>NEUROMÓRFICA → MEMRISTORES → FOTÓNICA → REVERSIBLE → ANALÓGICA → BIOLÓGICA → FPGA</span>
          </div>

          <nav style={{ border: `1px solid ${ACCENT}22`, padding: '20px 24px', maxWidth: 680 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}66`, marginBottom: 14 }}>ÍNDICE</div>
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

        <div id="sec-01" className={`ncv-section ${visible['sec-01'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="I" title='QUÉ HACE "CONVENCIONAL" A LO CONVENCIONAL' sub="Von Neumann y su propio muro" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Casi todo lo que llamamos "una computadora" comparte el mismo esqueleto desde 1945: la{' '}
              <strong style={{ color: '#fff' }}>arquitectura de von Neumann</strong> — un procesador y una
              memoria separados físicamente, conectados por un bus por el que tienen que pasar, uno por
              uno, tanto los datos como las instrucciones. John Backus, en su discurso al recibir el
              premio Turing en 1977, le puso nombre real al costo de ese diseño:{' '}
              <strong style={{ color: '#fff' }}>el "cuello de botella de von Neumann"</strong> — por rápido
              que sea el procesador, no puede hacer nada mientras espera que los datos crucen ese mismo
              bus angosto desde la memoria.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Durante décadas, ese costo se disimuló con dos tendencias que avanzaban juntas: la ley de
              Moore (más transistores por chip cada ~2 años, observación real de Gordon Moore en 1965) y
              el escalado de Dennard (transistores más chicos que además consumían menos energía por
              transistor). El escalado de Dennard dejó de cumplirse, de hecho, alrededor de 2005-2006 —
              desde entonces, hacer un chip más rápido ya no es "gratis" en términos de calor y energía, y
              la ley de Moore misma viene desacelerando. Ese freno real, no una moda académica, es lo que
              empuja en serio a buscar arquitecturas que no hereden el mismo cuello de botella.
            </p>
            <Caption>
              Ninguna de las arquitecturas de este documento "reemplaza" a la CPU convencional en el corto
              plazo — cada una ataca una parte específica del problema (energía, latencia, un tipo de
              cálculo puntual) mejor que una CPU genérica, casi siempre a costa de ser mucho peor en todo
              lo demás.
            </Caption>
          </Panel>
        </div>

        <div id="sec-02" className={`ncv-section ${visible['sec-02'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="COMPUTACIÓN NEUROMÓRFICA" sub="chips que imitan la neurona, no el clock" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Una red neuronal artificial corriendo en una GPU (ver /archivo/redes-neuronales) sigue
              siendo, por dentro, aritmética de matrices sobre hardware de von Neumann — rápida, pero
              nada parecida, físicamente, a cómo funciona una neurona real. Un chip{' '}
              <strong style={{ color: '#fff' }}>neuromórfico</strong> intenta lo contrario: imitar la
              arquitectura física real del sistema nervioso — neuronas y sinapsis como componentes de
              hardware reales, comunicándose con{' '}
              <strong style={{ color: '#fff' }}>picos</strong> (spikes) discretos en el tiempo, no con un
              clock central sincronizando todo.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              <strong style={{ color: '#fff' }}>TrueNorth</strong> (IBM, 2014, desarrollado bajo el
              programa SyNAPSE de DARPA) integró un millón de neuronas de silicio y 256 millones de
              sinapsis en un chip que consume, en operación real, alrededor de 70 milivatios — órdenes de
              magnitud menos que el equivalente en hardware convencional.{' '}
              <strong style={{ color: '#fff' }}>Loihi</strong> (Intel, 2017; Loihi 2 en 2021) lleva la
              idea más lejos, con aprendizaje en el propio chip (on-chip learning), no solo inferencia. La
              razón real de esa eficiencia: una neurona de spikes solo "gasta" energía cuando realmente
              dispara un pico, no en cada ciclo de clock como una CPU — la mayor parte del tiempo, la
              mayoría del chip literalmente no está haciendo nada, igual que la mayoría de tus neuronas
              reales en cualquier instante dado.
            </p>
            <Caption>
              El costo real: programar un chip de spikes es genuinamente distinto a programar cualquier
              CPU o GPU — el software y las herramientas todavía son mucho menos maduras que las del
              cómputo convencional, lo que frena la adopción fuera de investigación.
            </Caption>
          </Panel>
        </div>

        <div id="sec-03" className={`ncv-section ${visible['sec-03'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title="MEMRISTORES" sub="el cuarto elemento y la computación en memoria" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              En 1971, <strong style={{ color: '#fff' }}>Leon Chua</strong> predijo, por pura simetría
              matemática entre las ecuaciones que relacionan carga, corriente, voltaje y flujo magnético,
              que debía existir un cuarto componente eléctrico fundamental además de la resistencia, el
              capacitor y el inductor: el <strong style={{ color: '#fff' }}>memristor</strong> (memoria +
              resistor) — un componente cuya resistencia depende de la historia de corriente que pasó por
              él antes. Nadie había fabricado uno real. En 2008, un equipo de{' '}
              <strong style={{ color: '#fff' }}>HP Labs</strong> (Strukov, Snider, Stewart y Williams)
              publicó en Nature la primera demostración física real, con el título, sin rodeos, "The
              missing memristor found".
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La razón por la que esto importa para computación (no solo para electrónica) es que un
              memristor "recuerda" su estado sin consumir energía para mantenerlo — y eso habilita{' '}
              <strong style={{ color: '#fff' }}>computación en memoria</strong> (in-memory computing): en
              vez de guardar datos en un lado y procesarlos en otro (el cuello de botella de la sección
              I), un arreglo de memristores puede literalmente calcular mientras almacena, en el mismo
              lugar físico — el camino más directo para atacar el cuello de botella de von Neumann desde
              la raíz, no desde una optimización alrededor de él.
            </p>
            <Caption>
              Sigue siendo, en 2025, tecnología mayormente de investigación y de nicho (memoria no volátil
              de cierto tipo, algunos aceleradores experimentales de IA) — no reemplazó todavía a la RAM
              convencional en ningún producto masivo.
            </Caption>
          </Panel>
        </div>

        <div id="sec-04" className={`ncv-section ${visible['sec-04'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="COMPUTACIÓN ÓPTICA / FOTÓNICA" sub="luz en vez de electrones" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Un fotón viaja más rápido que un electrón en un conductor real, y dos haces de luz pueden
              cruzarse en el mismo espacio sin interferirse (dos corrientes eléctricas, en cambio,
              necesitan caminos separados) — eso hace de la luz, en principio, un medio más rápido y
              paralelo para hacer ciertos cálculos, en especial la multiplicación de matrices que domina
              el cómputo de redes neuronales. Empresas reales como{' '}
              <strong style={{ color: '#fff' }}>Lightmatter</strong> y{' '}
              <strong style={{ color: '#fff' }}>Lightelligence</strong> fabrican hoy chips fotónicos
              específicamente para acelerar esa parte puntual del cómputo de IA.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              El problema real sin resolver, hoy: no existe un equivalente práctico y maduro de{' '}
              <strong style={{ color: '#fff' }}>memoria óptica</strong> ni de un "transistor óptico"
              simple y eficiente para hacer lógica digital completa solo con luz — por eso, en la
              práctica, todos los chips fotónicos reales de hoy son híbridos: la parte de cálculo masivo
              paralelo (la multiplicación) pasa por luz, pero el control, la memoria y la lógica de
              decisión siguen en electrónica convencional. La computación "100% óptica" sigue siendo,
              en 2025, más un objetivo de investigación que un producto.
            </p>
            <Caption>
              Esta misma tensión (una parte del cómputo resuelta de forma brillante por un medio físico
              distinto, pero sin un ecosistema completo alrededor) se repite, con otras palabras, en casi
              todas las secciones de este documento — es el patrón real detrás de por qué ninguna de
              estas arquitecturas reemplazó todavía al cómputo convencional entero.
            </Caption>
          </Panel>
        </div>

        <div id="sec-05" className={`ncv-section ${visible['sec-05'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="V" title="CUÁNTICA Y ADN" sub="ya tienen su propio documento — acá el puente real" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Dos de las formas más citadas de computación "no convencional" ya tienen tratamiento extenso
              propio en este Codex, y no se repiten acá para no duplicar:{' '}
              <Link href="/archivo/computacion-cuantica" style={{ color: '#fff', textDecoration: 'underline' }}>
                computación cuántica
              </Link>{' '}
              (qubits, superposición, entrelazamiento, con la supremacía cuántica tratada como la
              controversia real que es) y{' '}
              <Link href="/archivo/adn" style={{ color: '#fff', textDecoration: 'underline' }}>
                computación por ADN
              </Link>{' '}
              — el experimento real de Leonard Adleman en 1994, que resolvió una instancia chica del
              problema del camino hamiltoniano codificando el problema entero en moléculas de ADN y
              dejando que la química hiciera, en paralelo masivo real, buena parte de la búsqueda.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Lo que vale la pena decir acá, puntualmente, es lo que las conecta con el resto de este
              documento: las tres (cuántica, ADN, y las de este documento) comparten la misma lógica de
              fondo — identificar un sistema físico cuyo comportamiento natural resuelve directamente un
              tipo de problema específico, en vez de simular ese comportamiento con lógica binaria
              convencional, que es mucho más lenta para ese caso puntual.
            </p>
            <Caption>
              Ninguna de las dos es, hoy, una computadora de propósito general que reemplace a la tuya —
              cada una es extraordinariamente buena en una familia acotada de problemas, e inútil o peor
              que una CPU convencional para casi todo lo demás.
            </Caption>
          </Panel>
        </div>

        <div id="sec-06" className={`ncv-section ${visible['sec-06'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VI" title="COMPUTACIÓN REVERSIBLE" sub="el límite termodinámico de borrar un bit" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              En 1961, <strong style={{ color: '#fff' }}>Rolf Landauer</strong> (investigador de IBM)
              demostró algo real y contraintuitivo: no es la computación en sí lo que necesariamente gasta
              energía como calor — es específicamente{' '}
              <strong style={{ color: '#fff' }}>borrar información</strong>. Cada vez que una compuerta
              lógica convencional (un AND, un OR) destruye información — toma dos bits de entrada y
              produce uno de salida, perdiendo irreversiblemente de qué combinación exacta venía — libera
              una cantidad mínima real de calor:{' '}
              <em>kT ln(2)</em>, un número minúsculo pero no nulo, y no evitable por ninguna mejora de
              ingeniería mientras la operación siga siendo lógicamente irreversible.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              En 1973, <strong style={{ color: '#fff' }}>Charles Bennett</strong> mostró que esto no es un
              callejón sin salida: es posible diseñar compuertas lógicas{' '}
              <strong style={{ color: '#fff' }}>reversibles</strong> (como la puerta de Toffoli), donde
              ninguna información se destruye nunca — la entrada siempre se puede reconstruir exacta a
              partir de la salida — y ese tipo de cómputo, en principio, puede acercarse arbitrariamente a
              cero disipación de calor por el borrado. El costo real: cada bit "innecesario" que la lógica
              reversible tiene que conservar para no perder información ocupa espacio físico real que una
              compuerta convencional simplemente tira.
            </p>
            <Caption>
              Esto no es solo curiosidad teórica: a medida que los chips convencionales se acercan a sus
              propios límites térmicos (sección I), la computación reversible deja de ser una rareza
              académica y empieza a aparecer como una dirección de investigación real para el límite
              energético de todo lo demás en este documento.
            </Caption>
          </Panel>
        </div>

        <div id="sec-07" className={`ncv-section ${visible['sec-07'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VII" title="COMPUTACIÓN ANALÓGICA" sub="el resurgimiento real" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Antes de que "computadora" significara binaria por default, existieron computadoras{' '}
              <strong style={{ color: '#fff' }}>analógicas</strong> reales y usadas en producción — el
              analizador diferencial mecánico de Vannevar Bush (MIT, 1931) resolvía ecuaciones
              diferenciales con engranajes y ejes rotando, cuyo ángulo físico real representaba
              directamente una cantidad continua, no un número codificado en bits. La computación digital
              las desplazó casi por completo porque es exacta y reproducible de una forma que un sistema
              analógico, sujeto a ruido físico real, nunca puede igualar del todo.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La razón real de su resurgimiento hoy: una red neuronal tolera ruido numérico mucho mejor
              que casi cualquier otro tipo de cálculo (ver /archivo/redes-neuronales) — no necesita
              precisión exacta, necesita una aproximación "suficientemente buena" millones de veces por
              segundo con el menor consumo de energía posible. Empresas reales como{' '}
              <strong style={{ color: '#fff' }}>Mythic</strong> fabrican chips de cómputo analógico en
              memoria específicamente para inferencia de redes neuronales, aceptando algo de imprecisión
              real a cambio de consumir una fracción de la energía de un chip digital equivalente.
            </p>
            <Caption>
              El límite real sigue siendo el mismo de siempre: cualquier tarea que necesite precisión
              numérica exacta (contabilidad, criptografía, la mayoría del software convencional) no es
              candidata a analógico — la ventaja real es específica a cargas que toleran error, como el
              cómputo de IA.
            </Caption>
          </Panel>
        </div>

        <div id="sec-08" className={`ncv-section ${visible['sec-08'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VIII" title="COMPUTACIÓN BIOLÓGICA REAL" sub="neuronas vivas jugando al Pong" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              En 2022, la empresa australiana <strong style={{ color: '#fff' }}>Cortical Labs</strong>{' '}
              publicó en la revista <em>Neuron</em> un experimento real, no especulativo: cultivaron
              aproximadamente 800.000 neuronas reales (humanas y de ratón) sobre un arreglo de electrodos,
              les dieron estímulos eléctricos que codificaban el estado del juego{' '}
              <strong style={{ color: '#fff' }}>Pong</strong>, y usaron la actividad eléctrica resultante
              de esas neuronas vivas para mover la pala — al sistema completo lo llamaron{' '}
              <strong style={{ color: '#fff' }}>DishBrain</strong>. Las neuronas, literalmente, aprendieron
              a jugar mejor con el tiempo, con mucha menos "experiencia" (menos partidas) de las que
              necesita un algoritmo de aprendizaje por refuerzo convencional para lograr lo mismo.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Esto no es ciencia ficción ni el cuerpo entero como metáfora (eso ya lo cubre{' '}
              <Link href="/archivo/wetware" style={{ color: '#fff', textDecoration: 'underline' }}>
                /archivo/wetware
              </Link>
              ) — es tejido neuronal real, cultivado en laboratorio, haciendo cómputo real medible. La
              pregunta real de investigación que abre no es si funciona (ya se demostró que sí, a pequeña
              escala), sino si puede escalar más allá de una demostración de laboratorio hacia algo
              reproducible y útil.
            </p>
            <Caption>
              Las implicancias éticas reales de cultivar tejido neuronal capaz de aprender son, a
              propósito, parte activa del debate científico alrededor de este campo (llamado{' '}
              <em>organoid intelligence</em>) — no un detalle que este documento vaya a resolver, pero
              tampoco algo para pasar por alto.
            </Caption>
          </Panel>
        </div>

        <div id="sec-09" className={`ncv-section ${visible['sec-09'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IX" title="FPGA" sub="silicio que se reprograma — la plataforma real para experimentar con todo esto" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Una <strong style={{ color: '#fff' }}>FPGA</strong> (field-programmable gate array) no es
              software ni hardware fijo — es algo real en el medio: un chip hecho de miles de bloques
              lógicos idénticos y reconfigurables (cada uno, por dentro, una{' '}
              <strong style={{ color: '#fff' }}>LUT</strong>, look-up table, que puede implementar
              cualquier función lógica chica) conectados por una red de interconexión también
              reprogramable — "cablear" literalmente qué bloque se conecta con cuál, en software, antes de
              que el chip corra nada. El resultado es un circuito digital real, hecho a medida para tu
              diseño exacto, sin fabricar silicio nuevo — y que se puede volver a reconfigurar desde cero
              mañana para ser un circuito completamente distinto.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Programar una FPGA no se parece a escribir software convencional: se describe{' '}
              <strong style={{ color: '#fff' }}>hardware</strong>, en un HDL (hardware description
              language) real —<strong style={{ color: '#fff' }}> Verilog</strong> o{' '}
              <strong style={{ color: '#fff' }}>VHDL</strong> — especificando registros, señales y lógica
              que existen todas <em>en paralelo real</em>, no una instrucción después de la otra como en
              una CPU. El flujo real de trabajo: describir el circuito en RTL (register-transfer level),{' '}
              <strong style={{ color: '#fff' }}>síntesis</strong> (el HDL se convierte en una red real de
              LUTs y conexiones), <strong style={{ color: '#fff' }}>place and route</strong> (se decide
              dónde, físicamente, en el chip, va cada bloque), y por último se genera un{' '}
              <strong style={{ color: '#fff' }}>bitstream</strong> — el archivo real que, cargado en el
              chip, configura cada bloque lógico y cada conexión.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Esto es exactamente lo que vuelve a FPGA la plataforma real de experimentación para casi
              todo este documento: podés implementar vos mismo, en lógica digital real sobre una FPGA
              barata, una versión simplificada de un acelerador neuromórfico (sección II) o de una red
              neuronal binarizada corriendo en paralelo real — sin necesitar fabricar un ASIC, que cuesta
              capital real e iteraciones de meses. Es, literalmente, hardware que todavía se puede
              equivocar y volver a intentar.
            </p>
            <Caption>
              CLAUDE.md, el propio documento de reglas de este proyecto, ya anota equipo real de FPGA
              (un chip Altera/Intel Cyclone IV <strong style={{ color: '#fff' }}>EP4CE6E22C8</strong>,
              cargado con <code>openFPGALoader</code> en vez de <code>quartus_pgm</code> por
              incompatibilidad real de clones USB-Blaster, con el flujo <code>.sof</code> →{' '}
              <code>.rbf</code> vía <code>quartus_cpf -c</code>) para un TRNG (generador de números
              aleatorios reales por hardware) — ese trabajo vive en otro repo
              (<code>neoproxy-lab</code>/<code>digitalseed</code>, no en este), pero es el punto de
              partida real y ya en marcha, no hipotético, para indagar en serio con esto. La bajada
              práctica de todo esto (qué placa comprar, qué toolchain instalar, el primer proyecto real)
              vive aparte, en{' '}
              <Link href="/sustrato/fpga" style={{ color: '#fff', textDecoration: 'underline' }}>
                /sustrato/fpga
              </Link>.
            </Caption>
          </Panel>
        </div>

        <div id="sec-10" className={`ncv-section ${visible['sec-10'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="X" title="LO QUE QUEDA POR EXPLORAR DE VERDAD" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <strong style={{ color: '#fff' }}>In-materio computing</strong> — la idea, todavía en
              investigación activa, de usar materiales físicos "desordenados" reales (redes de
              nanopartículas, cristales líquidos, incluso espuma de jabón, en experimentos reales
              publicados) y aprovechar su respuesta física natural y compleja a un estímulo para hacer
              cómputo útil, sin diseñar ningún circuito específico de antemano — "programar" el material
              ajustando qué estímulos le das, no su estructura interna.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <strong style={{ color: '#fff' }}>Organoides neuronales</strong> escalando más allá de
              DishBrain (sección VIII) — la pregunta real abierta no es si tejido neuronal cultivado puede
              aprender (ya se demostró), sino si se puede volver reproducible, estandarizado, y útil para
              algo más que una demostración puntual.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Y la dirección que más consenso real tiene en investigación seria hoy no es ninguna de
              estas arquitecturas "ganándole" a las demás, sino{' '}
              <strong style={{ color: '#fff' }}>híbridos post-Moore</strong>: un mismo sistema combinando
              varias de estas técnicas donde cada una resuelve su parte — memoria en memristores, una
              etapa de cómputo en analógico, control digital convencional alrededor, quizás una FPGA
              coordinando el conjunto — en vez de apostar a una sola arquitectura "de reemplazo total".
            </p>
            <Caption>
              Es la misma lección de fondo de la sección II de /archivo/autoorganizacion: sistemas
              complejos reales casi nunca se resuelven con un solo mecanismo puro — se resuelven
              combinando varios mecanismos especializados, cada uno mediocre solo, bueno en conjunto.
            </Caption>
          </Panel>
        </div>

        <div id="sec-11" className={`ncv-section ${visible['sec-11'] ? 'is-visible' : ''}`} style={{ marginBottom: 0 }}>
          <SectionHeader roman="XI" title="HONESTIDAD FINAL" sub="qué es producto hoy y qué sigue siendo laboratorio" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Separado con cuidado, para no mezclar entusiasmo con estado real: <strong style={{ color: '#fff' }}>
              comprable hoy, como producto real</strong> — FPGAs (de sobra, baratas, para hobbista o
              industria), chips neuromórficos de investigación accesibles a universidades (Loihi 2),
              aceleradores analógicos de IA en memoria (Mythic) para cargas específicas, chips fotónicos
              de inferencia de algunas startups ya vendiendo a clientes reales. <strong style={{ color: '#fff' }}>
              Laboratorio de investigación activa, sin producto masivo todavía</strong> — memristores como
              reemplazo general de memoria, computación reversible fuera de papers teóricos, in-materio
              computing, y escalar organoides neuronales más allá de demostraciones puntuales.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Ninguna de estas arquitecturas va a estar en tu próxima laptop reemplazando la CPU entera —
              esa no es, ni fue nunca, la promesa real. La promesa real, y la que de verdad se está
              cumpliendo ya, es más acotada y más interesante: cada vez más sistemas reales son híbridos,
              con una CPU convencional orquestando el conjunto y piezas de estas arquitecturas resolviendo,
              cada una, exactamente el problema puntual para el que son mejores que cualquier alternativa
              genérica — FPGA es, de todas, la más accesible hoy para empezar a tocar esto con las manos.
            </p>
          </Panel>
        </div>
      </div>

      <style>{`
        .ncv-section { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .ncv-section.is-visible { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .ncv-section { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
