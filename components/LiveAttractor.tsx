'use client'

import { useEffect, useRef, useState } from 'react'
import { attractors } from '@/app/lab/atractores/engine/attractors'
import { getSitePusher, SITE_PRESENCE_CHANNEL } from './pusher/siteConnection'

const GREEN = '#39ff14'
const POLL_MS = 20_000
const MAX_TRAIL = 480
const MIN_TRAIL = 60

// Mismo sistema de Lorenz que ya corre en /lab/atractores (reusado tal
// cual, ver engine/attractors.ts), pero con dos parámetros reales en vez
// de los defaults fijos: rho sube con la entropía real del sistema (más
// caótico cuanto más alta), y el largo del rastro crece con la cantidad
// real de visitantes conectados ahora mismo — el atractor literalmente
// dibuja el estado actual del organismo, no una animación de stock.
export default function LiveAttractor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({ x: 0.1, y: 0, z: 0 })
  const trailRef = useRef<{ x: number; y: number }[]>([])
  const entropyRef = useRef(0)
  const visitorsRef = useRef(1)
  const rafRef = useRef<number | null>(null)
  const [entropyShown, setEntropyShown] = useState(0)
  const [visitorsShown, setVisitorsShown] = useState(1)

  useEffect(() => {
    let cancelled = false

    const pollEntropy = async () => {
      try {
        const res = await fetch('/api/entropy', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && typeof data?.entropyLevel === 'number') {
          entropyRef.current = data.entropyLevel
          setEntropyShown(Math.round(data.entropyLevel))
        }
      } catch {
        // queda el último valor conocido
      }
    }
    pollEntropy()
    const pollId = window.setInterval(pollEntropy, POLL_MS)

    const { pusher } = getSitePusher()
    const channel = pusher.subscribe(SITE_PRESENCE_CHANNEL)
    const updateCount = (n: number) => {
      visitorsRef.current = Math.max(1, n)
      setVisitorsShown(visitorsRef.current)
    }
    const onSub = (members: { count: number }) => updateCount(members.count)
    const onAdd = () => updateCount(visitorsRef.current + 1)
    const onRemove = () => updateCount(visitorsRef.current - 1)
    channel.bind('pusher:subscription_succeeded', onSub)
    channel.bind('pusher:member_added', onAdd)
    channel.bind('pusher:member_removed', onRemove)

    const canvas = canvasRef.current!
    const W = canvas.width, H = canvas.height
    const lorenz = attractors.lorenz

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick)
      const rho = 20 + entropyRef.current * 0.16
      const params = { ...lorenz.params, rho }
      const next = lorenz.step(params as any, Math.random, stateRef.current)
      stateRef.current = next

      const px = W / 2 + next.x * lorenz.scale * 9
      const py = H / 2 + next.z * lorenz.scale * 6 - 30
      trailRef.current.push({ x: px, y: py })
      const maxTrail = Math.round(MIN_TRAIL + (MAX_TRAIL - MIN_TRAIL) * Math.min(1, visitorsRef.current / 8))
      if (trailRef.current.length > maxTrail) trailRef.current.shift()

      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, W, H)
      const trail = trailRef.current
      for (let i = 1; i < trail.length; i++) {
        const alpha = i / trail.length
        ctx.beginPath()
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y)
        ctx.lineTo(trail[i].x, trail[i].y)
        ctx.strokeStyle = `${GREEN}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      window.clearInterval(pollId)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      channel.unbind('pusher:subscription_succeeded', onSub)
      channel.unbind('pusher:member_added', onAdd)
      channel.unbind('pusher:member_removed', onRemove)
    }
  }, [])

  return (
    <div style={{ border: `1px solid ${GREEN}33`, background: `${GREEN}06`, padding: 14 }}>
      <div style={{ fontSize: 8, color: `${GREEN}88`, letterSpacing: 2, marginBottom: 8, fontFamily: "'Space Mono', monospace" }}>
        ATRACTOR DE LORENZ — ρ = 20 + ENTROPÍA×0.16 · RASTRO ∝ {visitorsShown} CONECTADOS
      </div>
      <canvas ref={canvasRef} width={320} height={200} style={{ width: '100%', height: 'auto', display: 'block' }} />
      <div style={{ fontSize: 8, color: '#4a6080', letterSpacing: 1, marginTop: 6, fontFamily: "'Space Mono', monospace" }}>
        ENTROPÍA REAL: {entropyShown}%
      </div>
    </div>
  )
}
