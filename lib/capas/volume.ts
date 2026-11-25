// De una pila de capas a un sólido: el volumen espacio-tiempo.
//
// Una pieza de CAPAS es { (x, y, t) : campo(x, y, t) > θ }, con el tiempo como
// altura. Se malla con los mismos surface nets del resto del sitio, sobre una
// rejilla cúbica: el sólido ocupa una caja [-hx,hx]×[-hx,hx]×[-hz,hz] dentro del
// cubo, con hz/hx = aspecto (altura impresa / ancho impreso). Así las celdas
// siguen siendo cúbicas y las normales, físicas.

import type { Field } from '../specimens/sdf'

export type Volume = { w: number; h: number; t: number; data: Uint8Array } // data[(s*h + y)*w + x], 0..255

export const FIT = 0.9 // la caja ocupa 0,9 del cubo: polygonize no cierra superficies sobre el borde

export function halfExtents(aspect: number): { hx: number; hz: number } {
  return aspect >= 1 ? { hx: FIT / aspect, hz: FIT } : { hx: FIT, hz: FIT * aspect }
}

// Silueta de la pieza. 'caja': el prisma que sale de cortar el espacio-tiempo;
// 'testigo': un cilindro, como la muestra que saca una sonda; 'cupula': el
// cilindro con la cima redondeada (la base sigue plana, así que no agrega voladizos).
export type Shape = 'caja' | 'testigo' | 'cupula'
export const SHAPES: { id: Shape; label: string }[] = [
  { id: 'caja', label: 'Prisma' }, { id: 'testigo', label: 'Testigo' }, { id: 'cupula', label: 'Cúpula' },
]
// Silueta horizontal de la pieza en cada capa, como radio² normalizado respecto del
// círculo inscrito en el mundo (Infinity = sin recorte, el prisma).
export function footprint(shape: Shape, aspect: number, planned: number): (slice: number) => number {
  if (shape === 'caja') return () => Infinity
  if (shape === 'testigo') return () => 1
  const { hx, hz } = halfExtents(aspect), dh = Math.min(hx, hz), zc = hz - dh, sz = (planned - 1) / (2 * hz)
  return (s) => {
    const z = s / sz - hz
    if (z <= zc) return 1
    const q = (z - zc) / dh
    return Math.max(0, 1 - q * q)
  }
}
export const BASE_FRAC = 0.05 // espesor de la base, como fracción de la altura de la pieza

export function volumeField(vol: Volume, theta: number, aspect: number, tPlanned = vol.t, shape: Shape = 'caja', base = false): Field {
  const { w, h, t, data } = vol
  const { hx, hz } = halfExtents(aspect)
  const th = theta * 255, sl = w * h
  const sx = (w - 1) / (2 * hx), sz = (tPlanned - 1) / (2 * hz)
  return (x, y, z) => {
    const ox = Math.abs(x) - hx, oy = Math.abs(y) - hx, oz = Math.abs(z) - hz
    const u = (x + hx) * sx, v = (y + hx) * sx, s = (z + hz) * sz
    if (ox > 0 || oy > 0 || oz > 0 || s > t - 1) return 0.1 + Math.max(ox, oy, oz, s > t - 1 ? (s - (t - 1)) / sz : -1)
    const i = Math.min(w - 2, Math.floor(u)), j = Math.min(h - 2, Math.floor(v)), k = Math.min(t - 2, Math.max(0, Math.floor(s)))
    const fu = u - i, fv = v - j, fs = Math.min(1, s - k)
    const o = k * sl + j * w + i
    const c00 = data[o] * (1 - fu) + data[o + 1] * fu
    const c10 = data[o + w] * (1 - fu) + data[o + w + 1] * fu
    const c01 = data[o + sl] * (1 - fu) + data[o + sl + 1] * fu
    const c11 = data[o + sl + w] * (1 - fu) + data[o + sl + w + 1] * fu
    const val = (c00 * (1 - fv) + c10 * fv) * (1 - fs) + (c01 * (1 - fv) + c11 * fv) * fs
    let f = (th - val) * 0.004
    if (shape === 'caja') {
      if (base && z < -hz + 2 * hz * BASE_FRAC) f = Math.min(f, -0.02)
      return f
    }
    const rr = Math.sqrt(x * x + y * y) / hx
    let e = rr - 1
    if (shape === 'cupula') {
      const dh = Math.min(hx, hz), zc = hz - dh
      if (z > zc) { const q = (z - zc) / dh; e = Math.sqrt(rr * rr + q * q) - 1 }
    }
    f = Math.max(f, e * 0.2)
    // la base es el pasado de la pieza: un disco macizo apoyado en la cama
    if (base && z < -hz + 2 * hz * BASE_FRAC) f = Math.min(f, Math.max(-0.02, e * 0.2))
    return f
  }
}

// ¿Cuánta superficie queda en voladizo (cara que mira hacia abajo a menos de 45°
// de la vertical) si la altura impresa es `aspect` veces el ancho?  Se estima
// con el gradiente del campo en las celdas que cruzan el umbral: la normal
// física es (gx, gy, gs·ρ) con ρ = [(t−1)/(w−1)] / aspecto. No hace falta mallar.
export function overhangFraction(vol: Volume, theta: number, aspect: number): number {
  const { w, h, t, data } = vol
  const th = theta * 255, sl = w * h, rho = ((t - 1) / (w - 1)) / aspect
  let over = 0, tot = 0
  for (let s = 1; s < t - 1; s++) for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = s * sl + y * w + x, c = data[i]
    if ((c >= th) === (data[i + 1] >= th) && (c >= th) === (data[i + w] >= th) && (c >= th) === (data[i + sl] >= th)) continue
    const gx = data[i + 1] - data[i - 1], gy = data[i + w] - data[i - w], gs = (data[i + sl] - data[i - sl]) * rho
    const m = Math.sqrt(gx * gx + gy * gy + gs * gs)
    if (m < 1e-6) continue
    tot++
    // la normal exterior apunta hacia donde el campo baja (el sólido es campo > θ)
    if (gs / m > 0.7071) over++
  }
  return tot ? over / tot : 0
}

// Estiramiento mínimo del tiempo para que la pieza sea "causal": como mucho
// `limit` de su superficie en voladizo. Es la velocidad de la luz del universo:
// ninguna línea de vida se inclina más de 45° respecto de la vertical.
export function causalAspect(vol: Volume, theta: number, limit = 0.03): number {
  let lo = 0.25, hi = 6
  if (overhangFraction(vol, theta, lo) <= limit) return lo
  if (overhangFraction(vol, theta, hi) > limit) return hi
  for (let i = 0; i < 12; i++) {
    const mid = Math.sqrt(lo * hi)
    if (overhangFraction(vol, theta, mid) > limit) lo = mid; else hi = mid
  }
  return hi
}

// Cuántas veces cruza el mundo, durante toda la pieza, cada trozo de superficie.
//
// La isosuperficie {campo = θ} se mueve de lado a velocidad v = |∂campo/∂capa| / |∇ₓᵧ campo|
// (celdas por capa). Durante las (t − 1) capas recorre v·(t − 1) celdas, o sea
// v·(t − 1)/(w − 1) anchos del mundo. Una cara es voladizo exactamente cuando ese número
// supera el aspecto (alto/ancho) de la pieza; por eso el aspecto causal es su cuantil
// (1 − límite). Se calcula aparte de overhangFraction para poder comprobar la identidad.
// Las caras que no miran hacia abajo cuentan 0 (nunca son voladizo).
export function crossingDistribution(vol: Volume, theta: number): Float32Array {
  const { w, h, t, data } = vol
  const th = theta * 255, sl = w * h, k = (t - 1) / (w - 1)
  const out: number[] = []
  for (let s = 1; s < t - 1; s++) for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = s * sl + y * w + x, c = data[i]
    if ((c >= th) === (data[i + 1] >= th) && (c >= th) === (data[i + w] >= th) && (c >= th) === (data[i + sl] >= th)) continue
    const gx = data[i + 1] - data[i - 1], gy = data[i + w] - data[i - w], gs = data[i + sl] - data[i - sl]
    if (Math.sqrt(gx * gx + gy * gy + gs * gs) < 1e-6) continue
    out.push(gs > 0 ? (gs / Math.max(1e-9, Math.sqrt(gx * gx + gy * gy))) * k : 0)
  }
  return Float32Array.from(out)
}
