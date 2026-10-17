// Matchea el frame actual de NeoCam contra el agente de Proxyverse cuyo
// color canónico (agents.ts) esté más cerca del color dominante de la
// captura — pensado para modos de paleta sólida (AURA, INFRARED, SILHOUETTE,
// HOLOGRAM), donde el color dominante realmente representa algo, pero
// funciona sobre cualquier frame.

import { agents, type ProxyAgent } from '@/components/proxyverse/agents'

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

const MAX_DIST = Math.sqrt(255 * 255 * 3)

// Promedia el color de los pixeles NO casi-negros de un canvas reducido a
// 24x24 — en AURA/INFRARED/SILHOUETTE el fondo es negro puro, así que
// promediar todo sesgaría el resultado hacia negro en vez de reflejar el
// color real de la silueta/aura.
export function dominantColor(source: HTMLCanvasElement): [number, number, number] {
  const tiny = document.createElement('canvas')
  tiny.width = 24
  tiny.height = 24
  const tctx = tiny.getContext('2d')!
  tctx.drawImage(source, 0, 0, 24, 24)
  const data = tctx.getImageData(0, 0, 24, 24).data
  let r = 0, g = 0, b = 0, n = 0
  for (let i = 0; i < data.length; i += 4) {
    const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    if (lum < 18) continue
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++
  }
  if (n === 0) return [data[0] || 0, data[1] || 0, data[2] || 0]
  return [r / n, g / n, b / n]
}

export type PortraitMatch = { agent: ProxyAgent; affinity: number }

export function matchAgentFromCanvas(source: HTMLCanvasElement): PortraitMatch {
  const [r, g, b] = dominantColor(source)
  let best: ProxyAgent = agents[0]
  let bestDist = Infinity
  for (const a of agents) {
    const [ar, ag, ab] = hexToRgb(a.color)
    const d = Math.hypot(r - ar, g - ag, b - ab)
    if (d < bestDist) { bestDist = d; best = a }
  }
  const affinity = Math.max(0, Math.round((1 - bestDist / MAX_DIST) * 100))
  return { agent: best, affinity }
}
