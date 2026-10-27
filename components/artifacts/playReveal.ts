import type { ArtifactReveal } from './registry'

// Ningún artefacto actual trae soundSrc todavía (ver registry.ts) — esto
// deja el pipeline listo para cuando uno lo tenga, en vez de agregarlo
// recién cuando haga falta y volver a tocar los tres consumidores.
export function playRevealSound(reveal: ArtifactReveal) {
  if (!reveal.soundSrc) return
  try {
    const audio = new Audio(reveal.soundSrc)
    audio.play().catch(() => {})
  } catch {
    // audio no disponible en este contexto — no es crítico, seguimos
  }
}
