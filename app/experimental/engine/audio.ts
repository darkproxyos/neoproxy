// Motor de sonificación genérico, compartido entre Enjambre y Evolución —
// Web Audio nativo, sin librerías. No decide QUÉ sonificar (eso vive en
// cada página, que conoce su propia simulación); solo ofrece primitivas:
// un drone continuo modulable en vivo (para estado que cambia cuadro a
// cuadro, como la velocidad promedio de una bandada) y eventos discretos
// cortos o largos (para sucesos puntuales, como una avalancha o el cierre
// de una generación).
//
// Arranca/para explícito via start()/stop() — nunca se auto-inicia, porque
// los navegadores exigen un gesto del usuario para crear el AudioContext.

export class SonifyEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private droneOsc: OscillatorNode | null = null
  private droneFilter: BiquadFilterNode | null = null
  private droneGain: GainNode | null = null

  get running() {
    return this.ctx !== null
  }

  start(masterLevel = 0.5) {
    if (this.ctx) return
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    const master = ctx.createGain()
    master.gain.value = masterLevel
    master.connect(ctx.destination)
    this.ctx = ctx
    this.masterGain = master
  }

  stop() {
    if (!this.ctx) return
    try { this.droneOsc?.stop() } catch { /* ya puede estar detenido */ }
    this.droneOsc?.disconnect()
    this.droneFilter?.disconnect()
    this.droneGain?.disconnect()
    this.masterGain?.disconnect()
    this.droneOsc = null
    this.droneFilter = null
    this.droneGain = null
    this.masterGain = null
    const ctx = this.ctx
    this.ctx = null
    ctx.close().catch(() => {})
  }

  // Arma el drone una sola vez (ganancia en 0, inaudible) — después se
  // modula en vivo con setDrone() sin recrear nodos cuadro a cuadro.
  ensureDrone(baseFreq: number) {
    if (!this.ctx || !this.masterGain || this.droneOsc) return
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = baseFreq
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 300
    filter.Q.value = 5
    const gain = ctx.createGain()
    gain.gain.value = 0
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    this.droneOsc = osc
    this.droneFilter = filter
    this.droneGain = gain
  }

  setDrone(params: { freq?: number; detune?: number; cutoff?: number; gain?: number }) {
    if (!this.ctx || !this.droneOsc || !this.droneFilter || !this.droneGain) return
    const now = this.ctx.currentTime
    if (params.freq !== undefined) this.droneOsc.frequency.setTargetAtTime(params.freq, now, 0.1)
    if (params.detune !== undefined) this.droneOsc.detune.setTargetAtTime(params.detune, now, 0.1)
    if (params.cutoff !== undefined) this.droneFilter.frequency.setTargetAtTime(params.cutoff, now, 0.15)
    if (params.gain !== undefined) this.droneGain.gain.setTargetAtTime(params.gain, now, 0.2)
  }

  // Evento corto y percusivo — una avalancha, un golpe.
  hit(params: { freq: number; duration?: number; gain?: number; type?: OscillatorType }) {
    if (!this.ctx || !this.masterGain) return
    const { freq, duration = 0.3, gain = 0.3, type = 'sine' } = params
    const ctx = this.ctx
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(freq, now)
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * 0.55), now + duration)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(gain, now + 0.008)
    g.gain.exponentialRampToValueAtTime(0.001, now + duration)
    osc.connect(g)
    g.connect(this.masterGain)
    osc.start(now)
    osc.stop(now + duration + 0.05)
    osc.onended = () => { osc.disconnect(); g.disconnect() }
  }

  // Evento más largo y suave — cierre de una generación, un hito.
  swell(params: { freq: number; duration?: number; gain?: number }) {
    if (!this.ctx || !this.masterGain) return
    const { freq, duration = 0.5, gain = 0.2 } = params
    const ctx = this.ctx
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, now)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(gain, now + duration * 0.35)
    g.gain.exponentialRampToValueAtTime(0.001, now + duration)
    osc.connect(g)
    g.connect(this.masterGain)
    osc.start(now)
    osc.stop(now + duration + 0.05)
    osc.onended = () => { osc.disconnect(); g.disconnect() }
  }
}
