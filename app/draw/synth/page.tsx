'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const mono = "'Space Mono', monospace"

type Instrument = { id: number; name: string; color: string; type: OscillatorType | 'noise' | 'fm'; label: string }

const INSTRUMENTS: Instrument[] = [
  { id: 0, name: 'SINE', color: '#00d4ff', type: 'sine', label: 'SINE' },
  { id: 1, name: 'SAW', color: '#ff2d55', type: 'sawtooth', label: 'SAW' },
  { id: 2, name: 'SQR', color: '#ffd60a', type: 'square', label: 'SQUARE' },
  { id: 3, name: 'TRI', color: '#00e5a0', type: 'triangle', label: 'TRI' },
  { id: 4, name: 'NOISE', color: '#bf5af2', type: 'noise', label: 'NOISE' },
  { id: 5, name: 'FM', color: '#ff6b2b', type: 'fm', label: 'FM' },
]

type Point = { x: number; y: number }
type Stroke = { inst: number; color: string; points: Point[] }

export default function DrawSynthPage() {
  const drawCanvasRef = useRef<HTMLCanvasElement>(null)
  const gridCanvasRef = useRef<HTMLCanvasElement>(null)
  const playheadRef = useRef<HTMLDivElement>(null)

  const [selectedInst, setSelectedInst] = useState(0)
  const [pbState, setPbState] = useState<'ready' | 'drawing' | 'playing'>('ready')
  const [strokeCount, setStrokeCount] = useState(0)
  const [noteCount, setNoteCount] = useState(0)

  const selectedInstRef = useRef(0)
  useEffect(() => { selectedInstRef.current = selectedInst }, [selectedInst])

  useEffect(() => {
    const drawCanvas = drawCanvasRef.current!
    const gridCanvas = gridCanvasRef.current!
    const dc = drawCanvas.getContext('2d')!
    const gc = gridCanvas.getContext('2d')!

    let audioCtx: AudioContext | null = null
    let strokes: Stroke[] = []
    let currentStroke: Stroke | null = null
    let isDrawing = false
    let isPlaying = false

    const updateInfo = () => {
      setStrokeCount(strokes.length)
      setNoteCount(strokes.reduce((acc, s) => acc + s.points.length, 0))
    }

    const drawGrid = () => {
      const W = gridCanvas.width, H = gridCanvas.height
      gc.clearRect(0, 0, W, H)

      const freqLines = [0.1, 0.25, 0.5, 0.75, 0.9]
      gc.strokeStyle = 'rgba(255,255,255,0.04)'
      gc.lineWidth = 1
      freqLines.forEach(t => {
        const y = t * H
        gc.beginPath(); gc.moveTo(0, y); gc.lineTo(W, y); gc.stroke()
      })

      for (let i = 1; i < 8; i++) {
        gc.beginPath()
        gc.moveTo(i * W / 8, 0)
        gc.lineTo(i * W / 8, H)
        gc.stroke()
      }

      gc.strokeStyle = 'rgba(255,255,255,0.09)'
      gc.lineWidth = 1
      gc.setLineDash([4, 8])
      gc.beginPath(); gc.moveTo(0, H * 0.5); gc.lineTo(W, H * 0.5); gc.stroke()
      gc.setLineDash([])
    }

    const drawStroke = (s: Stroke) => {
      if (s.points.length < 2) return
      dc.beginPath()
      dc.moveTo(s.points[0].x, s.points[0].y)
      for (let i = 1; i < s.points.length; i++) dc.lineTo(s.points[i].x, s.points[i].y)
      dc.strokeStyle = s.color
      dc.lineWidth = 2.5
      dc.lineCap = 'round'
      dc.lineJoin = 'round'
      dc.shadowColor = s.color
      dc.shadowBlur = 10
      dc.stroke()
      dc.shadowBlur = 0

      dc.fillStyle = s.color
      s.points.forEach((p, i) => {
        if (i % 4 === 0) {
          dc.beginPath()
          dc.arc(p.x, p.y, 1.5, 0, Math.PI * 2)
          dc.fill()
        }
      })
    }

    const redrawAll = () => {
      dc.clearRect(0, 0, drawCanvas.width, drawCanvas.height)
      strokes.forEach(drawStroke)
    }

    const resize = () => {
      drawCanvas.width = window.innerWidth
      drawCanvas.height = window.innerHeight
      gridCanvas.width = window.innerWidth
      gridCanvas.height = window.innerHeight
      drawGrid()
      redrawAll()
    }

    const initAudio = () => {
      if (audioCtx) return
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    // y (0=top=high, H=bottom=low) -> frecuencia, escala logaritmica 80Hz-2400Hz
    const yToFreq = (y: number) => {
      const H = drawCanvas.height
      const t = 1 - y / H
      const minF = 80, maxF = 2400
      return minF * Math.pow(maxF / minF, t)
    }

    const yToGain = (y: number) => {
      const H = drawCanvas.height
      const t = 1 - y / H
      return 0.15 + t * 0.55
    }

    const noiseBuffer = () => {
      const ctx = audioCtx!
      const sz = ctx.sampleRate * 0.15
      const buf = ctx.createBuffer(1, sz, ctx.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1
      return buf
    }

    const playNote = (instId: number, freq: number, gain: number, startTime: number, duration: number) => {
      const ctx = audioCtx!
      const inst = INSTRUMENTS[instId]
      const g = ctx.createGain()
      const comp = ctx.createDynamicsCompressor()
      g.connect(comp); comp.connect(ctx.destination)

      const t = startTime
      const dur = Math.max(0.04, duration)

      g.gain.setValueAtTime(0.001, t)
      g.gain.linearRampToValueAtTime(gain, t + 0.01)
      g.gain.setValueAtTime(gain, t + dur * 0.6)
      g.gain.exponentialRampToValueAtTime(0.001, t + dur)

      if (inst.type === 'noise') {
        const n = ctx.createBufferSource()
        n.buffer = noiseBuffer()
        const bp = ctx.createBiquadFilter()
        bp.type = 'bandpass'
        bp.frequency.setValueAtTime(freq, t)
        bp.Q.value = 3
        n.connect(bp); bp.connect(g)
        n.start(t); n.stop(t + dur + 0.01)
      } else if (inst.type === 'fm') {
        const carrier = ctx.createOscillator()
        const modulator = ctx.createOscillator()
        const modGain = ctx.createGain()
        carrier.type = 'sine'
        modulator.type = 'sine'
        carrier.frequency.setValueAtTime(freq, t)
        modulator.frequency.setValueAtTime(freq * 2.5, t)
        modGain.gain.setValueAtTime(freq * 1.5, t)
        modulator.connect(modGain)
        modGain.connect(carrier.frequency)
        carrier.connect(g)
        carrier.start(t); carrier.stop(t + dur + 0.01)
        modulator.start(t); modulator.stop(t + dur + 0.01)
      } else {
        const osc = ctx.createOscillator()
        osc.type = inst.type
        osc.frequency.setValueAtTime(freq, t)
        osc.frequency.linearRampToValueAtTime(freq * 0.98, t + dur)
        osc.connect(g)
        osc.start(t); osc.stop(t + dur + 0.01)
      }
    }

    const playStroke = (s: Stroke) => {
      if (!audioCtx || s.points.length < 2) return
      const now = audioCtx.currentTime + 0.05
      const sorted = [...s.points].sort((a, b) => a.x - b.x)
      const totalDur = Math.min(1.8, Math.max(0.4, sorted.length * 0.025))
      const noteDur = totalDur / sorted.length

      sorted.forEach((p, i) => {
        const tOffset = (i / sorted.length) * totalDur
        playNote(s.inst, yToFreq(p.y), yToGain(p.y), now + tOffset, noteDur * 1.6)
      })
    }

    const playAll = () => {
      if (strokes.length === 0 || isPlaying) return
      initAudio()
      isPlaying = true
      setPbState('playing')

      const W = drawCanvas.width
      const playhead = playheadRef.current!
      playhead.style.display = 'block'

      const totalDur = 2.5
      const startTime = audioCtx!.currentTime + 0.05

      strokes.forEach(s => {
        if (s.points.length < 1) return
        const sorted = [...s.points].sort((a, b) => a.x - b.x)
        const noteDur = 0.12
        sorted.forEach(p => {
          const tOffset = (p.x / W) * totalDur
          playNote(s.inst, yToFreq(p.y), yToGain(p.y), startTime + tOffset, noteDur)
        })
      })

      const startMs = performance.now()
      const totalMs = totalDur * 1000
      const animPlayhead = () => {
        const elapsed = performance.now() - startMs
        const t = Math.min(1, elapsed / totalMs)
        playhead.style.left = t * W + 'px'
        if (t < 1) requestAnimationFrame(animPlayhead)
        else {
          playhead.style.display = 'none'
          isPlaying = false
          setPbState('ready')
        }
      }
      requestAnimationFrame(animPlayhead)
    }

    const getPos = (e: MouseEvent | TouchEvent): Point => {
      const r = drawCanvas.getBoundingClientRect()
      if ('touches' in e) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }
      return { x: (e as MouseEvent).clientX - r.left, y: (e as MouseEvent).clientY - r.top }
    }

    const startDraw = (e: MouseEvent | TouchEvent) => {
      if (isPlaying) return
      e.preventDefault()
      initAudio()
      isDrawing = true
      const pos = getPos(e)
      const inst = INSTRUMENTS[selectedInstRef.current]
      currentStroke = { inst: selectedInstRef.current, color: inst.color, points: [pos] }
      setPbState('drawing')
      dc.beginPath()
      dc.moveTo(pos.x, pos.y)
    }

    const moveDraw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing || !currentStroke) return
      e.preventDefault()
      const pos = getPos(e)
      currentStroke.points.push(pos)

      dc.lineTo(pos.x, pos.y)
      dc.strokeStyle = currentStroke.color
      dc.lineWidth = 2.5
      dc.lineCap = 'round'
      dc.lineJoin = 'round'
      dc.shadowColor = currentStroke.color
      dc.shadowBlur = 8
      dc.stroke()
      dc.beginPath()
      dc.moveTo(pos.x, pos.y)
    }

    const endDraw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return
      e.preventDefault()
      isDrawing = false
      dc.shadowBlur = 0

      if (currentStroke && currentStroke.points.length > 1) {
        const pts = currentStroke.points
        const maxNotes = 80
        const step = Math.max(1, Math.floor(pts.length / maxNotes))
        const sampled: Point[] = []
        for (let i = 0; i < pts.length; i += step) sampled.push(pts[i])
        currentStroke.points = sampled

        strokes.push(currentStroke)
        updateInfo()
        playStroke(currentStroke)
      }
      currentStroke = null
      setPbState('ready')
    }

    drawCanvas.addEventListener('mousedown', startDraw)
    drawCanvas.addEventListener('mousemove', moveDraw)
    drawCanvas.addEventListener('mouseup', endDraw)
    drawCanvas.addEventListener('touchstart', startDraw, { passive: false })
    drawCanvas.addEventListener('touchmove', moveDraw, { passive: false })
    drawCanvas.addEventListener('touchend', endDraw, { passive: false })
    window.addEventListener('resize', resize)
    resize()

    ;(drawCanvas as any)._clearAll = () => {
      strokes = []
      dc.clearRect(0, 0, drawCanvas.width, drawCanvas.height)
      updateInfo()
      setPbState('ready')
    }
    ;(drawCanvas as any)._playAll = playAll

    return () => {
      drawCanvas.removeEventListener('mousedown', startDraw)
      drawCanvas.removeEventListener('mousemove', moveDraw)
      drawCanvas.removeEventListener('mouseup', endDraw)
      drawCanvas.removeEventListener('touchstart', startDraw)
      drawCanvas.removeEventListener('touchmove', moveDraw)
      drawCanvas.removeEventListener('touchend', endDraw)
      window.removeEventListener('resize', resize)
      audioCtx?.close()
    }
  }, [])

  const clearAll = () => (drawCanvasRef.current as any)?._clearAll?.()
  const playAll = () => (drawCanvasRef.current as any)?._playAll?.()

  const dotColor = pbState === 'playing' ? '#00e5a0' : pbState === 'drawing' ? '#00d4ff' : '#8892a4'
  const dotGlow = pbState === 'ready' ? 'none' : `0 0 8px ${dotColor}`

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#07070d', overflow: 'hidden', touchAction: 'none' }}>
      <canvas ref={gridCanvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 }} />
      <canvas ref={drawCanvasRef} style={{ position: 'fixed', inset: 0, cursor: 'crosshair', touchAction: 'none' }} />
      <div ref={playheadRef} style={{
        position: 'fixed', top: 0, bottom: 0, width: 1, background: 'rgba(0,212,255,0.6)',
        boxShadow: '0 0 8px #00d4ff', pointerEvents: 'none', zIndex: 5, display: 'none', left: 0,
      }} />

      {/* Header */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10, height: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px',
        background: 'rgba(5, 10, 20, 0.8)', borderBottom: '1px solid rgba(0, 212, 255, 0.4)', backdropFilter: 'blur(5px)',
      }}>
        <span style={{ fontFamily: mono, fontSize: 12, letterSpacing: 2, color: '#00d4ff' }}>
          NEOPROXY // R&D // SIGNAL_SYNTH
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: mono, fontSize: 9, letterSpacing: 2, color: '#8892a4' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, boxShadow: dotGlow, display: 'inline-block' }} />
            {pbState === 'playing' ? 'PLAYING' : pbState === 'drawing' ? 'DRAWING' : 'READY'}
          </div>
          <Link href="/" style={{ color: '#00d4ff', textDecoration: 'none', fontSize: 10, border: '1px solid rgba(0,212,255,0.4)', padding: '2px 8px', fontFamily: mono }}>
            EXIT_PROTOCOL
          </Link>
        </div>
      </div>

      {/* Ruler */}
      <div style={{
        position: 'fixed', left: 0, top: 44, bottom: 64, width: 28, zIndex: 9,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px 0', pointerEvents: 'none',
      }}>
        {['HI', '—', 'MID', '—', 'LO'].map((l, i) => (
          <div key={i} style={{ fontFamily: mono, fontSize: 7, color: '#8892a4', textAlign: 'right', paddingRight: 4, letterSpacing: 1 }}>{l}</div>
        ))}
      </div>

      {/* Instrument palette */}
      <div style={{
        position: 'fixed', bottom: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
        display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(14,14,26,0.92)',
        border: '1px solid rgba(255,255,255,0.07)', borderRadius: 50, padding: '8px 14px', backdropFilter: 'blur(12px)',
      }}>
        {INSTRUMENTS.map(inst => (
          <button
            key={inst.id}
            onClick={() => setSelectedInst(inst.id)}
            title={inst.label}
            style={{
              width: 36, height: 36, borderRadius: '50%', background: inst.color, cursor: 'pointer',
              border: selectedInst === inst.id ? '2px solid #fff' : '2px solid transparent',
              transform: selectedInst === inst.id ? 'scale(1.15)' : 'scale(1)',
              boxShadow: selectedInst === inst.id ? `0 0 12px ${inst.color}` : 'none',
              transition: 'transform 0.1s, border-color 0.15s', flexShrink: 0,
            }}
          />
        ))}
      </div>

      {/* Controls (right edge separado del widget de Chat global, ver bottomRight fix en ARCombatSystem) */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 110px 16px 18px',
        background: 'linear-gradient(0deg, rgba(7,7,13,0.97) 0%, transparent 100%)',
      }}>
        <button onClick={clearAll} style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,45,85,0.3)', borderRadius: 8,
          color: '#ff2d55', fontFamily: mono, fontSize: 9, fontWeight: 600, letterSpacing: 2, padding: '8px 14px',
          cursor: 'pointer', minHeight: 40,
        }}>
          CLR
        </button>
        <div style={{ fontFamily: mono, fontSize: 9, color: '#8892a4', letterSpacing: 1, textAlign: 'center', lineHeight: 1.6 }}>
          <span style={{ color: '#dde3f0', fontWeight: 600 }}>{strokeCount}</span> TRAZOS<br />
          <span style={{ color: '#dde3f0', fontWeight: 600 }}>{noteCount}</span> NOTAS
        </div>
        <button onClick={playAll} style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 8,
          color: '#00d4ff', fontFamily: mono, fontSize: 9, fontWeight: 600, letterSpacing: 2, padding: '8px 14px',
          cursor: 'pointer', minHeight: 40,
        }}>
          ▶ PLAY
        </button>
      </div>
    </div>
  )
}
