'use client'

import { useEffect, useRef, useState } from 'react'
import { agents } from '@/components/proxyverse/agents'
import { recordGrietaFragment, GRIETA_DONOR_IDS } from '@/components/proxyverse/identity'

const DONOR_COLORS = GRIETA_DONOR_IDS.map(id => agents.find(a => a.id === id)!.color)

// A propósito mucho más raro que ProxyBiodiversity (que aparece garantizado
// cada 55-80s): acá se tira una moneda cada CHECK_INTERVAL_MS, y la mayoría
// de las veces no pasa nada. Tiempo medio hasta la primera aparición ≈
// CHECK_INTERVAL_MS / SPAWN_CHANCE ≈ 12-13 minutos de pestaña visible — una
// visita típica no debería encontrar una sin quedarse un rato largo.
const CHECK_INTERVAL_MS = 90_000
const SPAWN_CHANCE = 0.12
const VISIBLE_MS = 14_000

type ActiveGrieta = { id: number; top: number; left: number }

let grietaId = 0

export default function Grieta() {
  const [active, setActive] = useState<ActiveGrieta | null>(null)
  const [resolving, setResolving] = useState(false)
  // El setInterval de abajo vive en un solo efecto de montaje (no se
  // reprograma en cada render), así que su closure se queda con los
  // valores de active/resolving del primer render para siempre si los lee
  // directo del state — de ahí los refs, que sí reflejan el valor actual
  // en cada tick sin tener que recrear el interval.
  const activeRef = useRef<ActiveGrieta | null>(null)
  const resolvingRef = useRef(false)
  const despawnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return

    const spawn = () => {
      const next = {
        id: ++grietaId,
        top: 12 + Math.random() * 70,
        left: 8 + Math.random() * 80,
      }
      activeRef.current = next
      resolvingRef.current = false
      setActive(next)
      setResolving(false)
      despawnTimer.current = setTimeout(() => {
        activeRef.current = null
        setActive(null)
      }, VISIBLE_MS)
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      if (activeRef.current || resolvingRef.current) return
      if (Math.random() < SPAWN_CHANCE) spawn()
    }, CHECK_INTERVAL_MS)

    return () => {
      window.clearInterval(interval)
      if (despawnTimer.current) window.clearTimeout(despawnTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClick = () => {
    if (!activeRef.current || resolvingRef.current) return
    if (despawnTimer.current) window.clearTimeout(despawnTimer.current)
    resolvingRef.current = true
    setResolving(true)
    const donorId = GRIETA_DONOR_IDS[Math.floor(Math.random() * GRIETA_DONOR_IDS.length)]
    recordGrietaFragment(donorId)
    window.setTimeout(() => {
      activeRef.current = null
      setActive(null)
    }, 420)
  }

  if (!active) return null

  return (
    <button
      onClick={handleClick}
      aria-label="Grieta"
      style={{
        position: 'fixed', top: `${active.top}vh`, left: `${active.left}vw`,
        width: 36, height: 36, padding: 7, border: 'none', background: 'transparent',
        cursor: 'pointer', zIndex: 60,
      }}
      className={resolving ? 'grieta-resolve' : 'grieta-idle'}
    >
      <svg width="22" height="22" viewBox="0 0 22 22">
        <g className="grieta-shimmer" strokeWidth="1.4" fill="none" strokeLinecap="round">
          <path d="M11 1 L7 9 L13 10 L8 21" />
          <path d="M11 1 L15 9 L9 11 L14 21" opacity="0.5" />
        </g>
      </svg>

      <style>{`
        .grieta-shimmer path {
          animation: grieta-cycle 1.6s steps(${DONOR_COLORS.length}) infinite;
        }
        .grieta-shimmer path:last-child {
          animation-delay: 0.26s;
        }
        @keyframes grieta-cycle {
          ${DONOR_COLORS.map((c, i) => `${Math.round((i / DONOR_COLORS.length) * 100)}% { stroke: ${c}; }`).join('\n          ')}
          100% { stroke: ${DONOR_COLORS[0]}; }
        }
        .grieta-idle {
          animation: grieta-breathe 1.8s ease-in-out infinite;
        }
        @keyframes grieta-breathe {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.12); }
        }
        .grieta-resolve {
          animation: grieta-dissolve 0.42s ease-out forwards;
          pointer-events: none;
        }
        @keyframes grieta-dissolve {
          0% { opacity: 1; transform: scale(1.15); filter: blur(0); }
          100% { opacity: 0; transform: scale(2.2); filter: blur(3px); }
        }
      `}</style>
    </button>
  )
}
