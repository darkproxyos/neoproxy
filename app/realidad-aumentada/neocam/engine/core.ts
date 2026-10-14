// Utilidades compartidas por todos los modos de NeoCam: mapeo de paleta por
// LUT (para térmica/nocturna/calor/infrarrojo), canvas de máscara de persona
// reutilizable, y un sistema de partículas genérico (aura, juego, cubos,
// chispas de glitch). Todo corre sobre un canvas de proceso reducido
// (PROC_W) para que el mapeo por pixel sea viable en tiempo real.

export const PROC_W = 480

export type RGB = [number, number, number]
export type Stop = [number, number, number, number] // t, r, g, b

export function buildLUT(stops: Stop[]): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256 * 3)
  for (let i = 0; i < 256; i++) {
    const t = i / 255
    let a = stops[0]
    let b = stops[stops.length - 1]
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) { a = stops[s]; b = stops[s + 1]; break }
    }
    const span = b[0] - a[0] || 1
    const lt = (t - a[0]) / span
    lut[i * 3] = a[1] + (b[1] - a[1]) * lt
    lut[i * 3 + 1] = a[2] + (b[2] - a[2]) * lt
    lut[i * 3 + 2] = a[3] + (b[3] - a[3]) * lt
  }
  return lut
}

export const PALETTES: Record<string, Stop[]> = {
  inferno: [[0, 0, 0, 4], [0.25, 87, 16, 110], [0.5, 188, 55, 84], [0.75, 249, 142, 8], [1, 252, 255, 164]],
  jet: [[0, 0, 0, 128], [0.125, 0, 0, 255], [0.375, 0, 255, 255], [0.625, 255, 255, 0], [0.875, 255, 0, 0], [1, 128, 0, 0]],
  hot: [[0, 0, 0, 0], [0.33, 255, 0, 0], [0.66, 255, 255, 0], [1, 255, 255, 255]],
  plasma: [[0, 13, 8, 135], [0.25, 126, 3, 168], [0.5, 204, 71, 120], [0.75, 248, 149, 64], [1, 240, 249, 33]],
  night: [[0, 0, 0, 0], [0.4, 0, 40, 10], [0.7, 20, 160, 40], [1, 170, 255, 150]],
  heat: [[0, 0, 0, 0], [0.3, 40, 0, 0], [0.6, 200, 40, 0], [0.85, 255, 140, 0], [1, 255, 255, 180]],
}

const lutCache = new Map<string, Uint8ClampedArray>()
export function getLUT(name: string): Uint8ClampedArray {
  let lut = lutCache.get(name)
  if (!lut) { lut = buildLUT(PALETTES[name] || PALETTES.inferno); lutCache.set(name, lut) }
  return lut
}

export function colorFromLUT(lut: Uint8ClampedArray, t: number): string {
  const i = Math.max(0, Math.min(255, Math.round(t * 255))) * 3
  return `rgb(${lut[i]},${lut[i + 1]},${lut[i + 2]})`
}

// Mapea la luminancia del frame actual sobre un canvas de proceso ya
// dibujado (video o diff-contra-fondo) a los colores de una paleta.
export function mapLuminanceToPalette(pctx: CanvasRenderingContext2D, pw: number, ph: number, lut: Uint8ClampedArray) {
  const img = pctx.getImageData(0, 0, pw, ph)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0
    const li = lum * 3
    d[i] = lut[li]; d[i + 1] = lut[li + 1]; d[i + 2] = lut[li + 2]
  }
  pctx.putImageData(img, 0, 0)
}

// Igual que arriba pero compara contra un fondo aprendido (promedio móvil)
// en vez de la luminancia cruda — "calor" que reacciona al movimiento real.
export function mapDiffToPalette(pctx: CanvasRenderingContext2D, bgData: ImageData, pw: number, ph: number, lut: Uint8ClampedArray, gain: number) {
  const img = pctx.getImageData(0, 0, pw, ph)
  const d = img.data
  const bg = bgData.data
  for (let i = 0; i < d.length; i += 4) {
    const curLum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114
    const bgLum = bg[i] * 0.299 + bg[i + 1] * 0.587 + bg[i + 2] * 0.114
    const diff = Math.min(255, Math.abs(curLum - bgLum) * gain)
    const li = (diff | 0) * 3
    d[i] = lut[li]; d[i + 1] = lut[li + 1]; d[i + 2] = lut[li + 2]
  }
  pctx.putImageData(img, 0, 0)
}

export function updateRunningBackground(bgCanvas: HTMLCanvasElement, video: CanvasImageSource, w: number, h: number, alpha = 0.02) {
  const ctx = bgCanvas.getContext('2d')!
  ctx.globalAlpha = alpha
  ctx.drawImage(video, 0, 0, w, h)
  ctx.globalAlpha = 1
}

// Convierte la máscara de persona (Float32Array 0..1, resolución propia del
// segmentador) en un canvas blanco con alpha = probabilidad de persona, que
// se puede escalar con drawImage a cualquier tamaño destino (GPU, no loop JS).
export type MaskCache = { canvas: HTMLCanvasElement; w: number; h: number }
export function buildMaskCanvas(mask: Float32Array, mw: number, mh: number, cache: MaskCache): HTMLCanvasElement {
  if (cache.w !== mw || cache.h !== mh) {
    cache.canvas.width = mw; cache.canvas.height = mh
    cache.w = mw; cache.h = mh
  }
  const ctx = cache.canvas.getContext('2d')!
  const img = ctx.createImageData(mw, mh)
  const d = img.data
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    const a = mask[i] * 255
    d[p] = 255; d[p + 1] = 255; d[p + 2] = 255; d[p + 3] = a
  }
  ctx.putImageData(img, 0, 0)
  return cache.canvas
}

// Recorta un canvas fuente dejando solo los pixeles donde la máscara tiene
// alpha (destination-in = composición GPU, sin loop por pixel).
export function clipToMask(scratch: HTMLCanvasElement, source: CanvasImageSource, maskCanvas: HTMLCanvasElement, w: number, h: number): HTMLCanvasElement {
  scratch.width = w; scratch.height = h
  const ctx = scratch.getContext('2d')!
  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(source, 0, 0, w, h)
  ctx.globalCompositeOperation = 'destination-in'
  ctx.drawImage(maskCanvas, 0, 0, w, h)
  ctx.globalCompositeOperation = 'source-over'
  return scratch
}

// Silueta rellena de un color sólido (para SILHOUETTE/BODY/AURA), opcionalmente
// erosionada (escalada levemente hacia el centro) para sacar solo el contorno.
export function fillMaskColor(scratch: HTMLCanvasElement, maskCanvas: HTMLCanvasElement, w: number, h: number, color: string, erode = 1): HTMLCanvasElement {
  scratch.width = w; scratch.height = h
  const ctx = scratch.getContext('2d')!
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'destination-in'
  if (erode === 1) {
    ctx.drawImage(maskCanvas, 0, 0, w, h)
  } else {
    const cx = w / 2, cy = h / 2
    ctx.save()
    ctx.translate(cx, cy); ctx.scale(erode, erode); ctx.translate(-cx, -cy)
    ctx.drawImage(maskCanvas, 0, 0, w, h)
    ctx.restore()
  }
  ctx.globalCompositeOperation = 'source-over'
  return scratch
}

// Anillo de contorno: silueta llena menos una versión erosionada de sí misma.
export function outlineFromMask(scratch: HTMLCanvasElement, maskCanvas: HTMLCanvasElement, w: number, h: number, color: string, thickness = 0.94): HTMLCanvasElement {
  scratch.width = w; scratch.height = h
  const ctx = scratch.getContext('2d')!
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'destination-in'
  ctx.drawImage(maskCanvas, 0, 0, w, h)
  ctx.globalCompositeOperation = 'destination-out'
  const cx = w / 2, cy = h / 2
  ctx.save()
  ctx.translate(cx, cy); ctx.scale(thickness, thickness); ctx.translate(-cx, -cy)
  ctx.drawImage(maskCanvas, 0, 0, w, h)
  ctx.restore()
  ctx.globalCompositeOperation = 'source-over'
  return scratch
}

export type Particle = {
  x: number; y: number; vx: number; vy: number; r: number
  life: number; decay: number; color: string
  rot?: number; vrot?: number; gravity?: number
}

export class ParticleSystem {
  list: Particle[] = []
  spawn(p: Particle) { this.list.push(p) }
  update(dt: number) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i]
      p.x += p.vx * dt
      p.y += p.vy * dt
      if (p.gravity) p.vy += p.gravity * dt
      p.life -= p.decay * dt
      if (p.rot !== undefined) p.rot! += (p.vrot || 0) * dt
      if (p.life <= 0) this.list.splice(i, 1)
    }
  }
  drawCircles(ctx: CanvasRenderingContext2D, blend: GlobalCompositeOperation = 'lighter') {
    ctx.globalCompositeOperation = blend
    for (const p of this.list) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life))
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, Math.max(0.3, p.r * p.life), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }
  clear() { this.list.length = 0 }
}

export function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
export function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }
