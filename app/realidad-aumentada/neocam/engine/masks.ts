import { FaceBox } from './vision'

export type MaskStyle = 'soft' | 'pixel' | 'block' | 'blur' | 'glyph'

function ovalPath(ctx: CanvasRenderingContext2D, box: FaceBox, pad = 1.25) {
  ctx.beginPath()
  ctx.ellipse(box.cx, box.cy, (box.w / 2) * pad, (box.h / 2) * pad, 0, 0, Math.PI * 2)
}

export function drawFaceMask(ctx: CanvasRenderingContext2D, video: CanvasImageSource, box: FaceBox, videoW: number, videoH: number, style: MaskStyle) {
  if (style === 'block') {
    ctx.save()
    ovalPath(ctx, box)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()
    return
  }

  if (style === 'soft' || style === 'blur') {
    const radiusPx = style === 'soft' ? 22 : 44
    ctx.save()
    ovalPath(ctx, box)
    ctx.clip()
    ctx.filter = `blur(${radiusPx}px)`
    const pad = 1.3
    const sx = Math.max(0, box.cx - (box.w / 2) * pad)
    const sy = Math.max(0, box.cy - (box.h / 2) * pad)
    const sw = Math.min(videoW - sx, box.w * pad)
    const sh = Math.min(videoH - sy, box.h * pad)
    ctx.drawImage(video, sx, sy, sw, sh, sx, sy, sw, sh)
    ctx.filter = 'none'
    ctx.restore()
    return
  }

  if (style === 'pixel') {
    const pad = 1.3
    const sx = Math.max(0, box.cx - (box.w / 2) * pad)
    const sy = Math.max(0, box.cy - (box.h / 2) * pad)
    const sw = Math.min(videoW - sx, box.w * pad)
    const sh = Math.min(videoH - sy, box.h * pad)
    const tiny = document.createElement('canvas')
    tiny.width = 16; tiny.height = 16
    const tctx = tiny.getContext('2d')!
    tctx.drawImage(video, sx, sy, sw, sh, 0, 0, 16, 16)
    ctx.save()
    ovalPath(ctx, box)
    ctx.clip()
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(tiny, 0, 0, 16, 16, sx, sy, sw, sh)
    ctx.imageSmoothingEnabled = true
    ctx.restore()
    return
  }

  if (style === 'glyph') {
    ctx.save()
    ovalPath(ctx, box)
    ctx.clip()
    ctx.fillStyle = '#05080f'
    ctx.fillRect(box.cx - box.w, box.cy - box.h, box.w * 2, box.h * 2)
    ctx.strokeStyle = 'rgba(0,212,255,0.5)'
    ctx.lineWidth = Math.max(1, box.w * 0.015)
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath()
      ctx.moveTo(box.cx - box.w, box.cy + i * box.h * 0.18)
      ctx.lineTo(box.cx + box.w, box.cy + i * box.h * 0.18)
      ctx.stroke()
    }
    ctx.fillStyle = '#00d4ff'
    ctx.font = `700 ${Math.max(9, box.w * 0.12)}px 'Space Mono', monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('NEO//PROXY', box.cx, box.cy)
    ctx.restore()
    return
  }
}
