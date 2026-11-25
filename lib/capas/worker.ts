/// <reference lib="webworker" />
import { buildMesh, meshToBinarySTL, resolveAspect, type MeshParams, type MeshResult } from './mesh'
import { analyzeTimeline, type Timeline } from './events'
import { BASE_FRAC, footprint, type Volume } from './volume'

export type CapasRequest = { id: number; vol: Volume; params: MeshParams; stl: boolean; timeline: boolean }
export type CapasMeshOut = Omit<MeshResult, 'mesh'> & { positions: Float32Array; indices: Uint32Array }
export type CapasResponse =
  | { id: number; ok: true; out: CapasMeshOut | null; timeline?: Timeline; stl?: ArrayBuffer; ms: number }
  | { id: number; ok: false; error: string }

const post = (msg: CapasResponse, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(msg, transfer)

self.onmessage = (e: MessageEvent<CapasRequest>) => {
  const { id, vol, params, stl, timeline } = e.data
  const t0 = Date.now()
  try {
    const res = buildMesh(vol, params)
    const aspect = res ? res.aspect : resolveAspect(vol, params.theta, params.aspect)
    const tl = timeline ? analyzeTimeline(vol, params.theta, footprint(params.shape, aspect, params.planned), params.base ? Math.ceil(BASE_FRAC * (params.planned - 1)) : 0) : undefined
    if (!res) { post({ id, ok: true, out: null, timeline: tl, ms: Date.now() - t0 }); return }
    const { mesh, ...rest } = res
    const buf = stl ? meshToBinarySTL(mesh) : undefined
    const transfer: Transferable[] = [mesh.positions.buffer, mesh.indices.buffer, rest.times.buffer]
    if (buf) transfer.push(buf)
    post({ id, ok: true, out: { ...rest, positions: mesh.positions, indices: mesh.indices }, timeline: tl, stl: buf, ms: Date.now() - t0 }, transfer)
  } catch (err) {
    post({ id, ok: false, error: String(err) })
  }
}
