// Boids (Craig Reynolds, "Flocks, Herds, and Schools: A Distributed
// Behavioral Model", 1987) — cada agente solo ve a sus vecinos dentro de un
// radio de percepción y obedece 3 reglas puramente locales (separación,
// alineación, cohesión). No hay coordinador, no hay forma de bandada
// escrita en ningún lado — emerge sola de esas 3 reglas corriendo en
// paralelo. Puro cálculo, sin dependencia de ningún paquete de Babylon,
// mismo criterio que el resto de los motores de /app/lab y /experimental.

export type Vec3 = [number, number, number]
export type Boid = { pos: Vec3; vel: Vec3 }

export type BoidsParams = {
  perception: number
  separationWeight: number
  alignmentWeight: number
  cohesionWeight: number
  maxSpeed: number
  maxForce: number
  boundsRadius: number
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function add(a: Vec3, b: Vec3): Vec3 { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]] }
function sub(a: Vec3, b: Vec3): Vec3 { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]] }
function scale(a: Vec3, s: number): Vec3 { return [a[0] * s, a[1] * s, a[2] * s] }
function len(a: Vec3): number { return Math.hypot(a[0], a[1], a[2]) }
function norm(a: Vec3): Vec3 { const l = len(a) || 1e-9; return scale(a, 1 / l) }
function limit(a: Vec3, max: number): Vec3 { const l = len(a); return l > max ? scale(a, max / l) : a }

export function initBoids(count: number, seed: number, spawnRadius: number): Boid[] {
  const rand = mulberry32(seed)
  const boids: Boid[] = []
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0
    do { x = rand() * 2 - 1; y = rand() * 2 - 1; z = rand() * 2 - 1 } while (x * x + y * y + z * z > 1)
    const pos: Vec3 = [x * spawnRadius, y * spawnRadius, z * spawnRadius]
    const vel = norm([rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1])
    boids.push({ pos, vel: scale(vel, 0.6) })
  }
  return boids
}

// Steering = desired_velocity − velocidad_actual, acotado a maxForce — la
// formulación clásica de Reynolds: cada regla propone a dónde "querría" ir
// el boid, y la diferencia con hacia dónde va de verdad es la corrección
// que efectivamente se aplica.
export function stepBoids(boids: Boid[], params: BoidsParams, dt: number): Boid[] {
  const { perception, separationWeight, alignmentWeight, cohesionWeight, maxSpeed, maxForce, boundsRadius } = params
  const next: Boid[] = new Array(boids.length)

  for (let i = 0; i < boids.length; i++) {
    const b = boids[i]
    let sepSum: Vec3 = [0, 0, 0]
    let aliSum: Vec3 = [0, 0, 0]
    let cohSum: Vec3 = [0, 0, 0]
    let neighborCount = 0

    for (let j = 0; j < boids.length; j++) {
      if (i === j) continue
      const o = boids[j]
      const diff = sub(b.pos, o.pos)
      const dist = len(diff)
      if (dist > 1e-5 && dist < perception) {
        sepSum = add(sepSum, scale(diff, 1 / dist))
        aliSum = add(aliSum, o.vel)
        cohSum = add(cohSum, o.pos)
        neighborCount++
      }
    }

    let accel: Vec3 = [0, 0, 0]
    if (neighborCount > 0) {
      const sepDesired = scale(norm(sepSum), maxSpeed)
      const sepSteer = limit(sub(sepDesired, b.vel), maxForce)
      accel = add(accel, scale(sepSteer, separationWeight))

      const aliDesired = scale(norm(aliSum), maxSpeed)
      const aliSteer = limit(sub(aliDesired, b.vel), maxForce)
      accel = add(accel, scale(aliSteer, alignmentWeight))

      const center = scale(cohSum, 1 / neighborCount)
      const cohDesired = scale(norm(sub(center, b.pos)), maxSpeed)
      const cohSteer = limit(sub(cohDesired, b.vel), maxForce)
      accel = add(accel, scale(cohSteer, cohesionWeight))
    }

    // Contención suave: nadie "choca" contra un muro, pero más allá del
    // radio aparece una fuerza de retorno proporcional a cuánto se pasó —
    // sin esto la bandada se dispersa para siempre en vez de quedar
    // observable en un volumen fijo.
    const distFromCenter = len(b.pos)
    if (distFromCenter > boundsRadius) {
      const over = (distFromCenter - boundsRadius) / boundsRadius
      const back = scale(norm(sub([0, 0, 0], b.pos)), maxSpeed)
      const boundSteer = limit(sub(back, b.vel), maxForce * (1 + over * 2))
      accel = add(accel, boundSteer)
    }

    const vel = limit(add(b.vel, scale(accel, dt)), maxSpeed)
    const pos = add(b.pos, scale(vel, dt))
    next[i] = { pos, vel }
  }
  return next
}
