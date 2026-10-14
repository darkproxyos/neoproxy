import { FaceBox } from './vision'
import {
  PROC_W, getLUT, mapLuminanceToPalette, mapDiffToPalette, updateRunningBackground,
  clipToMask, fillMaskColor, outlineFromMask, ParticleSystem, clamp,
} from './core'

export type ModeId =
  | 'neon' | 'punk' | 'thermal' | 'night' | 'glitch' | 'matrix' | 'hologram' | 'toon'
  | 'vhs' | 'pixel' | 'blueprint' | 'heat' | 'silhouette' | 'body' | 'infrared' | 'aura'

export const MODE_LIST: { id: ModeId; label: string; usesMask: boolean }[] = [
  { id: 'neon', label: 'NEON', usesMask: false },
  { id: 'punk', label: 'PUNK', usesMask: false },
  { id: 'thermal', label: 'THERMAL', usesMask: false },
  { id: 'night', label: 'NIGHT', usesMask: false },
  { id: 'glitch', label: 'GLITCH', usesMask: false },
  { id: 'matrix', label: 'MATRIX', usesMask: false },
  { id: 'hologram', label: 'HOLOGRAM', usesMask: true },
  { id: 'toon', label: 'TOON', usesMask: false },
  { id: 'vhs', label: 'VHS', usesMask: false },
  { id: 'pixel', label: 'PIXEL', usesMask: false },
  { id: 'blueprint', label: 'BLUEPRINT', usesMask: true },
  { id: 'heat', label: 'HEAT', usesMask: false },
  { id: 'silhouette', label: 'SILHOUETTE', usesMask: true },
  { id: 'body', label: 'BODY', usesMask: true },
  { id: 'infrared', label: 'INFRARED', usesMask: false },
  { id: 'aura', label: 'AURA', usesMask: true },
]

export type AuraColor = 'ki' | 'chakra' | 'nen' | 'rojo' | 'verde'
export const AURA_PALETTES: Record<AuraColor, string[]> = {
  ki: ['255,210,60', '255,160,0', '255,240,180'],
  chakra: ['40,160,255', '0,220,255', '180,230,255'],
  nen: ['170,50,255', '120,0,220', '230,180,255'],
  rojo: ['255,40,40', '255,120,0', '255,200,180'],
  verde: ['60,255,120', '0,220,80', '200,255,210'],
}

export type NeoCamState = {
  mode: ModeId
  pal: 'inferno' | 'jet' | 'hot' | 'plasma'
  blur: number
  irBlur: number
  irMotion: boolean
  silInt: number
  bodyBands: number
  auraColor: AuraColor
  hud: boolean
  trails: boolean
  mirror: boolean
  auto: boolean
  autoSec: number
  ghost: boolean
  ghostDecay: number
  audio: boolean
  audioGain: number
  energy: boolean
  energyGain: number
  failsafe: boolean
}

export type Scratch = {
  proc: HTMLCanvasElement; pctx: CanvasRenderingContext2D
  a: HTMLCanvasElement; b: HTMLCanvasElement
  bg: HTMLCanvasElement
  ghost: HTMLCanvasElement
  aura: ParticleSystem
}

export function createScratch(): Scratch {
  const mk = () => document.createElement('canvas')
  const proc = mk()
  return {
    proc, pctx: proc.getContext('2d')!,
    a: mk(), b: mk(), bg: mk(), ghost: mk(),
    aura: new ParticleSystem(),
  }
}

export type FrameCtx = {
  ctx: CanvasRenderingContext2D
  video: CanvasImageSource
  w: number; h: number
  t: number; dt: number
  maskCanvas: HTMLCanvasElement | null
  faceBox: FaceBox | null
  motionEnergy: number
  audioLevel: number
  bassHit: boolean
  state: NeoCamState
  scratch: Scratch
}

function sizeProc(scratch: Scratch, w: number, h: number) {
  const ph = Math.round((PROC_W * h) / w)
  if (scratch.proc.width !== PROC_W || scratch.proc.height !== ph) {
    scratch.proc.width = PROC_W; scratch.proc.height = ph
    scratch.bg.width = PROC_W; scratch.bg.height = ph
  }
  return { pw: PROC_W, ph }
}

function drawToProc(fc: FrameCtx): { pw: number; ph: number } {
  const { pw, ph } = sizeProc(fc.scratch, fc.w, fc.h)
  fc.scratch.pctx.drawImage(fc.video, 0, 0, pw, ph)
  return { pw, ph }
}

function blit(fc: FrameCtx, canvas: HTMLCanvasElement, sw: number, sh: number) {
  fc.ctx.drawImage(canvas, 0, 0, sw, sh, 0, 0, fc.w, fc.h)
}

function scanlines(ctx: CanvasRenderingContext2D, w: number, h: number, alpha = 0.12, step = 3) {
  ctx.fillStyle = `rgba(0,0,0,${alpha})`
  for (let y = 0; y < h; y += step) ctx.fillRect(0, y, w, 1)
}

function vignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength = 0.6) {
  const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.75)
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, `rgba(0,0,0,${strength})`)
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)
}

// ---- NEON: separación cromática aproximada + lavado neón + scanlines ----
function renderNeon(fc: FrameCtx) {
  const { ctx, video, w, h, t } = fc
  ctx.filter = 'saturate(1.4) contrast(1.1)'
  ctx.drawImage(video, 0, 0, w, h)
  ctx.filter = 'none'

  const off = 3 + Math.sin(t / 400) * 1.5
  ctx.globalCompositeOperation = 'screen'
  ctx.globalAlpha = 0.5
  ctx.filter = 'hue-rotate(-40deg) saturate(3)'
  ctx.drawImage(video, off, 0, w, h)
  ctx.filter = 'hue-rotate(140deg) saturate(3)'
  ctx.drawImage(video, -off, 0, w, h)
  ctx.filter = 'none'
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'

  scanlines(ctx, w, h, 0.1, 3)
  vignette(ctx, w, h, 0.45)
}

// ---- PUNK: paleta Jinx, blur + bloom ----
function renderPunk(fc: FrameCtx) {
  const { ctx, video, w, h, state } = fc
  ctx.filter = `blur(${state.blur}px) saturate(1.9) contrast(1.15)`
  ctx.drawImage(video, 0, 0, w, h)
  ctx.filter = 'none'

  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, 'rgba(255,0,180,0.28)')
  grad.addColorStop(0.5, 'rgba(120,0,255,0.18)')
  grad.addColorStop(1, 'rgba(0,220,255,0.28)')
  ctx.globalCompositeOperation = 'overlay'
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'source-over'

  ctx.globalCompositeOperation = 'screen'
  ctx.filter = `blur(${state.blur * 2.2}px) brightness(1.5) saturate(2)`
  ctx.globalAlpha = 0.55
  ctx.drawImage(video, 0, 0, w, h)
  ctx.filter = 'none'
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}

// ---- THERMAL / NIGHT / HEAT: paleta por LUT sobre canvas reducido ----
function renderPaletteMode(fc: FrameCtx, lutName: string, scan: boolean) {
  const { pw, ph } = drawToProc(fc)
  mapLuminanceToPalette(fc.scratch.pctx, pw, ph, getLUT(lutName))
  blit(fc, fc.scratch.proc, pw, ph)
  if (scan) {
    const scanY = (fc.t / 8) % fc.h
    const g = fc.ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30)
    g.addColorStop(0, 'rgba(255,220,140,0)')
    g.addColorStop(0.5, 'rgba(255,220,140,0.22)')
    g.addColorStop(1, 'rgba(255,220,140,0)')
    fc.ctx.globalCompositeOperation = 'screen'
    fc.ctx.fillStyle = g
    fc.ctx.fillRect(0, scanY - 30, fc.w, 60)
    fc.ctx.globalCompositeOperation = 'source-over'
  }
}

function renderNight(fc: FrameCtx) {
  const { pw, ph } = drawToProc(fc)
  mapLuminanceToPalette(fc.scratch.pctx, pw, ph, getLUT('night'))
  blit(fc, fc.scratch.proc, pw, ph)
  vignette(fc.ctx, fc.w, fc.h, 0.55)
  fc.ctx.fillStyle = 'rgba(140,255,170,0.45)'
  for (let i = 0; i < 50; i++) fc.ctx.fillRect(Math.random() * fc.w, Math.random() * fc.h, 1.4, 1.4)
}

function renderHeat(fc: FrameCtx) {
  const { pw, ph } = drawToProc(fc)
  updateRunningBackground(fc.scratch.bg, fc.video, pw, ph, 0.02)
  const bgData = fc.scratch.bg.getContext('2d')!.getImageData(0, 0, pw, ph)
  mapDiffToPalette(fc.scratch.pctx, bgData, pw, ph, getLUT('heat'), 3.2)
  blit(fc, fc.scratch.proc, pw, ph)
}

// ---- GLITCH: neón + cortes digitales constantes ----
function renderGlitch(fc: FrameCtx) {
  renderNeon(fc)
  const { ctx, w, h, t } = fc
  if (Math.sin(t / 90) > 0.4 || Math.random() < 0.3) {
    const bars = 2 + Math.floor(Math.random() * 4)
    ctx.globalCompositeOperation = 'screen'
    for (let i = 0; i < bars; i++) {
      const by = Math.random() * h
      const bh = 3 + Math.random() * 20
      const shift = (Math.random() - 0.5) * 40
      ctx.fillStyle = 'rgba(0,212,255,0.35)'
      ctx.fillRect(shift, by, w, bh)
      ctx.fillStyle = 'rgba(255,0,150,0.35)'
      ctx.fillRect(-shift, by, w, bh)
    }
    ctx.globalCompositeOperation = 'source-over'
  }
}

// ---- MATRIX: reconstrucción ASCII ----
const ASCII = ' .:-=+*#%@'
function renderMatrix(fc: FrameCtx) {
  const { ctx, video, w, h } = fc
  const cell = Math.max(7, Math.round(w / 70))
  const cols = Math.max(1, Math.floor(w / cell))
  const rows = Math.max(1, Math.floor(h / cell))
  const tiny = fc.scratch.a
  tiny.width = cols; tiny.height = rows
  const tctx = tiny.getContext('2d')!
  tctx.drawImage(video, 0, 0, cols, rows)
  const d = tctx.getImageData(0, 0, cols, rows).data

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  ctx.font = `${cell}px 'Space Mono', monospace`
  ctx.textBaseline = 'top'
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255
      const ch = ASCII[Math.min(ASCII.length - 1, Math.floor(lum * ASCII.length))]
      ctx.fillStyle = `rgba(60,255,120,${0.35 + lum * 0.65})`
      ctx.fillText(ch, x * cell, y * cell)
    }
  }
}

// ---- HOLOGRAM: silueta cian translúcida con borde brillante y líneas de barrido ----
function renderHologram(fc: FrameCtx) {
  const { ctx, w, h, t, maskCanvas } = fc
  ctx.fillStyle = '#01040a'
  ctx.fillRect(0, 0, w, h)
  if (!maskCanvas) return

  const fill = fillMaskColor(fc.scratch.a, maskCanvas, w, h, 'rgba(0,210,255,0.22)')
  const edge = outlineFromMask(fc.scratch.b, maskCanvas, w, h, 'rgba(120,240,255,0.9)', 0.93)

  ctx.globalAlpha = 0.6 + Math.sin(t / 220) * 0.15
  ctx.globalCompositeOperation = 'screen'
  ctx.drawImage(fill, 0, 0)
  ctx.globalAlpha = 1
  ctx.drawImage(edge, 0, 0)
  ctx.globalCompositeOperation = 'source-over'

  ctx.globalCompositeOperation = 'screen'
  for (let i = 0; i < 3; i++) {
    const ly = ((t / 6 + i * h * 0.33) % (h * 1.2))
    ctx.fillStyle = 'rgba(0,220,255,0.12)'
    ctx.fillRect(0, ly, w, 2)
  }
  ctx.globalCompositeOperation = 'source-over'
  scanlines(ctx, w, h, 0.08, 4)
}

// ---- TOON: posterizado + bordes ----
function renderToon(fc: FrameCtx) {
  const { pw, ph } = drawToProc(fc)
  const img = fc.scratch.pctx.getImageData(0, 0, pw, ph)
  const d = img.data
  const lum = new Float32Array(pw * ph)
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    d[i] = Math.round(d[i] / 48) * 48
    d[i + 1] = Math.round(d[i + 1] / 48) * 48
    d[i + 2] = Math.round(d[i + 2] / 48) * 48
    lum[p] = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114
  }
  for (let y = 1; y < ph - 1; y++) {
    for (let x = 1; x < pw - 1; x++) {
      const p = y * pw + x
      const gx = lum[p + 1] - lum[p - 1]
      const gy = lum[p + pw] - lum[p - pw]
      if (Math.hypot(gx, gy) > 60) {
        const i = p * 4
        d[i] = 10; d[i + 1] = 10; d[i + 2] = 10
      }
    }
  }
  fc.scratch.pctx.putImageData(img, 0, 0)
  blit(fc, fc.scratch.proc, pw, ph)
}

// ---- VHS: cinta vieja ----
function renderVhs(fc: FrameCtx) {
  const { ctx, video, w, h, t } = fc
  ctx.filter = 'saturate(0.8) contrast(1.05) brightness(1.02)'
  ctx.drawImage(video, 0, 0, w, h)
  ctx.filter = 'none'

  ctx.globalCompositeOperation = 'screen'
  ctx.globalAlpha = 0.3
  ctx.drawImage(video, -2, 0, w, h)
  ctx.globalAlpha = 0.2
  ctx.drawImage(video, 2, 0, w, h)
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'

  for (let i = 0; i < 4; i++) {
    if (Math.random() < 0.15) {
      const y = Math.random() * h
      const sh = (Math.random() - 0.5) * 16
      const sliceH = 2 + Math.random() * 6
      ctx.drawImage(video, 0, y, w, sliceH, sh, y, w, sliceH)
    }
  }

  ctx.fillStyle = 'rgba(255,255,255,0.05)'
  for (let i = 0; i < 40; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1)
  scanlines(ctx, w, h, 0.1, 2)

  const now = new Date(Date.now())
  const stamp = now.toLocaleDateString('es-AR') + '  ' + now.toLocaleTimeString('es-AR')
  ctx.font = `${Math.max(12, w * 0.025)}px 'Space Mono', monospace`
  ctx.fillStyle = 'rgba(255,200,80,0.8)'
  ctx.shadowColor = 'rgba(255,200,80,0.6)'
  ctx.shadowBlur = 4
  ctx.textAlign = 'right'
  ctx.fillText(stamp, w - 16, h - 20)
  ctx.shadowBlur = 0
  ctx.textAlign = 'left'
  void t
}

// ---- PIXEL: estética 8 bits ----
function renderPixel(fc: FrameCtx) {
  const { ctx, video, w, h } = fc
  const tiny = fc.scratch.a
  const tw = 56, th = Math.round((56 * h) / w)
  tiny.width = tw; tiny.height = th
  const tctx = tiny.getContext('2d')!
  tctx.drawImage(video, 0, 0, tw, th)
  const img = tctx.getImageData(0, 0, tw, th)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.round(d[i] / 51) * 51
    d[i + 1] = Math.round(d[i + 1] / 51) * 51
    d[i + 2] = Math.round(d[i + 2] / 51) * 51
  }
  tctx.putImageData(img, 0, 0)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(tiny, 0, 0, tw, th, 0, 0, w, h)
  ctx.imageSmoothingEnabled = true
}

// ---- BLUEPRINT: plano técnico ----
function renderBlueprint(fc: FrameCtx) {
  const { ctx, w, h, maskCanvas } = fc
  ctx.fillStyle = '#021226'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(120,180,255,0.18)'
  ctx.lineWidth = 1
  const step = Math.max(16, Math.round(w / 32))
  for (let x = 0; x < w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
  for (let y = 0; y < h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
  if (maskCanvas) {
    const outline = outlineFromMask(fc.scratch.a, maskCanvas, w, h, 'rgba(230,245,255,0.95)', 0.95)
    ctx.drawImage(outline, 0, 0)
  }
}

// ---- SILHOUETTE: solo contorno relleno de calor ----
function renderSilhouette(fc: FrameCtx) {
  const { ctx, w, h, maskCanvas, state } = fc
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  if (!maskCanvas) return
  const lut = getLUT('inferno')
  const color = `rgba(${lut[200 * 3]},${lut[200 * 3 + 1]},${lut[200 * 3 + 2]},${state.silInt})`
  const glow = `rgba(${lut[120 * 3]},${lut[120 * 3 + 1]},${lut[120 * 3 + 2]},${state.silInt * 0.5})`
  const outer = fillMaskColor(fc.scratch.a, maskCanvas, w, h, glow, 1.04)
  ctx.filter = 'blur(10px)'
  ctx.drawImage(outer, 0, 0)
  ctx.filter = 'none'
  const fill = fillMaskColor(fc.scratch.b, maskCanvas, w, h, color, 1)
  ctx.drawImage(fill, 0, 0)
}

// ---- BODY: figura térmica con volumen, cabeza aplanada ----
function renderBody(fc: FrameCtx) {
  const { ctx, w, h, maskCanvas, faceBox, state } = fc
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  if (!maskCanvas) return
  const lut = getLUT('inferno')
  const bands = Math.max(2, Math.round(state.bodyBands))

  const layer = fillMaskColor(fc.scratch.a, maskCanvas, w, h, '#fff', 1)
  const lctx = layer.getContext('2d')!
  lctx.globalCompositeOperation = 'source-in'
  const grad = lctx.createLinearGradient(0, 0, 0, h)
  for (let i = 0; i <= bands; i++) {
    const t = i / bands
    const li = Math.round((0.35 + t * 0.6) * 255) * 3
    grad.addColorStop(t, `rgb(${lut[li]},${lut[li + 1]},${lut[li + 2]})`)
  }
  lctx.fillStyle = grad
  lctx.fillRect(0, 0, w, h)
  lctx.globalCompositeOperation = 'source-over'
  ctx.drawImage(layer, 0, 0)

  if (faceBox) {
    ctx.save()
    ctx.beginPath()
    ctx.ellipse(faceBox.cx, faceBox.cy, faceBox.w * 0.9, faceBox.h * 0.9, 0, 0, Math.PI * 2)
    ctx.clip()
    ctx.filter = 'blur(18px)'
    ctx.drawImage(layer, 0, 0)
    ctx.filter = 'none'
    ctx.restore()
  }
}

// ---- INFRARED: térmico + desenfoque parejo + cabeza en mancha difusa ----
function renderInfrared(fc: FrameCtx) {
  const { ctx, w, h, faceBox, state, motionEnergy } = fc
  const { pw, ph } = drawToProc(fc)
  const lutName = state.irMotion && motionEnergy > 1.4 ? 'heat' : 'inferno'
  mapLuminanceToPalette(fc.scratch.pctx, pw, ph, getLUT(lutName))
  const blurPx = Math.max(4, state.irBlur)
  ctx.filter = `blur(${blurPx}px)`
  blit(fc, fc.scratch.proc, pw, ph)
  ctx.filter = 'none'

  if (faceBox) {
    ctx.save()
    ctx.beginPath()
    ctx.ellipse(faceBox.cx, faceBox.cy, faceBox.w * 1.1, faceBox.h * 1.1, 0, 0, Math.PI * 2)
    ctx.clip()
    ctx.filter = 'blur(38px) brightness(0.7)'
    ctx.drawImage(fc.scratch.proc, 0, 0, pw, ph, 0, 0, w, h)
    ctx.filter = 'none'
    ctx.restore()
  }
}

// ---- AURA: silueta + llamas de energía + partículas + rayos ----
function renderAura(fc: FrameCtx) {
  const { ctx, w, h, dt, maskCanvas, state, motionEnergy, audioLevel, bassHit } = fc
  ctx.fillStyle = '#000308'
  ctx.fillRect(0, 0, w, h)
  if (!maskCanvas) return

  const palette = AURA_PALETTES[state.auraColor]
  const base = fillMaskColor(fc.scratch.a, maskCanvas, w, h, `rgba(${palette[0]},0.5)`, 1)
  ctx.globalCompositeOperation = 'screen'
  ctx.drawImage(base, 0, 0)
  ctx.globalCompositeOperation = 'source-over'

  const outline = outlineFromMask(fc.scratch.b, maskCanvas, w, h, `rgba(${palette[2]},1)`, 0.9)
  ctx.drawImage(outline, 0, 0)

  const procOutline = fc.scratch.proc
  const pw2 = Math.round(PROC_W * 0.5), ph2 = Math.round((pw2 * h) / w)
  procOutline.width = pw2; procOutline.height = ph2
  const pctx = procOutline.getContext('2d')!
  pctx.clearRect(0, 0, pw2, ph2)
  pctx.drawImage(outline, 0, 0, pw2, ph2)
  const sample = pctx.getImageData(0, 0, pw2, ph2).data

  const spawnRate = (0.4 + motionEnergy * 0.5 + audioLevel * state.audioGain) * dt
  const spawns = Math.round(spawnRate * 3)
  for (let s = 0; s < spawns; s++) {
    for (let tries = 0; tries < 6; tries++) {
      const px = Math.floor(Math.random() * pw2)
      const py = Math.floor(Math.random() * ph2)
      const i = (py * pw2 + px) * 4
      if (sample[i + 3] > 80) {
        const x = (px / pw2) * w, y = (py / ph2) * h
        fc.scratch.aura.spawn({
          x, y, vx: (Math.random() - 0.5) * 0.8, vy: -0.8 - Math.random() * 1.6,
          r: 3 + Math.random() * 5, life: 1, decay: 0.012 + Math.random() * 0.01,
          color: `rgba(${palette[Math.floor(Math.random() * palette.length)]},0.9)`, gravity: -0.01,
        })
        break
      }
    }
  }
  if (bassHit) {
    for (let i = 0; i < 12; i++) {
      fc.scratch.aura.spawn({
        x: w / 2 + (Math.random() - 0.5) * w * 0.4, y: h * 0.5 + (Math.random() - 0.5) * h * 0.4,
        vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
        r: 4 + Math.random() * 6, life: 1, decay: 0.02,
        color: `rgba(${palette[1]},0.95)`,
      })
    }
  }
  fc.scratch.aura.update(dt)
  fc.scratch.aura.drawCircles(ctx, 'lighter')

  if (Math.random() < 0.02 + motionEnergy * 0.01) {
    ctx.strokeStyle = `rgba(${palette[2]},0.8)`
    ctx.lineWidth = 2
    ctx.beginPath()
    let x = w / 2 + (Math.random() - 0.5) * w * 0.3
    let y = h * 0.1
    ctx.moveTo(x, y)
    for (let i = 0; i < 6; i++) {
      x += (Math.random() - 0.5) * 40
      y += h * 0.1
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
}

export function renderMode(fc: FrameCtx) {
  switch (fc.state.mode) {
    case 'neon': return renderNeon(fc)
    case 'punk': return renderPunk(fc)
    case 'thermal': return renderPaletteMode(fc, fc.state.pal, true)
    case 'night': return renderNight(fc)
    case 'glitch': return renderGlitch(fc)
    case 'matrix': return renderMatrix(fc)
    case 'hologram': return renderHologram(fc)
    case 'toon': return renderToon(fc)
    case 'vhs': return renderVhs(fc)
    case 'pixel': return renderPixel(fc)
    case 'blueprint': return renderBlueprint(fc)
    case 'heat': return renderHeat(fc)
    case 'silhouette': return renderSilhouette(fc)
    case 'body': return renderBody(fc)
    case 'infrared': return renderInfrared(fc)
    case 'aura': return renderAura(fc)
  }
}

export function fadeForTrails(ctx: CanvasRenderingContext2D, w: number, h: number, enabled: boolean, amount = 0.2) {
  if (!enabled) return
  ctx.fillStyle = `rgba(2,4,8,${amount})`
  ctx.fillRect(0, 0, w, h)
}

export function updateAndDrawGhost(fc: FrameCtx) {
  const { state, maskCanvas, video, w, h, ctx, scratch } = fc
  if (!state.ghost || !maskCanvas) return
  if (scratch.ghost.width !== w || scratch.ghost.height !== h) { scratch.ghost.width = w; scratch.ghost.height = h }
  const gctx = scratch.ghost.getContext('2d')!
  gctx.globalCompositeOperation = 'destination-out'
  gctx.fillStyle = `rgba(0,0,0,${clamp(state.ghostDecay, 0.02, 0.6)})`
  gctx.fillRect(0, 0, w, h)
  gctx.globalCompositeOperation = 'source-over'

  const layer = clipToMask(fc.scratch.a, video, maskCanvas, w, h)
  gctx.globalAlpha = 0.45
  gctx.globalCompositeOperation = 'screen'
  gctx.filter = 'hue-rotate(150deg) saturate(3) brightness(1.3)'
  gctx.drawImage(layer, 0, 0)
  gctx.filter = 'none'
  gctx.globalCompositeOperation = 'source-over'
  gctx.globalAlpha = 1

  ctx.globalCompositeOperation = 'screen'
  ctx.drawImage(scratch.ghost, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
}

export function drawHud(ctx: CanvasRenderingContext2D, w: number, h: number, faceBox: FaceBox | null, fps: number, modeLabel: string) {
  const c = 'rgba(0,212,255,0.85)'
  ctx.strokeStyle = c
  ctx.lineWidth = 2
  const cl = Math.min(40, w * 0.05)
  ;[[0, 0, 1, 1], [w, 0, -1, 1], [0, h, 1, -1], [w, h, -1, -1]].forEach(([x, y, dx, dy]) => {
    ctx.beginPath()
    ctx.moveTo(x, y + dy * cl); ctx.lineTo(x, y); ctx.lineTo(x + dx * cl, y)
    ctx.stroke()
  })

  ctx.font = "11px 'Space Mono', monospace"
  ctx.fillStyle = c
  ctx.textAlign = 'left'
  ctx.fillText(new Date().toLocaleTimeString('es-AR'), 16, 24)
  ctx.fillText(`FPS ${Math.round(fps)}`, 16, h - 14)
  ctx.textAlign = 'right'
  ctx.fillText(modeLabel, w - 16, 24)

  const blink = Math.sin(Date.now() / 300) > 0
  if (blink) {
    ctx.fillStyle = '#ff2d55'
    ctx.beginPath(); ctx.arc(w - 66, 20, 4, 0, Math.PI * 2); ctx.fill()
  }
  ctx.fillStyle = 'rgba(255,45,85,0.85)'
  ctx.textAlign = 'right'
  ctx.fillText('LIVE', w - 50, 24)
  ctx.textAlign = 'left'

  if (faceBox) {
    ctx.strokeStyle = 'rgba(255,45,85,0.85)'
    ctx.strokeRect(faceBox.cx - faceBox.w / 2, faceBox.cy - faceBox.h / 2, faceBox.w, faceBox.h)
    ctx.fillStyle = 'rgba(255,45,85,0.85)'
    ctx.font = "9px 'Space Mono', monospace"
    ctx.fillText('TARGET LOCKED', faceBox.cx - faceBox.w / 2, faceBox.cy - faceBox.h / 2 - 6)
  }
}

export function drawSignalLost(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(255,45,85,0.9)'
  ctx.font = `700 ${Math.max(16, w * 0.04)}px 'Space Mono', monospace`
  ctx.textAlign = 'center'
  ctx.fillText('SIGNAL LOST', w / 2, h / 2)
  ctx.font = `${Math.max(9, w * 0.016)}px 'Space Mono', monospace`
  ctx.fillStyle = 'rgba(255,45,85,0.6)'
  ctx.fillText('FAILSAFE — SIN ROSTRO DETECTADO', w / 2, h / 2 + 26)
  ctx.textAlign = 'left'
}
