'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { SplendidGrandPiano, Soundfont } from 'smplr'

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
    // Piano/flauta/violin usan muestras reales (via smplr) en vez de sintesis
    // a mano — ningun oscilador armado a mano suena tan natural como una
    // grabacion real de cada instrumento.
    let pianoInst: ReturnType<typeof SplendidGrandPiano> | null = null
    let fluteInst: ReturnType<typeof Soundfont> | null = null
    let violinInst: ReturnType<typeof Soundfont> | null = null
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

      // Pasabajos suave en la salida general: sin esto el conjunto suena
      // demasiado brillante/digital, como si no hubiera aire ni distancia
      // entre la fuente y el oido (lo que da esa sensacion "extraterrestre").
      const masterFilter = ctx.createBiquadFilter()
      masterFilter.type = 'lowpass'
      masterFilter.frequency.value = 7200
      masterFilter.Q.value = 0.4
      masterOut.connect(masterFilter)
      masterFilter.connect(ctx.destination)

      // Reverb sutil con impulso sintetico (sin archivo externo) que le da
      // calidez y espacio al sonido en vez de la sequedad de ir directo al
      // destino. El ruido blanco puro suena metalico/artificial, asi que se
      // filtra con un pasabajos con fuga (los agudos se apagan antes que los
      // graves, como el aire de una sala real absorbiendo altas frecuencias).
      const convolver = ctx.createConvolver()
      const irLen = Math.floor(ctx.sampleRate * 1.6)
      const impulse = ctx.createBuffer(2, irLen, ctx.sampleRate)
      for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch)
        let lp = 0
        for (let i = 0; i < irLen; i++) {
          const white = Math.random() * 2 - 1
          lp += (white - lp) * 0.35
          data[i] = lp * Math.pow(1 - i / irLen, 2.2)
        }
      }
      convolver.buffer = impulse

      reverbSend = ctx.createGain()
      reverbSend.gain.value = 0.3
      const reverbOut = ctx.createGain()
      reverbOut.gain.value = 0.45
      reverbSend.connect(convolver)
      convolver.connect(reverbOut)
      reverbOut.connect(masterOut)

      // Instrumentos muestreados (grabaciones reales, no sintesis) —
      // se conectan al mismo bus maestro para heredar el pasabajos y el
      // reverb. La carga es asincronica y no bloquea: smplr permite tocar
      // notas antes de que termine de cargar todo el set de muestras. Si la
      // red falla (sin conexion, CDN caido), .ready rechaza — se atrapa acá
      // para no dejar un unhandled rejection; la nota simplemente no suena.
      pianoInst = SplendidGrandPiano(ctx, { destination: masterOut })
      fluteInst = Soundfont(ctx, { instrument: 'flute', destination: masterOut })
      violinInst = Soundfont(ctx, { instrument: 'violin', destination: masterOut })
      pianoInst.ready.catch(() => {})
      fluteInst.ready.catch(() => {})
      violinInst.ready.catch(() => {})
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

    const playNote = (instId: number, freq: number, gain: number, startTime: number, duration: number, velocity = 1, pan = 0) => {
      const ctx = audioCtx!
      const inst = INSTRUMENTS[instId]
      const t = startTime
      const dur = Math.max(0.04, duration)
      const finalGain = gain * (0.4 + velocity * 0.6)

      // Piano/flauta/violin: grabaciones reales via smplr en vez de sintesis
      // a mano — ninguna aditiva/filtrada armada a oido suena tan natural
      // como una muestra real de cada instrumento.
      if (inst.type === 'piano' || inst.type === 'flute' || inst.type === 'violin') {
        const midi = Math.round(69 + 12 * Math.log2(freq / 440))
        const vel = Math.max(1, Math.min(127, Math.round(finalGain * 127)))
        const sampled = inst.type === 'piano' ? pianoInst : inst.type === 'flute' ? fluteInst : violinInst
        sampled?.start({ note: midi, velocity: vel, time: t, duration: dur * (inst.type === 'piano' ? 1.6 : 1.1) })
        return
      }

      const g = ctx.createGain()
      const comp = ctx.createDynamicsCompressor()
      const panner = ctx.createStereoPanner()
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), t)
      g.connect(comp); comp.connect(panner); panner.connect(masterOut!)
      g.connect(reverbSend!)

      g.gain.setValueAtTime(0.001, t)
      g.gain.linearRampToValueAtTime(finalGain, t + 0.01)
      g.gain.setValueAtTime(finalGain, t + dur * 0.6)
      g.gain.exponentialRampToValueAtTime(0.001, t + dur)

      // Pasabajos suave para limar los armonicos altos de saw/square, que
      // sin filtrar suenan mas a sirena que a nota musical.
      const osc = ctx.createOscillator()
      osc.type = inst.type as OscillatorType
      osc.frequency.setValueAtTime(freq, t)
      osc.frequency.linearRampToValueAtTime(freq * 0.98, t + dur)
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(Math.min(9000, freq * 6), t)
      filter.Q.value = 0.6
      osc.connect(filter); filter.connect(g)
      osc.start(t); osc.stop(t + dur + 0.01)
    }

    // Convierte los puntos crudos de un trazo (uno por cada muestra del
    // gesto, con el temblor natural de la mano) en una frase melodica
    // limpia: agrupa por ventanas y fusiona los grupos consecutivos que
    // caen en la misma nota cuantizada. Sin esto, un trazo con docenas de
    // puntos disparaba una nota de pocos milisegundos por cada uno —sonaba
    // a flutter/ruido en vez de a frase tocada.
    type NoteGroup = { freq: number; gain: number; pressure: number; x: number; n: number }
    const groupStrokeNotes = (sorted: Point[], groupCount: number): NoteGroup[] => {
      const groups: NoteGroup[] = []
      for (let i = 0; i < groupCount; i++) {
        const from = Math.floor((i / groupCount) * sorted.length)
        const to = Math.max(from + 1, Math.floor(((i + 1) / groupCount) * sorted.length))
        const slice = sorted.slice(from, to)
        if (slice.length === 0) continue
        const freq = yToFreq(slice[Math.floor(slice.length / 2)].y)
        const gain = slice.reduce((a, p) => a + yToGain(p.y), 0) / slice.length
        const pressure = slice.reduce((a, p) => a + p.pressure, 0) / slice.length
        const x = slice.reduce((a, p) => a + p.x, 0) / slice.length
        const prev = groups[groups.length - 1]
        if (prev && Math.abs(prev.freq - freq) < 0.5) {
          prev.gain = (prev.gain * prev.n + gain) / (prev.n + 1)
          prev.pressure = (prev.pressure * prev.n + pressure) / (prev.n + 1)
          prev.x = (prev.x * prev.n + x) / (prev.n + 1)
          prev.n++
        } else {
          groups.push({ freq, gain, pressure, x, n: 1 })
        }
      }
      return groups
    }

    const playStroke = (s: Stroke) => {
      if (!audioCtx || s.points.length < 2) return
      const now = audioCtx.currentTime + 0.05
      const sorted = [...s.points].sort((a, b) => a.x - b.x)
      const totalDur = Math.min(2.2, Math.max(0.5, sorted.length * 0.03))
      const groupCount = Math.max(1, Math.round(totalDur * 6)) // ~6 notas por segundo
      const groups = groupStrokeNotes(sorted, groupCount)
      const noteDur = totalDur / groups.length

      groups.forEach((gr, i) => {
        const tOffset = (i / groups.length) * totalDur
        const pan = (gr.x / drawCanvas.width) * 2 - 1
        playNote(s.inst, gr.freq, gr.gain, now + tOffset, noteDur * 1.5, gr.pressure, pan)
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
        const groupCount = Math.max(1, Math.round(sorted.length / 4))
        const groups = groupStrokeNotes(sorted, groupCount)
        groups.forEach(gr => {
          const tOffset = (gr.x / W) * totalDur
          const pan = (gr.x / W) * 2 - 1
          playNote(s.inst, gr.freq, gr.gain, startTime + tOffset, 0.18, gr.pressure, pan)
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
