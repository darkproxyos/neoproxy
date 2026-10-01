'use client'

import { useEffect, useState } from 'react'
import PusherClient from 'pusher-js'

// Cuenta operadores conectados en tiempo real vía un canal de presencia.
// A propósito es casi invisible — una línea más de status, no un widget.
export default function PresenceCounter() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const pusher = new PusherClient('e1dd2b8f196d106ff74f', {
      cluster: 'mt1',
      authEndpoint: '/api/pusher/auth',
    })
    const channel = pusher.subscribe('presence-neoproxy-site')

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
      pusher.unsubscribe('presence-neoproxy-site')
      pusher.disconnect()
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
