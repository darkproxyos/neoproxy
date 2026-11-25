// Genoma de una pieza: la receta mínima para regenerarla exacta.
//
//   { f, s }                       un algoritmo con su semilla (una pieza "nacida")
//   { f, s, m: [[mseed, k], ...] } lo mismo con mutaciones acumuladas, en orden
//   { f:'symbiosis', s, x:[A, B] } un cruce de dos genomas concretos
//   { f, s, o: { clave: valor } }   parámetros fijados a mano (explorador de GEOMETRÍAS)
//
// Una hija es su madre más UNA mutación: el genoma crece en dos números por
// generación. Nada se guarda de la malla: se resuelve a receta y se mallan al vuelo.
//
// Determinismo: la mutación usa solo mulberry32 y aritmética.

import { mulberry32, pick, type Rng } from './rng'
import { ENVELOPES } from './sdf'
import { sampleRecipe, type Family, type Params, type Recipe } from './families'
import { OPS } from './symbiosis'
import { CONWAY_OPS, CONWAY_SOLIDS } from './fields-geo'

export type Mut = [number, number] // [semilla de la mutación, fuerza]
export type Genome = { f: Family; s: number; m?: Mut[]; x?: [Genome, Genome]; o?: Params }

export const MAX_MUTATIONS = 10   // tope de mutaciones acumuladas en un linaje
export const MAX_LEAVES = 3       // costo: algoritmos puros dentro de una receta

const SKINS = ['none', 'ridges', 'bands', 'pores'] as const
// Parámetros que no se mutan: rompen el costo (tamaño de grilla, orden de
// Hilbert). Las semillas internas (growSeed, simSeed...) solo cambian en
// mutaciones fuertes, porque re-sortean todo el crecimiento.
const FROZEN = new Set(['grid', 'order'])

// ruido de media 0 y desvío ~1 sin trigonometría
const gauss = (r: Rng) => (r() + r() + r() - 1.5) * 2

function mutNum(v: number, r: Rng, k: number, key: string): number {
  if (key === 'zCut') return v > -1 ? Math.max(-0.85, Math.min(-0.3, v + 0.05 * k * gauss(r))) : v
  if (Number.isInteger(v)) {
    if (key === 'fold' && v === 1) return v
    if (r() >= 0.3 * k) return v
    const step = v > 12 ? Math.max(1, Math.round(v * 0.08 * k)) : 1
    const next = v + (r() < 0.5 ? -step : step)
    return Math.max(v >= 1 ? 1 : 0, Math.min(Math.ceil(v * 1.5) + 1, next))
  }
  return v * (1 + 0.2 * k * gauss(r)) + 0.03 * k * gauss(r)
}

// Mutación de un genoma de texto (poliedros de Conway): cambiar, insertar o borrar una letra.
function mutateText(v: string, r: Rng, k: number): string {
  if (r() >= 0.6 * k + 0.15) return v
  const letters = CONWAY_OPS.split(''), i = Math.floor(r() * (v.length + 1)), roll = r()
  if (roll < 0.4 && v.length) return v.slice(0, i % v.length) + pick(r, letters) + v.slice((i % v.length) + 1)
  if (roll < 0.8 && v.length < 6) return v.slice(0, i) + pick(r, letters) + v.slice(i)
  return v.length > 1 ? v.slice(0, i % v.length) + v.slice((i % v.length) + 1) : v
}

function mutateParams(p: Params, r: Rng, k: number): Params {
  const out: Params = {}
  for (const [key, v] of Object.entries(p)) {
    if (key.endsWith('Seed')) out[key] = r() < 0.35 * k * k ? Math.floor(r() * 1e9) + 1 : v   // mutación estructural: re-sortea el crecimiento
    else if (FROZEN.has(key)) out[key] = v
    else if (key === 'env') out[key] = r() < 0.12 * k ? pick(r, ENVELOPES) : v
    else if (key === 'skin') out[key] = r() < 0.12 * k ? pick(r, SKINS) : v
    else if (key === 'op') out[key] = r() < 0.1 * k ? pick(r, OPS) : v
    else if (key === 'ops' && typeof v === 'string') out[key] = mutateText(v, r, k)
    else if (key === 'solid') out[key] = r() < 0.2 * k ? pick(r, CONWAY_SOLIDS) : v
    else if (typeof v === 'number') out[key] = mutNum(v, r, k, key)
    else if (Array.isArray(v)) out[key] = v.map((e) => mutNum(e, r, k, key))
    else out[key] = v
  }
  return out
}

// Una mutación: copia con los parámetros perturbados, y lo mismo, algo más
// suave, en cada padre si la receta es un cruce.
export function mutateRecipe(rec: Recipe, mseed: number, k: number): Recipe {
  const r = mulberry32(mseed)
  const params = mutateParams(rec.params, r, k)
  const parents = rec.parents?.map((p, i) => mutateRecipe(p, mseed + 97 * (i + 1), k * 0.8))
  return { ...rec, params, ...(parents ? { parents } : {}) }
}

export function resolveGenome(g: Genome): Recipe {
  let rec = sampleRecipe(g.f, g.s)
  if (g.x) rec = { ...rec, parents: [resolveGenome(g.x[0]), resolveGenome(g.x[1])] }
  if (g.o) rec = { ...rec, params: { ...rec.params, ...g.o } }   // lo fijado a mano va antes de las mutaciones
  for (const [ms, k] of g.m ?? []) rec = mutateRecipe(rec, ms, k)
  return rec
}

export const leafCount = (rec: Recipe): number => (rec.parents ? rec.parents.reduce((a, p) => a + leafCount(p), 0) : 1)

const fnv = (str: string) => {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) }
  return h >>> 0
}

// Identificador estable: las piezas nacidas conservan el de siempre
// (`dla-3lj1ql`); mutantes y cruces llevan un sufijo con el hash de su genoma.
export function genomeId(g: Genome): string {
  const base = `${g.f.slice(0, 3)}-${g.s.toString(36)}`
  return g.m?.length || g.x || g.o ? `${base}.${fnv(JSON.stringify(g)).toString(36)}` : base
}

export const genomeDepth = (g: Genome): number => (g.m?.length ?? 0)
