'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

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

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
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
      requestAnimationFrame(animate)
    }
    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [showContent])

  const mono = "'Space Mono', monospace"

  const navItems = [
    { label: 'HOME', href: '/' },
    { label: 'MANIFESTO', href: '/manifesto' },
    { label: 'ARSENAL', href: '/arsenal' },
    { label: 'FABRICATION', href: '/fabrication' },
    { label: 'ARTIFACTS', href: '/artifacts' },
  ]

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

          <nav className="main-nav" style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '18px 32px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
            background: 'rgba(0, 2, 5, 0.85)', backdropFilter: 'blur(6px)', borderBottom: '1px solid rgba(0, 212, 255, 0.15)'
          }}>
            <Link href="/" style={{ fontFamily: mono, fontSize: 13, color: '#00d4ff', letterSpacing: 4, textDecoration: 'none', flexShrink: 0 }}>
              NEO·PROXY
            </Link>
            <div className="nav-links" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
              {navItems.map(({ label, href }) => (
                <Link key={label} href={href} className="nav-link" style={{
                  fontFamily: mono, fontSize: 11, color: '#8fb8d6', letterSpacing: 2, textDecoration: 'none', cursor: 'pointer', whiteSpace: 'nowrap'
                }}>
                  {label}
                </Link>
              ))}
            </div>
            <Link href="/npos" style={{
              fontFamily: mono, fontSize: 10, color: '#00d4ff', letterSpacing: 3, textDecoration: 'none',
              border: '1px solid #00d4ff66', padding: '8px 16px', flexShrink: 0
            }}>
              ACCESS
            </Link>
          </nav>

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
          .main-nav {
            flex-wrap: wrap;
            padding: 14px 16px !important;
            row-gap: 12px;
          }
          .nav-links {
            order: 3;
            width: 100%;
            justify-content: center;
            gap: 16px !important;
          }
          .nav-link {
            font-size: 10px !important;
          }
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
