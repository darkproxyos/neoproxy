'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getSitePusher, SITE_PRESENCE_CHANNEL } from './pusher/siteConnection'

type Peer = { depth: number; seenAt: number }

const SCROLL_THROTTLE_MS = 700
const STALE_MS = 12_000
const PRUNE_INTERVAL_MS = 4_000

// Sombra de a dónde está mirando el resto de los visitantes reales de ESTA
// misma página en este momento — no un mapa de calor histórico ni un
// agregado del sitio entero, solo el ahora, y solo gente real conectada al
// mismo canal de presencia (ver GhostPresence.tsx, mismo canal, misma
// conexión compartida vía siteConnection.ts). Si estás solo en la página,
// no hay nada que mostrar.
export default function ScrollHeatmap() {
  const pathname = usePathname()
  const [peers, setPeers] = useState<Record<string, Peer>>({})
  const selfIdRef = useRef<string | null>(null)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const { pusher, visitorId } = getSitePusher()
    selfIdRef.current = visitorId
    const channel = pusher.subscribe(SITE_PRESENCE_CHANNEL)
    setPeers({})

    const onDepth = (data: { visitorId: string; pathname: string; depth: number }) => {
      if (data.visitorId === selfIdRef.current || data.pathname !== pathname) return
      setPeers(prev => ({ ...prev, [data.visitorId]: { depth: data.depth, seenAt: Date.now() } }))
    }
    channel.bind('scroll-depth', onDepth)

    const pruneId = window.setInterval(() => {
      const now = Date.now()
      setPeers(prev => {
        const next: Record<string, Peer> = {}
        for (const [id, p] of Object.entries(prev)) {
          if (now - p.seenAt < STALE_MS) next[id] = p
        }
        return next
      })
    }, PRUNE_INTERVAL_MS)

    let scrollHandler: (() => void) | null = null
    if (!reducedMotion) {
      let lastSent = 0
      scrollHandler = () => {
        const now = performance.now()
        if (now - lastSent < SCROLL_THROTTLE_MS) return
        lastSent = now
        const max = document.documentElement.scrollHeight - window.innerHeight
        const depth = max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0
        fetch('/api/presence/scroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId, pathname, depth }),
          keepalive: true,
        }).catch(() => {})
      }
      window.addEventListener('scroll', scrollHandler, { passive: true })
    }

    return () => {
      channel.unbind('scroll-depth', onDepth)
      window.clearInterval(pruneId)
      if (scrollHandler) window.removeEventListener('scroll', scrollHandler)
    }
  }, [pathname])

  const entries = Object.values(peers)
  if (entries.length === 0) return null

  return (
    <div aria-hidden="true" style={{ position: 'fixed', top: 0, right: 0, width: 3, height: '100vh', zIndex: 996, pointerEvents: 'none' }}>
      {entries.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', right: 0, top: `${p.depth * 100}%`, width: 3, height: 3,
            borderRadius: '50%', background: '#00d4ff', opacity: 0.5, boxShadow: '0 0 6px #00d4ffaa',
            transform: 'translateY(-50%)',
          }}
        />
      ))}
    </div>
  )
}
