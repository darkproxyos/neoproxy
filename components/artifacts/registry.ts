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
  // sticker (payload "neoproxy:joker") dispararía lo mismo que enfocarlo
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
