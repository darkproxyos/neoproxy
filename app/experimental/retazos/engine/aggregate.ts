// RETAZOS — Prototype. Agregación Limitada por Difusión (Witten & Sander,
// "Diffusion-Limited Aggregation, a Kinetic Critical Phenomenon", Physical
// Review Letters 1981): partículas sueltas caminan al azar hasta tocar por
// casualidad la estructura que ya existe, y ahí quedan pegadas para
// siempre. Nadie decide la forma final — la deciden, acumuladas, miles de
// colisiones que ninguna partícula individual planeó.
//
// "Toma prestada un poco de cada uno de los otros cinco" (lore real de
// Prototype, components/proxyverse/agents.ts) — literal acá: cada
// fragmento que se pega se tiñe con el color real de uno de los otros
// cinco agentes, en orden fijo y rotando (D, Metatron, Snake, Genos,
// Trickster), no al azar — es un préstamo repetido, no decoración.
// "No terminó de decidir cuál es": al llegar a maxPoints, la estructura
// entera se dispersa y vuelve a empezar desde una sola semilla.

export type Vec3 = [number, number, number]

function add(a: Vec3, b: Vec3): Vec3 { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]] }
function sub(a: Vec3, b: Vec3): Vec3 { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]] }
function scale(a: Vec3, s: number): Vec3 { return [a[0] * s, a[1] * s, a[2] * s] }
function len(a: Vec3): number { return Math.hypot(a[0], a[1], a[2]) }
function norm(a: Vec3): Vec3 { const l = len(a) || 1e-9; return scale(a, 1 / l) }

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type AggregatePoint = { pos: Vec3; colorIdx: number }
export type Walker = { pos: Vec3 }

export type AggregateState = {
  points: AggregatePoint[]
  walkers: Walker[]
  nextColorIdx: number
  resets: number
  radius: number
}

export type AggregateParams = {
  stepSize: number
  stickDistance: number
  spawnMargin: number
  killMargin: number
  maxPoints: number
  colorCount: number
}

const rngRef = { fn: mulberry32(Date.now() & 0xffffffff) }

function spawnWalker(radius: number, p: AggregateParams, rand: () => number): Walker {
  const dir = norm([rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1])
  return { pos: scale(dir, radius + p.spawnMargin) }
}

export function initAggregate(walkerCount: number, seed: number, p: AggregateParams): AggregateState {
  const rand = mulberry32(seed)
  rngRef.fn = mulberry32(seed ^ 0x9e3779b9)
  const state: AggregateState = {
    points: [{ pos: [0, 0, 0], colorIdx: 0 }],
    walkers: [],
    nextColorIdx: 1,
    resets: 0,
    radius: 0,
  }
  for (let i = 0; i < walkerCount; i++) state.walkers.push(spawnWalker(state.radius, p, rand))
  return state
}

// Devuelve { stuck, reset } — la escena 3D los usa para disparar flashes
// sin tener que diffear el estado antes/después ella misma.
export function stepAggregate(state: AggregateState, now: number, p: AggregateParams): { stuck: boolean; reset: boolean } {
  const rand = rngRef.fn
  let stuck = false

  for (const w of state.walkers) {
    const step = scale(norm([rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1]), p.stepSize)
    w.pos = add(w.pos, step)

    let nearest = Infinity
    for (const pt of state.points) {
      const d = len(sub(w.pos, pt.pos))
      if (d < nearest) nearest = d
    }

    if (nearest < p.stickDistance) {
      state.points.push({ pos: w.pos, colorIdx: state.nextColorIdx % p.colorCount })
      state.nextColorIdx++
      state.radius = Math.max(state.radius, len(w.pos))
      stuck = true
      // reemplaza al walker que se pegó por uno nuevo, otra vez en el
      // borde de la cáscara actual — el crecimiento nunca se queda sin
      // partículas cayendo.
      Object.assign(w, spawnWalker(state.radius, p, rand))
    } else if (len(w.pos) > state.radius + p.killMargin) {
      Object.assign(w, spawnWalker(state.radius, p, rand))
    }
  }

  let reset = false
  if (state.points.length >= p.maxPoints) {
    state.points = [{ pos: [0, 0, 0], colorIdx: 0 }]
    state.nextColorIdx = 1
    state.radius = 0
    state.resets++
    for (const w of state.walkers) Object.assign(w, spawnWalker(0, p, rand))
    reset = true
  }

  return { stuck, reset }
}
