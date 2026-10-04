'use client'

import { useEffect, useRef, useState } from 'react'
import { agents, pickRandom } from '@/components/proxyverse/agents'

const BASE_INTERVAL_MS = 55_000
const JITTER_MS = 25_000
const MIN_TEXT_LENGTH = 40

type Specimen = {
  id: number
  color: string
  top: number
  left: number
  width: number
  height: number
  duration: number
}

let specimenId = 0

// Candidatos: bloques de texto con contenido real, visibles por completo
// en el viewport (ni tapados por el nav fijo arriba, ni cortados abajo).
function pickTarget(): HTMLElement | null {
  const candidates = Array.from(document.querySelectorAll('p, li, blockquote')) as HTMLElement[]
  const visible = candidates.filter(el => {
    const text = el.textContent?.trim() ?? ''
    if (text.length < MIN_TEXT_LENGTH) return false
    const rect = el.getBoundingClientRect()
    return rect.top > 80 && rect.bottom < window.innerHeight - 40 && rect.width > 120
  })
  if (visible.length === 0) return null
  return visible[Math.floor(Math.random() * visible.length)]
}

// Especímenes que cruzan el texto visible en pantalla — el sitio como
// ecosistema además de contenido. Nunca toca los nodos de texto reales
// (evitaría pelearse con el reconciliador de React); en cambio, un overlay
// fixed posicionado con getBoundingClientRect() barre por encima en
// mix-blend-mode, dejando un brillo de paso. Cada espécimen toma el color
// de un agente al azar, mismo criterio que PROXYBILIDAD en el casino.
export default function ProxyBiodiversity() {
  const [specimen, setSpecimen] = useState<Specimen | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const despawnRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return

    const scheduleNext = () => {
      const delay = BASE_INTERVAL_MS + Math.random() * JITTER_MS
      timerRef.current = setTimeout(spawn, delay)
    }

    const spawn = () => {
      if (document.visibilityState !== 'visible') {
        scheduleNext()
        return
      }
      const target = pickTarget()
      if (!target) {
        scheduleNext()
        return
      }
      const rect = target.getBoundingClientRect()
      const agent = pickRandom(agents.filter(a => a.id !== 'darkproxy'))
      const duration = Math.min(5, Math.max(2.2, rect.width / 220))
      const next: Specimen = {
        id: ++specimenId,
        color: agent.color,
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        duration,
      }
      setSpecimen(next)
      if (despawnRef.current) clearTimeout(despawnRef.current)
      despawnRef.current = setTimeout(() => setSpecimen(null), duration * 1000 + 200)
      scheduleNext()
    }

    scheduleNext()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (despawnRef.current) clearTimeout(despawnRef.current)
    }
  }, [])

  if (!specimen) return null

  const barWidth = 90
  const sweepEnd = Math.max(0, specimen.width - barWidth)

  return (
    <div
      key={specimen.id}
      aria-hidden="true"
      style={{
        position: 'fixed', top: specimen.top, left: specimen.left,
        width: specimen.width, height: specimen.height,
        zIndex: 40, pointerEvents: 'none', overflow: 'hidden',
      }}
    >
      <div
        className="bio-sweep"
        style={{
          position: 'absolute', top: 0, left: 0, height: '100%', width: barWidth,
          background: `linear-gradient(90deg, transparent, ${specimen.color}4d, ${specimen.color}1a, transparent)`,
          mixBlendMode: 'screen',
          animation: `bio-crawl-${specimen.id} ${specimen.duration}s linear forwards`,
        }}
      >
        <svg
          width="26" height="20" viewBox="0 0 26 20"
          style={{ position: 'absolute', top: '50%', right: -4, transform: 'translateY(-50%)' }}
        >
          <ellipse cx="13" cy="10" rx="4" ry="3" fill={specimen.color} opacity="0.9" />
          <g stroke={specimen.color} strokeWidth="1" opacity="0.8" className="bio-legs-a">
            <line x1="11" y1="9" x2="2" y2="3" />
            <line x1="11" y1="10" x2="1" y2="10" />
            <line x1="11" y1="11" x2="2" y2="17" />
          </g>
          <g stroke={specimen.color} strokeWidth="1" opacity="0.8" className="bio-legs-b">
            <line x1="15" y1="9" x2="24" y2="3" />
            <line x1="15" y1="10" x2="25" y2="10" />
            <line x1="15" y1="11" x2="24" y2="17" />
          </g>
        </svg>
      </div>

      <style>{`
        @keyframes bio-crawl-${specimen.id} {
          0% { transform: translateX(0); opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { transform: translateX(${sweepEnd}px); opacity: 0; }
        }
        .bio-legs-a, .bio-legs-b {
          transform-origin: 13px 10px;
          animation: bio-twitch 0.22s ease-in-out infinite alternate;
        }
        .bio-legs-b { animation-direction: alternate-reverse; }
        @keyframes bio-twitch {
          from { transform: rotate(-6deg); }
          to { transform: rotate(6deg); }
        }
      `}</style>
    </div>
  )
}
