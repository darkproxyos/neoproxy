/// <reference lib="webworker" />
// La arena vive aquí: salta en su propio ciclo (~60 por segundo) y se envía a la pantalla.
import { modeGrids, coupling, response, Sand, onNodes, type Drive } from './plate'
import { relief, column, type ReliefOpts, type ColumnOpts } from './solid'
import { meshToBinarySTL } from '../specimens/stl'

export type ResCmd =
  | { type: 'init'; grains: number; seed: number }
  | { type: 'tune'; lambda: number; drive: Drive }
  | { type: 'scatter'; seed: number }
  | { type: 'run'; on: boolean }
  | { type: 'relief'; req: number; lambda: number; drive: Drive; seed: number; ticks: number; opts: ReliefOpts; stl: boolean }
  | { type: 'column'; req: number; drive: Drive; opts: Omit<ColumnOpts, 'N'> & { N?: number }; stl: boolean }
export type ResMsg =
  | { type: 'field'; G: number; re: Float32Array; amp: Float32Array; lambda: number }
  | { type: 'sand'; x: Float32Array; y: Float32Array; nodes: number }
  | { type: 'piece'; req: number; kind: 'placa' | 'columna'; positions: Float32Array; indices: Uint32Array; info: Record<string, unknown>; stl?: ArrayBuffer; ms: number }
  | { type: 'error'; error: string }

const G = 160
const post = (m: ResMsg, t: Transferable[] = []) => (self as unknown as Worker).postMessage(m, t)
const gridCache = new Map<number, Float32Array[]>()
const gridsAt = (g: number) => { let v = gridCache.get(g); if (!v) { v = modeGrids(g); gridCache.set(g, v) } return v }
let sand: Sand | null = null, amp: Float32Array | null = null, running = true, drive: Drive = 'centro', cpl = coupling('centro'), frame = 0

const loop = () => {
  if (sand && amp && running) {
    sand.step(amp, G, 6)
    frame++
    const nodes = frame % 10 === 0 ? onNodes(sand, amp, G) : -1
    post({ type: 'sand', x: sand.x.slice(), y: sand.y.slice(), nodes })
  }
}
setInterval(loop, 16)

self.onmessage = (e: MessageEvent<ResCmd>) => {
  const c = e.data
  try {
    if (c.type === 'init') { sand = new Sand(c.grains, c.seed) }
    else if (c.type === 'scatter') { if (sand) { sand.r = new Sand(1, c.seed).r; sand.scatter() } }
    else if (c.type === 'run') running = c.on
    else if (c.type === 'tune') {
      if (c.drive !== drive) { drive = c.drive; cpl = coupling(drive) }
      const R = response(gridsAt(G), G, cpl, c.lambda)
      amp = R.amp
      // la vibración en su fase dominante (en resonancia va 90° detrás del empuje, así que
      // la parte en fase sola sería casi cero), normalizada, para colorear y hacer temblar la placa
      let sxx = 0, syy = 0, sxy = 0
      for (let i = 0; i < G * G; i++) { sxx += R.re[i] * R.re[i]; syy += R.im[i] * R.im[i]; sxy += R.re[i] * R.im[i] }
      const ph = 0.5 * Math.atan2(2 * sxy, sxx - syy), cp = Math.cos(ph), sp = Math.sin(ph)
      const re = new Float32Array(G * G); let mx = 1e-30
      for (let i = 0; i < re.length; i++) { re[i] = R.re[i] * cp + R.im[i] * sp; mx = Math.max(mx, Math.abs(re[i])) }
      for (let i = 0; i < re.length; i++) re[i] /= mx
      post({ type: 'field', G, re, amp: R.amp.slice(), lambda: c.lambda }, [re.buffer])
    } else if (c.type === 'relief') {
      const t0 = Date.now()
      // arena nueva con esa semilla, asentada ese número de saltos en esa nota: reproducible por enlace
      const s = new Sand(sand?.n ?? 30000, c.seed), R = response(gridsAt(G), G, coupling(c.drive), c.lambda)
      s.step(R.amp, G, c.ticks)
      const r = relief(s, c.opts)
      const stl = c.stl ? meshToBinarySTL(r.mesh) : undefined
      const tr: Transferable[] = [r.mesh.positions.buffer, r.mesh.indices.buffer]; if (stl) tr.push(stl)
      post({ type: 'piece', req: c.req, kind: 'placa', positions: r.mesh.positions, indices: r.mesh.indices, info: { closed: r.closed, tris: r.tris, sizeMm: r.sizeMm, heightMm: r.heightMm, grains: r.grains, nodes: onNodes(s, R.amp, G) }, stl, ms: Date.now() - t0 }, tr)
    } else if (c.type === 'column') {
      const t0 = Date.now()
      const r = column(gridsAt, coupling(c.drive), { N: c.opts.N ?? 112, ...c.opts })
      if (!r) throw new Error('No se pudo construir la columna con este tramo')
      const stl = c.stl ? meshToBinarySTL(r.mesh) : undefined
      const tr: Transferable[] = [r.mesh.positions.buffer, r.mesh.indices.buffer]; if (stl) tr.push(stl)
      post({ type: 'piece', req: c.req, kind: 'columna', positions: r.mesh.positions, indices: r.mesh.indices, info: { metrics: r.metrics, heightMm: r.heightMm, widthMm: r.widthMm }, stl, ms: Date.now() - t0 }, tr)
    }
  } catch (err) { post({ type: 'error', error: String(err instanceof Error ? err.message : err) }) }
}
