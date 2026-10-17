'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ModeId, MODE_LIST, NeoCamState, AuraColor, Scratch, createScratch, renderMode,
  fadeForTrails, updateAndDrawGhost, drawHud, drawSignalLost, FrameCtx,
} from './engine/modes'
import { MaskStyle, drawFaceMask } from './engine/masks'
import {
  createFaceLandmarker, createSegmenter, createHandLandmarker,
  faceBoxFromLandmarks, fingertipsFromHands, FaceBox, HandPoint,
} from './engine/vision'
import { buildMaskCanvas, MaskCache, clamp } from './engine/core'
import { CubeField, HandGame } from './engine/game'
import { matchAgentFromCanvas, matchAgentFromRgb, dominantColor, averageRgb } from './engine/portrait'
import type { ProxyAgent } from '@/components/proxyverse/agents'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'
const RED = '#ff2d55'

type Fit = 'blur' | 'crop' | 'pad'
type Rot = 0 | 90 | 180 | 270
type PageState = NeoCamState & { faceMaskOn: boolean; faceMaskStyle: MaskStyle; fit: Fit; rot: Rot; cubes: boolean; game: boolean }

const DEFAULT_STATE: PageState = {
  mode: 'neon', pal: 'inferno', blur: 10, irBlur: 14, irMotion: true,
  silInt: 0.85, bodyBands: 4, auraColor: 'ki',
  hud: true, trails: false, mirror: true, auto: false, autoSec: 12,
  ghost: false, ghostDecay: 0.1, audio: false, audioGain: 1.2,
  energy: false, energyGain: 1, failsafe: false,
  faceMaskOn: false, faceMaskStyle: 'soft',
  fit: 'crop', rot: 0, cubes: false, game: false,
}

type Status = 'idle' | 'loading' | 'requesting-camera' | 'running' | 'error'

const PAL_OPTIONS: { id: PageState['pal']; label: string }[] = [
  { id: 'inferno', label: 'INFERNO' }, { id: 'jet', label: 'JET' }, { id: 'hot', label: 'HOT' }, { id: 'plasma', label: 'PLASMA' },
]
const AURA_OPTIONS: { id: AuraColor; label: string; color: string }[] = [
  { id: 'ki', label: 'KI', color: '#ffd23c' }, { id: 'chakra', label: 'CHAKRA', color: '#28a0ff' },
  { id: 'nen', label: 'NEN', color: '#aa32ff' }, { id: 'rojo', label: 'ROJO', color: '#ff2828' }, { id: 'verde', label: 'VERDE', color: '#3cff78' },
]
const MASK_OPTIONS: { id: MaskStyle; label: string }[] = [
  { id: 'soft', label: 'SOFT' }, { id: 'pixel', label: 'PIXEL' }, { id: 'block', label: 'BLOCK' }, { id: 'blur', label: 'BLUR' }, { id: 'glyph', label: 'GLYPH' },
]

export default function NeoCamPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blurBgCanvasRef = useRef<HTMLCanvasElement>(null)

  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [state, setState] = useState<PageState>(DEFAULT_STATE)
  const [panelOpen, setPanelOpen] = useState(true)
  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  const [multiCamera, setMultiCamera] = useState(false)
  const [fps, setFps] = useState(0)
  const [faceSeen, setFaceSeen] = useState(false)
  const [energyPct, setEnergyPct] = useState(0)
  const [gameScore, setGameScore] = useState(0)
  const [gameCombo, setGameCombo] = useState(1)
  const [roundTimeLeft, setRoundTimeLeft] = useState<number | null>(null)
  const [lastRoundScore, setLastRoundScore] = useState<number | null>(null)
  type PortraitResult = { kind: 'image' | 'video'; url: string; agent: ProxyAgent; affinity: number }
  const [portrait, setPortrait] = useState<PortraitResult | null>(null)
  const [recording, setRecording] = useState(false)
  const [recordProgress, setRecordProgress] = useState(0)
  const recordStopTimerRef = useRef<number | null>(null)

  const RECORD_MS = 3500

  const closePortrait = () => {
    if (portrait?.url.startsWith('blob:')) URL.revokeObjectURL(portrait.url)
    setPortrait(null)
  }

  const captureProxyversePortrait = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { agent, affinity } = matchAgentFromCanvas(canvas)
    const url = canvas.toDataURL('image/jpeg', 0.88)
    setPortrait({ kind: 'image', url, agent, affinity })
  }

  const pickSupportedMimeType = () => {
    const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
    for (const c of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c
    }
    return 'video/webm'
  }

  const recordRitualPortrait = () => {
    const canvas = canvasRef.current
    if (!canvas || recording) return
    if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) {
      console.error('Este navegador no soporta grabar el retrato en video (MediaRecorder/captureStream).')
      return
    }
    const stream = canvas.captureStream(30)
    const mimeType = pickSupportedMimeType()
    const recorder = new MediaRecorder(stream, { mimeType })
    const chunks: Blob[] = []
    const colorSamples: [number, number, number][] = []

    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
    recorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop())
      const blob = new Blob(chunks, { type: mimeType })
      const url = URL.createObjectURL(blob)
      const { agent, affinity } = matchAgentFromRgb(averageRgb(colorSamples))
      setPortrait({ kind: 'video', url, agent, affinity })
      setRecording(false)
      setRecordProgress(0)
    }

    recorder.start()
    setRecording(true)
    setRecordProgress(0)
    const startedAt = performance.now()
    const sampleTimer = window.setInterval(() => colorSamples.push(dominantColor(canvas)), 250)
    const progressTimer = window.setInterval(() => {
      setRecordProgress(Math.min(1, (performance.now() - startedAt) / RECORD_MS))
    }, 100)
    recordStopTimerRef.current = window.setTimeout(() => {
      recorder.stop()
      window.clearInterval(sampleTimer)
      window.clearInterval(progressTimer)
    }, RECORD_MS)
  }

  const downloadPortrait = () => {
    if (!portrait) return
    const a = document.createElement('a')
    a.href = portrait.url
    a.download = portrait.kind === 'video' ? `neoproxy-retrato-${portrait.agent.id}.webm` : `neoproxy-retrato-${portrait.agent.id}.jpg`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  const streamRef = useRef<MediaStream | null>(null)
  const facingRef = useRef<'user' | 'environment'>('user')
  const videoDevicesRef = useRef<MediaDeviceInfo[]>([])
  const deviceIndexRef = useRef(0)
  const micStreamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioDataRef = useRef<Uint8Array | null>(null)

  const faceLandmarkerRef = useRef<any>(null)
  const segmenterRef = useRef<any>(null)
  const handLandmarkerRef = useRef<any>(null)
  const handLoadingRef = useRef(false)

  const scratchRef = useRef<Scratch | null>(null)
  const maskCacheRef = useRef<MaskCache | null>(null)
  const maskDataRef = useRef<Float32Array | null>(null)
  const maskWRef = useRef(0)
  const maskHRef = useRef(0)
  const mirrorVideoCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const mirrorMaskCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const cubesRef = useRef(new CubeField())
  const gameRef = useRef(new HandGame())

  const rafRef = useRef<number | null>(null)
  const runningRef = useRef(false)
  const lastTimeRef = useRef(0)
  const fpsRef = useRef(60)
  const motionEnergyRef = useRef(0)
  const prevNoseRef = useRef<{ x: number; y: number } | null>(null)
  const lastFaceSeenRef = useRef(0)
  const energyRef = useRef(0)
  const overloadUntilRef = useRef(0)
  const autoAccumRef = useRef(0)
  const bassPrevRef = useRef(0)
  const glitchBurstUntilRef = useRef(0)

  useEffect(() => {
    scratchRef.current = createScratch()
    maskCacheRef.current = { canvas: document.createElement('canvas'), w: 0, h: 0 }
    mirrorVideoCanvasRef.current = document.createElement('canvas')
    mirrorMaskCanvasRef.current = document.createElement('canvas')
    return () => stopAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopAll() {
    runningRef.current = false
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (recordStopTimerRef.current) window.clearTimeout(recordStopTimerRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    micStreamRef.current?.getTracks().forEach(t => t.stop())
    audioCtxRef.current?.close().catch(() => {})
    faceLandmarkerRef.current?.close?.()
    segmenterRef.current?.close?.()
    handLandmarkerRef.current?.close?.()
  }

  // Reemplaza el stream activo por uno nuevo ya abierto. Soltar el viejo
  // ANTES de pedir el nuevo (acá: el caller ya hizo el stop) es crítico en
  // celular — con el hardware todavía "tomado" por el track anterior, varios
  // navegadores devuelven en silencio la misma cámara ya abierta.
  const applyStream = async (newStream: MediaStream, knownFacing?: 'user' | 'environment') => {
    streamRef.current = newStream
    const video = videoRef.current!
    video.srcObject = newStream
    await video.play()
    const settings = newStream.getVideoTracks()[0]?.getSettings()
    const reported = settings?.facingMode as string | undefined
    const nextFacing: 'user' | 'environment' =
      reported === 'environment' || reported === 'user' ? reported : (knownFacing ?? facingRef.current)
    facingRef.current = nextFacing
    setFacing(nextFacing)
    // la cámara trasera nunca debe verse en espejo — la frontal sí, por
    // default, para que se sienta como mirarse al espejo.
    patch({ mirror: nextFacing === 'user' })
    return settings?.deviceId
  }

  const refreshVideoDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cams = devices.filter(d => d.kind === 'videoinput')
      videoDevicesRef.current = cams
      setMultiCamera(cams.length > 1)
      return cams
    } catch {
      setMultiCamera(false)
      return []
    }
  }

  // Cicla por deviceId real en vez de confiar en facingMode: facingMode es
  // solo una preferencia y en bastantes navegadores/Android no fuerza el
  // cambio real de cámara — deviceId sí es inequívoco. Si por lo que sea no
  // hay 2+ dispositivos listados, cae al viejo método por facingMode.
  const switchCamera = async () => {
    try {
      let devices = videoDevicesRef.current
      if (devices.length < 2) devices = await refreshVideoDevices()

      // Soltar el stream viejo ANTES de pedir el nuevo — con el dispositivo
      // todavía abierto por el track anterior, pedir el mismo deviceId (o
      // incluso otro) puede fallar o devolver la cámara equivocada en varios
      // navegadores/Android.
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null

      let newStream: MediaStream
      if (devices.length >= 2) {
        const nextIndex = (deviceIndexRef.current + 1) % devices.length
        const nextDevice = devices[nextIndex]
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: nextDevice.deviceId }, width: { ideal: 960 }, height: { ideal: 540 } },
          audio: false,
        })
        deviceIndexRef.current = nextIndex
      } else {
        const nextFacing = facingRef.current === 'user' ? 'environment' : 'user'
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: nextFacing }, width: { ideal: 960 }, height: { ideal: 540 } },
          audio: false,
        })
      }

      const deviceId = await applyStream(newStream, facingRef.current === 'user' ? 'environment' : 'user')
      if (deviceId) {
        const idx = videoDevicesRef.current.findIndex(d => d.deviceId === deviceId)
        if (idx >= 0) deviceIndexRef.current = idx
      }
    } catch (err: any) {
      console.error('No se pudo cambiar de cámara:', err)
    }
  }

  const start = async () => {
    setErrorMsg('')
    try {
      setStatus('loading')
      const [face, seg] = await Promise.all([
        faceLandmarkerRef.current ? Promise.resolve(faceLandmarkerRef.current) : createFaceLandmarker(),
        segmenterRef.current ? Promise.resolve(segmenterRef.current) : createSegmenter(),
      ])
      faceLandmarkerRef.current = face
      segmenterRef.current = seg

      setStatus('requesting-camera')
      const firstStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'user' }, width: { ideal: 960 }, height: { ideal: 540 } },
        audio: false,
      })
      const deviceId = await applyStream(firstStream, 'user')
      await refreshVideoDevices()
      if (deviceId) {
        const idx = videoDevicesRef.current.findIndex(d => d.deviceId === deviceId)
        if (idx >= 0) deviceIndexRef.current = idx
      }

      runningRef.current = true
      lastTimeRef.current = performance.now()
      setStatus('running')
      rafRef.current = requestAnimationFrame(tick)
    } catch (err: any) {
      console.error('Error iniciando NeoCam:', err)
      setErrorMsg(err?.message || 'No se pudo iniciar la cámara o los modelos de tracking.')
      setStatus('error')
    }
  }

  const toggleAudio = async (on: boolean) => {
    setState(s => ({ ...s, audio: on }))
    if (on && !audioCtxRef.current) {
      try {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true })
        micStreamRef.current = mic
        const actx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const src = actx.createMediaStreamSource(mic)
        const analyser = actx.createAnalyser()
        analyser.fftSize = 256
        src.connect(analyser)
        audioCtxRef.current = actx
        analyserRef.current = analyser
        audioDataRef.current = new Uint8Array(analyser.frequencyBinCount)
      } catch (err) {
        console.error('No se pudo activar el micrófono:', err)
        setState(s => ({ ...s, audio: false }))
      }
    } else if (!on) {
      micStreamRef.current?.getTracks().forEach(t => t.stop())
      micStreamRef.current = null
      audioCtxRef.current?.close().catch(() => {})
      audioCtxRef.current = null
      analyserRef.current = null
    }
  }

  const tick = () => {
    rafRef.current = requestAnimationFrame(tick)
    const video = videoRef.current, canvas = canvasRef.current
    if (!runningRef.current || !video || !canvas || video.readyState < 2) return

    const now = performance.now()
    const dt = clamp((now - lastTimeRef.current) / 16.67, 0.1, 3)
    const instFps = 1000 / Math.max(1, now - lastTimeRef.current)
    fpsRef.current = fpsRef.current * 0.9 + instFps * 0.1
    lastTimeRef.current = now

    const w = video.videoWidth, h = video.videoHeight
    if (!w || !h) return
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
    const ctx = canvas.getContext('2d')!
    const st = stateRef.current
    const ts = Math.round(now)

    let faceBox: FaceBox | null = null
    if (faceLandmarkerRef.current) {
      const res = faceLandmarkerRef.current.detectForVideo(video, ts)
      const lm = res?.faceLandmarks?.[0]
      faceBox = faceBoxFromLandmarks(lm, w, h)
      if (lm) {
        const nose = { x: lm[1].x * w, y: lm[1].y * h }
        if (prevNoseRef.current) {
          const d = Math.hypot(nose.x - prevNoseRef.current.x, nose.y - prevNoseRef.current.y)
          const norm = Math.min(d / (w * 0.03), 3)
          motionEnergyRef.current = motionEnergyRef.current * 0.85 + norm * 0.15
        }
        prevNoseRef.current = nose
      }
    }
    if (faceBox) lastFaceSeenRef.current = now

    if (segmenterRef.current) {
      segmenterRef.current.segmentForVideo(video, ts, (result: any) => {
        const mask = result.confidenceMasks?.[1]
        if (mask) {
          maskDataRef.current = mask.getAsFloat32Array()
          maskWRef.current = mask.width
          maskHRef.current = mask.height
        }
        result.confidenceMasks?.forEach((m: any) => m.close())
      })
    }
    let maskCanvasNative: HTMLCanvasElement | null = null
    if (maskDataRef.current && maskCacheRef.current) {
      maskCanvasNative = buildMaskCanvas(maskDataRef.current, maskWRef.current, maskHRef.current, maskCacheRef.current)
    }

    let fingertips: HandPoint[] = []
    if (st.cubes || st.game) {
      if (!handLandmarkerRef.current && !handLoadingRef.current) {
        handLoadingRef.current = true
        createHandLandmarker().then(h => { handLandmarkerRef.current = h; handLoadingRef.current = false })
      }
      if (handLandmarkerRef.current) {
        const hres = handLandmarkerRef.current.detectForVideo(video, ts)
        fingertips = fingertipsFromHands(hres?.landmarks, w, h)
      }
    }

    let audioLevel = 0, bassHit = false
    if (st.audio && analyserRef.current && audioDataRef.current) {
      analyserRef.current.getByteFrequencyData(audioDataRef.current as Uint8Array<ArrayBuffer>)
      let sum = 0
      for (let i = 0; i < audioDataRef.current.length; i++) sum += audioDataRef.current[i]
      audioLevel = clamp((sum / audioDataRef.current.length / 255) * st.audioGain, 0, 1)
      let bassSum = 0
      for (let i = 0; i < 6; i++) bassSum += audioDataRef.current[i]
      const bass = bassSum / 6 / 255
      bassHit = bass > 0.55 && bassPrevRef.current <= 0.55
      bassPrevRef.current = bass
    }

    let videoSource: CanvasImageSource = video
    let maskSource = maskCanvasNative
    if (st.mirror) {
      const mv = mirrorVideoCanvasRef.current!
      if (mv.width !== w || mv.height !== h) { mv.width = w; mv.height = h }
      const mvctx = mv.getContext('2d')!
      mvctx.save(); mvctx.translate(w, 0); mvctx.scale(-1, 1); mvctx.drawImage(video, 0, 0, w, h); mvctx.restore()
      videoSource = mv
      if (faceBox) faceBox = { ...faceBox, x: w - faceBox.x - faceBox.w, cx: w - faceBox.cx }
      fingertips = fingertips.map(p => ({ x: w - p.x, y: p.y }))
      if (maskCanvasNative) {
        const mm = mirrorMaskCanvasRef.current!
        if (mm.width !== maskCanvasNative.width || mm.height !== maskCanvasNative.height) {
          mm.width = maskCanvasNative.width; mm.height = maskCanvasNative.height
        }
        const mmctx = mm.getContext('2d')!
        mmctx.save(); mmctx.translate(mm.width, 0); mmctx.scale(-1, 1); mmctx.drawImage(maskCanvasNative, 0, 0); mmctx.restore()
        maskSource = mm
      }
    }

    const failActive = st.failsafe && (now - lastFaceSeenRef.current > 1200)

    if (st.energy && (st.mode === 'infrared' || st.mode === 'aura')) {
      energyRef.current = clamp(energyRef.current + motionEnergyRef.current * st.energyGain * dt * 0.6, 0, 100)
      if (energyRef.current >= 100) { overloadUntilRef.current = now + 500; energyRef.current = 0 }
    } else {
      energyRef.current = Math.max(0, energyRef.current - 0.4 * dt)
    }

    if (st.auto) {
      autoAccumRef.current += (dt * 16.67) / 1000
      if (autoAccumRef.current > st.autoSec) {
        autoAccumRef.current = 0
        const idx = MODE_LIST.findIndex(m => m.id === st.mode)
        const next = MODE_LIST[(idx + 1) % MODE_LIST.length].id
        setState(s => ({ ...s, mode: next }))
      }
    }

    ctx.save()
    const overloading = now < overloadUntilRef.current
    if (overloading) ctx.translate((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14)

    if (st.trails) fadeForTrails(ctx, w, h, true, 0.22)
    else ctx.clearRect(0, 0, w, h)

    if (failActive) {
      drawSignalLost(ctx, w, h)
    } else {
      const fc: FrameCtx = {
        ctx, video: videoSource, w, h, t: now, dt,
        maskCanvas: maskSource, faceBox, motionEnergy: motionEnergyRef.current,
        audioLevel, bassHit, state: st, scratch: scratchRef.current!,
      }
      renderMode(fc)
      updateAndDrawGhost(fc)

      if (st.cubes) {
        cubesRef.current.update(dt, w, h, faceBox?.cx ?? null, faceBox?.cy ?? null, 0.6 + motionEnergyRef.current * 0.9)
        cubesRef.current.draw(ctx)
      }
      if (st.game) {
        gameRef.current.update(dt, w, h, Date.now())
        gameRef.current.tryPop(fingertips)
        gameRef.current.draw(ctx)
        for (const p of fingertips) {
          ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(0,212,255,0.9)'; ctx.lineWidth = 2; ctx.stroke()
        }
      }

      if (now < glitchBurstUntilRef.current) {
        ctx.globalCompositeOperation = 'screen'
        for (let i = 0; i < 4; i++) {
          const by = Math.random() * h, bh = 4 + Math.random() * 24, shift = (Math.random() - 0.5) * 50
          ctx.fillStyle = 'rgba(0,212,255,0.4)'; ctx.fillRect(shift, by, w, bh)
          ctx.fillStyle = 'rgba(255,0,150,0.4)'; ctx.fillRect(-shift, by, w, bh)
        }
        ctx.globalCompositeOperation = 'source-over'
      }
      if (overloading) { ctx.fillStyle = 'rgba(255,0,60,0.18)'; ctx.fillRect(0, 0, w, h) }

      if (st.faceMaskOn && faceBox) drawFaceMask(ctx, videoSource, faceBox, w, h, st.faceMaskStyle)
      if (st.hud) drawHud(ctx, w, h, faceBox, fpsRef.current, MODE_LIST.find(m => m.id === st.mode)?.label ?? '')
    }
    ctx.restore()

    if (st.fit === 'blur' && blurBgCanvasRef.current) {
      const bg = blurBgCanvasRef.current
      if (bg.width !== w || bg.height !== h) { bg.width = w; bg.height = h }
      bg.getContext('2d')!.drawImage(canvas, 0, 0)
    }
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      setFps(Math.round(fpsRef.current))
      setFaceSeen(performance.now() - lastFaceSeenRef.current < 500)
      setEnergyPct(Math.round(energyRef.current))
      setGameScore(gameRef.current.score)
      setGameCombo(gameRef.current.combo)
      if (gameRef.current.roundActive) setRoundTimeLeft(Math.max(0, Math.ceil((gameRef.current.roundEndsAt - Date.now()) / 1000)))
      else setRoundTimeLeft(null)
      if (gameRef.current.lastResult) {
        setLastRoundScore(gameRef.current.lastResult.score)
        gameRef.current.lastResult = null
      }
    }, 180)
    return () => window.clearInterval(id)
  }, [])

  const patch = (p: Partial<PageState>) => setState(s => ({ ...s, ...p }))
  const isActive = status === 'running'

  const btnStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '7px 10px', borderRadius: 6, cursor: 'pointer',
    background: active ? `${CYAN}26` : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? CYAN : 'rgba(255,255,255,0.15)'}`,
    color: active ? CYAN : '#8fb8d6', minHeight: 30,
  })
  const toggleStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
    background: active ? 'rgba(0,255,170,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? '#00ffaa' : 'rgba(255,255,255,0.15)'}`,
    color: active ? '#00ffaa' : '#8fb8d6', minHeight: 32, width: '100%', textAlign: 'left' as const,
  })

  const fitCss: React.CSSProperties = state.fit === 'crop'
    ? { objectFit: 'cover' } : { objectFit: 'contain' }

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#c8daf0', position: 'relative', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30, height: 42,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px',
        background: 'rgba(5,10,20,0.85)', borderBottom: `1px solid ${CYAN}44`, backdropFilter: 'blur(5px)',
      }}>
        <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: 2, color: CYAN }}>NEOPROXY // NEOCAM</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isActive && (
            <div style={{ display: 'flex', gap: 10, fontFamily: mono, fontSize: 9, color: '#8fb8d6', letterSpacing: 1 }}>
              <span style={{ color: faceSeen ? '#00ffaa' : '#ff2d55' }}>● {faceSeen ? '1 ROSTRO' : '0 ROSTROS'}</span>
              <span>FPS {fps}</span>
              {state.energy && <span style={{ color: energyPct > 85 ? RED : CYAN }}>EN {energyPct}%</span>}
              {state.game && <span style={{ color: '#ffd23c' }}>SCORE {gameScore} x{gameCombo}</span>}
              {roundTimeLeft !== null && <span style={{ color: RED }}>⏱ {roundTimeLeft}s</span>}
            </div>
          )}
          {isActive && (
            <button onClick={() => patch({ faceMaskOn: !state.faceMaskOn })} title="Quitar o poner la máscara de privacidad facial" style={{
              background: state.faceMaskOn ? 'rgba(0,255,170,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${state.faceMaskOn ? '#00ffaa' : CYAN + '66'}`,
              color: state.faceMaskOn ? '#00ffaa' : CYAN, fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '6px 10px', cursor: 'pointer', minHeight: 30, borderRadius: 4,
            }}>
              {state.faceMaskOn ? '◉ MÁSCARA' : '○ MÁSCARA'}
            </button>
          )}
          {isActive && multiCamera && (
            <button onClick={switchCamera} title="Cambiar entre cámara frontal y trasera" style={{
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${CYAN}66`, color: CYAN,
              fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '6px 10px', cursor: 'pointer', minHeight: 30, borderRadius: 4,
            }}>
              🔄 {facing === 'user' ? 'FRONTAL' : 'TRASERA'}
            </button>
          )}
          <button onClick={() => setPanelOpen(v => !v)} style={{
            background: panelOpen ? `${CYAN}22` : 'rgba(255,255,255,0.05)', border: `1px solid ${CYAN}66`, color: CYAN,
            fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '6px 10px', cursor: 'pointer', minHeight: 30, borderRadius: 4,
          }}>
            ⚙ PANEL
          </button>
          <Link href="/" style={{ color: CYAN, textDecoration: 'none', fontFamily: mono, fontSize: 9, border: `1px solid ${CYAN}66`, padding: '6px 10px', borderRadius: 4 }}>
            EXIT
          </Link>
        </div>
      </div>

      {/* Camara */}
      <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
        {state.fit === 'blur' && (
          <canvas ref={blurBgCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(40px) brightness(0.6)', transform: 'scale(1.2)' }} />
        )}
        <video ref={videoRef} playsInline muted style={{ display: 'none' }} />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            ...fitCss,
            transform: `rotate(${state.rot}deg)`,
          }}
        />
      </div>

      {!isActive && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 20, background: status === 'idle' ? '#000205' : 'rgba(0,2,5,0.9)',
        }}>
          {status === 'idle' && (
            <>
              <div style={{ fontFamily: mono, fontSize: 10, color: '#8fb8d6', letterSpacing: 1, maxWidth: 320, textAlign: 'center', lineHeight: 1.8 }}>
                NEOCAM // CÁMARA CON TODOS LOS EFECTOS — SÍNTESIS EN VIVO EN EL NAVEGADOR, SIN SERVIDOR EXTERNO.
              </div>
              <button onClick={start} className="cyber-btn" style={{
                fontFamily: mono, fontSize: 12, letterSpacing: 3, color: CYAN, background: `${CYAN}0d`,
                border: `1px solid ${CYAN}66`, padding: '14px 32px', cursor: 'pointer', minHeight: 44,
              }}>
                ACTIVAR CÁMARA
              </button>
            </>
          )}
          {(status === 'loading' || status === 'requesting-camera') && (
            <div style={{ fontFamily: mono, fontSize: 11, color: CYAN, letterSpacing: 2 }}>
              {status === 'loading' ? 'CARGANDO MODELOS DE VISIÓN...' : 'SOLICITANDO ACCESO A LA CÁMARA...'}
            </div>
          )}
          {status === 'error' && (
            <>
              <div style={{ fontFamily: mono, fontSize: 11, color: RED, letterSpacing: 1, maxWidth: 300, textAlign: 'center' }}>{errorMsg}</div>
              <button onClick={start} style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2, color: CYAN, background: 'none', border: `1px solid ${CYAN}66`, padding: '10px 24px', cursor: 'pointer', minHeight: 44 }}>
                REINTENTAR
              </button>
            </>
          )}
        </div>
      )}

      {/* Panel de control */}
      {isActive && panelOpen && (
        <div style={{
          position: 'fixed', top: 50, right: 12, bottom: 12, width: 280, zIndex: 25, overflowY: 'auto',
          background: 'rgba(5,10,20,0.92)', border: `1px solid ${CYAN}33`, borderRadius: 10, padding: 14,
          backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <Section title="MODOS">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {MODE_LIST.map(m => (
                <button key={m.id} onClick={() => patch({ mode: m.id })} style={btnStyle(state.mode === m.id)}>{m.label}</button>
              ))}
            </div>
          </Section>

          {state.mode === 'aura' && (
            <Section title="AURA — COLOR">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {AURA_OPTIONS.map(a => (
                  <button key={a.id} onClick={() => patch({ auraColor: a.id })} title={a.label} style={{
                    width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', background: a.color,
                    border: state.auraColor === a.id ? '2px solid #fff' : '2px solid transparent',
                    boxShadow: state.auraColor === a.id ? `0 0 10px ${a.color}` : 'none',
                  }} />
                ))}
              </div>
            </Section>
          )}

          {state.mode === 'thermal' && (
            <Section title="THERMAL — PALETA">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PAL_OPTIONS.map(p => (
                  <button key={p.id} onClick={() => patch({ pal: p.id })} style={btnStyle(state.pal === p.id)}>{p.label}</button>
                ))}
              </div>
            </Section>
          )}

          <Section title="MÁSCARA DE CARA">
            <button onClick={() => patch({ faceMaskOn: !state.faceMaskOn })} style={toggleStyle(state.faceMaskOn)}>
              {state.faceMaskOn ? '◉ APLICADA' : '○ APLICAR MÁSCARA'}
            </button>
            {state.faceMaskOn && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {MASK_OPTIONS.map(m => (
                  <button key={m.id} onClick={() => patch({ faceMaskStyle: m.id })} style={btnStyle(state.faceMaskStyle === m.id)}>{m.label}</button>
                ))}
              </div>
            )}
          </Section>

          <Section title="CAPAS">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <button onClick={() => patch({ hud: !state.hud })} style={toggleStyle(state.hud)}>HUD</button>
              <button onClick={() => patch({ trails: !state.trails })} style={toggleStyle(state.trails)}>TRAILS</button>
              <button onClick={() => patch({ mirror: !state.mirror })} style={toggleStyle(state.mirror)}>MIRROR</button>
              <button onClick={() => patch({ auto: !state.auto })} style={toggleStyle(state.auto)}>AUTO</button>
              <button onClick={() => patch({ ghost: !state.ghost })} style={toggleStyle(state.ghost)}>GHOST</button>
              <button onClick={() => toggleAudio(!state.audio)} style={toggleStyle(state.audio)}>AUDIO</button>
              <button onClick={() => patch({ energy: !state.energy })} style={toggleStyle(state.energy)}>ENERGY</button>
              <button onClick={() => patch({ cubes: !state.cubes })} style={toggleStyle(state.cubes)}>CUBES</button>
              <button onClick={() => patch({ game: !state.game })} style={toggleStyle(state.game)}>GAME</button>
              <button onClick={() => patch({ failsafe: !state.failsafe })} style={toggleStyle(state.failsafe)}>FAILSAFE</button>
            </div>
          </Section>

          <Section title="ENCUADRE / ROTACIÓN">
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {(['crop', 'pad', 'blur'] as Fit[]).map(f => (
                <button key={f} onClick={() => patch({ fit: f })} style={btnStyle(state.fit === f)}>{f.toUpperCase()}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {([0, 90, 180, 270] as Rot[]).map(r => (
                <button key={r} onClick={() => patch({ rot: r })} style={btnStyle(state.rot === r)}>{r}°</button>
              ))}
            </div>
          </Section>

          <Section title="AJUSTES FINOS">
            <Slider label="DESENFOQUE PUNK" value={state.blur} min={2} max={24} step={1} onChange={v => patch({ blur: v })} />
            <Slider label="DESENFOQUE INFRARED" value={state.irBlur} min={4} max={40} step={1} onChange={v => patch({ irBlur: v })} />
            <Slider label="INTENSIDAD SILUETA" value={state.silInt} min={0.2} max={1} step={0.05} onChange={v => patch({ silInt: v })} />
            <Slider label="BANDAS BODY" value={state.bodyBands} min={2} max={8} step={1} onChange={v => patch({ bodyBands: v })} />
            <Slider label="REACCIÓN MOVIMIENTO" value={state.energyGain} min={0.3} max={3} step={0.1} onChange={v => patch({ energyGain: v })} />
            <Slider label="REACCIÓN AUDIO" value={state.audioGain} min={0.3} max={3} step={0.1} onChange={v => patch({ audioGain: v })} />
            <Slider label="GHOST DECAY" value={state.ghostDecay} min={0.02} max={0.4} step={0.02} onChange={v => patch({ ghostDecay: v })} />
            <Slider label="AUTO SEGUNDOS" value={state.autoSec} min={3} max={30} step={1} onChange={v => patch({ autoSec: v })} />
          </Section>

          <Section title="ACCIONES">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <button onClick={() => { glitchBurstUntilRef.current = performance.now() + 350 }} style={btnStyle(false)}>GLITCH!</button>
              <button onClick={() => cubesRef.current.add(canvasRef.current ? canvasRef.current.width / 2 : 300, 100, 6)} style={btnStyle(false)}>+ CUBOS</button>
              <button onClick={() => cubesRef.current.clear()} style={btnStyle(false)}>BORRAR CUBOS</button>
              <button onClick={() => { gameRef.current.score = 0; gameRef.current.combo = 1 }} style={btnStyle(false)}>RESET SCORE</button>
              <button onClick={() => gameRef.current.startRound(60)} style={{ ...btnStyle(false), gridColumn: '1 / -1' }}>RONDA (60s)</button>
            </div>
            {lastRoundScore !== null && (
              <div style={{ fontFamily: mono, fontSize: 10, color: '#ffd23c', marginTop: 8, textAlign: 'center' }}>
                RONDA TERMINADA — {lastRoundScore} PTS
              </div>
            )}
          </Section>

          <Section title="RETRATO PROXYVERSE">
            <p style={{ fontFamily: mono, fontSize: 8, color: '#8fb8d6', lineHeight: 1.7, marginBottom: 10 }}>
              Captura (foto o video de {(RECORD_MS / 1000).toFixed(1)}s) y lo matchea con el agente de Proxyverse
              de paleta más parecida. Funciona mejor en AURA o INFRARED.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <button onClick={captureProxyversePortrait} disabled={recording} style={{ ...btnStyle(false), opacity: recording ? 0.4 : 1 }}>
                ✦ FOTO
              </button>
              <button onClick={recordRitualPortrait} disabled={recording} style={{ ...btnStyle(false), opacity: recording ? 0.4 : 1 }}>
                {recording ? `◉ ${Math.round(recordProgress * 100)}%` : '◉ RITUAL (VIDEO)'}
              </button>
            </div>
            {recording && (
              <div style={{ height: 3, background: '#1a2436', marginTop: 8 }}>
                <div style={{ height: '100%', width: `${recordProgress * 100}%`, background: CYAN, transition: 'width 0.1s linear' }} />
              </div>
            )}
          </Section>
        </div>
      )}

      {portrait && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,2,5,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            maxWidth: 380, width: '100%', background: 'rgba(5,10,20,0.95)',
            border: `1px solid ${portrait.agent.color}66`, borderRadius: 10, overflow: 'hidden',
          }}>
            {portrait.kind === 'video' ? (
              <video src={portrait.url} autoPlay loop muted playsInline style={{
                width: '100%', display: 'block', borderBottom: `2px solid ${portrait.agent.color}`,
                boxShadow: `0 0 30px ${portrait.agent.color}55 inset`,
              }} />
            ) : (
              <img src={portrait.url} alt="Retrato NeoCam" style={{
                width: '100%', display: 'block', borderBottom: `2px solid ${portrait.agent.color}`,
                boxShadow: `0 0 30px ${portrait.agent.color}55 inset`,
              }} />
            )}
            <div style={{ padding: 20 }}>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: '#4a6080', marginBottom: 6 }}>
                MATCH DE PALETA
              </div>
              <div style={{
                fontFamily: mono, fontSize: 22, letterSpacing: 3, color: portrait.agent.color,
                textShadow: `0 0 20px ${portrait.agent.color}66`, marginBottom: 4,
              }}>
                {portrait.agent.name}
              </div>
              <div style={{ fontFamily: mono, fontSize: 10, color: '#8fb8d6', letterSpacing: 1, marginBottom: 14 }}>
                {portrait.affinity}% DE AFINIDAD — {portrait.agent.role}
              </div>
              <div style={{
                fontFamily: mono, fontSize: 11, fontStyle: 'italic', color: '#c8daf0', lineHeight: 1.7, marginBottom: 20,
              }}>
                "{portrait.agent.quote}"
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={downloadPortrait} style={{
                  flex: 1, fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '10px 0', cursor: 'pointer',
                  background: `${portrait.agent.color}15`, border: `1px solid ${portrait.agent.color}66`, color: portrait.agent.color,
                }}>
                  ⬇ DESCARGAR
                </button>
                <Link href={`/proxyverse/${portrait.agent.id}`} style={{
                  flex: 1, fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '10px 0', textAlign: 'center',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)', color: '#8fb8d6', textDecoration: 'none',
                }}>
                  VER PERFIL →
                </Link>
                <button onClick={closePortrait} style={{
                  fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '10px 14px', cursor: 'pointer',
                  background: 'transparent', border: '1px solid rgba(255,45,85,0.4)', color: RED,
                }}>
                  CERRAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: CYAN, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  )
}

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 8, color: '#8fb8d6', letterSpacing: 0.5, marginBottom: 3 }}>
        <span>{label}</span><span style={{ color: CYAN }}>{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: CYAN }} />
    </div>
  )
}
