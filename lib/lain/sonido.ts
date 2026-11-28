// Zumbido ambiente de la red (solo navegador). Todo se genera con WebAudio, sin archivos:
//  - el zumbido de un transformador a 50 Hz (la red eléctrica de Chile) con sus armónicos,
//    más una respiración lenta de volumen;
//  - un siseo muy bajo de señal;
//  - de vez en cuando una chicharra lejana (tono agudo modulado en amplitud).
// Los navegadores solo dejan sonar tras un gesto del usuario: iniciar() se llama desde un
// clic o una tecla. El volumen total es bajo a propósito; sube en 2,5 s y baja en 0,8 s.

export type Zumbido = {
  iniciar(): Promise<void>
  detener(): void
  activo(): boolean
}

type ConAudio = { webkitAudioContext?: typeof AudioContext }

export function crearZumbido(): Zumbido {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let fuentes: AudioScheduledSourceNode[] = []
  let timer: ReturnType<typeof setTimeout> | null = null
  let activo = false

  const pausa = () => { if (activo && document.hidden && ctx?.state === 'running') void ctx.suspend() }
  const reanuda = () => { if (activo && !document.hidden && ctx?.state === 'suspended') void ctx.resume() }
  const visibilidad = () => { if (document.hidden) pausa(); else reanuda() }

  function ruido(c: AudioContext) {
    const largo = c.sampleRate * 2
    const buf = c.createBuffer(1, largo, c.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < largo; i++) d[i] = Math.random() * 2 - 1
    const s = c.createBufferSource()
    s.buffer = buf
    s.loop = true
    return s
  }

  function chicharra(c: AudioContext, destino: AudioNode) {
    const t = c.currentTime, dur = 1.2 + Math.random() * 2
    const portadora = c.createOscillator()
    portadora.type = 'sine'
    portadora.frequency.value = 4300 + Math.random() * 1800
    const am = c.createOscillator()
    am.frequency.value = 22 + Math.random() * 14
    const amGain = c.createGain()
    amGain.gain.value = 0.5
    const g = c.createGain()
    g.gain.value = 0.5 // 0,5 ± 0,5: el volumen late entre 0 y 1 al ritmo de la modulación
    const env = c.createGain()
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(0.008, t + 0.4)
    env.gain.linearRampToValueAtTime(0, t + dur)
    portadora.connect(g)
    am.connect(amGain)
    amGain.connect(g.gain)
    g.connect(env)
    env.connect(destino)
    portadora.start(t); am.start(t)
    portadora.stop(t + dur + 0.1); am.stop(t + dur + 0.1)
  }

  function programar() {
    timer = setTimeout(() => {
      if (ctx && master && activo && ctx.state === 'running') chicharra(ctx, master)
      if (activo) programar()
    }, 5000 + Math.random() * 9000)
  }

  return {
    activo: () => activo,

    async iniciar() {
      if (activo) return
      const Ctx = window.AudioContext ?? (window as unknown as ConAudio).webkitAudioContext
      if (!Ctx) throw new Error('Este navegador no tiene WebAudio')
      const c = new Ctx()
      await c.resume()
      ctx = c
      master = c.createGain()
      master.gain.setValueAtTime(0, c.currentTime)
      master.gain.linearRampToValueAtTime(1, c.currentTime + 2.5)
      master.connect(c.destination)

      // transformador: 50 Hz + armónicos por un pasabajos, con respiración lenta
      const zum = c.createGain()
      zum.gain.value = 0.05
      const pasabajos = c.createBiquadFilter()
      pasabajos.type = 'lowpass'
      pasabajos.frequency.value = 420
      for (const [f, tipo, k] of [[50, 'sine', 1], [100, 'sawtooth', 0.22], [150, 'sine', 0.18]] as const) {
        const o = c.createOscillator()
        o.type = tipo
        o.frequency.value = f
        const g = c.createGain()
        g.gain.value = k
        o.connect(g); g.connect(pasabajos); o.start()
        fuentes.push(o)
      }
      pasabajos.connect(zum); zum.connect(master)
      const lfo = c.createOscillator()
      lfo.frequency.value = 0.07
      const lfoGain = c.createGain()
      lfoGain.gain.value = 0.012
      lfo.connect(lfoGain); lfoGain.connect(zum.gain); lfo.start()
      fuentes.push(lfo)

      // siseo de señal
      const n = ruido(c)
      const banda = c.createBiquadFilter()
      banda.type = 'bandpass'
      banda.frequency.value = 3000
      banda.Q.value = 0.6
      const nGain = c.createGain()
      nGain.gain.value = 0.004
      n.connect(banda); banda.connect(nGain); nGain.connect(master); n.start()
      fuentes.push(n)

      activo = true
      document.addEventListener('visibilitychange', visibilidad)
      programar()
    },

    detener() {
      if (!activo || !ctx || !master) return
      activo = false
      document.removeEventListener('visibilitychange', visibilidad)
      if (timer) clearTimeout(timer)
      timer = null
      const c = ctx, srcs = fuentes
      master.gain.cancelScheduledValues(c.currentTime)
      master.gain.setValueAtTime(master.gain.value, c.currentTime)
      master.gain.linearRampToValueAtTime(0, c.currentTime + 0.8)
      ctx = null; master = null; fuentes = []
      setTimeout(() => {
        for (const s of srcs) { try { s.stop() } catch { /* ya detenida */ } }
        void c.close()
      }, 900)
    },
  }
}
