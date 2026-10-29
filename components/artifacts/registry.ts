// Fuente única de verdad para "artefacto físico → algo aparece en pantalla":
// hasta ahora /realidad-aumentada/marcador, el modo MARCADOR de NeoCam y
// /experimental/scan (NFC) resolvían cada uno su propio texto/color
// hardcodeado por separado. Agregar un artefacto físico nuevo — sticker,
// tag NFC, lo que sea — ahora es sumar una entrada acá, no tocar las tres
// páginas.

export type ArtifactReveal = {
  id: string
  label: string
  text: string
  color: string
  glow: string
  soundSrc?: string
  sting?: 'cackle' | 'chime' | 'glitch'
  agentId?: string
}

export type ImageArtifact = {
  id: string
  trigger: 'image'
  targetSrc: string
  preview: string
  reveal: ArtifactReveal
}

export type NfcArtifact = {
  id: string
  trigger: 'nfc'
  match: (decodedText: string) => boolean
  reveal: ArtifactReveal
}

export type Artifact = ImageArtifact | NfcArtifact

const JOKER_REVEAL: ArtifactReveal = {
  id: 'joker',
  label: 'JOKER',
  text: 'WHY SO SERIOUS?',
  color: '#39ff6a',
  glow: '#a537fd',
  sting: 'cackle',
}

export const ARTIFACTS: Artifact[] = [
  {
    id: 'joker-sticker',
    trigger: 'image',
    targetSrc: '/ar-targets/joker.mind',
    preview: '/ar-targets/joker-preview.jpg',
    reveal: JOKER_REVEAL,
  },
  // Mismo reveal, segundo disparador: un tag NFC pegado al dorso del mismo
  // sticker (payload "neoproxy:joker") dispararia lo mismo que enfocarlo
  // con la cámara — la prueba de que es un solo pipeline, no dos sistemas
  // que coinciden en el contenido por casualidad. Sin tag físico todavía
  // (ver /experimental/scan), pero el esquema ya está listo para recibirlo.
  {
    id: 'joker-nfc',
    trigger: 'nfc',
    match: text => /neoproxy:joker/i.test(text),
    reveal: JOKER_REVEAL,
  },
]

export const IMAGE_ARTIFACTS = ARTIFACTS.filter((a): a is ImageArtifact => a.trigger === 'image')
export const NFC_ARTIFACTS = ARTIFACTS.filter((a): a is NfcArtifact => a.trigger === 'nfc')

export function matchNfcArtifact(decodedTexts: string[]): NfcArtifact | null {
  for (const artifact of NFC_ARTIFACTS) {
    if (decodedTexts.some(t => artifact.match(t))) return artifact
  }
  return null
}

export function findImageArtifact(id: string): ImageArtifact | undefined {
  return IMAGE_ARTIFACTS.find(a => a.id === id)
}

// Un tap real deja un rastro real en memory_events (app/api/marker/
// recognized), no solo localStorage — pero el tracking de MindAR puede
// parpadear (found/lost/found) y una lectura NFC puede repetirse mientras
// el tag sigue cerca del lector, así que esto dedupea por sessionStorage:
// un artefacto cuenta una sola vez por pestaña, no una vez por frame.
export function recordArtifactRecognition(artifactId: string, trigger: 'image' | 'nfc') {
  const key = `neoproxy-marker-recorded-${artifactId}`
  try {
    if (window.sessionStorage.getItem(key)) return
    window.sessionStorage.setItem(key, '1')
  } catch {
    // si sessionStorage falla, mejor mandar el evento de más que no mandarlo nunca
  }
  fetch('/api/marker/recognized', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ artifactId, trigger }),
    keepalive: true,
  }).catch(() => {})
}
