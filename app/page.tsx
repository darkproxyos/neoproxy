'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [booted, setBooted] = useState(false)
  const [bootText, setBootText] = useState('')
  const [showContent, setShowContent] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<'boot' | 'init' | 'content'>('boot')

  // Boot sequence
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

  // Particle system
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

  return (
    <div style={{ 
      background: '#000205', 
      minHeight: '100vh', 
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* CRT Scanlines */}
      <div className="crt-scanlines" />
      
      {/* Tech Grid Background */}
      <div className="tech-grid" />

      {/* Boot Screen */}
      {currentScreen === 'boot' && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          zIndex: 100,
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center', 
          flexDirection: 'column', 
          padding: '0 24px',
          background: '#000205'
        }}>
          <div 
            className="boot-text" 
            style={{ 
              fontFamily: mono, 
              fontSize: 12, 
              color: '#00d4ff',
              letterSpacing: 3, 
              lineHeight: 2.2, 
              whiteSpace: 'pre-wrap', 
              textAlign: 'left',
              maxWidth: 600
            }}
          >
            {bootText}
          </div>
          <div style={{ 
            marginTop: 40, 
            width: 300, 
            height: 2, 
            background: '#00d4ff11', 
            overflow: 'hidden' 
          }}>
            <div style={{ 
              height: '100%', 
              background: 'linear-gradient(to right, #00d4ff, #00ffcc)',
              animation: 'boot-load 2.4s ease forwards' 
            }} />
          </div>
        </div>
      )}

      {/* Init Screen */}
      {currentScreen === 'init' && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          zIndex: 99,
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center', 
          flexDirection: 'column',
          background: '#000205'
        }}>
          <div style={{ 
            fontFamily: mono, 
            fontSize: 14, 
            color: '#00ffcc',
            letterSpacing: 6,
            textShadow: '0 0 20px #00ffcc'
          }}>
            SYSTEM READY
          </div>
          <div style={{ 
            fontFamily: mono, 
            fontSize: 10, 
            color: '#00d4ff44',
            letterSpacing: 3,
            marginTop: 16
          }}>
            ACCESS GRANTED
          </div>
        </div>
      )}

      {/* Main Content */}
      {showContent && (
        <>
          {/* Particle Canvas */}
          <canvas 
            ref={canvasRef} 
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              width: '100vw', 
              height: '100vh', 
              zIndex: 1 
            }} 
          />

          {/* Navigation */}
          <nav style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            zIndex: 50,
            padding: '24px 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0, 212, 255, 0.1)'
          }}>
            <div style={{ 
              fontFamily: mono, 
              fontSize: 11, 
              color: '#00d4ff',
              letterSpacing: 4
            }}>
              NEO·PROXY
            </div>
            <div style={{ 
              display: 'flex', 
              gap: 32,
              flexWrap: 'wrap'
            }}>
              {[
                { label: 'HOME', href: '/' },
                { label: 'MANIFESTO', href: '/manifesto' },
                { label: 'ARTIFACTS', href: '/artifacts' },
                { label: 'FABRICATION', href: '/fabrication' },
                { label: 'STORE', href: '/store' },
              ].map(({ label, href }) => (
                <Link 
                  key={label} 
                  href={href}
                  className="nav-link"
                  style={{ 
                    fontFamily: mono, 
                    fontSize: 9, 
                    color: '#4a6080',
                    letterSpacing: 3,
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>
            <Link 
              href="/npos"
              style={{ 
                fontFamily: mono, 
                fontSize: 9, 
                color: '#00d4ff',
                letterSpacing: 3,
                textDecoration: 'none',
                border: '1px solid #00d4ff44',
                padding: '8px 16px'
              }}
            >
              ACCESS
            </Link>
          </nav>

          {/* Hero Section */}
          <div style={{ 
            position: 'fixed', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            zIndex: 10, 
            textAlign: 'center',
            width: '100%', 
            padding: '0 24px',
            boxSizing: 'border-box'
          }}>
            <div 
              className="fade-in"
              style={{ 
                fontFamily: mono, 
                fontSize: 56, 
                fontWeight: 700, 
                letterSpacing: 16, 
                color: '#00d4ff',
                textShadow: '0 0 40px #00d4ff, 0 0 80px #6644aa',
                marginBottom: 16,
                lineHeight: 1
              }}
            >
              NEO·PROXY
            </div>
            
            <div 
              className="fade-in"
              style={{ 
                fontFamily: mono, 
                fontSize: 11, 
                letterSpacing: 8, 
                color: '#6644aa',
                marginBottom: 24
              }}
            >
              ARTE · SISTEMAS · FABRICACIÓN
            </div>

            <div 
              className="fade-in"
              style={{ 
                fontFamily: mono, 
                fontSize: 10, 
                color: '#00d4ff88',
                letterSpacing: 2,
                marginBottom: 48
              }}
            >
              An experimental fabrication laboratory.
            </div>

            <Link
              href="/npos"
              className="cyber-btn fade-in"
              style={{ 
                display: 'inline-block',
                fontFamily: mono, 
                fontSize: 10, 
                letterSpacing: 4, 
                color: '#00d4ff',
                textDecoration: 'none',
                border: '1px solid #00d4ff44',
                padding: '14px 42px',
                background: 'rgba(0, 212, 255, 0.05)',
                cursor: 'pointer'
              }}
            >
              [ INIT ACCESS ]
            </Link>
          </div>

          {/* System Status Panel */}
          <div style={{ 
            position: 'fixed', 
            top: 120, 
            left: 40, 
            zIndex: 10,
            fontFamily: mono, 
            fontSize: 9, 
            letterSpacing: 2,
            color: '#4a6080',
            pointerEvents: 'none'
          }}>
            <div style={{ color: '#00d4ff', fontSize: 10, marginBottom: 8 }}>
              SYSTEM STATUS
            </div>
            <div>
              <span className="status-dot active" />
              KERNEL: ONLINE
            </div>
            <div style={{ marginTop: 4 }}>
              <span className="status-dot active" />
              MEMORY: LOADED
            </div>
            <div style={{ marginTop: 4 }}>
              <span className="status-dot active" />
              ARTIFACTS: {5} UNITS
            </div>
            <div style={{ marginTop: 4, color: '#ffffff33', fontSize: 8 }}>
              v0.2.1 // PRODUCTION
            </div>
          </div>

          {/* Footer Info */}
          <div style={{ 
            position: 'fixed', 
            bottom: 24, 
            left: 0, 
            right: 0, 
            zIndex: 10,
            textAlign: 'center',
            fontFamily: mono, 
            fontSize: 8, 
            letterSpacing: 3,
            color: '#00d4ff22'
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

        @media (max-width: 768px) {
          nav {
            padding: 16px 20px !important;
            flex-direction: column;
            gap: 16px !important;
          }
          
          .fade-in:first-child {
            font-size: 32px !important;
            letter-spacing: 8px !important;
          }
          
          .fade-in:nth-child(2) {
            font-size: 9px !important;
            letter-spacing: 4px !important;
          }
          
          .fade-in:nth-child(3) {
            font-size: 9px !important;
          }
        }
      `}</style>
    </div>
  )
}
