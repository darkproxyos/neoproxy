// Evolución del salón: cada renovación es una generación.
//
//   1. Sobreviven los más aptos Y más distintos entre sí (con desgaste por edad):
//      el resto desaparece.
//   2. Las vacantes las llenan hijas: mutantes de sobrevivientes, cruces de dos
//      sobrevivientes concretos y algunos inmigrantes nuevos (sangre fresca).
//   3. Las candidatas se miden y entran las que más se alejan de lo que ya hay,
//      ponderadas por su calidad: la presión contra la repetición es la misma
//      que elige a los sobrevivientes.
//
// Todo es determinista dado el número de generación.

import { mulberry32, range, pick, type Rng } from './rng'
import { PURE_FAMILIES, type Family } from './families'
import { dist } from './select'
import { resolveGenome, leafCount, MAX_MUTATIONS, MAX_LEAVES, type Genome, type Mut } from './genome'
import { tasteFactor, type Votes } from './votes'

export type Kind = 'nacida' | 'mutante' | 'cruce'

export type Member = {
  id: string
  g: Genome
  gen: number          // generación en la que nació
  kind: Kind
  parents?: string[]   // ids de la madre (mutante) o de las dos madres (cruce)
  fit: number          // fitness medido (imprimibilidad x riqueza)
  printScore: number
  d: number[]          // descriptor de forma (ver select.descriptor)
  votes?: Votes        // votos de los visitantes (solo piezas ya vivas)
  tf?: number          // gusto heredado de las madres (solo hijas)
}

// Archivo histórico: todo lo que alguna vez existió, vivo o muerto. Sirve para
// medir novedad contra TODA la historia y para dibujar el árbol genealógico.
export type ArchiveEntry = {
  id: string; f: Family
  b: number            // generación en que nació
  x?: number           // generación en que desapareció (ausente si sigue viva)
  k: 'n' | 'm' | 'c'   // nacida, mutante, cruce
  p?: string[]         // madres
  d: number[]          // descriptor de forma
  s: number            // fitness al nacer
  nov?: number         // novedad histórica al nacer
}

// Celdas de una grilla de 4 divisiones por dimensión: cuántas regiones distintas
// del espacio de formas se han ocupado alguna vez (cobertura).
export const coverage = (entries: { d: number[] }[]) =>
  new Set(entries.map((e) => e.d.map((v) => Math.min(3, Math.max(0, Math.floor(v * 4)))).join(''))).size

// Reparto de las nacidas nuevas: más de lo que da obra, menos de lo flojo.
export const GEN_SHARE: Record<string, number> = {
  vessel: 6, filigree: 5, flow: 3, hilbert: 3, reaction: 2.5,
  tpms: 1.5, mandelbulb: 1.5, voronoi: 1.5, knot: 1.2, kifs: 1.5, network: 1.5, attractor: 1.5, turing: 1.5,
  autopoiesis: 1.5, dla: 1.2, shell: 1.2, twist: 1, colonization: 0.5, automaton: 0.6,
  metaballs: 0.5, harmonics: 0.3, superformula: 0.5, phyllotaxis: 0.5, ruffle: 0.3, mandelbox: 0.4, apollonian: 0.3,
}
export const GEN_PURE_TOTAL = PURE_FAMILIES.reduce((a, f) => a + (GEN_SHARE[f] ?? 1), 0)
export const GEN_SYM_SHARE = GEN_PURE_TOTAL * (2 / 3) // 40 % cruces

export function pickNewFamily(r: Rng): Family {
  let x = r() * (GEN_PURE_TOTAL + GEN_SYM_SHARE)
  for (const f of PURE_FAMILIES) { x -= GEN_SHARE[f] ?? 1; if (x <= 0) return f }
  return 'symbiosis'
}

// Una hija a menos de esta distancia de lo que ya hay se descarta (salvo que falten distintas).
const MIN_GAP = 0.08

// El desgaste por edad evita que un linaje se eternice: arte efímero.
const AGE_DECAY = 0.08
export const adjusted = (m: Member, nowGen: number) => m.fit * tasteFactor(m.votes) * Math.max(0.35, 1 - AGE_DECAY * Math.max(0, nowGen - 1 - m.gen))

// Selección de máxima distancia ponderada por aptitud, empezando desde un
// conjunto ya elegido (vacío para elegir sobrevivientes; los sobrevivientes
// para elegir hijas).
function farthest<T extends { d: number[] }>(
  items: T[], fitOf: (t: T) => number, chosen: { d: number[] }[], count: number, gap = 0, archive: { d: number[] }[] = [],
): T[] {
  // la historia pesa algo menos que el presente: estar cerca de algo que ya
  // existió resta, pero no tanto como estar cerca de algo vivo
  const minD = items.map((it) => Math.min(
    chosen.length ? Math.min(...chosen.map((c) => dist(c.d, it.d))) : 1,
    archive.length ? 1.25 * Math.min(...archive.map((c) => dist(c.d, it.d))) : Infinity,
  ))
  const taken = new Array<boolean>(items.length).fill(false)
  const out: T[] = []
  while (out.length < count) {
    let best = -1, bestScore = -1
    for (let i = 0; i < items.length; i++) {
      if (taken[i] || minD[i] < gap) continue   // casi idéntica a una ya elegida
      const sc = minD[i] * (0.4 + fitOf(items[i]))
      if (sc > bestScore) { bestScore = sc; best = i }
    }
    if (best < 0) {
      if (gap > 0) { gap = 0; continue }   // si no quedan distintas, se relaja el umbral
      break
    }
    taken[best] = true
    out.push(items[best])
    for (let i = 0; i < items.length; i++) if (!taken[i]) minD[i] = Math.min(minD[i], dist(items[best].d, items[i].d))
  }
  return out
}

export function pickSurvivors(pop: Member[], n: number, nowGen: number): Member[] {
  const sorted = [...pop].sort((a, b) => adjusted(b, nowGen) - adjusted(a, nowGen))
  const first = sorted[0]
  const rest = farthest(sorted.slice(1), (m) => adjusted(m, nowGen), [first], Math.max(0, n - 1))
  return [first, ...rest]
}

export function fillSlots(survivors: Member[], cands: Member[], slots: number, archive: { d: number[] }[] = []): Member[] {
  return farthest(cands, (m) => m.fit * (m.tf ?? 1), survivors, slots, MIN_GAP, archive)
}

// ---- cría --------------------------------------------------------------------

export type Offspring = { g: Genome; kind: Kind; parents?: string[] }

function tournament(r: Rng, pool: Member[], nowGen: number): Member {
  const a = pool[Math.floor(r() * pool.length)], b = pool[Math.floor(r() * pool.length)]
  return adjusted(a, nowGen) >= adjusted(b, nowGen) ? a : b
}

export function breed(survivors: Member[], nowGen: number, count: number): Offspring[] {
  const r = mulberry32(nowGen * 7919 + 13)
  const out: Offspring[] = []
  const mutable = survivors.filter((s) => (s.g.m?.length ?? 0) < MAX_MUTATIONS)
  const leaves = new Map<string, number>()
  const leavesOf = (m: Member) => { let v = leaves.get(m.id); if (v === undefined) { v = leafCount(resolveGenome(m.g)); leaves.set(m.id, v) } return v }

  const nMut = Math.round(count * 0.55), nCross = Math.round(count * 0.25)
  for (let i = 0; i < nMut && mutable.length; i++) {
    const mom = tournament(r, mutable, nowGen)
    // casi siempre una variación leve; a veces una macromutación
    const k = r() < 0.2 ? range(r, 1, 1.6) : range(r, 0.25, 0.85)
    const mut: Mut = [Math.floor(r() * 1e9) + 1, Math.round(k * 100) / 100]
    out.push({ g: { ...mom.g, m: [...(mom.g.m ?? []), mut] }, kind: 'mutante', parents: [mom.id] })
  }
  for (let i = 0, tries = 0; i < nCross && tries < nCross * 40; tries++) {
    const a = tournament(r, survivors, nowGen), b = tournament(r, survivors, nowGen)
    if (a.id === b.id || (a.g.f === b.g.f && a.g.f !== 'symbiosis')) continue
    if (leavesOf(a) + leavesOf(b) > MAX_LEAVES) continue   // mantiene acotado el costo del campo
    out.push({ g: { f: 'symbiosis', s: Math.floor(r() * 1e9) + 1, x: [a.g, b.g] }, kind: 'cruce', parents: [a.id, b.id] })
    i++
  }
  while (out.length < count) {
    out.push({ g: { f: pickNewFamily(r), s: Math.floor(r() * 1e9) + 1 }, kind: 'nacida' })
  }
  return out
}
