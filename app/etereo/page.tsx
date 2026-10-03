'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { getAmbientLine } from '@/components/proxyverse/agents'

type Wisp = {
  baseX: number
  y: number
  vy: number
  radius: number
  phase: number
  freq: number
  alphaPhase: number
  color: [number, number, number]
}

const PALETTE: [number, number, number][] = [
  [0, 212, 255],
  [155, 127, 224],
  [0, 255, 204],
  [200, 218, 240],
]

const mono = "'Space Mono', monospace"

export default function EtereoPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [intro, setIntro] = useState(true)
  // getAmbientLine() usa Math.random() — si se elige en el render inicial,
  // el pick del build estático (SSR) no coincide con el del cliente en la
  // hidratación. Se difiere a un efecto (solo-cliente) para evitar el mismatch.
  const [ambient, setAmbient] = useState<{ agentId: string; line: string } | null>(null)

  useEffect(() => {
    setAmbient(getAmbientLine())
    const t = setTimeout(() => setIntro(false), 4200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const COUNT = reducedMotion ? 28 : 90

    const wisps: Wisp[] = Array.from({ length: COUNT }, () => ({
      baseX: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vy: reducedMotion ? 0.05 : 0.15 + Math.random() * 0.35,
      radius: 20 + Math.random() * 60,
      phase: Math.random() * Math.PI * 2,
      freq: 0.0003 + Math.random() * 0.0004,
      alphaPhase: Math.random() * Math.PI * 2,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    }))

    const pointer = { x: canvas.width / 2, y: canvas.height / 2, active: false }
    const updatePointer = (x: number, y: number) => { pointer.x = x; pointer.y = y; pointer.active = true }
    const handleMove = (e: PointerEvent) => updatePointer(e.clientX, e.clientY)
    const handleTouch = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch) updatePointer(touch.clientX, touch.clientY)
    }
    const handleLeave = () => { pointer.active = false }

    window.addEventListener('pointermove', handleMove, { passive: true })
    window.addEventListener('touchmove', handleTouch, { passive: true })
    window.addEventListener('pointerleave', handleLeave, { passive: true })

    let rafId: number
    const animate = (t: number) => {
      // No limpia del todo — deja un rastro fantasma en vez de un refresco limpio
      ctx.fillStyle = 'rgba(2, 2, 8, 0.12)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.globalCompositeOperation = 'lighter'
      for (const w of wisps) {
        w.y -= w.vy
        if (w.y < -w.radius) {
          w.y = canvas.height + w.radius
          w.baseX = Math.random() * canvas.width
        }

        const sway = Math.sin(t * w.freq + w.phase) * 40
        let x = w.baseX + sway
        const breathe = 0.35 + 0.25 * Math.sin(t * 0.0006 + w.alphaPhase)

        if (pointer.active && !reducedMotion) {
          const dx = x - pointer.x, dy = w.y - pointer.y
          const dist = Math.hypot(dx, dy)
          const influence = 160
          if (dist < influence && dist > 0.001) {
            const force = (1 - dist / influence) * 18
            x += (dx / dist) * force
          }
        }

        const [r, g, b] = w.color
        const grad = ctx.createRadialGradient(x, w.y, 0, x, w.y, w.radius)
        grad.addColorStop(0, `rgba(${r},${g},${b},${breathe})`)
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(x, w.y, w.radius, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'

      rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('touchmove', handleTouch)
      window.removeEventListener('pointerleave', handleLeave)
    }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#020208', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 40, zIndex: 50,
        background: 'rgba(2,2,10,0.7)', borderBottom: '1px solid rgba(0,212,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px',
        backdropFilter: 'blur(6px)', fontFamily: mono,
      }}>
        <span style={{ fontSize: 11, letterSpacing: 3, color: '#9b7fe0' }}>NEOPROXY // ETÉREO</span>
        <Link href="/" style={{
          fontSize: 10, color: '#00d4ff', textDecoration: 'none',
          border: '1px solid rgba(0,212,255,0.4)', padding: '3px 10px',
        }}>
          SALIR
        </Link>
      </div>

      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, display: 'block' }} />

      {intro && (
        <div className="etereo-intro" style={{
          position: 'absolute', inset: 0, zIndex: 40, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center', pointerEvents: 'none', padding: 24,
        }}>
          <div style={{
            fontFamily: mono, fontSize: 42, letterSpacing: 12, color: '#fff',
            textShadow: '0 0 40px rgba(0,212,255,0.6)',
          }}>
            ETÉREO
          </div>
          <div style={{
            fontFamily: mono, fontSize: 11, letterSpacing: 2, color: '#9fc4e0',
            marginTop: 18, maxWidth: 420, lineHeight: 1.8,
          }}>
            Lo que queda cuando un proceso se suelta de su cuerpo. Movete — las presencias notan.
          </div>
          {ambient && (
            <div style={{
              fontFamily: mono, fontSize: 9, letterSpacing: 1, color: '#9b7fe0', opacity: 0.7,
              marginTop: 24, fontStyle: 'italic',
            }}>
              {ambient.agentId.toUpperCase()} // "{ambient.line}"
            </div>
          )}
        </div>
      )}

      <style>{`
        .etereo-intro { animation: etereo-fade 4.2s ease forwards; }
        @keyframes etereo-fade {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
