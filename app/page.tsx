'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

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

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [booted, setBooted] = useState(false)
  const [bootText, setBootText] = useState('')
  const [showContent, setShowContent] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<'boot' | 'init' | 'content'>('boot')

  useEffect(() => {
    const lines = [
      '> SYSTEM INITIALIZING...',
      '> NEO·PROXY CORE LOADED',
      '> MEMORY MODULES: ONLINE',
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

    const animate = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = 'source-over'
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha})`
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
        const aXY = angleBase
        const aZW = reducedMotion ? shapeIndex * 0.7 : t * 0.00019
        const aXW = reducedMotion ? shapeIndex * 2.1 : t * 0.00008
        const rotated = shape.vertices.map(v => rotate4D(v, aXY, aZW, aXW))

        const wDist = 2.4, zDist = 3.6
        const scale = Math.min(canvas.width, canvas.height) * 0.32
        const cx = canvas.width / 2, cy = canvas.height / 2
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
          const r = Math.round(102 + (0 - 102) * hue)
          const g = Math.round(68 + (212 - 68) * hue)
          const bch = Math.round(170 + (255 - 170) * hue)
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

      requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [showContent])

  const mono = "'Space Mono', monospace"

  const sections = [
    {
      id: 'manifesto',
      tag: 'NPX-DOC-00',
      title: 'MANIFESTO',
      copy: 'Rechazamos las plantillas y la conveniencia. Cada artefacto documenta su propio proceso: la ingeniería precede a la estética.',
      cta: 'READ MANIFESTO',
      href: '/manifesto',
    },
    {
      id: 'arsenal',
      tag: 'NPX-ARS-01',
      title: 'ARSENAL',
      copy: 'Katana, kunai, shuriken, guante. Artefactos renderizados en tiempo real — gira, inspecciona, entiende cada pieza en 3D.',
      cta: 'EXPLORE ARSENAL',
      href: '/arsenal',
    },
    {
      id: 'fabrication',
      tag: 'NPX-LAB-00',
      title: 'FABRICATION',
      copy: 'Impresoras activas. Resina, PLA, PETG. Cada pieza pasa por concepto, modelo 3D, prototipo, impresión y acabado.',
      cta: 'VIEW FABRICATION',
      href: '/fabrication',
    },
    {
      id: 'artifacts',
      tag: 'NPX-REL-00',
      title: 'ARTIFACTS',
      copy: 'El catálogo completo. Piezas únicas o de producción limitada, cada una con NFC y memoria digital vinculada.',
      cta: 'VIEW ALL ARTIFACTS',
      href: '/artifacts',
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

          <section style={{
            position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '100px 24px 60px', boxSizing: 'border-box'
          }}>
            <div className="fade-in hero-title" style={{
              fontFamily: mono, fontSize: 56, fontWeight: 700, letterSpacing: 16, color: '#00d4ff',
              textShadow: '0 0 40px #00d4ff, 0 0 80px #6644aa', marginBottom: 16, lineHeight: 1
            }}>
              NEO·PROXY
            </div>

            <div className="fade-in hero-tagline" style={{ fontFamily: mono, fontSize: 11, letterSpacing: 8, color: '#6644aa', marginBottom: 24 }}>
              ARTE · SISTEMAS · FABRICACIÓN
            </div>

            <div className="fade-in hero-sub" style={{ fontFamily: mono, fontSize: 10, color: '#00d4ff88', letterSpacing: 2, marginBottom: 48, maxWidth: 480 }}>
              Un laboratorio experimental de fabricación. Artefactos reales, diseñados y producidos por sistemas de IA e ingeniería humana.
            </div>

            <div className="fade-in" style={{ fontFamily: mono, fontSize: 14, letterSpacing: 4, color: '#00ffcc', marginBottom: 24, textShadow: '0 0 12px #00ffcc' }}>
              HOLA DARKPROXY
            </div>

            <Link href="/npos" className="cyber-btn fade-in" style={{
              display: 'inline-block', fontFamily: mono, fontSize: 10, letterSpacing: 4, color: '#00d4ff', textDecoration: 'none',
              border: '1px solid #00d4ff44', padding: '14px 42px', background: 'rgba(0, 212, 255, 0.05)', cursor: 'pointer', marginBottom: 64
            }}>
              [ INIT ACCESS ]
            </Link>

            <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: '#4a6080', marginBottom: 40 }}>
              <div style={{ color: '#00d4ff', fontSize: 10, marginBottom: 8 }}>SYSTEM STATUS</div>
              <div><span className="status-dot active" /> KERNEL: ONLINE &nbsp;·&nbsp; <span className="status-dot active" /> MEMORY: LOADED &nbsp;·&nbsp; <span className="status-dot active" /> ARTIFACTS: 5 UNITS</div>
            </div>

            <div className="scroll-cue" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#00d4ff55' }}>
              SCROLL TO EXPLORE ↓
            </div>
          </section>

          {sections.map((s, idx) => (
            <section key={s.id} style={{
              position: 'relative', zIndex: 10, minHeight: '60vh', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 24px', boxSizing: 'border-box',
              borderTop: '1px solid rgba(0, 212, 255, 0.08)', background: idx % 2 === 1 ? 'rgba(0, 212, 255, 0.02)' : 'transparent'
            }}>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', marginBottom: 12 }}>
                {s.tag}
              </div>
              <div style={{ fontFamily: mono, fontSize: 32, letterSpacing: 8, color: '#00d4ff', marginBottom: 20, textShadow: '0 0 24px rgba(0,212,255,0.35)' }}>
                {s.title}
              </div>
              <div style={{ fontFamily: mono, fontSize: 12, lineHeight: 1.8, letterSpacing: 0.5, color: '#9fc4e0', maxWidth: 520, marginBottom: 36 }}>
                {s.copy}
              </div>
              <Link href={s.href} className="cyber-btn" style={{
                display: 'inline-block', fontFamily: mono, fontSize: 10, letterSpacing: 3, color: '#00d4ff', textDecoration: 'none',
                border: '1px solid #00d4ff44', padding: '12px 32px', background: 'rgba(0, 212, 255, 0.05)', cursor: 'pointer'
              }}>
                [ {s.cta} ]
              </Link>
            </section>
          ))}

          <div style={{
            position: 'relative', zIndex: 10, textAlign: 'center', padding: '32px 24px', fontFamily: mono,
            fontSize: 8, letterSpacing: 3, color: '#00d4ff33', borderTop: '1px solid rgba(0, 212, 255, 0.08)'
          }}>
            NEOPROXY.ART // SANTIAGO, CHILE
          </div>
        </>
      )}

      <style>{`
        @keyframes boot-load {
          from { width: 0; }
          to { width: 100%; }
        }
        .scroll-cue {
          animation: pulse-cue 2s ease-in-out infinite;
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
            font-size: 9px !important;
            letter-spacing: 4px !important;
          }
          .hero-sub {
            font-size: 9px !important;
          }
        }
      `}</style>
    </div>
  )
}
