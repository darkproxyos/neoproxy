// Loop ambiental reutilizable para los juegos — reusa el mismo motor de
// síntesis de /audio (SAMPLES) en vez de assets de audio aparte. Pensado
// para sonar de fondo, bajo volumen, no como el secuenciador en primer
// plano de /audio.

import { sampleById, SampleDef } from './sounds'

const STEPS = 16

type TrackSpec = { sample: SampleDef; pattern: boolean[] }

function track(id: string, pattern: number[]): TrackSpec {
  return { sample: sampleById(id), pattern: pattern.map(Boolean) }
}

export type AmbientPreset = 'combate' | 'vuelo'

type PresetDef = { bpm: number; volume: number; tracks: TrackSpec[] }

const PRESETS: Record<AmbientPreset, PresetDef> = {
  // Trickster: ritmo industrial sparso, pulso de kick + hats fantasma.
  combate: {
    bpm: 102,
    volume: 0.3,
    tracks: [
      track('kick-808', [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]),
      track('hihat-closed', [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]),
      track('bass-pluck', [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]),
      track('rim', [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]),
    ],
  },
  // Spaceship: más espaciado y atmosférico, bajo sub largo + hit ocasional.
  vuelo: {
    bpm: 80,
    volume: 0.26,
    tracks: [
      track('bass-sub', [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      track('hihat-open', [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]),
      track('hit-impact', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]),
    ],
  },
}

export class AmbientLoop {
  private preset: PresetDef
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private timerId: number | null = null
  private nextNoteTime = 0
  private currentStep = 0
  private playing = false

  constructor(preset: AmbientPreset) {
    this.preset = PRESETS[preset]
  }

  private ensureCtx() {
    if (this.ctx) return
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const master = ctx.createGain()
    master.gain.value = this.preset.volume
    master.connect(ctx.destination)
    this.ctx = ctx
    this.master = master
  }

  setVolume(v: number) {
    if (this.master) this.master.gain.value = v
  }

  start() {
    if (this.playing) return
    this.ensureCtx()
    this.ctx!.resume?.()
    this.playing = true
    this.currentStep = 0
    this.nextNoteTime = this.ctx!.currentTime + 0.05
    this.scheduler()
  }

  stop() {
    this.playing = false
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId)
      this.timerId = null
    }
  }

  dispose() {
    this.stop()
    this.ctx?.close().catch(() => {})
    this.ctx = null
    this.master = null
  }

  get isPlaying() {
    return this.playing
  }

  private scheduler = () => {
    if (!this.playing || !this.ctx) return
    const secondsPerStep = 60 / this.preset.bpm / 4
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      for (const t of this.preset.tracks) {
        if (t.pattern[this.currentStep]) t.sample.render(this.ctx, this.master!, this.nextNoteTime)
      }
      this.nextNoteTime += secondsPerStep
      this.currentStep = (this.currentStep + 1) % STEPS
    }
    this.timerId = window.setTimeout(this.scheduler, 25)
  }
}
