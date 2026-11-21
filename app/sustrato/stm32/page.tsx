// NPX-SUS-06 — STM32. El escalón real entre "jugar con un Arduino" y
// diseñar un producto electrónico industrial: arquitectura Cortex-M,
// periféricos de hardware reales (DMA, timers avanzados), HAL/CubeMX,
// placas reales para empezar (Blue Pill, Nucleo, Discovery), y por qué
// el tiempo real en Arduino es, en el fondo, una aproximación.

import { SustratoDoc, Section, P, B, Caption } from '@/components/sustrato/DocPage'
import Link from 'next/link'

const ACCENT = '#3993dd'

const TOC = [
  { roman: 'I', id: 'sec-01', label: 'Qué es y de dónde viene' },
  { roman: 'II', id: 'sec-02', label: 'El escalón real entre Arduino y la industria' },
  { roman: 'III', id: 'sec-03', label: 'Arquitectura Cortex-M — no todos los STM32 son iguales' },
  { roman: 'IV', id: 'sec-04', label: 'Periféricos de hardware reales — DMA, timers avanzados' },
  { roman: 'V', id: 'sec-05', label: 'HAL y CubeMX' },
  { roman: 'VI', id: 'sec-06', label: 'Tiempo real, en serio' },
  { roman: 'VII', id: 'sec-07', label: 'Placas reales para empezar' },
  { roman: 'VIII', id: 'sec-08', label: 'Cómo se programa de verdad' },
  { roman: 'IX', id: 'sec-09', label: 'Los límites reales (el costo de todo esto)' },
  { roman: 'X', id: 'sec-10', label: 'De acá en adelante' },
]

export const metadata = { title: 'STM32 // SUSTRATO // NeoProxy' }

export default function Stm32Page() {
  return (
    <SustratoDoc
      code="NPX-SUS-06" title="STM32" subtitle="EL MICROCONTROLADOR CUANDO ARDUINO YA NO ALCANZA" accent={ACCENT}
      classification="MICROCONTROLADORES ARM CORTEX-M — NIVEL INDUSTRIAL" revision="01 — X SECCIONES"
      alcance="QUÉ ES → CORTEX-M → PERIFÉRICOS DE HARDWARE → HAL/CUBEMX → TIEMPO REAL → PLACAS REALES → LÍMITES"
      toc={TOC}
      intro={<>
        Entre{' '}
        <Link href="/sustrato/arduino" style={{ color: '#fff', textDecoration: 'underline' }}>Arduino</Link>{' '}
        (fácil de empezar, limitado en el fondo) y diseñar un chip propio, hay un escalón real donde vive la
        mayoría de la electrónica de producto que existe de verdad: STM32 es, probablemente, el ocupante más
        común de ese escalón.
      </>}
    >
      <Section roman="I" id="sec-01" title="QUÉ ES Y DE DÓNDE VIENE">
        <P>
          <B>STM32</B> es la familia de microcontroladores de <B>STMicroelectronics</B> (empresa
          franco-italiana) basada en núcleos <B>ARM Cortex-M</B> con licencia de ARM Holdings — lanzada en
          2007. A diferencia del AVR de 8 bits de un Arduino clásico, es arquitectura <B>ARM de 32 bits</B>{' '}
          real, la misma familia de núcleos (en otras variantes) detrás de buena parte de los
          microcontroladores industriales del mundo — no un diseño de nicho, el estándar de facto.
        </P>
      </Section>

      <Section roman="II" id="sec-02" title="EL ESCALÓN REAL ENTRE ARDUINO Y LA INDUSTRIA">
        <P>
          Arduino resuelve "quiero prototipar rápido sin saber electrónica profunda". STM32 resuelve el
          problema siguiente: ese prototipo necesita convertirse en un <B>producto real</B> — con costos de
          componente ajustados al centavo en volumen, periféricos de hardware específicos que un chip
          genérico no tiene, certificaciones, y control de tiempo real estricto. Electrodomésticos,
          controladores de motor industriales, dispositivos médicos no críticos, y buena parte de la
          electrónica de consumo que no se nota a simple vista corren sobre STM32 o familias equivalentes de
          otros fabricantes (NXP, Microchip, Texas Instruments) con el mismo rol.
        </P>
      </Section>

      <Section roman="III" id="sec-03" title="ARQUITECTURA CORTEX-M — NO TODOS LOS STM32 SON IGUALES">
        <P>
          "STM32" no es un solo chip, es una familia con varios núcleos Cortex-M de capacidad muy distinta:{' '}
          <B>M0/M0+</B> (los más simples y baratos, pensados para reemplazar un 8 bits clásico con más
          margen), <B>M3</B> (equilibrio general), <B>M4</B> (suma una unidad de punto flotante real por
          hardware y extensiones DSP — procesamiento de señal digital, útil para audio o control de motores
          avanzado), y <B>M7/H7</B> (la gama alta, con más velocidad de reloj y cachés de instrucción/datos
          reales, como un procesador de propósito más general). Elegir cuál usar depende por completo de qué
          necesita el proyecto — no hay un "STM32 estándar" único.
        </P>
      </Section>

      <Section roman="IV" id="sec-04" title="PERIFÉRICOS DE HARDWARE REALES — DMA, TIMERS AVANZADOS">
        <P>
          La diferencia que más se nota en la práctica frente a Arduino: <B>DMA</B> (acceso directo a
          memoria) permite mover datos entre un periférico (un ADC, un UART) y la memoria <B>sin que la CPU
          intervenga en cada byte</B> — la CPU queda libre para hacer otra cosa mientras el dato se mueve
          solo, algo que un AVR simple no ofrece de la misma forma. Los <B>timers avanzados</B> de STM32
          pueden generar varias señales PWM sincronizadas entre sí con precisión de hardware (clave para
          control de motores trifásicos reales), y suelen traer múltiples periféricos UART/I2C/SPI
          <B> simultáneos e independientes</B>, no uno solo compartido por software.
        </P>
      </Section>

      <Section roman="V" id="sec-05" title="HAL Y CUBEMX">
        <P>
          <B>HAL</B> (Hardware Abstraction Layer) es la capa de software oficial de ST que expone los
          periféricos del chip con funciones razonablemente portables entre distintos modelos de STM32 — en
          vez de escribir registros de hardware a mano línea por línea. <B>STM32CubeMX</B> es la herramienta
          gráfica de configuración: se arma visualmente qué periférico va en qué pin, qué reloj usa cada uno,
          y la herramienta genera el esqueleto de código real en base a esa configuración — reduce
          drásticamente el trabajo manual de inicialización que antes había que escribir a mano consultando
          el manual de referencia del chip.
        </P>
      </Section>

      <Section roman="VI" id="sec-06" title="TIEMPO REAL, EN SERIO">
        <P>
          Un Arduino puede acercarse a temporización precisa, pero sigue siendo, en el fondo, un bucle
          cooperativo simple (Arduino, sección IV) — un <code>delay()</code> en cualquier parte del código
          bloquea todo lo demás. STM32 soporta <B>interrupciones anidadas con prioridades reales</B> (una
          interrupción de mayor prioridad puede interrumpir a una de menor prioridad ya en curso) y, en
          proyectos más serios, corre un <B>RTOS</B> (sistema operativo de tiempo real, como FreeRTOS) que
          garantiza que una tarea crítica se ejecute dentro de una ventana de tiempo predecible — la
          diferencia real entre "generalmente responde rápido" y "garantizado por diseño", la que importa en
          control industrial o dispositivos médicos.
        </P>
      </Section>

      <Section roman="VII" id="sec-07" title="PLACAS REALES PARA EMPEZAR">
        <P>
          <B>Blue Pill</B>: un clon chino muy barato con un STM32F103 (Cortex-M3), popular justamente por su
          precio — con las salvedades reales de variabilidad de calidad de fabricación entre lotes que
          cualquier clon económico tiene. <B>Nucleo</B>: placas de desarrollo oficiales de ST, con un{' '}
          <B>ST-Link</B> programador/depurador integrado en la misma placa (no hace falta hardware aparte
          para subir y depurar código, a diferencia del Blue Pill) — el punto de entrada recomendado para
          empezar en serio. <B>Discovery</B>: placas oficiales de ST con periféricos de demostración
          adicionales (pantallas, sensores de movimiento) soldados, pensadas para evaluar las capacidades
          del chip sin armar nada externo todavía.
        </P>
      </Section>

      <Section roman="VIII" id="sec-08" title="CÓMO SE PROGRAMA DE VERDAD">
        <P>
          El camino "nativo" real es <B>STM32CubeIDE</B> (gratuito, de ST, integra CubeMX + un entorno
          Eclipse + depuración) o entornos profesionales como <B>Keil</B> o <B>IAR</B> (de pago, usados en
          la industria por certificaciones y optimización de código). Existe también un core de terceros
          que permite programar algunos STM32 directo desde el <B>IDE de Arduino</B> — útil para una
          transición gradual, pero sin exponer la mayoría de los periféricos avanzados de hardware
          (DMA, timers complejos) que son, justamente, la razón real de elegir STM32 en primer lugar.
        </P>
      </Section>

      <Section roman="IX" id="sec-09" title="LOS LÍMITES REALES (EL COSTO DE TODO ESTO)">
        <P>
          Nada de esto es gratis: la curva de aprendizaje es real y mayor que Arduino — entender clocks,
          árboles de reloj internos, y configuración de periféricos de hardware específicos toma más tiempo
          que <code>digitalWrite()</code>. La documentación es mucho más técnica (manuales de referencia de
          cientos de páginas por familia de chip) y menos amigable para quien recién empieza. Y el ecosistema
          de módulos "enchufa y anda" tan vasto como el de Arduino simplemente no existe de la misma forma —
          se gana control real, se pierde comodidad inmediata.
        </P>
      </Section>

      <Section roman="X" id="sec-10" title="DE ACÁ EN ADELANTE">
        <P>
          Cuando ni siquiera un microcontrolador alcanza — porque lo que hace falta es silicio que se
          reconfigura a nivel de lógica digital, no que ejecuta instrucciones una por una — el siguiente
          documento es <Link href="/sustrato/fpga" style={{ color: '#fff', textDecoration: 'underline' }}>FPGA</Link>.
        </P>
      </Section>
    </SustratoDoc>
  )
}
