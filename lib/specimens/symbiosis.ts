// Simbiogénesis (Margulis): "dos organismos antes distintos se fusionan tan
// profundo que nace algo genuinamente nuevo". Un híbrido toma dos algoritmos
// padres (a veces el segundo es a su vez un híbrido: un trío) y los combina
// con uno de siete operadores. No hay forma propia: sale de lo que cada padre
// hace al campo del otro.

import { range, pick, type Rng } from './rng'
import { type Field, smax, smin } from './sdf'
import type { Params, Recipe, Family } from './families'

export const OPS = ['fusion', 'endo', 'chimera', 'texture', 'swirl', 'carve', 'inherit'] as const
export type SymOp = (typeof OPS)[number]

export const OP_LABEL: Record<SymOp, string> = {
  fusion: 'FUSIÓN', endo: 'ENDOSIMBIOSIS', chimera: 'QUIMERA', texture: 'CONTAGIO',
  swirl: 'REMOLINO', carve: 'PODA', inherit: 'HERENCIA',
}

export const OP_BLURB: Record<SymOp, string> = {
  fusion: 'Los dos cuerpos se funden en uno solo, el segundo más pequeño y girado dentro del primero.',
  endo: 'El primero se vuelve una membrana hueca y el segundo vive adentro, soldado a ella: una célula dentro de otra.',
  chimera: 'Un cuerpo de dos mitades: arriba manda un algoritmo, abajo el otro, con una zona de mezcla en medio.',
  texture: 'El primero conserva su silueta, pero su superficie queda labrada por el campo del segundo.',
  swirl: 'El campo del segundo tuerce el espacio donde vive el primero: la forma se enrosca sin perder su regla.',
  carve: 'El segundo se resta del primero: lo que un algoritmo es, el otro lo vacía.',
  inherit: 'Solo queda lo que ambos tienen en común: la intersección de los dos cuerpos.',
}

const unit = (r: Rng): [number, number, number] => {
  for (;;) {
    const x = r() * 2 - 1, y = r() * 2 - 1, z = r() * 2 - 1
    const l2 = x * x + y * y + z * z
    if (l2 <= 1 && l2 > 0.04) { const l = Math.sqrt(l2); return [x / l, y / l, z / l] }
  }
}

export function sampleSymbiosis(
  r: Rng, base: Params, depth: number, pure: readonly Family[],
  sampleParent: (family: Family, seed: number, depth: number) => Recipe,
): { params: Params; parents: Recipe[] } {
  const op = pick(r, OPS)
  const fa = pick(r, pure)
  let fb: Family = pick(r, pure)
  for (let i = 0; i < 8 && fb === fa; i++) fb = pick(r, pure)
  const seedA = Math.floor(r() * 1e9) + 1, seedB = Math.floor(r() * 1e9) + 1
  const nest = depth === 0 && r() < 0.3 // un trío: el segundo padre ya es híbrido
  const A = sampleParent(fa, seedA, depth + 1)
  const B = nest ? sampleParent('symbiosis', seedB, depth + 1) : sampleParent(fb, seedB, depth + 1)

  const s = op === 'endo' ? range(r, 0.4, 0.62)
    : op === 'fusion' ? range(r, 0.5, 0.88)
    : op === 'carve' ? range(r, 0.45, 0.85)
    : op === 'inherit' ? range(r, 0.9, 1.3)
    : op === 'texture' ? range(r, 0.4, 0.9)
    : 1
  const ax = unit(r)
  return {
    parents: [A, B],
    params: {
      ...base, zCut: r() < 0.85 ? range(r, -0.78, -0.5) : -2,
      op, s, k: range(r, 0.05, 0.2),
      off: [range(r, -0.28, 0.28), range(r, -0.28, 0.28), range(r, -0.2, 0.3)],
      ay: range(r, 0, 6.2832), az: range(r, 0, 6.2832),
      axis: [ax[0], ax[1], ax[2]], amp: range(r, 0.05, 0.15),
      tw: range(r, 0.7, 2.2), wall: range(r, 0.06, 0.09),
    },
  }
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)

export function symbiosisField(p: Params, A: Field, B: Field): Field {
  const op = p.op as SymOp
  const s = p.s as number, k = p.k as number
  const off = p.off as number[], axis = p.axis as number[]
  const amp = p.amp as number, tw = p.tw as number, wall = p.wall as number
  const cy = Math.cos(p.ay as number), sy = Math.sin(p.ay as number)
  const cz = Math.cos(p.az as number), sz = Math.sin(p.az as number)

  // punto del espacio de A -> espacio de B (traslación, giro y escala)
  const bAt = (x: number, y: number, z: number) => {
    const X = (x - off[0]) / s, Y = (y - off[1]) / s, Z = (z - off[2]) / s
    const u = X * cz - Y * sz, v = X * sz + Y * cz
    return B(u * cy + Z * sy, v, -u * sy + Z * cy)
  }

  switch (op) {
    case 'fusion': return (x, y, z) => smin(A(x, y, z), bAt(x, y, z) * s, k)
    case 'endo': return (x, y, z) => {
      const shell = Math.abs(A(x, y, z) + wall * 0.5) - wall * 0.5
      return smin(shell, bAt(x, y, z) * s, 0.06)
    }
    case 'chimera': return (x, y, z) => {
      const t = clamp((axis[0] * x + axis[1] * y + axis[2] * z + 0.3) / 0.6, 0, 1)
      const w = t * t * (3 - 2 * t)
      return A(x, y, z) * (1 - w) + bAt(x, y, z) * s * w
    }
    case 'texture': return (x, y, z) => A(x, y, z) + amp * clamp(bAt(x, y, z), -0.4, 0.4)
    case 'swirl': return (x, y, z) => {
      const a = tw * clamp(bAt(x, y, z), -0.4, 0.4) * 2.5
      const c = Math.cos(a), sn = Math.sin(a)
      return A(x * c - y * sn, x * sn + y * c, z)
    }
    case 'carve': return (x, y, z) => smax(A(x, y, z), -bAt(x, y, z) * s, k)
    case 'inherit': return (x, y, z) => smax(A(x, y, z), bAt(x, y, z) * s, k)
  }
}
