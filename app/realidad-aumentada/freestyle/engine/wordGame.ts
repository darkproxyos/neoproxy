import { ParticleSystem } from '../../neocam/engine/core'
import { HandPoint } from '../../neocam/engine/vision'

// Mismo patrón que HandGame (app/realidad-aumentada/neocam/engine/game.ts):
// objetos que viven un rato, se tocan con la punta del dedo real (tracking
// de mano de MediaPipe, no un click), y desaparecen con partículas. Acá en
// vez de formas genéricas son palabras reales del Proxyverse, y en vez de
// subir/bajar por gravedad, "se acercan a la cámara": la escala crece con
// el tiempo hasta un máximo, momento en el que pasan de largo y se van solas.
export type WordTarget = {
  id: number
  text: string
  x: number
  y: number
  scale: number
  vScale: number
  color: string
}

const WORD_COLORS = ['0,212,255', '180,60,255', '255,45,180', '0,255,170', '255,210,40']
const START_SCALE = 0.22
const MAX_SCALE = 2.2
const BASE_FONT_PX = 46
const MIN_SPACING = 160

let wordId = 0

export class WordGame {
  words: WordTarget[] = []
  particles = new ParticleSystem()
  popped = 0
  missed = 0
  private spawnAccumSec = 0
  private nextSpawnInSec = 0

  constructor(private pool: string[]) {
    this.rollNextSpawn()
  }

  // Pública: la página la llama de nuevo cuando cambia spawnEverySec (botón
  // de dificultad) antes de arrancar, para que el primer spawn ya respete
  // el ritmo elegido en vez del default con el que se construyó el juego.
  rollNextSpawn() {
    this.nextSpawnInSec = this.spawnEverySec * (0.7 + Math.random() * 0.6)
  }

  spawnEverySec = 2.2
  approachSec = 4.5

  private pickSpot(w: number, h: number): { x: number; y: number } {
    const marginX = w * 0.18, marginY = h * 0.22
    for (let attempt = 0; attempt < 6; attempt++) {
      const x = marginX + Math.random() * (w - marginX * 2)
      const y = marginY + Math.random() * (h - marginY * 2)
      const tooClose = this.words.some(word => Math.hypot(word.x - x, word.y - y) < MIN_SPACING)
      if (!tooClose) return { x, y }
    }
    return { x: marginX + Math.random() * (w - marginX * 2), y: marginY + Math.random() * (h - marginY * 2) }
  }

  update(dtFrames: number, w: number, h: number) {
    const dtSec = dtFrames / 60
    this.spawnAccumSec += dtSec
    if (this.spawnAccumSec > this.nextSpawnInSec && this.words.length < 5) {
      this.spawnAccumSec = 0
      this.rollNextSpawn()
      const { x, y } = this.pickSpot(w, h)
      wordId += 1
      this.words.push({
        id: wordId,
        text: this.pool[Math.floor(Math.random() * this.pool.length)],
        x, y,
        scale: START_SCALE,
        vScale: (MAX_SCALE - START_SCALE) / this.approachSec,
        color: WORD_COLORS[Math.floor(Math.random() * WORD_COLORS.length)],
      })
    }

    for (let i = this.words.length - 1; i >= 0; i--) {
      const word = this.words[i]
      word.scale += word.vScale * dtSec
      if (word.scale >= MAX_SCALE) {
        this.missed += 1
        this.burst(word, '200,210,220', 8)
        this.words.splice(i, 1)
      }
    }
    this.particles.update(dtFrames)
  }

  // ctx hace falta para medir el ancho real del texto renderizado — un
  // radio fijo no serviría igual para "D" que para "RUNTIME.PYTHON".
  tryPop(points: HandPoint[], ctx: CanvasRenderingContext2D) {
    for (const p of points) {
      for (let i = this.words.length - 1; i >= 0; i--) {
        const word = this.words[i]
        const fontPx = BASE_FONT_PX * word.scale
        ctx.font = `700 ${fontPx}px 'Space Mono', monospace`
        const halfW = ctx.measureText(word.text).width / 2 + 14
        const halfH = fontPx / 2 + 14
        if (Math.abs(p.x - word.x) < halfW && Math.abs(p.y - word.y) < halfH) {
          this.popped += 1
          this.burst(word, word.color, 18)
          this.words.splice(i, 1)
          break
        }
      }
    }
  }

  private burst(word: WordTarget, colorRgb: string, n: number) {
    for (let i = 0; i < n; i++) {
      this.particles.spawn({
        x: word.x, y: word.y,
        vx: (Math.random() - 0.5) * 7, vy: (Math.random() - 0.5) * 7,
        r: 2 + Math.random() * 4, life: 1, decay: 0.03, color: `rgba(${colorRgb},0.9)`,
      })
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const word of this.words) {
      const proximity = Math.min(1, word.scale / MAX_SCALE)
      const danger = Math.max(0, (proximity - 0.75) / 0.25)
      const fontPx = BASE_FONT_PX * word.scale
      ctx.save()
      ctx.translate(word.x, word.y)
      ctx.font = `700 ${fontPx}px 'Space Mono', monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const rgb = danger > 0
        ? `${Math.round(255)},${Math.round(255 * (1 - danger) + 45 * danger)},${Math.round(255 * (1 - danger) + 85 * danger)}`
        : word.color
      ctx.shadowColor = `rgba(${rgb},0.85)`
      ctx.shadowBlur = 16 + proximity * 10
      ctx.fillStyle = `rgba(${rgb},${0.55 + proximity * 0.45})`
      ctx.fillText(word.text, 0, 0)
      ctx.restore()
    }
    this.particles.drawCircles(ctx, 'lighter')
  }

  clear() {
    this.words = []
    this.particles.clear()
  }
}
