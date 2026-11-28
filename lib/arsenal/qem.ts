// ARSENAL — simplificación por métricas de error cuadrático (Garland–Heckbert), en su forma
// de «media arista»: una arista u→v se colapsa moviendo u sobre v, así que los vértices que
// quedan son vértices del dual contouring (que ya están sobre caras, cantos y esquinas).
// El costo de mover u a la posición de v es la suma de los cuadrados de sus distancias a los
// planos de todas las caras que u y v ya absorbieron. En una cara plana cuesta cero, así que
// las caras planas quedan con muy pocos triángulos; sacar un vértice de un canto cuesta mucho,
// así que los cantos quedan vivos.
//
// Cada colapso se revisa antes de hacerlo: condición de enlace (la malla sigue siendo una
// superficie cerrada sin aristas de tres caras) y ningún triángulo que se dé vuelta o se
// aplaste. Una malla cerrada entra y una malla cerrada sale.

import type { NetMesh } from '../antesis/nets'

const MAXV = 18 // valencia máxima de un vértice después de un colapso

export function simplify(m: NetMesh, tol: number, cosFlip = 0.5): NetMesh {
  const nV = m.positions.length / 3, nF = m.indices.length / 3
  if (nF < 8) return m
  const P = Float64Array.from(m.positions), F = Int32Array.from(m.indices)
  const fAlive = new Uint8Array(nF).fill(1), vAlive = new Uint8Array(nV).fill(1), stamp = new Int32Array(nV)
  const Q = new Float64Array(nV * 10)
  const vf: number[][] = Array.from({ length: nV }, () => [])
  const fn = new Float64Array(nF * 3)
  for (let f = 0; f < nF; f++) {
    const a = F[3 * f], b = F[3 * f + 1], c = F[3 * f + 2]
    vf[a].push(f); vf[b].push(f); vf[c].push(f)
    const ux = P[3 * b] - P[3 * a], uy = P[3 * b + 1] - P[3 * a + 1], uz = P[3 * b + 2] - P[3 * a + 2]
    const wx = P[3 * c] - P[3 * a], wy = P[3 * c + 1] - P[3 * a + 1], wz = P[3 * c + 2] - P[3 * a + 2]
    let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx
    const L = Math.hypot(nx, ny, nz)
    if (L < 1e-12) continue
    nx /= L; ny /= L; nz /= L
    fn[3 * f] = nx; fn[3 * f + 1] = ny; fn[3 * f + 2] = nz
    const d = -(nx * P[3 * a] + ny * P[3 * a + 1] + nz * P[3 * a + 2])
    for (const v of [a, b, c]) {
      const o = 10 * v
      Q[o] += nx * nx; Q[o + 1] += nx * ny; Q[o + 2] += nx * nz; Q[o + 3] += nx * d
      Q[o + 4] += ny * ny; Q[o + 5] += ny * nz; Q[o + 6] += ny * d
      Q[o + 7] += nz * nz; Q[o + 8] += nz * d; Q[o + 9] += d * d
    }
  }
  const cost = (u: number, v: number) => {
    const ou = 10 * u, ov = 10 * v, x = P[3 * v], y = P[3 * v + 1], z = P[3 * v + 2]
    const q = (k: number) => Q[ou + k] + Q[ov + k]
    return q(0) * x * x + 2 * q(1) * x * y + 2 * q(2) * x * z + 2 * q(3) * x + q(4) * y * y + 2 * q(5) * y * z + 2 * q(6) * y + q(7) * z * z + 2 * q(8) * z + q(9)
  }

  // montículo binario con entradas perezosas (se descartan al salir si cambió algún extremo)
  let cap = nF * 4, hc = new Float64Array(cap), hu = new Int32Array(cap), hv = new Int32Array(cap), hsu = new Int32Array(cap), hsv = new Int32Array(cap)
  let heap = new Int32Array(cap), hn = 0, en = 0
  const limit = tol * tol
  // el orden: primero el error y, a igual error (caras planas: cero), la arista más corta; así
  // no se forman abanicos gigantes alrededor de un solo vértice
  const push = (u: number, v: number) => {
    const q = cost(u, v)
    if (q > limit) return
    const dx = P[3 * u] - P[3 * v], dy = P[3 * u + 1] - P[3 * v + 1], dz = P[3 * u + 2] - P[3 * v + 2]
    const c = q + 1e-7 * (dx * dx + dy * dy + dz * dz)
    if (en >= cap) {
      cap *= 2
      const g = <T extends Float64Array | Int32Array>(a: T): T => { const b = new (a.constructor as { new(n: number): T })(cap); b.set(a); return b }
      hc = g(hc); hu = g(hu); hv = g(hv); hsu = g(hsu); hsv = g(hsv); heap = g(heap)
    }
    const e = en++
    hc[e] = c; hu[e] = u; hv[e] = v; hsu[e] = stamp[u]; hsv[e] = stamp[v]
    let i = hn++
    while (i > 0) { const p = (i - 1) >> 1; if (hc[heap[p]] <= c) break; heap[i] = heap[p]; i = p }
    heap[i] = e
  }
  const pop = () => {
    const top = heap[0], last = heap[--hn]
    let i = 0
    for (;;) {
      const l = 2 * i + 1
      if (l >= hn) break
      const r = l + 1, c = r < hn && hc[heap[r]] < hc[heap[l]] ? r : l
      if (hc[heap[c]] >= hc[last]) break
      heap[i] = heap[c]; i = c
    }
    heap[i] = last
    return top
  }
  for (let f = 0; f < nF; f++) {
    const a = F[3 * f], b = F[3 * f + 1], c = F[3 * f + 2]
    push(a, b); push(b, a); push(b, c); push(c, b); push(c, a); push(a, c)
  }

  const nbr = (v: number, out: Set<number>) => {
    out.clear()
    for (const f of vf[v]) if (fAlive[f]) for (let q = 0; q < 3; q++) { const w = F[3 * f + q]; if (w !== v) out.add(w) }
    return out
  }
  const Nu = new Set<number>(), Nv = new Set<number>()
  while (hn > 0) {
    const e = pop(), u = hu[e], v = hv[e]
    if (!vAlive[u] || !vAlive[v] || stamp[u] !== hsu[e] || stamp[v] !== hsv[e]) continue
    if (vf[u].length + vf[v].length - 4 > MAXV) continue
    // condición de enlace: los vecinos comunes son exactamente los dos opuestos a la arista
    nbr(u, Nu); nbr(v, Nv)
    if (!Nu.has(v)) continue
    const shared: number[] = [], opp: number[] = []
    for (const f of vf[u]) if (fAlive[f]) {
      const a = F[3 * f], b = F[3 * f + 1], c = F[3 * f + 2]
      if (a === v || b === v || c === v) { shared.push(f); opp.push(a !== u && a !== v ? a : b !== u && b !== v ? b : c) }
    }
    if (shared.length !== 2) continue
    let common = 0
    for (const w of Nu) if (Nv.has(w)) common++
    if (common !== 2) continue
    // ningún triángulo que quede se da vuelta ni se aplasta
    let ok = true
    const vx = P[3 * v], vy = P[3 * v + 1], vz = P[3 * v + 2]
    for (const f of vf[u]) {
      if (!fAlive[f] || shared.includes(f)) continue
      const idx = [F[3 * f], F[3 * f + 1], F[3 * f + 2]]
      const q = idx.indexOf(u), a = idx[(q + 1) % 3], b = idx[(q + 2) % 3]
      const ux = P[3 * a] - vx, uy = P[3 * a + 1] - vy, uz = P[3 * a + 2] - vz
      const wx = P[3 * b] - vx, wy = P[3 * b + 1] - vy, wz = P[3 * b + 2] - vz
      const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx, L = Math.hypot(nx, ny, nz)
      const ox = fn[3 * f], oy = fn[3 * f + 1], oz = fn[3 * f + 2]
      if (L < 1e-9) { ok = false; break }
      if (ox * ox + oy * oy + oz * oz > 0.5 && (nx * ox + ny * oy + nz * oz) / L < cosFlip) { ok = false; break }
    }
    if (!ok) continue
    // colapso: u desaparece, sus caras pasan a v
    for (const f of shared) fAlive[f] = 0
    for (const f of vf[u]) {
      if (!fAlive[f]) continue
      for (let q = 0; q < 3; q++) if (F[3 * f + q] === u) F[3 * f + q] = v
      const a = F[3 * f], b = F[3 * f + 1], c = F[3 * f + 2]
      const ux = P[3 * b] - P[3 * a], uy = P[3 * b + 1] - P[3 * a + 1], uz = P[3 * b + 2] - P[3 * a + 2]
      const wx = P[3 * c] - P[3 * a], wy = P[3 * c + 1] - P[3 * a + 1], wz = P[3 * c + 2] - P[3 * a + 2]
      const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx, L = Math.hypot(nx, ny, nz) || 1
      fn[3 * f] = nx / L; fn[3 * f + 1] = ny / L; fn[3 * f + 2] = nz / L
      vf[v].push(f)
    }
    vf[v] = vf[v].filter((f) => fAlive[f])
    for (const w of opp) vf[w] = vf[w].filter((f) => fAlive[f])
    for (let k = 0; k < 10; k++) Q[10 * v + k] += Q[10 * u + k]
    vAlive[u] = 0; vf[u] = []
    // solo cambian los costos de las aristas de v (su cuádrica creció); las demás siguen valiendo
    stamp[v]++
    for (const w of nbr(v, Nv)) { push(v, w); push(w, v) }
  }

  const remap = new Int32Array(nV).fill(-1), op: number[] = [], oi: number[] = []
  for (let f = 0; f < nF; f++) {
    if (!fAlive[f]) continue
    for (let q = 0; q < 3; q++) {
      const v = F[3 * f + q]
      if (remap[v] < 0) { remap[v] = op.length / 3; op.push(P[3 * v], P[3 * v + 1], P[3 * v + 2]) }
      oi.push(remap[v])
    }
  }
  return { positions: Float32Array.from(op), indices: Uint32Array.from(oi) }
}
