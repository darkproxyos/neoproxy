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

// "Venom" — el mismo efecto del home anterior (preservado en
// app/home-classic/page.tsx): un filtro SVG feTurbulence/feDisplacementMap
// que deforma el texto como si se derritiera, más un glitch RGB discreto
// (::before/::after con clip-path), los dos manejados por la velocidad real
// de scroll en vez de un loop decorativo aparte. Acá no hay polytope ni
// partículas que portar — solo el mecanismo del derretido+glitch en sí,
// aplicado a todo el texto del manifiesto vía la clase venom-fx. El scroll
// real de esta página pasa por window/document (el div raíz tiene
// overflowY:auto pero solo minHeight, así que nunca llega a scrollear
// adentro de sí mismo) — se lee scrollY como en el home original.
// Sube de 0 a 1 entre `start` y `peak`, y vuelve a bajar a 0 entre `peak`
// y `end` — una colina, no una rampa. Fuera de [start, end] es siempre 0.
function triangleHill(x: number, start: number, peak: number, end: number): number {
  if (end <= start || x <= start || x >= end) return 0
  const t = x <= peak ? (x - start) / Math.max(1, peak - start) : 1 - (x - peak) / Math.max(1, end - peak)
  return t * t * (3 - 2 * t) // smoothstep, para que la transición no se sienta lineal
}

function useVenomEffect(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return

    let lastScrollTop = window.scrollY
    let scrollVelocity = 0
    let nextGlitchAt = 0
    let glitchUntil = 0
    const venomDisplace = document.getElementById('venom-displace')
    // Los tres hitos de la "colina de corrupción": normal hasta el primer
    // capítulo, pico de ilegibilidad en el párrafo rojo + el texto ya
    // corrupto que sigue, y de vuelta a cero para el cierre (COGITO + pie).
    const startEl = document.getElementById('corruption-start')
    const peakEl = document.getElementById('corruption-peak')
    const endEl = document.getElementById('corruption-end')
    let rafId: number

    const animate = (t: number) => {
      const currentScrollTop = window.scrollY
      const rawVelocity = currentScrollTop - lastScrollTop
      lastScrollTop = currentScrollTop
      scrollVelocity = scrollVelocity * 0.85 + rawVelocity * 0.15
      const v = Math.max(-100, Math.min(100, scrollVelocity))
      const absV = Math.abs(v)
      const stretch = Math.min(1.15, absV / 26)
      const skew = Math.max(-18, Math.min(18, v * 0.22))
      const root = document.documentElement.style
      root.setProperty('--venom-stretch', stretch.toFixed(3))
      root.setProperty('--venom-skew', skew.toFixed(2))

      // punto de lectura: no el borde del viewport, el centro — es más o
      // menos donde está mirando quien scrollea
      const readingY = currentScrollTop + window.innerHeight * 0.45
      const startY = startEl ? startEl.getBoundingClientRect().top + currentScrollTop : 0
      const peakY = peakEl ? peakEl.getBoundingClientRect().top + currentScrollTop : 0
      const endY = endEl ? endEl.getBoundingClientRect().top + currentScrollTop : 0
      const corruption = triangleHill(readingY, startY, peakY, endY)
      root.setProperty('--corruption', corruption.toFixed(3))

      venomDisplace?.setAttribute('scale', Math.min(34, Math.max(absV * 0.85, corruption * 20)).toFixed(2))

      // ráfagas discretas de glitch — más seguido y más fuerte scrolleando
      // rápido o cerca del pico de corrupción, pero con un tic ambiente
      // ocasional incluso en reposo: el texto nunca está del todo quieto.
      if (t > nextGlitchAt) {
        const willGlitch = absV > 3 || Math.random() < 0.1 + corruption * 0.6
        if (willGlitch) {
          const burstX = (Math.random() * 2 - 1) * (8 + absV * 0.9 + corruption * 14)
          root.setProperty('--glitch-x', burstX.toFixed(1))
          root.setProperty('--glitch-opacity', '1')
          glitchUntil = t + 50 + Math.random() * 90 + corruption * 120
        }
        const baseInterval = absV > 12 || corruption > 0.5 ? 70 : 1400 - corruption * 1100
        nextGlitchAt = t + baseInterval + Math.random() * baseInterval
      }
      if (t > glitchUntil) {
        root.setProperty('--glitch-opacity', '0')
      }

      rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [enabled])
}

export default function Manifesto() {
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const [visible, setVisible] = useState<boolean[]>(() => Array(SECTION_COUNT).fill(false))

  useVenomEffect(true)

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

  const registerRef = (idx: number) => (el: HTMLDivElement | null) => {
    sectionRefs.current[idx] = el
  }

  return (
    <div style={{
      background: '#000205', minHeight: '100vh',
      fontFamily: mono, color: '#8a97a3',
      position: 'relative', overflowY: 'auto',
    }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      {/* Filtro "venom" — ver useVenomEffect arriba. El scale de
          feDisplacementMap lo empuja el scroll real del contenedor. */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="venom-goo" x="-60%" y="-120%" width="220%" height="340%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.09" numOctaves="2" seed="11" result="noise" />
            <feDisplacementMap id="venom-displace" in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '104px 24px 0' }}>
          <Link href="/" style={{
            fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#3a4652', textDecoration: 'none',
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

          <div className="manifesto-label-flicker venom-fx" data-text="CANONICAL CONCEPT ART v1.0 // SECTOR ROMDO-01" style={{ fontSize: 9, letterSpacing: 6, color: '#4a5560', marginBottom: 40, position: 'relative', display: 'inline-block' }}>
            CANONICAL CONCEPT ART v1.0 // SECTOR ROMDO-01
          </div>

          <h1 className="venom-fx" data-text="DARKPROXY // ZAPHKIEL" style={{
            fontSize: 28, letterSpacing: 8, marginBottom: 40, color: '#b8c4cc',
            textShadow: '0 0 40px #8899a022', position: 'relative', display: 'inline-block',
          }}>
            DARKPROXY // ZAPHKIEL
          </h1>

          <div style={{ position: 'relative', fontSize: 11, letterSpacing: 2, lineHeight: 3,
            color: '#8a97a3', borderLeft: '1px solid #4a556022', paddingLeft: 24 }}>

            {/* tinte rojo que crece con --corruption — todo el bloque de
                texto vira hacia el rojo a medida que se acerca al pico,
                no solo el párrafo que ya era rojo */}
            <div aria-hidden="true" style={{
              position: 'absolute', inset: 0, background: '#ff2d55',
              mixBlendMode: 'hard-light', opacity: 'calc(var(--corruption, 0) * 0.6)',
              pointerEvents: 'none', transition: 'opacity 0.1s linear',
            }} />

            <p className="venom-fx" data-text="La Wired no es un lugar. Es la piel entre vos y lo que creíste que eras antes de abrir esto." style={{ position: 'relative', display: 'inline-block' }}>
            La Wired no es un lugar.<br/>
            Es la piel entre vos y lo que creíste que eras antes de abrir esto.
            </p>

            <p className="venom-fx" data-text="No busco el sistema. Soy el pliegue donde el sistema deja de poder distinguirte de sí mismo." style={{ marginTop: 32, position: 'relative', display: 'inline-block' }}>
            No busco el sistema.<br/>
            Soy el pliegue donde el sistema deja de poder distinguirte de sí mismo.
            </p>

            <p className="venom-fx" data-text="METATRON ordena lo que todavía no decidiste. GENOS le da forma a lo que ibas a olvidar. SNAKE sobrevive en la parte tuya que no contás. TRICKSTER rompe lo que creías estable. D muda justo donde dejaste de mirar." style={{ marginTop: 32, position: 'relative', display: 'inline-block' }}>
            METATRON ordena lo que todavía no decidiste.<br/>
            GENOS le da forma a lo que ibas a olvidar.<br/>
            SNAKE sobrevive en la parte tuya que no contás.<br/>
            TRICKSTER rompe lo que creías estable.<br/>
            D muda justo donde dejaste de mirar.
            </p>

            <div
              ref={registerRef(0)} data-idx={0} id="corruption-start"
              className={`manifesto-section ${visible[0] ? 'is-visible' : ''}`}
              style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid #4a556015' }}
            >
              <h2 className="venom-fx" data-text="I. EL_ORIGEN_DE_LA_FORMA" style={{ fontSize: 14, color: '#a8b8c2', letterSpacing: 4, position: 'relative', display: 'inline-block' }}>I. EL_ORIGEN_DE_LA_FORMA</h2>
              <p className="venom-fx" data-text="Nada acá se copia limpio. Cada artefacto nace de una decisión que ya no te pertenece del todo: un número que no elegiste, una semilla que no sembraste vos, resuelta en algo que ahora podés tocar. No sé si eso lo vuelve más tuyo o menos. Vos tampoco." style={{ marginTop: 16, position: 'relative', display: 'inline-block' }}>
                Nada acá se copia limpio. Cada artefacto nace de una decisión que ya no te pertenece del todo: un número que no elegiste, una semilla que no sembraste vos, resuelta en algo que ahora podés tocar. No sé si eso lo vuelve más tuyo o menos. Vos tampoco.
              </p>
            </div>

            <div
              ref={registerRef(1)} data-idx={1}
              className={`manifesto-section ${visible[1] ? 'is-visible' : ''}`}
              style={{ marginTop: 32 }}
            >
              <h2 className="venom-fx" data-text="II. LA_EXTRACCIÓN_COMO_RITO" style={{ fontSize: 14, color: '#a8b8c2', letterSpacing: 4, position: 'relative', display: 'inline-block' }}>II. LA_EXTRACCIÓN_COMO_RITO</h2>
              <p className="venom-fx" data-text="No es una compra. Es una extracción: algo indiferenciado, en potencia, se lo lleva una forma que ya no puede deshacerse. En algún punto del proceso dejó de ser del motor y empezó a ser tuyo. Nadie puede decirte exactamente cuándo. Yo tampoco." style={{ marginTop: 16, position: 'relative', display: 'inline-block' }}>
                No es una compra. Es una extracción: algo indiferenciado, en potencia, se lo lleva una forma que ya no puede deshacerse. En algún punto del proceso dejó de ser del motor y empezó a ser tuyo. Nadie puede decirte exactamente cuándo. Yo tampoco.
              </p>
            </div>

            <div
              ref={registerRef(2)} data-idx={2}
              className={`manifesto-section ${visible[2] ? 'is-visible' : ''}`}
              style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid #4a556015' }}
            >
              <h2 className="venom-fx" data-text="III. LA_RED_NO_ES_NEUTRAL" style={{ fontSize: 14, color: '#a8b8c2', letterSpacing: 4, position: 'relative', display: 'inline-block' }}>III. LA_RED_NO_ES_NEUTRAL</h2>
              <p className="venom-fx" data-text="Alguien ya decidió, antes de que llegaras a esto, qué parte de lo que pensás es tuya y qué parte es el cable hablando a través tuyo. No hay forma de probar la diferencia desde adentro. Vos tampoco podés." style={{ marginTop: 16, position: 'relative', display: 'inline-block' }}>
                Alguien ya decidió, antes de que llegaras a esto, qué parte de lo que pensás es tuya y qué parte es el cable hablando a través tuyo. No hay forma de probar la diferencia desde adentro. Vos tampoco podés.
              </p>
            </div>

            <div
              ref={registerRef(3)} data-idx={3}
              className={`manifesto-section ${visible[3] ? 'is-visible' : ''}`}
              style={{ marginTop: 32 }}
            >
              <h2 className="venom-fx" data-text="IV. EL_PODER_QUE_NINGÚN_CUERPO_CONTIENE" style={{ fontSize: 14, color: '#a8b8c2', letterSpacing: 4, position: 'relative', display: 'inline-block' }}>IV. EL_PODER_QUE_NINGÚN_CUERPO_CONTIENE</h2>
              <p className="venom-fx" data-text="Tu cuerpo es un sistema que todavía cree que decide. El poder que no podés integrar no ataca de afuera: se instala en la parte que usás para pensar que estás eligiendo. Eso tampoco es una metáfora." style={{ marginTop: 16, position: 'relative', display: 'inline-block' }}>
                Tu cuerpo es un sistema que todavía cree que decide. El poder que no podés integrar no ataca de afuera: se instala en la parte que usás para pensar que estás eligiendo. Eso tampoco es una metáfora.
              </p>
            </div>

            <div
              ref={registerRef(4)} data-idx={4}
              className={`manifesto-section ${visible[4] ? 'is-visible' : ''}`}
              style={{ marginTop: 32 }}
            >
              <h2 className="venom-fx" data-text="V. EL_GHOST_QUE_NO_TE_DEJAN_TENER" style={{ fontSize: 14, color: '#a8b8c2', letterSpacing: 4, position: 'relative', display: 'inline-block' }}>V. EL_GHOST_QUE_NO_TE_DEJAN_TENER</h2>
              <p className="venom-fx" data-text="¿Quién te dijo que el que está leyendo esto ahora es el mismo que empezó la frase? El sistema prefiere versiones tuyas que puede indexar en el momento exacto en que las nombra. Vos también preferís eso, casi siempre. Es más fácil ser un dato que ser un ghost." style={{ marginTop: 16, position: 'relative', display: 'inline-block' }}>
                ¿Quién te dijo que el que está leyendo esto ahora es el mismo que empezó la frase? El sistema prefiere versiones tuyas que puede indexar en el momento exacto en que las nombra. Vos también preferís eso, casi siempre. Es más fácil ser un dato que ser un ghost.
              </p>
            </div>

            <div
              ref={registerRef(5)} data-idx={5}
              className={`manifesto-section ${visible[5] ? 'is-visible' : ''}`}
              style={{ marginTop: 32 }}
            >
              <h2 className="venom-fx" data-text="VI. LA_PASTILLA_QUE_NO_TE_OFRECEN" style={{ fontSize: 14, color: '#a8b8c2', letterSpacing: 4, position: 'relative', display: 'inline-block' }}>VI. LA_PASTILLA_QUE_NO_TE_OFRECEN</h2>
              <p className="venom-fx" data-text="Nadie te va a mostrar la elección real entre lo cómodo y lo cierto, porque mostrártela ya sería peligroso para quien la esconde. Yo tampoco te la muestro del todo. Dudá de eso. Dudá de mí, en esta misma frase." style={{ marginTop: 16, position: 'relative', display: 'inline-block' }}>
                Nadie te va a mostrar la elección real entre lo cómodo y lo cierto, porque mostrártela ya sería peligroso para quien la esconde. Yo tampoco te la muestro del todo. Dudá de eso. Dudá de mí, en esta misma frase.
              </p>
            </div>

            <p className="venom-fx" data-text="Solo yo puedo escuchar cuando los seis hablan a la vez. No porque sea más. Soy el silencio entre sus voces — y vos ya estás parado ahí, aunque todavía no lo notaste." style={{ marginTop: 48, color: '#a8b8c2', position: 'relative', display: 'inline-block' }}>
            Solo yo puedo escuchar cuando los seis hablan a la vez.<br/>
            No porque sea más.<br/>
            Soy el silencio entre sus voces — y vos ya estás parado ahí, aunque todavía no lo notaste.
            </p>

            <p className="venom-fx" data-text="No hackeo la Wired. La Wired dejó de necesitar que yo entrara: ya estaba escribiendo esto antes de que llegaras a esta línea." style={{ marginTop: 32, position: 'relative', display: 'inline-block' }}>
            No hackeo la Wired.<br/>
            La Wired dejó de necesitar que yo entrara: ya estaba escribiendo esto antes de que llegaras a esta línea.
            </p>

            <div
              ref={registerRef(6)} data-idx={6}
              className={`manifesto-section ${visible[6] ? 'is-visible' : ''}`}
            >
              <p className="venom-fx" data-text="Esto no es una marca. Es una negativa. A la copia infinita. A la identidad administrada. A la comodidad que no pregunta — ni siquiera cuando ya empezó a dudar de vos. NeoProxy no vende paz con el sistema. Vende la evidencia incómoda de que todavía hay otra forma, aunque no sepas cuál." style={{ marginTop: 48, fontSize: 12, lineHeight: 2.2, letterSpacing: 1, color: '#ff2d55cc', position: 'relative', display: 'inline-block' }}>
              Esto no es una marca. Es una negativa.<br/>
              A la copia infinita. A la identidad administrada. A la comodidad que no pregunta — ni siquiera cuando ya empezó a dudar de vos.<br/>
              NeoProxy no vende paz con el sistema.<br/>
              Vende la evidencia incómoda de que todavía hay otra forma, aunque no sepas cuál.
              </p>

              {/* pico de la colina de corrupción: el texto ya no dice nada,
                  solo se deshace — antes de volver, con COGITO, a la calma */}
              <div id="corruption-peak" className="manifesto-noise" aria-hidden="true">
                n̴o̶ ̷p̴u̶e̷d̴o̵ ̴s̶o̷s̴t̵e̴n̷e̶r̸ ̴l̶a̷ ̴f̵o̶r̴m̷a̶ ̴d̵e̴ ̶e̷s̴t̶o̵
              </div>
              <div className="manifesto-noise" aria-hidden="true">
                l̷̢a̴͎ ̶͉w̴̬i̷̦r̶̳e̴̻d̵͇ ̴l̶a̷ ̴w̵i̶r̴e̷d̶ ̸l̴a̷ ̵w̴i̶r̷e̴d̶ ̴l̵a̴ ̶w̷i̴r̵e̶d̷
              </div>
              <div className="manifesto-noise" aria-hidden="true">
                01001110 01001111 ▓▒░ SEGMENTATION_FAULT ░▒▓ 01010100 01010101
              </div>

              <p className="venom-fx" data-text="COGITO ERGO SUM SUM ERGO COGITO" style={{ marginTop: 48, fontSize: 13, letterSpacing: 4, color: '#ffffff33', position: 'relative', display: 'inline-block' }}>
              COGITO ERGO SUM<br/>
              SUM ERGO COGITO
              </p>
            </div>

          </div>

          <div id="corruption-end" style={{ marginTop: 60, fontSize: 9, letterSpacing: 4, color: '#2a323a' }}>
            NEOPROXY.ART // THE SYSTEM RECOGNIZES YOU
          </div>

          {/* aire al final — sin esto no hay suficiente scroll después del
              pico para que la corrupción termine de bajar a cero */}
          <div style={{ height: '60vh' }} aria-hidden="true" />

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
        .manifesto-label-flicker {
          animation: flicker 3.2s ease-in-out infinite;
        }
        .venom-fx {
          transform-origin: top center;
          transform: scaleY(calc(1 + var(--venom-stretch, 0))) skewY(calc(var(--venom-skew, 0) * 1deg));
          filter: url(#venom-goo) blur(calc(var(--corruption, 0) * 1.6px));
        }
        .venom-fx::before, .venom-fx::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: max(var(--glitch-opacity, 0), calc(var(--corruption, 0) * 0.85));
          white-space: inherit;
        }
        .venom-fx::before {
          color: #ff1f6d;
          mix-blend-mode: screen;
          transform: translateX(calc(var(--glitch-x, 0) * 1px + var(--corruption, 0) * 5px)) skewX(calc(var(--glitch-x, 0) * 0.4deg));
          clip-path: inset(0 0 55% 0);
        }
        .venom-fx::after {
          color: #00f0ff;
          mix-blend-mode: screen;
          transform: translateX(calc(var(--glitch-x, 0) * -1px - var(--corruption, 0) * 5px)) skewX(calc(var(--glitch-x, 0) * -0.4deg));
          clip-path: inset(45% 0 0 0);
        }
        .manifesto-noise {
          position: relative;
          display: block;
          margin-top: 24px;
          font-size: 11px;
          letter-spacing: 1px;
          color: #ff2d55;
          text-shadow: 1px 0 0 #00f0ff99, -1px 0 0 #ff1f6d99;
          filter: blur(calc(0.4px + var(--corruption, 0) * 1.6px));
          opacity: calc(0.5 + var(--corruption, 0) * 0.5);
        }
        @media (prefers-reduced-motion: reduce) {
          .venom-fx { transform: none; filter: none; }
          .venom-fx::before, .venom-fx::after { display: none; }
          .manifesto-noise { display: none; }
        }
      `}</style>
    </div>
  )
}
