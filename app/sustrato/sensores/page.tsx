// NPX-SUS-03 — SENSORES Y PERIFÉRICOS. El catálogo grande pedido
// explícito: "sensores periférico todo lo que exista para Arduino".
// Alcance real: no es literalmente infinito (eso no existe como
// documento terminable) -- son ~45 módulos reales, ampliamente
// documentados y usados, organizados en 15 categorías. Cada entrada:
// qué mide/hace, principio de funcionamiento real, interfaz real
// (de /sustrato/fundamentos sección VII), y uso típico concreto.

import { SustratoDoc, Section, P, Caption } from '@/components/sustrato/DocPage'
import Link from 'next/link'
import type { ReactNode } from 'react'

const ACCENT = '#4cc9f0'

type SensorEntry = {
  id: string
  name: string
  iface: string
  desc: ReactNode
  use: string
}

type Category = { roman: string; id: string; title: string; sub?: string; items: SensorEntry[] }

const CATEGORIES: Category[] = [
  {
    roman: 'I', id: 'sec-01', title: 'TEMPERATURA Y HUMEDAD',
    items: [
      { id: 'dht11', name: 'DHT11', iface: 'DIGITAL (1 CABLE, PROTOCOLO PROPIO)', use: 'estaciones meteorológicas caseras, proyectos educativos', desc: 'Combina un termistor y un sensor capacitivo de humedad en un solo chip, con un microcontrolador interno que entrega ambos valores por un protocolo de un cable propietario (no es OneWire real). Barato y común, pero con precisión baja (±2°C, ±5% HR) y lectura lenta (máximo 1 Hz).' },
      { id: 'dht22', name: 'DHT22 / AM2302', iface: 'DIGITAL (1 CABLE, PROTOCOLO PROPIO)', use: 'donde la precisión del DHT11 no alcanza', desc: 'Mismo principio que el DHT11 (termistor + sensor capacitivo de humedad, protocolo propio de 1 cable) pero con mejor rango (-40°C a 80°C) y mejor precisión (±0.5°C, ±2-5% HR) — el reemplazo directo cuando el DHT11 queda corto.' },
      { id: 'ds18b20', name: 'DS18B20', iface: 'ONEWIRE (DALLAS/MAXIM)', use: 'temperatura de líquidos (versión sumergible), múltiples puntos en un solo cable', desc: 'Sensor de temperatura digital real con una ventaja concreta: varios DS18B20 pueden compartir el mismo bus OneWire de un solo cable, cada uno con una dirección única de 64 bits grabada de fábrica — así se leen múltiples puntos de temperatura con un único pin digital. Existe en versión sumergible con cable encapsulado, pensada para líquidos.' },
      { id: 'lm35', name: 'LM35', iface: 'ANALÓGICO (SALIDA LINEAL EN mV)', use: 'temperatura simple sin protocolo digital', desc: 'Sensor de temperatura puramente analógico: entrega un voltaje linealmente proporcional a la temperatura en grados Celsius (10mV por °C), sin ningún protocolo digital — se lee directo con un pin ADC. Simple y rápido, pero sin la robustez frente a ruido de una señal digital.' },
      { id: 'ntc', name: 'Termistor NTC', iface: 'ANALÓGICO (RESISTENCIA VARIABLE)', use: 'el componente crudo detrás de muchos sensores de temperatura caseros', desc: 'Una resistencia cuyo valor cae de forma no lineal al subir la temperatura (coeficiente de temperatura negativo). No es un módulo con protocolo — es el componente pasivo crudo, leído con un divisor de voltaje y la ecuación de Steinhart-Hart para convertir resistencia a temperatura real.' },
      { id: 'soil-moisture', name: 'Higrómetro de suelo', iface: 'ANALÓGICO + DIGITAL (según modelo)', use: 'riego automático, agricultura urbana', desc: 'Dos electrodos (versión resistiva, más propensa a corroerse con el tiempo) o un sensor capacitivo (versión más moderna y durable) que varían su lectura según la humedad del sustrato entre ellos. La versión capacitiva es hoy la recomendada por no degradarse por electrólisis.' },
    ],
  },
  {
    roman: 'II', id: 'sec-02', title: 'DISTANCIA Y PROXIMIDAD',
    items: [
      { id: 'hc-sr04', name: 'HC-SR04', iface: 'DIGITAL (TRIGGER/ECHO)', use: 'robots evasores de obstáculos, medición de nivel de líquidos', desc: 'Ultrasónico: un pin dispara un pulso de sonido a 40kHz (fuera del rango audible humano), y otro pin mide cuánto tarda el eco en volver — la distancia sale directo de la velocidad del sonido y ese tiempo. Rango real típico 2cm a 400cm, impreciso con superficies que absorben o desvían el sonido (telas, ángulos muy oblicuos).' },
      { id: 'sharp-ir', name: 'Sharp GP2Y0A21 (IR analógico)', iface: 'ANALÓGICO (NO LINEAL)', use: 'detección de proximidad donde el ultrasónico falla (superficies blandas)', desc: 'Emite infrarrojo y mide, por triangulación óptica interna, el ángulo con el que vuelve reflejado — la salida analógica no es lineal con la distancia (hay que aplicar la curva de conversión real del datasheet), pero no sufre la debilidad del ultrasónico frente a materiales que absorben sonido.' },
      { id: 'vl53l0x', name: 'VL53L0X (ToF)', iface: 'I2C', use: 'medición de distancia precisa a corto alcance, robots de precisión', desc: 'Sensor de tiempo de vuelo (time-of-flight) real: emite un láser infrarrojo de clase 1 (seguro para la vista) y mide directamente el tiempo que tarda la luz en volver — mucho más preciso y rápido que ultrasónico o IR analógico a corto alcance (hasta ~2m), con salida digital limpia por I2C.' },
      { id: 'ir-obstacle', name: 'Sensor IR de obstáculo reflectivo', iface: 'DIGITAL (ON/OFF)', use: 'robots seguidores de línea', desc: 'Un emisor y un receptor infrarrojo en el mismo módulo: detecta si una superficie refleja suficiente luz IR de vuelta (blanco) o la absorbe (negro/oscuro) — el principio detrás de casi todo robot seguidor de línea económico, no mide distancia real, solo contraste.' },
    ],
  },
  {
    roman: 'III', id: 'sec-03', title: 'MOVIMIENTO E INERCIA',
    items: [
      { id: 'pir', name: 'PIR HC-SR501', iface: 'DIGITAL (ON/OFF)', use: 'luces y alarmas activadas por presencia', desc: 'Detecta radiación infrarroja emitida por cuerpos tibios (como un cuerpo humano) moviéndose dentro de su campo de visión, usando una lente Fresnel para dividir ese campo en varias zonas — reacciona al cambio de calor en movimiento, no a presencia estática. Dos potenciómetros propios ajustan sensibilidad y tiempo de retención de la señal.' },
      { id: 'mpu6050', name: 'MPU6050 (IMU)', iface: 'I2C', use: 'estabilización, detección de orientación, robots balanceadores', desc: 'Unidad de medición inercial de 6 ejes: un acelerómetro de 3 ejes (mide aceleración lineal, incluida la gravedad) y un giroscopio de 3 ejes (mide velocidad angular) en un mismo chip con procesamiento digital de movimiento integrado. El sensor más común para cualquier proyecto que necesite saber cómo está orientado o moviéndose algo.' },
      { id: 'adxl345', name: 'ADXL345', iface: 'I2C / SPI', use: 'detección de inclinación, golpes, caída libre', desc: 'Acelerómetro digital de 3 ejes con resolución configurable y detección de eventos propia en hardware (golpe simple/doble, caída libre, actividad/inactividad) sin necesidad de que el microcontrolador procese la señal cruda constantemente.' },
      { id: 'sw420', name: 'Módulo de vibración SW-420', iface: 'DIGITAL (ON/OFF, UMBRAL AJUSTABLE)', use: 'alarmas antivibración, detección de golpes simples', desc: 'Un interruptor vibratorio mecánico (una bolita o resorte que rompe o hace contacto eléctrico ante vibración) con un comparador y potenciómetro propio para ajustar sensibilidad — mucho más simple y barato que un acelerómetro digital cuando solo hace falta un sí/no.' },
    ],
  },
  {
    roman: 'IV', id: 'sec-04', title: 'LUZ Y COLOR',
    items: [
      { id: 'ldr', name: 'LDR (fotorresistencia)', iface: 'ANALÓGICO (RESISTENCIA VARIABLE)', use: 'encendido automático de luces al anochecer', desc: 'Una resistencia hecha de un material (usualmente sulfuro de cadmio) cuya resistencia eléctrica cae cuando más luz incide sobre ella — leída con un divisor de voltaje simple. El sensor de luz más barato y menos preciso que existe, suficiente para decisiones binarias ("¿hay luz o no?").' },
      { id: 'fotodiodo', name: 'Fotodiodo', iface: 'ANALÓGICO', use: 'receptores de control remoto IR, detección rápida de pulsos de luz', desc: 'Un diodo semiconductor que genera corriente proporcional a la luz que recibe, mucho más rápido que un LDR (responde en microsegundos, no en milisegundos) — por eso es el sensor detrás de los receptores de controles remotos infrarrojos, donde la velocidad de respuesta importa.' },
      { id: 'bh1750', name: 'BH1750', iface: 'I2C', use: 'medición real de iluminación en lux', desc: 'A diferencia de un LDR (que da una resistencia arbitraria, no una unidad real), el BH1750 entrega directamente un valor en lux — unidad real de iluminancia — con conversión analógico-digital y compensación ya resueltas dentro del chip.' },
      { id: 'tcs3200', name: 'TCS3200 / TCS3230', iface: 'DIGITAL (SALIDA DE FRECUENCIA)', use: 'clasificación de objetos por color, robots seguidores de color', desc: 'Una matriz de fotodiodos con filtros de color (rojo, verde, azul, y sin filtro) convierte la luz detectada en una frecuencia de pulsos proporcional a la intensidad de cada canal — el microcontrolador mide esa frecuencia y reconstruye el color real, incluyendo LEDs propios para iluminar el objeto de forma consistente.' },
    ],
  },
  {
    roman: 'V', id: 'sec-05', title: 'GAS Y CALIDAD DE AIRE',
    items: [
      { id: 'mq2', name: 'MQ-2', iface: 'ANALÓGICO (+ DIGITAL CON UMBRAL)', use: 'detección de fugas de gas, humo', desc: 'Sensor de óxido de estaño (SnO2) cuya resistencia cambia al reaccionar con gases combustibles (GLP, propano, metano) y humo — necesita un período de calentamiento real (el elemento tiene un filamento calefactor interno) antes de dar lecturas estables, y detecta una familia de gases, no uno solo de forma selectiva.' },
      { id: 'mq7', name: 'MQ-7', iface: 'ANALÓGICO (+ DIGITAL CON UMBRAL)', use: 'detectores de monóxido de carbono', desc: 'Misma familia de sensores de óxido metálico que el MQ-2, calibrado específicamente para monóxido de carbono — el gas real detrás de la mayoría de las muertes por intoxicación doméstica, invisible y sin olor, lo que vuelve a este sensor una aplicación de seguridad real, no solo un experimento de hobby.' },
      { id: 'mq135', name: 'MQ-135', iface: 'ANALÓGICO (+ DIGITAL CON UMBRAL)', use: 'monitoreo general de calidad de aire interior', desc: 'Sensible a una familia amplia de gases (amoníaco, óxidos de nitrógeno, benceno, humo) — pensado como indicador general de "calidad de aire" más que para medir un gas específico con precisión, el enfoque típico de monitoreo ambiental casero.' },
      { id: 'ccs811', name: 'CCS811', iface: 'I2C', use: 'estaciones de calidad de aire interior más serias', desc: 'Sensor digital de compuestos orgánicos volátiles (VOC) que además estima CO2 equivalente (eCO2) a partir de esos VOC — mucho más preciso y estable que un MQ genérico, con calibración y compensación de temperatura/humedad ya integradas en el chip.' },
    ],
  },
  {
    roman: 'VI', id: 'sec-06', title: 'SONIDO',
    items: [
      { id: 'sound-module', name: 'Módulo de sonido (micrófono electret + LM393)', iface: 'ANALÓGICO + DIGITAL (UMBRAL)', use: 'proyectos activados por aplauso o ruido, visualizadores de nivel de audio', desc: 'Un micrófono electret capta la onda de sonido como una señal eléctrica diminuta, que un comparador LM393 amplifica y además convierte en una salida digital simple (sonido superó el umbral, sí/no) además de la señal analógica cruda — no hace reconocimiento de voz ni de patrones, solo detecta nivel.' },
    ],
  },
  {
    roman: 'VII', id: 'sec-07', title: 'PRESIÓN Y PESO',
    items: [
      { id: 'bmp280', name: 'BMP180 / BMP280', iface: 'I2C / SPI (según modelo)', use: 'estaciones meteorológicas, altímetros', desc: 'Sensor de presión barométrica digital, preciso a nivel de hectopascales — y como la presión atmosférica cae de forma predecible con la altitud, el mismo chip se usa como altímetro barométrico real (con una fórmula de conversión estándar), el mismo principio detrás del altímetro de un smartphone.' },
      { id: 'hx711', name: 'Celda de carga + HX711', iface: 'DIGITAL (PROTOCOLO PROPIO DE 2 CABLES)', use: 'básculas digitales, detección de peso/fuerza', desc: 'La celda de carga es un puente de Wheatstone con galgas extensométricas que cambian de resistencia al deformarse bajo peso — una señal diminuta, de microvoltios, que necesita amplificación real antes de ser útil. El HX711 es ese amplificador dedicado más un ADC de 24 bits, el componente que de verdad hace viable leer una celda de carga con un microcontrolador.' },
    ],
  },
  {
    roman: 'VIII', id: 'sec-08', title: 'CAMPO MAGNÉTICO',
    items: [
      { id: 'hall', name: 'Sensor de efecto Hall (ej. A3144)', iface: 'DIGITAL (ON/OFF)', use: 'tacómetros, detección de puertas/tapas cerradas sin contacto mecánico', desc: 'Detecta la presencia de un campo magnético (un imán cercano) por el efecto Hall real — una diferencia de voltaje que aparece en un conductor atravesado por corriente cuando se somete a un campo magnético perpendicular. Sin contacto mecánico, por eso se usa para contar vueltas de una rueda con un imán fijo (tacómetro) sin desgaste.' },
      { id: 'reed', name: 'Interruptor reed (reed switch)', iface: 'DIGITAL (MECÁNICO, ON/OFF)', use: 'sensores de puertas/ventanas en sistemas de alarma', desc: 'Dos láminas metálicas dentro de una cápsula sellada que se juntan físicamente (cerrando el circuito) cuando un imán cercano las atrae — el componente detrás de la gran mayoría de sensores de apertura de puertas y ventanas de sistemas de alarma domésticos, sin ninguna electrónica activa involucrada.' },
      { id: 'hmc5883l', name: 'HMC5883L (magnetómetro)', iface: 'I2C', use: 'brújulas digitales, fusión con IMU para orientación absoluta', desc: 'Mide la intensidad del campo magnético en 3 ejes con suficiente precisión para calcular un rumbo real respecto al norte magnético — a diferencia de un giroscopio (que mide velocidad angular y acumula error con el tiempo), el magnetómetro da una referencia absoluta, por eso suele combinarse con un MPU6050 para orientación estable.' },
    ],
  },
  {
    roman: 'IX', id: 'sec-09', title: 'TÁCTIL Y CAPACITIVO',
    items: [
      { id: 'ttp223', name: 'TTP223 (touch sensor)', iface: 'DIGITAL (ON/OFF)', use: 'reemplazo de botones físicos por superficies táctiles selladas', desc: 'Detecta el cambio de capacitancia que provoca un dedo acercándose a un electrodo — sin partes móviles ni desgaste mecánico, lo que permite sellar completamente la superficie de contacto (útil en ambientes húmedos o que necesitan limpieza frecuente).' },
    ],
  },
  {
    roman: 'X', id: 'sec-10', title: 'IDENTIFICACIÓN Y POSICIÓN',
    items: [
      { id: 'rc522', name: 'RC522 (MFRC522)', iface: 'SPI', use: 'control de acceso, lectores de tarjetas/llaveros RFID', desc: 'Lector/escritor RFID/NFC que opera a 13.56MHz, compatible con tarjetas MIFARE — genera su propio campo electromagnético para alimentar pasivamente la tarjeta o llavero (que no tiene batería propia) y leer o escribir los datos que contiene.' },
      { id: 'neo6m', name: 'NEO-6M (GPS)', iface: 'UART (PROTOCOLO NMEA)', use: 'rastreo de ubicación, proyectos de geolocalización', desc: 'Recibe señales de satélites GPS y calcula posición, altitud y hora real, entregando esos datos como texto plano en formato NMEA estándar por UART — el microcontrolador necesita parsear esas tramas de texto (hay librerías dedicadas para eso) para extraer latitud/longitud utilizables.' },
      { id: 'fingerprint', name: 'Módulo de huella digital (ej. AS608/R307)', iface: 'UART', use: 'control de acceso biométrico', desc: 'Sensor óptico que captura la imagen de una huella dactilar y la propia placa del módulo hace el procesamiento de coincidencia internamente (extracción de minucias, comparación contra una base guardada en su propia memoria) — el microcontrolador solo pide "¿coincide esta huella con alguna guardada?" y recibe sí/no, sin procesar imágenes él mismo.' },
    ],
  },
  {
    roman: 'XI', id: 'sec-11', title: 'COMUNICACIÓN INALÁMBRICA',
    items: [
      { id: 'hc05', name: 'HC-05 / HC-06 (Bluetooth)', iface: 'UART', use: 'control remoto desde un celular, enlace serie inalámbrico simple', desc: 'Módulo Bluetooth clásico (no BLE) que se comporta, desde el punto de vista del microcontrolador, como un cable serie invisible — todo lo que se envía por UART llega al otro extremo emparejado y viceversa. El HC-05 admite modo maestro y esclavo, el HC-06 solo esclavo.' },
      { id: 'nrf24l01', name: 'nRF24L01', iface: 'SPI', use: 'redes de varios Arduinos comunicándose entre sí a corto/mediano alcance', desc: 'Transceptor de radio en la banda de 2.4GHz, de muy bajo consumo y bajo costo, pensado para redes punto a punto o de varios nodos entre microcontroladores — no es WiFi ni Bluetooth, es un protocolo propio simple (Enhanced ShockBurst) manejado por SPI.' },
      { id: 'lora', name: 'LoRa (SX1278 / módulos RFM95)', iface: 'SPI', use: 'telemetría remota, sensores en el campo a varios kilómetros', desc: 'Modulación de espectro ensanchado (chirp spread spectrum) que logra alcances reales de varios kilómetros con muy poca potencia de transmisión, a costa de velocidad de datos muy baja — la respuesta real cuando WiFi/Bluetooth no llegan y el proyecto no puede depender de infraestructura celular.' },
    ],
  },
  {
    roman: 'XII', id: 'sec-12', title: 'PANTALLAS',
    items: [
      { id: 'lcd1602', name: 'LCD 16x2 (HD44780) + backpack I2C', iface: 'I2C (CON EL BACKPACK) / PARALELO (SIN ÉL)', use: 'interfaces simples de texto, menús de configuración', desc: 'Controlador de caracteres estándar de facto desde los 90 — en su forma original usa hasta 6+ pines en paralelo, pero un "backpack" I2C económico (un chip expansor de puertos soldado atrás) lo reduce a solo 2 cables de datos, el método casi universal hoy para usarlo con Arduino.' },
      { id: 'oled-ssd1306', name: 'OLED SSD1306', iface: 'I2C / SPI (según módulo)', use: 'displays chicos de alto contraste, interfaces gráficas simples', desc: 'Pantalla OLED monocromática (cada píxel emite su propia luz, sin backlight separado) controlada por el chip SSD1306 — contraste real muy alto y bajo consumo cuando la mayoría de los píxeles están apagados, popular para mostrar texto y gráficos simples en formato chico.' },
      { id: 'max7219', name: 'Display 7 segmentos + MAX7219', iface: 'SPI (PROTOCOLO SIMILAR, TIPO "SPI")', use: 'relojes digitales, contadores, indicadores numéricos', desc: 'El MAX7219 maneja hasta 8 dígitos de 7 segmentos (o una matriz de 8x8 LEDs) multiplexados, manejando el refresco y el brillo por hardware propio — sin él, multiplexar manualmente varios dígitos consumiría tiempo de CPU del microcontrolador de forma constante.' },
      { id: 'ili9341', name: 'TFT ILI9341', iface: 'SPI', use: 'interfaces gráficas a color, visualización de datos/imágenes', desc: 'Pantalla TFT a color (típicamente 240x320 píxeles) con su propio controlador gráfico — permite dibujar formas, texto e imágenes reales, a costa de mucha más memoria de framebuffer y ancho de banda SPI que un display monocromático simple.' },
    ],
  },
  {
    roman: 'XIII', id: 'sec-13', title: 'ACTUADORES',
    items: [
      { id: 'servo', name: 'Servomotor SG90', iface: 'PWM (ANCHO DE PULSO ESPECÍFICO, NO DUTY CYCLE GENÉRICO)', use: 'posicionamiento angular preciso (brazos robóticos, timones, torretas)', desc: 'A diferencia del PWM genérico (sección V de Fundamentos), un servo interpreta el ancho exacto del pulso (típicamente entre 1ms y 2ms, repetido cada 20ms) como un ángulo específico entre 0° y 180° — adentro tiene su propio motor DC, engranajes reductores, y un circuito de control en lazo cerrado con un potenciómetro que mide la posición real del eje.' },
      { id: 'l298n', name: 'Driver de motor DC L298N / TB6612', iface: 'DIGITAL + PWM (CONTROL) / NO ES UN SENSOR, ES UN PUENTE H', use: 'controlar la dirección y velocidad de motores DC', desc: 'Un puente H es la topología de 4 transistores que permite invertir la polaridad aplicada a un motor DC (y así su sentido de giro) usando solo señales de control de bajo voltaje — el microcontrolador nunca maneja la corriente real del motor directamente, solo le dice al puente H qué hacer.' },
      { id: 'stepper-driver', name: 'Motor paso a paso + driver (28BYJ-48+ULN2003, o NEMA17+A4988)', iface: 'DIGITAL (PASOS + DIRECCIÓN)', use: 'posicionamiento angular/lineal de alta precisión repetible (impresoras 3D, CNC)', desc: 'Un motor paso a paso avanza en incrementos discretos y repetibles (no continuos como un motor DC) — el driver (ULN2003 para el 28BYJ-48 chico, A4988/DRV8825 para NEMA17 más grandes) traduce pulsos simples de "paso" y "dirección" en la secuencia real de energizado de bobinas que el motor necesita.' },
      { id: 'relay', name: 'Módulo de relé', iface: 'DIGITAL (CONTROL) — CONMUTA CARGAS AC/DC SEPARADAS', use: 'encender/apagar electrodomésticos u otras cargas de alto voltaje desde un microcontrolador', desc: 'Un relé es un interruptor mecánico (o de estado sólido, en versiones SSR) activado por una bobina electromagnética — permite que una señal de 5V/3.3V controle, con aislamiento eléctrico real entre ambos circuitos, una carga de 110V/220V AC sin que el microcontrolador toque esa corriente en ningún momento.' },
      { id: 'buzzer', name: 'Buzzer / piezo', iface: 'DIGITAL O PWM (SEGÚN SI ES ACTIVO O PASIVO)', use: 'alarmas simples, retroalimentación sonora, tonos básicos', desc: 'Un buzzer activo ya tiene su propio oscilador interno (solo necesita alto/bajo para sonar a una frecuencia fija); uno pasivo necesita que el microcontrolador le entregue la señal PWM a la frecuencia exacta de cada tono — la diferencia real entre "hace un pitido" y "puede tocar una melodía".' },
    ],
  },
  {
    roman: 'XIV', id: 'sec-14', title: 'ENTRADA Y CONTROL MANUAL',
    items: [
      { id: 'boton', name: 'Botón pulsador', iface: 'DIGITAL (ON/OFF, CON REBOTE MECÁNICO REAL)', use: 'el componente de entrada más básico que existe', desc: 'Un contacto mecánico simple — pero al cerrarse, el contacto real "rebota" (hace y deshace contacto varias veces en milisegundos) antes de asentarse, un fenómeno físico real (no un bug de software) que obliga a implementar antirrebote (debounce), por hardware (un capacitor) o por software (ignorar cambios durante una ventana corta de tiempo).' },
      { id: 'potenciometro', name: 'Potenciómetro', iface: 'ANALÓGICO', use: 'control manual de valores continuos (volumen, brillo, velocidad)', desc: 'Una resistencia variable con un cursor móvil (mecánico, deslizante o rotativo) que actúa como un divisor de voltaje ajustable a mano — la forma más directa de darle a un humano control analógico continuo sobre una variable del programa.' },
      { id: 'joystick', name: 'Módulo joystick', iface: 'ANALÓGICO (X/Y) + DIGITAL (BOTÓN)', use: 'control direccional manual, robots teleoperados', desc: 'Dos potenciómetros montados en ángulo recto entre sí (uno por eje) más un pulsador activado al presionar el eje hacia abajo — mecánicamente es solo "dos potenciómetros con resorte de centrado", nada más complejo debajo.' },
      { id: 'keypad', name: 'Teclado matricial 4x4', iface: 'DIGITAL (MATRIZ DE FILAS/COLUMNAS)', use: 'ingreso de códigos/PIN, menús de control', desc: 'En vez de un pin por cada botón (16 pines para 16 teclas), las teclas se organizan en una matriz de filas y columnas (4+4=8 pines para 16 teclas) — el microcontrolador activa una fila a la vez y lee qué columnas responden, reconstruyendo qué tecla exacta se presionó por software.' },
      { id: 'encoder', name: 'Encoder rotativo', iface: 'DIGITAL (DOS SEÑALES EN CUADRATURA)', use: 'control de menús con giro infinito, ajuste fino de valores', desc: 'A diferencia de un potenciómetro (rango limitado, posición absoluta), un encoder rotativo gira indefinidamente y entrega pulsos en dos señales desfasadas entre sí (cuadratura) — comparando el orden en que cambian esas dos señales, el microcontrolador deduce tanto cuánto giró como en qué dirección.' },
    ],
  },
  {
    roman: 'XV', id: 'sec-15', title: 'MÓDULOS DE SOPORTE',
    items: [
      { id: 'ds3231', name: 'RTC DS3231', iface: 'I2C', use: 'mantener fecha/hora real incluso sin alimentación principal', desc: 'Reloj de tiempo real con su propio oscilador de cristal de alta precisión y una batería de respaldo chica (tipo botón) — sigue contando la hora real aunque la placa principal se apague o se desconecte, algo que el reloj interno de un microcontrolador normal no puede hacer solo.' },
      { id: 'sd-module', name: 'Módulo microSD', iface: 'SPI', use: 'almacenamiento de datos/registro (logging), reproducción de archivos', desc: 'Adaptador que permite leer y escribir una tarjeta microSD estándar vía SPI desde un microcontrolador — la forma más simple de darle a un Arduino almacenamiento real de gigabytes para registrar datos de sensores durante largos períodos, algo que la memoria interna del chip nunca podría contener.' },
      { id: 'acs712', name: 'ACS712 (sensor de corriente)', iface: 'ANALÓGICO', use: 'medir consumo de corriente real de un circuito', desc: 'Sensor de efecto Hall (igual principio físico que la sección VIII) que mide el campo magnético generado por la corriente que pasa por un conductor interno, sin necesidad de cortar el circuito ni insertar una resistencia shunt en serie — aislamiento galvánico real entre la medición y el circuito de potencia.' },
      { id: 'voltage-divider', name: 'Módulo sensor de voltaje (divisor resistivo)', iface: 'ANALÓGICO', use: 'medir voltajes mayores al rango seguro del ADC (ej. baterías de 12V/24V)', desc: 'Dos resistencias en serie que reducen un voltaje mayor a un rango seguro para el ADC del microcontrolador (típicamente 0-5V o 0-3.3V), con una proporción fija y conocida que se usa para reconstruir por cálculo el voltaje real de origen — la aplicación más directa posible de la ley de Ohm (Fundamentos, sección I).' },
    ],
  },
]

const TOC = CATEGORIES.map((c) => ({ roman: c.roman, id: c.id, label: c.title }))

export const metadata = { title: 'SENSORES Y PERIFÉRICOS // SUSTRATO // NeoProxy' }

function SensorCard({ s }: { s: SensorEntry }) {
  return (
    <div id={s.id} style={{
      padding: '14px 16px', background: 'rgba(255,255,255,0.025)', border: `1px solid ${ACCENT}22`, marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12.5, color: '#fff', letterSpacing: 0.5 }}>{s.name}</span>
        <span style={{ fontSize: 8, color: ACCENT, border: `1px solid ${ACCENT}55`, padding: '2px 6px', whiteSpace: 'nowrap' }}>{s.iface}</span>
      </div>
      <p style={{ fontSize: 10.5, lineHeight: 1.75, color: '#9fb4cc', margin: 0, marginBottom: 6 }}>{s.desc}</p>
      <div style={{ fontSize: 9, color: `${ACCENT}bb`, letterSpacing: 0.3 }}>USO TÍPICO — {s.use}</div>
    </div>
  )
}

export default function SensoresPage() {
  return (
    <SustratoDoc
      code="NPX-SUS-03" title="SENSORES Y PERIFÉRICOS" subtitle="EL CATÁLOGO COMPLETO — ~45 MÓDULOS REALES, 15 CATEGORÍAS" accent={ACCENT}
      classification="CATÁLOGO DE HARDWARE — SENSORES Y MÓDULOS PARA ARDUINO" revision="01 — XV CATEGORÍAS"
      alcance="TEMPERATURA → DISTANCIA → MOVIMIENTO → LUZ → GAS → SONIDO → PRESIÓN → MAGNETISMO → TÁCTIL → ID/GPS → RADIO → PANTALLAS → ACTUADORES → ENTRADA → SOPORTE"
      toc={TOC}
      intro={<>
        No existe un catálogo literalmente infinito — esto es lo más cerca que se puede estar de "todo lo que
        existe" sin inventar entradas de relleno: ~45 módulos reales, ampliamente documentados y usados, cada
        uno con su interfaz real (de{' '}
        <Link href="/sustrato/fundamentos#sec-07" style={{ color: '#fff', textDecoration: 'underline' }}>Fundamentos, sección VII</Link>),
        su principio de funcionamiento, y para qué sirve en la práctica — no una ficha de producto genérica.
      </>}
    >
      {CATEGORIES.map((cat) => (
        <Section key={cat.id} roman={cat.roman} id={cat.id} title={cat.title}>
          {cat.items.map((s) => <SensorCard key={s.id} s={s} />)}
        </Section>
      ))}

      <Caption>
        Faltan deliberadamente módulos muy específicos de nicho (sensores industriales certificados, radios
        propietarias de bajísimo volumen) — el criterio de inclusión acá fue "real, documentado, y que alguien
        con un Arduino puede comprar y usar hoy", no exhaustividad absoluta de catálogo de fabricante.
      </Caption>
    </SustratoDoc>
  )
}
