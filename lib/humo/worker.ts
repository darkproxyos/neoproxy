/// <reference lib="webworker" />
// La simulación vive aquí: la página solo dibuja. Cada paso manda la nube de humo y
// los núcleos de vórtice; al congelar, el sólido; al exportar, el STL.
import { initState, step, impulse, impulseScale, stepsFor, DT, type Params, type State } from './vortex'
import { solidify, type SolidOpts } from './solid'
import { meshToBinarySTL } from '../specimens/stl'

export type HumoCmd =
  | { type: 'start'; params: Params; particles: number; to?: number } // `to`: avanzar en silencio hasta ese paso (enlaces)
  | { type: 'play' } | { type: 'pause' }
  | { type: 'freeze'; opts: SolidOpts; stl?: boolean }
export type HumoMsg =
  | { type: 'frame'; step: number; total: number; t: number; pos: Float32Array; cores: Float32Array; counts: Int32Array; drift: number; ms: number }
  | { type: 'solid'; step: number; positions: Float32Array; simPositions: Float32Array; indices: Uint32Array; mix: Float32Array; metrics: unknown; heightMm: number; widthMm: number; ms: number; stl?: ArrayBuffer }
  | { type: 'error'; error: string }

let s: State | null = null, k = 0, total = 0, playing = false, p0: [number, number, number] = [0, 0, 0], scale = 1, gen = 0
const post = (m: HumoMsg, tr: Transferable[] = []) => (self as unknown as Worker).postMessage(m, tr)

function frame(ms: number) {
  if (!s) return
  const pos = new Float32Array(s.p)
  const counts = new Int32Array(s.fil.map((f) => f.n)), cores = new Float32Array(counts.reduce((a, b) => a + b, 0) * 3)
  let o = 0; for (const f of s.fil) { cores.set(f.x, o); o += f.x.length }
  const p = impulse(s)
  post({ type: 'frame', step: k, total, t: s.t, pos, cores, counts, drift: Math.hypot(p[0] - p0[0], p[1] - p0[1], p[2] - p0[2]) / scale, ms }, [pos.buffer, cores.buffer, counts.buffer])
}

function loop(g: number) {
  if (g !== gen || !playing || !s) return
  if (k >= total) { playing = false; frame(0); return }
  const t0 = performance.now()
  step(s, DT); k++
  frame(performance.now() - t0)
  setTimeout(() => loop(g), 0)
}

self.onmessage = (e: MessageEvent<HumoCmd>) => {
  const c = e.data
  try {
    if (c.type === 'start') {
      gen++; s = initState(c.params, c.particles); k = 0; total = stepsFor(c.params.exp)
      p0 = impulse(s); scale = impulseScale(s) || 1
      const to = Math.min(total, c.to ?? 0)
      while (k < to) { step(s, DT); k++ }
      playing = !c.to; frame(0)
      if (playing) setTimeout(() => loop(gen), 0)
    } else if (c.type === 'play') { if (s && k < total && !playing) { playing = true; setTimeout(() => loop(gen), 0) } }
    else if (c.type === 'pause') playing = false
    else if (c.type === 'freeze') {
      if (!s) return
      playing = false
      const t0 = performance.now(), r = solidify(s, c.opts)
      if (!r) { post({ type: 'error', error: 'El humo de este instante no forma un sólido imprimible.' }); return }
      const stl = c.stl ? meshToBinarySTL(r.mesh) : undefined
      const tr: Transferable[] = [r.mesh.positions.buffer, r.simPositions.buffer, r.mesh.indices.buffer, r.mix.buffer]
      if (stl) tr.push(stl)
      post({ type: 'solid', step: k, positions: r.mesh.positions, simPositions: r.simPositions, indices: r.mesh.indices, mix: r.mix, metrics: r.metrics, heightMm: r.heightMm, widthMm: r.widthMm, ms: performance.now() - t0, stl }, tr)
    }
  } catch (err) { post({ type: 'error', error: String(err) }) }
}
