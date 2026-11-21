// NPX-SUS-01 — FUNDAMENTOS. Primer documento de /sustrato: lo que hace
// falta entender antes de que un sensor o una placa tengan sentido.
// Alcance deliberado: suficiente para leer un datasheet básico y no
// quemar un módulo por un error de voltaje -- no un curso de ingeniería
// eléctrica completo.

import { SustratoDoc, Section, P, B, Caption } from '@/components/sustrato/DocPage'
import Link from 'next/link'

const ACCENT = '#f4a261'

const TOC = [
  { roman: 'I', id: 'sec-01', label: 'Carga, corriente, voltaje — y la ley de Ohm' },
  { roman: 'II', id: 'sec-02', label: 'Componentes pasivos — resistencias, capacitores, diodos' },
  { roman: 'III', id: 'sec-03', label: 'Transistores — el componente que hizo todo lo demás posible' },
  { roman: 'IV', id: 'sec-04', label: 'Analógico vs. digital — y por qué 5V y 3.3V no se mezclan gratis' },
  { roman: 'V', id: 'sec-05', label: 'PWM — fingir una señal analógica con pulsos digitales' },
  { roman: 'VI', id: 'sec-06', label: 'ADC y DAC — cómo lo digital escucha al mundo analógico' },
  { roman: 'VII', id: 'sec-07', label: 'Protocolos — UART, I2C, SPI, OneWire' },
  { roman: 'VIII', id: 'sec-08', label: 'Herramientas reales — protoboard, multímetro, fuente, cautín' },
  { roman: 'IX', id: 'sec-09', label: 'Errores comunes que rompen hardware de verdad' },
  { roman: 'X', id: 'sec-10', label: 'De acá en adelante' },
]

export const metadata = { title: 'FUNDAMENTOS // SUSTRATO // NeoProxy' }

export default function FundamentosPage() {
  return (
    <SustratoDoc
      code="NPX-SUS-01" title="FUNDAMENTOS" subtitle="LO QUE HACE FALTA SABER ANTES DEL PRIMER SENSOR" accent={ACCENT}
      classification="ELECTRÓNICA BÁSICA APLICADA" revision="01 — X SECCIONES"
      alcance="CARGA/VOLTAJE/CORRIENTE → COMPONENTES → TRANSISTORES → NIVELES LÓGICOS → PWM → ADC/DAC → PROTOCOLOS → HERRAMIENTAS"
      toc={TOC}
      intro={<>
        Ningún sensor tiene sentido sin esto primero. No es un curso de ingeniería eléctrica — es lo mínimo
        real para leer un datasheet, entender por qué un módulo pide 5V y otro 3.3V, y no freír nada en el
        intento. Todo lo que sigue en <B>SUSTRATO</B> (Arduino, el catálogo de sensores, las demás placas)
        asume que esto ya se entiende.
      </>}
    >
      <Section roman="I" id="sec-01" title="CARGA, CORRIENTE, VOLTAJE — Y LA LEY DE OHM">
        <P>
          Un electrón tiene carga eléctrica — una propiedad física real, medida en <B>culombios</B>. Cuando
          muchos electrones se mueven juntos por un conductor, eso es <B>corriente</B> (símbolo <em>I</em>,
          medida en amperios, A) — literalmente cuánta carga pasa por un punto en un segundo. El{' '}
          <B>voltaje</B> (símbolo <em>V</em>, medido en voltios) no es "la fuerza de la corriente" como se
          suele simplificar, es la diferencia de energía potencial eléctrica entre dos puntos — lo que
          empuja a esa carga a moverse, igual que la diferencia de altura empuja al agua a caer. Sin
          diferencia de voltaje entre dos puntos, no hay corriente, por más cable que los una.
        </P>
        <P>
          La <B>resistencia</B> (símbolo <em>R</em>, medida en ohmios, Ω) es cuánto se opone un material a
          que esa carga se mueva. Georg Ohm, en 1827, publicó la relación real entre las tres: <B>V = I × R</B>.
          Esto no es una aproximación — es la ecuación que explica por qué una resistencia de 220Ω en serie
          con un LED limita la corriente a un valor seguro, por qué un cable demasiado fino se calienta (toda
          esa energía que no pasa como corriente libre se disipa como calor), y por qué un cortocircuito
          (resistencia ≈ 0) hace que la corriente se dispare hacia el infinito — y algo se queme.
        </P>
        <Caption>
          Potencia (P, en vatios) = V × I — la razón real por la que una fuente de 5V a 2A puede entregar
          más energía por segundo que una de 5V a 500mA, aunque el voltaje sea idéntico.
        </Caption>
      </Section>

      <Section roman="II" id="sec-02" title="COMPONENTES PASIVOS">
        <P>
          <B>Resistencia</B>: limita corriente, punto. El código de colores de las bandas no es decorativo —
          codifica el valor real en ohmios y la tolerancia. En un circuito con un botón o sensor digital,
          casi siempre hace falta una de <B>pull-up</B> o <B>pull-down</B> (conectada a Vcc o a GND) para que
          el pin no quede "flotando" en un estado indefinido cuando nada lo está tocando activamente.
        </P>
        <P>
          <B>Capacitor</B> (condensador): almacena carga entre dos placas separadas por un aislante, y la
          libera cuando el voltaje cae — por eso se usa para filtrar ruido en la alimentación (un capacitor
          cerca de cada chip es casi un estándar, no un capricho) y para temporización en circuitos
          analógicos. <B>Inductor</B>: el inverso conceptual — se opone a cambios bruscos de corriente
          almacenando energía en un campo magnético, clave en fuentes conmutadas y en el <em>diodo flyback</em>{' '}
          que protege un transistor cuando apaga un motor o un relé (sección IX).
        </P>
        <P>
          <B>Diodo</B>: deja pasar corriente en un solo sentido. Protege contra polaridad invertida, convierte
          AC en DC (rectificación), y en su versión LED además emite luz al hacerlo — cada color de LED
          tiene un voltaje de caída distinto (rojo ~1.8V, azul/blanco ~3V), por eso la resistencia en serie
          correcta depende del color, no es un valor universal.
        </P>
      </Section>

      <Section roman="III" id="sec-03" title="TRANSISTORES — EL COMPONENTE QUE HIZO TODO LO DEMÁS POSIBLE">
        <P>
          Inventado en Bell Labs en 1947 (Bardeen, Brattain y Shockley — Nobel de Física 1956), el{' '}
          <B>transistor</B> es, en esencia, un interruptor o amplificador controlado eléctricamente, sin
          partes móviles. Dos familias reales importan acá: <B>BJT</B> (transistor bipolar, controlado por
          corriente en su base) y <B>MOSFET</B> (controlado por voltaje en su compuerta, más eficiente para
          conmutar cargas grandes — motores, tiras de LED de alta corriente). Cuando un microcontrolador
          "enciende un motor" nunca lo alimenta directo desde un pin (los pines entregan miliamperios, un
          motor pide amperios) — enciende un transistor o MOSFET que sí maneja esa corriente, usando el pin
          solo como señal de control.
        </P>
        <P>
          Todo circuito digital — cada compuerta lógica, cada bit de memoria, cada núcleo de CPU — es, en el
          fondo, una red de millones o miles de millones de estos mismos interruptores, encendidos y apagados
          miles de millones de veces por segundo. No hay otro secreto debajo.
        </P>
      </Section>

      <Section roman="IV" id="sec-04" title="ANALÓGICO VS. DIGITAL — Y POR QUÉ 5V Y 3.3V NO SE MEZCLAN GRATIS">
        <P>
          Una señal <B>analógica</B> varía de forma continua (un micrófono, un potenciómetro). Una señal{' '}
          <B>digital</B> solo conoce dos estados — alto y bajo — interpretados como 1 y 0. El problema real:
          "alto" no es el mismo voltaje en todas las placas. Un Arduino Uno clásico trabaja a <B>5V</B>{' '}
          (nivel lógico TTL heredado), mientras que un ESP32, una Raspberry Pi o una STM32 trabajan a{' '}
          <B>3.3V</B>. Conectar la salida de 5V de un sensor directo a una entrada de 3.3V puede dañar ese
          pin permanentemente — y al revés, una salida de 3.3V a veces ni siquiera se reconoce como "alto"
          en una entrada de 5V. La solución real es un <B>divisor de voltaje</B> (dos resistencias) o un chip
          <B> level shifter</B> dedicado entre ambos — revisar el nivel lógico de cada módulo antes de
          conectarlo nunca es un paso opcional.
        </P>
      </Section>

      <Section roman="V" id="sec-05" title="PWM — FINGIR UNA SEÑAL ANALÓGICA CON PULSOS DIGITALES">
        <P>
          Un pin digital solo puede estar en alto o bajo — no existe un "70% de 5V" real en una salida
          digital pura. La <B>modulación por ancho de pulso</B> (PWM) resuelve esto prendiendo y apagando el
          pin muy rápido, variando qué fracción del tiempo está en alto (el <em>duty cycle</em>): 70% de
          duty cycle a suficiente frecuencia se percibe (en un LED) o se filtra eléctricamente (en un motor)
          como si fuera un 70% de voltaje real, aunque nunca lo sea instante a instante. Así se regula el
          brillo de un LED, la velocidad de un motor DC, o se genera la señal de control de un{' '}
          <Link href="/sustrato/sensores#servo" style={{ color: '#fff', textDecoration: 'underline' }}>servo</Link>{' '}
          (donde el ancho exacto del pulso, no un duty cycle genérico, codifica el ángulo).
        </P>
      </Section>

      <Section roman="VI" id="sec-06" title="ADC Y DAC — CÓMO LO DIGITAL ESCUCHA AL MUNDO ANALÓGICO">
        <P>
          El mundo físico es analógico — temperatura, luz, presión varían de forma continua. Un
          microcontrolador solo entiende números binarios. El <B>ADC</B> (conversor analógico-digital) es el
          puente: mide un voltaje de entrada y lo traduce a un número, con una <B>resolución</B> dada en
          bits — un ADC de 10 bits distingue 1024 niveles distintos entre 0V y el voltaje de referencia, uno
          de 12 bits distingue 4096. Más bits de resolución no es automáticamente "mejor dato", es más
          granularidad — el ruido eléctrico real de un circuito mal diseñado puede volver inútiles los bits
          de más. El <B>DAC</B> (conversor digital-analógico) hace el camino inverso, mucho menos común en
          microcontroladores de gama baja que el ADC.
        </P>
      </Section>

      <Section roman="VII" id="sec-07" title="PROTOCOLOS — UART, I2C, SPI, ONEWIRE">
        <P>
          <B>UART</B> (transmisión asíncrona): dos cables (TX/RX), sin reloj compartido — ambos extremos
          acuerdan de antemano la velocidad (baud rate, ej. 9600 o 115200). Simple, punto a punto, el mismo
          principio detrás del puerto serie clásico y de módulos Bluetooth como el HC-05.
        </P>
        <P>
          <B>I2C</B> (Inter-Integrated Circuit, Philips 1982): dos cables compartidos entre todos los
          dispositivos del bus (SDA para datos, SCL para reloj) — cada dispositivo tiene una{' '}
          <B>dirección</B> fija o configurable, así varios sensores conviven en el mismo par de cables sin
          confundirse entre sí. Es el protocolo más común en sensores modernos (IMUs, sensores de luz,
          displays OLED chicos) justo por eso: escala a muchos dispositivos con pocos pines.
        </P>
        <P>
          <B>SPI</B> (Serial Peripheral Interface): más cables (reloj, datos de entrada, datos de salida, y
          un pin de selección por dispositivo) pero mucho más rápido que I2C — se usa donde el volumen de
          datos importa más que ahorrar pines: tarjetas SD, pantallas TFT, algunos módulos de radio.
        </P>
        <P>
          <B>OneWire</B> (Dallas/Maxim): un solo cable de datos (más GND) para comunicación y, en varios
          sensores, hasta para alimentación — el protocolo detrás del sensor de temperatura DS18B20
          (catálogo de sensores, categoría temperatura). El más lento de los cuatro, pero el que menos cables
          físicos necesita.
        </P>
      </Section>

      <Section roman="VIII" id="sec-08" title="HERRAMIENTAS REALES">
        <P>
          <B>Protoboard</B> (breadboard): conexiones por presión, sin soldadura, para prototipos rápidos —
          las filas y columnas internas no son obvias a simple vista, vale la pena verificar su patrón real
          de conexión antes de armar nada complejo. <B>Multímetro</B>: mide voltaje, corriente y resistencia
          — la primera herramienta real para diagnosticar "por qué no prende", no un lujo. <B>Fuente de
          alimentación</B> regulada: un USB de computadora no siempre entrega suficiente corriente para
          motores o tiras de LED, una fuente externa dedicada evita resets aleatorios y daño por
          subalimentación. <B>Cautín y soldadura</B>: para pasar de protoboard a algo permanente — estaño
          con núcleo de flux, punta limpia, y ventilación real (el humo de la soldadura no es inofensivo).
        </P>
        <Caption>
          Un osciloscopio (ver forma de onda real en el tiempo) y un analizador lógico (capturar protocolos
          digitales como I2C/SPI en vivo) son el siguiente escalón — no imprescindibles para empezar, sí
          para diagnosticar problemas de timing que un multímetro no puede ver.
        </Caption>
      </Section>

      <Section roman="IX" id="sec-09" title="ERRORES COMUNES QUE ROMPEN HARDWARE DE VERDAD">
        <P>
          <B>Polaridad invertida</B>: un capacitor electrolítico o un LED al revés, en el mejor caso no
          hace nada, en el peor se daña o truena. <B>Pines flotantes</B>: una entrada digital sin pull-up ni
          pull-down puede leer ruido eléctrico ambiente y oscilar entre 0 y 1 sin que nada la esté tocando.{' '}
          <B>Cargas inductivas sin diodo flyback</B>: al apagar un motor o un relé, el campo magnético que
          colapsa genera un pico de voltaje inverso real que puede destruir el transistor que lo controla —
          un diodo en antiparalelo sobre la carga absorbe ese pico. <B>Alimentar todo desde el pin 5V/3.3V
          de la placa</B>: ese regulador tiene un límite de corriente real, no infinito — varios servos o
          un motor tirando de ahí al mismo tiempo puede resetear la placa entera o dañar el regulador.
        </P>
      </Section>

      <Section roman="X" id="sec-10" title="DE ACÁ EN ADELANTE">
        <P>
          Con esto ya alcanza para seguir con{' '}
          <Link href="/sustrato/arduino" style={{ color: '#fff', textDecoration: 'underline' }}>ARDUINO</Link>{' '}
          (la placa más común para probar todo lo de acá con las manos) o directo con el{' '}
          <Link href="/sustrato/sensores" style={{ color: '#fff', textDecoration: 'underline' }}>catálogo de SENSORES</Link>{' '}
          — cada entrada de ese catálogo asume este documento como base y no repite estos conceptos, solo
          los cita.
        </P>
      </Section>
    </SustratoDoc>
  )
}
