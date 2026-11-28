/// <reference lib="webworker" />
// NPX-02 VÉRTICE — hilo de cálculo. Construye las piezas que se le piden (varios hilos se reparten
// la espada) o verifica la espada entera con las mallas que ya calcularon los otros.
import { specs, makePart, rebuild, verify, paramsJson, type Verification } from './build'
import { expandSmooth, creases, orient, size, fitsBed } from '../mesh'
import { meshToBinarySTL } from '../../specimens/stl'
import type { VerticeOpts } from './model'

export type ViewData = { P: Float32Array; N: Float32Array; gP: Float32Array; gN: Float32Array; lines: Float32Array }
export type PartMsg = {
  type: 'part'; req: number; key: string; ms: number
  positions: Float32Array; indices: Uint32Array; raw: Float32Array | null
  view?: ViewData; stl?: ArrayBuffer; printMm: [number, number, number]; fits: boolean; triangles: number
}
export type VCmd =
  | { type: 'parts'; req: number; opts: Partial<VerticeOpts>; keys: string[]; mode: 'view' | 'export' }
  | { type: 'verify'; req: number; opts: Partial<VerticeOpts>; meshes: { key: string; positions: Float32Array; indices: Uint32Array; raw: Float32Array | null }[]; json: boolean }
export type VMsg =
  | PartMsg
  | { type: 'done'; req: number }
  | { type: 'verified'; req: number; v: Verification; json?: string; ms: number }
  | { type: 'error'; req: number; error: string }

const post = (m: VMsg, t: Transferable[] = []) => (self as unknown as Worker).postMessage(m, t)

self.onmessage = (e: MessageEvent<VCmd>) => {
  const c = e.data
  try {
    if (c.type === 'parts') {
      const { D, list } = specs({ ...c.opts, quality: c.mode === 'export' ? 'exportar' : 'vista' })
      for (const key of c.keys) {
        const s = list.find((x) => x.key === key)
        if (!s) continue
        const t0 = Date.now(), p = makePart(s), sz = size(orient(p.mesh, p.rot))
        const msg: PartMsg = {
          type: 'part', req: c.req, key, ms: 0, positions: p.mesh.positions, indices: p.mesh.indices, raw: p.raw ? p.raw.positions : null,
          printMm: sz.map((v) => Math.round(v * 10) / 10) as [number, number, number], fits: fitsBed(sz, D.o.maxPieza), triangles: p.mesh.indices.length / 3,
        }
        const tr: Transferable[] = [msg.positions.buffer, msg.indices.buffer]
        if (msg.raw && msg.raw.buffer !== msg.positions.buffer) tr.push(msg.raw.buffer)
        if (c.mode === 'view') {
          const ex = expandSmooth(p.mesh, 34, p.glow), lines = creases(p.mesh)
          msg.view = { ...ex, lines }
          tr.push(ex.P.buffer, ex.N.buffer, ex.gP.buffer, ex.gN.buffer, lines.buffer)
        } else if (p.print) {
          msg.stl = meshToBinarySTL(orient(p.mesh, p.rot))
          tr.push(msg.stl)
        }
        msg.ms = Date.now() - t0
        // la misma memoria no puede transferirse dos veces
        post(msg, [...new Set(tr)])
      }
      post({ type: 'done', req: c.req })
    } else {
      const t0 = Date.now()
      const meshes: Record<string, { mesh: { positions: Float32Array; indices: Uint32Array }; raw: { positions: Float32Array; indices: Uint32Array } | null }> = {}
      for (const m of c.meshes) meshes[m.key] = { mesh: { positions: m.positions, indices: m.indices }, raw: m.raw ? { positions: m.raw, indices: new Uint32Array(0) } : null }
      const b = rebuild({ ...c.opts }, meshes), v = verify(b)
      post({ type: 'verified', req: c.req, v, json: c.json ? JSON.stringify(paramsJson(b, v), null, 2) : undefined, ms: Date.now() - t0 })
    }
  } catch (err) { post({ type: 'error', req: c.req, error: String(err instanceof Error ? err.message : err) }) }
}
