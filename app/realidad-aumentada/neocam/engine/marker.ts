// Wrapper fino sobre el Controller "core" de mind-ar (sin three.js —
// NeoCam ya tiene su propia cámara, canvas y loop de render). Le damos el
// mismo <video> que ya está corriendo y nos avisa por frame si el
// marcador entrenado está en cuadro, igual que MediaPipe nos da cara o
// manos — una fuente de tracking más, no una cámara aparte.
//
// El target y el reveal (qué aparece al reconocerlo) salen de
// components/artifacts/registry.ts — el mismo registro que usa
// /realidad-aumentada/marcador y /experimental/scan, no una copia local.

import type { ArtifactReveal } from '@/components/artifacts/registry'

export type MarkerHandle = {
  pause: () => void
  resume: (video: HTMLVideoElement) => void
  dispose: () => void
}

export async function startMarkerController(
  video: HTMLVideoElement,
  targetSrc: string,
  onFound: () => void,
  onLost: () => void,
): Promise<MarkerHandle> {
  const { Controller } = await import('mind-ar/dist/mindar-image.prod.js')

  // Crítico, no cosmético: InputLoader.loadInput dibuja con
  // `input.width`/`input.height` — los atributos HTML del <video>, NO
  // `videoWidth`/`videoHeight` — así que sin esto cada frame se dibuja en
  // un rectángulo 0×0 y el target nunca se reconoce aunque todo lo demás
  // corra sin tirar ningún error (el bug que costó más diagnosticar acá).
  video.width = video.videoWidth
  video.height = video.videoHeight

  const controller = new Controller({
    inputWidth: video.videoWidth,
    inputHeight: video.videoHeight,
    maxTrack: 1,
    onUpdate: data => {
      if (data.type !== 'updateMatrix') return
      if (data.worldMatrix !== null) onFound()
      else onLost()
    },
  })

  await controller.addImageTargets(targetSrc)
  await controller.dummyRun(video)
  controller.processVideo(video)

  return {
    pause: () => controller.stopProcessVideo(),
    resume: v => controller.processVideo(v),
    dispose: () => {
      try { controller.stopProcessVideo() } catch { /* ya puede estar detenido */ }
      try { controller.dispose() } catch { /* idem */ }
    },
  }
}

export function drawMarkerReveal(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, reveal: ArtifactReveal) {
  const pulse = 0.85 + Math.sin(t / 220) * 0.15
  const size = Math.max(20, Math.min(52, w * 0.07))
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 ${size}px 'Space Mono', monospace`
  ctx.shadowColor = reveal.glow
  ctx.shadowBlur = 42 * pulse
  ctx.fillStyle = reveal.color
  ctx.fillText(reveal.text, w / 2, h / 2)
  ctx.shadowBlur = 16
  ctx.fillText(reveal.text, w / 2, h / 2)
  ctx.restore()
}

export function drawMarkerScanningHint(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save()
  ctx.font = "9px 'Space Mono', monospace"
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = 'rgba(0,4,10,0.6)'
  ctx.fillRect(10, h - 30, 168, 20)
  ctx.fillStyle = '#00d4ffcc'
  ctx.fillText('MARCADOR: ESCANEANDO...', 16, h - 25)
  ctx.restore()
}
