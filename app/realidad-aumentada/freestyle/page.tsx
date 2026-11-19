'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { WordGame } from './engine/wordGame'
import { analyzeNewBar, DetectedResource, normalizeForMatch } from './engine/voiceAnalysis'
import { CONCEPTS } from '@/components/games/concepts'

const mono = "'Space Mono', monospace"
const VIOLET = '#b400ff'
const CYAN = '#00d4ff'

type Status = 'idle' | 'requesting-mic' | 'running' | 'error'

const DIFFICULTIES = [
  { id: 'calma', label: 'CALMA', spawnEverySec: 3, approachSec: 7 },
  { id: 'normal', label: 'NORMAL', spawnEverySec: 2.2, approachSec: 5.5 },
  { id: 'caos', label: 'CAOS', spawnEverySec: 1.3, approachSec: 4 },
] as const

const RESOURCE_COLOR: Record<DetectedResource['type'], string> = {
  rima_final: '#00ffcc',
  rima_interna: CYAN,
  aliteracion: '#ffd60a',
  anafora: VIOLET,
  anadiplosis: '#ff2ecb',
  repeticion: '#4a6080',
}

type NamedWord = { text: string; t: number }

// Mismo juego que /games/rap (los conceptos del Proxyverse se acercan y hay
// que sacarlos antes de que pasen de largo), pero acá no hay cámara ni
// tracking de mano: los sacás NOMBRÁNDOLOS en voz alta mientras rapeás
// (Web Speech API, reconocimiento continuo), y de paso cada frase que decís
// se analiza en vivo buscando recursos reales de rima y repetición (ver
// engine/voiceAnalysis.ts) -- heurística de acentuación española estándar,
// no un analizador fonético certificado.
export default function FreestyleVoicePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wordGameRef = useRef(new WordGame(CONCEPTS))
  const rafRef = useRef<number | null>(null)
  const runningRef = useRef(false)
  const lastTimeRef = useRef(0)

  const recognitionRef = useRef<any>(null)
  const barsRef = useRef<string[]>([])
  const matchBufferRef = useRef('')

  const [supported, setSupported] = useState(true)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [difficulty, setDifficulty] = useState<typeof DIFFICULTIES[number]['id']>('normal')
  const [popped, setPopped] = useState(0)
  const [missed, setMissed] = useState(0)
  const [interimText, setInterimText] = useState('')
  const [barsLog, setBarsLog] = useState<string[]>([])
  const [namedWords, setNamedWords] = useState<NamedWord[]>([])
  const [resources, setResources] = useState<DetectedResource[]>([])
  const [rhymeStreak, setRhymeStreak] = useState(0)

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setSupported(!!SR)
    return () => stopAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopAll() {
    runningRef.current = false
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    try { recognitionRef.current?.abort() } catch { /* ya pudo estar parado */ }
  }

  const applyDifficulty = (id: typeof DIFFICULTIES[number]['id']) => {
    setDifficulty(id)
    const d = DIFFICULTIES.find((x) => x.id === id)!
    wordGameRef.current.spawnEverySec = d.spawnEverySec
    wordGameRef.current.approachSec = d.approachSec
    wordGameRef.current.rollNextSpawn()
  }

  const start = () => {
    setErrorMsg('')
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setSupported(false)
      setStatus('error')
      setErrorMsg('Este navegador no tiene reconocimiento de voz (Web Speech API). Probá en Chrome o Edge.')
      return
    }

    wordGameRef.current.clear()
    barsRef.current = []
    matchBufferRef.current = ''
    setPopped(0)
    setMissed(0)
    setBarsLog([])
    setInterimText('')
    setNamedWords([])
    setResources([])
    setRhymeStreak(0)

    const recognition = new SR()
    recognition.lang = 'es-AR'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      runningRef.current = true
      setStatus('running')
      lastTimeRef.current = performance.now()
      rafRef.current = requestAnimationFrame(tick)
    }

    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript: string = result[0]?.transcript ?? ''
        if (result.isFinal) {
          if (!transcript.trim()) continue
          barsRef.current.push(transcript)
          const newResources = analyzeNewBar(barsRef.current)
          if (newResources.length) {
            setResources((prev) => [...newResources, ...prev].slice(0, 30))
          }
          setRhymeStreak((prev) => (newResources.some((r) => r.type === 'rima_final') ? prev + 1 : 0))
          setBarsLog((prev) => [...prev, transcript].slice(-5))
        } else {
          interim += transcript
        }
      }
      setInterimText(interim)
      matchBufferRef.current = normalizeForMatch(`${barsRef.current.slice(-6).join(' ')} ${interim}`)
    }

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        runningRef.current = false
        setStatus('error')
        setErrorMsg('Permiso de micrófono denegado. Habilitalo para este sitio y volvé a intentar.')
      }
    }

    recognition.onend = () => {
      if (runningRef.current) {
        try { recognition.start() } catch { /* ya estaba arrancando */ }
      }
    }

    recognitionRef.current = recognition
    setStatus('requesting-mic')
    try {
      recognition.start()
    } catch {
      setStatus('error')
      setErrorMsg('No se pudo iniciar el reconocimiento de voz.')
    }
  }

  const tick = () => {
    rafRef.current = requestAnimationFrame(tick)
    const canvas = canvasRef.current
    if (!runningRef.current || !canvas) return

    const now = performance.now()
    const dt = Math.min(3, Math.max(0.1, (now - lastTimeRef.current) / 16.67))
    lastTimeRef.current = now

    const w = window.innerWidth, h = window.innerHeight
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, w, h)

    const game = wordGameRef.current
    game.update(dt, w, h)
    const poppedNow = game.tryPopByVoice(matchBufferRef.current)
    if (poppedNow.length) {
      const t = Date.now()
      setNamedWords((prev) => [...poppedNow.map((text) => ({ text, t })), ...prev].slice(0, 8))
    }
    game.draw(ctx)
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
      <style>{`
        @keyframes freestyleVozFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes freestyleVozPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30, height: 46,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px',
        background: 'rgba(5,10,20,0.85)', borderBottom: `1px solid ${VIOLET}44`, backdropFilter: 'blur(5px)',
      }}>
        <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: 2, color: VIOLET }}>
          NEOPROXY // FREESTYLE — VOZ
        </span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isActive && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontFamily: mono, fontSize: 9, color: '#8fb8d6', letterSpacing: 1 }}>
              <span style={{ color: '#ff3b3b', animation: 'freestyleVozPulse 1.4s ease-in-out infinite' }}>● REC</span>
              <span style={{ color: CYAN }}>NOMBRADAS {popped}</span>
              <span style={{ color: '#4a6080' }}>PASADAS {missed}</span>
            </div>
          )}
          <Link href="/games" style={{ color: VIOLET, textDecoration: 'none', fontFamily: mono, fontSize: 9, border: `1px solid ${VIOLET}66`, padding: '6px 10px', borderRadius: 4 }}>
            EXIT
          </Link>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {isActive && (
        <>
          {/* Ticker de palabras del pool sacadas por voz -- distinto de las barras analizadas abajo. */}
          <div style={{
            position: 'fixed', top: 54, left: 16, zIndex: 24, display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 'min(480px, 70vw)',
          }}>
            {namedWords.map((n) => (
              <span key={`${n.text}-${n.t}`} style={{
                fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '4px 9px', borderRadius: 5,
                background: `${CYAN}1a`, border: `1px solid ${CYAN}66`, color: CYAN,
                animation: 'freestyleVozFadeIn 0.25s ease-out',
              }}>
                ✓ {n.text}
              </span>
            ))}
          </div>

          {/* Lo que dijiste -- parcial en vivo + últimas barras finalizadas. */}
          <div style={{
            position: 'fixed', left: 16, bottom: 16, zIndex: 24, maxWidth: 'min(420px, 52vw)',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            {barsLog.slice(-3).map((b, i) => (
              <div key={i} style={{ fontFamily: mono, fontSize: 10, color: '#8fb8d6cc', lineHeight: 1.5 }}>
                {b}
              </div>
            ))}
            {interimText && (
              <div style={{ fontFamily: mono, fontSize: 10, color: `${VIOLET}aa`, fontStyle: 'italic', lineHeight: 1.5 }}>
                {interimText}…
              </div>
            )}
          </div>

          {/* Recursos detectados -- rima final/interna, aliteración, anáfora, anadiplosis, repetición. */}
          <div style={{
            position: 'fixed', right: 16, bottom: 16, zIndex: 24, maxWidth: 'min(300px, 44vw)', maxHeight: '48vh',
            overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            {rhymeStreak >= 2 && (
              <div style={{
                fontFamily: mono, fontSize: 10, letterSpacing: 1.5, color: '#00ffcc', padding: '6px 10px',
                border: '1px solid #00ffcc66', borderRadius: 6, background: '#00ffcc14', textAlign: 'center',
              }}>
                RACHA DE RIMA × {rhymeStreak}
              </div>
            )}
            {resources.slice(0, 10).map((r) => (
              <div key={r.id} style={{
                fontFamily: mono, fontSize: 9, letterSpacing: 0.5, padding: '6px 10px', borderRadius: 4,
                borderLeft: `3px solid ${RESOURCE_COLOR[r.type]}`, background: 'rgba(10,14,24,0.7)',
                animation: 'freestyleVozFadeIn 0.3s ease-out',
              }}>
                <div style={{ color: RESOURCE_COLOR[r.type], marginBottom: 2 }}>{r.label}</div>
                <div style={{ color: '#8fb8d6' }}>{r.detail}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {!isActive && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 20, background: status === 'idle' ? '#000205' : 'rgba(0,2,5,0.9)', padding: 24,
        }}>
          {status === 'idle' && (
            <>
              <div style={{ fontFamily: mono, fontSize: 10, color: '#8fb8d6', letterSpacing: 1, maxWidth: 360, textAlign: 'center', lineHeight: 1.8 }}>
                LOS CONCEPTOS DEL PROXYVERSE SE ACERCAN — NOMBRALOS EN VOZ ALTA MIENTRAS RAPEÁS ANTES DE QUE PASEN DE LARGO.
                CADA FRASE QUE DECÍS SE ANALIZA EN VIVO BUSCANDO RIMAS Y OTROS RECURSOS. REQUIERE MICRÓFONO, NO CÁMARA.
              </div>
              {!supported && (
                <div style={{ fontFamily: mono, fontSize: 10, color: '#ff6666', letterSpacing: 1, maxWidth: 320, textAlign: 'center' }}>
                  Este navegador no soporta reconocimiento de voz. Probá en Chrome o Edge (desktop o Android).
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                {DIFFICULTIES.map((d) => (
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
              <button onClick={start} disabled={!supported} className="cyber-btn" style={{
                fontFamily: mono, fontSize: 12, letterSpacing: 3, color: VIOLET, background: `${VIOLET}0d`,
                border: `1px solid ${VIOLET}66`, padding: '14px 32px', cursor: supported ? 'pointer' : 'default',
                minHeight: 44, opacity: supported ? 1 : 0.4,
              }}>
                ACTIVAR MICRÓFONO
              </button>
              <Link href="/games/rap" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 1, color: `${CYAN}88`, textDecoration: 'none' }}>
                ← modo sin voz, solo texto (/games/rap)
              </Link>
            </>
          )}
          {status === 'requesting-mic' && (
            <div style={{ fontFamily: mono, fontSize: 11, color: VIOLET, letterSpacing: 2 }}>
              SOLICITANDO ACCESO AL MICRÓFONO...
            </div>
          )}
          {status === 'error' && (
            <>
              <div style={{ fontFamily: mono, fontSize: 11, color: '#ff4444', letterSpacing: 1, maxWidth: 320, textAlign: 'center', lineHeight: 1.6 }}>
                {errorMsg}
              </div>
              {supported && (
                <button onClick={start} style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2, color: VIOLET, background: 'none', border: `1px solid ${VIOLET}66`, padding: '10px 24px', cursor: 'pointer', minHeight: 44 }}>
                  REINTENTAR
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
