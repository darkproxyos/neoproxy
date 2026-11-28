/// <reference lib="webworker" />
import { build, verify, paramsJson, orient, size, fitsBed, type Verification } from './build'
import { meshToBinarySTL } from '../specimens/stl'
import type { KatanaOpts } from './model'

export type PartOut = {
  key: string; name: string; count: number; color: string; mirror: boolean
  explode: [number, number, number]
  positions: Float32Array; indices: Uint32Array; glow?: Uint32Array
  printMm: [number, number, number]; fits: boolean; note: string
}
export type KatanaCmd =
  | { type: 'build'; opts: Partial<KatanaOpts>; req: number }
  | { type: 'export'; opts: Partial<KatanaOpts>; req: number }
export type KatanaMsg =
  | { type: 'built'; req: number; ms: number; parts: PartOut[]; info: { nagasa: number; sori: number; segmentos: number[]; mango: number; center: [number, number, number]; radius: number; pocket: boolean; focus: Record<string, { c: [number, number, number]; r: number }> } }
  | { type: 'verified'; req: number; v: Verification; ms: number }
  | { type: 'exported'; req: number; files: { name: string; data: ArrayBuffer }[]; v: Verification; ms: number }
  | { type: 'error'; req: number; error: string }

const post = (m: KatanaMsg, t: Transferable[] = []) => (self as unknown as Worker).postMessage(m, t)

self.onmessage = (e: MessageEvent<KatanaCmd>) => {
  const c = e.data
  try {
    const t0 = Date.now()
    if (c.type === 'build') {
      const b = build({ ...c.opts, quality: 'vista' }), D = b.D
      const parts: PartOut[] = b.parts.map((p) => {
        const sz = size(orient(p.mesh, p.rot))
        return {
          key: p.key, name: p.name, count: p.count, color: p.color, mirror: p.mirror, explode: p.explode,
          positions: p.mesh.positions.slice(), indices: p.mesh.indices.slice(), glow: p.glow?.slice(),
          printMm: sz.map((v) => Math.round(v * 10) / 10) as [number, number, number], fits: fitsBed(sz, b.opts.maxPieza), note: p.note,
        }
      })
      const tr: Transferable[] = []
      for (const p of parts) { tr.push(p.positions.buffer, p.indices.buffer); if (p.glow) tr.push(p.glow.buffer) }
      const x0 = D.xend - D.capL, x1 = D.N, cx = (x0 + x1) / 2
      post({
        type: 'built', req: c.req, ms: Date.now() - t0, parts,
        info: { nagasa: D.N, sori: +D.sag.toFixed(1), segmentos: D.bounds.slice(1).map((e2, i) => Math.round(e2 - D.bounds[i])), mango: D.Lh, center: [cx, D.sag / 2, 0], radius: (x1 - x0) / 2, pocket: !!D.pocket,
          focus: {
            todo: { c: [cx, D.sag / 2, 0], r: ((x1 - x0) / 2) * 1.55 },
            punta: { c: [D.N - D.kl * 0.6, D.sag * 0.92, 0], r: Math.max(70, D.kl * 2.6) },
            tsuba: { c: [-6, D.Yc, 0], r: 150 },
            mango: { c: [D.xf - D.Lh / 2, D.Yc, 0], r: Math.max(150, D.Lh * 0.95) },
            remate: { c: [D.xend - 2, D.Yc, 0], r: 80 },
          },
        },
      }, tr)
      const t1 = Date.now()
      post({ type: 'verified', req: c.req, v: verify(b), ms: Date.now() - t1 })
    } else {
      const b = build({ ...c.opts, quality: 'exportar' }), v = verify(b)
      const files: { name: string; data: ArrayBuffer }[] = b.parts.map((p) => ({ name: `katana-${p.key}${p.count > 1 ? `-x${p.count}` : ''}.stl`, data: meshToBinarySTL(orient(p.mesh, p.rot)) }))
      files.push({ name: 'katana-parametros.json', data: new TextEncoder().encode(JSON.stringify(paramsJson(b, v), null, 2)).buffer as ArrayBuffer })
      post({ type: 'exported', req: c.req, files, v, ms: Date.now() - t0 }, files.map((f) => f.data))
    }
  } catch (err) { post({ type: 'error', req: c.req, error: String(err instanceof Error ? err.message : err) }) }
}
