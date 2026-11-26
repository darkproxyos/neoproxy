'use client'

import { useEffect, useRef } from 'react'

// Diagrama de la trenza: tres hebras horizontales (una por cuerpo, ordenadas por su x al
// comienzo) y un cruce por cada letra de la palabra. σᵢ cruza las filas i e i+1; con signo
// + pasa por encima la hebra que sube de fila.
export default function BraidDiagram({ word, start, colors, progress = 1 }: { word: number[]; start: number[]; colors: string[]; progress?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = c.clientWidth, H = c.clientHeight
    if (!W || !H) return
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr)
    const g = c.getContext('2d')!
    g.scale(dpr, dpr); g.clearRect(0, 0, W, H)
    const pad = 14, rowY = (r: number) => 16 + (r * (H - 32)) / 2, n = Math.max(1, word.length), step = (W - 2 * pad) / n
    const order = start.slice() // order[fila] = cuerpo
    const shown = Math.round(progress * n)
    const line = (body: number, pts: [number, number][], w = 3) => {
      g.strokeStyle = colors[body]; g.lineWidth = w; g.lineCap = 'round'
      g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke()
    }
    for (let k = 0; k < n; k++) {
      const x0 = pad + k * step, x1 = x0 + step, gen = word[k], i = Math.abs(gen) - 1
      const dim = k >= shown
      g.globalAlpha = dim ? 0.18 : 1
      for (let r = 0; r < 3; r++) if (r !== i && r !== i + 1) line(order[r], [[x0, rowY(r)], [x1, rowY(r)]])
      const up = order[i + 1], down = order[i] // 'down' baja de la fila i a la i+1
      const curve = (from: number, to: number): [number, number][] => Array.from({ length: 13 }, (_, j) => { const s = j / 12, e = s * s * (3 - 2 * s); return [x0 + s * step, rowY(from) + (rowY(to) - rowY(from)) * e] })
      const over = gen > 0 ? down : up, under = gen > 0 ? up : down
      const underPts = curve(under === down ? i : i + 1, under === down ? i + 1 : i), overPts = curve(over === down ? i : i + 1, over === down ? i + 1 : i)
      line(under, underPts)
      // hueco: se pinta la de encima con un borde del color del fondo
      g.strokeStyle = '#05080d'; g.lineWidth = 9; g.beginPath(); overPts.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke()
      line(over, overPts)
      order[i] = up; order[i + 1] = down
    }
    g.globalAlpha = 1
  }, [word, start, colors, progress])
  return <canvas ref={ref} style={{ width: '100%', height: 92, display: 'block', background: '#05080d', border: '1px solid #ffffff12' }} aria-label="Diagrama de la trenza: un cruce por cada letra de la palabra" />
}

// σ₁² σ₂⁻¹ … y, si la palabra entera es una unidad repetida, (unidad)ⁿ
const SUB = '₀₁₂₃₄₅₆₇₈₉', SUP: Record<string, string> = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }
const sup = (n: number) => String(n).split('').map((ch) => SUP[ch] ?? ch).join('')
export function wordText(w: number[]): string {
  if (!w.length) return '1 (sin cruces)'
  const runs: [number, number][] = []
  for (const g of w) { const last = runs[runs.length - 1]; if (last && last[0] === g) last[1]++; else runs.push([g, 1]) }
  const tok = runs.map(([g, k]) => `σ${SUB[Math.abs(g)]}${g < 0 || k > 1 ? sup((g < 0 ? -1 : 1) * k) : ''}`)
  for (let p = 1; p <= tok.length / 2; p++) {
    if (tok.length % p) continue
    let ok = true; for (let i = p; i < tok.length && ok; i++) if (tok[i] !== tok[i - p]) ok = false
    if (ok) return `(${tok.slice(0, p).join(' ')})${sup(tok.length / p)}`
  }
  return tok.join(' ')
}
