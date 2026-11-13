'use client'

import { useEffect, useRef, useState } from 'react'
import { getSitePusher, SITE_PRESENCE_CHANNEL } from './pusher/siteConnection'

// Lectura de estado global, ambiente — no es un panel, sigue siendo "una
// línea de status" en el sentido de que no interactúa ni pide atención,
// pero ahora son tres: conexión real de esta sesión (uptime del socket,
// no un timer decorativo), estado del sistema (entropía real del
// Overseer, mismo endpoint público que ya usa EntropyField) y presencia
// real (mismo canal de Pusher que ya leía esto). Nada acá es inventado —
// pedido explícito a partir de un mockup que mostraba un widget similar,
// pero con datos reales en vez de los números de muestra de esa imagen.

const ENTROPY_POLL_MS = 45_000

function systemStatus(level: number): { label: string; color: string } {
  if (level <= 25) return { label: 'ESTABLE', color: '#00d4ff' }
  if (level <= 60) return { label: 'INESTABLE', color: '#ffb800' }
  return { label: 'CRÍTICO', color: '#ff2d55' }
}

function formatUptime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function PresenceCounter() {
  const [count, setCount] = useState<number | null>(null)
  const [entropyLevel, setEntropyLevel] = useState<number | null>(null)
  const [uptime, setUptime] = useState(0)
  const connectedAtRef = useRef<number | null>(null)

  useEffect(() => {
    const { pusher } = getSitePusher()
    const channel = pusher.subscribe(SITE_PRESENCE_CHANNEL)

    channel.bind('pusher:subscription_succeeded', (members: { count: number }) => {
      setCount(members.count)
      connectedAtRef.current = Date.now()
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

  useEffect(() => {
    const tick = () => {
      if (connectedAtRef.current !== null) {
        setUptime(Math.floor((Date.now() - connectedAtRef.current) / 1000))
      }
    }
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/entropy', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (typeof data?.entropyLevel === 'number') setEntropyLevel(data.entropyLevel)
      } catch {
        // sin conexión momentánea: queda el último valor conocido
      }
    }
    poll()
    const id = window.setInterval(poll, ENTROPY_POLL_MS)
    return () => window.clearInterval(id)
  }, [])

  if (count === null) return null

  const sys = entropyLevel !== null ? systemStatus(entropyLevel) : null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', bottom: 10, left: 14, zIndex: 999,
        fontFamily: "'Space Mono', monospace", fontSize: 8, letterSpacing: 1.5,
        lineHeight: 1.7, pointerEvents: 'none', userSelect: 'none',
      }}
    >
      <div style={{ color: '#00d4ff55' }}>RED // CONECTADO [{formatUptime(uptime)}]</div>
      {sys && <div style={{ color: `${sys.color}55` }}>SISTEMA // {sys.label}</div>}
      <div style={{ color: '#00d4ff55' }}>OPERADORES // {count} EN LÍNEA</div>
    </div>
  )
}
