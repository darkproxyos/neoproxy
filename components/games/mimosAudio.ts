// SFX de /games/mimos-vs-payasos -- Web Audio puro, sin samples, mismo
// patrón que components/games/shooterAudio.ts (un único AudioContext
// persistente por sesión, reutilizado para cada efecto en vez de abrir uno
// nuevo por sonido). Paleta de sonidos pensada para el contraste del
// juego: el mimo es seco y contenido (whoosh, chime), los payasos son
// chillones y cómicos (honk, splat).

export class MimosSfx {
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

  // Empujón -- whoosh corto y seco, ruido filtrado pasando rápido de
  // agudo a grave (aire desplazado, no un golpe).
  push() {
    const g = this.ensure()
    if (!g) return
    const { ctx, master } = g
    const t = ctx.currentTime
    const bufferSize = ctx.sampleRate * 0.12
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(1800, t)
    filter.frequency.exponentialRampToValueAtTime(220, t + 0.12)
    filter.Q.value = 0.9
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.4, t)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.13)
    noise.connect(filter); filter.connect(env); env.connect(master)
    noise.start(t); noise.stop(t + 0.14)
  }

  // Payaso golpeado por el empujón -- honk corto y chillón, dos
  // osciladores desafinados a propósito (bocina de verdad nunca está
  // perfectamente afinada).
  honk() {
    const g = this.ensure()
    if (!g) return
    const { ctx, master } = g
    const t = ctx.currentTime
    for (const f of [311, 318]) {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.value = f
      const env = ctx.createGain()
      env.gain.setValueAtTime(0.001, t)
      env.gain.linearRampToValueAtTime(0.22, t + 0.015)
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.16)
      osc.connect(env); env.connect(master)
      osc.start(t); osc.stop(t + 0.18)
    }
  }

  // Payaso derrotado -- pop ascendente, el "chiste resuelto".
  clownDown() {
    const g = this.ensure()
    if (!g) return
    const { ctx, master } = g
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(180, t)
    osc.frequency.exponentialRampToValueAtTime(680, t + 0.1)
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.28, t)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
    osc.connect(env); env.connect(master)
    osc.start(t); osc.stop(t + 0.13)
  }

  // Torta lanzada -- fwoop grave y breve.
  pieThrow() {
    const g = this.ensure()
    if (!g) return
    const { ctx, master } = g
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(420, t)
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.09)
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.18, t)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
    osc.connect(env); env.connect(master)
    osc.start(t); osc.stop(t + 0.1)
  }

  // Torta explotando (contra el jugador o bloqueada por la pared) --
  // ruido filtrado corto, un "splat".
  splat() {
    const g = this.ensure()
    if (!g) return
    const { ctx, master } = g
    const t = ctx.currentTime
    const bufferSize = ctx.sampleRate * 0.15
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(2600, t)
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.15)
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.32, t)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.16)
    noise.connect(filter); filter.connect(env); env.connect(master)
    noise.start(t); noise.stop(t + 0.17)
  }

  // El mimo recibe daño -- apagado y disonante, a propósito distinto del
  // resto (nunca grita, pero algo suena mal).
  hurt() {
    const g = this.ensure()
    if (!g) return
    const { ctx, master } = g
    const t = ctx.currentTime
    for (const f of [140, 148]) {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = f
      const env = ctx.createGain()
      env.gain.setValueAtTime(0.001, t)
      env.gain.linearRampToValueAtTime(0.24, t + 0.01)
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
      osc.connect(env); env.connect(master)
      osc.start(t); osc.stop(t + 0.22)
    }
  }

  // Pared invisible activada -- chime corto, dos armónicos limpios (a
  // diferencia del honk de los payasos, el mimo siempre suena "limpio").
  wall() {
    const g = this.ensure()
    if (!g) return
    const { ctx, master } = g
    const t = ctx.currentTime
    for (const [i, f] of [900, 1350].entries()) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = f
      const env = ctx.createGain()
      const start = t + i * 0.025
      env.gain.setValueAtTime(0.001, start)
      env.gain.linearRampToValueAtTime(0.2, start + 0.01)
      env.gain.exponentialRampToValueAtTime(0.001, start + 0.25)
      osc.connect(env); env.connect(master)
      osc.start(start); osc.stop(start + 0.26)
    }
  }

  // Cambio de oleada -- mismo barrido ascendente que el resto del
  // catálogo (shooterAudio.ts), para que "subir de oleada" suene igual
  // en cualquier juego del sitio.
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
