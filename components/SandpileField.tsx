'use client'

import { useEffect, useRef, useState } from 'react'
import PusherClient from 'pusher-js'

const THRESHOLD = 5
const BURST_COUNT = 10

type Avalanche = { id: number; bars: { top: number; delay: number }[] }

let avalancheId = 0

// Modelo de sandpile (Bak): granos chicos y reales (cada mensaje real que
// CUALQUIERA manda por el chat global, components/Chat.tsx) se acumulan
// hasta un umbral, y ahí sueltan una avalancha visible de una sola vez —
// no es un timer propio, es la cuenta real de mensajes desde la última
// avalancha la que decide cuándo pasa. Nadie "causa" la avalancha a
// propósito: el que manda el mensaje número 5 no sabe que es ese.
export default function SandpileField() {
  const [avalanche, setAvalanche] = useState<Avalanche | null>(null)
  const grainsRef = useRef(0)

  useEffect(() => {
    const pusher = new PusherClient('e1dd2b8f196d106ff74f', { cluster: 'mt1' })
    const ch = pusher.subscribe('neoproxy-chat')

    const onMessage = () => {
      grainsRef.current += 1
      if (grainsRef.current >= THRESHOLD) {
        grainsRef.current = 0
        const id = ++avalancheId
        const bars = Array.from({ length: BURST_COUNT }, () => ({
          top: Math.random() * 100,
          delay: Math.random() * 0.4,
        }))
        setAvalanche({ id, bars })
        window.setTimeout(() => {
          setAvalanche(prev => (prev?.id === id ? null : prev))
        }, 900)
      }
    }
    ch.bind('message', onMessage)

    return () => {
      ch.unbind('message', onMessage)
      pusher.disconnect()
    }
  }, [])

  if (!avalanche) return null

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 998, pointerEvents: 'none', overflow: 'hidden' }}>
      {avalanche.bars.map((b, i) => (
        <div
          key={i}
          className="entropy-glitch-bar"
          style={{
            top: `${b.top}%`, height: '3px', animationDelay: `${b.delay}s`,
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: '#ff2d55', opacity: 0.3, transform: 'translateX(-6px)' }} />
          <div style={{ position: 'absolute', inset: 0, background: '#00d4ff', opacity: 0.3, transform: 'translateX(6px)' }} />
        </div>
      ))}
    </div>
  )
}
