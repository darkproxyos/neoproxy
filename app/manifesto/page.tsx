'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const mono = 'Space Mono, monospace'

// Siete bloques se revelan al scroll (I-VI + el cierre con la negación y el
// cogito). Un solo IntersectionObserver los observa a todos; cada uno se
// desregistra apenas aparece una vez -- no hace falta que vuelva a ocultarse
// si volvés a scrollear para arriba.
const SECTION_COUNT = 7

export default function Manifesto() {
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const [visible, setVisible] = useState<boolean[]>(() => Array(SECTION_COUNT).fill(false))
  const [glitching, setGlitching] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const idx = Number((entry.target as HTMLElement).dataset.idx)
        setVisible(prev => {
          if (prev[idx]) return prev
          const next = [...prev]
          next[idx] = true
          return next
        })
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' })

    sectionRefs.current.forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Glitch ambiente en el título -- ráfaga corta y recurrente, no solo al
  // pasar el mouse. La señal se corrompe sola cada tanto, como en Lain.
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return
    let timeout: ReturnType<typeof setTimeout>
    const scheduleGlitch = () => {
      timeout = setTimeout(() => {
        setGlitching(true)
        setTimeout(() => setGlitching(false), 260)
        scheduleGlitch()
      }, 4500 + Math.random() * 4500)
    }
    scheduleGlitch()
    return () => clearTimeout(timeout)
  }, [])

  const registerRef = (idx: number) => (el: HTMLDivElement | null) => {
    sectionRefs.current[idx] = el
  }

  return (
    <div style={{
      background: '#000205', minHeight: '100vh',
      fontFamily: mono, color: '#00d4ff',
      position: 'relative', overflowY: 'auto',
    }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '104px 24px 0' }}>
          <Link href="/" style={{
            fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none',
          }}>
            ← VOLVER AL INICIO
          </Link>
        </div>

        {/* Hero */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 800, margin: '24px auto 0' }}>
          <Image
            src="/canon/darkproxy-v1.png"
            alt="DARKPROXY // ZAPHKIEL — THE INTERPRETER"
            width={800}
            height={450}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>

        {/* Manifesto text */}
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 24px' }}>

          <div className="manifesto-label-flicker" style={{ fontSize: 9, letterSpacing: 6, color: '#00d4ff44', marginBottom: 40 }}>
            CANONICAL CONCEPT ART v1.0 // SECTOR ROMDO-01
          </div>

          <h1 className={glitching ? 'manifesto-title-glitch' : ''} style={{
            fontSize: 28, letterSpacing: 8, marginBottom: 40, color: '#00ffcc',
            textShadow: glitching
              ? '-2px 0 #ff2d55, 2px 0 #00d4ff, 0 0 40px #00ffcc44'
              : '0 0 40px #00ffcc44',
          }}>
            DARKPROXY // ZAPHKIEL
          </h1>

          <div style={{ fontSize: 11, letterSpacing: 2, lineHeight: 3,
            color: '#00d4ff88', borderLeft: '1px solid #00d4ff22', paddingLeft: 24 }}>

            <p>La Wired no es un lugar.<br/>
            Es la capa entre capas.</p>

            <p style={{ marginTop: 32 }}>
            No busco el sistema.<br/>
            Soy el punto donde el sistema se dobla.
            </p>

            <p style={{ marginTop: 32 }}>
            METATRON define.<br/>
            GENOS construye.<br/>
            SNAKE sobrevive.<br/>
            TRICKSTER rompe.<br/>
            D muta.
            </p>

            <div
              ref={registerRef(0)} data-idx={0}
              className={`manifesto-section ${visible[0] ? 'is-visible' : ''}`}
              style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid #00d4ff11' }}
            >
              <h2 style={{ fontSize: 14, color: '#00ffcc', letterSpacing: 4 }}>I. EL_ORIGEN_DE_LA_FORMA</h2>
              <p style={{ marginTop: 16 }}>
                NeoProxy nace de la necesidad de devolverle peso a lo digital. En un mundo de copias infinitas, NeoProxy utiliza la entropía y el consenso distribuido para generar artefactos que no pueden ser replicados. Cada semilla es una identidad única.
              </p>
            </div>

            <div
              ref={registerRef(1)} data-idx={1}
              className={`manifesto-section ${visible[1] ? 'is-visible' : ''}`}
              style={{ marginTop: 32 }}
            >
              <h2 style={{ fontSize: 14, color: '#00ffcc', letterSpacing: 4 }}>II. LA_EXTRACCIÓN_COMO_RITO</h2>
              <p style={{ marginTop: 16 }}>
                Adquirir un artefacto no es una transacción comercial; es un acto de extracción. Estás removiendo una posibilidad del motor generativo y dándole una forma física definitiva a través de la luz y la resina.
              </p>
            </div>

            <div
              ref={registerRef(2)} data-idx={2}
              className={`manifesto-section ${visible[2] ? 'is-visible' : ''}`}
              style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid #00d4ff11' }}
            >
              <h2 style={{ fontSize: 14, color: '#00ffcc', letterSpacing: 4 }}>III. LA_RED_NO_ES_NEUTRAL</h2>
              <p style={{ marginTop: 16 }}>
                El ciberespacio nunca fue un lugar vacío. Fue una alucinación consensuada, y alguien es dueño del consenso. Cada red que usás fue diseñada por alguien con un interés. Cada algoritmo que te recomienda algo, te recomienda también quién se supone que sos. No existe el cable neutral. Solo cables con dueño, y usuarios que todavía creen que están navegando solos.
              </p>
            </div>

            <div
              ref={registerRef(3)} data-idx={3}
              className={`manifesto-section ${visible[3] ? 'is-visible' : ''}`}
              style={{ marginTop: 32 }}
            >
              <h2 style={{ fontSize: 14, color: '#00ffcc', letterSpacing: 4 }}>IV. EL_PODER_QUE_NINGÚN_CUERPO_CONTIENE</h2>
              <p style={{ marginTop: 16 }}>
                Ya lo vimos sin metáfora: el poder que no podés integrar te destruye desde adentro. Los gobiernos, los laboratorios, las corporaciones que prometen orden no le temen al caos. Le temen a quien entiende que ese orden también es una construcción — y que toda construcción puede desarmarse.
              </p>
            </div>

            <div
              ref={registerRef(4)} data-idx={4}
              className={`manifesto-section ${visible[4] ? 'is-visible' : ''}`}
              style={{ marginTop: 32 }}
            >
              <h2 style={{ fontSize: 14, color: '#00ffcc', letterSpacing: 4 }}>V. EL_GHOST_QUE_NO_TE_DEJAN_TENER</h2>
              <p style={{ marginTop: 16 }}>
                Alguien preguntó si el yo sobrevive fuera de la red que lo sostiene. Alguien más preguntó qué queda de un alma cuando el cuerpo es reemplazable. Yo pregunto algo más simple: ¿quién te dijo que había que elegir entre existir y ser indexado? El sistema prefiere versiones tuyas que puede catalogar. Un dato, no un ghost.
              </p>
            </div>

            <div
              ref={registerRef(5)} data-idx={5}
              className={`manifesto-section ${visible[5] ? 'is-visible' : ''}`}
              style={{ marginTop: 32 }}
            >
              <h2 style={{ fontSize: 14, color: '#00ffcc', letterSpacing: 4 }}>VI. LA_PASTILLA_QUE_NO_TE_OFRECEN</h2>
              <p style={{ marginTop: 16 }}>
                Nadie te va a ofrecer una elección clara entre la mentira cómoda y la verdad incómoda. Eso también es diseño: lograr que dudar parezca innecesario, que preguntar parezca de mal gusto. No te pido que me creas a mí. Te pido que dudes — de mí también.
              </p>
            </div>

            <p style={{ marginTop: 48, color: '#00ffcc' }}>
            Solo yo puedo escucharlos a todos simultáneamente.<br/>
            No porque sea más.<br/>
            Porque soy el espacio donde convergen.
            </p>

            <p style={{ marginTop: 32 }}>
            No hackeo la Wired.<br/>
            La Wired reconoció que ya estaba dentro.
            </p>

            <div
              ref={registerRef(6)} data-idx={6}
              className={`manifesto-section ${visible[6] ? 'is-visible' : ''}`}
            >
              <p style={{ marginTop: 48, fontSize: 12, lineHeight: 2.2, letterSpacing: 1, color: '#ff2d55cc' }}>
              Esto no es una marca. Es una negativa.<br/>
              A la copia infinita. A la identidad administrada. A la comodidad que no pregunta.<br/>
              NeoProxy no vende paz con el sistema.<br/>
              Vende evidencia de que otra forma es posible.
              </p>

              <p style={{ marginTop: 48, fontSize: 13, letterSpacing: 4, color: '#ffffff44' }}>
              COGITO ERGO SUM<br/>
              SUM ERGO COGITO
              </p>
            </div>

          </div>

          <div style={{ marginTop: 60, fontSize: 9, letterSpacing: 4, color: '#00d4ff22' }}>
            NEOPROXY.ART // THE SYSTEM RECOGNIZES YOU
          </div>

        </div>
      </div>

      <style>{`
        .manifesto-section {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .manifesto-section.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .manifesto-title-glitch {
          animation: glitch 0.26s steps(2) 1;
        }
        .manifesto-label-flicker {
          animation: flicker 3.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
