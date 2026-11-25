'use client'

import { useEffect, useRef } from 'react'
import type { CapasEvent, EventKind } from '@/lib/capas/events'

const mono = "'Space Mono', monospace"
export const EVENT_COLOR: Record<EventKind, string> = { birth: '#ff4059', split: '#4de5ff', merge: '#ffcc40', death: '#c0ccdd' }
export const EVENT_LABEL: Record<EventKind, string> = { birth: 'nacimientos', split: 'divisiones', merge: 'fusiones', death: 'muertes' }
const LANES: EventKind[] = ['birth', 'split', 'merge', 'death']

type Props = {
  pop: Uint16Array | null; solid: Float32Array | null; peak: number; events: CapasEvent[]; planned: number; count: number; cut: number
  accent: string; onScrub: (slice: number) => void
}

// La línea de tiempo es también el cabezal de impresión: arrastrarla sube y baja
// el corte del sólido. Muestra cuántas partes vivas hay en cada capa y dónde
// nacen, se dividen, se funden o mueren.
export default function Timeline({ pop, solid, peak, events, planned, count, cut, accent, onScrub }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const down = useRef(false)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const W = c.clientWidth, H = c.clientHeight
    if (!W || !H) return
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr)
    const g = c.getContext('2d')!
    g.scale(dpr, dpr)
    g.clearRect(0, 0, W, H)
    const x0 = 10, x1 = W - 10, laneH = 6, lanesTop = H - 4 - LANES.length * (laneH + 2), plotBottom = lanesTop - 6, plotTop = 16
    const X = (s: number) => x0 + ((x1 - x0) * s) / Math.max(1, planned - 1)
    // lo que aún no existe
    g.fillStyle = 'rgba(255,255,255,0.035)'
    g.fillRect(X(count - 1), plotTop - 6, x1 - X(count - 1), H)
    g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1
    for (let i = 0; i <= 4; i++) { const y = plotBottom - ((plotBottom - plotTop) * i) / 4; g.beginPath(); g.moveTo(x0, y + 0.5); g.lineTo(x1, y + 0.5); g.stroke() }
    // partes vivas por capa
    if (pop && pop.length > 1) {
      const top = Math.max(1, peak)
      g.beginPath(); g.moveTo(X(0), plotBottom)
      for (let s = 0; s < pop.length; s++) g.lineTo(X(s), plotBottom - ((plotBottom - plotTop) * pop[s]) / top)
      g.lineTo(X(pop.length - 1), plotBottom); g.closePath()
      g.fillStyle = accent + '33'; g.fill()
      g.beginPath()
      for (let s = 0; s < pop.length; s++) { const y = plotBottom - ((plotBottom - plotTop) * pop[s]) / top; if (s) g.lineTo(X(s), y); else g.moveTo(X(s), y) }
      g.strokeStyle = accent; g.lineWidth = 1.4; g.stroke()
    }
    // fracción sólida de cada capa (cuánto del mundo se imprime)
    if (solid && solid.length > 1) {
      let mx = 0.001; for (let s = 0; s < solid.length; s++) if (solid[s] > mx) mx = solid[s]
      g.beginPath()
      for (let s = 0; s < solid.length; s++) { const y = plotBottom - ((plotBottom - plotTop) * solid[s]) / mx; if (s) g.lineTo(X(s), y); else g.moveTo(X(s), y) }
      g.strokeStyle = 'rgba(255,255,255,0.55)'; g.setLineDash([3, 3]); g.lineWidth = 1; g.stroke(); g.setLineDash([])
    }
    // eventos, un carril por clase
    for (const e of events) {
      const lane = LANES.indexOf(e.kind)
      g.fillStyle = EVENT_COLOR[e.kind]
      g.fillRect(Math.round(X(e.slice)), lanesTop + lane * (laneH + 2), 2, laneH)
    }
    // cabezal
    const xc = X(Math.max(0, Math.min(planned - 1, cut)))
    g.strokeStyle = '#fff'; g.lineWidth = 1.5
    g.beginPath(); g.moveTo(xc, plotTop - 8); g.lineTo(xc, H - 2); g.stroke()
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(xc - 5, plotTop - 12); g.lineTo(xc + 5, plotTop - 12); g.lineTo(xc, plotTop - 5); g.closePath(); g.fill()
    g.font = `9.5px ${mono}`; g.fillStyle = '#6f86a3'
    g.fillText('BASE · PASADO', x0, 9); g.textAlign = 'center'; g.fillText('línea: partes vivas · discontinua: área sólida', (x0 + x1) / 2, 9); g.textAlign = 'right'; g.fillText('CIMA · PRESENTE', x1, 9)
  }, [pop, solid, peak, events, planned, count, cut, accent])

  const scrub = (e: { clientX: number }) => {
    const c = ref.current
    if (!c) return
    const r = c.getBoundingClientRect()
    const u = (e.clientX - r.left - 10) / Math.max(1, r.width - 20)
    onScrub(Math.max(0, Math.min(count - 1, u * (planned - 1))))
  }
  return (
    <canvas
      ref={ref}
      onPointerDown={(e) => { down.current = true; e.currentTarget.setPointerCapture(e.pointerId); scrub(e) }}
      onPointerMove={(e) => { if (down.current) scrub(e) }}
      onPointerUp={() => { down.current = false }}
      onPointerCancel={() => { down.current = false }}
      style={{ width: '100%', height: 112, display: 'block', cursor: 'ew-resize', touchAction: 'none', background: '#05080d', border: '1px solid #ffffff12' }}
      aria-label="Línea de tiempo de la pieza: arrastra para mover el cabezal de impresión"
    />
  )
}
