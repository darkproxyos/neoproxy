import Link from 'next/link'
import { Esp32Icon } from '@/components/shop/BoardIcons'

export const metadata = { title: 'ESP32 — Ficha Técnica // NeoProxy' }

const ACCENT = '#00ff9d'

// Pines de entrada únicamente (sin resistencia pull interna) — no pueden
// configurarse como salida.
const INPUT_ONLY = ['GPIO34', 'GPIO35', 'GPIO36 (VP)', 'GPIO39 (VN)']

// Pines "strapping": su estado al encender decide el modo de boot (normal
// vs. descarga de firmware) y el voltaje de la flash. Una carga externa
// conectada ahí puede impedir que arranque o, en el caso de GPIO12, dañar
// la flash si fuerza 3.3V en un módulo pensado para 1.8V.
const STRAPPING = [
  { pin: 'GPIO0', note: 'HIGH = boot normal · LOW = modo descarga (lo controla el botón BOOT)' },
  { pin: 'GPIO2', note: 'debe quedar flotante o en LOW al encender' },
  { pin: 'GPIO5', note: 'afecta el modo SDIO al boot' },
  { pin: 'GPIO12 (MTDI)', note: 'fija el voltaje de la flash — NUNCA en HIGH al boot en módulos 3.3V' },
  { pin: 'GPIO15', note: 'controla si el log de boot sale por UART' },
]

// Conectados al bus SPI interno que usa la flash integrada del módulo —
// tocarlos puede colgar el arranque o corromper la flash.
const FLASH_PINS = ['GPIO6', 'GPIO7', 'GPIO8', 'GPIO9', 'GPIO10', 'GPIO11']

const ADC1 = ['GPIO32', 'GPIO33', 'GPIO34', 'GPIO35', 'GPIO36 (VP)', 'GPIO37', 'GPIO38', 'GPIO39 (VN)']
const ADC2 = ['GPIO0', 'GPIO2', 'GPIO4', 'GPIO12', 'GPIO13', 'GPIO14', 'GPIO15', 'GPIO25', 'GPIO26', 'GPIO27']
const TOUCH = ['GPIO4 (T0)', 'GPIO0 (T1)', 'GPIO2 (T2)', 'GPIO15 (T3)', 'GPIO13 (T4)', 'GPIO12 (T5)', 'GPIO14 (T6)', 'GPIO27 (T7)', 'GPIO33 (T8)', 'GPIO32 (T9)']

const VARIANTS = [
  { name: 'ESP32-WROOM-32', antena: 'PCB impresa', flash: '4 MB', extra: 'La base — la más vendida y la que más clones tiene', },
  { name: 'ESP32-WROOM-32D / 32E', antena: 'PCB impresa', flash: '4–16 MB', extra: 'Revisión interna del mismo chip, mismo tamaño físico' },
  { name: 'ESP32-WROOM-32U', antena: 'Conector externo (U.FL/IPEX)', flash: '4 MB', extra: 'Para antena externa de mayor ganancia' },
  { name: 'ESP32-WROVER', antena: 'PCB o U.FL según variante', flash: '4 MB + 8 MB PSRAM', extra: 'RAM externa extra — útil para cámara/gráficos' },
  { name: 'ESP32-CAM', antena: 'PCB impresa', flash: '4 MB + 8 MB PSRAM', extra: 'WROVER + cámara OV2640. Sin USB nativo — necesita programador externo' },
  { name: 'ESP32-S2', antena: 'PCB impresa', flash: 'según módulo', extra: 'Un solo núcleo, USB nativo, sin Bluetooth' },
  { name: 'ESP32-S3', antena: 'PCB impresa', flash: 'según módulo', extra: 'Dual-core mejorado, USB nativo, acelera IA/visión' },
  { name: 'ESP32-C3', antena: 'PCB impresa', flash: 'según módulo', extra: 'Núcleo RISC-V (no Xtensa), más barato, sin Bluetooth clásico' },
]

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 mb-16 border-t border-[#0f1f35] pt-10">
      <h2 className="text-[11px] font-mono tracking-[0.25em] uppercase mb-6" style={{ color: ACCENT }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function PinList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {items.map((p) => (
        <span
          key={p}
          className="text-[11px] font-mono px-2.5 py-1 border"
          style={{ color: ACCENT, borderColor: `${ACCENT}44`, background: `${ACCENT}0a` }}
        >
          {p}
        </span>
      ))}
    </div>
  )
}

export default function Esp32TechPage() {
  return (
    <div className="relative w-full min-h-screen bg-[#020408] text-white overflow-x-hidden">
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,255,157,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,157,0.15) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <header className="relative z-10 p-8 border-b border-[#0f1f35]">
        <div className="max-w-4xl mx-auto">
          <Link href="/shop" className="text-[11px] font-mono text-[#00d4ff] tracking-[0.2em] uppercase mb-4 block">
            ← VOLVER A LA TIENDA
          </Link>
          <div className="flex items-start gap-6">
            <div className="hidden sm:block shrink-0">
              <Esp32Icon color={ACCENT} width={64} />
            </div>
            <div>
              <div className="text-[11px] font-mono tracking-[0.2em] uppercase mb-2" style={{ color: ACCENT }}>
                INSUMOS ELECTRÓNICOS — FICHA TÉCNICA
              </div>
              <h1 className="font-sans text-4xl md:text-6xl font-extrabold leading-none tracking-tight">
                ESP32
              </h1>
              <p className="mt-6 text-sm text-[#8fb8d6] max-w-2xl leading-relaxed">
                Guía técnica completa del microcontrolador que vendemos como insumo: qué chip es, cómo
                está armado por dentro, qué hace cada pin, cómo es la antena y qué variantes existen.
                Pensada para quien lo compra y quiere entender exactamente qué tiene en la mano antes
                de soldar algo.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-8 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Índice */}
          <nav className="flex flex-wrap gap-x-5 gap-y-2 py-8 text-[10px] font-mono tracking-[0.1em] uppercase text-[#4a6080]">
            {[
              ['que-es', 'Qué es'],
              ['arquitectura', 'Arquitectura'],
              ['pinout', 'Pinout'],
              ['alimentacion', 'Alimentación'],
              ['antena', 'Antena y radio'],
              ['variantes', 'Variantes'],
              ['programacion', 'Programación'],
            ].map(([id, label]) => (
              <a key={id} href={`#${id}`} className="hover:text-[#8fb8d6] transition-colors">
                {label}
              </a>
            ))}
          </nav>

          <Section id="que-es" title="Qué es">
            <p className="text-sm text-[#8fb8d6] leading-relaxed mb-4">
              El <strong className="text-white">ESP32</strong> es un System-on-Chip (SoC) de Espressif
              Systems: en una sola pastilla integra el procesador, la memoria RAM, el radio WiFi y
              Bluetooth, y decenas de periféricos — no es una placa, es el chip que va soldado adentro
              del módulo (WROOM-32, el que vendemos) y a su vez adentro del DevKit (la placa con USB
              y pines que termina llegando a tu mesa de trabajo).
            </p>
            <ul className="text-sm text-[#8fb8d6] leading-relaxed space-y-1.5 list-disc list-inside">
              <li>CPU dual-core Xtensa LX6, hasta 240 MHz</li>
              <li>520 KB de SRAM interna + 448 KB de ROM</li>
              <li>Memoria flash externa en el módulo — 4 MB en el WROOM-32 estándar</li>
              <li>WiFi 802.11 b/g/n (2.4 GHz, no soporta 5 GHz)</li>
              <li>Bluetooth v4.2 — clásico (BR/EDR) y de bajo consumo (BLE)</li>
              <li>Coprocesador ULP (Ultra Low Power) — puede seguir leyendo sensores en deep sleep sin despertar los núcleos principales</li>
              <li>Aceleración por hardware: AES, SHA, RSA, ECC, generador de números aleatorios</li>
            </ul>
          </Section>

          <Section id="arquitectura" title="Arquitectura del chip">
            <p className="text-sm text-[#8fb8d6] leading-relaxed mb-4">
              Por dentro, el ESP32 reparte el trabajo en dos núcleos independientes (en los modelos
              dual-core): típicamente uno corre el stack de WiFi/Bluetooth y el otro queda libre para
              tu aplicación, aunque el framework lo deja correr como quieras repartir las tareas. Las
              interfaces periféricas más relevantes:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#8fb8d6]">
              {[
                ['ADC', '2 bloques (ADC1 de 8 canales, ADC2 de 10), 12 bits de resolución'],
                ['DAC', '2 canales de salida analógica real, 8 bits (GPIO25 y GPIO26)'],
                ['Touch', '10 canales capacitivos — detectan un dedo tocando el pin directamente'],
                ['SPI / I2C / I2S', 'Varios buses de cada uno, asignables a casi cualquier GPIO'],
                ['UART', '3 puertos seriales independientes'],
                ['PWM (LEDC)', '16 canales independientes de PWM por hardware'],
                ['Hall sensor', 'Sensor de campo magnético integrado en el chip'],
                ['CAN (TWAI)', 'Controlador de bus CAN integrado'],
              ].map(([k, v]) => (
                <div key={k} className="border border-[#0f1f35] p-3">
                  <div className="font-mono text-[10px] tracking-[0.15em] uppercase mb-1" style={{ color: ACCENT }}>{k}</div>
                  <div className="text-[12px]">{v}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="pinout" title="Pinout — qué hace cada pin">
            <p className="text-sm text-[#8fb8d6] leading-relaxed mb-2">
              El chip tiene 48 GPIOs a nivel de silicio, pero en el módulo WROOM-32 quedan expuestos
              entre 25 y 34 según el DevKit (30 o 38 pines). El orden físico de los headers varía
              bastante entre fabricantes clon — lo que no cambia es la función de cada número de GPIO,
              así que esta ficha va por número de pin, no por posición. <strong className="text-white">
              Confirmá siempre contra la serigrafía impresa en tu placa específica</strong> antes de cablear.
            </p>

            <h3 className="text-[10px] font-mono tracking-[0.15em] uppercase text-[#4a6080] mt-8 mb-1">Entrada solamente — no se pueden usar como salida</h3>
            <p className="text-[12px] text-[#4a6080] mb-1">Sin resistencia pull-up/down interna.</p>
            <PinList items={INPUT_ONLY} />

            <h3 className="text-[10px] font-mono tracking-[0.15em] uppercase text-[#4a6080] mt-8 mb-1">Strapping — definen el modo de arranque</h3>
            <p className="text-[12px] text-[#4a6080] mb-3">Una carga externa acá puede impedir que arranque, o en el caso de GPIO12, dañar la flash.</p>
            <div className="space-y-1.5">
              {STRAPPING.map((s) => (
                <div key={s.pin} className="text-[12px] font-mono text-[#8fb8d6] flex gap-3">
                  <span style={{ color: ACCENT }} className="shrink-0 w-32">{s.pin}</span>
                  <span className="text-[#4a6080]">{s.note}</span>
                </div>
              ))}
            </div>

            <h3 className="text-[10px] font-mono tracking-[0.15em] uppercase text-[#4a6080] mt-8 mb-1">Reservados para la flash interna — no usar para nada más</h3>
            <PinList items={FLASH_PINS} />

            <h3 className="text-[10px] font-mono tracking-[0.15em] uppercase text-[#4a6080] mt-8 mb-1">ADC1 — entrada analógica, funciona con WiFi activo</h3>
            <PinList items={ADC1} />

            <h3 className="text-[10px] font-mono tracking-[0.15em] uppercase text-[#4a6080] mt-8 mb-1">ADC2 — comparte hardware con el radio WiFi</h3>
            <p className="text-[12px] text-[#4a6080] mb-1">No confiable para lecturas analógicas mientras el WiFi está conectado — usá ADC1 en proyectos conectados a red.</p>
            <PinList items={ADC2} />

            <h3 className="text-[10px] font-mono tracking-[0.15em] uppercase text-[#4a6080] mt-8 mb-1">Touch — detectan contacto capacitivo directo</h3>
            <PinList items={TOUCH} />

            <p className="text-[12px] text-[#4a6080] mt-8">
              Límite de corriente por pin: 12 mA recomendado, 40 mA máximo absoluto — por encima de
              eso el pin se degrada o el chip se resetea solo. Para motores, relés o tiras de LED
              siempre con un driver o transistor intermedio, nunca directo del GPIO.
            </p>
          </Section>

          <Section id="alimentacion" title="Alimentación">
            <ul className="text-sm text-[#8fb8d6] leading-relaxed space-y-1.5 list-disc list-inside">
              <li>Lógica a <strong className="text-white">3.3V</strong> — ningún GPIO tolera 5V directo, un sensor de 5V sin divisor puede quemar el pin</li>
              <li>El DevKit se alimenta por USB (5V) y lo regula a bordo a 3.3V, o directo por el pin 5V/VIN</li>
              <li>Consumo pico durante transmisión WiFi: ~240 mA</li>
              <li>Modo activo normal: 80–160 mA</li>
              <li>Light sleep: ~0.8 mA</li>
              <li>Deep sleep: ~10 µA (algunos módulos bajan a 5 µA)</li>
            </ul>
            <p className="text-[12px] text-[#4a6080] mt-4">
              Para diseño a batería, el deep sleep con wake periódico (timer o el coprocesador ULP
              leyendo un sensor) es lo que hace viable correr meses con una sola carga — el modo activo
              continuo con WiFi prendido vacía una batería chica en horas, no en días.
            </p>
          </Section>

          <Section id="antena" title="Antena y radio">
            <ul className="text-sm text-[#8fb8d6] leading-relaxed space-y-1.5 list-disc list-inside">
              <li>Un solo radio de 2.4 GHz compartido entre WiFi y Bluetooth — no transmiten simultáneo a máximo throughput</li>
              <li>Solo 2.4 GHz — no hay banda de 5 GHz en ningún modelo ESP32</li>
              <li><strong className="text-white">WROOM-32</strong>: antena impresa en el propio PCB del módulo (trace antenna), ganancia típica ~2 dBi</li>
              <li><strong className="text-white">WROOM-32U</strong>: conector externo U.FL/IPEX para antena externa, mejor alcance si el gabinete bloquea señal</li>
              <li>Alcance típico en espacio abierto con línea de vista: 20–50 m; bastante menos atravesando paredes</li>
            </ul>
            <p className="text-[12px] text-[#4a6080] mt-4">
              Si diseñás un gabinete o case para el módulo: nunca cubrir la zona de la antena con metal
              o con una capa gruesa de material — la señal se degrada fuerte aunque el chip siga
              funcionando perfecto por dentro.
            </p>
          </Section>

          <Section id="variantes" title="Variantes del módulo">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#0f1f35] text-[10px] font-mono tracking-[0.1em] uppercase text-[#4a6080]">
                    <th className="pb-2 pr-4">Modelo</th>
                    <th className="pb-2 pr-4">Antena</th>
                    <th className="pb-2 pr-4">Memoria</th>
                    <th className="pb-2">Qué lo diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  {VARIANTS.map((v) => (
                    <tr key={v.name} className="border-b border-[#0f1f35]/60">
                      <td className="py-2.5 pr-4 font-mono" style={{ color: ACCENT }}>{v.name}</td>
                      <td className="py-2.5 pr-4 text-[#8fb8d6]">{v.antena}</td>
                      <td className="py-2.5 pr-4 text-[#8fb8d6]">{v.flash}</td>
                      <td className="py-2.5 text-[#8fb8d6]">{v.extra}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[12px] text-[#4a6080] mt-4">
              Lo que vendemos como insumo base es el <strong className="text-[#8fb8d6]">WROOM-32</strong> en
              DevKit — es el modelo con más tutoriales, más compatibilidad con proyectos existentes y el
              que más rápido se revende.
            </p>
          </Section>

          <Section id="programacion" title="Programación">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-6">
              {[
                ['Arduino IDE', 'El más accesible — paquete "ESP32 by Espressif Systems" desde el Boards Manager. Ideal para arrancar.'],
                ['ESP-IDF', 'Framework oficial de Espressif, en C. Control total de bajo nivel, el que usa la industria.'],
                ['MicroPython', 'Firmware que corre un intérprete Python en el chip — prototipado rápido, menos control fino.'],
              ].map(([k, v]) => (
                <div key={k} className="border border-[#0f1f35] p-4">
                  <div className="font-mono text-[10px] tracking-[0.15em] uppercase mb-2" style={{ color: ACCENT }}>{k}</div>
                  <div className="text-[12px] text-[#8fb8d6] leading-relaxed">{v}</div>
                </div>
              ))}
            </div>
            <p className="text-sm text-[#8fb8d6] leading-relaxed">
              El flasheo va por USB a través de un chip puente USB-UART (CP2102 o CH340 según el clon).
              La mayoría de los DevKit tienen auto-reset y entran solos en modo de descarga al subir
              código — algunas variantes sin ese circuito (como el ESP32-CAM) te obligan a mantener
              GPIO0 en LOW a mano mientras conectás la alimentación para poder flashear.
            </p>
          </Section>

          <div className="text-center py-12 border-t border-[#0f1f35]">
            <Link
              href="mailto:contact@neoproxy.art?subject=Consulta%20ESP32"
              className="inline-block font-mono text-[10px] tracking-[0.2em] uppercase px-5 py-3 border"
              style={{ color: ACCENT, borderColor: `${ACCENT}66` }}
            >
              [ CONSULTAR DISPONIBILIDAD ]
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
