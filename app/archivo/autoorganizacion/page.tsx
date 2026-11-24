'use client'

// NPX-ARC-11 — AUTOORGANIZACIÓN
// Documento especial: los siete autores de abajo (Prigogine, Langton,
// Per Bak, Lorenz, Barabási, Erdős-Rényi, Kauffman) YA eran entradas
// reales de components/knowledge/entries.ts (cluster 'autoorganizacion')
// sembradas sin que ningún documento de archivo los agrupara. Y tres de
// sus ideas no son teoría abstracta en este sitio: corren en código real
// hoy mismo (/lab/atractores, components/SandpileField.tsx,
// /proxyverse/topologia). Este documento no propone nada nuevo -- junta
// lo que ya estaba sembrado y documenta lo que ya está en pantalla.
// Acento propio: rojo vivo #e63946, distinto de los 19 ya usados en el
// resto del Codex (ni el oxblood de Grimorios #8b1538, ni el naranja de
// Metacognición #ff7a3d, ni ningún otro tono de rojo/naranja/dorado ya
// asignado).

import { useEffect, useState } from 'react'
import Link from 'next/link'

const mono = "'Space Mono', monospace"
const ACCENT = '#e63946'
const TEXT = '#f5e4e4'
const TEXT_DIM = '#c9a4a4'
const LABEL_DIM = '#8a5050'

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(14, 4, 4, 0.55)',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 4,
        boxShadow: `0 0 28px ${ACCENT}11, inset 0 0 40px rgba(230,57,70,0.03)`,
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
        <h2
          style={{
            fontSize: 'clamp(18px, 3vw, 24px)',
            letterSpacing: 5,
            color: ACCENT,
            textShadow: `0 0 24px ${ACCENT}44`,
            margin: 0,
          }}
        >
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
  ['I', 'sec-01', 'Qué es la autoorganización'],
  ['II', 'sec-02', 'Prigogine — estructuras disipativas'],
  ['III', 'sec-03', 'Criticalidad autoorganizada — la pila de arena'],
  ['IV', 'sec-04', 'El atractor extraño — Lorenz'],
  ['V', 'sec-05', 'Vida artificial y autómatas celulares'],
  ['VI', 'sec-06', 'Redes libres de escala — Barabási'],
  ['VII', 'sec-07', 'Kauffman y las redes booleanas'],
  ['VIII', 'sec-08', 'Resonancia con NeoProxy'],
]

export default function AutoorganizacionPage() {
  const [visible, setVisible] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.auo-section'))
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
    <div style={{ background: '#070202', minHeight: '100vh', fontFamily: mono, color: TEXT, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '100px 24px 140px' }}>
        <Link href="/knowledge" className="press" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${ACCENT}aa`, textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← VOLVER AL CODEX
        </Link>

        {/* encabezado */}
        <div style={{ marginBottom: 90 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${ACCENT}66`, marginBottom: 16 }}>
            NPX-ARC-11 // REFERENCIA TÉCNICA
          </div>
          <h1
            style={{
              fontSize: 'clamp(28px, 6vw, 42px)',
              fontWeight: 700,
              letterSpacing: 6,
              color: ACCENT,
              textShadow: `0 0 40px ${ACCENT}55`,
              marginBottom: 14,
              lineHeight: 1.1,
            }}
          >
            AUTOORGANIZACIÓN
          </h1>
          <div style={{ fontSize: 12, letterSpacing: 3, color: TEXT_DIM, marginBottom: 32 }}>
            ORDEN SIN DISEÑADOR — DE LA PILA DE ARENA A LA RED QUE SE ARMA SOLA
          </div>
          <p
            style={{
              fontSize: 11.5, lineHeight: 2.1, letterSpacing: 0.3, color: TEXT_DIM, maxWidth: 660,
              borderLeft: `1px solid ${ACCENT}33`, paddingLeft: 24, marginBottom: 32,
            }}
          >
            Siete nombres que ya estaban sembrados en este Codex, sin documento propio que los
            agrupara — y tres ideas que no son teoría abstracta acá: corren en código real, ahora
            mismo, en tres lugares distintos del sitio.
          </p>

          <div
            style={{
              display: 'inline-grid', gridTemplateColumns: 'auto auto', gap: '4px 24px', fontSize: 9,
              letterSpacing: 1, color: `${ACCENT}99`, border: `1px solid ${ACCENT}33`, padding: '12px 18px',
              marginBottom: 32,
            }}
          >
            <span style={{ color: `${ACCENT}55` }}>CLASIFICACIÓN</span><span style={{ color: TEXT }}>TERMODINÁMICA, SISTEMAS DINÁMICOS, TEORÍA DE REDES — REFERENCIA TÉCNICA</span>
            <span style={{ color: `${ACCENT}55` }}>REVISIÓN</span><span style={{ color: TEXT }}>01 — 8 SECCIONES</span>
            <span style={{ color: `${ACCENT}55` }}>ALCANCE</span><span style={{ color: TEXT }}>ESTRUCTURAS DISIPATIVAS → CRITICALIDAD → CAOS → VIDA ARTIFICIAL → REDES</span>
          </div>

          <nav style={{ border: `1px solid ${ACCENT}22`, padding: '20px 24px', maxWidth: 680 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}66`, marginBottom: 14 }}>
              ÍNDICE
            </div>
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

        {/* I. QUE ES LA AUTOORGANIZACION */}
        <div id="sec-01" className={`auo-section ${visible['sec-01'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="I" title="QUÉ ES LA AUTOORGANIZACIÓN" sub="orden que emerge sin que nadie lo diseñe" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Un patrón global —una ola de tráfico, una avalancha, una red con pocos nodos muy
              conectados— puede aparecer solo a partir de interacciones locales simples, repetidas
              muchísimas veces, sin ningún plano central ni ninguna parte individual que "sepa" del
              patrón que está generando entre todas. No hace falta un diseñador: hace falta la
              cantidad y la repetición correctas. Las siguientes secciones son siete formas distintas,
              verificadas por separado, en las que esto pasa de verdad.
            </p>
          </Panel>
        </div>

        {/* II. PRIGOGINE */}
        <div id="sec-02" className={`auo-section ${visible['sec-02'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="II" title="PRIGOGINE — ESTRUCTURAS DISIPATIVAS" sub="Premio Nobel de Química, 1977" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <Link href="/knowledge?entry=prigogine" style={{ color: '#fff', textDecoration: 'underline' }}>
                Ilya Prigogine
              </Link>
              , químico, mostró que un sistema abierto —que intercambia materia o energía con su
              entorno— lejos del equilibrio termodinámico puede generar espontáneamente{' '}
              <strong style={{ color: '#fff' }}>orden</strong> en vez de desorden, siempre que siga
              disipando energía para mantenerlo. Es lo contrario de lo que la intuición sobre la
              entropía sugiere a primera vista: el desorden del entorno es, literalmente, el precio
              que paga el orden local para existir.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              El ejemplo real y visible en un laboratorio es la{' '}
              <strong style={{ color: '#fff' }}>reacción de Belousov-Zhabotinsky</strong>: una mezcla
              química que, lejos del equilibrio, no se estabiliza en un color uniforme sino que forma
              anillos y espirales de color que oscilan solos, sin que nadie los agite a propósito. Por
              este trabajo ganó el Premio Nobel de Química en 1977.
            </p>
          </Panel>
        </div>

        {/* III. CRITICALIDAD AUTOORGANIZADA */}
        <div id="sec-03" className={`auo-section ${visible['sec-03'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="III" title="CRITICALIDAD AUTOORGANIZADA — LA PILA DE ARENA" sub="Bak, Tang y Wiesenfeld, 1987" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <Link href="/knowledge?entry=perbak" style={{ color: '#fff', textDecoration: 'underline' }}>
                Per Bak
              </Link>
              , con Chao Tang y Kurt Wiesenfeld, publicó en 1987 "Self-organized criticality" con el
              modelo que le dio nombre al campo: una pila de arena a la que se le agrega grano por
              grano. La pila se empuja sola, sin intervención externa, hacia un punto crítico donde
              ocurren avalanchas de tamaños muy variados —la mayoría chicas, pocas enormes— y la
              distribución de esos tamaños sigue una <strong style={{ color: '#fff' }}>ley de
              potencia</strong>: no hay una escala "típica" de avalancha, como sí la habría si fueran
              puramente al azar.
            </p>
            <Caption>
              Esto no es solo historia: corre ambientalmente en todo este sitio, en{' '}
              <span style={{ color: '#fff' }}>components/SandpileField.tsx</span>. Cada mensaje real
              que cualquiera manda por el chat global es un grano; cuando se acumulan lo suficiente, se
              suelta una avalancha visible, sin que nadie la dispare a propósito — el mismo mecanismo
              de Bak, alimentado por actividad real del sitio en vez de arena.
            </Caption>
          </Panel>
        </div>

        {/* IV. LORENZ */}
        <div id="sec-04" className={`auo-section ${visible['sec-04'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="IV" title="EL ATRACTOR EXTRAÑO" sub="Edward Lorenz, MIT, 1963" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <Link href="/knowledge?entry=lorenz" style={{ color: '#fff', textDecoration: 'underline' }}>
                Edward Lorenz
              </Link>
              , meteorólogo, publicó en 1963 "Deterministic Nonperiodic Flow": un sistema de
              ecuaciones sin ningún término al azar —completamente determinista— que de todos modos es
              imposible de predecir a largo plazo, porque una diferencia minúscula en el punto de
              partida termina produciendo trayectorias completamente distintas. De ahí sale el "efecto
              mariposa", frase que él mismo popularizó.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              El <strong style={{ color: '#fff' }}>atractor de Lorenz</strong> es la forma geométrica
              real que trazan esas trayectorias cuando se las grafica: una silueta parecida a un par de
              alas de mariposa. Las trayectorias nunca se repiten exactamente ni se cruzan dos veces
              por el mismo punto, pero tampoco escapan nunca de esa región acotada del espacio —caos
              real, sin ser aleatorio, sin ser infinito.
            </p>
            <Caption>
              Se puede ver y manipular en vivo en{' '}
              <Link href="/lab/atractores" style={{ color: '#fff', textDecoration: 'underline' }}>
                /lab/atractores
              </Link>
              , con selector de algoritmo y render en Babylon.js — no es una ilustración, es la
              ecuación real corriendo.
            </Caption>
          </Panel>
        </div>

        {/* V. VIDA ARTIFICIAL */}
        <div id="sec-05" className={`auo-section ${visible['sec-05'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="V" title="VIDA ARTIFICIAL Y AUTÓMATAS CELULARES" sub="Langton, 1986 — Conway, 1970" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              <Link href="/knowledge?entry=langton" style={{ color: '#fff', textDecoration: 'underline' }}>
                Christopher Langton
              </Link>{' '}
              acuñó el término <strong style={{ color: '#fff' }}>vida artificial</strong> en 1986: el
              estudio de sistemas hechos por humanos (no biológicos) que exhiben comportamientos
              propios de lo vivo —reproducirse, adaptarse, evolucionar— a partir de reglas simples.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              El ejemplo más citado del campo es el <strong style={{ color: '#fff' }}>Juego de la
              Vida</strong> de John Conway (1970): una grilla donde cada celda vive o muere según
              cuatro reglas triviales sobre sus vecinas. De esas cuatro reglas salen patrones que se
              desplazan solos, osciladores estables, y —se demostró formalmente— suficiente capacidad
              para construir una computadora universal adentro de la propia grilla.
            </p>
          </Panel>
        </div>

        {/* VI. REDES LIBRES DE ESCALA */}
        <div id="sec-06" className={`auo-section ${visible['sec-06'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VI" title="REDES LIBRES DE ESCALA" sub="Barabási y Albert, 1999 — contra el modelo de Erdős-Rényi, 1959" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0, marginBottom: 16 }}>
              Paul Erdős y Alfréd Rényi propusieron en 1959 un modelo donde las conexiones entre nodos
              de una red se trazan puramente al azar — útil como base matemática, pero las redes
              reales no se parecen a eso.{' '}
              <Link href="/knowledge?entry=barabasi" style={{ color: '#fff', textDecoration: 'underline' }}>
                Albert-László Barabási
              </Link>{' '}
              y Réka Albert mostraron en 1999 ("Emergence of scaling in random networks") que internet,
              las redes sociales y las redes de interacción de proteínas crecen por{' '}
              <strong style={{ color: '#fff' }}>conexión preferencial</strong>: un nodo nuevo tiende a
              conectarse con los nodos que ya tienen más conexiones, no al azar entre todos.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Eso produce, con el tiempo, unos pocos{' '}
              <Link href="/knowledge?entry=erdos-renyi" style={{ color: '#fff', textDecoration: 'underline' }}>
                hubs
              </Link>{' '}
              gigantes y muchísimos nodos con pocas conexiones —una distribución de grado en ley de
              potencia, "libre de escala"— muy distinta de la campana uniforme que predice el modelo
              puramente aleatorio de 1959.
            </p>
            <Caption>
              Esta red exacta, armándose nodo a nodo, se puede ver en vivo en{' '}
              <Link href="/proxyverse/topologia" style={{ color: '#fff', textDecoration: 'underline' }}>
                /proxyverse/topologia
              </Link>
              .
            </Caption>
          </Panel>
        </div>

        {/* VII. KAUFFMAN */}
        <div id="sec-07" className={`auo-section ${visible['sec-07'] ? 'is-visible' : ''}`} style={{ marginBottom: 90 }}>
          <SectionHeader roman="VII" title="KAUFFMAN Y LAS REDES BOOLEANAS" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              <Link href="/knowledge?entry=kauffman" style={{ color: '#fff', textDecoration: 'underline' }}>
                Stuart Kauffman
              </Link>{' '}
              modeló redes genéticas reguladoras como circuitos booleanos simples: cada gen, un
              interruptor on/off que depende del estado de unos pocos otros genes vecinos. Encontró
              que, aun con miles de genes posibles y una cantidad astronómica de configuraciones
              iniciales, ciertas redes caen de forma espontánea en ciclos estables y relativamente
              cortos —orden real emergiendo de un sistema que, mirado de afuera, parecería demasiado
              complejo para estabilizarse solo.
            </p>
          </Panel>
        </div>

        {/* VIII. RESONANCIA */}
        <div id="sec-08" className={`auo-section ${visible['sec-08'] ? 'is-visible' : ''}`} style={{ marginBottom: 0 }}>
          <SectionHeader roman="VIII" title="RESONANCIA CON NEOPROXY" />
          <Panel>
            <p style={{ fontSize: 11.5, lineHeight: 2, color: TEXT_DIM, margin: 0 }}>
              Los siete nombres de este documento ya estaban en el Codex, sembrados en{' '}
              <span style={{ color: '#fff' }}>components/knowledge/entries.ts</span> desde antes de que
              existiera esta página, sin que nada los agrupara. Tres de sus ideas, mientras tanto, no
              esperaron a tener un documento: ya corren en código real, ahora mismo, en tres lugares
              distintos de este sitio. Este documento no agrega una idea nueva al Codex — junta lo que
              ya estaba y señala dónde ya se puede ver andando.
            </p>
          </Panel>
        </div>

        {/* footer */}
        <div style={{ marginTop: 100, paddingTop: 28, borderTop: `1px solid ${ACCENT}22` }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}44` }}>
            NPX-ARC-11 // REFERENCIA TÉCNICA DEL CODEX
          </div>
        </div>
      </div>

      <style>{`
        .auo-section { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .auo-section.is-visible { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .auo-section { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
