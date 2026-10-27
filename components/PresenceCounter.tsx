'use client'

import { useEffect, useState } from 'react'
import { getSitePusher, SITE_PRESENCE_CHANNEL } from './pusher/siteConnection'

// Cuenta operadores conectados en tiempo real vía un canal de presencia.
// A propósito es casi invisible — una línea más de status, no un widget.
// Comparte conexión con GhostPresence (ver components/pusher/siteConnection.ts)
// en vez de abrir un segundo socket al mismo canal.
export default function PresenceCounter() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const { pusher } = getSitePusher()
    const channel = pusher.subscribe(SITE_PRESENCE_CHANNEL)

    channel.bind('pusher:subscription_succeeded', (members: { count: number }) => {
      setCount(members.count)
    })
    channel.bind('pusher:member_added', () => {
      setCount(c => (c ?? 0) + 1)
    })
    channel.bind('pusher:member_removed', () => {
      setCount(c => (c !== null ? Math.max(0, c - 1) : c))
    })

    return () => {
      channel.unbind('pusher:subscription_succeeded')
      channel.unbind('pusher:member_added')
      channel.unbind('pusher:member_removed')
    }
  }, [])

  if (count === null) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', bottom: 10, left: 14, zIndex: 999,
        fontFamily: "'Space Mono', monospace", fontSize: 8, letterSpacing: 2,
        color: '#00d4ff28', pointerEvents: 'none', userSelect: 'none',
      }}
    >
      OPERATORS_ONLINE: {count}
    </div>
  )
}
