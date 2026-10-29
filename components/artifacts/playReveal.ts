import type { ArtifactReveal } from './registry'
import { playSting } from './stingSynth'

// `sting` (sintetizado con Web Audio, ver stingSynth.ts) es el camino
// preferido — no depende de conseguir/licenciar un archivo de audio real.
// `soundSrc` queda disponible para cuando algún artefacto sí tenga una
// grabación real; si un reveal trae ambos, gana el sting sintetizado.
export function playRevealSound(reveal: ArtifactReveal) {
  if (reveal.sting) {
    playSting(reveal.sting)
    return
  }
  if (!reveal.soundSrc) return
  try {
    const audio = new Audio(reveal.soundSrc)
    audio.play().catch(() => {})
  } catch {
    // audio no disponible en este contexto — no es crítico, seguimos
  }
}
