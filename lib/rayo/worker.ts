/// <reference lib="webworker" />
import { create, grow, mainChannel, subtree, boxDimension, type Dbm } from './dbm'
import { solidify, type RayoSolidOpts } from './solid'
import { meshToBinarySTL } from '../specimens/stl'

export const BOX = { nx: 64, ny: 64, nz: 96 }
export type RayoCmd =
  | { type: 'grow'; eta: number; seed: number; req: number }
  | { type: 'solid'; opts: RayoSolidOpts; stl: boolean; req: number }
export type RayoMsg =
  // sitios nuevos: (x, y, z) y el índice del padre, en orden de llegada
  | { type: 'chunk'; req: number; from: number; xyz: Int16Array; parent: Int32Array }
  | { type: 'done'; req: number; total: number; hit: boolean; main: Int32Array; size: Int32Array; dim: number; ms: number }
  | { type: 'solid'; req: number; positions: Float32Array; indices: Uint32Array; metrics: unknown; heightMm: number; widthMm: number; kept: number; stl?: ArrayBuffer; ms: number }
  | { type: 'error'; req: number; error: string }

const post = (m: RayoMsg, t: Transferable[] = []) => (self as unknown as Worker).postMessage(m, t)
let cur: Dbm | null = null, curReq = 0

const flush = (d: Dbm, req: number, from: number) => {
  const n = d.sites.length - from; if (n <= 0) return from
  const xyz = new Int16Array(n * 3), parent = new Int32Array(n), { nx, ny } = d.o
  for (let k = 0; k < n; k++) { const i = d.sites[from + k]; xyz[3 * k] = i % nx; xyz[3 * k + 1] = Math.floor(i / nx) % ny; xyz[3 * k + 2] = Math.floor(i / (nx * ny)); parent[k] = d.parent[from + k] }
  post({ type: 'chunk', req, from, xyz, parent }, [xyz.buffer, parent.buffer])
  return d.sites.length
}

self.onmessage = (e: MessageEvent<RayoCmd>) => {
  const c = e.data
  try {
    if (c.type === 'grow') {
      curReq = c.req
      const t0 = Date.now(), d = create({ geometry: 'plano', ...BOX, eta: c.eta, seed: c.seed, maxSites: 20000, tower: 4 })
      cur = d
      let sent = 0
      // se crece por tandas de ~30 ms y se envía cada tanda: la pantalla puede empezar a dibujar
      const tick = () => {
        if (curReq !== c.req) return
        const t1 = Date.now()
        while (!d.done && Date.now() - t1 < 30) grow(d)
        sent = flush(d, c.req, sent)
        if (!d.done) { setTimeout(tick, 0); return }
        const main = Int32Array.from(mainChannel(d)), size = subtree(d)
        post({ type: 'done', req: c.req, total: d.sites.length, hit: d.hit >= 0, main, size, dim: boxDimension(d), ms: Date.now() - t0 }, [main.buffer, size.buffer])
      }
      tick()
    } else if (c.type === 'solid') {
      if (!cur || !cur.done) throw new Error('La descarga todavía no termina')
      const t0 = Date.now(), r = solidify(cur, c.opts)
      if (!r) throw new Error('No se pudo construir la pieza')
      const stl = c.stl ? meshToBinarySTL(r.mesh) : undefined
      const tr: Transferable[] = [r.mesh.positions.buffer, r.mesh.indices.buffer]; if (stl) tr.push(stl)
      post({ type: 'solid', req: c.req, positions: r.mesh.positions, indices: r.mesh.indices, metrics: r.metrics, heightMm: r.heightMm, widthMm: r.widthMm, kept: r.kept, stl, ms: Date.now() - t0 }, tr)
    }
  } catch (err) { post({ type: 'error', req: c.req, error: String(err instanceof Error ? err.message : err) }) }
}
