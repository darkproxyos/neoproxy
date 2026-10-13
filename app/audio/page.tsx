'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { SAMPLES, CATEGORY_LABELS, CATEGORY_ORDER, sampleById, SampleDef } from './engine/sounds'
import { downloadSampleWav, downloadBufferWav } from './engine/wav'

const mono = "'Space Mono', monospace"
const AMBER = '#ff9500'

const STEPS = 16
const TRACK_IDS = ['kick-808', 'snare-trap', 'hihat-closed', 'hihat-open', 'clap', 'rim', 'tom', 'bass-pluck']
const TRACKS = TRACK_IDS.map(sampleById)

// Groove de arranque para que el secuenciador no se sienta vacío al entrar —
// four-on-the-floor + backbeat + hats en octavos con acentos abiertos.
const PRESET_PATTERN: boolean[][] = [
  [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false], // kick
  [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // snare
  [true, false, true, false, true, false, false, false, true, false, true, false, true, false, false, false], // hat closed
  [false, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false], // hat open
  [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // clap
  [false, false, false, true, false, false, false, true, false, false, false, true, false, false, false, true], // rim
  [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // tom
  [true, false, false, false, false, false, true, false, true, false, false, false, false, false, true, false], // bass
]

const EMPTY_PATTERN: boolean[][] = TRACKS.map(() => Array(STEPS).fill(false))

export default function AudioPage() {
  const [steps, setSteps] = useState<boolean[][]>(PRESET_PATTERN)
  const [bpm, setBpm] = useState(120)
  const [seqPlaying, setSeqPlaying] = useState(false)
  const [playheadStep, setPlayheadStep] = useState(-1)
  const [exporting, setExporting] = useState(false)
  const [previewing, setPreviewing] = useState<string | null>(null)

  const stepsRef = useRef(steps)
  const bpmRef = useRef(bpm)
  useEffect(() => { stepsRef.current = steps }, [steps])
  useEffect(() => { bpmRef.current = bpm }, [bpm])

  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const timerIdRef = useRef<number | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const isPlayingRef = useRef(false)
  const currentStepRef = useRef(0)
  const nextNoteTimeRef = useRef(0)
  const noteQueueRef = useRef<{ step: number; time: number }[]>([])
  const lastStepDrawnRef = useRef(-1)

  const initAudio = () => {
    if (audioCtxRef.current) return audioCtxRef.current
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const master = ctx.createGain()
    master.gain.value = 0.85
    const comp = ctx.createDynamicsCompressor()
    master.connect(comp)
    comp.connect(ctx.destination)
    audioCtxRef.current = ctx
    masterRef.current = master
    return ctx
  }

  const playPreview = (def: SampleDef) => {
    const ctx = initAudio()
    def.render(ctx, masterRef.current!, ctx.currentTime + 0.02)
    setPreviewing(def.id)
    window.setTimeout(() => setPreviewing(cur => (cur === def.id ? null : cur)), Math.min(900, def.duration * 1000))
  }

  const scheduleStep = (stepNumber: number, time: number) => {
    const ctx = audioCtxRef.current!
    TRACKS.forEach((track, ti) => {
      if (stepsRef.current[ti][stepNumber]) track.render(ctx, masterRef.current!, time)
    })
    noteQueueRef.current.push({ step: stepNumber, time })
  }

  const scheduler = () => {
    const ctx = audioCtxRef.current!
    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      scheduleStep(currentStepRef.current, nextNoteTimeRef.current)
      const secondsPerStep = 60.0 / bpmRef.current / 4
      nextNoteTimeRef.current += secondsPerStep
      currentStepRef.current = (currentStepRef.current + 1) % STEPS
    }
    timerIdRef.current = window.setTimeout(scheduler, 25)
  }

  const drawLoop = () => {
    const ctx = audioCtxRef.current
    if (ctx) {
      let toDraw = lastStepDrawnRef.current
      const now = ctx.currentTime
      while (noteQueueRef.current.length && noteQueueRef.current[0].time < now) {
        toDraw = noteQueueRef.current[0].step
        noteQueueRef.current.shift()
      }
      if (toDraw !== lastStepDrawnRef.current) {
        lastStepDrawnRef.current = toDraw
        setPlayheadStep(toDraw)
      }
    }
    rafIdRef.current = requestAnimationFrame(drawLoop)
  }

  const startSequencer = () => {
    if (isPlayingRef.current) return
    const ctx = initAudio()
    isPlayingRef.current = true
    currentStepRef.current = 0
    nextNoteTimeRef.current = ctx.currentTime + 0.05
    noteQueueRef.current = []
    lastStepDrawnRef.current = -1
    scheduler()
    rafIdRef.current = requestAnimationFrame(drawLoop)
    setSeqPlaying(true)
  }

  const stopSequencer = () => {
    isPlayingRef.current = false
    if (timerIdRef.current) window.clearTimeout(timerIdRef.current)
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    setSeqPlaying(false)
    setPlayheadStep(-1)
  }

  useEffect(() => () => stopSequencer(), [])

  const toggleStep = (trackIdx: number, stepIdx: number) => {
    setSteps(prev => {
      const next = prev.map(row => [...row])
      next[trackIdx][stepIdx] = !next[trackIdx][stepIdx]
      return next
    })
  }

  const clearPattern = () => setSteps(EMPTY_PATTERN.map(row => [...row]))
  const loadPreset = () => setSteps(PRESET_PATTERN.map(row => [...row]))

  const exportLoop = async () => {
    setExporting(true)
    try {
      const secondsPerStep = 60 / bpm / 4
      const repeats = 4
      const totalSteps = STEPS * repeats
      const totalDuration = totalSteps * secondsPerStep + 1.2
      const sampleRate = 44100
      const offline = new OfflineAudioContext(1, Math.ceil(totalDuration * sampleRate), sampleRate)
      const master = offline.createGain()
      master.gain.value = 0.85
      master.connect(offline.destination)
      for (let s = 0; s < totalSteps; s++) {
        const stepIdx = s % STEPS
        const time = s * secondsPerStep + 0.02
        TRACKS.forEach((track, ti) => { if (steps[ti][stepIdx]) track.render(offline, master, time) })
      }
      const buffer = await offline.startRendering()
      await downloadBufferWav(buffer, `neoproxy-loop-${bpm}bpm.wav`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER AL INICIO
        </Link>

        <div style={{ fontSize: 9, color: `${AMBER}66`, letterSpacing: 6, marginBottom: 16 }}>
          // AUDIO — NPX-AUD-BEATFORGE
        </div>
        <h1 style={{
          fontSize: 40, fontWeight: 700, letterSpacing: 6, color: AMBER,
          textShadow: `0 0 40px ${AMBER}44`, marginBottom: 16, lineHeight: 1,
        }}>
          AUDIO
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 620, marginBottom: 56 }}>
          Kicks, snares, hats, bajos e impactos sintetizados en vivo con Web Audio API — nada de packs
          comerciales descargados, cada sonido se genera por código en tu navegador. Armá un groove en el
          secuenciador o escuchá y descargá cada sample suelto como .wav para usarlo donde quieras.
        </p>

        {/* ---- SECUENCIADOR ---- */}
        <div style={{ fontSize: 10, color: AMBER, letterSpacing: 4, marginBottom: 18 }}>SECUENCIADOR</div>

        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 20,
          background: 'rgba(2,4,8,0.8)', border: '1px solid rgba(255,149,0,0.15)', borderRadius: 10, padding: '14px 18px',
        }}>
          <button
            onClick={seqPlaying ? stopSequencer : startSequencer}
            style={{
              background: seqPlaying ? 'rgba(255,45,85,0.15)' : 'rgba(255,149,0,0.15)',
              border: `1px solid ${seqPlaying ? '#ff2d55' : AMBER}`,
              color: seqPlaying ? '#ff2d55' : AMBER, fontFamily: mono, fontSize: 10, fontWeight: 700,
              letterSpacing: 2, padding: '9px 16px', borderRadius: 6, cursor: 'pointer', minHeight: 36,
            }}
          >
            {seqPlaying ? '■ STOP' : '▶ PLAY'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 9, letterSpacing: 1, color: '#8892a4' }}>BPM</span>
            <input
              type="range" min={60} max={180} step={1} value={bpm}
              onChange={e => setBpm(Number(e.target.value))}
              style={{ width: 110, accentColor: AMBER }}
            />
            <span style={{ fontSize: 10, color: AMBER, width: 28, textAlign: 'right' }}>{bpm}</span>
          </div>

          <button onClick={loadPreset} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: '#8fb8d6',
            fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '8px 12px', borderRadius: 6, cursor: 'pointer', minHeight: 32,
          }}>
            PRESET
          </button>
          <button onClick={clearPattern} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: '#8fb8d6',
            fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '8px 12px', borderRadius: 6, cursor: 'pointer', minHeight: 32,
          }}>
            LIMPIAR
          </button>
          <button onClick={exportLoop} disabled={exporting} style={{
            background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.35)', color: '#00d4ff',
            fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '8px 12px', borderRadius: 6,
            cursor: exporting ? 'default' : 'pointer', minHeight: 32, opacity: exporting ? 0.5 : 1, marginLeft: 'auto',
          }}>
            {exporting ? 'EXPORTANDO…' : '⬇ EXPORT LOOP (4 COMPASES, .WAV)'}
          </button>
        </div>

        <div style={{
          background: 'rgba(2,4,8,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
          padding: '14px 10px', marginBottom: 56, overflowX: 'auto',
        }}>
          {/* marcadores de paso por encima de la grilla */}
          <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(${STEPS}, 1fr)`, gap: 4, marginBottom: 6, minWidth: 620 }}>
            <div />
            {Array.from({ length: STEPS }).map((_, i) => (
              <div key={i} style={{
                textAlign: 'center', fontSize: 7, color: i === playheadStep ? AMBER : '#3a4a60',
                fontWeight: i % 4 === 0 ? 700 : 400,
              }}>
                {i + 1}
              </div>
            ))}
          </div>

          {TRACKS.map((track, ti) => (
            <div key={track.id} style={{ display: 'grid', gridTemplateColumns: `120px repeat(${STEPS}, 1fr)`, gap: 4, marginBottom: 4, minWidth: 620, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => playPreview(track)}
                  title={`Escuchar ${track.name}`}
                  style={{
                    width: 16, height: 16, flexShrink: 0, borderRadius: '50%', cursor: 'pointer', padding: 0,
                    background: previewing === track.id ? AMBER : 'rgba(255,255,255,0.08)',
                    border: `1px solid ${previewing === track.id ? AMBER : 'rgba(255,255,255,0.2)'}`,
                    color: previewing === track.id ? '#000' : '#8892a4', fontSize: 7, lineHeight: '14px',
                  }}
                >
                  ▶
                </button>
                <span style={{ fontSize: 8, letterSpacing: 0.5, color: '#8fb8d6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {track.name}
                </span>
              </div>
              {Array.from({ length: STEPS }).map((_, si) => {
                const active = steps[ti][si]
                const isPlayhead = si === playheadStep
                return (
                  <button
                    key={si}
                    onClick={() => toggleStep(ti, si)}
                    style={{
                      height: 22, borderRadius: 4, cursor: 'pointer', padding: 0,
                      background: active ? AMBER : si % 4 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                      border: isPlayhead ? '1px solid #fff' : active ? `1px solid ${AMBER}` : '1px solid rgba(255,255,255,0.06)',
                      boxShadow: active ? `0 0 6px ${AMBER}88` : 'none',
                      opacity: isPlayhead && !active ? 0.6 : 1,
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* ---- LIBRERÍA DE SAMPLES ---- */}
        <div style={{ fontSize: 10, color: AMBER, letterSpacing: 4, marginBottom: 22 }}>LIBRERÍA DE SAMPLES</div>

        {CATEGORY_ORDER.map(cat => (
          <div key={cat} style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: '#4a6080', marginBottom: 12 }}>{CATEGORY_LABELS[cat]}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              {SAMPLES.filter(s => s.category === cat).map(sample => (
                <div key={sample.id} className="artifact-card" style={{ padding: 16 }}>
                  <div style={{ fontSize: 13, letterSpacing: 1, color: '#fff', marginBottom: 14 }}>{sample.name}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => playPreview(sample)}
                      style={{
                        flex: 1, background: previewing === sample.id ? `${AMBER}22` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${previewing === sample.id ? AMBER : 'rgba(255,255,255,0.15)'}`,
                        color: AMBER, fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '8px 0',
                        borderRadius: 6, cursor: 'pointer', minHeight: 34,
                      }}
                    >
                      ▶ ESCUCHAR
                    </button>
                    <button
                      onClick={() => downloadSampleWav(sample)}
                      style={{
                        flex: 1, background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.3)',
                        color: '#00d4ff', fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '8px 0',
                        borderRadius: 6, cursor: 'pointer', minHeight: 34,
                      }}
                    >
                      ⬇ .WAV
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
