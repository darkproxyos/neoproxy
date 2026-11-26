/// <reference lib="webworker" />
import { ORBITS, orbitById, computeTrack, strandsFrom, type Strands } from './orbit'
import { divergence } from './nbody'
import { solidify, type TrenzaSolidOpts } from './solid'
import { meshToBinarySTL } from '../specimens/stl'
import type { Track } from './nbody'

export type Lines = { pts: Float32Array[]; table: Float32Array; tableN: number; T: number; periods: number; extent: number }
export type TrenzaCmd =
  | { type: 'orbit'; id: string; periods: number; req: number }
  | { type: 'solid'; id: string; periods: number; opts: TrenzaSolidOpts; stl: boolean; req: number }
  | { type: 'chaos'; id: string; eps: number; periods: number; req: number }
  | { type: 'glyphs'; req: number }
export type TrenzaMsg =
  | { type: 'orbit'; req: number; lines: Lines; ms: number }
  | { type: 'solid'; req: number; positions: Float32Array; indices: Uint32Array; strand: Uint8Array; metrics: unknown; heightMm: number; widthMm: number; world: { scale: number; hOffset: number; tScale: number }; stl?: ArrayBuffer; ms: number }
  | { type: 'chaos'; req: number; main: Lines; ghost: Lines; split: number | null; ms: number }
  | { type: 'glyphs'; req: number; glyphs: Record<string, number[][]> }
  | { type: 'error'; req: number; error: string }

const post = (m: TrenzaMsg, tr: Transferable[] = []) => (self as unknown as Worker).postMessage(m, tr)
const cache = new Map<string, Track>()
const track = (id: string, periods: number, eps = 0) => {
  const key = `${id}|${periods}|${eps}`
  let t = cache.get(key)
  if (!t) { t = computeTrack(orbitById(id), periods, eps); if (cache.size > 6) cache.delete(cache.keys().next().value as string); cache.set(key, t) }
  return t
}
const lines = (S: Strands): Lines => ({ pts: S.pts, table: S.table, tableN: S.tableN, T: S.T, periods: S.periods, extent: S.extent })
const bufs = (L: Lines) => [...L.pts.map((p) => p.buffer), L.table.buffer]

self.onmessage = (e: MessageEvent<TrenzaCmd>) => {
  const c = e.data, t0 = Date.now()
  try {
    const o = orbitById('id' in c ? c.id : '')
    if (c.type === 'glyphs') {
      // dibujito de cada órbita en el plano: 120 puntos por cuerpo
      const glyphs: Record<string, number[][]> = {}
      for (const g of ORBITS) {
        const S = strandsFrom(computeTrack(g, 1), g.T, 1, 0.05, g.T / 300, 120)
        glyphs[g.id] = [0, 1, 2].map((b) => Array.from({ length: S.tableN }, (_, k) => [S.table[6 * k + 2 * b], S.table[6 * k + 2 * b + 1]]).flat().map((v) => Math.round(v * 1000) / 1000))
      }
      post({ type: 'glyphs', req: c.req, glyphs })
    } else if (c.type === 'orbit') {
      const L = lines(strandsFrom(track(c.id, c.periods), o.T, c.periods, 0.004, o.T / 4000))
      post({ type: 'orbit', req: c.req, lines: L, ms: Date.now() - t0 }, bufs(L))
    } else if (c.type === 'solid') {
      const S = strandsFrom(track(c.id, c.periods), o.T, c.periods, 0.01, o.T / 1500)
      const r = solidify(S, c.opts)
      if (!r) throw new Error('No se pudo construir la pieza con estos parámetros')
      const stl = c.stl ? meshToBinarySTL(r.mesh) : undefined
      const tr: Transferable[] = [r.mesh.positions.buffer, r.mesh.indices.buffer, r.strand.buffer]
      if (stl) tr.push(stl)
      post({ type: 'solid', req: c.req, positions: r.mesh.positions, indices: r.mesh.indices, strand: r.strand, metrics: r.metrics, heightMm: r.heightMm, widthMm: r.widthMm, world: r.world, stl, ms: Date.now() - t0 }, tr)
    } else {
      const main = lines(strandsFrom(track(c.id, c.periods), o.T, c.periods, 0.006, o.T / 2500))
      const ghost = lines(strandsFrom(track(c.id, c.periods, c.eps), o.T, c.periods, 0.006, o.T / 2500))
      const d = divergence(o.p1, o.p2, c.eps, o.T * c.periods)
      post({ type: 'chaos', req: c.req, main, ghost, split: d, ms: Date.now() - t0 }, [...bufs(main), ...bufs(ghost)])
    }
  } catch (err) { post({ type: 'error', req: c.req, error: String(err instanceof Error ? err.message : err) }) }
}
