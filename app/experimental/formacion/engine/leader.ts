// FORMACIÓN — Metatron. Líder virtual + potenciales artificiales (Leonard
// & Fiorelli, "Virtual Leaders, Artificial Potentials and Coordinated
// Control of Groups", IEEE CDC 2001). Distinto de los boids de Reynolds
// que ya corren en /experimental/enjambre: ahí la forma de la bandada
// emerge sola, nadie la decide, cada boid solo mira a sus vecinos. Acá hay
// un punto real que ningún seguidor controla pero que todos obedecen — una
// decisión central, no autoorganización. Cada seguidor queda atado al
// líder por atracción y a sus propios vecinos por repulsión, para no
// amontonarse.
//
// "Si Metatron cae, no hay caos. Hay silencio: cada proceso sigue
// corriendo, pero ninguno vuelve a hablarle a otro" (lore real,
// components/proxyverse/agents.ts) — implementado literal: el líder emite
// casi siempre, pero cada tanto calla unos segundos. Mientras calla, la
// atracción se apaga del todo y cada seguidor pasa a su propio wander
// independiente — no colapsan hacia el silencio, cada uno simplemente
// sigue corriendo solo.

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

export type Follower = { pos: Vec3; vel: Vec3; wanderAngle: number }

export type FormationState = {
  leaderPos: Vec3
  leaderVel: Vec3
  leaderWanderAngle: number
  followers: Follower[]
  broadcasting: boolean
  nextSwitchAt: number
}

export type FormationParams = {
  arenaHalf: number
  leaderMaxSpeed: number
  leaderMaxForce: number
  wanderRadius: number
  wanderDist: number
  wanderJitter: number
  followerMaxSpeed: number
  followerMaxForce: number
  attractGain: number
  repelGain: number
  repelRadius: number
  broadcastMin: number
  broadcastMax: number
  silenceMin: number
  silenceMax: number
}

const rngRef = { fn: mulberry32(Date.now() & 0xffffffff) }

export function initFormation(followerCount: number, seed: number, arenaHalf: number): FormationState {
  const rand = mulberry32(seed)
  rngRef.fn = mulberry32(seed ^ 0x9e3779b9)
  const followers: Follower[] = []
  for (let i = 0; i < followerCount; i++) {
    const pos: Vec3 = [(rand() * 2 - 1) * arenaHalf * 0.5, (rand() * 2 - 1) * arenaHalf * 0.5, (rand() * 2 - 1) * arenaHalf * 0.5]
    followers.push({ pos, vel: [0, 0, 0], wanderAngle: rand() * Math.PI * 2 })
  }
  return {
    leaderPos: [0, 0, 0],
    leaderVel: scale(norm([rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1]), 0.6),
    leaderWanderAngle: rand() * Math.PI * 2,
    followers,
    broadcasting: true,
    nextSwitchAt: 6 + rand() * 4,
  }
}

function wanderStep(pos: Vec3, vel: Vec3, angle: number, dt: number, rand: () => number, p: FormationParams, speed: number, force: number): { vel: Vec3; angle: number } {
  const newAngle = angle + (rand() * 2 - 1) * p.wanderJitter * dt
  const ahead = add(pos, scale(norm(vel), p.wanderDist))
  const target = add(ahead, scale([Math.cos(newAngle), Math.sin(newAngle * 0.6), Math.sin(newAngle)], p.wanderRadius))
  const desired = scale(norm(sub(target, pos)), speed)
  const accel = limit(sub(desired, vel), force)
  return { vel: limit(add(vel, scale(accel, dt)), speed), angle: newAngle }
}

function containAccel(pos: Vec3, vel: Vec3, arenaHalf: number, speed: number, force: number): Vec3 {
  const d = len(pos)
  if (d <= arenaHalf) return [0, 0, 0]
  const over = (d - arenaHalf) / arenaHalf
  const back = scale(norm(sub([0, 0, 0], pos)), speed)
  return limit(sub(back, vel), force * (1 + over * 3))
}

// true si cambió de estado (emitiendo <-> en silencio) en este cuadro.
export function stepFormation(state: FormationState, dt: number, now: number, p: FormationParams): boolean {
  const rand = rngRef.fn
  let switched = false

  if (now >= state.nextSwitchAt) {
    state.broadcasting = !state.broadcasting
    state.nextSwitchAt = now + (state.broadcasting ? p.broadcastMin + rand() * (p.broadcastMax - p.broadcastMin) : p.silenceMin + rand() * (p.silenceMax - p.silenceMin))
    switched = true
  }

  const { vel: leaderVel, angle: leaderAngle } = wanderStep(
    state.leaderPos, state.leaderVel, state.leaderWanderAngle, dt, rand, p, p.leaderMaxSpeed, p.leaderMaxForce,
  )
  let lv = leaderVel
  lv = add(lv, scale(containAccel(state.leaderPos, lv, p.arenaHalf, p.leaderMaxSpeed, p.leaderMaxForce), dt))
  state.leaderVel = limit(lv, p.leaderMaxSpeed)
  state.leaderPos = add(state.leaderPos, scale(state.leaderVel, dt))
  state.leaderWanderAngle = leaderAngle

  for (const f of state.followers) {
    let accel: Vec3 = [0, 0, 0]

    if (state.broadcasting) {
      // Atracción (potencial artificial) hacia el líder — control
      // centralizado, no una regla de vecindario local.
      const toLeader = sub(state.leaderPos, f.pos)
      const desired = scale(norm(toLeader), p.followerMaxSpeed)
      accel = add(accel, limit(sub(desired, f.vel), p.followerMaxForce))
    } else {
      // En silencio: nadie coordina. Cada seguidor sigue corriendo solo,
      // con su propio wander independiente — no se detienen, no colapsan.
      const { vel, angle } = wanderStep(f.pos, f.vel, f.wanderAngle, dt, rand, p, p.followerMaxSpeed * 0.6, p.followerMaxForce)
      f.vel = vel
      f.wanderAngle = angle
    }

    // Repulsión entre seguidores — siempre activa, con o sin líder, para
    // que nunca se amontonen en el mismo punto.
    for (const other of state.followers) {
      if (other === f) continue
      const diff = sub(f.pos, other.pos)
      const d = len(diff)
      if (d > 1e-5 && d < p.repelRadius) {
        const push = scale(norm(diff), p.repelGain * (1 - d / p.repelRadius))
        accel = add(accel, push)
      }
    }

    accel = add(accel, containAccel(f.pos, f.vel, p.arenaHalf, p.followerMaxSpeed, p.followerMaxForce))
    f.vel = limit(add(f.vel, scale(accel, dt)), p.followerMaxSpeed)
    f.pos = add(f.pos, scale(f.vel, dt))
  }

  return switched
}
