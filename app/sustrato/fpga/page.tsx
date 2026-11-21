// NPX-SUS-07 — FPGA (guía práctica). El fundamento teórico (LUTs,
// síntesis, bitstream) ya vive en /archivo/computacion-no-convencional
// sección IX -- acá NO se repite, se linkea. Esta página es la bajada
// práctica: qué comprar, qué toolchain instalar, y el puente explícito y
// honesto al propio hardware FPGA real del proyecto, ya documentado en
// CLAUDE.md (EP4CE6E22C8, openFPGALoader en vez de quartus_pgm por la
// incompatibilidad real de clones USB-Blaster, el flujo .sof -> .rbf, el
// TRNG) -- texto verificado contra CLAUDE.md antes de escribirse, no
// asumido de memoria.

import { SustratoDoc, Section, P, B, Caption } from '@/components/sustrato/DocPage'
import Link from 'next/link'

const ACCENT = '#ffb703'

const TOC = [
  { roman: 'I', id: 'sec-01', label: 'Qué hace falta ya entendido (y dónde está)' },
  { roman: 'II', id: 'sec-02', label: 'El panorama real de fabricantes' },
  { roman: 'III', id: 'sec-03', label: 'Placas reales para empezar' },
  { roman: 'IV', id: 'sec-04', label: 'Toolchains — propietario vs. open-source' },
  { roman: 'V', id: 'sec-05', label: 'El FPGA propio de este proyecto' },
  { roman: 'VI', id: 'sec-06', label: 'El primer proyecto real' },
  { roman: 'VII', id: 'sec-07', label: 'Depurar hardware, no software' },
  { roman: 'VIII', id: 'sec-08', label: 'Errores comunes de principiante' },
  { roman: 'IX', id: 'sec-09', label: 'De acá en adelante' },
]

export const metadata = { title: 'FPGA // SUSTRATO // NeoProxy' }

export default function FpgaSustratoPage() {
  return (
    <SustratoDoc
      code="NPX-SUS-07" title="FPGA" subtitle="GUÍA PRÁCTICA — QUÉ COMPRAR, QUÉ INSTALAR, CÓMO EMPEZAR" accent={ACCENT}
      classification="SILICIO RECONFIGURABLE — GUÍA DE HARDWARE Y HERRAMIENTAS" revision="01 — IX SECCIONES"
      alcance="FABRICANTES → PLACAS REALES → TOOLCHAINS → EL FPGA PROPIO DEL PROYECTO → PRIMER PROYECTO → DEBUGGING"
      toc={TOC}
      intro={<>
        El fundamento teórico (qué es una FPGA por dentro, LUTs, el flujo de síntesis completo) ya está
        desarrollado en{' '}
        <Link href="/archivo/computacion-no-convencional#sec-09" style={{ color: '#fff', textDecoration: 'underline' }}>
          /archivo/computacion-no-convencional, sección IX
        </Link>{' '}
        — ese documento no se repite acá. Esto es la bajada práctica: con qué placa real empezar, qué
        instalar, y el puente directo al propio hardware FPGA de este proyecto.
      </>}
    >
      <Section roman="I" id="sec-01" title="QUÉ HACE FALTA YA ENTENDIDO (Y DÓNDE ESTÁ)">
        <P>
          Esta guía asume ya leído qué es una LUT, qué hace la síntesis, y qué es un bitstream — si no, el
          punto de partida real es{' '}
          <Link href="/archivo/computacion-no-convencional#sec-09" style={{ color: '#fff', textDecoration: 'underline' }}>
            el documento teórico del Codex
          </Link>. Acá se arranca directo con decisiones de compra y de herramientas.
        </P>
      </Section>

      <Section roman="II" id="sec-02" title="EL PANORAMA REAL DE FABRICANTES">
        <P>
          <B>Xilinx</B> (adquirida por AMD en 2022) y <B>Intel</B> (su división FPGA viene de la compra de{' '}
          <B>Altera</B> en 2015) son los dos fabricantes dominantes históricos, con las familias de chips más
          grandes y usadas en la industria. <B>Lattice Semiconductor</B> ocupa el nicho de FPGAs más chicas,
          de bajo consumo y bajo costo — justo el segmento donde nació el soporte real de herramientas
          open-source (sección IV). <B>Microchip</B> (que absorbió a Actel/Microsemi) atiende sobre todo el
          segmento aeroespacial y militar, con FPGAs de muy bajo consumo y, en algunos casos, resistentes a
          radiación — un nicho real, no el punto de entrada para un hobbista.
        </P>
      </Section>

      <Section roman="III" id="sec-03" title="PLACAS REALES PARA EMPEZAR">
        <P>
          <B>Lattice iCEstick (iCE40)</B>: la placa más recomendada para un primer contacto real — barata, y
          con toolchain 100% open-source madura (sección IV). <B>Digilent Basys 3 / Arty</B>: FPGAs Xilinx
          Artix-7, el punto de entrada estándar en cursos universitarios de diseño digital, con el toolchain
          propietario Vivado (gratuito para estos chips). <B>Terasic DE10-Lite / DE10-Nano</B>: FPGAs Intel
          (Altera) con el toolchain Quartus — la misma familia de herramienta que ya usa este proyecto
          (sección V). <B>Alchitry</B>: kits pensados explícitamente para principiantes, con su propio
          entorno simplificado sobre FPGAs Lattice.
        </P>
      </Section>

      <Section roman="IV" id="sec-04" title="TOOLCHAINS — PROPIETARIO VS. OPEN-SOURCE">
        <P>
          Los dos caminos reales: <B>propietario</B> (Vivado para Xilinx/AMD, Quartus para Intel/Altera,
          Lattice Diamond o Radiant para Lattice) — gratuitos para los chips más chicos de cada familia,
          completos, pero pesados de instalar y de código cerrado. <B>Open-source</B>: la cadena{' '}
          <B>Yosys</B> (síntesis) + <B>nextpnr</B> (place and route) + <B>Project IceStorm</B> (generación
          real de bitstream, para Lattice iCE40) o <B>Project Trellis</B> (el equivalente para la familia
          Lattice ECP5, más grande) — nacida de ingeniería inversa real del formato de bitstream de Lattice,
          hoy madura y usada en producción por una comunidad activa. El soporte open-source para Xilinx e
          Intel/Altera existe pero es más parcial — por eso Lattice es, hoy, el fabricante real más amigable
          para quien quiere evitar herramientas de código cerrado desde el día uno.
        </P>
      </Section>

      <Section roman="V" id="sec-05" title="EL FPGA PROPIO DE ESTE PROYECTO">
        <P>
          Este mismo proyecto ya tiene equipo FPGA real, documentado y en uso (ver CLAUDE.md, aparte de este
          repo): un chip <B>Intel/Altera Cyclone IV E, modelo EP4CE6E22C8</B>. El flujo real de trabajo
          documentado: síntesis en <B>Quartus</B> hasta generar un archivo <code>.sof</code>, convertido a{' '}
          <code>.rbf</code> con <code>quartus_cpf -c</code>, y cargado al chip con{' '}
          <B>openFPGALoader</B> (<code>sudo openFPGALoader --cable usb-blaster --file-type rbf archivo.rbf</code>){' '}
          — <B>no</B> con <code>quartus_pgm</code>, la herramienta "oficial" de Intel, por una incompatibilidad
          real ya identificada: los clones USB-Blaster (no el programador original de Intel) no funcionan
          bien con ella. El proyecto real detrás de este hardware es un <B>TRNG</B> (generador de números
          aleatorios reales por hardware) — el mapeo de pines LED de ese TRNG vive fuera de este repo
          (<code>neoproxy-lab</code> / <code>digitalseed</code>), no verificable desde acá.
        </P>
        <Caption>
          La bandera <code>-f</code> de openFPGALoader escribe a flash (memoria persistente del chip, no solo
          a la configuración volátil activa) — CLAUDE.md marca esto explícitamente como "cuidado", no un
          detalle menor: escribir a flash sin necesidad real puede dejar el chip arrancando con una
          configuración vieja o rota en cada power-on futuro.
        </Caption>
      </Section>

      <Section roman="VI" id="sec-06" title="EL PRIMER PROYECTO REAL">
        <P>
          El camino de aprendizaje estándar, real y probado por décadas de cursos de diseño digital: primero,
          un LED parpadeando (un contador binario simple dividiendo el reloj de la placa hasta una frecuencia
          visible al ojo humano — "Hola Mundo" del hardware digital). Después, un contador mostrado en
          displays de 7 segmentos reales de la placa. Luego, una máquina de estados simple (un semáforo, por
          ejemplo) — el primer diseño que ya no es solo combinacional sino que depende de su propio estado
          anterior. Cada paso se escribe en Verilog o VHDL, se simula primero (sin tocar hardware real, para
          encontrar errores de lógica baratos) y recién después se sintetiza y se carga al chip físico.
        </P>
      </Section>

      <Section roman="VII" id="sec-07" title="DEPURAR HARDWARE, NO SOFTWARE">
        <P>
          No hay un <code>print()</code> o un debugger de breakpoints como en software — una vez cargado el
          bitstream, la lógica corre en paralelo real, a la velocidad del reloj. Las herramientas reales para
          mirar "adentro" de un diseño ya cargado son analizadores lógicos integrados: <B>SignalTap</B> (en
          el ecosistema Intel/Quartus) o <B>ILA</B> — Integrated Logic Analyzer (en el ecosistema
          Xilinx/Vivado) — ambos insertan lógica adicional en el propio diseño para capturar el valor de
          señales internas en tiempo real y mostrarlas como si fueran un osciloscopio digital, sin necesidad
          de sacar esas señales a pines físicos externos.
        </P>
      </Section>

      <Section roman="VIII" id="sec-08" title="ERRORES COMUNES DE PRINCIPIANTE">
        <P>
          <B>No cerrar timing</B>: el diseño sintetiza y carga sin error, pero falla de forma intermitente en
          hardware real porque alguna señal no llega a tiempo a la frecuencia de reloj pedida — un problema
          que una simulación funcional simple no detecta, hace falta mirar el reporte de timing real de la
          herramienta. <B>Metaestabilidad al cruzar dominios de reloj</B>: una señal generada por un reloj
          entrando a lógica sincronizada con otro reloj distinto puede quedar en un estado eléctrico
          indefinido por un instante — se resuelve con sincronizadores de dos o más flip-flops, nunca
          conectando directo. <B>No inicializar señales</B>: a diferencia de una variable de software que
          puede arrancar en cualquier valor sin romper nada grave, una señal de hardware sin estado inicial
          definido puede dejar un diseño entero en un estado indeterminado al encender.
        </P>
      </Section>

      <Section roman="IX" id="sec-09" title="DE ACÁ EN ADELANTE">
        <P>
          Para volver al fundamento teórico completo (qué distingue a una FPGA de un ASIC, por qué el
          cómputo neuromórfico y otras arquitecturas no convencionales encuentran en FPGA su plataforma real
          de experimentación), el documento es{' '}
          <Link href="/archivo/computacion-no-convencional" style={{ color: '#fff', textDecoration: 'underline' }}>
            /archivo/computacion-no-convencional
          </Link>. Para la decisión completa entre las cinco plataformas de esta sección, la{' '}
          <Link href="/sustrato/comparativa" style={{ color: '#fff', textDecoration: 'underline' }}>COMPARATIVA</Link>,
          el cierre de SUSTRATO.
        </P>
      </Section>
    </SustratoDoc>
  )
}
