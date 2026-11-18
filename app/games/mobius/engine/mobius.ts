// Geometría real de una cinta de Möbius, no una textura que la simula.
// Parametrización estándar (u = ángulo alrededor del anillo, puede crecer
// más allá de 2π sin wrap manual; v = posición lateral en el ancho de la
// cinta):
//
//   x(u,v) = (R + v·cos(u/2))·cos(u)
//   y(u,v) = v·sin(u/2)
//   z(u,v) = (R + v·cos(u/2))·sin(u)
//
// La gracia real está en que cos(u) y sin(u) tienen período 2π, pero
// cos(u/2) y sin(u/2) tienen período 4π -- así que con v FIJO, en u=2π la
// fórmula da el mismo resultado que tendría v negativo en u=0. Ese es,
// literalmente, el medio giro: no hay ningún "if" que invierta nada a
// mano, es consecuencia directa de la fórmula. Recién en u=4π la posición
// Y LA ORIENTACIÓN vuelven a coincidir exactamente con el inicio -- dar
// una vuelta completa te deja del otro lado, dos vueltas te devuelven al
// mismo lugar.

export const RING_RADIUS = 11
export const HALF_WIDTH = 2.4
export const RAIL_MARGIN = 0.4
export const LAP_U = Math.PI * 2
export const TOTAL_U = Math.PI * 4 // dos vueltas = la clausura real de la cinta

export type Vec3 = { x: number; y: number; z: number }

export function mobiusPoint(u: number, v: number): Vec3 {
  const h = v * Math.cos(u / 2)
  return {
    x: (RING_RADIUS + h) * Math.cos(u),
    y: v * Math.sin(u / 2),
    z: (RING_RADIUS + h) * Math.sin(u),
  }
}

function sub(a: Vec3, b: Vec3): Vec3 { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z } }
function scale(a: Vec3, s: number): Vec3 { return { x: a.x * s, y: a.y * s, z: a.z * s } }
function cross(a: Vec3, b: Vec3): Vec3 {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }
}
function length(a: Vec3): number { return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z) }
function normalize(a: Vec3): Vec3 {
  const l = length(a) || 1
  return { x: a.x / l, y: a.y / l, z: a.z / l }
}

// Frame local real en (u,v): derivadas numéricas (diferencias finitas) en
// vez de álgebra analítica -- para un juego alcanza de sobra, y evita
// deslizar un error de derivada en una fórmula que ya es poco intuitiva.
// normal = cross(tangentU, tangentV) es, por construcción del producto
// cruz, perpendicular a ambas -- no hace falta Gram-Schmidt para usar
// tangentU directo como "adelante".
export function mobiusFrame(u: number, v: number) {
  const eps = 0.001
  const position = mobiusPoint(u, v)
  const tangentU = normalize(scale(sub(mobiusPoint(u + eps, v), mobiusPoint(u - eps, v)), 1 / (2 * eps)))
  const tangentV = normalize(scale(sub(mobiusPoint(u, v + eps), mobiusPoint(u, v - eps)), 1 / (2 * eps)))
  const normal = normalize(cross(tangentU, tangentV))
  return { position, forward: tangentU, normal }
}

export type CourseItem = { u: number; v: number; kind: 'orb' | 'obstacle' }

// PRNG chico y determinista (mismo algoritmo mulberry32 que ya usa
// /lab/atractores, reimplementado acá para no cruzar un import entre dos
// juegos sin relación entre sí) -- la pista es siempre la misma pista.
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SAFE_START = 2.6 // nadie aparece encima del jugador al arrancar
const SAFE_END = 1.2 // ni pegado a la meta

export function generateCourse(seed = 1): CourseItem[] {
  const rand = mulberry32(seed)
  const items: CourseItem[] = []
  let u = SAFE_START
  while (u < TOTAL_U - SAFE_END) {
    const v = (rand() * 2 - 1) * (HALF_WIDTH - RAIL_MARGIN - 0.3)
    const isOrb = rand() < 0.6
    items.push({ u, v, kind: isOrb ? 'orb' : 'obstacle' })
    u += 0.95 + rand() * 0.7
  }
  return items
}
