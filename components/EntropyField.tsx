'use client'

import { useEffect, useRef, useState } from 'react'

const POLL_MS = 45_000

type GlitchBar = { id: number; top: number; height: number }

// La entropía que el Overseer purga/inyecta desde /admin/overseer (ver
// app/admin/actions.ts) deja de ser un número de panel cerrado: acá se lee
// en vivo y hace que el sitio entero reaccione para cualquier visitante —
// el ruido de fondo (ya existente en layout.tsx, ahora reactivo vía la
// variable CSS --neo-entropy) se intensifica, y por encima de cierto nivel
// empiezan a aparecer barras de glitch sueltas. En el estado normal
// (entropía en 0, que es el default tras un purgeEntropy) esto es
// invisible — no hay nada que simular, es lo que realmente hay.
const BURST_THRESHOLD = 25

let barId = 0

export default function EntropyField() {
  const [bars, setBars] = useState<GlitchBar[]>([])
  const entropyRef = useRef(0)
  const burstTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const applyEntropy = (level: number) => {
      const clamped = Math.max(0, Math.min(100, level))
      entropyRef.current = clamped
      document.documentElement.style.setProperty('--neo-entropy', String(clamped / 100))
    }

    const poll = async () => {
      try {
        const res = await fetch('/api/entropy', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (typeof data?.entropyLevel === 'number') applyEntropy(data.entropyLevel)
      } catch {
        // sin conexión momentánea: queda el último valor conocido, no hay
        // nada que reportarle al visitante por esto
      }
    }

    poll()
    const pollId = window.setInterval(poll, POLL_MS)

    if (reducedMotion) return () => window.clearInterval(pollId)

    const scheduleBurst = () => {
      const level = entropyRef.current
      // probabilidad y cadencia crecen con la entropía real — a 0 nunca
      // dispara (1/(1+100)*8s ≈ nunca en la práctica), a 100 es casi
      // constante.
      const delay = 8000 / (1 + level / 8)
      burstTimerRef.current = window.setTimeout(() => {
        if (document.visibilityState === 'visible' && entropyRef.current >= BURST_THRESHOLD) {
          const id = ++barId
          setBars(prev => [...prev, { id, top: Math.random() * 100, height: 2 + Math.random() * 10 }])
          window.setTimeout(() => setBars(prev => prev.filter(b => b.id !== id)), 550)
        }
        scheduleBurst()
      }, delay)
    }
    scheduleBurst()

    return () => {
      window.clearInterval(pollId)
      if (burstTimerRef.current) window.clearTimeout(burstTimerRef.current)
    }
  }, [])

  return (
    <>
      {bars.map(b => (
        <div
          key={b.id}
          aria-hidden="true"
          className="entropy-glitch-bar"
          style={{ top: `${b.top}%`, height: `${b.height}px` }}
        >
          <div style={{ position: 'absolute', inset: 0, background: '#ff2d55', opacity: 0.35, transform: 'translateX(-6px)' }} />
          <div style={{ position: 'absolute', inset: 0, background: '#00d4ff', opacity: 0.35, transform: 'translateX(6px)' }} />
        </div>
      ))}
    </>
  )
}
