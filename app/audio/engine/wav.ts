import { SampleDef } from './sounds'

// Codificador manual de WAV PCM de 16 bits (sin libreria externa) — mismo
// criterio que el exportador .stl de Proxygenesis: escribir el header a mano
// con DataView y que el tamaño declarado coincida exactamente con los datos.
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const numFrames = buffer.length
  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const dataSize = numFrames * blockAlign
  const headerSize = 44
  const arr = new ArrayBuffer(headerSize + dataSize)
  const view = new DataView(arr)

  const writeString = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  const channels: Float32Array[] = []
  for (let ch = 0; ch < numChannels; ch++) channels.push(buffer.getChannelData(ch))

  let offset = headerSize
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += 2
    }
  }

  return new Blob([arr], { type: 'audio/wav' })
}

export async function renderSampleToBuffer(def: SampleDef, sampleRate = 44100): Promise<AudioBuffer> {
  const length = Math.ceil(def.duration * sampleRate)
  const ctx = new OfflineAudioContext(1, length, sampleRate)
  def.render(ctx, ctx.destination, 0)
  return await ctx.startRendering()
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function downloadSampleWav(def: SampleDef) {
  const buf = await renderSampleToBuffer(def)
  triggerDownload(audioBufferToWavBlob(buf), `neoproxy-${def.id}.wav`)
}

export async function downloadBufferWav(buffer: AudioBuffer, filename: string) {
  triggerDownload(audioBufferToWavBlob(buffer), filename)
}
