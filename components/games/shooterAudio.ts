// SFX de disparo e impacto para /games/shooter -- Web Audio puro, sin
// samples grabados. A diferencia de stingSynth.ts (un AudioContext efímero
// por sonido, pensado para stings aislados y esporádicos), acá la cadencia
// de disparo es de hasta un tiro cada 160ms: abrir y cerrar un contexto por
// tiro sería caro y cortaría sonidos superpuestos, así que hay un único
// AudioContext persistente por sesión de juego, reutilizado para cada
// disparo/impacto. El ambiente de fondo sigue siendo responsabilidad de
// AmbientLoop (preset 'combate', el mismo motor que ya usan los otros
// juegos) -- este módulo solo cubre los dos efectos puntuales.

export class ShooterSfx {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null

  private ensure(): { ctx: AudioContext; master: GainNode } | null {
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Ctor) return null
        this.ctx = new Ctor()
        this.master = this.ctx.createGain()
        this.master.gain.value = 0.32
        this.master.connect(this.ctx.destination)
      }
      this.ctx.resume?.()
      return { ctx: this.ctx, master: this.master! }
    } catch {
      return null
    }
  }

  // Disparo -- blip corto y seco con el pitch cayendo, pasado por un
  // filtro pasa-alto para que no se pise con el kick del ambiente.
  shoot() {
    const g = this.ensure()
    if (!g) return
    const { ctx, master } = g
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(820, t)
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.07)
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 300
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.5, t)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
    osc.connect(filter); filter.connect(env); env.connect(master)
    osc.start(t); osc.stop(t + 0.1)
  }

  // Impacto confirmado -- dos armónicos agudos y cortos, el "ping" de
  // hitmarker.
  hit() {
    const g = this.ensure()
    if (!g) return
    const { ctx, master } = g
    const t = ctx.currentTime
    for (const [i, f] of [1600, 2400].entries()) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = f
      const env = ctx.createGain()
      env.gain.setValueAtTime(0.001, t)
      env.gain.linearRampToValueAtTime(0.28 / (i + 1), t + 0.004)
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
      osc.connect(env); env.connect(master)
      osc.start(t); osc.stop(t + 0.16)
    }
  }

  // Blanco bonus -- variante más brillante del impacto normal, para que se
  // note la diferencia sin agregar un tercer sonido completamente nuevo.
  bonus() {
    const g = this.ensure()
    if (!g) return
    const { ctx, master } = g
    const t = ctx.currentTime
    for (const [i, f] of [1200, 1800, 2700].entries()) {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = f
      const env = ctx.createGain()
      const start = t + i * 0.03
      env.gain.setValueAtTime(0.001, start)
      env.gain.linearRampToValueAtTime(0.26, start + 0.006)
      env.gain.exponentialRampToValueAtTime(0.001, start + 0.22)
      osc.connect(env); env.connect(master)
      osc.start(start); osc.stop(start + 0.24)
    }
  }

  // Cambio de oleada -- barrido ascendente corto, marca el "level up".
  wave() {
    const g = this.ensure()
    if (!g) return
    const { ctx, master } = g
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(220, t)
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.3)
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 2200
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.001, t)
    env.gain.linearRampToValueAtTime(0.22, t + 0.03)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
    osc.connect(filter); filter.connect(env); env.connect(master)
    osc.start(t); osc.stop(t + 0.36)
  }

  dispose() {
    try { this.ctx?.close() } catch { /* ya pudo cerrarse */ }
    this.ctx = null
    this.master = null
  }
}
