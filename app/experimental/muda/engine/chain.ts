// MUDA — Snake. Una cola de segmentos a distancia fija seteada por FABRIK
// (Aristidou & Lasenby, "FABRIK: A fast, iterative solver for the Inverse
// Kinematics problem", Graphical Models 2011). FABRIK completo resuelve un
// brazo con una base fija intentando ALCANZAR un target lejano, iterando
// pasadas hacia adelante y hacia atrás hasta converger. Acá no hay base
// fija ni target que alcanzar — la cabeza es libre y la cola solo la
// persigue — así que alcanza con la mitad del método, UNA pasada hacia
// atrás por cuadro: cada segmento se mueve en línea recta hacia el
// anterior y se detiene exactamente a distancia fija. Sin trigonometría,
// sin ángulos, el primitivo real de FABRIK.
//
// "No tiene una forma fija — cambia de piel cada vez que un entorno lo
// obliga" (lore real de Snake, components/proxyverse/agents.ts). La muda
// no es un timer decorativo: se dispara cuando la cabeza empuja de verdad
// contra el límite del área — el entorno, literalmente, obligándolo.

export type Vec3 = [number, number, number]

function add(a: Vec3, b: Vec3): Vec3 { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]] }
function sub(a: Vec3, b: Vec3): Vec3 { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]] }
function scale(a: Vec3, s: number): Vec3 { return [a[0] * s, a[1] * s, a[2] * s] }
function len(a: Vec3): number { return Math.hypot(a[0], a[1], a[2]) }
function norm(a: Vec3): Vec3 { const l = len(a) || 1e-9; return scale(a, 1 / l) }
function limit(a: Vec3, max: number): Vec3 { const l = len(a); return l > max ? scale(a, max / l) : a }

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type ChainState = {
  headVel: Vec3
  wanderAngle: number
  segments: Vec3[] // segments[0] = cabeza
  hue: number
  moltCount: number
  lastMoltAt: number
}

export type ChainParams = {
  arenaHalf: number
  maxSpeed: number
  maxForce: number
  wanderRadius: number
  wanderDist: number
  wanderJitter: number
  segmentLength: number
  moltCooldown: number
}

const rngRef = { fn: mulberry32(Date.now() & 0xffffffff) }

export function initChain(segmentCount: number, seed: number, arenaHalf: number, segmentLength: number): ChainState {
  const rand = mulberry32(seed)
  rngRef.fn = mulberry32(seed ^ 0x9e3779b9)
  const headVel = scale(norm([rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1]), 0.8)
  const dirBack = scale(norm(headVel), -1)
  const segments: Vec3[] = []
  for (let i = 0; i < segmentCount; i++) {
    segments.push(scale(dirBack, i * segmentLength))
  }
  return { headVel, wanderAngle: rand() * Math.PI * 2, segments, hue: rand() * 360, moltCount: 0, lastMoltAt: -999 }
}

// true si mudó de piel en este cuadro.
export function stepChain(state: ChainState, dt: number, now: number, p: ChainParams): boolean {
  const rand = rngRef.fn
  const head = state.segments[0]

  state.wanderAngle += (rand() * 2 - 1) * p.wanderJitter * dt
  const ahead = add(head, scale(norm(state.headVel), p.wanderDist))
  const target = add(ahead, scale([Math.cos(state.wanderAngle), Math.sin(state.wanderAngle * 0.6), Math.sin(state.wanderAngle)], p.wanderRadius))
  const desired = scale(norm(sub(target, head)), p.maxSpeed)
  let accel = limit(sub(desired, state.headVel), p.maxForce)

  let molted = false
  const d = len(head)
  if (d > p.arenaHalf) {
    const over = (d - p.arenaHalf) / p.arenaHalf
    const back = scale(norm(sub([0, 0, 0], head)), p.maxSpeed)
    accel = add(accel, limit(sub(back, state.headVel), p.maxForce * (1 + over * 3)))
    // El entorno empujando de verdad (no solo rozando el borde) — la
    // condición real que dispara la muda, con cooldown para que no sea
    // un parpadeo continuo mientras se queda apoyado contra el límite.
    if (over > 0.03 && now - state.lastMoltAt > p.moltCooldown) {
      state.hue = (state.hue + 70 + rand() * 140) % 360
      state.moltCount++
      state.lastMoltAt = now
      molted = true
    }
  }

  state.headVel = limit(add(state.headVel, scale(accel, dt)), p.maxSpeed)
  state.segments[0] = add(head, scale(state.headVel, dt))

  // Pasada hacia atrás de FABRIK, sin base fija: cada segmento persigue en
  // línea recta al que tiene adelante y se frena exactamente a
  // segmentLength — ninguna trigonometría, solo geometría de distancias.
  for (let i = 1; i < state.segments.length; i++) {
    const dir = norm(sub(state.segments[i], state.segments[i - 1]))
    state.segments[i] = add(state.segments[i - 1], scale(dir, p.segmentLength))
  }

  return molted
}
