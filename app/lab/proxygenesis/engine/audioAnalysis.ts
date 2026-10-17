// Analiza un clip de audio (subido o grabado del micrófono) en un envelope
// de energía RMS por segmento — se usa para modular curl() del Space
// Colonization: el tramo del crecimiento que corresponde a un segmento más
// fuerte del audio sale más curvado/turbulento, uno silencioso sale casi
// recto. Mapeo verificable: no es decoración, es una lectura real de
// amplitud por tramo temporal del clip.

export async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer()
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  try {
    return await ctx.decodeAudioData(arrayBuffer)
  } finally {
    ctx.close()
  }
}

// RMS (root mean square) por segmento, normalizado 0..1 relativo al pico
// del propio clip — así cualquier audio (fuerte o flojo de grabación) usa
// todo el rango de modulación disponible.
export function computeEnergyEnvelope(buffer: AudioBuffer, segments: number): number[] {
  const channelData = buffer.getChannelData(0)
  const totalSamples = channelData.length
  const segLen = Math.max(1, Math.floor(totalSamples / segments))
  const energies: number[] = []
  for (let s = 0; s < segments; s++) {
    const start = s * segLen
    const end = Math.min(totalSamples, start + segLen)
    let sumSq = 0
    for (let i = start; i < end; i++) sumSq += channelData[i] * channelData[i]
    energies.push(Math.sqrt(sumSq / Math.max(1, end - start)))
  }
  const max = Math.max(...energies, 1e-6)
  return energies.map(e => e / max)
}

// Graba `seconds` del micrófono y devuelve el Blob — mismo patrón de
// MediaRecorder que el retrato en video de NeoCam, acá sobre audio puro.
export async function recordMicClip(seconds: number): Promise<Blob> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
  const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
  const chunks: Blob[] = []
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }

  return new Promise((resolve, reject) => {
    recorder.onerror = () => { stream.getTracks().forEach(t => t.stop()); reject(new Error('fallo la grabación')) }
    recorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop())
      resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }))
    }
    recorder.start()
    window.setTimeout(() => recorder.stop(), seconds * 1000)
  })
}
