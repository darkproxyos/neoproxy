'use client'

import type { MeshParams } from './mesh'
import type { Timeline } from './events'
import type { Volume } from './volume'
import type { CapasMeshOut, CapasRequest, CapasResponse } from './worker'

export type MeshReply = { out: CapasMeshOut | null; timeline?: Timeline; stl?: ArrayBuffer; ms: number }
const spawn = () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })

// Mallador de vista previa: un solo worker que vive con la página. Si llega un
// pedido nuevo mientras trabaja, solo se recuerda el último: los intermedios no
// importan, la pieza ya cambió.
export class Mesher {
  private worker: Worker | null = null
  private busy = false
  private next: { vol: Volume; params: MeshParams; resolve: (r: MeshReply | null) => void } | null = null
  private id = 0

  request(vol: Volume, params: MeshParams): Promise<MeshReply | null> {
    return new Promise((resolve) => {
      this.next?.resolve(null)
      this.next = { vol, params, resolve }
      this.pump()
    })
  }

  private pump() {
    if (this.busy || !this.next) return
    const job = this.next; this.next = null
    this.worker ??= spawn()
    this.busy = true
    const id = ++this.id
    const w = this.worker
    w.onmessage = (e: MessageEvent<CapasResponse>) => {
      this.busy = false
      if (e.data.id === id) job.resolve(e.data.ok ? { out: e.data.out, timeline: e.data.timeline, stl: e.data.stl, ms: e.data.ms } : null)
      else job.resolve(null)
      this.pump()
    }
    w.onerror = () => { this.busy = false; job.resolve(null); this.worker?.terminate(); this.worker = null; this.pump() }
    w.postMessage({ id, vol: job.vol, params: job.params, stl: false, timeline: true } satisfies CapasRequest, [job.vol.data.buffer])
  }

  dispose() { this.worker?.terminate(); this.worker = null; this.next?.resolve(null); this.next = null }
}

// Exportación a alta resolución: un worker aparte que se descarta al terminar,
// así la vista previa no se detiene.
export function exportInWorker(vol: Volume, params: MeshParams): { promise: Promise<MeshReply>; cancel: () => void } {
  const w = spawn()
  const promise = new Promise<MeshReply>((resolve, reject) => {
    w.onmessage = (e: MessageEvent<CapasResponse>) => {
      w.terminate()
      if (e.data.ok) resolve({ out: e.data.out, timeline: e.data.timeline, stl: e.data.stl, ms: e.data.ms }); else reject(new Error(e.data.error))
    }
    w.onerror = (e) => { w.terminate(); reject(new Error(e.message || 'Error en el worker')) }
    w.postMessage({ id: 1, vol, params, stl: true, timeline: false } satisfies CapasRequest, [vol.data.buffer])
  })
  return { promise, cancel: () => w.terminate() }
}
