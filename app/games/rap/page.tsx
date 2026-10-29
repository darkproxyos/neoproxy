'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CONCEPTS, pickConcepts } from '@/components/games/concepts'

const VIOLET = '#b400ff'
const CYAN = '#00d4ff'
const mono = "'Space Mono', monospace"

export default function RapPage() {
  const [running, setRunning] = useState(false)
  const [concepts, setConcepts] = useState<string[]>([])
  const [intervalSec, setIntervalSec] = useState(5)
  const [tick, setTick] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function rollNext() {
    const n = 1 + Math.floor(Math.random() * 6) // entre 1 y 6, como se pidió
    setConcepts(pickConcepts(CONCEPTS, n))
    setTick((t) => t + 1)
  }

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!running) return
    rollNext()
    timerRef.current = setInterval(rollNext, intervalSec * 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, intervalSec])

  const fontSize = concepts.length <= 2 ? 34 : concepts.length <= 4 ? 26 : 20

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <style>{`
        @keyframes rapProgressShrink { from { width: 100%; } to { width: 0%; } }
        @keyframes rapFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{
        position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column',
        maxWidth: 900, margin: '0 auto', padding: '40px 24px 32px',
      }}>
        <Link href="/games" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${VIOLET}66`, textDecoration: 'none',
          display: 'inline-block', marginBottom: 24,
        }}>
          ← VOLVER A PROXYGAMES
        </Link>

        <div style={{ fontSize: 9, color: `${VIOLET}66`, letterSpacing: 6, marginBottom: 10 }}>
          // PROXYGAMES — FREESTYLE
        </div>
        <h1 style={{
          fontSize: 32, fontWeight: 700, letterSpacing: 6, color: VIOLET,
          textShadow: `0 0 30px ${VIOLET}44`, marginBottom: 10, lineHeight: 1,
        }}>
          FREESTYLE
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', lineHeight: 1.8, maxWidth: 560, marginBottom: 28 }}>
          Poné tu pista aparte y rapeá — cada ciertos segundos aparecen entre 1 y 6 conceptos
          nuevos del Proxyverse (agentes, frases, vocabulario del proyecto) para que los metas
          en la letra.
        </p>

        {/* Área de conceptos — ocupa el centro, crece con la pantalla. */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 260, border: `1px solid ${VIOLET}33`, borderRadius: 12,
          background: `${VIOLET}08`, padding: 24, marginBottom: 24, position: 'relative', overflow: 'hidden',
        }}>
          {concepts.length === 0 ? (
            <div style={{ fontSize: 12, letterSpacing: 2, color: '#4a6080', textAlign: 'center' }}>
              TOCÁ "ARRANCAR" PARA EMPEZAR
            </div>
          ) : (
            <div key={tick} style={{
              display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', alignItems: 'center',
              animation: 'rapFadeIn 0.3s ease-out',
            }}>
              {concepts.map((c, i) => (
                <div key={i} style={{
                  fontSize, fontWeight: 700, letterSpacing: 1.5, color: '#fff',
                  textShadow: `0 0 16px ${VIOLET}aa`, padding: '10px 18px',
                  border: `1px solid ${VIOLET}55`, borderRadius: 8, background: '#0a0014cc',
                  lineHeight: 1.3, textAlign: 'center',
                }}>
                  {c}
                </div>
              ))}
            </div>
          )}

          {/* Barra de progreso hasta el próximo cambio — se reinicia con `tick`. */}
          {running && (
            <div key={`bar-${tick}`} style={{
              position: 'absolute', bottom: 0, left: 0, height: 3, background: VIOLET,
              animation: `rapProgressShrink ${intervalSec}s linear forwards`,
            }} />
          )}
        </div>

        {/* Controles */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <button
            onClick={() => setRunning((r) => !r)}
            style={{
              fontFamily: mono, fontSize: 12, letterSpacing: 2, padding: '14px 28px', borderRadius: 8,
              cursor: 'pointer', background: running ? '#ff2b2b22' : `${VIOLET}22`,
              border: `1px solid ${running ? '#ff2b2b' : VIOLET}`, color: running ? '#ff6666' : VIOLET,
            }}
          >
            {running ? 'PAUSAR' : 'ARRANCAR'}
          </button>
          <button
            onClick={rollNext}
            disabled={!running}
            style={{
              fontFamily: mono, fontSize: 11, letterSpacing: 2, padding: '14px 20px', borderRadius: 8,
              cursor: running ? 'pointer' : 'default', background: `${CYAN}14`,
              border: `1px solid ${CYAN}66`, color: running ? CYAN : `${CYAN}44`,
            }}
          >
            SIGUIENTE →
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', fontSize: 9, letterSpacing: 1.5, color: '#4a6080' }}>
          <span>RITMO:</span>
          {[3, 5, 8].map((s) => (
            <button
              key={s}
              onClick={() => setIntervalSec(s)}
              style={{
                fontFamily: mono, fontSize: 9, letterSpacing: 1.5, padding: '6px 12px', borderRadius: 6,
                cursor: 'pointer', background: intervalSec === s ? `${VIOLET}33` : 'transparent',
                border: `1px solid ${intervalSec === s ? VIOLET : '#2a3a50'}`,
                color: intervalSec === s ? VIOLET : '#4a6080',
              }}
            >
              {s}S
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Link href="/games/rap-aprendizaje" style={{
            fontFamily: mono, fontSize: 9, letterSpacing: 2, color: `${CYAN}88`, textDecoration: 'none',
          }}>
            → MODO APRENDIZAJE (vocabulario de filosofía/ciencia agrupado por rima)
          </Link>
          <Link href="/realidad-aumentada/freestyle" style={{
            fontFamily: mono, fontSize: 9, letterSpacing: 2, color: `${VIOLET}aa`, textDecoration: 'none',
          }}>
            → MODO AR (los conceptos se acercan a la cámara, tocalos con la mano para sacarlos)
          </Link>
        </div>
      </div>
    </div>
  )
}
