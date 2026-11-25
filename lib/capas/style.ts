// Color de las leyes y del tiempo: lo comparten el lienzo 2D, el plano de la capa
// presente y el color por altura del sólido, para que se lean como una sola cosa.

import type { LawId } from './laws'

export type Rgb = [number, number, number]
export const LAW_STYLE: Record<LawId, { accent: string; ramp: [Rgb, Rgb, Rgb] }> = {
  mitosis: { accent: '#7cf0b0', ramp: [[26, 58, 143], [41, 214, 164], [240, 255, 176]] },
  coral: { accent: '#ff8fb4', ramp: [[90, 29, 122], [255, 93, 143], [255, 217, 160]] },
  espirales: { accent: '#7fc4ff', ramp: [[18, 48, 122], [70, 168, 255], [230, 244, 255]] },
  defectos: { accent: '#ffb86b', ramp: [[75, 29, 110], [255, 79, 163], [255, 224, 138]] },
}

// color del tiempo: 0 = base (el pasado), 1 = la cima (el presente)
export function rampColor(law: LawId, t: number, out: Rgb = [0, 0, 0]): Rgb {
  const [a, b, c] = LAW_STYLE[law].ramp
  const u = Math.min(1, Math.max(0, t))
  const [p, q, k] = u < 0.5 ? [a, b, u * 2] : [b, c, (u - 0.5) * 2]
  out[0] = p[0] + (q[0] - p[0]) * k; out[1] = p[1] + (q[1] - p[1]) * k; out[2] = p[2] + (q[2] - p[2]) * k
  return out
}

// campo 0..255 -> RGBA. Lo que supera θ es sólido (se imprime) y se pinta con la
// rampa; lo que no, queda como una sombra tenue para ver la estructura bajo el umbral.
export function colorizeField(
  field: Uint8Array, w: number, h: number, theta: number, law: LawId, out: Uint8Array | Uint8ClampedArray,
  opts: { plane?: boolean; rlim2?: number } = {},
) {
  const th = theta * 255, tmp: Rgb = [0, 0, 0], acc = LAW_STYLE[law].ramp[1]
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = j * w + i, v = field[k], o = k * 4
    let dim = 1
    if (opts.rlim2 !== undefined && opts.rlim2 !== Infinity) {
      const xx = (i / (w - 1)) * 2 - 1, yy = (j / (h - 1)) * 2 - 1
      if (xx * xx + yy * yy > opts.rlim2) {
        if (opts.plane) { out[o] = 0; out[o + 1] = 0; out[o + 2] = 0; out[o + 3] = 0; continue }
        dim = 0.5 // el mundo sigue ahí, pero fuera de la pieza
      }
    }
    if (v >= th) {
      rampColor(law, 0.3 + 0.7 * Math.min(1, (v - th) / Math.max(1, 255 - th) * 1.4), tmp)
      out[o] = tmp[0] * dim; out[o + 1] = tmp[1] * dim; out[o + 2] = tmp[2] * dim; out[o + 3] = opts.plane ? 235 : 255
    } else {
      const s = v / Math.max(1, th)
      out[o] = (6 + acc[0] * 0.16 * s) * dim; out[o + 1] = (10 + acc[1] * 0.16 * s) * dim; out[o + 2] = (18 + acc[2] * 0.2 * s) * dim
      out[o + 3] = opts.plane ? 46 : 255
    }
  }
}
