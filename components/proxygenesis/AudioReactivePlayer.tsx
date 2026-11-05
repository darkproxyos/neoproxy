'use client'

import { useEffect, useRef, useState } from 'react'
import { AUDIO_BANDS } from '@/app/lab/proxygenesis/engine/audioAnalysis'
import type { AudioFrame } from './SpecimenViewer'

const mono = "'Space Mono', monospace"

function fmtTime(s: number) {
  if (!Number.isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// Reproductor real del audio fuente de un espécimen + análisis en vivo vía
// Web Audio API (AnalyserNode, no el FFT propio de audioAnalysis.ts —
// acá no hace falta STFT offline, el navegador ya entrega el espectro
// frame a frame). Cada frame se traduce a {rms, bass, treble, hex de la
// banda dominante} y se empuja al visor 3D (pushAudioFrame) para que el
// mesh ya crecido pulse de escala y cambie de color seguín el audio real
// mientras suena — no es una animación precalculada.
export default function AudioReactivePlayer({
  audioPath, color, onFrame, onPlayStateChange,
}: {
  audioPath: string
  color: string
  onFrame: (frame: AudioFrame) => void
  onPlayStateChange?: (playing: boolean) => void
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [ready, setReady] = useState(false)

  const loop = () => {
    const analyser = analyserRef.current
    const ctx = ctxRef.current
    const audio = audioRef.current
    if (analyser && ctx && audio) {
      const data = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(data)
      const binHz = (ctx.sampleRate / 2) / data.length
      let sum = 0, bassSum = 0, bassN = 0, trebleSum = 0, trebleN = 0
      const bandEnergy = new Array(AUDIO_BANDS.length).fill(0)
      const bandCount = new Array(AUDIO_BANDS.length).fill(0)
      for (let i = 0; i < data.length; i++) {
        const hz = i * binHz
        const v = data[i] / 255
        sum += v
        if (hz < 250) { bassSum += v; bassN++ }
        if (hz > 4000) { trebleSum += v; trebleN++ }
        const bandIdx = AUDIO_BANDS.findIndex(b => hz >= b.lo && hz < b.hi)
        if (bandIdx >= 0) { bandEnergy[bandIdx] += v; bandCount[bandIdx]++ }
      }
      let domIdx = 0, domVal = -1
      for (let i = 0; i < bandEnergy.length; i++) {
        const avg = bandCount[i] ? bandEnergy[i] / bandCount[i] : 0
        if (avg > domVal) { domVal = avg; domIdx = i }
      }
      onFrame({
        rms: sum / data.length,
        bass: bassN ? bassSum / bassN : 0,
        treble: trebleN ? trebleSum / trebleN : 0,
        hex: AUDIO_BANDS[domIdx].color,
      })
      setProgress(audio.currentTime)
    }
    rafRef.current = requestAnimationFrame(loop)
  }

  const ensureGraph = () => {
    if (ctxRef.current || !audioRef.current) return
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new Ctx()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 1024
    analyser.smoothingTimeConstant = 0.75
    const source = ctx.createMediaElementSource(audioRef.current)
    source.connect(analyser)
    analyser.connect(ctx.destination)
    ctxRef.current = ctx
    analyserRef.current = analyser
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    ensureGraph()
    if (ctxRef.current?.state === 'suspended') ctxRef.current.resume()
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  }

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Number(e.target.value)
    setProgress(audio.currentTime)
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => { setPlaying(true); onPlayStateChange?.(true); rafRef.current = requestAnimationFrame(loop) }
    const onPause = () => {
      setPlaying(false)
      onPlayStateChange?.(false)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    const onLoaded = () => { setDuration(audio.duration); setReady(true) }
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onPause)
    audio.addEventListener('loadedmetadata', onLoaded)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onPause)
      audio.removeEventListener('loadedmetadata', onLoaded)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioPath])

  // Al cambiar de espécimen (o cerrar el modal) cortamos el audio y
  // cerramos el AudioContext — si no, queda sonando de fondo.
  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      ctxRef.current?.close().catch(() => {})
      ctxRef.current = null
      analyserRef.current = null
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [audioPath])

  return (
    <div style={{
      border: `1px solid ${color}44`, background: `${color}0a`, padding: '12px 14px', marginBottom: 20,
    }}>
      <audio ref={audioRef} src={audioPath} preload="metadata" />
      <div style={{ fontSize: 9, letterSpacing: 2, color: `${color}cc`, marginBottom: 8 }}>
        🔊 ESCUCHAR — EL ESPÉCIMEN REACCIONA EN VIVO AL AUDIO REAL
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={togglePlay}
          disabled={!ready}
          style={{
            fontFamily: mono, fontSize: 11, letterSpacing: 1, padding: '7px 12px', cursor: ready ? 'pointer' : 'default',
            background: playing ? `${color}33` : 'rgba(0,4,10,0.7)', border: `1px solid ${color}`, color,
            flexShrink: 0, opacity: ready ? 1 : 0.5,
          }}
        >
          {playing ? '❚❚ PAUSA' : '▶ PLAY'}
        </button>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={progress}
          onChange={seek}
          style={{ flex: 1, accentColor: color }}
        />
        <span style={{ fontSize: 9, color: '#8fb8d6', flexShrink: 0, minWidth: 72, textAlign: 'right' }}>
          {fmtTime(progress)} / {fmtTime(duration)}
        </span>
      </div>
      <div style={{ fontSize: 8, color: '#4a6080', letterSpacing: 0.5, lineHeight: 1.6, marginTop: 8 }}>
        La geometría ya terminó de crecer — es fija. Lo que sigue al audio en vivo, frame a frame, es el
        color (banda de frecuencia dominante) y un pulso de escala (energía/graves). No es una animación
        precalculada: es el análisis real del tema mientras suena.
      </div>
    </div>
  )
}
