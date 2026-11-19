import { ParticleSystem } from '../../neocam/engine/core'
import { normalizeForMatch } from './voiceAnalysis'

// Objetos que viven un rato y desaparecen con partículas -- palabras reales
// del Proxyverse que "se acercan" (la escala crece con el tiempo hasta un
// máximo, momento en el que pasan de largo y se van solas) y se sacan
// nombrándolas en voz alta (ver tryPopByVoice más abajo), no tocándolas.
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

  // spokenText: buffer normalizado (minúsculas, sin tildes, solo letras) con
  // lo último que se escuchó por el micrófono -- transcripción final más la
  // parcial en curso, para que la palabra se saque apenas se la nombra, sin
  // esperar a que el reconocimiento la confirme como definitiva. Devuelve
  // los textos sacados en esta llamada (para loguearlos en la UI).
  tryPopByVoice(spokenText: string): string[] {
    const popped: string[] = []
    for (let i = this.words.length - 1; i >= 0; i--) {
      const word = this.words[i]
      const needle = normalizeForMatch(word.text)
      if (needle && spokenText.includes(needle)) {
        this.popped += 1
        this.burst(word, word.color, 18)
        popped.push(word.text)
        this.words.splice(i, 1)
      }
    }
    return popped
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
