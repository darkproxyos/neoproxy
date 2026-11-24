'use client'

// NPX-ARC-17 — LINUX
// Pedido explícito: un documento extenso sobre Linux, el kernel y el
// sistema operativo real, con la vara de rigor del resto del Codex —
// hechos verificables (fechas, nombres, el mensaje real de Torvalds en
// Usenet), no una introducción genérica de curso online. Cierra con una
// sección honesta: qué de NeoProxy ya se parece genuinamente a un OS
// (Memory/hub.json como tabla de procesos, Metatron como el candidato más
// cercano a un init) y qué le falta de verdad para serlo — sin inflar la
// metáfora más de lo que aguanta.
// Acento verde terminal #00ff41, distinto de todos los ya usados en el
// Codex (ver components/knowledge/archiveDocs.ts antes de reusar).

import { useEffect, useState } from 'react'
import Link from 'next/link'

const mono = "'Space Mono', monospace"
const ACCENT = '#00ff41'
const TEXT = '#d8ffe0'
const TEXT_DIM = '#8fd4a0'
const LABEL_DIM = '#4a8a5a'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(2, 10, 4, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(0,255,65,0.03)`,
        padding: '28px 26px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function SectionHeader({ roman, title, sub }: { roman: string; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
        <span style={{ fontSize: 13, color: `${ACCENT}66`, letterSpacing: 2 }}>{roman}</span>
        <h2 style={{
          fontSize: 'clamp(18px, 3vw, 24px)', letterSpacing: 5, color: ACCENT,
          textShadow: `0 0 24px ${ACCENT}44`, margin: 0,
        }}>
          {title}
        </h2>
      </div>
      {sub && (
        <div style={{ fontSize: 10, letterSpacing: 1, color: LABEL_DIM, marginTop: 8, paddingLeft: 32 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 9.5, lineHeight: 1.8, letterSpacing: 0.5, color: LABEL_DIM, marginTop: 14,
      borderLeft: `2px solid ${ACCENT}33`, paddingLeft: 12,
    }}>
      {children}
    </div>
  )
}

const TOC: [string, string, string][] = [
  ['I', 'sec-01', 'Antes de Linux — Multics, Unix y la filosofía que lo sostiene todo'],
  ['II', 'sec-02', 'GNU y el software libre — Stallman, la GPL, el copyleft como decisión técnica'],
  ['III', 'sec-03', '1991 — el mensaje real de Torvalds y el debate con Tanenbaum'],
  ['IV', 'sec-04', 'Qué hace un kernel, en serio — procesos, memoria, drivers, syscalls'],
  ['V', 'sec-05', 'El scheduler — cómo decide la CPU quién corre'],
  ['VI', 'sec-06', 'Memoria virtual — la mentira útil que cree cada proceso'],
  ['VII', 'sec-07', 'El árbol de arranque — de la UEFI al primer prompt'],
  ['VIII', 'sec-08', 'Todo es un archivo — /proc, /sys, y la filosofía que todavía sostiene todo'],
  ['IX', 'sec-09', 'Namespaces y cgroups — las piezas reales detrás de los contenedores'],
  ['X', 'sec-10', 'Monolítico con módulos — por qué Linux ganó el debate en la práctica'],
  ['XI', 'sec-11', 'Distribuciones — qué es el kernel y qué es la distro'],
  ['XII', 'sec-12', 'Construir el tuyo — de compilar tu kernel a un sistema operativo propio'],
]

export default function LinuxPage() {
  const [visible, setVisible] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.lnx-section'))
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const id = (entry.target as HTMLElement).id
        setVisible((prev) => (prev[id] ? prev : { ...prev, [id]: true }))
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' })
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ background: '#030805', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        <Link href="/knowledge" className="press" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${ACCENT}aa`, textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← VOLVER AL CODEX
        </Link>

        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${ACCENT}66`, marginBottom: 16 }}>
            NPX-ARC-17 // REFERENCIA TÉCNICA
          </div>
          <h1 style={{
            fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 700, letterSpacing: 6, color: ACCENT,
            textShadow: `0 0 40px ${ACCENT}55`, marginBottom: 14, lineHeight: 1.1,
          }}>
            LINUX
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            EL KERNEL REAL — DE LA FILOSOFÍA UNIX A CONSTRUIR UN SISTEMA OPERATIVO PROPIO
          </div>
          <p style={{
            fontSize: 11.5, lineHeight: 2.1, letterSpacing: 0.3, color: TEXT_DIM, maxWidth: 660,
            borderLeft: `1px solid ${ACCENT}33`, paddingLeft: 24, marginBottom: 32,
          }}>
            No es una introducción de curso online. Es la historia real (fechas, nombres, el mensaje
            exacto que Linus Torvalds posteó en Usenet en 1991), la mecánica real de lo que un kernel
            hace con la CPU y la memoria mientras lees esto, y un camino concreto para dejar de usar
            Linux y empezar a construir el tuyo — hasta dónde eso es honesto respecto de lo que ya
            existe en este mismo proyecto.
          </p>

          <div style={{
            display: 'inline-grid', gridTemplateColumns: 'auto auto', gap: '4px 24px', fontSize: 9,
            letterSpacing: 1, color: `${ACCENT}99`, border: `1px solid ${ACCENT}33`, padding: '12px 18px',
            marginBottom: 32,
          }}>
            <span style={{ color: `${ACCENT}55` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>SISTEMAS OPERATIVOS — DEL KERNEL REAL A CÓMO CONSTRUIR UNO PROPIO</span>
            <span style={{ color: `${ACCENT}55` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — XII SECCIONES</span>
            <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>UNIX → GNU → LINUX → EL KERNEL POR DENTRO → NAMESPACES/CGROUPS → DISTRIBUCIONES → CONSTRUIR EL PROPIO</span>
          </div>

          <nav style={{ border: `1px solid ${ACCENT}22`, padding: '20px 24px', maxWidth: 680 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}66`, marginBottom: 14 }}>ÍNDICE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '6px 20px' }}>
              {TOC.map(([roman, id, label]) => (
                <a key={id} href={`#${id}`} style={{ fontSize: 10.5, color: TEXT_DIM, textDecoration: 'none', display: 'flex', gap: 10 }}>
                  <span style={{ color: `${ACCENT}88`, width: 28, flexShrink: 0 }}>{roman}</span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </nav>
        </div>

        {/* I. ANTES DE LINUX */}
        <div id="sec-01" className={`lnx-section ${visible['sec-01'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="I" title="ANTES DE LINUX" sub="Multics, Unix y la filosofía que lo sostiene todo" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Antes de Unix hubo <strong style={{ color: '#fff' }}>Multics</strong> (1965, un proyecto
              conjunto de MIT, Bell Labs y General Electric): un sistema operativo ambicioso, pensado
              para que miles de usuarios compartieran una sola máquina con seguridad real por niveles —
              tan complejo que nunca terminó de funcionar bien. Bell Labs se bajó del proyecto en 1969.
              Dos de sus investigadores, <strong style={{ color: '#fff' }}>Ken Thompson</strong> y{' '}
              <strong style={{ color: '#fff' }}>Dennis Ritchie</strong>, se quedaron con la pregunta sin
              resolver y la respondieron al revés: en vez de un sistema que lo hiciera todo, uno mínimo
              que hiciera pocas cosas bien. Lo escribieron primero en ensamblador para una PDP-7 en 1969;
              el nombre, un chiste de un colega (Brian Kernighan) sobre ser la versión "castrada" de
              Multics, quedó.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La decisión que de verdad cambió todo llegó en 1973: reescribir Unix en{' '}
              <strong style={{ color: '#fff' }}>C</strong>, un lenguaje que el propio Ritchie terminaba de
              diseñar. Antes de eso, un sistema operativo era, por necesidad, código de máquina específico
              de una computadora puntual. Un Unix escrito en C portaba a cualquier máquina con un
              compilador de C — la idea de "sistema operativo portable" nace técnicamente ahí, no antes.
              De esa decisión sale la filosofía que todavía sostiene todo lo que sigue en este documento:{' '}
              <strong style={{ color: '#fff' }}>todo es un archivo</strong> — un disco, un terminal, una
              impresora, un proceso — mismo conjunto reducido de operaciones (abrir, leer, escribir,
              cerrar) para todo lo que el sistema toca.
            </p>
            <Caption>
              "Todo es un archivo" no es literal al 100% incluso en Unix clásico (los sockets de red
              llegaron después y nunca encajaron del todo limpio en esa metáfora) — pero como principio
              de diseño explica más decisiones reales del kernel que cualquier otra frase sola.
            </Caption>
          </Panel>
        </div>

        {/* II. GNU */}
        <div id="sec-02" className={`lnx-section ${visible['sec-02'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="GNU Y EL SOFTWARE LIBRE" sub="Stallman, la GPL, el copyleft como decisión técnica" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              En 1983, <strong style={{ color: '#fff' }}>Richard Stallman</strong>, investigador del MIT,
              anunció en Usenet el proyecto <strong style={{ color: '#fff' }}>GNU</strong> (acrónimo
              recursivo: "GNU's Not Unix") — reescribir, desde cero, un sistema operativo completo
              compatible con Unix, pero libre de licencias propietarias. La motivación no era abstracta:
              Stallman venía de un laboratorio donde el código se compartía libremente entre
              programadores, y vio esa cultura cerrarse de golpe cuando el software empezó a venderse sin
              el código fuente. En 1985 fundó la{' '}
              <strong style={{ color: '#fff' }}>Free Software Foundation</strong> para sostener legalmente
              el proyecto.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              La herramienta real de esa idea es la{' '}
              <strong style={{ color: '#fff' }}>GPL</strong> (GNU General Public License, primera versión
              1989): cualquiera puede usar, estudiar, modificar y redistribuir el código, con una
              condición que la vuelve distinta de simplemente "publicar el código" —{' '}
              <strong style={{ color: '#fff' }}>copyleft</strong>: si distribuís una versión modificada,
              tenés que distribuirla bajo la misma licencia. No es solo una postura ética: es un mecanismo
              técnico-legal diseñado para que el código libre no pueda "cerrarse" en una versión
              posterior. Para 1991, GNU tenía casi todo el sistema operativo completo — compilador (GCC),
              editor (Emacs), shell (Bash), las herramientas base (coreutils) — menos una pieza central
              que nadie había terminado todavía: el kernel.
            </p>
            <Caption>
              El kernel propio de GNU, Hurd, empezó en 1990 con un diseño de microkernel ambicioso (ver
              sección X) — sigue en desarrollo hoy, décadas después, nunca listo para uso general. La
              pieza que faltaba la trajo, por fuera del proyecto GNU, un estudiante en Finlandia.
            </Caption>
          </Panel>
        </div>

        {/* III. 1991 */}
        <div id="sec-03" className={`lnx-section ${visible['sec-03'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title="1991" sub="el mensaje real de Torvalds y el debate con Tanenbaum" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              El 25 de agosto de 1991, <strong style={{ color: '#fff' }}>Linus Torvalds</strong>, un
              estudiante de 21 años en la Universidad de Helsinki, posteó en el grupo de noticias{' '}
              <em>comp.os.minix</em> uno de los mensajes más citados de la historia de la computación:
              "Hello everybody out there using minix — I'm doing a (free) operating system (just a
              hobby, won't be big and professional like gnu) [...]". Lo había empezado para su propia PC
              386 porque <strong style={{ color: '#fff' }}>MINIX</strong> — el sistema operativo didáctico
              de <strong style={{ color: '#fff' }}>Andrew Tanenbaum</strong>, pensado para enseñar diseño
              de sistemas operativos, no para usarse en serio — tenía una licencia que restringía
              modificarlo y redistribuirlo libremente.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              En 1992 se dio, en el mismo grupo de noticias, el debate real conocido como{' '}
              <strong style={{ color: '#fff' }}>"LINUX is obsolete"</strong>: Tanenbaum argumentó en
              público que el diseño monolítico de Linux era un paso atrás respecto del diseño de
              microkernel de MINIX (ver sección X) — "en 10 años, todos los sistemas operativos serán
              microkernel". Torvalds respondió con una defensa técnica y bastante menos diplomática.
              Treinta años después, el kernel que "en 10 años iba a estar obsoleto" corre en la mayoría
              de los servidores de internet, en Android, y en la supercomputadora más rápida del mundo —
              no porque el argumento técnico de Tanenbaum fuera falso (la sección X explica por qué tenía
              razón en varios puntos reales), sino porque Linux resolvió el problema práctico primero:
              funcionaba, ya.
            </p>
            <Caption>
              Linux (el kernel) + las herramientas de GNU + una licencia compartida (Torvalds relicenció
              Linux bajo GPL en 1992) formaron, juntos, el primer sistema operativo libre completo y
              usable — por eso Stallman insiste, con razón técnica real y no solo vanidad, en llamarlo
              "GNU/Linux": sin GNU, Linux es solo un kernel sin nada arriba.
            </Caption>
          </Panel>
        </div>

        {/* IV. QUÉ HACE UN KERNEL */}
        <div id="sec-04" className={`lnx-section ${visible['sec-04'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="QUÉ HACE UN KERNEL, EN SERIO" sub="procesos, memoria, drivers, syscalls" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Un procesador real no sabe nada de "programas" — ejecuta instrucciones, una tras otra, de
              donde le apunte el program counter. Un kernel es el software que convierte eso en la
              ilusión de que muchos programas corren "a la vez", cada uno con su propia memoria privada,
              sin que ninguno pueda tocar al otro ni a la máquina directamente salvo que el kernel se lo
              permita. Para eso usa una frontera real de hardware: en procesadores x86, el{' '}
              <strong style={{ color: '#fff' }}>anillo de privilegio</strong> — el kernel corre en{' '}
              <strong style={{ color: '#fff' }}>ring 0</strong> (acceso total a memoria y dispositivos),
              todo lo demás en <strong style={{ color: '#fff' }}>ring 3</strong> (espacio de usuario,
              sandboxeado por el propio procesador, no por convención de software).
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Un proceso en ring 3 no puede, por ejemplo, escribir un archivo directamente al disco — no
              tiene el privilegio. Lo que hace es una{' '}
              <strong style={{ color: '#fff' }}>syscall</strong> (llamada al sistema, ej. <code>write()</code>):
              una instrucción especial que interrumpe al procesador, lo pasa a ring 0, el kernel ejecuta
              la operación real en su nombre con sus propios privilegios, y devuelve el control a ring 3.
              Cada vez que un programa lee un archivo, abre una conexión de red, o pide más memoria, pasa
              por ese mismo mecanismo — la syscall es, literalmente, la única puerta entre lo que un
              programa puede pedir y lo que la máquina realmente hace.
            </p>
            <Caption>
              Las cuatro responsabilidades centrales de cualquier kernel real son estas: decidir qué
              proceso usa la CPU en cada instante (sección V), darle a cada proceso memoria privada sin
              que vea la de los demás (sección VI), traducir sus pedidos de E/S a los dispositivos reales
              (drivers), y arbitrar quién puede hacer qué (permisos). Todo lo demás es consecuencia de
              estas cuatro.
            </Caption>
          </Panel>
        </div>

        {/* V. SCHEDULER */}
        <div id="sec-05" className={`lnx-section ${visible['sec-05'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="V" title="EL SCHEDULER" sub="cómo decide la CPU quién corre" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Una CPU de 8 núcleos puede correr, de verdad, 8 instrucciones simultáneas — un sistema con
              cientos de procesos activos logra la ilusión de "todos corriendo a la vez" turnándolos a
              una velocidad que el ojo humano no distingue (un{' '}
              <strong style={{ color: '#fff' }}>context switch</strong>, cambiar de un proceso a otro,
              toma microsegundos). El componente que decide el orden y el tiempo de cada turno es el{' '}
              <strong style={{ color: '#fff' }}>scheduler</strong>. Linux usa, desde 2007 (kernel 2.6.23),
              el <strong style={{ color: '#fff' }}>CFS</strong> (Completely Fair Scheduler, diseñado por
              Ingo Molnár): en vez de colas de prioridad fija, modela el reparto de CPU como si fuera un
              recurso continuo que cada proceso merece en proporción a su peso (su prioridad, ajustable
              con <code>nice</code>) — ningún proceso tiene un "turno" literal, el scheduler siempre le da
              la CPU al que más tiempo proporcional lleva esperando.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Desde 2023 (kernel 6.6), Linux ofrece además{' '}
              <strong style={{ color: '#fff' }}>EEVDF</strong> (Earliest Eligible Virtual Deadline First),
              que mejora específicamente la latencia para cargas interactivas (audio, juegos) sin romper
              la equidad general del CFS — la misma pregunta de fondo ("a quién le toca ahora") sigue
              abierta a mejoras reales, no es un problema resuelto para siempre en 1991.
            </p>
            <Caption>
              Un proceso no siempre quiere correr: puede estar <em>bloqueado</em> esperando un disco lento
              o una respuesta de red. El scheduler real maneja tres estados básicos por proceso —{' '}
              <em>ejecutando</em>, <em>listo para ejecutar</em>, <em>bloqueado</em> — y mover un proceso
              de bloqueado a listo en el momento exacto en que su E/S termina es, en la práctica, tan
              importante como decidir a quién le toca la CPU.
            </Caption>
          </Panel>
        </div>

        {/* VI. MEMORIA VIRTUAL */}
        <div id="sec-06" className={`lnx-section ${visible['sec-06'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VI" title="MEMORIA VIRTUAL" sub="la mentira útil que cree cada proceso" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Cada proceso en un sistema Linux "cree" que tiene toda la memoria de la máquina para él
              solo, empezando siempre desde la misma dirección — eso es falso, y es falso a propósito.
              El kernel, con ayuda de hardware dedicado (la <strong style={{ color: '#fff' }}>MMU</strong>,
              memory management unit), mantiene una{' '}
              <strong style={{ color: '#fff' }}>tabla de páginas</strong> por proceso que traduce esas
              direcciones "virtuales" falsas a direcciones físicas reales de RAM — distintas para cada
              proceso, así que dos procesos pueden usar la "misma" dirección virtual sin pisarse jamás en
              la memoria física real.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Esa misma capa de indirección hace posible el{' '}
              <strong style={{ color: '#fff' }}>swap</strong>: cuando la RAM física se llena, el kernel
              puede mover páginas de memoria poco usadas al disco y reusar esa RAM para otra cosa,
              totalmente transparente para el proceso dueño de esa memoria (que, si vuelve a necesitarla,
              simplemente espera un poco más mientras el kernel la trae de vuelta). La RAM real deja de
              ser un límite duro y pasa a ser, dentro de ciertos márgenes, un recurso que el kernel
              administra con la misma lógica que un scheduler administra tiempo de CPU.
            </p>
            <Caption>
              El precio de esta mentira útil: cuando el kernel se queda realmente sin memoria y sin
              forma de liberar más (ni RAM física ni espacio de swap), entra el{' '}
              <strong style={{ color: '#fff' }}>OOM killer</strong> (out-of-memory killer) — un mecanismo
              real que elige y mata procesos por la fuerza para que el sistema entero no se cuelgue. No
              es un error: es la última válvula de un sistema que prometió más memoria de la que
              físicamente tiene.
            </Caption>
          </Panel>
        </div>

        {/* VII. ARRANQUE */}
        <div id="sec-07" className={`lnx-section ${visible['sec-07'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VII" title="EL ÁRBOL DE ARRANQUE" sub="de la UEFI al primer prompt" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Antes de que exista cualquier "sistema operativo", el firmware de la placa (hoy casi
              siempre <strong style={{ color: '#fff' }}>UEFI</strong>, heredero del BIOS clásico) corre
              sus propias pruebas de hardware y busca, en un disco, un{' '}
              <strong style={{ color: '#fff' }}>bootloader</strong> (en el mundo Linux, casi siempre{' '}
              <strong style={{ color: '#fff' }}>GRUB2</strong>). El bootloader no es el sistema operativo:
              su único trabajo es cargar en RAM la imagen real del kernel y entregarle el control.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              El kernel arranca con un problema real: todavía no sabe cómo leer el disco donde está el
              sistema de archivos raíz de verdad (el driver que necesita puede estar justo adentro de ese
              mismo disco). La solución es el{' '}
              <strong style={{ color: '#fff' }}>initramfs</strong>: un sistema de archivos mínimo,
              comprimido, cargado en RAM junto con el kernel, con exactamente los drivers necesarios para
              montar el disco real. Una vez montado el root de verdad, el kernel lanza el primer proceso
              de espacio de usuario — <strong style={{ color: '#fff' }}>PID 1</strong>, casi siempre{' '}
              <strong style={{ color: '#fff' }}>systemd</strong> hoy (antes, <code>init</code> clásico de
              SysV) — que arranca en paralelo todos los servicios configurados hasta llegar a una sesión
              usable.
            </p>
            <Caption>
              PID 1 tiene una responsabilidad que ningún otro proceso tiene: adoptar a cualquier proceso
              "huérfano" (cuyo padre murió antes que él) para que alguien termine de limpiar sus recursos
              cuando él también termine — si PID 1 muere, el kernel entero entra en pánico y se detiene,
              no hay a quién pasarle el testigo.
            </Caption>
          </Panel>
        </div>

        {/* VIII. TODO ES UN ARCHIVO */}
        <div id="sec-08" className={`lnx-section ${visible['sec-08'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VIII" title="TODO ES UN ARCHIVO" sub="/proc, /sys, y la filosofía que todavía sostiene todo" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              La prueba más literal de que "todo es un archivo" sigue viva es{' '}
              <strong style={{ color: '#fff' }}>/proc</strong>: un sistema de archivos que no existe en
              ningún disco — lo genera el kernel en vivo. <code>/proc/1234/status</code> no es un archivo
              guardado en algún lado: es una ventana en tiempo real al estado interno del proceso con PID
              1234, leíble con <code>cat</code> como cualquier archivo de texto. Herramientas tan
              cotidianas como <code>ps</code> o <code>top</code> no usan ninguna API especial — leen{' '}
              <code>/proc</code> directo.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              <strong style={{ color: '#fff' }}>/sys</strong> (sysfs, formalizado en la serie 2.6 del
              kernel, 2003) hace lo mismo para el modelo de dispositivos: cada pieza de hardware que el
              kernel reconoce aparece como un directorio real, sus parámetros ajustables como archivos
              dentro — cambiar el brillo de una pantalla puede ser, literalmente, escribir un número en un
              archivo de texto bajo <code>/sys/class/backlight</code>. La jerarquía completa del sistema
              de archivos (qué va en <code>/etc</code>, qué en <code>/var</code>, qué en{' '}
              <code>/usr</code>) tampoco es arbitraria: está estandarizada en el{' '}
              <strong style={{ color: '#fff' }}>FHS</strong> (Filesystem Hierarchy Standard), lo que
              permite que software de distribuciones distintas espere encontrar las cosas en el mismo
              lugar.
            </p>
            <Caption>
              Esto no es solo elegancia de diseño: significa que depurar un sistema Linux real casi nunca
              requiere una herramienta especial — un editor de texto y <code>cat</code> alcanzan para leer
              el estado vivo de casi cualquier parte del kernel.
            </Caption>
          </Panel>
        </div>

        {/* IX. NAMESPACES Y CGROUPS */}
        <div id="sec-09" className={`lnx-section ${visible['sec-09'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IX" title="NAMESPACES Y CGROUPS" sub="las piezas reales detrás de los contenedores" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Docker (2013) no inventó ninguna tecnología de aislamiento nueva — empaquetó, con una
              interfaz mucho más simple, dos primitivas que ya existían en el kernel de Linux desde antes.{' '}
              <strong style={{ color: '#fff' }}>Namespaces</strong> (los primeros, en 2002; la familia
              completa se fue agregando hasta 2013) controlan qué puede <em>ver</em> un proceso: un
              proceso en su propio <em>PID namespace</em> cree que es el único proceso corriendo (se ve a
              sí mismo como PID 1); en su propio <em>network namespace</em>, tiene su propia interfaz de
              red, invisible para el resto de la máquina.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              <strong style={{ color: '#fff' }}>cgroups</strong> (control groups, desarrollados en Google
              por Paul Menage y Rohit Seth, incorporados al kernel en 2007) resuelven el problema
              complementario: no qué un proceso <em>ve</em>, sino cuánto puede <em>usar</em> — límites
              reales y medibles de CPU, memoria, E/S de disco, aplicados a un grupo de procesos como si
              fuera una sola unidad. Un "contenedor" no es, técnicamente, ningún objeto nuevo del kernel:
              es un proceso normal, lanzado dentro de un conjunto de namespaces que lo aíslan y un cgroup
              que lo limita — todo mecanismo que ya estaba en el kernel antes de que la palabra
              "contenedor" se pusiera de moda.
            </p>
            <Caption>
              <strong style={{ color: '#fff' }}>LXC</strong> (Linux Containers, 2008) usó estas mismas
              primitivas cinco años antes que Docker — la innovación real de Docker no fue técnica de
              kernel, fue de distribución: imágenes versionadas, un registro central (Docker Hub), y una
              interfaz de usuario que lo volvió accesible para cualquiera.
            </Caption>
          </Panel>
        </div>

        {/* X. MONOLITICO CON MODULOS */}
        <div id="sec-10" className={`lnx-section ${visible['sec-10'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="X" title="MONOLÍTICO CON MÓDULOS" sub="por qué Linux ganó el debate en la práctica" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Un <strong style={{ color: '#fff' }}>microkernel</strong> (el diseño de MINIX, y de sistemas
              reales como <strong style={{ color: '#fff' }}>QNX</strong> o el formalmente verificado{' '}
              <strong style={{ color: '#fff' }}>seL4</strong>, 2009) mantiene en ring 0 solo lo
              mínimo indispensable — comunicación entre procesos y scheduling básico — y corre drivers,
              sistemas de archivos y el resto en procesos de espacio de usuario normales, comunicados por
              paso de mensajes. La ventaja real es aislamiento: un driver de video con un bug se cae como
              cualquier proceso, sin tumbar el resto del sistema. Un kernel{' '}
              <strong style={{ color: '#fff' }}>monolítico</strong> como Linux corre todo eso — scheduler,
              memoria, sistemas de archivos, la enorme mayoría de los drivers — adentro del mismo espacio
              de ring 0: un bug serio en un driver puede, en teoría, tumbar la máquina entera.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Tanenbaum tenía razón en ese argumento de aislamiento — y aun así, en la práctica, el diseño
              monolítico ganó durante treinta años, por una razón concreta: el paso de mensajes entre
              procesos separados (la base de todo microkernel) tiene un costo de rendimiento real en cada
              cruce, y en 1991 esa diferencia importaba muchísimo más que hoy. Linux resolvió buena parte
              del problema de aislamiento sin pagar ese costo con los{' '}
              <strong style={{ color: '#fff' }}>módulos cargables</strong> (LKMs): un driver puede
              compilarse por separado y cargarse o descargarse en caliente (<code>insmod</code>,{' '}
              <code>rmmod</code>) sin recompilar ni reiniciar el kernel entero — no es aislamiento real
              entre procesos, pero sí modularidad real de código, que es gran parte de lo que se buscaba.
            </p>
            <Caption>
              El debate no está cerrado para siempre: seL4 (microkernel, matemáticamente probado
              correcto) corre hoy en sistemas donde una falla no es aceptable — aviónica, automóviles.
              Monolítico con módulos ganó la computación de propósito general; microkernel ganó donde
              una falla literalmente no puede pasar.
            </Caption>
          </Panel>
        </div>

        {/* XI. DISTRIBUCIONES */}
        <div id="sec-11" className={`lnx-section ${visible['sec-11'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="XI" title="DISTRIBUCIONES" sub="qué es el kernel y qué es la distro" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              "Linux" a secas es solo el kernel — un archivo que sabe administrar CPU, memoria y
              dispositivos, y nada más: sin él no hay ni siquiera una terminal donde escribir un comando.
              Una <strong style={{ color: '#fff' }}>distribución</strong> es ese mismo kernel más
              un criterio completo de decisiones: las herramientas GNU encima, un gestor de paquetes
              propio (<code>apt</code>/Debian, <code>dnf</code>/Fedora, <code>pacman</code>/Arch,{' '}
              <code>Portage</code>/Gentoo), un init (hoy, casi siempre systemd), y configuración por
              defecto. Debian (1993) es la raíz de toda una familia (Ubuntu, Linux Mint); Red Hat, de
              otra (Fedora, y lo que antes era CentOS); Arch Linux (2002) eligió el extremo opuesto a
              Debian: rolling release (actualizaciones continuas, nunca una "versión" fija) y configurar
              casi todo a mano.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              <strong style={{ color: '#fff' }}>Gentoo</strong> (2002) lleva la personalización un paso
              más allá: no instala binarios precompilados, compila cada paquete en tu propia máquina a
              partir del código fuente, con "USE flags" que vos elegís para activar o desactivar
              funcionalidades específicas de cada programa. <strong style={{ color: '#fff' }}>NixOS</strong>{' '}
              (2003 el gestor Nix, 2014 la distro) propone algo distinto de nuevo: todo el sistema se
              describe en un único archivo de configuración declarativo — no "instalás" paquetes
              imperativamente, describís el estado final que querés y Nix lo construye, con rollbacks
              atómicos reales si algo sale mal (cada configuración vieja queda completa, nunca se
              sobrescribe).
            </p>
            <Caption>
              El init (<strong style={{ color: '#fff' }}>systemd</strong>, escrito principalmente por
              Lennart Poettering desde 2010) es, en sí, un debate real y todavía abierto dentro de la
              comunidad: reemplazó scripts de arranque secuenciales por un arranque paralelo basado en
              unidades declarativas, con logging integrado (<code>journald</code>) — críticos reales
              (Gentoo y Slackware lo mantienen opcional; Devuan es un fork de Debian creado
              específicamente para no depender de él) argumentan que rompe la filosofía Unix de
              "herramientas pequeñas que hacen una cosa bien" al integrar demasiado en un solo binario.
            </Caption>
          </Panel>
        </div>

        {/* XII. CONSTRUIR EL TUYO */}
        <div id="sec-12" className={`lnx-section ${visible['sec-12'] ? 'is-visible' : ''}`} style={{ marginBottom: 0 }}>
          <SectionHeader roman="XII" title="CONSTRUIR EL TUYO" sub="de compilar tu kernel a un sistema operativo propio — y qué de NeoProxy ya se le parece" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Hay un camino real, con pasos concretos, de "usar Linux" a "tener tu propio sistema
              operativo" — ninguno exige escribir un kernel desde cero: <strong style={{ color: '#fff' }}>
              Linux From Scratch</strong> (LFS, Gerard Beekmans, desde 1999) es un libro-guía real que
              compila, a mano y en orden, cada componente de un sistema Linux funcional a partir de
              código fuente — el objetivo explícito del proyecto es entender cada pieza, no tener el
              sistema más rápido de instalar. Un paso más técnico todavía: compilar tu propio kernel
              (<code>make menuconfig</code> para elegir qué entra y qué no, <code>make && make
              modules_install && make install</code>) con tus propios parches aplicados encima —
              muchísima gente que hoy mantiene el kernel en serio empezó exactamente así, compilando el
              propio para una máquina real y leyendo qué rompía. El primer paso concreto para tocar
              código de kernel de verdad, no configuración, es escribir un{' '}
              <strong style={{ color: '#fff' }}>módulo cargable</strong> mínimo ("hello world" con{' '}
              <code>module_init</code>/<code>module_exit</code>, compilado contra los headers del kernel
              instalado, cargado con <code>insmod</code>) — un punto de entrada real y acotado, no una
              reescritura del sistema entero.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              NeoProxy ya se llama, en varias de sus propias páginas, "NeoProxy OS" — y la pregunta
              honesta es qué tan literal es eso hoy. Hay partes reales del paralelo:{' '}
              <code>Memory/hub.json</code> ya funciona como una tabla de procesos mínima — entradas por
              agente con un estado (<code>idle</code>), el mismo tipo de información que <code>ps</code>{' '}
              lee de <code>/proc</code>, aunque hoy sea un archivo estático, no un snapshot en vivo de
              algo corriendo de verdad. DarkProxy, en esa misma analogía, no es un proceso — es la cuenta
              root, el operador humano frente a la consola, nunca una entrada en la tabla de procesos.
              Metatron, descrito en el propio proyecto como "orquestador", es la pieza más parecida
              conceptualmente a PID 1: el único proceso con el rol explícito de supervisar al resto.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Lo que le falta de verdad para dejar de ser metáfora y ser un sistema operativo real son,
              con precisión, las mismas cuatro piezas de la sección IV: un scheduler real (algo que
              decida, en vivo, a qué agente le toca "correr" ahora, no un campo <code>idle</code> fijo en
              un JSON), aislamiento real entre agentes (el equivalente a namespaces — hoy nada le impide
              a la lógica de un agente tocar directamente el estado de otro), límites reales de recursos
              (el equivalente a cgroups), y syscalls reales (una interfaz única y auditable por la que
              cualquier agente tenga que pasar para pedir algo, en vez de acceso directo). La arquitectura
              de Mission/Intent/Pipeline/Event Bus que este mismo repositorio marca como visión futura (y
              explícitamente todavía sin construir) es, leída con este documento al lado, casi
              exactamente esa lista — lo cual no es casualidad: es la misma pregunta de ingeniería,
              resuelta primero por Unix y Linux hace cincuenta años, encontrada de nuevo acá por necesidad
              real, no por imitación.
            </p>
            <Caption>
              Esto no es una promesa de que NeoProxy "se va a convertir" en un kernel real — es la
              medida honesta de la distancia real que hay hoy entre la metáfora y el mecanismo, para que
              cualquier paso futuro en esa dirección se dé sabiendo exactamente qué de las cuatro piezas
              se está construyendo, en vez de solo sumar más nombres bonitos a un JSON.
            </Caption>
          </Panel>
        </div>
      </div>

      <style>{`
        .lnx-section { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .lnx-section.is-visible { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .lnx-section { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
