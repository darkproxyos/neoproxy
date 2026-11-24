'use client'

import type { Family } from './families'
import type { Metrics } from './analyze'
import type { WorkerRequest, WorkerResponse } from './worker'

export type ClientResult = { positions: Float32Array; indices: Uint32Array; metrics: Metrics; stl?: ArrayBuffer }

let nextId = 1

// Un worker por pedido: se descarta al terminar, así un espécimen pesado
// (mandelbulb, voronoi a resolución alta) nunca congela la página.
export function generateInWorker(family: Family, seed: number, res: number, stl = false): { promise: Promise<ClientResult>; cancel: () => void } {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  const id = nextId++
  const promise = new Promise<ClientResult>((resolve, reject) => {
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      worker.terminate()
      if (e.data.ok) {
        resolve({ positions: e.data.positions, indices: e.data.indices, metrics: e.data.metrics as Metrics, stl: e.data.stl })
      } else reject(new Error(e.data.error))
    }
    worker.onerror = (e) => { worker.terminate(); reject(new Error(e.message || 'Error en el worker')) }
    worker.postMessage({ id, family, seed, res, stl } satisfies WorkerRequest)
  })
  return { promise, cancel: () => worker.terminate() }
}
