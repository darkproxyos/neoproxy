// NPX-SUS-04 — RASPBERRY PI. Historia real (Cambridge, declive de
// aplicantes con experiencia previa de programación como motivación
// documentada), por qué es una categoría distinta de Arduino (SBC con
// Linux real, no microcontrolador bare-metal), familia completa
// (incluida la aclaración real de que el Pico NO es un Raspberry Pi
// "SBC" sino un microcontrolador aparte), y los límites reales.

import { SustratoDoc, Section, P, B, SpecLine, Caption } from '@/components/sustrato/DocPage'
import Link from 'next/link'

const ACCENT = '#c51a4a'

const TOC = [
  { roman: 'I', id: 'sec-01', label: 'Cambridge — por qué nació' },
  { roman: 'II', id: 'sec-02', label: 'Qué es realmente — una SBC, no un microcontrolador' },
  { roman: 'III', id: 'sec-03', label: 'Arquitectura — el SoC por dentro' },
  { roman: 'IV', id: 'sec-04', label: 'La familia completa (y el Pico, que es otra cosa)' },
  { roman: 'V', id: 'sec-05', label: 'GPIO y HATs' },
  { roman: 'VI', id: 'sec-06', label: 'El sistema operativo' },
  { roman: 'VII', id: 'sec-07', label: 'Casos de uso reales' },
  { roman: 'VIII', id: 'sec-08', label: 'Raspberry Pi vs. Arduino, de frente' },
  { roman: 'IX', id: 'sec-09', label: 'Los límites reales' },
  { roman: 'X', id: 'sec-10', label: 'De acá en adelante' },
]

export const metadata = { title: 'RASPBERRY PI // SUSTRATO // NeoProxy' }

export default function RaspberryPiPage() {
  return (
    <SustratoDoc
      code="NPX-SUS-04" title="RASPBERRY PI" subtitle="UNA COMPUTADORA LINUX COMPLETA DEL TAMAÑO DE UNA TARJETA" accent={ACCENT}
      classification="SBC (SINGLE-BOARD COMPUTER) — CÓMPUTO GENERAL EMBEBIDO" revision="01 — X SECCIONES"
      alcance="HISTORIA REAL → ARQUITECTURA → FAMILIA COMPLETA → GPIO/HATS → SISTEMA OPERATIVO → VS. ARDUINO"
      toc={TOC}
      intro={<>
        Después de{' '}
        <Link href="/sustrato/arduino" style={{ color: '#fff', textDecoration: 'underline' }}>Arduino</Link>,
        la plataforma que entra cuando el proyecto necesita un sistema operativo real debajo — no una placa
        "más potente", una categoría de máquina distinta.
      </>}
    >
      <Section roman="I" id="sec-01" title="CAMBRIDGE — POR QUÉ NACIÓ">
        <P>
          A mediados de los 2000, <B>Eben Upton</B> y colegas en el Laboratorio de Computación de la
          Universidad de Cambridge notaron una caída real en la cantidad y la preparación previa de quienes
          postulaban a la carrera de Ciencias de la Computación — muy distinto a los 80, cuando computadoras
          domésticas como la Sinclair ZX Spectrum o la BBC Micro venían pensadas para que cualquiera
          programara directo al encenderlas. La <B>Raspberry Pi Foundation</B> se formó para revertir eso:
          una computadora completa, barata, pensada para que programar y "abrir la máquina" volviera a ser
          lo primero que alguien hiciera con ella, no lo último. El primer modelo salió a la venta en 2012.
        </P>
      </Section>

      <Section roman="II" id="sec-02" title="QUÉ ES REALMENTE — UNA SBC, NO UN MICROCONTROLADOR">
        <P>
          La diferencia real con Arduino no es de grado, es de categoría: Arduino es un microcontrolador
          bare-metal (Fundamentos de Arduino, sección IV) — Raspberry Pi es una <B>SBC</B> (single-board
          computer, computadora de placa única): tiene CPU, GPU, RAM, y corre un <B>sistema operativo Linux
          real</B> con multitarea, gestión de memoria protegida, red TCP/IP nativa, y un sistema de archivos
          completo — todo lo que un microcontrolador bare-metal no tiene. Se programa como cualquier
          computadora Linux: Python, C/C++, Node.js, lo que sea, no un sketch con <code>setup()</code>/
          <code>loop()</code>.
        </P>
      </Section>

      <Section roman="III" id="sec-03" title="ARQUITECTURA — EL SOC POR DENTRO">
        <P>
          El corazón es un <B>SoC</B> (system-on-chip) de Broadcom con uno o varios núcleos <B>ARM</B> (la
          misma familia de arquitectura que domina smartphones), más una <B>GPU VideoCore</B> propia de
          Broadcom integrada en el mismo chip, capaz de decodificar video en hardware. A diferencia del AVR
          de 8 bits de un Arduino clásico, esto es arquitectura de 32 o 64 bits con unidad de punto flotante
          real por hardware — la diferencia concreta que permite correr un sistema operativo completo encima.
        </P>
      </Section>

      <Section roman="IV" id="sec-04" title="LA FAMILIA COMPLETA (Y EL PICO, QUE ES OTRA COSA)">
        <P>
          <B>Pi 1</B> (2012, Model A/B): el original. <B>Pi 2</B> (2015): primer salto a múltiples núcleos
          ARM de 32 bits reales. <B>Pi 3</B> (2016): primera con WiFi y Bluetooth integrados de fábrica, sin
          dongle USB aparte. <B>Pi 4</B> (2019): salto grande — USB 3.0, salida de doble monitor, hasta 8GB
          de RAM, suficiente para usarse como computadora de escritorio liviana real. <B>Pi 5</B> (2023):
          mejora sustancial de velocidad y agrega PCIe para expansión (SSDs NVMe, por ejemplo). <B>Zero /
          Zero W / Zero 2 W</B>: la línea ultra compacta y barata, pensada para proyectos embebidos donde el
          tamaño y el costo pesan más que la potencia.
        </P>
        <Caption>
          El <B>Raspberry Pi Pico</B> (2021) NO es parte de esta familia de SBC pese al nombre compartido:
          es un microcontrolador propio (chip <B>RP2040</B>, diseñado por la misma Raspberry Pi Foundation),
          sin Linux, programado más parecido a un Arduino o un STM32 que a una Raspberry Pi real — la
          confusión de nombres es real y vale la pena aclararla antes de comprar el equivocado para un
          proyecto.
        </Caption>
      </Section>

      <Section roman="V" id="sec-05" title="GPIO Y HATS">
        <P>
          Expone pines <B>GPIO</B> igual que Arduino, con I2C, SPI y UART disponibles — pero a diferencia de
          muchos Arduino clásicos (5V), el GPIO de Raspberry Pi trabaja a <B>3.3V</B> y, en la gran mayoría de
          modelos, <B>no tolera 5V</B> en sus entradas sin protección adicional: conectar un sensor de 5V
          directo puede dañar el pin (ver Fundamentos, sección IV). Los <B>HAT</B> (Hardware Attached on Top)
          son placas de expansión con un formato físico y protocolo de identificación estándar (un pequeño
          EEPROM que le dice al sistema operativo qué HAT está conectado y cómo configurarlo automáticamente)
          — el equivalente conceptual a los shields de Arduino, pero con ese paso extra de autodetección.
        </P>
      </Section>

      <Section roman="VI" id="sec-06" title="EL SISTEMA OPERATIVO">
        <P>
          <B>Raspberry Pi OS</B> (antes llamado Raspbian) es la distribución oficial, basada en Debian — pero
          no es la única opción: al ser hardware ARM estándar con buen soporte, corre prácticamente cualquier
          distribución Linux compilada para esa arquitectura (Ubuntu, varias distros especializadas), además
          de proyectos como <B>RetroPie</B> (emulación de consolas retro) u opciones experimentales de
          Android o Windows IoT en modelos compatibles.
        </P>
      </Section>

      <Section roman="VII" id="sec-07" title="CASOS DE USO REALES">
        <P>
          Servidores caseros de bajo consumo (DNS ad-blocking, servidor de archivos, servidor de juegos
          liviano), estaciones de retro-gaming, visión por computadora con la cámara oficial (procesar
          imágenes reales, algo que ningún Arduino puede hacer por sí solo), clusters educativos de cómputo
          distribuido, y robótica con <B>ROS</B> (Robot Operating System) — que necesita un Linux real
          debajo para correr, no un microcontrolador bare-metal.
        </P>
      </Section>

      <Section roman="VIII" id="sec-08" title="RASPBERRY PI VS. ARDUINO, DE FRENTE">
        <P>
          Multitarea real, red nativa, un sistema de archivos completo, lenguajes de alto nivel sin
          restricciones de memoria extremas — a cambio de un arranque de varios segundos (no instantáneo
          como un microcontrolador), consumo de energía bastante mayor, y algo clave: <B>Linux no es un
          sistema operativo de tiempo real</B>. El kernel puede introducir <em>jitter</em> (variación
          impredecible de latencia) en una señal GPIO que un Arduino entregaría con temporización exacta y
          predecible — para control de motores con timing crítico a nivel de microsegundos, Arduino (o,
          más en serio todavía,{' '}
          <Link href="/sustrato/stm32" style={{ color: '#fff', textDecoration: 'underline' }}>STM32</Link>)
          sigue siendo la respuesta correcta, no Raspberry Pi.
        </P>
      </Section>

      <Section roman="IX" id="sec-09" title="LOS LÍMITES REALES">
        <P>
          Ninguna Raspberry Pi trae <B>ADC nativo</B> en su GPIO (a diferencia de casi cualquier Arduino) —
          leer un sensor puramente analógico (un LDR, un potenciómetro) necesita un chip ADC externo
          dedicado (como el MCP3008 por SPI) de por medio, un paso extra que en Arduino no hace falta. No es
          apta para control de tiempo real estricto por las razones de la sección VIII. Y, al ser una
          computadora Linux completa, hereda también sus superficies de ataque reales — asegurar una
          Raspberry Pi expuesta a internet es un problema de seguridad de sistemas real, no algo que un
          microcontrolador bare-metal necesite considerar de la misma forma.
        </P>
      </Section>

      <Section roman="X" id="sec-10" title="DE ACÁ EN ADELANTE">
        <P>
          Para cuándo este escalón de potencia todavía no alcanza (visión por computadora en tiempo real,
          redes neuronales corriendo con GPU dedicada), el siguiente documento es{' '}
          <Link href="/sustrato/jetson" style={{ color: '#fff', textDecoration: 'underline' }}>NVIDIA JETSON</Link>.
          Para la decisión completa entre las cinco plataformas de la sección, la{' '}
          <Link href="/sustrato/comparativa" style={{ color: '#fff', textDecoration: 'underline' }}>COMPARATIVA</Link>.
        </P>
      </Section>
    </SustratoDoc>
  )
}
