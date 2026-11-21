// NPX-SUS-08 — COMPARATIVA. El documento de cierre de SUSTRATO: las
// cinco plataformas (Arduino, Raspberry Pi, Jetson, STM32, FPGA) una al
// lado de la otra, con el mismo criterio real en las cinco filas, más
// una tabla rápida y los patrones de combinación real (un producto real
// casi nunca usa una sola de estas, usa varias juntas, cada una
// resolviendo su parte).

import { SustratoDoc, Section, P, B, Caption } from '@/components/sustrato/DocPage'
import Link from 'next/link'

const ACCENT = '#8fa3b0'

const TOC = [
  { roman: 'I', id: 'sec-01', label: 'El criterio real — no "cuál es mejor"' },
  { roman: 'II', id: 'sec-02', label: 'Tabla rápida' },
  { roman: 'III', id: 'sec-03', label: 'Cuándo Arduino alcanza' },
  { roman: 'IV', id: 'sec-04', label: 'Cuándo hace falta Raspberry Pi' },
  { roman: 'V', id: 'sec-05', label: 'Cuándo hace falta Jetson' },
  { roman: 'VI', id: 'sec-06', label: 'Cuándo hace falta STM32 en vez de Arduino' },
  { roman: 'VII', id: 'sec-07', label: 'Cuándo hace falta FPGA' },
  { roman: 'VIII', id: 'sec-08', label: 'Combinaciones reales — casi nunca es una sola' },
  { roman: 'IX', id: 'sec-09', label: 'Cierre de SUSTRATO' },
]

type Row = { label: string; arduino: string; rpi: string; jetson: string; stm32: string; fpga: string }

const ROWS: Row[] = [
  { label: 'QUÉ ES', arduino: 'Microcontrolador 8/32 bits', rpi: 'SBC con Linux real', jetson: 'SBC + GPU CUDA', stm32: 'Microcontrolador ARM Cortex-M', fpga: 'Silicio reconfigurable' },
  { label: 'SISTEMA OPERATIVO', arduino: 'Ninguno (bare-metal)', rpi: 'Linux completo', jetson: 'Linux (JetPack/Ubuntu)', stm32: 'Ninguno o RTOS liviano', fpga: 'Ninguno — es lógica digital, no instrucciones' },
  { label: 'TIEMPO REAL ESTRICTO', arduino: 'Aproximado', rpi: 'No (jitter real del kernel)', jetson: 'No', stm32: 'Sí, por diseño', fpga: 'Sí — determinismo absoluto de hardware' },
  { label: 'COSTO TÍPICO', arduino: 'Bajo', rpi: 'Bajo-medio', jetson: 'Medio-alto', stm32: 'Bajo (el chip) / medio (placas dev)', fpga: 'Medio (hobby) a muy alto (industrial)' },
  { label: 'CURVA DE ENTRADA', arduino: 'Muy baja', rpi: 'Baja (si ya se sabe Linux)', jetson: 'Media-alta', stm32: 'Alta', fpga: 'Alta — otro paradigma de pensar' },
  { label: 'CASO QUE RESUELVE MEJOR', arduino: 'Prototipo simple, sensores básicos', rpi: 'Cómputo general, red, archivos, visión no crítica en tiempo', jetson: 'IA/visión en tiempo real sin nube', stm32: 'Control industrial, producto real', fpga: 'Paralelismo real a nivel de hardware' },
]

export const metadata = { title: 'COMPARATIVA // SUSTRATO // NeoProxy' }

function CompareTable() {
  const cols: { key: keyof Omit<Row, 'label'>; title: string; color: string }[] = [
    { key: 'arduino', title: 'ARDUINO', color: '#00979d' },
    { key: 'rpi', title: 'RASPBERRY PI', color: '#c51a4a' },
    { key: 'jetson', title: 'JETSON', color: '#76b900' },
    { key: 'stm32', title: 'STM32', color: '#3993dd' },
    { key: 'fpga', title: 'FPGA', color: '#ffb703' },
  ]
  return (
    <div style={{ overflowX: 'auto', marginBottom: 10 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 780, fontSize: 10 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px 10px', color: '#5a7290', borderBottom: `1px solid ${ACCENT}33`, whiteSpace: 'nowrap' }}>CRITERIO</th>
            {cols.map((c) => (
              <th key={c.key} style={{ textAlign: 'left', padding: '8px 10px', color: c.color, borderBottom: `1px solid ${ACCENT}33`, whiteSpace: 'nowrap' }}>
                {c.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label}>
              <td style={{ padding: '8px 10px', color: `${ACCENT}aa`, borderBottom: `1px solid ${ACCENT}15`, whiteSpace: 'nowrap' }}>{row.label}</td>
              {cols.map((c) => (
                <td key={c.key} style={{ padding: '8px 10px', color: '#c8daf0', borderBottom: `1px solid ${ACCENT}15`, lineHeight: 1.6 }}>
                  {row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ComparativaPage() {
  return (
    <SustratoDoc
      code="NPX-SUS-08" title="COMPARATIVA" subtitle="LAS CINCO PLATAFORMAS, UN SOLO CRITERIO REAL" accent={ACCENT}
      classification="SÍNTESIS — GUÍA DE DECISIÓN ENTRE PLATAFORMAS" revision="01 — IX SECCIONES"
      alcance="CRITERIO REAL → TABLA RÁPIDA → CUÁNDO CADA UNA → COMBINACIONES REALES → CIERRE DE SUSTRATO"
      toc={TOC}
      intro={<>
        El documento de cierre de SUSTRATO — no agrega una plataforma nueva, lee las cinco anteriores
        juntas (<Link href="/sustrato/arduino" style={{ color: '#fff', textDecoration: 'underline' }}>Arduino</Link>,{' '}
        <Link href="/sustrato/raspberry-pi" style={{ color: '#fff', textDecoration: 'underline' }}>Raspberry Pi</Link>,{' '}
        <Link href="/sustrato/jetson" style={{ color: '#fff', textDecoration: 'underline' }}>Jetson</Link>,{' '}
        <Link href="/sustrato/stm32" style={{ color: '#fff', textDecoration: 'underline' }}>STM32</Link>,{' '}
        <Link href="/sustrato/fpga" style={{ color: '#fff', textDecoration: 'underline' }}>FPGA</Link>) buscando
        el único criterio que de verdad importa para elegir entre ellas.
      </>}
    >
      <Section roman="I" id="sec-01" title='EL CRITERIO REAL — NO "CUÁL ES MEJOR"'>
        <P>
          Las cinco plataformas de esta sección no compiten entre sí — resuelven problemas distintos, y
          preguntar "¿cuál es la mejor?" sin más contexto no tiene una respuesta real. La pregunta que sí
          tiene respuesta real es: <B>¿este proyecto necesita un sistema operativo completo, tiempo real
          estricto, cómputo paralelo masivo, o lógica digital hecha a medida?</B> — cada una de esas cuatro
          respuestas apunta a una plataforma distinta de esta lista, casi sin ambigüedad.
        </P>
      </Section>

      <Section roman="II" id="sec-02" title="TABLA RÁPIDA">
        <CompareTable />
        <Caption>
          Esta tabla es un resumen de navegación rápida, no el argumento completo — cada fila se desarrolla
          en las secciones III a VII, y cada plataforma tiene su propio documento extenso aparte.
        </Caption>
      </Section>

      <Section roman="III" id="sec-03" title="CUÁNDO ARDUINO ALCANZA">
        <P>
          Sensores simples, actuadores básicos, proyectos educativos, prototipos donde la velocidad de
          iteración importa más que la eficiencia final del diseño, y cualquier caso donde el presupuesto de
          tiempo de desarrollo es más escaso que el de hardware. Si el proyecto entero cabe en el catálogo de{' '}
          <Link href="/sustrato/sensores" style={{ color: '#fff', textDecoration: 'underline' }}>SENSORES</Link>{' '}
          más alguna lógica simple de decisión, Arduino casi siempre alcanza.
        </P>
      </Section>

      <Section roman="IV" id="sec-04" title="CUÁNDO HACE FALTA RASPBERRY PI">
        <P>
          En el momento en que el proyecto necesita red real (servir una página web, hablar con una API),
          almacenamiento real (una base de datos, archivos grandes), múltiples procesos corriendo a la vez
          sin pisarse, o cualquier lenguaje de alto nivel sin las restricciones extremas de memoria de un
          microcontrolador — ahí Arduino deja de alcanzar y Raspberry Pi (u otra SBC con Linux equivalente)
          es la respuesta directa.
        </P>
      </Section>

      <Section roman="V" id="sec-05" title="CUÁNDO HACE FALTA JETSON">
        <P>
          Específicamente cuando el proyecto necesita interpretar video o audio en vivo con un modelo de IA
          real — detección de objetos, seguimiento, reconocimiento — sin depender de la nube y a velocidad
          útil en tiempo real. Si la tarea es "correr una red neuronal sobre una cámara en vivo", ni Arduino
          ni Raspberry Pi (sin un acelerador aparte) llegan — Jetson existe exactamente para ese caso.
        </P>
      </Section>

      <Section roman="VI" id="sec-06" title="CUÁNDO HACE FALTA STM32 EN VEZ DE ARDUINO">
        <P>
          Cuando el proyecto deja de ser un prototipo y se vuelve un producto real: control de motores con
          temporización garantizada (no aproximada), varios periféricos de comunicación corriendo
          simultáneos sin que se bloqueen entre sí, certificaciones industriales, o simplemente un volumen de
          producción donde optimizar el costo del componente importa de verdad. Si "probablemente funciona
          bien casi siempre" no alcanza y hace falta "garantizado por diseño", la respuesta es STM32 (o una
          familia Cortex-M equivalente), no Arduino.
        </P>
      </Section>

      <Section roman="VII" id="sec-07" title="CUÁNDO HACE FALTA FPGA">
        <P>
          Cuando el problema es inherentemente paralelo a nivel de hardware y ninguna CPU secuencial —por
          rápida que sea— puede ejecutarlo lo bastante rápido, o cuando el determinismo de tiempo tiene que
          ser absoluto, a nivel de nanosegundos, no de microsegundos. También cuando el proyecto necesita
          diseñar su propia arquitectura digital a medida (un generador de números aleatorios por hardware
          real, como el TRNG de este mismo proyecto) en vez de programar un procesador ya fijo de fábrica.
        </P>
      </Section>

      <Section roman="VIII" id="sec-08" title="COMBINACIONES REALES — CASI NUNCA ES UNA SOLA">
        <P>
          Ningún producto real serio usa una sola de estas cinco plataformas en aislamiento — las combina,
          cada una resolviendo su parte. Un patrón real y común en robótica: un <B>STM32</B> controla los
          motores con temporización garantizada en tiempo real, mientras una <B>Raspberry Pi</B> o un{' '}
          <B>Jetson</B> corre la visión por computadora y la toma de decisiones de alto nivel, comunicándose
          ambos por UART, I2C o SPI (ver{' '}
          <Link href="/sustrato/fundamentos#sec-07" style={{ color: '#fff', textDecoration: 'underline' }}>
            Fundamentos, sección VII
          </Link>) — ninguno de los dos chips hace el trabajo del otro, cada uno hace lo que mejor sabe
          hacer. Es exactamente la misma lógica que cierra el documento de{' '}
          <Link href="/archivo/computacion-no-convencional#sec-10" style={{ color: '#fff', textDecoration: 'underline' }}>
            computación no convencional
          </Link>: los sistemas reales se resuelven combinando mecanismos especializados, no apostando a uno
          solo que haga todo.
        </P>
      </Section>

      <Section roman="IX" id="sec-09" title="CIERRE DE SUSTRATO">
        <P>
          Con esto se cierra la sección completa:{' '}
          <Link href="/sustrato/fundamentos" style={{ color: '#fff', textDecoration: 'underline' }}>FUNDAMENTOS</Link>{' '}
          para los conceptos base,{' '}
          <Link href="/sustrato/sensores" style={{ color: '#fff', textDecoration: 'underline' }}>SENSORES Y PERIFÉRICOS</Link>{' '}
          como catálogo de referencia, y cinco plataformas reales con sus límites honestos, no solo sus
          promesas de marketing. El criterio que debería quedar, más que cualquier dato suelto: elegir
          hardware es elegir qué restricción se está dispuesto a aceptar, nunca "la mejor opción" en
          abstracto.
        </P>
      </Section>
    </SustratoDoc>
  )
}
