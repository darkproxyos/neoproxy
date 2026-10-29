// Stings sintetizados con Web Audio — nunca un archivo grabado. Para un
// artefacto como el sticker del Joker, "la voz del artefacto" tiene más
// sentido como un sonido procedural y reproducible que como una muestra de
// voz real (que además generaría/licenciaría algo que no es nuestro). Cada
// función arma su propio grafo de audio efímero y se desconecta sola.

export type StingType = 'cackle' | 'chime' | 'glitch'

function getContext(): AudioContext | null {
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  return new Ctor()
}

// Risa sintética: 4 pulsos cortos de un oscilador con el pitch cayendo
// dentro de cada pulso (el "ha" de una carcajada) y subiendo levemente
// pulso a pulso — ritmo de carcajada, timbre nunca humano.
function cackle(ctx: AudioContext) {
  const master = ctx.createGain()
  master.gain.value = 0.18
  master.connect(ctx.destination)

  const pulses = 4
  const pulseDur = 0.11
  const gap = 0.07
  let t = ctx.currentTime

  for (let i = 0; i < pulses; i++) {
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    const baseFreq = 180 + i * 22
    osc.frequency.setValueAtTime(baseFreq * 1.6, t)
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, t + pulseDur)

    const env = ctx.createGain()
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(1, t + 0.012)
    env.gain.exponentialRampToValueAtTime(0.001, t + pulseDur)

    osc.connect(env)
    env.connect(master)
    osc.start(t)
    osc.stop(t + pulseDur + 0.02)

    t += pulseDur + gap
  }

  window.setTimeout(() => { try { ctx.close() } catch { /* ya pudo cerrarse */ } }, (t - ctx.currentTime + 0.3) * 1000)
}

function chime(ctx: AudioContext) {
  const master = ctx.createGain()
  master.gain.value = 0.15
  master.connect(ctx.destination)
  const freqs = [660, 880, 1320]
  const t = ctx.currentTime
  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = f
    const env = ctx.createGain()
    const start = t + i * 0.06
    env.gain.setValueAtTime(0, start)
    env.gain.linearRampToValueAtTime(1, start + 0.02)
    env.gain.exponentialRampToValueAtTime(0.001, start + 0.9)
    osc.connect(env)
    env.connect(master)
    osc.start(start)
    osc.stop(start + 1)
  })
  window.setTimeout(() => { try { ctx.close() } catch { /* ya pudo cerrarse */ } }, 1200)
}

function glitch(ctx: AudioContext) {
  const master = ctx.createGain()
  master.gain.value = 0.12
  master.connect(ctx.destination)
  const t = ctx.currentTime
  for (let i = 0; i < 6; i++) {
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.value = 220 + Math.random() * 900
    const env = ctx.createGain()
    const start = t + i * 0.035
    env.gain.setValueAtTime(0.9, start)
    env.gain.exponentialRampToValueAtTime(0.001, start + 0.03)
    osc.connect(env)
    env.connect(master)
    osc.start(start)
    osc.stop(start + 0.04)
  }
  window.setTimeout(() => { try { ctx.close() } catch { /* ya pudo cerrarse */ } }, 500)
}

export function playSting(type: StingType) {
  try {
    const ctx = getContext()
    if (!ctx) return
    if (type === 'cackle') cackle(ctx)
    else if (type === 'chime') chime(ctx)
    else glitch(ctx)
  } catch {
    // sin audio en este contexto (autoplay bloqueado, etc.) — no es crítico
  }
}
