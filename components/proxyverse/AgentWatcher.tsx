'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { agents, getAmbientLine } from '@/components/proxyverse/agents'

const IDLE_MS = 50_000
const COOLDOWN_MS = 25_000
const TOAST_MS = 6_500
const RETURN_MIN_AWAY_MS = 12_000

type Toast = { agentId: string; line: string }

// Hace que los agentes reaccionen a lo que realmente hacés en el sitio —
// no es un timer ciego: te quedás quieto, te vas y volvés, o llegás al
// fondo de una página larga, y alguno comenta. Un toast chico, con cooldown
// para no ser invasivo, montado en todo el sitio.
export default function AgentWatcher() {
  const [toast, setToast] = useState<Toast | null>(null)
  const lastToastAt = useRef(0)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const fire = () => {
      const now = Date.now()
      if (now - lastToastAt.current < COOLDOWN_MS) return
      lastToastAt.current = now
      const { agentId, line } = getAmbientLine()
      setToast({ agentId, line })
      if (toastTimer.current) clearTimeout(toastTimer.current)
      toastTimer.current = setTimeout(() => setToast(null), TOAST_MS)
    }

    // Idle: nadie tocó nada por un rato
    let idleTimer: ReturnType<typeof setTimeout>
    const resetIdle = () => {
      clearTimeout(idleTimer)
      idleTimer = setTimeout(fire, IDLE_MS)
    }
    const activityEvents = ['mousemove', 'scroll', 'keydown', 'touchstart', 'pointerdown'] as const
    activityEvents.forEach(ev => window.addEventListener(ev, resetIdle, { passive: true }))
    resetIdle()

    // Volver a la pestaña después de estar afuera un rato
    let hiddenAt = 0
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
      } else if (hiddenAt && Date.now() - hiddenAt > RETURN_MIN_AWAY_MS) {
        fire()
        hiddenAt = 0
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // Fondo de una página larga, una sola vez
    let deepScrollFired = false
    const handleScroll = () => {
      if (deepScrollFired || reducedMotion) return
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max > 400 && window.scrollY / max > 0.9) {
        deepScrollFired = true
        fire()
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      clearTimeout(idleTimer)
      if (toastTimer.current) clearTimeout(toastTimer.current)
      activityEvents.forEach(ev => window.removeEventListener(ev, resetIdle))
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  if (!toast) return null

  const agent = agents.find(a => a.id === toast.agentId)
  const color = agent?.color ?? '#00d4ff'

  return (
    <div
      className="agent-watcher-toast"
      style={{
        position: 'fixed', bottom: 78, right: 24, zIndex: 998, maxWidth: 280,
        background: '#010810ee', border: `1px solid ${color}44`, backdropFilter: 'blur(12px)',
        padding: '12px 14px', fontFamily: "'Space Mono', monospace", pointerEvents: 'none',
        boxShadow: `0 0 24px ${color}22`,
      }}
    >
      <Link
        href={`/proxyverse/${toast.agentId}`}
        style={{ fontSize: 9, color, letterSpacing: 2, textDecoration: 'none', pointerEvents: 'auto' }}
      >
        {agent?.name ?? toast.agentId.toUpperCase()}
      </Link>
      <div style={{ fontSize: 11, color: '#c8daf0', lineHeight: 1.6, marginTop: 6 }}>
        "{toast.line}"
      </div>
      <style>{`
        .agent-watcher-toast {
          animation: agent-watcher-in 0.4s ease, agent-watcher-out 0.4s ease ${(TOAST_MS - 400) / 1000}s forwards;
        }
        @keyframes agent-watcher-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes agent-watcher-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
