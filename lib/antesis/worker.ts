/// <reference lib="webworker" />
import { build, verify, paramsJson, comboList, type AntesisOpts, type Verification } from './build'
import { arrangement, type Frame, type V3 } from './layout'
import { meshToBinarySTL } from '../specimens/stl'
import type { Mesh } from './gear'

export type PartOut = { key: string; name: string; count: number; color: string; positions: Float32Array; indices: Uint32Array; sizeMm: [number, number, number] }
export type AntesisCmd =
  | { type: 'build'; opts: AntesisOpts; req: number }
  | { type: 'export'; opts: AntesisOpts; req: number }
export type AntesisMsg =
  | {
      type: 'built'; req: number; ms: number
      parts: PartOut[]
      framesA: Frame[]; framesB: Frame[]
      NA: number; NB: number; m: number
      combos: { NA: number; NB: number; m: number }[]
      roles: { A: string; B: string }
      bounds: number; coreR: number
      explode: { gear: number; deco: number; pin: number }
      info: Record<string, number | string>
    }
  | { type: 'verified'; req: number; v: Verification; ms: number }
  | { type: 'exported'; req: number; files: { name: string; data: ArrayBuffer }[]; ms: number }
  | { type: 'error'; req: number; error: string }

const post = (m: AntesisMsg, t: Transferable[] = []) => (self as unknown as Worker).postMessage(m, t)

function bbox(m: Mesh): [number, number, number] {
  const P = m.positions, mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < P.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], P[i + a]); mx[a] = Math.max(mx[a], P[i + a]) }
  return [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]]
}

// Orientación de impresión: rotación R (filas) y luego el piso en z = 0, centrado en x/y.
function orient(m: Mesh, R: number[][] | null): Mesh {
  const P = new Float32Array(m.positions.length)
  for (let i = 0; i < P.length; i += 3) {
    const x = m.positions[i], y = m.positions[i + 1], z = m.positions[i + 2]
    if (R) { P[i] = R[0][0] * x + R[0][1] * y + R[0][2] * z; P[i + 1] = R[1][0] * x + R[1][1] * y + R[1][2] * z; P[i + 2] = R[2][0] * x + R[2][1] * y + R[2][2] * z }
    else { P[i] = x; P[i + 1] = y; P[i + 2] = z }
  }
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < P.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], P[i + a]); mx[a] = Math.max(mx[a], P[i + a]) }
  for (let i = 0; i < P.length; i += 3) { P[i] -= (mn[0] + mx[0]) / 2; P[i + 1] -= (mn[1] + mx[1]) / 2; P[i + 2] -= mn[2] }
  return { positions: P, indices: m.indices }
}
// rotación que lleva el eje a hacia −z
function axisDown(a: V3): number[][] {
  const z: V3 = [-a[0], -a[1], -a[2]]
  const t: V3 = Math.abs(z[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]
  const x0 = [t[1] * z[2] - t[2] * z[1], t[2] * z[0] - t[0] * z[2], t[0] * z[1] - t[1] * z[0]], lx = Math.hypot(x0[0], x0[1], x0[2])
  const x = x0.map((v) => v / lx), y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]]
  return [x, y, [z[0], z[1], z[2]]] // filas ortonormales, x × y = z: R·a = (0, 0, −1)
}

self.onmessage = (e: MessageEvent<AntesisCmd>) => {
  const c = e.data
  try {
    const t0 = Date.now()
    if (c.type === 'build') {
      const b = build(c.opts)
      // copias: los originales se siguen usando para verificar (transferirlos los vacía)
      const parts: PartOut[] = b.parts.map((p) => ({ key: p.key, name: p.name, count: p.count, color: p.color, positions: p.mesh.positions.slice(), indices: p.mesh.indices.slice(), sizeMm: bbox(p.mesh) }))
      const tr: Transferable[] = []
      for (const p of parts) tr.push(p.positions.buffer, p.indices.buffer)
      const arr = arrangement(c.opts.sym)
      post({
        type: 'built', req: c.req, ms: Date.now() - t0, parts, framesA: b.framesA, framesB: b.framesB,
        NA: b.combo.NA, NB: b.combo.NB, m: b.combo.m,
        combos: comboList(c.opts.sym, c.opts.size, c.opts.proc).map((k) => ({ NA: k.NA, NB: k.NB, m: k.m })),
        roles: b.roles, bounds: b.bounds, coreR: b.coreR,
        explode: { gear: 1, deco: 2.1, pin: 0.55 },
        info: { A: arr.A.length, B: arr.B.length, uniones: arr.edges.length, sigma: (arr.sigma * 180) / Math.PI },
      }, tr)
      const t1 = Date.now(), v = verify(b, true)
      post({ type: 'verified', req: c.req, v, ms: Date.now() - t1 })
    } else if (c.type === 'export') {
      const b = build({ ...c.opts, quality: 'exportar' })
      const v = verify(b, false)
      const arr = arrangement(c.opts.sym)
      const flip = [[1, 0, 0], [0, -1, 0], [0, 0, -1]] // engranaje: cara exterior abajo
      const files: { name: string; data: ArrayBuffer }[] = []
      for (const p of b.parts) {
        const R = p.key === 'nucleo' ? axisDown(arr.A[0]) : p.key.startsWith('engranaje') ? flip : null
        files.push({ name: `antesis-${p.key}${p.count > 1 ? `-x${p.count}` : ''}.stl`, data: meshToBinarySTL(orient(p.mesh, R)) })
      }
      const json = new TextEncoder().encode(JSON.stringify(paramsJson(b, v), null, 2))
      files.push({ name: 'antesis-parametros.json', data: json.buffer as ArrayBuffer })
      post({ type: 'exported', req: c.req, files, ms: Date.now() - t0 }, files.map((f) => f.data))
    }
  } catch (err) { post({ type: 'error', req: c.req, error: String(err instanceof Error ? err.message : err) }) }
}
