'use client'

import { useEffect, useState } from 'react'

type Burst = { id: number; x: number; y: number }

const COOLDOWN_MS = 90
let burstId = 0

// Feedback táctil simulado: 1 frame de split RGB en el punto real donde
// tocaste, disparado por un pointerdown real, no por un timer propio ni un
// efecto de hover decorativo.
export default function ClickDesync() {
  const [bursts, setBursts] = useState<Burst[]>([])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let lastAt = 0
    const onPointerDown = (e: PointerEvent) => {
      const now = performance.now()
      if (now - lastAt < COOLDOWN_MS) return
      lastAt = now
      const id = ++burstId
      setBursts(prev => [...prev.slice(-4), { id, x: e.clientX, y: e.clientY }])
      window.setTimeout(() => setBursts(prev => prev.filter(b => b.id !== id)), 150)
    }

    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [])

  return (
    <>
      {bursts.map(b => (
        <div key={b.id} aria-hidden="true" className="click-desync" style={{ left: b.x, top: b.y }} />
      ))}
    </>
  )
}
