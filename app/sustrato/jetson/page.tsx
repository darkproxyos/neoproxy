// NPX-SUS-05 — NVIDIA JETSON. Qué lo distingue de verdad de Raspberry Pi
// (GPU CUDA real a bordo, no solo más CPU), CUDA/TensorRT explicados sin
// asumirlos conocidos, la familia completa, y cross-link honesto a
// /archivo/edge-computing (que ya cubre Edge AI en general) en vez de
// repetir ese contenido.

import { SustratoDoc, Section, P, B, Caption } from '@/components/sustrato/DocPage'
import Link from 'next/link'

const ACCENT = '#76b900'

const TOC = [
  { roman: 'I', id: 'sec-01', label: 'Qué es, de entrada' },
  { roman: 'II', id: 'sec-02', label: 'De la nube al borde — por qué existe esta categoría' },
  { roman: 'III', id: 'sec-03', label: 'Arquitectura — módulo + placa base' },
  { roman: 'IV', id: 'sec-04', label: 'CUDA y TensorRT, sin asumirlos conocidos' },
  { roman: 'V', id: 'sec-05', label: 'La familia completa' },
  { roman: 'VI', id: 'sec-06', label: 'Casos de uso reales' },
  { roman: 'VII', id: 'sec-07', label: 'Jetson vs. Raspberry Pi, de frente' },
  { roman: 'VIII', id: 'sec-08', label: 'Los límites reales' },
  { roman: 'IX', id: 'sec-09', label: 'De acá en adelante' },
]

export const metadata = { title: 'NVIDIA JETSON // SUSTRATO // NeoProxy' }

export default function JetsonPage() {
  return (
    <SustratoDoc
      code="NPX-SUS-05" title="NVIDIA JETSON" subtitle="GPU REAL DE CÓMPUTO PARALELO, EN UNA PLACA DEL TAMAÑO DE UNA MANO" accent={ACCENT}
      classification="MÓDULO DE CÓMPUTO DE BORDE — IA EMBEBIDA CON GPU" revision="01 — IX SECCIONES"
      alcance="QUÉ ES → EDGE AI → ARQUITECTURA → CUDA/TENSORRT → FAMILIA → CASOS DE USO → VS. RASPBERRY PI"
      toc={TOC}
      intro={<>
        Cuando ni{' '}
        <Link href="/sustrato/arduino" style={{ color: '#fff', textDecoration: 'underline' }}>Arduino</Link>{' '}
        ni{' '}
        <Link href="/sustrato/raspberry-pi" style={{ color: '#fff', textDecoration: 'underline' }}>Raspberry Pi</Link>{' '}
        alcanzan — porque el proyecto necesita correr, en vivo y sin depender de la nube, una red neuronal
        real para ver o escuchar el mundo.
      </>}
    >
      <Section roman="I" id="sec-01" title="QUÉ ES, DE ENTRADA">
        <P>
          Un Jetson es, en esencia, una Raspberry Pi con una diferencia decisiva: además de CPU, trae una{' '}
          <B>GPU NVIDIA real</B> integrada en el mismo módulo — cientos o miles de núcleos CUDA pensados para
          cómputo paralelo masivo, el mismo tipo de silicio (a otra escala) que entrena los modelos de IA más
          grandes del mundo en un datacenter. Correr <B>inferencia</B> de una red neuronal (usar un modelo ya
          entrenado para reconocer objetos, por ejemplo) en tiempo real sobre video en vivo es algo que ni
          una CPU de Raspberry Pi ni mucho menos un microcontrolador pueden hacer a velocidad útil —y es
          exactamente lo que una GPU hace bien por diseño.
        </P>
      </Section>

      <Section roman="II" id="sec-02" title="DE LA NUBE AL BORDE — POR QUÉ EXISTE ESTA CATEGORÍA">
        <P>
          El motivo real detrás de esta categoría completa de hardware ya está desarrollado en{' '}
          <Link href="/archivo/edge-computing" style={{ color: '#fff', textDecoration: 'underline' }}>/archivo/edge-computing</Link>{' '}
          (sección V, Edge AI) — no se repite acá: mandar video en vivo a un datacenter en la nube para que
          una GPU remota lo analice y devuelva una respuesta introduce latencia real, depende de conectividad
          constante, y expone datos potencialmente sensibles a terceros. Un Jetson resuelve eso corriendo la
          inferencia localmente, en el borde — la misma motivación de todo el documento de edge computing,
          aplicada a hardware específico comprable hoy.
        </P>
      </Section>

      <Section roman="III" id="sec-03" title="ARQUITECTURA — MÓDULO + PLACA BASE">
        <P>
          Un Jetson real se vende típicamente como dos piezas: un <B>módulo de cómputo</B> (SoM — system on
          module, la parte cara y compleja: CPU ARM, GPU, memoria, todo soldado en un módulo compacto) y una{' '}
          <B>placa base</B> (carrier board) que expone los puertos reales (USB, Ethernet, cámara, GPIO) — el
          mismo módulo de cómputo puede montarse sobre distintas placas base según el producto final, un
          patrón de diseño pensado para pasar de prototipo a producto industrial sin rediseñar el núcleo de
          cómputo cada vez.
        </P>
      </Section>

      <Section roman="IV" id="sec-04" title="CUDA Y TENSORRT, SIN ASUMIRLOS CONOCIDOS">
        <P>
          <B>CUDA</B> (Compute Unified Device Architecture, NVIDIA 2007) es la plataforma de programación
          que permite escribir código que corre directamente en los núcleos paralelos de la GPU, no solo
          gráficos — la razón técnica real por la que el ecosistema de inteligencia artificial moderno se
          construyó mayoritariamente sobre hardware NVIDIA: la mayoría de los frameworks de deep learning
          (PyTorch, TensorFlow) tienen soporte CUDA maduro desde hace años. <B>TensorRT</B> es, sobre esa
          base, un optimizador específico de NVIDIA para <B>inferencia</B>: toma un modelo ya entrenado y lo
          recompila y cuantiza (reduce la precisión numérica de forma controlada) para correr más rápido y
          con menos memoria en el hardware Jetson específico, a veces con una mejora de varias veces la
          velocidad sobre el mismo modelo sin optimizar.
        </P>
      </Section>

      <Section roman="V" id="sec-05" title="LA FAMILIA COMPLETA">
        <P>
          <B>Jetson TK1</B> (2014): el primero, siembra inicial del concepto. <B>Nano</B> (2019): el punto de
          entrada real, pensado explícitamente para precio accesible y proyectos educativos/hobby serios de
          visión por computadora. <B>TX2</B>: gama media de su generación. <B>Xavier</B> (NX y AGX): salto
          grande de rendimiento, ya con núcleos especializados para IA además de los núcleos CUDA genéricos.{' '}
          <B>Orin</B> (Nano, NX, AGX — 2022/2023): la generación actual de más rendimiento, el nivel que usan
          proyectos reales de robótica autónoma seria. Todos corren sobre <B>JetPack</B>, el SDK oficial de
          NVIDIA (Linux Ubuntu + drivers CUDA + librerías de IA preconfiguradas) — no es un Linux genérico
          cualquiera, es una distribución específica mantenida por NVIDIA para este hardware exacto.
        </P>
      </Section>

      <Section roman="VI" id="sec-06" title="CASOS DE USO REALES">
        <P>
          Robots móviles autónomos que necesitan interpretar cámaras en tiempo real para navegar (la
          plataforma de referencia de <B>NVIDIA Isaac</B>, su stack de software de robótica), drones con
          visión computacional embebida, cámaras de seguridad inteligentes que detectan objetos/personas sin
          mandar video crudo a ningún servidor, y líneas de inspección industrial por visión artificial
          donde la latencia de ida y vuelta a la nube directamente no es aceptable.
        </P>
      </Section>

      <Section roman="VII" id="sec-07" title="JETSON VS. RASPBERRY PI, DE FRENTE">
        <P>
          Ambos corren Linux real, ambos son SBC o SoM con CPU ARM — la diferencia que de verdad importa es
          la GPU CUDA. Una Raspberry Pi puede correr un modelo de IA chico, lento, con la CPU sola o con un
          acelerador USB aparte (como un Coral Edge TPU, mencionado en{' '}
          <Link href="/archivo/edge-computing" style={{ color: '#fff', textDecoration: 'underline' }}>edge computing</Link>) —
          un Jetson lo corre nativamente, en paralelo real, a velocidades de video en vivo. El costo real de
          esa capacidad: un Jetson cuesta notablemente más que una Raspberry Pi equivalente en otros
          aspectos, y consume más energía.
        </P>
      </Section>

      <Section roman="VIII" id="sec-08" title="LOS LÍMITES REALES">
        <P>
          Precio de entrada mayor que cualquier otra placa de esta sección. Consumo de energía real que
          descarta baterías chicas para uso prolongado. Un ecosistema de software más pesado y específico
          (JetPack, versiones de CUDA/TensorRT que hay que hacer coincidir con cuidado) — la curva de entrada
          es mayor que enchufar un Arduino y escribir un sketch. Y, para cualquier tarea que no sea cómputo
          paralelo masivo (control de un solo motor con timing exacto, por ejemplo), toda esa GPU queda
          ociosa — no es la herramienta correcta si lo que hace falta es, en el fondo, un microcontrolador
          simple.
        </P>
      </Section>

      <Section roman="IX" id="sec-09" title="DE ACÁ EN ADELANTE">
        <P>
          Cuando el proyecto necesita, en cambio, determinismo de tiempo real estricto en vez de potencia
          paralela de IA, el siguiente documento es{' '}
          <Link href="/sustrato/stm32" style={{ color: '#fff', textDecoration: 'underline' }}>STM32</Link>.
          Y cuando lo que hace falta es silicio reconfigurable en vez de cualquiera de estas arquitecturas
          fijas, <Link href="/sustrato/fpga" style={{ color: '#fff', textDecoration: 'underline' }}>FPGA</Link>.
        </P>
      </Section>
    </SustratoDoc>
  )
}
