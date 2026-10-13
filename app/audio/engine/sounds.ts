// Motor de sintesis de percusion/bajo 100% generado en el navegador con Web
// Audio API — sin samples de terceros ni paquetes con copyright. Cada sonido
// es una funcion render(ctx, dest, t) que agenda nodos de audio a partir de
// t; como BaseAudioContext es la clase comun de AudioContext (tiempo real,
// para preview y el secuenciador) y OfflineAudioContext (para exportar a
// .wav), la misma definicion sirve para las tres cosas sin duplicar logica.

export type SampleCategory = 'KICK' | 'SNARE' | 'HAT' | 'CLAP' | 'PERC' | 'BASS' | 'HIT'

export type SampleDef = {
  id: string
  name: string
  category: SampleCategory
  duration: number // ventana en segundos necesaria para que el sonido termine de decaer
  render: (ctx: BaseAudioContext, dest: AudioNode, t: number) => void
}

function noiseBuffer(ctx: BaseAudioContext, duration: number): AudioBuffer {
  const n = Math.max(1, Math.floor(ctx.sampleRate * duration))
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1
  return buf
}

function noiseBurst(
  ctx: BaseAudioContext, dest: AudioNode, t: number,
  opts: { filterType: BiquadFilterType; freq: number; q?: number; attack?: number; decay: number; duration: number; peak?: number },
) {
  const { filterType, freq, q = 1, attack = 0.001, decay, duration, peak = 1 } = opts
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx, duration)
  const filter = ctx.createBiquadFilter()
  filter.type = filterType
  filter.frequency.value = freq
  filter.Q.value = q
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(peak, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  src.connect(filter); filter.connect(g); g.connect(dest)
  src.start(t); src.stop(t + duration)
}

function tone(
  ctx: BaseAudioContext, dest: AudioNode, t: number,
  opts: { type: OscillatorType; freqStart: number; freqEnd?: number; pitchDecay?: number; decay: number; peak?: number },
) {
  const { type, freqStart, freqEnd, pitchDecay = 0.001, decay, peak = 1 } = opts
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freqStart, t)
  if (freqEnd !== undefined) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + pitchDecay)
  const g = ctx.createGain()
  g.gain.setValueAtTime(peak, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
  osc.connect(g); g.connect(dest)
  osc.start(t); osc.stop(t + decay + 0.02)
}

function kick(freqStart: number, freqEnd: number, pitchDecay: number, ampDecay: number, peak: number, click: boolean) {
  return (ctx: BaseAudioContext, dest: AudioNode, t: number) => {
    tone(ctx, dest, t, { type: 'sine', freqStart, freqEnd, pitchDecay, decay: ampDecay, peak })
    if (click) {
      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.setValueAtTime(900, t)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.5, t)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.02)
      osc.connect(g); g.connect(dest)
      osc.start(t); osc.stop(t + 0.03)
    }
  }
}

export const SAMPLES: SampleDef[] = [
  {
    id: 'kick-808', name: 'KICK 808', category: 'KICK', duration: 0.9,
    render: kick(150, 45, 0.12, 0.55, 1, false),
  },
  {
    id: 'kick-punch', name: 'KICK PUNCH', category: 'KICK', duration: 0.45,
    render: kick(190, 55, 0.05, 0.22, 1, true),
  },
  {
    id: 'kick-sub', name: 'KICK SUB', category: 'KICK', duration: 1.1,
    render: kick(65, 32, 0.25, 0.9, 0.9, false),
  },
  {
    id: 'snare-tight', name: 'SNARE TIGHT', category: 'SNARE', duration: 0.3,
    render: (ctx, dest, t) => {
      noiseBurst(ctx, dest, t, { filterType: 'bandpass', freq: 1500, q: 1.2, decay: 0.12, duration: 0.25, peak: 0.9 })
      tone(ctx, dest, t, { type: 'triangle', freqStart: 200, decay: 0.08, peak: 0.4 })
    },
  },
  {
    id: 'snare-trap', name: 'SNARE TRAP', category: 'SNARE', duration: 0.35,
    render: (ctx, dest, t) => {
      noiseBurst(ctx, dest, t, { filterType: 'highpass', freq: 2000, q: 0.8, decay: 0.18, duration: 0.3, peak: 1 })
      tone(ctx, dest, t, { type: 'sine', freqStart: 160, freqEnd: 120, pitchDecay: 0.04, decay: 0.05, peak: 0.3 })
    },
  },
  {
    id: 'hihat-closed', name: 'HI-HAT CLOSED', category: 'HAT', duration: 0.1,
    render: (ctx, dest, t) => {
      noiseBurst(ctx, dest, t, { filterType: 'highpass', freq: 7500, q: 1, decay: 0.045, duration: 0.08, peak: 0.7 })
    },
  },
  {
    id: 'hihat-open', name: 'HI-HAT OPEN', category: 'HAT', duration: 0.45,
    render: (ctx, dest, t) => {
      noiseBurst(ctx, dest, t, { filterType: 'highpass', freq: 7000, q: 1, decay: 0.35, duration: 0.4, peak: 0.6 })
    },
  },
  {
    id: 'clap', name: 'CLAP', category: 'CLAP', duration: 0.35,
    render: (ctx, dest, t) => {
      [0, 0.012, 0.024].forEach((off, i) => {
        noiseBurst(ctx, dest, t + off, { filterType: 'bandpass', freq: 1100, q: 1.5, decay: 0.06, duration: 0.1, peak: [0.8, 0.7, 0.9][i] })
      })
      noiseBurst(ctx, dest, t + 0.03, { filterType: 'bandpass', freq: 1100, q: 1.5, decay: 0.2, duration: 0.25, peak: 0.5 })
    },
  },
  {
    id: 'rim', name: 'RIM SHOT', category: 'PERC', duration: 0.15,
    render: (ctx, dest, t) => {
      tone(ctx, dest, t, { type: 'triangle', freqStart: 1700, decay: 0.05, peak: 0.6 })
      noiseBurst(ctx, dest, t, { filterType: 'highpass', freq: 3000, decay: 0.06, duration: 0.08, peak: 0.3 })
    },
  },
  {
    id: 'tom', name: 'TOM', category: 'PERC', duration: 0.45,
    render: kick(220, 85, 0.1, 0.35, 0.9, false),
  },
  {
    id: 'bass-sub', name: 'BASS SUB', category: 'BASS', duration: 0.7,
    render: (ctx, dest, t) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(55, t) // A1
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 300
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.linearRampToValueAtTime(0.9, t + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55)
      osc.connect(filter); filter.connect(g); g.connect(dest)
      osc.start(t); osc.stop(t + 0.6)
    },
  },
  {
    id: 'bass-pluck', name: 'BASS PLUCK', category: 'BASS', duration: 0.55,
    render: (ctx, dest, t) => {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(110, t) // A2
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.Q.value = 4
      filter.frequency.setValueAtTime(1800, t)
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.3)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.8, t)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4)
      osc.connect(filter); filter.connect(g); g.connect(dest)
      osc.start(t); osc.stop(t + 0.45)
    },
  },
  {
    id: 'hit-impact', name: 'IMPACT HIT', category: 'HIT', duration: 1.4,
    render: (ctx, dest, t) => {
      tone(ctx, dest, t, { type: 'sine', freqStart: 90, freqEnd: 35, pitchDecay: 0.3, decay: 0.6, peak: 1 })
      noiseBurst(ctx, dest, t, { filterType: 'lowpass', freq: 6000, decay: 0.9, duration: 1.2, peak: 0.6 })
    },
  },
]

export const CATEGORY_LABELS: Record<SampleCategory, string> = {
  KICK: 'KICK', SNARE: 'SNARE', HAT: 'HI-HAT', CLAP: 'CLAP', PERC: 'PERCUSIÓN', BASS: 'BAJO', HIT: 'IMPACTOS',
}

export const CATEGORY_ORDER: SampleCategory[] = ['KICK', 'SNARE', 'HAT', 'CLAP', 'PERC', 'BASS', 'HIT']

export function sampleById(id: string): SampleDef {
  const s = SAMPLES.find(s => s.id === id)
  if (!s) throw new Error(`sample desconocido: ${id}`)
  return s
}
