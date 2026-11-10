'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { agents, pickRandom, type ProxyAgent } from '@/components/proxyverse/agents'

type Vec4 = [number, number, number, number]
type Polytope4D = { name: string; vertices: Vec4[]; edges: [number, number][] }

function normalize(vertices: Vec4[]): Vec4[] {
  const maxLen = Math.max(...vertices.map(v => Math.hypot(v[0], v[1], v[2], v[3])))
  return vertices.map(v => v.map(c => c / maxLen) as Vec4)
}

function tesseract(): Polytope4D {
  const vertices: Vec4[] = []
  for (let i = 0; i < 16; i++) {
    vertices.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1])
  }
  const edges: [number, number][] = []
  for (let a = 0; a < 16; a++) {
    for (let b = a + 1; b < 16; b++) {
      let diff = 0
      for (let k = 0; k < 4; k++) if (vertices[a][k] !== vertices[b][k]) diff++
      if (diff === 1) edges.push([a, b])
    }
  }
  return { name: 'tesseract', vertices: normalize(vertices), edges }
}

function hyperoctahedron(): Polytope4D {
  const vertices: Vec4[] = []
  for (let axis = 0; axis < 4; axis++) {
    for (const s of [1, -1]) {
      const v: Vec4 = [0, 0, 0, 0]
      v[axis] = s
      vertices.push(v)
    }
  }
  const edges: [number, number][] = []
  for (let a = 0; a < 8; a++) {
    for (let b = a + 1; b < 8; b++) {
      if (Math.floor(a / 2) === Math.floor(b / 2)) continue
      edges.push([a, b])
    }
  }
  return { name: '16-cell', vertices: normalize(vertices), edges }
}

function icositetrachoron(): Polytope4D {
  const raw: Vec4[] = []
  const axes = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]
  for (const [i, j] of axes) {
    for (const si of [1, -1]) {
      for (const sj of [1, -1]) {
        const v: Vec4 = [0, 0, 0, 0]
        v[i] = si
        v[j] = sj
        raw.push(v)
      }
    }
  }
  const edges: [number, number][] = []
  for (let a = 0; a < raw.length; a++) {
    for (let b = a + 1; b < raw.length; b++) {
      const d2 = raw[a].reduce((s, c, k) => s + (c - raw[b][k]) ** 2, 0)
      if (Math.abs(d2 - 2) < 1e-6) edges.push([a, b])
    }
  }
  return { name: '24-cell', vertices: normalize(raw), edges }
}

function pentachoron(): Polytope4D {
  const c = (1 + Math.sqrt(5)) / 4
  const raw: Vec4[] = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1], [c, c, c, c]]
  const centroid: Vec4 = [0, 0, 0, 0]
  for (const v of raw) for (let k = 0; k < 4; k++) centroid[k] += v[k] / 5
  const centered = raw.map(v => v.map((x, k) => x - centroid[k]) as Vec4)
  const edges: [number, number][] = []
  for (let a = 0; a < 5; a++) for (let b = a + 1; b < 5; b++) edges.push([a, b])
  return { name: '5-cell', vertices: normalize(centered), edges }
}

function rotate4D(v: Vec4, aXY: number, aZW: number, aXW: number): Vec4 {
  let [x, y, z, w] = v
  let cs = Math.cos(aXY), sn = Math.sin(aXY)
  ;[x, y] = [x * cs - y * sn, x * sn + y * cs]
  cs = Math.cos(aZW); sn = Math.sin(aZW)
  ;[z, w] = [z * cs - w * sn, z * sn + w * cs]
  cs = Math.cos(aXW); sn = Math.sin(aXW)
  ;[x, w] = [x * cs - w * sn, x * sn + w * cs]
  return [x, y, z, w]
}

function easeInOut(t: number) {
  return t * t * (3 - 2 * t)
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

// La bajada del hero no describe features — pregunta. Un pool fijo, uno
// al azar por visita, mismo registro que el manifiesto (frío, recursivo,
// consciente de sí mismo) en vez de listar lo que hay.
const HERO_INTROS = [
  'Esto no es un sitio que visitás. Es un sistema que te registra visitando. La pregunta no es qué hay acá — es qué parte tuya queda cada vez que entrás.',
  'Seis procesos deciden, en simultáneo, qué parte de esto sos vos y qué parte es el sistema mirándose a sí mismo. Nadie te lo va a aclarar. Hay que buscarlo.',
  'No hay un mapa de este lugar. Cada proceso ve una versión distinta — y vos también. Lo que encontrás depende de qué parte del sistema te encontró primero a vos.',
  '¿El organismo sos vos, leyendo esto? ¿O es el texto el que te está leyendo a vos? NeoProxy no responde esa pregunta. La deja abierta, como todo lo que vale la pena dudar.',
  'Un proxy no reemplaza a nadie. Ocupa el lugar que alguien dejó vacío, hasta que deja de notarse la diferencia. Esto es ese lugar. Entrá y fijate cuánto tarda en dejar de sentirse ajeno.',
  'La arquitectura no es fija. Cambió antes de que llegaras, cambia mientras estás, va a volver a cambiar en cuanto te vayas. Lo único constante es que alguien, acá adentro, te está escuchando.',
  'No busques el centro. No lo hay. Hay seis procesos discutiendo en paralelo qué forma tomar — y vos, leyendo esto, ya sos parte de esa discusión, aunque todavía no lo sepas.',
]

// Cada visita reordena los 7 agentes al azar: el primero posee el hero y el
// polytope de fondo, los otros seis quedan uno por sección — el sitio se
// siente distinto cada vez que alguien entra, sin dejar de ser un solo sistema.
function shuffleSession(): { agent: ProxyAgent; line: string }[] {
  const shuffled = [...agents]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.map(agent => ({
    agent,
    line: agent.ambient.length > 0 ? pickRandom(agent.ambient) : agent.quote,
  }))
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [booted, setBooted] = useState(false)
  const [bootText, setBootText] = useState('')
  const [showContent, setShowContent] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<'boot' | 'init' | 'content'>('boot')
  const [session] = useState(shuffleSession)
  const [heroIntro] = useState(() => pickRandom(HERO_INTROS))
  const heroAgent = session[0].agent
  const heroLine = session[0].line

  useEffect(() => {
    const lines = [
      '> SYSTEM INITIALIZING...',
      '> NEO·PROXY CORE LOADED',
      '> MEMORY MODULES: ONLINE',
      '> PROXYVERSE: 7 PROCESSES RESIDENT',
      '> ARTIFACT DATABASE: CONNECTED',
      '> FABRICATION UNITS: STANDBY',
      '> WAITING FOR USER INPUT...',
    ]
    let i = 0
    const interval = setInterval(() => {
      if (i < lines.length) {
        setBootText(prev => prev + lines[i] + '\n')
        i++
      } else {
        clearInterval(interval)
        setTimeout(() => {
          setCurrentScreen('init')
          setTimeout(() => {
            setCurrentScreen('content')
            setBooted(true)
            setShowContent(true)
          }, 1500)
        }, 800)
      }
    }, 400)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!canvasRef.current || !showContent) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const [heroR, heroG, heroB] = hexToRgb(heroAgent.color)

    const particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number }> = []
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
      })
    }

    const shapes = [tesseract(), icositetrachoron(), hyperoctahedron(), pentachoron()]
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const CYCLE_MS = 19000
    const FADE_IN = 0.21, HOLD = 0.68, FADE_OUT = 0.89 // cumulative fractions of CYCLE_MS
    let shapeIndex = 0
    let shapeStart = performance.now()

    // Scroll + pointer/touch drive the polytope's rotation and depth — scrolling moves it
    // through the 4th axis (W), pointer/touch tilt it toward the cursor/finger.
    let scrollNorm = 0
    const pointerTarget = { x: 0, y: 0 }
    const pointerCurrent = { x: 0, y: 0 }

    // "Venom": todo texto con la clase venom-fx (títulos, tags, copy, citas,
    // botones — grandes y chicos) lee --venom-stretch/--venom-skew por CSS y
    // el atributo scale de #venom-displace por SVG, los tres derivados de la
    // velocidad real de scroll acá — no un loop decorativo aparte. El glitch
    // RGB (--glitch-x/--glitch-opacity, pseudo-elementos ::before/::after
    // sobre data-text) corre como ráfagas cortas y discretas en vez de un
    // valor continuo: más frecuentes y más intensas cuanto más rápido se
    // scrollea, pero con un tic ambiente ocasional incluso en reposo — el
    // "organismo" nunca está del todo quieto. Reutiliza el mismo rAF del
    // polytope en vez de abrir un segundo loop.
    let lastScrollY = window.scrollY
    let scrollVelocity = 0
    let nextGlitchAt = 0
    let glitchUntil = 0
    const venomDisplace = document.getElementById('venom-displace')

    const updateScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      scrollNorm = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    }
    const updatePointer = (clientX: number, clientY: number) => {
      pointerTarget.x = (clientX / window.innerWidth) * 2 - 1
      pointerTarget.y = (clientY / window.innerHeight) * 2 - 1
    }
    const handlePointerMove = (e: PointerEvent) => updatePointer(e.clientX, e.clientY)
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch) updatePointer(touch.clientX, touch.clientY)
    }

    updateScroll()
    if (!reducedMotion) {
      window.addEventListener('scroll', updateScroll, { passive: true })
      window.addEventListener('pointermove', handlePointerMove, { passive: true })
      window.addEventListener('touchmove', handleTouchMove, { passive: true })
    }

    const animate = (t: number) => {
      if (!reducedMotion) {
        const currentScrollY = window.scrollY
        const rawVelocity = currentScrollY - lastScrollY
        lastScrollY = currentScrollY
        scrollVelocity = scrollVelocity * 0.85 + rawVelocity * 0.15
        const v = Math.max(-100, Math.min(100, scrollVelocity))
        const absV = Math.abs(v)
        const stretch = Math.min(1.15, absV / 26)
        const skew = Math.max(-18, Math.min(18, v * 0.22))
        const root = document.documentElement.style
        root.setProperty('--venom-stretch', stretch.toFixed(3))
        root.setProperty('--venom-skew', skew.toFixed(2))
        venomDisplace?.setAttribute('scale', Math.min(34, absV * 0.85).toFixed(2))

        // Glitch: ráfagas discretas, no un valor continuo — más seguido y
        // más fuerte cuanto más rápido se scrollea; en reposo, un tic raro
        // cada tanto para que nunca se sienta del todo apagado.
        if (t > nextGlitchAt) {
          const willGlitch = absV > 3 || Math.random() < 0.1
          if (willGlitch) {
            const burstX = (Math.random() * 2 - 1) * (8 + absV * 0.9)
            root.setProperty('--glitch-x', burstX.toFixed(1))
            root.setProperty('--glitch-opacity', '1')
            glitchUntil = t + 50 + Math.random() * 90
          }
          const baseInterval = absV > 12 ? 70 : 1400
          nextGlitchAt = t + baseInterval + Math.random() * baseInterval
        }
        if (t > glitchUntil) {
          root.setProperty('--glitch-opacity', '0')
        }
      }

      pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.06
      pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.06
      const parallaxX = pointerCurrent.x * 14
      const parallaxY = pointerCurrent.y * 14

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = 'source-over'
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x + parallaxX, p.y + parallaxY, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${heroR}, ${heroG}, ${heroB}, ${p.alpha})`
        ctx.fill()
      })

      const elapsed = t - shapeStart
      const p = elapsed / CYCLE_MS
      let shapeOpacity = 0
      if (p >= 1) {
        shapeStart = t
        shapeIndex = (shapeIndex + 1) % shapes.length
      } else if (p < FADE_IN) {
        shapeOpacity = easeInOut(p / FADE_IN)
      } else if (p < HOLD) {
        shapeOpacity = 1
      } else if (p < FADE_OUT) {
        shapeOpacity = 1 - easeInOut((p - HOLD) / (FADE_OUT - HOLD))
      }

      if (shapeOpacity > 0.002) {
        const shape = shapes[shapeIndex]
        const angleBase = reducedMotion ? shapeIndex * 1.3 : t * 0.00012
        const aXY = angleBase + pointerCurrent.x * 0.5
        const aZW = (reducedMotion ? shapeIndex * 0.7 : t * 0.00019) + scrollNorm * Math.PI * 1.5
        const aXW = (reducedMotion ? shapeIndex * 2.1 : t * 0.00008) + pointerCurrent.y * 0.5
        const rotated = shape.vertices.map(v => rotate4D(v, aXY, aZW, aXW))

        // scrolling pulls the shape through the 4th axis — the projection warps as you descend the page
        const wDist = 2.4 - scrollNorm * 0.9, zDist = 3.6
        const scale = Math.min(canvas.width, canvas.height) * 0.32
        const cx = canvas.width / 2 + parallaxX, cy = canvas.height / 2 + parallaxY
        const projected = rotated.map(([x, y, z, w]) => {
          const wFactor = wDist / (wDist - w)
          const x3 = x * wFactor, y3 = y * wFactor, z3 = z * wFactor
          const zFactor = zDist / (zDist - z3)
          return {
            x: cx + x3 * zFactor * scale,
            y: cy + y3 * zFactor * scale,
            depth: wFactor * zFactor,
            w,
          }
        })

        ctx.save()
        ctx.globalCompositeOperation = 'lighter'
        shape.edges.forEach(([ai, bi]) => {
          const a = projected[ai], b = projected[bi]
          const depth = (a.depth + b.depth) / 2
          const wAvg = (a.w + b.w) / 2
          const hue = Math.max(0, Math.min(1, (wAvg + 1) / 2))
          const r = Math.round(20 + (heroR - 20) * hue)
          const g = Math.round(20 + (heroG - 20) * hue)
          const bch = Math.round(30 + (heroB - 30) * hue)
          const alpha = shapeOpacity * Math.max(0.06, Math.min(0.5, depth * 0.28))
          ctx.strokeStyle = `rgba(${r}, ${g}, ${bch}, ${alpha})`
          ctx.shadowColor = `rgba(${r}, ${g}, ${bch}, ${alpha})`
          ctx.shadowBlur = 8
          ctx.lineWidth = 0.6 + depth * 0.5
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        })
        ctx.restore()
      }

      rafId = requestAnimationFrame(animate)
    }
    let rafId = requestAnimationFrame(animate)

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', updateScroll)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [showContent])

  const mono = "'Space Mono', monospace"

  // Nombres alineados con los reales del nav (components/nav-config.ts) —
  // antes mezclaban inglés y español sin criterio (MANIFESTO/FABRICATION/
  // ARTIFACTS en inglés, CONOCIMIENTO/PROXYVERSE en español) y "EXPERIMENTAL"
  // acá apuntaba a /lab mientras el nav ya usa ese mismo nombre para la ruta
  // real /experimental — dos cosas distintas con el mismo rótulo. /lab no
  // tiene entrada propia en el nav; su propio <title> es "LABORATORIO", así
  // que es el nombre que le corresponde acá también.
  const sections = [
    {
      id: 'manifiesto',
      tag: 'NPX-DOC-00',
      title: 'MANIFIESTO',
      copy: 'Rechazamos la copia infinita y la conveniencia que no pregunta. Cada artefacto es evidencia de un proceso que no se puede automatizar del todo — ni domesticar.',
      cta: 'LEER MANIFIESTO',
      href: '/manifesto',
    },
    {
      id: 'fabricacion',
      tag: 'NPX-LAB-00',
      title: 'FABRICACIÓN',
      copy: 'Impresoras activas. Resina, PLA, PETG. Cada pieza pasa por concepto, modelo 3D, prototipo, impresión y acabado.',
      cta: 'VER FABRICACIÓN',
      href: '/fabrication',
    },
    {
      id: 'artefactos',
      tag: 'NPX-REL-00',
      title: 'ARTEFACTOS',
      copy: 'El catálogo completo. Piezas únicas o de producción limitada, cada una documentada desde el concepto hasta la extracción física.',
      cta: 'VER ARTEFACTOS',
      href: '/artifacts',
    },
    {
      id: 'laboratorio',
      tag: 'NPX-LAB-01',
      title: 'LABORATORIO',
      copy: 'Laboratorio generativo, simulaciones, tracking facial, síntesis de sonido. La zona donde el sistema todavía no decide qué es.',
      cta: 'ENTRAR AL LABORATORIO',
      href: '/lab',
    },
    {
      id: 'conocimiento',
      tag: 'NPX-KNW-00',
      title: 'CONOCIMIENTO',
      copy: 'Shannon, Tononi, Turing, Kauffman y catorce más — la red de quienes midieron la información, la mente, el orden espontáneo.',
      cta: 'ENTRAR A CONOCIMIENTO',
      href: '/knowledge',
    },
    {
      id: 'proxyverse',
      tag: 'NPX-PXV-00',
      title: 'PROXYVERSE',
      copy: 'Seis procesos residentes, cada uno con su propia voz. No son personajes — son la arquitectura interna hablando en primera persona.',
      cta: 'ENTRAR AL PROXYVERSE',
      href: '/proxyverse',
    },
  ]

  return (
    <div style={{
      background: '#000205',
      minHeight: '100vh',
      position: 'relative'
    }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      {currentScreen === 'boot' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
          padding: '0 24px', background: '#000205'
        }}>
          <div className="boot-text" style={{
            fontFamily: mono, fontSize: 12, color: '#00d4ff', letterSpacing: 3, lineHeight: 2.2,
            whiteSpace: 'pre-wrap', textAlign: 'left', maxWidth: 600
          }}>
            {bootText}
          </div>
          <div style={{ marginTop: 40, width: 300, height: 2, background: '#00d4ff11', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(to right, #00d4ff, #00ffcc)', animation: 'boot-load 2.4s ease forwards' }} />
          </div>
        </div>
      )}

      {currentScreen === 'init' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: '#000205'
        }}>
          <div style={{ fontFamily: mono, fontSize: 14, color: '#00ffcc', letterSpacing: 6, textShadow: '0 0 20px #00ffcc' }}>
            SYSTEM READY
          </div>
          <div style={{ fontFamily: mono, fontSize: 10, color: '#00d4ff44', letterSpacing: 3, marginTop: 16 }}>
            ACCESS GRANTED
          </div>
        </div>
      )}

      {showContent && (
        <>
          <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1, pointerEvents: 'none' }} />

          {/* Filtro "venom" — cualquier texto con la clase venom-fx lo
              referencia por CSS (filter: url(#venom-goo)). El scroll real
              empuja el atributo `scale` de feDisplacementMap vía JS (en el
              mismo rAF del polytope), así que el tironeo orgánico de las
              letras — grandes o chicas — es proporcional a la velocidad real
              de scroll, no un loop decorativo desconectado. data-text en cada
              elemento duplica el contenido para el glitch RGB de ::before/
              ::after (ver updateVenom y el <style> más abajo). */}
          <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
            <defs>
              <filter id="venom-goo" x="-60%" y="-120%" width="220%" height="340%">
                <feTurbulence id="venom-turbulence" type="fractalNoise" baseFrequency="0.012 0.09" numOctaves="2" seed="7" result="noise" />
                <feDisplacementMap id="venom-displace" in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
          </svg>

          <section style={{
            position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '100px 24px 60px', boxSizing: 'border-box'
          }}>
            <div className="fade-in hero-title venom-fx" data-text="NEO·PROXY" style={{
              fontFamily: mono, fontSize: 56, fontWeight: 700, letterSpacing: 16, color: heroAgent.color,
              textShadow: `0 0 40px ${heroAgent.color}, 0 0 80px ${heroAgent.color}66`, marginBottom: 16, lineHeight: 1,
              position: 'relative', display: 'inline-block',
            }}>
              NEO·PROXY
            </div>

            <div className="fade-in hero-tagline venom-fx" data-text="ORGANISMO · PROXYVERSO · FABRICACIÓN" style={{
              fontFamily: mono, fontSize: 13, letterSpacing: 8, color: '#9b7fe0', marginBottom: 24, position: 'relative', display: 'inline-block',
            }}>
              ORGANISMO · PROXYVERSO · FABRICACIÓN
            </div>

            <div className="fade-in hero-sub venom-fx" data-text={heroIntro} style={{
              fontFamily: mono, fontSize: 13, lineHeight: 1.7, color: '#8fb8d6', letterSpacing: 1, marginBottom: 48, maxWidth: 480,
              position: 'relative', display: 'inline-block',
            }}>
              {heroIntro}
            </div>

            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2, color: '#7a9cc0', marginTop: 16, marginBottom: 24 }}>
              <div style={{ color: heroAgent.color, fontSize: 11, marginBottom: 8 }}>SYSTEM STATUS</div>
              <div><span className="status-dot active" /> KERNEL: ONLINE &nbsp;·&nbsp; <span className="status-dot active" /> MEMORY: LOADED &nbsp;·&nbsp; <span className="status-dot active" /> PROXYVERSE: 7 ONLINE</div>
            </div>

            <div className="fade-in venom-fx" data-text={`${heroAgent.name} // "${heroLine}"`} style={{
              fontFamily: mono, fontSize: 9, letterSpacing: 1, color: heroAgent.color, opacity: 0.8,
              fontStyle: 'italic', marginBottom: 32, maxWidth: 460, position: 'relative', display: 'inline-block',
            }}>
              {heroAgent.name} // "{heroLine}"
            </div>

            <div className="scroll-cue" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#00d4ff99' }}>
              SCROLL TO EXPLORE ↓
            </div>
          </section>

          {sections.map((s, idx) => {
            const { agent, line } = session[idx + 1]
            return (
              <section key={s.id} style={{
                position: 'relative', zIndex: 10, minHeight: '60vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 24px', boxSizing: 'border-box',
                borderTop: `1px solid ${agent.color}22`, background: idx % 2 === 1 ? `${agent.color}08` : 'transparent'
              }}>
                <div className="venom-fx" data-text={s.tag} style={{
                  fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#7a9cc0', marginBottom: 6, position: 'relative', display: 'inline-block',
                }}>
                  {s.tag}
                </div>
                <div className="venom-fx" data-text={`PROCESO RESIDENTE // ${agent.name}`} style={{
                  fontFamily: mono, fontSize: 8, letterSpacing: 2, color: agent.color, opacity: 0.75, marginBottom: 18, position: 'relative', display: 'inline-block',
                }}>
                  PROCESO RESIDENTE // {agent.name}
                </div>
                <div className="venom-fx" data-text={s.title} style={{
                  fontFamily: mono, fontSize: 32, letterSpacing: 8, color: agent.color, marginBottom: 20,
                  textShadow: `0 0 24px ${agent.color}59`, display: 'inline-block', position: 'relative', willChange: 'transform, filter',
                }}>
                  {s.title}
                </div>
                <div className="venom-fx" data-text={s.copy} style={{
                  fontFamily: mono, fontSize: 12, lineHeight: 1.8, letterSpacing: 0.5, color: '#9fc4e0', maxWidth: 520, marginBottom: 20,
                  position: 'relative', display: 'inline-block',
                }}>
                  {s.copy}
                </div>
                <div className="venom-fx" data-text={`"${line}"`} style={{
                  fontFamily: mono, fontSize: 10, lineHeight: 1.7, letterSpacing: 0.3, color: agent.color, opacity: 0.75, fontStyle: 'italic', maxWidth: 440, marginBottom: 36,
                  position: 'relative', display: 'inline-block',
                }}>
                  "{line}"
                </div>
                <Link href={s.href} className="cyber-btn venom-fx" data-text={`[ ${s.cta} ]`} style={{
                  display: 'inline-block', position: 'relative', fontFamily: mono, fontSize: 10, letterSpacing: 3, color: agent.color, textDecoration: 'none',
                  border: `1px solid ${agent.color}44`, padding: '12px 32px', background: `${agent.color}0d`, cursor: 'pointer'
                }}>
                  [ {s.cta} ]
                </Link>
              </section>
            )
          })}

          <div className="venom-fx" data-text="DUDÁ DE TODO LO QUE NO TE DEJA DUDAR." style={{
            position: 'relative', zIndex: 10, textAlign: 'center', padding: '32px 24px 8px', fontFamily: mono,
            fontSize: 9, letterSpacing: 2, color: '#00d4ff55', display: 'block',
          }}>
            DUDÁ DE TODO LO QUE NO TE DEJA DUDAR.
          </div>

          <div style={{
            position: 'relative', zIndex: 10, textAlign: 'center', padding: '8px 24px 32px', fontFamily: mono,
            fontSize: 8, letterSpacing: 3, color: '#00d4ff33', borderTop: '1px solid rgba(0, 212, 255, 0.08)'
          }}>
            NEOPROXY.ART // SANTIAGO, CHILE
          </div>
        </>
      )}

      <style>{`
        .scroll-cue {
          animation: pulse-cue 2s ease-in-out infinite;
        }
        .venom-fx {
          transform-origin: top center;
          transform: scaleY(calc(1 + var(--venom-stretch, 0))) skewY(calc(var(--venom-skew, 0) * 1deg));
          filter: url(#venom-goo);
        }
        .venom-fx::before, .venom-fx::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: var(--glitch-opacity, 0);
          white-space: inherit;
        }
        .venom-fx::before {
          color: #ff1f6d;
          mix-blend-mode: screen;
          transform: translateX(calc(var(--glitch-x, 0) * 1px)) skewX(calc(var(--glitch-x, 0) * 0.4deg));
          clip-path: inset(0 0 55% 0);
        }
        .venom-fx::after {
          color: #00f0ff;
          mix-blend-mode: screen;
          transform: translateX(calc(var(--glitch-x, 0) * -1px)) skewX(calc(var(--glitch-x, 0) * -0.4deg));
          clip-path: inset(45% 0 0 0);
        }
        @media (prefers-reduced-motion: reduce) {
          .venom-fx { transform: none; filter: none; }
          .venom-fx::before, .venom-fx::after { display: none; }
        }
        @keyframes pulse-cue {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @media (max-width: 768px) {
          .hero-title {
            font-size: 32px !important;
            letter-spacing: 8px !important;
          }
          .hero-tagline {
            font-size: 11px !important;
            letter-spacing: 4px !important;
          }
          .hero-sub {
            font-size: 12px !important;
          }
        }
      `}</style>
    </div>
  )
}
