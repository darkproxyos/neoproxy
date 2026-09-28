'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const mono = "'Space Mono', monospace"

type Instrument = { id: number; name: string; color: string; type: OscillatorType | 'piano' | 'flute' | 'violin'; label: string }

const INSTRUMENTS: Instrument[] = [
  { id: 0, name: 'PIANO', color: '#ffd9a0', type: 'piano', label: 'PIANO' },
  { id: 1, name: 'SINE', color: '#00d4ff', type: 'sine', label: 'SINE' },
  { id: 2, name: 'SAW', color: '#ff2d55', type: 'sawtooth', label: 'SAW' },
  { id: 3, name: 'SQR', color: '#ffd60a', type: 'square', label: 'SQUARE' },
  { id: 4, name: 'TRI', color: '#00e5a0', type: 'triangle', label: 'TRI' },
  { id: 5, name: 'FLUTE', color: '#d9f2ff', type: 'flute', label: 'FLAUTA' },
  { id: 6, name: 'VIOLIN', color: '#c97a3d', type: 'violin', label: 'VIOLÍN' },
]

// Diametro del trazo por presion (lapiz optico real, o velocidad como proxy
// de presion en dedo/mouse — mas lento = mas grueso, como un aerografo).
const MIN_WIDTH = 1.5
const MAX_WIDTH = 13
const widthFromPressure = (p: number) => MIN_WIDTH + p * (MAX_WIDTH - MIN_WIDTH)

// Escala pentatonica mayor (semitonos desde la raiz) — cualquier trazo cae
// en una nota de esta escala, asi que dos alturas cualquiera siempre suenan
// bien juntas en vez de un barrido continuo tipo sirena. El tono elegido por
// el usuario transpone esta raiz (Do = sin transponer).
const NOTE_NAMES = ['DO', 'DO#', 'RE', 'RE#', 'MI', 'FA', 'FA#', 'SOL', 'SOL#', 'LA', 'LA#', 'SI']
const BASE_ROOT_FREQ = 130.81 // C3
const SCALE_INTERVALS = [0, 2, 4, 7, 9]

type Point = { x: number; y: number; pressure: number }
type Stroke = { inst: number; color: string; sizeMult: number; points: Point[] }

export default function DrawSynthPage() {
  const drawCanvasRef = useRef<HTMLCanvasElement>(null)
  const gridCanvasRef = useRef<HTMLCanvasElement>(null)
  const playheadRef = useRef<HTMLDivElement>(null)

  const [selectedInst, setSelectedInst] = useState(0)
  const [selectedNote, setSelectedNote] = useState(0)
  const [selectedColor, setSelectedColor] = useState(INSTRUMENTS[0].color)
  const [brushSize, setBrushSize] = useState(1)
  const [showTune, setShowTune] = useState(false)
  const [pbState, setPbState] = useState<'ready' | 'drawing' | 'playing'>('ready')
  const [strokeCount, setStrokeCount] = useState(0)
  const [noteCount, setNoteCount] = useState(0)

  const selectedInstRef = useRef(0)
  const selectedNoteRef = useRef(0)
  const selectedColorRef = useRef(INSTRUMENTS[0].color)
  const brushSizeRef = useRef(1)
  useEffect(() => { selectedInstRef.current = selectedInst }, [selectedInst])
  useEffect(() => { selectedNoteRef.current = selectedNote }, [selectedNote])
  useEffect(() => { selectedColorRef.current = selectedColor }, [selectedColor])
  useEffect(() => { brushSizeRef.current = brushSize }, [brushSize])

  const selectInstrument = (id: number) => {
    setSelectedInst(id)
    setSelectedColor(INSTRUMENTS[id].color)
  }

  useEffect(() => {
    const drawCanvas = drawCanvasRef.current!
    const gridCanvas = gridCanvasRef.current!
    const dc = drawCanvas.getContext('2d')!
    const gc = gridCanvas.getContext('2d')!

    let audioCtx: AudioContext | null = null
    let masterOut: GainNode | null = null
    let reverbSend: GainNode | null = null
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

    // Aerografo: nube de particulas semitransparentes de radio y densidad
    // variable, como una lata de spray, en vez de una linea solida de ancho
    // fijo — mas presion = nube mas ancha y mas densa.
    const spatter = (x: number, y: number, pressure: number, sizeMult: number, color: string) => {
      const radius = widthFromPressure(pressure) * sizeMult
      const density = 5 + Math.round(pressure * 9)
      dc.fillStyle = color
      for (let j = 0; j < density; j++) {
        const angle = Math.random() * Math.PI * 2
        const dist = Math.sqrt(Math.random()) * radius
        const r = 0.5 + Math.random() * 1.6
        dc.globalAlpha = 0.1 + Math.random() * 0.3
        dc.beginPath()
        dc.arc(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, r, 0, Math.PI * 2)
        dc.fill()
      }
      dc.globalAlpha = 1
    }

    // Aerografa una pasada continua entre dos puntos (interpolando cada ~4px)
    // para que el spray no deje huecos aunque el gesto se mueva rapido.
    const spraySegment = (a: Point, b: Point, color: string, sizeMult: number) => {
      const dist = Math.hypot(b.x - a.x, b.y - a.y)
      const steps = Math.max(1, Math.round(dist / 4))
      for (let s = 0; s <= steps; s++) {
        const t = s / steps
        spatter(
          a.x + (b.x - a.x) * t,
          a.y + (b.y - a.y) * t,
          a.pressure + (b.pressure - a.pressure) * t,
          sizeMult,
          color,
        )
      }
    }

    const drawStroke = (s: Stroke) => {
      if (s.points.length < 2) return
      dc.shadowColor = s.color
      dc.shadowBlur = 4
      for (let i = 1; i < s.points.length; i++) {
        spraySegment(s.points[i - 1], s.points[i], s.color, s.sizeMult)
      }
      dc.shadowBlur = 0
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
      const ctx = audioCtx

      masterOut = ctx.createGain()
      masterOut.gain.value = 0.9
      masterOut.connect(ctx.destination)

      // Reverb sutil con impulso sintetico (sin archivo externo) que le da
      // calidez y espacio al sonido en vez de la sequedad de ir directo al
      // destino — la diferencia entre sonar "de laboratorio" o agradable.
      const convolver = ctx.createConvolver()
      const irLen = Math.floor(ctx.sampleRate * 1.6)
      const impulse = ctx.createBuffer(2, irLen, ctx.sampleRate)
      for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch)
        for (let i = 0; i < irLen; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.2)
      }
      convolver.buffer = impulse

      reverbSend = ctx.createGain()
      reverbSend.gain.value = 0.3
      const reverbOut = ctx.createGain()
      reverbOut.gain.value = 0.45
      reverbSend.connect(convolver)
      convolver.connect(reverbOut)
      reverbOut.connect(masterOut)
    }

    // y (0=top=high, H=bottom=low) -> frecuencia, escala logaritmica 80Hz-2400Hz,
    // cuantizada a la pentatonica mayor (transpuesta al tono elegido) para
    // que cualquier trazo suene melodico
    const yToFreq = (y: number) => {
      const H = drawCanvas.height
      const t = 1 - y / H
      const minF = 80, maxF = 2400
      const rawFreq = minF * Math.pow(maxF / minF, t)
      const rootFreq = BASE_ROOT_FREQ * Math.pow(2, selectedNoteRef.current / 12)

      const semitones = 12 * Math.log2(rawFreq / rootFreq)
      const octave = Math.floor(semitones / 12)
      const remainder = semitones - octave * 12
      let closest = SCALE_INTERVALS[0]
      let minDiff = Infinity
      for (const interval of SCALE_INTERVALS) {
        const diff = Math.abs(remainder - interval)
        if (diff < minDiff) { minDiff = diff; closest = interval }
      }
      return rootFreq * Math.pow(2, (octave * 12 + closest) / 12)
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

    const playNote = (instId: number, freq: number, gain: number, startTime: number, duration: number, velocity = 1, pan = 0) => {
      const ctx = audioCtx!
      const inst = INSTRUMENTS[instId]
      const g = ctx.createGain()
      const comp = ctx.createDynamicsCompressor()
      const panner = ctx.createStereoPanner()
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), startTime)
      g.connect(comp); comp.connect(panner); panner.connect(masterOut!)
      g.connect(reverbSend!)

      const t = startTime
      const dur = Math.max(0.04, duration)
      const finalGain = gain * (0.4 + velocity * 0.6)

      if (inst.type === 'piano') {
        // Sintesis aditiva (fundamental + armonicos con amplitud decreciente,
        // como las cuerdas de un piano) + envolvente percusiva sin sustain:
        // ataque rapido, decaimiento natural, nada de "pad" sostenido.
        const pianoDur = dur * 1.4
        g.gain.setValueAtTime(0.0001, t)
        g.gain.linearRampToValueAtTime(finalGain, t + 0.006)
        g.gain.exponentialRampToValueAtTime(0.0001, t + pianoDur)

        // Inarmonicidad tipica de una cuerda real (los armonicos se estiran
        // levemente hacia agudo cuanto mas alto el orden) en vez de multiplos
        // exactos, que es lo que hace sonar "digital" a una aditiva pura.
        const B = 0.0004
        const harmonics = [1, 2, 3, 4, 5, 6]
        const amps = [1, 0.55, 0.3, 0.18, 0.1, 0.05]
        harmonics.forEach((h, i) => {
          const stretched = h * Math.sqrt(1 + B * h * h)
          const osc = ctx.createOscillator()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq * stretched, t)
          const hg = ctx.createGain()
          hg.gain.setValueAtTime(amps[i], t)
          osc.connect(hg)
          hg.connect(g)
          osc.start(t)
          osc.stop(t + pianoDur + 0.05)
        })

        // Golpe del martillo: un chasquido brevisimo de ruido filtrado en
        // el ataque, que es lo que distingue a una cuerda percutida de un
        // tono puro.
        const hammer = ctx.createBufferSource()
        hammer.buffer = noiseBuffer()
        const hammerFilter = ctx.createBiquadFilter()
        hammerFilter.type = 'highpass'
        hammerFilter.frequency.setValueAtTime(freq * 3, t)
        const hammerGain = ctx.createGain()
        hammerGain.gain.setValueAtTime(0.15, t)
        hammerGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02)
        hammer.connect(hammerFilter); hammerFilter.connect(hammerGain); hammerGain.connect(g)
        hammer.start(t); hammer.stop(t + 0.03)
        return
      }

      // Ataque mas lento para flauta/violin (el aire o el arco tardan un
      // poco en poner la nota en marcha) que para las ondas electronicas.
      const attackTime = inst.type === 'flute' ? 0.05 : inst.type === 'violin' ? 0.07 : 0.01
      g.gain.setValueAtTime(0.001, t)
      g.gain.linearRampToValueAtTime(finalGain, t + attackTime)
      g.gain.setValueAtTime(finalGain, t + dur * 0.6)
      g.gain.exponentialRampToValueAtTime(0.001, t + dur)

      if (inst.type === 'flute') {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, t)

        // Vibrato sutil, como el temblor natural del aire soplado.
        const vibrato = ctx.createOscillator()
        vibrato.type = 'sine'
        vibrato.frequency.setValueAtTime(5.5, t)
        const vibratoGain = ctx.createGain()
        vibratoGain.gain.setValueAtTime(freq * 0.008, t)
        vibrato.connect(vibratoGain); vibratoGain.connect(osc.frequency)
        vibrato.start(t); vibrato.stop(t + dur + 0.05)

        // Soplido: ruido filtrado muy suave para dar textura de aire.
        const breath = ctx.createBufferSource()
        breath.buffer = noiseBuffer()
        breath.loop = true
        const breathFilter = ctx.createBiquadFilter()
        breathFilter.type = 'bandpass'
        breathFilter.frequency.setValueAtTime(freq * 2, t)
        breathFilter.Q.value = 1.2
        const breathGain = ctx.createGain()
        breathGain.gain.setValueAtTime(0.05, t)
        breath.connect(breathFilter); breathFilter.connect(breathGain); breathGain.connect(g)
        breath.start(t); breath.stop(t + dur + 0.01)

        osc.connect(g)
        osc.start(t); osc.stop(t + dur + 0.01)
      } else if (inst.type === 'violin') {
        const osc = ctx.createOscillator()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(freq, t)

        // Vibrato mas marcado que el de la flauta, como el de un arco sobre
        // la cuerda, y entra un instante despues del ataque del arco.
        const vibrato = ctx.createOscillator()
        vibrato.type = 'sine'
        vibrato.frequency.setValueAtTime(5, t)
        const vibratoGain = ctx.createGain()
        vibratoGain.gain.setValueAtTime(freq * 0.012, t)
        vibrato.connect(vibratoGain); vibratoGain.connect(osc.frequency)
        vibrato.start(t + 0.06); vibrato.stop(t + dur + 0.05)

        // Filtro que suaviza el aserrado del sawtooth y simula el cuerpo
        // resonante del instrumento.
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(freq * 4, t)
        filter.Q.value = 1

        osc.connect(filter); filter.connect(g)
        osc.start(t); osc.stop(t + dur + 0.01)
      } else {
        // Pasabajos suave para limar los armonicos altos de saw/square, que
        // sin filtrar suenan mas a sirena que a nota musical.
        const osc = ctx.createOscillator()
        osc.type = inst.type
        osc.frequency.setValueAtTime(freq, t)
        osc.frequency.linearRampToValueAtTime(freq * 0.98, t + dur)
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(Math.min(9000, freq * 6), t)
        filter.Q.value = 0.6
        osc.connect(filter); filter.connect(g)
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
        const pan = (p.x / drawCanvas.width) * 2 - 1
        playNote(s.inst, yToFreq(p.y), yToGain(p.y), now + tOffset, noteDur * 1.6, p.pressure, pan)
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
          const pan = (p.x / W) * 2 - 1
          playNote(s.inst, yToFreq(p.y), yToGain(p.y), startTime + tOffset, noteDur, p.pressure, pan)
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

    const getPos = (e: PointerEvent) => {
      const r = drawCanvas.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }

    // Presion real del lapiz optico si esta disponible; para dedo/mouse (que
    // no reportan presion util) se deriva de la velocidad del trazo: mas
    // lento = mas presion, como un aerografo digital.
    let lastMoveTime = 0
    let lastMoveX = 0
    let lastMoveY = 0
    const MAX_SPEED = 1.5 // px/ms de referencia para saturar la presion minima

    const computePressure = (e: PointerEvent, x: number, y: number) => {
      if (e.pointerType === 'pen' && e.pressure > 0) return e.pressure
      const now = performance.now()
      const dt = Math.max(1, now - lastMoveTime)
      const dist = Math.hypot(x - lastMoveX, y - lastMoveY)
      const speed = dist / dt
      lastMoveTime = now
      lastMoveX = x
      lastMoveY = y
      const norm = Math.min(1, speed / MAX_SPEED)
      return 1 - norm * 0.75
    }

    const startDraw = (e: PointerEvent) => {
      if (isPlaying) return
      e.preventDefault()
      initAudio()
      isDrawing = true
      drawCanvas.setPointerCapture(e.pointerId)
      const pos = getPos(e)
      lastMoveTime = performance.now()
      lastMoveX = pos.x
      lastMoveY = pos.y
      const pressure = e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : 0.5
      currentStroke = {
        inst: selectedInstRef.current, color: selectedColorRef.current, sizeMult: brushSizeRef.current,
        points: [{ ...pos, pressure }],
      }
      setPbState('drawing')
    }

    const moveDraw = (e: PointerEvent) => {
      if (!isDrawing || !currentStroke) return
      e.preventDefault()
      const pos = getPos(e)
      const pressure = computePressure(e, pos.x, pos.y)
      const prev = currentStroke.points[currentStroke.points.length - 1]
      const point: Point = { ...pos, pressure }
      currentStroke.points.push(point)

      dc.shadowColor = currentStroke.color
      dc.shadowBlur = 4
      spraySegment(prev, point, currentStroke.color, currentStroke.sizeMult)
      dc.shadowBlur = 0
    }

    const endDraw = (e: PointerEvent) => {
      if (!isDrawing) return
      e.preventDefault()
      isDrawing = false
      dc.shadowBlur = 0
      if (drawCanvas.hasPointerCapture(e.pointerId)) drawCanvas.releasePointerCapture(e.pointerId)

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

    drawCanvas.addEventListener('pointerdown', startDraw)
    drawCanvas.addEventListener('pointermove', moveDraw)
    drawCanvas.addEventListener('pointerup', endDraw)
    drawCanvas.addEventListener('pointercancel', endDraw)
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
      drawCanvas.removeEventListener('pointerdown', startDraw)
      drawCanvas.removeEventListener('pointermove', moveDraw)
      drawCanvas.removeEventListener('pointerup', endDraw)
      drawCanvas.removeEventListener('pointercancel', endDraw)
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

      {/* Panel de ajustes: tono, color y diametro de pincel */}
      {showTune && (
        <div style={{
          position: 'fixed', bottom: 132, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
          display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(14,14,26,0.95)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 18px',
          backdropFilter: 'blur(12px)', width: 260,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: '#8892a4', width: 54, flexShrink: 0 }}>TONO</span>
            <select
              value={selectedNote}
              onChange={e => setSelectedNote(Number(e.target.value))}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,212,255,0.3)',
                color: '#00d4ff', fontFamily: mono, fontSize: 11, letterSpacing: 1, padding: '6px 8px',
                borderRadius: 6, minHeight: 32,
              }}
            >
              {NOTE_NAMES.map((n, i) => <option key={n} value={i}>{n}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: '#8892a4', width: 54, flexShrink: 0 }}>COLOR</span>
            <input
              type="color"
              value={selectedColor}
              onChange={e => setSelectedColor(e.target.value)}
              style={{ width: 44, height: 32, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
            />
            <span style={{ fontFamily: mono, fontSize: 9, color: selectedColor, letterSpacing: 1 }}>{selectedColor.toUpperCase()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: '#8892a4', width: 54, flexShrink: 0 }}>PINCEL</span>
            <input
              type="range" min={0.5} max={2.5} step={0.1} value={brushSize}
              onChange={e => setBrushSize(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#00d4ff' }}
            />
            <span style={{ fontFamily: mono, fontSize: 9, color: '#00d4ff', width: 28, textAlign: 'right', flexShrink: 0 }}>
              {brushSize.toFixed(1)}x
            </span>
          </div>
        </div>
      )}

      {/* Instrument palette */}
      <div style={{
        position: 'fixed', bottom: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(14,14,26,0.92)',
          border: '1px solid rgba(255,255,255,0.07)', borderRadius: 50, padding: '8px 14px', backdropFilter: 'blur(12px)',
        }}>
          {INSTRUMENTS.map(inst => (
            <button
              key={inst.id}
              onClick={() => selectInstrument(inst.id)}
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
        <button
          onClick={() => setShowTune(v => !v)}
          title="Ajustes de tono, color y pincel"
          style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0, cursor: 'pointer', fontSize: 15,
            background: showTune ? 'rgba(0,212,255,0.25)' : 'rgba(14,14,26,0.92)',
            border: `1px solid ${showTune ? '#00d4ff' : 'rgba(255,255,255,0.15)'}`,
            color: '#00d4ff', backdropFilter: 'blur(12px)',
          }}
        >
          ⚙
        </button>
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
