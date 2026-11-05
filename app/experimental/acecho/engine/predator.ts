// ACECHO — el predador (D) y los procesos (presa) que persigue, cuando
// decide perseguir. Dos ideas reales, no decorativas:
//
// 1) Pursuit (Craig Reynolds, "Steering Behaviors For Autonomous
//    Characters", GDC 1999 — el mismo autor de boids/1987, pero un paper
//    distinto, sobre comportamientos individuales en vez de grupales). En
//    vez de perseguir la posición ACTUAL del objetivo, se predice dónde va
//    a estar después de un tiempo de anticipación proporcional a la
//    distancia, y se apunta ahí. Acá se predice UNA sola vez al arrancar
//    la embestida — no se recalcula cuadro a cuadro, D no corrige el tiro
//    en el aire. Encaja con su propio lore ("busco la condición exacta.
//    Después, actúo una sola vez.") más que un pursuit clásico que
//    re-apunta todo el tiempo.
//
// 2) Sit-and-wait predation (ecología del comportamiento: Huey & Pianka,
//    "Ecological Consequences of Foraging Mode", Ecology 62(4), 1981).
//    Frente al forrajeo activo —perseguir todo el tiempo, como la bandada
//    de Trickster en /experimental/enjambre— esta es la otra estrategia
//    real y documentada: quedarse quieto, gastar casi nada de energía, y
//    moverse solo cuando algo entra en rango. No es pereza decorativa.
//
// Los procesos (presa) usan wander, también de Reynolds 1999: un punto
// objetivo sobre un círculo imaginario adelante del agente, con un ángulo
// que deriva un poco cada cuadro — curva suave, no un random walk a saltos.
// Sin dependencia de Babylon, mismo criterio que el resto de los motores.

export type Vec3 = [number, number, number]

function add(a: Vec3, b: Vec3): Vec3 { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]] }
function sub(a: Vec3, b: Vec3): Vec3 { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]] }
function scale(a: Vec3, s: number): Vec3 { return [a[0] * s, a[1] * s, a[2] * s] }
function len(a: Vec3): number { return Math.hypot(a[0], a[1], a[2]) }
function norm(a: Vec3): Vec3 { const l = len(a) || 1e-9; return scale(a, 1 / l) }
function limit(a: Vec3, max: number): Vec3 { const l = len(a); return l > max ? scale(a, max / l) : a }
function dist(a: Vec3, b: Vec3): number { return len(sub(a, b)) }
function clampToArena(p: Vec3, half: number): Vec3 {
  return [
    Math.max(-half, Math.min(half, p[0])),
    Math.max(-half, Math.min(half, p[1])),
    Math.max(-half, Math.min(half, p[2])),
  ]
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Mote = {
  pos: Vec3
  vel: Vec3
  wanderAngle: number
  alive: boolean
  respawnAt: number
}

export type MoteParams = {
  arenaHalf: number
  maxSpeed: number
  maxForce: number
  wanderRadius: number
  wanderDist: number
  wanderJitter: number // radianes/seg de deriva máxima del ángulo de wander
}

export function initMotes(count: number, seed: number, arenaHalf: number): Mote[] {
  const rand = mulberry32(seed)
  const motes: Mote[] = []
  for (let i = 0; i < count; i++) {
    const pos: Vec3 = [(rand() * 2 - 1) * arenaHalf * 0.8, (rand() * 2 - 1) * arenaHalf * 0.8, (rand() * 2 - 1) * arenaHalf * 0.8]
    const vel = scale(norm([rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1]), 0.4)
    motes.push({ pos, vel, wanderAngle: rand() * Math.PI * 2, alive: true, respawnAt: 0 })
  }
  return motes
}

const rngRef = { fn: mulberry32(Date.now() & 0xffffffff) }

export function stepMotes(motes: Mote[], dt: number, now: number, p: MoteParams): void {
  const rand = rngRef.fn
  for (const m of motes) {
    if (!m.alive) {
      if (now >= m.respawnAt) {
        m.pos = [(rand() * 2 - 1) * p.arenaHalf * 0.8, (rand() * 2 - 1) * p.arenaHalf * 0.8, (rand() * 2 - 1) * p.arenaHalf * 0.8]
        m.vel = scale(norm([rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1]), 0.3)
        m.alive = true
      }
      continue
    }

    m.wanderAngle += (rand() * 2 - 1) * p.wanderJitter * dt
    const ahead = add(m.pos, scale(norm(m.vel), p.wanderDist))
    const target = add(ahead, scale([Math.cos(m.wanderAngle), Math.sin(m.wanderAngle * 0.7), Math.sin(m.wanderAngle)], p.wanderRadius))
    const desired = scale(norm(sub(target, m.pos)), p.maxSpeed)
    let accel = limit(sub(desired, m.vel), p.maxForce)

    const d = len(m.pos)
    if (d > p.arenaHalf) {
      const over = (d - p.arenaHalf) / p.arenaHalf
      const back = scale(norm(sub([0, 0, 0], m.pos)), p.maxSpeed)
      accel = add(accel, limit(sub(back, m.vel), p.maxForce * (1 + over * 3)))
    }

    m.vel = limit(add(m.vel, scale(accel, dt)), p.maxSpeed)
    m.pos = add(m.pos, scale(m.vel, dt))
  }
}

export type PredatorMode = 'dormant' | 'strike'

export type PredatorState = {
  pos: Vec3
  mode: PredatorMode
  strikeFrom: Vec3
  strikeTo: Vec3
  strikeStart: number
  strikeDuration: number
  targetIndex: number
  nextEligible: number
  stats: { strikes: number; hits: number; misses: number }
}

export type PredatorParams = {
  arenaHalf: number
  detectionRadius: number
  hitRadius: number
  strikeSpeed: number
  dormantJitter: number
  patienceMin: number
  patienceMax: number
}

export function initPredator(arenaHalf: number): PredatorState {
  return {
    pos: [0, 0, 0],
    mode: 'dormant',
    strikeFrom: [0, 0, 0],
    strikeTo: [0, 0, 0],
    strikeStart: 0,
    strikeDuration: 0,
    targetIndex: -1,
    nextEligible: 0,
    stats: { strikes: 0, hits: 0, misses: 0 },
  }
}

// Devuelve el índice de presa golpeada en este cuadro (o -1) — la escena
// 3D lo usa para disparar el flash de impacto sin tener que comparar
// estado antes/después ella misma.
export function stepPredator(predator: PredatorState, motes: Mote[], now: number, dt: number, p: PredatorParams): number {
  const rand = rngRef.fn

  if (predator.mode === 'dormant') {
    predator.pos = add(predator.pos, scale([rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1], p.dormantJitter * dt))
    predator.pos = clampToArena(predator.pos, p.arenaHalf * 0.9)

    if (now >= predator.nextEligible) {
      let bestIdx = -1
      let bestDist = p.detectionRadius
      for (let i = 0; i < motes.length; i++) {
        if (!motes[i].alive) continue
        const d = dist(predator.pos, motes[i].pos)
        if (d < bestDist) { bestDist = d; bestIdx = i }
      }
      if (bestIdx >= 0) {
        const target = motes[bestIdx]
        // Pursuit (Reynolds 1999): tiempo de anticipación = distancia /
        // velocidad de embestida — predicción UNA sola vez, no se corrige.
        const T = bestDist / p.strikeSpeed
        const predicted = clampToArena(add(target.pos, scale(target.vel, T)), p.arenaHalf)
        predator.mode = 'strike'
        predator.strikeFrom = predator.pos
        predator.strikeTo = predicted
        predator.strikeStart = now
        predator.strikeDuration = Math.max(0.12, dist(predator.pos, predicted) / p.strikeSpeed)
        predator.targetIndex = bestIdx
        predator.stats.strikes++
      }
    }
    return -1
  }

  // mode === 'strike'
  const elapsed = now - predator.strikeStart
  const t = Math.min(1, elapsed / predator.strikeDuration)
  predator.pos = add(predator.strikeFrom, scale(sub(predator.strikeTo, predator.strikeFrom), t))

  const target = motes[predator.targetIndex]
  if (target?.alive && dist(predator.pos, target.pos) < p.hitRadius) {
    predator.stats.hits++
    target.alive = false
    target.respawnAt = now + 1.4 + rand() * 1.2
    predator.mode = 'dormant'
    predator.nextEligible = now + p.patienceMin + rand() * (p.patienceMax - p.patienceMin)
    return predator.targetIndex
  }

  if (t >= 1) {
    predator.stats.misses++
    predator.mode = 'dormant'
    predator.nextEligible = now + p.patienceMin + rand() * (p.patienceMax - p.patienceMin)
  }
  return -1
}
