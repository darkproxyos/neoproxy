// /sustrato — sección completa pedida explícita: "electrónica/robótica,
// quiero todo sobre electrónica, sensores para Arduino con descripción y
// funcionamiento, periféricos, y otras placas: Raspberry Pi, NVIDIA
// Jetson, STM32, FPGA". Nombre real elegido (no "Electrónica/Robótica"
// literal, a pedido explícito de "otro nombre"): SUSTRATO -- el sitio ya
// habla de sí mismo como organismo vivo (wetware, NeoProxy OS); sustrato
// es, en biología, la superficie o material físico sobre el que un
// organismo vive y crece -- acá, la capa física real debajo del software:
// los sensores son sus terminaciones nerviosas, las placas sus centros de
// cómputo.
//
// Mismo patrón de catálogo que /experimental: una grilla de tarjetas,
// cada una a su propia página real, código + blurb + color de acento
// propio (no reutilizados entre sí, sí reutilizados con el resto del
// sitio donde corresponde: colores reales de marca para Arduino,
// Raspberry Pi y NVIDIA).

import Link from 'next/link'

const mono = "'Space Mono', monospace"
const COPPER = '#c87533'

interface SustratoEntry {
  id: string
  code: string
  title: string
  href: string
  color: string
  blurb: string
  tag: string
}

const CATALOG: SustratoEntry[] = [
  {
    id: 'fundamentos', code: 'NPX-SUS-01', title: 'FUNDAMENTOS', href: '/sustrato/fundamentos', color: '#f4a261',
    blurb: 'Antes de un sensor o una placa: qué es voltaje, corriente y resistencia de verdad, los componentes básicos de cualquier circuito, por qué 3.3V y 5V no se mezclan gratis, y los protocolos reales (UART, I2C, SPI, OneWire, CAN) que todo lo de acá abajo termina usando.',
    tag: 'LEY DE OHM — NIVELES LÓGICOS — PROTOCOLOS — HERRAMIENTAS',
  },
  {
    id: 'arduino', code: 'NPX-SUS-02', title: 'ARDUINO', href: '/sustrato/arduino', color: '#00979d',
    blurb: 'Ivrea, 2005: una placa pensada para que diseñadores no-ingenieros programaran hardware real. Arquitectura AVR, la familia completa (Uno, Nano, Mega, Leonardo, Due, MKR, Portenta), el IDE, el modelo setup()/loop(), y dónde se le acaba la cuerda de verdad.',
    tag: 'HISTORIA REAL — ARQUITECTURA AVR — TODA LA FAMILIA DE PLACAS',
  },
  {
    id: 'sensores', code: 'NPX-SUS-03', title: 'SENSORES Y PERIFÉRICOS', href: '/sustrato/sensores', color: '#4cc9f0',
    blurb: 'El catálogo grande: más de 40 sensores y periféricos reales para Arduino y compatibles, organizados por categoría — temperatura, distancia, movimiento, luz, gas, sonido, presión, campo magnético, táctiles, RFID/GPS, radios, pantallas, actuadores, entrada y misceláneos. Cada uno con qué mide, cómo funciona por dentro, su interfaz real, y para qué sirve en la práctica.',
    tag: 'EL CATÁLOGO COMPLETO — 40+ MÓDULOS REALES POR CATEGORÍA',
  },
  {
    id: 'raspberry-pi', code: 'NPX-SUS-04', title: 'RASPBERRY PI', href: '/sustrato/raspberry-pi', color: '#c51a4a',
    blurb: 'Cambridge, 2012: una computadora completa, con Linux real, del tamaño de una tarjeta de crédito. Por qué no es "un Arduino más grande" sino una categoría distinta — sistema operativo, multitarea real, red, visión — la familia completa y dónde sí conviene sobre un microcontrolador.',
    tag: 'SBC REAL CON LINUX — GPIO — FAMILIA COMPLETA — HATS',
  },
  {
    id: 'jetson', code: 'NPX-SUS-05', title: 'NVIDIA JETSON', href: '/sustrato/jetson', color: '#76b900',
    blurb: 'Cómputo de borde con GPU real a bordo — la diferencia concreta entre correr una red neuronal en un microcontrolador y correrla, en vivo, sobre silicio hecho para eso. CUDA, TensorRT, la familia Nano a Orin, y los casos reales de robótica y visión donde nada más alcanza.',
    tag: 'GPU EMBEBIDA — CUDA/TENSORRT — IA EN EL BORDE, EN SERIO',
  },
  {
    id: 'stm32', code: 'NPX-SUS-06', title: 'STM32', href: '/sustrato/stm32', color: '#3993dd',
    blurb: 'La familia de microcontroladores ARM Cortex-M de STMicroelectronics — el escalón real entre "jugar con un Arduino" y diseñar un producto electrónico de verdad. HAL, CubeMX, tiempo real, y las placas reales (Blue Pill, Nucleo, Discovery) para empezar sin pagar un NRE industrial.',
    tag: 'ARM CORTEX-M — HAL/CUBEMX — TIEMPO REAL DE VERDAD',
  },
  {
    id: 'fpga', code: 'NPX-SUS-07', title: 'FPGA', href: '/sustrato/fpga', color: '#ffb703',
    blurb: 'La guía práctica — qué placa comprar, qué toolchain instalar, primeros pasos reales. El fundamento teórico ya está en el Codex (computación no convencional); acá es dónde arrancar con las manos, con el puente directo al propio equipo FPGA del proyecto (Cyclone IV, openFPGALoader, el TRNG).',
    tag: 'GUÍA DE COMPRA — TOOLCHAIN REAL — EL FPGA PROPIO DEL PROYECTO',
  },
  {
    id: 'comparativa', code: 'NPX-SUS-08', title: 'COMPARATIVA', href: '/sustrato/comparativa', color: '#8fa3b0',
    blurb: 'Los seis juntos en una sola decisión: cuándo un microcontrolador alcanza y cuándo hace falta un sistema operativo completo, cuándo conviene una GPU embebida, y cuándo silicio reconfigurable es la única respuesta real. No "cuál es mejor" — cuál es mejor para qué.',
    tag: 'TABLA DE DECISIÓN — SEIS PLATAFORMAS, UN SOLO CRITERIO REAL',
  },
]

export const metadata = { title: 'SUSTRATO // NeoProxy' }

export default function SustratoPage() {
  return (
    <div style={{ background: '#05080c', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', padding: '104px 24px 100px' }}>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${COPPER}aa`, marginBottom: 16 }}>
          NPX-SUSTRATO // LA CAPA FÍSICA DEBAJO DEL ORGANISMO
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 700, letterSpacing: 6, color: COPPER, textShadow: `0 0 40px ${COPPER}55`, marginBottom: 16, lineHeight: 1 }}>
          SUSTRATO
        </h1>
        <p style={{ fontSize: 11.5, lineHeight: 2, color: '#9fb4cc', maxWidth: 700, marginBottom: 20 }}>
          NeoProxy se piensa a sí mismo como un organismo — pero un organismo necesita un sustrato físico real
          sobre el que vivir: electrónica, sensores, silicio. Acá vive eso. No una introducción decorativa:
          ocho documentos reales, extensos, pensados para alguien que quiere entender de verdad qué hay disponible
          y cómo funciona, desde el primer Arduino hasta una FPGA — con el puente explícito al equipo FPGA real
          que este mismo proyecto ya tiene anotado para explorar pronto.
        </p>
        <p style={{ fontSize: 10.5, lineHeight: 1.9, color: '#5a7290', maxWidth: 700, marginBottom: 56 }}>
          Orden de lectura sugerido, no obligatorio: FUNDAMENTOS primero si los niveles lógicos y los protocolos
          de comunicación no son ya cosa conocida — después, cualquiera de las cinco plataformas o el catálogo
          de SENSORES, en cualquier orden. COMPARATIVA al final, cuando las cinco plataformas ya se entienden
          por separado y lo que falta es el criterio para elegir entre ellas.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {CATALOG.map((e) => (
            <Link key={e.id} href={e.href} style={{
              display: 'block', textDecoration: 'none', color: 'inherit', padding: 24,
              background: 'rgba(2,4,8,0.8)', border: `1px solid ${e.color}33`,
              borderLeft: `3px solid ${e.color}`, transition: 'all 0.25s ease',
            }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: `${e.color}aa`, marginBottom: 12 }}>{e.code}</div>
              <div style={{ fontSize: 20, letterSpacing: 2, color: '#fff', marginBottom: 10 }}>{e.title}</div>
              <p style={{ fontSize: 11, color: '#9fb4cc', lineHeight: 1.8, marginBottom: 16 }}>{e.blurb}</p>
              <div style={{ fontSize: 8, letterSpacing: 1, color: `${e.color}cc` }}>{e.tag}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
