// NPX-SUS-02 — ARDUINO. Historia real (Ivrea 2005, el proyecto Wiring
// como antecedente directo), arquitectura AVR, la familia completa de
// placas (incluida la distinción real con ESP8266/ESP32, que no son
// Arduino "oficial" pero viven en el mismo ecosistema), y los límites
// reales -- no solo lo que Arduino permite, también dónde se le acaba.

import { SustratoDoc, Section, P, B, SpecLine, Caption } from '@/components/sustrato/DocPage'
import Link from 'next/link'

const ACCENT = '#00979d'

const TOC = [
  { roman: 'I', id: 'sec-01', label: 'Ivrea, 2005 — por qué nació' },
  { roman: 'II', id: 'sec-02', label: 'Qué es Arduino, en realidad' },
  { roman: 'III', id: 'sec-03', label: 'Arquitectura AVR — qué hay adentro del chip' },
  { roman: 'IV', id: 'sec-04', label: 'El modelo de programación — setup(), loop(), y nada de sistema operativo' },
  { roman: 'V', id: 'sec-05', label: 'La familia real de placas' },
  { roman: 'VI', id: 'sec-06', label: 'ESP8266 / ESP32 — mismo ecosistema, otro fabricante' },
  { roman: 'VII', id: 'sec-07', label: 'Shields — el ecosistema físico' },
  { roman: 'VIII', id: 'sec-08', label: 'Dónde brilla de verdad' },
  { roman: 'IX', id: 'sec-09', label: 'Los límites reales' },
  { roman: 'X', id: 'sec-10', label: 'De acá en adelante' },
]

export const metadata = { title: 'ARDUINO // SUSTRATO // NeoProxy' }

export default function ArduinoPage() {
  return (
    <SustratoDoc
      code="NPX-SUS-02" title="ARDUINO" subtitle="LA PLACA QUE LE ENSEÑÓ HARDWARE A QUIEN NO VENÍA DE INGENIERÍA" accent={ACCENT}
      classification="MICROCONTROLADORES — PLATAFORMA DE PROTOTIPADO" revision="01 — X SECCIONES"
      alcance="HISTORIA REAL → ARQUITECTURA AVR → MODELO DE PROGRAMACIÓN → FAMILIA DE PLACAS → ESP8266/ESP32 → LÍMITES"
      toc={TOC}
      intro={<>
        Antes de los sensores (<Link href="/sustrato/sensores" style={{ color: '#fff', textDecoration: 'underline' }}>catálogo completo</Link>),
        la placa que los recibe. No es la única plataforma de microcontroladores que existe — es, de lejos,
        la que más bajó la barrera de entrada real, y la razón de eso tiene nombre, fecha y lugar concretos.
      </>}
    >
      <Section roman="I" id="sec-01" title="IVREA, 2005 — POR QUÉ NACIÓ">
        <P>
          En el Interaction Design Institute Ivrea (Italia), <B>Massimo Banzi</B> enseñaba a estudiantes de
          diseño — no de ingeniería — a construir prototipos interactivos reales. La herramienta que usaban
          antes, <B>Wiring</B> (desarrollada por Hernando Barragán como su propia tesis, bajo la dirección de
          Casey Reas y Ben Fry, los mismos detrás de Processing), ya apuntaba exactamente a esto: simplificar
          programación de microcontroladores para alguien sin background eléctrico. Wiring resultaba cara y
          poco accesible para producir en volumen. En 2005, Banzi, junto a <B>David Cuartielles</B>,{' '}
          <B>Tom Igoe</B>, <B>David Mellis</B> y <B>Gianluca Martino</B>, diseñó una placa más simple y barata
          basada en las mismas ideas de Wiring (Mellis, de hecho, venía de trabajar con Wiring directamente) —
          y la liberó como <B>hardware y software abiertos</B> desde el día uno, una decisión que explica por
          qué hoy existen decenas de fabricantes de clones y placas "compatibles con Arduino" sin que eso sea
          ilegal ni raro: el diseño siempre estuvo pensado para copiarse.
        </P>
      </Section>

      <Section roman="II" id="sec-02" title="QUÉ ES ARDUINO, EN REALIDAD">
        <P>
          "Arduino" no es una sola cosa — son tres capas que suelen confundirse: <B>el hardware</B> (una
          placa con un microcontrolador, reguladores de voltaje, y un conector USB para programarla sin
          programador externo), <B>el IDE</B> (el programa de escritorio o web donde se escribe y se sube el
          código), y <B>el lenguaje</B> (en el fondo C/C++ real, envuelto en funciones simplificadas —{' '}
          <code>digitalWrite()</code>, <code>analogRead()</code> — que esconden el registro de hardware real
          detrás, aunque siempre es posible bajar a ese nivel si hace falta). El <B>bootloader</B> precargado
          en el chip es lo que permite subir programas nuevos por USB sin un programador dedicado — el
          detalle técnico concreto que hizo de Arduino algo que se podía usar sin comprar hardware adicional.
        </P>
      </Section>

      <Section roman="III" id="sec-03" title="ARQUITECTURA AVR — QUÉ HAY ADENTRO DEL CHIP">
        <P>
          El Arduino Uno (la placa de referencia histórica) usa un <B>ATmega328P</B> de Atmel (hoy parte de
          Microchip) — un microcontrolador <B>AVR</B>, arquitectura RISC de 8 bits diseñada originalmente por
          Alf-Egil Bogen y Vegard Wollan en Noruega a inicios de los 90. No tiene sistema operativo, no tiene
          unidad de punto flotante por hardware (los cálculos con decimales se emulan en software, más
          lentos), y su memoria es real y chica — no virtual, no expandible.
        </P>
        <SpecLine label="CPU" value="8 bits RISC (AVR), hasta 16MHz típico" />
        <SpecLine label="FLASH" value="32KB (el programa compilado vive acá)" />
        <SpecLine label="SRAM" value="2KB (variables en tiempo de ejecución — se agota rápido con arrays grandes)" />
        <SpecLine label="EEPROM" value="1KB (memoria no volátil de escritura lenta, para configuración persistente)" />
        <Caption>
          Estos números son del ATmega328P del Uno/Nano clásicos — la sección V muestra cómo cambian
          radicalmente en placas más nuevas de la misma familia.
        </Caption>
      </Section>

      <Section roman="IV" id="sec-04" title="EL MODELO DE PROGRAMACIÓN — SETUP(), LOOP(), Y NADA DE SISTEMA OPERATIVO">
        <P>
          Un sketch de Arduino tiene exactamente dos funciones obligatorias: <code>setup()</code> corre una
          sola vez al encender o resetear la placa (inicializar pines, sensores, comunicación), y{' '}
          <code>loop()</code> corre en un bucle infinito después — el programa entero es, en esencia, ese
          bucle repitiéndose miles de veces por segundo. No hay sistema operativo real debajo gestionando
          procesos: es <B>bare metal</B> cooperativo — si algo adentro de <code>loop()</code> se bloquea
          (un <code>delay()</code> largo, un sensor que no responde), nada más en el programa puede correr
          mientras tanto, salvo las <B>interrupciones de hardware</B> (rutinas especiales que sí pueden
          interrumpir el flujo normal ante un evento externo, como un pin cambiando de estado).
        </P>
      </Section>

      <Section roman="V" id="sec-05" title="LA FAMILIA REAL DE PLACAS">
        <P>
          <B>Uno</B>: la placa de referencia histórica, ATmega328P, 5V. <B>Nano</B>: mismo chip, formato
          mucho más chico, sin conector de alimentación dedicado. <B>Mega 2560</B>: ATmega2560, muchos más
          pines digitales/analógicos y más memoria — para proyectos que agotan los pines del Uno. <B>Leonardo</B>:
          usa un chip (ATmega32U4) con USB nativo en el microcontrolador mismo, lo que le permite emularse
          como teclado o mouse ante una computadora. <B>Due</B>: el primer salto real de arquitectura —
          un ARM Cortex-M3 de 32 bits a 3.3V, ya no AVR, con muchísima más memoria y velocidad. <B>MKR</B>:
          formato chico a 3.3V con radios integradas según el modelo (WiFi, LoRa, NB-IoT) para IoT real.{' '}
          <B>Portenta</B>: el extremo superior actual, Cortex-M7 + M4 en un mismo módulo, pensado para
          correr machine learning liviano directo en el dispositivo.
        </P>
      </Section>

      <Section roman="VI" id="sec-06" title="ESP8266 / ESP32 — MISMO ECOSISTEMA, OTRO FABRICANTE">
        <P>
          Una confusión real y común: <B>ESP8266</B> y <B>ESP32</B> no son placas Arduino — son
          microcontroladores diseñados y fabricados por <B>Espressif</B> (China), con WiFi (ambos) y
          Bluetooth (el ESP32) integrados de fábrica, algo que ningún Arduino "oficial" clásico tenía. Se
          volvieron parte del mismo ecosistema porque Espressif liberó un <B>core</B> que permite programarlos
          desde el mismo IDE de Arduino, con las mismas funciones (<code>digitalWrite()</code>, etc.) —
          así que en la práctica "programar un ESP32 con Arduino" es real y común, aunque el hardware detrás
          sea de otro fabricante y arquitectura (Xtensa o RISC-V según el modelo, no AVR). Para cualquier
          proyecto que necesite conectividad de red, hoy es, en general, la opción más usada por sobre un
          Arduino AVR clásico con un módulo de red aparte.
        </P>
      </Section>

      <Section roman="VII" id="sec-07" title="SHIELDS — EL ECOSISTEMA FÍSICO">
        <P>
          Un <B>shield</B> es una placa que se apila físicamente sobre el conector estándar de pines del
          Uno/Mega, sin cableado suelto: <B>motor shield</B> (controla motores DC/paso a paso sin armar el
          driver aparte), <B>ethernet/WiFi shield</B> (red cableada o inalámbrica antes de que el ESP32 lo
          volviera menos necesario), <B>proto shield</B> (una zona de protoboard soldable encima de la
          placa, para circuitos propios permanentes). El formato de pines se volvió, de facto, un estándar
          físico que muchos fabricantes de terceros todavía respetan.
        </P>
      </Section>

      <Section roman="VIII" id="sec-08" title="DÓNDE BRILLA DE VERDAD">
        <P>
          Prototipado rápido de hardware físico con sensores/actuadores simples, proyectos educativos
          (la curva de entrada más baja del mercado, documentación masiva y comunidad enorme), control
          determinístico de bajo nivel sin el peso de un sistema operativo completo corriendo encima, y
          cualquier contexto donde el costo y el tamaño importan más que la potencia de cómputo bruta.
        </P>
      </Section>

      <Section roman="IX" id="sec-09" title="LOS LÍMITES REALES">
        <P>
          Sin sistema operativo real, no hay multitarea verdadera ni gestión de memoria protegida — un bug
          de memoria puede colgar la placa entera sin aviso. Los AVR clásicos no tienen stack de red TCP/IP
          nativo (hace falta un módulo o shield aparte, o migrar a ESP32). No hay capacidad real de visión
          por computadora, redes neuronales grandes, ni nada que necesite punto flotante masivo o paralelismo
          — para eso existen{' '}
          <Link href="/sustrato/raspberry-pi" style={{ color: '#fff', textDecoration: 'underline' }}>Raspberry Pi</Link>{' '}
          y{' '}
          <Link href="/sustrato/jetson" style={{ color: '#fff', textDecoration: 'underline' }}>NVIDIA Jetson</Link>.
          Y cuando el producto final necesita determinismo de tiempo real estricto a nivel industrial, la
          respuesta suele ser{' '}
          <Link href="/sustrato/stm32" style={{ color: '#fff', textDecoration: 'underline' }}>STM32</Link>,
          no Arduino.
        </P>
      </Section>

      <Section roman="X" id="sec-10" title="DE ACÁ EN ADELANTE">
        <P>
          Con la placa entendida, el catálogo de{' '}
          <Link href="/sustrato/sensores" style={{ color: '#fff', textDecoration: 'underline' }}>SENSORES Y PERIFÉRICOS</Link>{' '}
          es el siguiente paso real — cada entrada ahí asume esta placa (o un compatible 3.3V/5V) como
          destino. Para cuándo conviene saltar a otra plataforma en vez de seguir acá, la{' '}
          <Link href="/sustrato/comparativa" style={{ color: '#fff', textDecoration: 'underline' }}>COMPARATIVA</Link>{' '}
          es el documento de cierre de toda la sección.
        </P>
      </Section>
    </SustratoDoc>
  )
}
