// Línea de vida de las "partes" de la pieza: qué nace, se divide, se funde o
// muere a medida que sube el tiempo.
//
// En cada capa se etiquetan las componentes conexas del sólido (4-vecindad, sin
// envolver los bordes: la pieza real tiene caras). Dos componentes de capas
// consecutivas son la misma historia si comparten al menos una celda. De ese
// grafo salen los eventos:
//   · nacimiento — una parte sin padre en la capa anterior. Es una isla en el
//     aire: al imprimir necesita un soporte. Cuenta los soportes de la pieza.
//   · división   — una parte con dos o más hijas (una rama).
//   · fusión     — una parte con dos o más padres (un puente).
//   · muerte     — una parte sin hijas (la punta de una columna).
// Que una pieza se imprima sin soportes equivale a que toda capa descienda de la
// anterior: la genealogía es la imprimibilidad.

import type { Volume } from './volume'

export type EventKind = 'birth' | 'split' | 'merge' | 'death'
export type CapasEvent = { kind: EventKind; slice: number; x: number; y: number; area: number } // x, y en 0..1
export type Timeline = {
  pop: Uint16Array        // partes por capa
  solid: Float32Array     // fracción de celdas sólidas por capa
  events: CapasEvent[]    // sin las componentes de la capa 0 (la base)
  counts: Record<EventKind, number>
  peak: number            // máximo de partes simultáneas
}

// etiqueta las componentes de una capa binaria; devuelve su número y rellena `lab`
function label(bin: Uint8Array, w: number, h: number, minCells: number, lab: Int32Array, stack: Int32Array, info: { area: number[]; cx: number[]; cy: number[] }): number {
  lab.fill(0)
  info.area.length = 0; info.cx.length = 0; info.cy.length = 0
  info.area.push(0); info.cx.push(0); info.cy.push(0)
  let n = 0
  const seen = new Uint8Array(w * h)
  const members: number[] = []
  for (let s0 = 0; s0 < w * h; s0++) {
    if (seen[s0] || !bin[s0]) continue
    let sp = 0, cnt = 0, sx = 0, sy = 0
    stack[sp++] = s0; seen[s0] = 1; members.length = 0
    while (sp) {
      const i = stack[--sp]
      members.push(i); cnt++
      const x = i % w, y = (i / w) | 0
      sx += x; sy += y
      if (x > 0 && !seen[i - 1] && bin[i - 1]) { seen[i - 1] = 1; stack[sp++] = i - 1 }
      if (x < w - 1 && !seen[i + 1] && bin[i + 1]) { seen[i + 1] = 1; stack[sp++] = i + 1 }
      if (y > 0 && !seen[i - w] && bin[i - w]) { seen[i - w] = 1; stack[sp++] = i - w }
      if (y < h - 1 && !seen[i + w] && bin[i + w]) { seen[i + w] = 1; stack[sp++] = i + w }
    }
    if (cnt < minCells) continue // ruido: no es una parte
    n++
    for (const i of members) lab[i] = n
    info.area.push(cnt); info.cx.push(sx / cnt / (w - 1)); info.cy.push(sy / cnt / (h - 1))
  }
  return n
}

// `fp`: silueta de la pieza por capa (ver footprint); lo que cae fuera no es parte de la pieza
export function analyzeTimeline(vol: Volume, theta: number, fp?: (slice: number) => number): Timeline {
  const { w, h, t, data } = vol
  const th = Math.round(theta * 255), sl = w * h
  const minCells = Math.max(4, Math.round(0.0003 * sl))
  const pop = new Uint16Array(t), solid = new Float32Array(t)
  const events: CapasEvent[] = []
  const counts: Record<EventKind, number> = { birth: 0, split: 0, merge: 0, death: 0 }
  let prev = new Int32Array(sl), cur = new Int32Array(sl)
  const stack = new Int32Array(sl)
  let pinfo = { area: [] as number[], cx: [] as number[], cy: [] as number[] }
  let cinfo = { area: [] as number[], cx: [] as number[], cy: [] as number[] }
  const bin = new Uint8Array(sl)
  let np = 0
  for (let s = 0; s < t; s++) {
    const off = s * sl, r2 = fp ? fp(s) : Infinity
    let on = 0
    for (let j = 0; j < h; j++) {
      const yy = (j / (h - 1)) * 2 - 1
      for (let i = 0; i < w; i++) {
        const xx = (i / (w - 1)) * 2 - 1, k = j * w + i
        const v = data[off + k] >= th && xx * xx + yy * yy <= r2 ? 1 : 0
        bin[k] = v; on += v
      }
    }
    solid[s] = on / sl
    const nc = label(bin, w, h, minCells, cur, stack, cinfo)
    pop[s] = Math.min(65535, nc)
    if (s > 0) {
      // pares (padre, hija) por solape de celdas
      const parents: Set<number>[] = Array.from({ length: nc + 1 }, () => new Set())
      const children: Set<number>[] = Array.from({ length: np + 1 }, () => new Set())
      for (let i = 0; i < sl; i++) {
        const a = prev[i], b = cur[i]
        if (a && b) { parents[b].add(a); children[a].add(b) }
      }
      for (let b = 1; b <= nc; b++) {
        if (parents[b].size === 0) events.push({ kind: 'birth', slice: s, x: cinfo.cx[b], y: cinfo.cy[b], area: cinfo.area[b] })
        else if (parents[b].size >= 2) events.push({ kind: 'merge', slice: s, x: cinfo.cx[b], y: cinfo.cy[b], area: cinfo.area[b] })
      }
      for (let a = 1; a <= np; a++) {
        if (children[a].size === 0) events.push({ kind: 'death', slice: s - 1, x: pinfo.cx[a], y: pinfo.cy[a], area: pinfo.area[a] })
        else if (children[a].size >= 2) events.push({ kind: 'split', slice: s, x: pinfo.cx[a], y: pinfo.cy[a], area: pinfo.area[a] })
      }
    }
    ;[prev, cur] = [cur, prev]
    ;[pinfo, cinfo] = [cinfo, pinfo]
    np = nc
  }
  // las partes de la última capa no "mueren": siguen vivas al cerrar la pieza
  for (const e of events) counts[e.kind]++
  return { pop, solid, events, counts, peak: pop.reduce((m, v) => Math.max(m, v), 0) }
}
