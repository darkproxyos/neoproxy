// Analiza un clip de audio (subido o grabado del micrófono) en un envelope
// de energía RMS por segmento — se usa para modular curl() del Space
// Colonization: el tramo del crecimiento que corresponde a un segmento más
// fuerte del audio sale más curvado/turbulento, uno silencioso sale casi
// recto. Mapeo verificable: no es decoración, es una lectura real de
// amplitud por tramo temporal del clip.
//
// analyzeAudioFull() abajo es el mismo criterio pero completo: además del
// volumen (RMS), hace un STFT real (FFT Cooley-Tukey propia, sin
// dependencias) para sacar densidad rítmica (flujo espectral → onsets),
// brillo (centroide espectral) y qué banda de frecuencia domina en cada
// tramo — da varias fuentes posibles para modular forma y color, no solo
// una. Todo corre en el navegador sobre el AudioBuffer ya decodificado,
// nada de esto pega a un backend.

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

// ---------------------------------------------------------------------
// Análisis completo: FFT propia (radix-2 Cooley-Tukey, in-place), STFT con
// ventana Hann, 7 bandas estándar de ingeniería de audio, flujo espectral
// para densidad de onsets y centroide espectral para brillo. Puerto directo
// del script de análisis verificado por separado contra un tema real
// (208s, detectó 996 onsets y 144 BPM con 0.63 de confianza) — misma
// matemática, adaptada para correr sobre un AudioBuffer del navegador en
// vez de un .raw decodificado con ffmpeg.
// ---------------------------------------------------------------------

function fftRadix2(re: Float32Array, im: Float32Array) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr
      const ti = im[i]; im[i] = im[j]; im[j] = ti
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len
    const wRe = Math.cos(ang), wIm = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0
      for (let j = 0; j < len / 2; j++) {
        const uRe = re[i + j], uIm = im[i + j]
        const vRe = re[i + j + len / 2] * curRe - im[i + j + len / 2] * curIm
        const vIm = re[i + j + len / 2] * curIm + im[i + j + len / 2] * curRe
        re[i + j] = uRe + vRe; im[i + j] = uIm + vIm
        re[i + j + len / 2] = uRe - vRe; im[i + j + len / 2] = uIm - vIm
        const nextRe = curRe * wRe - curIm * wIm
        const nextIm = curRe * wIm + curIm * wRe
        curRe = nextRe; curIm = nextIm
      }
    }
  }
}

export const AUDIO_BANDS = [
  { name: 'sub', lo: 20, hi: 60, color: '#ff2d2d' },
  { name: 'bass', lo: 60, hi: 250, color: '#ff8800' },
  { name: 'lowMid', lo: 250, hi: 500, color: '#ffd400' },
  { name: 'mid', lo: 500, hi: 2000, color: '#39ff14' },
  { name: 'highMid', lo: 2000, hi: 4000, color: '#00d4ff' },
  { name: 'presence', lo: 4000, hi: 6000, color: '#8f6bff' },
  { name: 'brilliance', lo: 6000, hi: 11000, color: '#ff5ec4' },
] as const

export type AudioFullAnalysis = {
  segments: number
  rms: number[]            // 0..1 por segmento — volumen
  onsetDensity: number[]   // 0..1 por segmento — cuántos onsets cayeron ahí, normalizado
  centroid: number[]       // 0..1 por segmento — brillo relativo (centroide espectral normalizado contra el pico del propio clip)
  dominantBand: number[]   // índice 0..6 de AUDIO_BANDS, banda que domina en ese segmento
  centroidMeanHz: number
  bpm: number | null
  bpmConfidence: number
}

export function analyzeAudioFull(buffer: AudioBuffer, segments: number): AudioFullAnalysis {
  const sr = buffer.sampleRate
  const samples = buffer.getChannelData(0)
  const WINDOW = 2048
  const HOP = 512
  const hann = new Float32Array(WINDOW)
  for (let i = 0; i < WINDOW; i++) hann[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (WINDOW - 1)))

  const numFrames = Math.max(1, Math.floor((samples.length - WINDOW) / HOP))
  const binHz = sr / WINDOW
  const bandBins = AUDIO_BANDS.map(b => ({ loBin: Math.max(1, Math.floor(b.lo / binHz)), hiBin: Math.min(WINDOW / 2, Math.ceil(b.hi / binHz)) }))

  const bandEnergy = AUDIO_BANDS.map(() => new Float32Array(numFrames))
  const rmsFrames = new Float32Array(numFrames)
  const fluxFrames = new Float32Array(numFrames)
  const centroidFrames = new Float32Array(numFrames)
  let prevMag = new Float32Array(WINDOW / 2)
  const re = new Float32Array(WINDOW)
  const im = new Float32Array(WINDOW)

  for (let f = 0; f < numFrames; f++) {
    const start = f * HOP
    let sumSq = 0
    for (let i = 0; i < WINDOW; i++) {
      const s = (samples[start + i] || 0) * hann[i]
      re[i] = s; im[i] = 0
      sumSq += (samples[start + i] || 0) * (samples[start + i] || 0)
    }
    rmsFrames[f] = Math.sqrt(sumSq / WINDOW)
    fftRadix2(re, im)

    const mag = new Float32Array(WINDOW / 2)
    let fluxSum = 0, centroidNum = 0, centroidDen = 0
    for (let k = 0; k < WINDOW / 2; k++) {
      const m = Math.hypot(re[k], im[k])
      mag[k] = m
      const d = m - prevMag[k]
      if (d > 0) fluxSum += d
      centroidNum += m * (k * binHz)
      centroidDen += m
    }
    fluxFrames[f] = fluxSum
    centroidFrames[f] = centroidDen > 1e-9 ? centroidNum / centroidDen : 0
    prevMag = mag

    for (let bi = 0; bi < bandBins.length; bi++) {
      const { loBin, hiBin } = bandBins[bi]
      let sum = 0, count = 0
      for (let k = loBin; k < hiBin; k++) { sum += mag[k]; count++ }
      bandEnergy[bi][f] = count > 0 ? sum / count : 0
    }
  }

  // onsets: picos locales del flujo espectral por encima de una media móvil
  const frameTimeSec = HOP / sr
  const windowSize = Math.max(1, Math.round(1.0 / frameTimeSec))
  const onsetFrameFlags = new Uint8Array(numFrames)
  let onsetCount = 0
  for (let i = 2; i < numFrames - 2; i++) {
    const lo = Math.max(0, i - windowSize), hi = Math.min(numFrames, i + windowSize)
    let mean = 0
    for (let j = lo; j < hi; j++) mean += fluxFrames[j]
    mean /= (hi - lo)
    const threshold = mean * 1.5 + 0.001
    if (fluxFrames[i] > threshold && fluxFrames[i] > fluxFrames[i - 1] && fluxFrames[i] >= fluxFrames[i + 1]) {
      onsetFrameFlags[i] = 1
      onsetCount++
    }
  }

  // BPM por autocorrelación de intervalos entre onsets (voto por bucket de 1bpm)
  const onsetTimes: number[] = []
  for (let i = 0; i < numFrames; i++) if (onsetFrameFlags[i]) onsetTimes.push(i * frameTimeSec)
  let bpm: number | null = null, bpmConfidence = 0
  if (onsetTimes.length >= 4) {
    const intervals: number[] = []
    for (let i = 1; i < onsetTimes.length; i++) {
      const d = onsetTimes[i] - onsetTimes[i - 1]
      if (d > 0.2 && d < 2.0) intervals.push(d)
    }
    if (intervals.length >= 4) {
      const votes = new Map<number, number>()
      for (const d of intervals) {
        for (const mult of [0.5, 1, 2]) {
          const b = Math.round(60 / (d * mult))
          if (b >= 60 && b <= 200) votes.set(b, (votes.get(b) || 0) + 1)
        }
      }
      let best = 0, bestVotes = 0
      for (const [b, v] of votes) if (v > bestVotes) { bestVotes = v; best = b }
      if (best > 0) { bpm = best; bpmConfidence = bestVotes / intervals.length }
    }
  }

  // downsample a `segments` tramos de salida — el mapeo a forma/color trabaja
  // en esta resolución, no en la de STFT (demasiado fina para ser útil ahí)
  function bucketAvg(arr: Float32Array): number[] {
    const out: number[] = []
    const chunk = numFrames / segments
    for (let s = 0; s < segments; s++) {
      const start = Math.floor(s * chunk), end = Math.max(start + 1, Math.floor((s + 1) * chunk))
      let sum = 0, count = 0
      for (let i = start; i < Math.min(numFrames, end); i++) { sum += arr[i]; count++ }
      out.push(count > 0 ? sum / count : 0)
    }
    return out
  }
  function bucketCount(flags: Uint8Array): number[] {
    const out: number[] = []
    const chunk = numFrames / segments
    for (let s = 0; s < segments; s++) {
      const start = Math.floor(s * chunk), end = Math.max(start + 1, Math.floor((s + 1) * chunk))
      let count = 0
      for (let i = start; i < Math.min(numFrames, end); i++) if (flags[i]) count++
      out.push(count)
    }
    const max = Math.max(...out, 1)
    return out.map(c => c / max)
  }
  function normalize(arr: number[]): number[] {
    const max = Math.max(...arr, 1e-6)
    return arr.map(v => v / max)
  }

  const rms = normalize(bucketAvg(rmsFrames))
  const onsetDensity = bucketCount(onsetFrameFlags)
  const centroid = normalize(bucketAvg(centroidFrames))
  const bandSeg = bandEnergy.map(b => bucketAvg(b))
  const dominantBand: number[] = []
  for (let s = 0; s < segments; s++) {
    let best = 0, bestVal = -1
    for (let bi = 0; bi < bandSeg.length; bi++) if (bandSeg[bi][s] > bestVal) { bestVal = bandSeg[bi][s]; best = bi }
    dominantBand.push(best)
  }

  let centroidMeanSum = 0
  for (const c of centroidFrames) centroidMeanSum += c
  const centroidMeanHz = centroidMeanSum / Math.max(1, centroidFrames.length)

  return { segments, rms, onsetDensity, centroid, dominantBand, centroidMeanHz, bpm, bpmConfidence }
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
