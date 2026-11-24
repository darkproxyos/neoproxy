/// <reference lib="webworker" />
import { generateOriented } from './generate'
import { meshToBinarySTL } from './stl'
import type { Family } from './families'

export type WorkerRequest = { id: number; family: Family; seed: number; res: number; stl: boolean }
export type WorkerResponse =
  | { id: number; ok: true; positions: Float32Array; indices: Uint32Array; metrics: unknown; stl?: ArrayBuffer }
  | { id: number; ok: false; error: string }

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, family, seed, res, stl } = e.data
  try {
    const g = generateOriented(family, seed, res)
    if (!g) {
      ;(self as unknown as Worker).postMessage({ id, ok: false, error: 'La receta no produjo un sólido imprimible.' } satisfies WorkerResponse)
      return
    }
    const buf = stl ? meshToBinarySTL(g.mesh) : undefined
    const transfer: Transferable[] = [g.mesh.positions.buffer, g.mesh.indices.buffer]
    if (buf) transfer.push(buf)
    ;(self as unknown as Worker).postMessage(
      { id, ok: true, positions: g.mesh.positions, indices: g.mesh.indices, metrics: g.metrics, stl: buf } satisfies WorkerResponse,
      transfer,
    )
  } catch (err) {
    ;(self as unknown as Worker).postMessage({ id, ok: false, error: String(err) } satisfies WorkerResponse)
  }
}
