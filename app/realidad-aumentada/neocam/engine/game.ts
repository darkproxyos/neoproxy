import { ParticleSystem } from './core'
import { HandPoint } from './vision'

// ---- CUBOS: cuerpos 2D con gravedad/rebote/colisión simple, reaccionan al
// movimiento y a la posición de la cabeza (repulsión) ----
export type Cube = { x: number; y: number; vx: number; vy: number; rot: number; vrot: number; size: number; color: string }

const CUBE_COLORS = ['0,212,255', '180,60,255', '255,45,180', '0,255,170']

export class CubeField {
  cubes: Cube[] = []

  add(x: number, y: number, n = 1) {
    for (let i = 0; i < n; i++) {
      this.cubes.push({
        x: x + (Math.random() - 0.5) * 40, y: y + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 3,
        rot: Math.random() * Math.PI, vrot: (Math.random() - 0.5) * 0.1,
        size: 18 + Math.random() * 22,
        color: CUBE_COLORS[Math.floor(Math.random() * CUBE_COLORS.length)],
      })
    }
  }

  clear() { this.cubes.length = 0 }

  update(dt: number, w: number, h: number, repellerX: number | null, repellerY: number | null, repellerForce: number) {
    const gravity = 0.35
    for (const c of this.cubes) {
      c.vy += gravity * dt
      if (repellerX !== null && repellerY !== null) {
        const dx = c.x - repellerX, dy = c.y - repellerY
        const dist = Math.hypot(dx, dy) || 1
        const radius = 140
        if (dist < radius) {
          const f = ((radius - dist) / radius) * repellerForce
          c.vx += (dx / dist) * f
          c.vy += (dy / dist) * f
        }
      }
      c.x += c.vx * dt
      c.y += c.vy * dt
      c.rot += c.vrot * dt
      c.vx *= 0.995
      const half = c.size / 2
      if (c.x < half) { c.x = half; c.vx *= -0.6 }
      if (c.x > w - half) { c.x = w - half; c.vx *= -0.6 }
      if (c.y > h - half) { c.y = h - half; c.vy *= -0.55 }
      if (c.y < half) { c.y = half; c.vy *= -0.4 }
    }
    for (let i = 0; i < this.cubes.length; i++) {
      for (let j = i + 1; j < this.cubes.length; j++) {
        const a = this.cubes[i], b = this.cubes[j]
        const dx = b.x - a.x, dy = b.y - a.y
        const minDist = (a.size + b.size) / 2
        const dist = Math.hypot(dx, dy) || 1
        if (dist < minDist) {
          const overlap = (minDist - dist) / 2
          const nx = dx / dist, ny = dy / dist
          a.x -= nx * overlap; a.y -= ny * overlap
          b.x += nx * overlap; b.y += ny * overlap
        }
      }
    }
    if (this.cubes.length > 60) this.cubes.splice(0, this.cubes.length - 60)
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const c of this.cubes) {
      ctx.save()
      ctx.translate(c.x, c.y)
      ctx.rotate(c.rot)
      ctx.strokeStyle = `rgba(${c.color},0.95)`
      ctx.fillStyle = `rgba(${c.color},0.18)`
      ctx.lineWidth = 2
      ctx.shadowColor = `rgba(${c.color},0.8)`
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.rect(-c.size / 2, -c.size / 2, c.size, c.size)
      ctx.fill()
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.restore()
    }
  }
}

// ---- GAME: explotar formas con la mano ----
export type ShapeKind = 'cubo' | 'piramide' | 'diamante' | 'estrella' | 'bomba'
const SHAPE_SCORE: Record<ShapeKind, number> = { cubo: 100, piramide: 150, diamante: 250, estrella: 1000, bomba: -300 }
const SHAPE_COLOR: Record<ShapeKind, string> = {
  cubo: '0,212,255', piramide: '0,255,170', diamante: '255,45,180', estrella: '255,210,40', bomba: '255,40,40',
}
const SHAPE_WEIGHTS: [ShapeKind, number][] = [['cubo', 40], ['piramide', 28], ['diamante', 16], ['bomba', 12], ['estrella', 4]]

export type GameShape = { id: number; x: number; y: number; vy: number; kind: ShapeKind; size: number; life: number }

let shapeId = 0
function pickKind(): ShapeKind {
  const total = SHAPE_WEIGHTS.reduce((a, [, w]) => a + w, 0)
  let r = Math.random() * total
  for (const [k, w] of SHAPE_WEIGHTS) { if (r < w) return k; r -= w }
  return 'cubo'
}

export class HandGame {
  shapes: GameShape[] = []
  particles = new ParticleSystem()
  score = 0
  combo = 1
  comboUntil = 0
  roundActive = false
  roundEndsAt = 0
  lastResult: { score: number } | null = null
  private spawnAccum = 0

  startRound(seconds = 60) {
    this.score = 0; this.combo = 1; this.comboUntil = 0
    this.shapes = []; this.particles.clear()
    this.roundActive = true
    this.roundEndsAt = Date.now() + seconds * 1000
    this.lastResult = null
  }

  update(dt: number, w: number, h: number, now: number) {
    if (this.roundActive && now > this.roundEndsAt) {
      this.roundActive = false
      this.lastResult = { score: this.score }
    }
    this.spawnAccum += dt
    if (this.spawnAccum > 35) {
      this.spawnAccum = 0
      this.shapes.push({ id: shapeId++, x: 40 + Math.random() * (w - 80), y: h + 30, vy: -(2 + Math.random() * 1.5), kind: pickKind(), size: 30 + Math.random() * 16, life: 1 })
    }
    for (let i = this.shapes.length - 1; i >= 0; i--) {
      const s = this.shapes[i]
      s.y += s.vy * dt
      if (s.y < -60) this.shapes.splice(i, 1)
    }
    if (now > this.comboUntil) this.combo = 1
    this.particles.update(dt)
  }

  tryPop(points: HandPoint[]) {
    for (const p of points) {
      for (let i = this.shapes.length - 1; i >= 0; i--) {
        const s = this.shapes[i]
        if (Math.hypot(s.x - p.x, s.y - p.y) < s.size) {
          this.pop(s, i)
          break
        }
      }
    }
  }

  private pop(s: GameShape, idx: number) {
    this.shapes.splice(idx, 1)
    const points = SHAPE_SCORE[s.kind]
    this.score += points > 0 ? points * this.combo : points
    if (points > 0) {
      this.combo = Math.min(5, this.combo + 1)
      this.comboUntil = Date.now() + 2200
    } else {
      this.combo = 1
    }
    const color = `rgba(${SHAPE_COLOR[s.kind]},0.9)`
    for (let i = 0; i < 14; i++) {
      this.particles.spawn({
        x: s.x, y: s.y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
        r: 2 + Math.random() * 4, life: 1, decay: 0.03, color,
      })
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const s of this.shapes) {
      ctx.save()
      ctx.translate(s.x, s.y)
      ctx.strokeStyle = `rgba(${SHAPE_COLOR[s.kind]},0.95)`
      ctx.fillStyle = `rgba(${SHAPE_COLOR[s.kind]},0.2)`
      ctx.lineWidth = 2.5
      ctx.shadowColor = ctx.strokeStyle as string
      ctx.shadowBlur = 12
      ctx.beginPath()
      drawShapePath(ctx, s.kind, s.size)
      ctx.fill()
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.restore()
    }
    this.particles.drawCircles(ctx, 'lighter')
  }
}

function drawShapePath(ctx: CanvasRenderingContext2D, kind: ShapeKind, size: number) {
  const r = size / 2
  if (kind === 'cubo') { ctx.rect(-r, -r, size, size); return }
  if (kind === 'bomba') { ctx.arc(0, 0, r, 0, Math.PI * 2); return }
  if (kind === 'diamante') {
    ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0); ctx.closePath(); return
  }
  if (kind === 'piramide') {
    ctx.moveTo(0, -r); ctx.lineTo(r, r); ctx.lineTo(-r, r); ctx.closePath(); return
  }
  // estrella
  const spikes = 5
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45
    const ang = (Math.PI * i) / spikes - Math.PI / 2
    const x = Math.cos(ang) * rad, y = Math.sin(ang) * rad
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
  }
  ctx.closePath()
}
