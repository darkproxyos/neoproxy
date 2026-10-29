'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createHandLandmarker, fingertipsFromHands, HandPoint } from '../neocam/engine/vision'
import { clamp } from '../neocam/engine/core'
import { WordGame } from './engine/wordGame'
import { CONCEPTS } from '@/components/games/concepts'

const mono = "'Space Mono', monospace"
const VIOLET = '#b400ff'
const CYAN = '#00d4ff'

type Status = 'idle' | 'loading-model' | 'requesting-camera' | 'running' | 'error'

const DIFFICULTIES = [
  { id: 'calma', label: 'CALMA', spawnEverySec: 3, approachSec: 6 },
  { id: 'normal', label: 'NORMAL', spawnEverySec: 2.2, approachSec: 4.5 },
  { id: 'caos', label: 'CAOS', spawnEverySec: 1.3, approachSec: 3 },
] as const

// Mismo juego que /games/rap (los conceptos del Proxyverse), pero en vez de
// leerlos quietos en pantalla para rapear, se acercan a la cámara de verdad
// (crecen con el tiempo) y los sacás tocándolos con la mano — tracking real
// de MediaPipe (ver ../neocam/engine/vision.ts), no un click de mouse.
export default function FreestyleArPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const handLandmarkerRef = useRef<any>(null)
  const wordGameRef = useRef(new WordGame(CONCEPTS))
  const rafRef = useRef<number | null>(null)
  const runningRef = useRef(false)
  const lastTimeRef = useRef(0)

  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [difficulty, setDifficulty] = useState<typeof DIFFICULTIES[number]['id']>('normal')
  const [popped, setPopped] = useState(0)
  const [missed, setMissed] = useState(0)

  useEffect(() => {
    return () => stopAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopAll() {
    runningRef.current = false
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    handLandmarkerRef.current?.close?.()
  }

  const applyDifficulty = (id: typeof DIFFICULTIES[number]['id']) => {
    setDifficulty(id)
    const d = DIFFICULTIES.find(x => x.id === id)!
    wordGameRef.current.spawnEverySec = d.spawnEverySec
    wordGameRef.current.approachSec = d.approachSec
    wordGameRef.current.rollNextSpawn()
  }

  const start = async () => {
    setErrorMsg('')
    try {
      setStatus('loading-model')
      if (!handLandmarkerRef.current) {
        handLandmarkerRef.current = await createHandLandmarker()
      }

      setStatus('requesting-camera')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 540 } },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()

      const canvas = canvasRef.current!
      canvas.width = video.videoWidth || 960
      canvas.height = video.videoHeight || 540

      wordGameRef.current.clear()
      setPopped(0)
      setMissed(0)
      runningRef.current = true
      lastTimeRef.current = performance.now()
      setStatus('running')
      rafRef.current = requestAnimationFrame(tick)
    } catch (err: any) {
      console.error('Error iniciando Freestyle AR:', err)
      setErrorMsg(err?.message || 'No se pudo iniciar la cámara o el tracking de manos.')
      setStatus('error')
    }
  }

  const tick = () => {
    rafRef.current = requestAnimationFrame(tick)
    const video = videoRef.current, canvas = canvasRef.current, hl = handLandmarkerRef.current
    if (!runningRef.current || !video || !canvas || !hl || video.readyState < 2) return

    const now = performance.now()
    const dt = clamp((now - lastTimeRef.current) / 16.67, 0.1, 3)
    lastTimeRef.current = now

    const w = video.videoWidth, h = video.videoHeight
    if (!w || !h) return
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, w, h)

    const res = hl.detectForVideo(video, Math.round(now))
    const fingertips: HandPoint[] = fingertipsFromHands(res?.landmarks, w, h)

    const game = wordGameRef.current
    game.update(dt, w, h)
    game.tryPop(fingertips, ctx)
    game.draw(ctx)

    for (const p of fingertips) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 9, 0, Math.PI * 2)
      ctx.strokeStyle = `${CYAN}dd`
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      setPopped(wordGameRef.current.popped)
      setMissed(wordGameRef.current.missed)
    }, 200)
    return () => window.clearInterval(id)
  }, [])

  const isActive = status === 'running'

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30, height: 46,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px',
        background: 'rgba(5,10,20,0.85)', borderBottom: `1px solid ${VIOLET}44`, backdropFilter: 'blur(5px)',
      }}>
        <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: 2, color: VIOLET }}>
          NEOPROXY // FREESTYLE AR
        </span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isActive && (
            <div style={{ display: 'flex', gap: 12, fontFamily: mono, fontSize: 9, color: '#8fb8d6', letterSpacing: 1 }}>
              <span style={{ color: CYAN }}>TOCADOS {popped}</span>
              <span style={{ color: '#4a6080' }}>PASADOS {missed}</span>
            </div>
          )}
          <Link href="/realidad-aumentada" style={{ color: VIOLET, textDecoration: 'none', fontFamily: mono, fontSize: 9, border: `1px solid ${VIOLET}66`, padding: '6px 10px', borderRadius: 4 }}>
            EXIT
          </Link>
        </div>
      </div>

      <div style={{
        position: 'relative', width: '100%', height: '100vh',
        transform: 'scaleX(-1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <video ref={videoRef} playsInline muted style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
        <canvas ref={canvasRef} style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }} />
      </div>

      {!isActive && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 20, background: status === 'idle' ? '#000205' : 'rgba(0,2,5,0.9)', padding: 24,
        }}>
          {status === 'idle' && (
            <>
              <div style={{ fontFamily: mono, fontSize: 10, color: '#8fb8d6', letterSpacing: 1, maxWidth: 320, textAlign: 'center', lineHeight: 1.8 }}>
                LOS CONCEPTOS DEL PROXYVERSE SE ACERCAN A LA CÁMARA — TOCALOS CON LA MANO (TRACKING REAL) ANTES DE QUE PASEN DE LARGO. REQUIERE CÁMARA.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {DIFFICULTIES.map(d => (
                  <button key={d.id} onClick={() => applyDifficulty(d.id)} style={{
                    fontFamily: mono, fontSize: 9, letterSpacing: 1.5, padding: '8px 14px', borderRadius: 6, cursor: 'pointer',
                    background: difficulty === d.id ? `${VIOLET}33` : 'transparent',
                    border: `1px solid ${difficulty === d.id ? VIOLET : '#2a3a50'}`,
                    color: difficulty === d.id ? VIOLET : '#4a6080',
                  }}>
                    {d.label}
                  </button>
                ))}
              </div>
              <button onClick={start} className="cyber-btn" style={{
                fontFamily: mono, fontSize: 12, letterSpacing: 3, color: VIOLET, background: `${VIOLET}0d`,
                border: `1px solid ${VIOLET}66`, padding: '14px 32px', cursor: 'pointer', minHeight: 44,
              }}>
                ACTIVAR CÁMARA
              </button>
              <Link href="/games/rap" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 1, color: `${CYAN}88`, textDecoration: 'none' }}>
                ← modo sin cámara (/games/rap)
              </Link>
            </>
          )}
          {(status === 'loading-model' || status === 'requesting-camera') && (
            <div style={{ fontFamily: mono, fontSize: 11, color: VIOLET, letterSpacing: 2 }}>
              {status === 'loading-model' ? 'CARGANDO TRACKING DE MANOS...' : 'SOLICITANDO ACCESO A LA CÁMARA...'}
            </div>
          )}
          {status === 'error' && (
            <>
              <div style={{ fontFamily: mono, fontSize: 11, color: '#ff4444', letterSpacing: 1, maxWidth: 300, textAlign: 'center' }}>
                {errorMsg}
              </div>
              <button onClick={start} style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2, color: VIOLET, background: 'none', border: `1px solid ${VIOLET}66`, padding: '10px 24px', cursor: 'pointer', minHeight: 44 }}>
                REINTENTAR
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
