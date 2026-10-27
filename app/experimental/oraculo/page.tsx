'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { entries, clusters, type KnowledgeEntry } from '@/components/knowledge/entries'

const mono = "'Space Mono', monospace"
const VIOLET = '#b06bff'

const SUGGESTED_QUESTIONS = [
  '¿Qué es lo que no se puede comprimir?',
  '¿Hay una forma de pensar sin cuerpo?',
  '¿Qué sobrevive cuando el sistema colapsa?',
  '¿Dónde está el límite entre orden y ruido?',
  '¿Se puede diseñar algo que de verdad esté vivo?',
  '¿Qué parte de vos es réplica de otra cosa?',
]

type Status = 'idle' | 'drawing' | 'reading' | 'done' | 'error'

function drawThree(): KnowledgeEntry[] {
  const pool = [...entries]
  const picked: KnowledgeEntry[] = []
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    picked.push(pool[idx])
    pool.splice(idx, 1)
  }
  return picked
}

export default function OraculoPage() {
  const [question, setQuestion] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [cards, setCards] = useState<KnowledgeEntry[]>([])
  const [flipped, setFlipped] = useState<boolean[]>([])
  const [reading, setReading] = useState('')
  const flipTimers = useRef<number[]>([])

  const clearTimers = () => {
    flipTimers.current.forEach(t => window.clearTimeout(t))
    flipTimers.current = []
  }

  const tirar = async () => {
    if (status === 'drawing' || status === 'reading') return
    const effectiveQuestion = question.trim() || SUGGESTED_QUESTIONS[Math.floor(Math.random() * SUGGESTED_QUESTIONS.length)]
    clearTimers()
    setErrorMsg('')
    setReading('')
    const picked = drawThree()
    setCards(picked)
    setFlipped([false, false, false])
    setStatus('drawing')

    picked.forEach((_, i) => {
      const t = window.setTimeout(() => {
        setFlipped(f => f.map((v, j) => (j === i ? true : v)))
      }, 450 + i * 500)
      flipTimers.current.push(t)
    })

    const t = window.setTimeout(async () => {
      setStatus('reading')
      try {
        const res = await fetch('/api/oraculo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: effectiveQuestion, entryIds: picked.map(e => e.id) }),
        })
        if (!res.ok) throw new Error('el oráculo no respondió')
        const data = await res.json()
        setReading(typeof data?.reading === 'string' ? data.reading : '')
        setStatus('done')
      } catch (err) {
        console.error('Error en el oráculo:', err)
        setErrorMsg('No se pudo armar la lectura. Probá de nuevo.')
        setStatus('error')
      }
    }, 450 + picked.length * 500 + 200)
    flipTimers.current.push(t)
  }

  const busy = status === 'drawing' || status === 'reading'

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/experimental" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A EXPERIMENTAL
        </Link>

        <div style={{ fontSize: 9, color: `${VIOLET}66`, letterSpacing: 6, marginBottom: 16 }}>
          NPX-XP-ORÁCULO // TRES POSICIONES REALES, AL AZAR
        </div>
        <h1 style={{
          fontSize: 34, fontWeight: 700, letterSpacing: 6, color: VIOLET,
          textShadow: `0 0 30px ${VIOLET}44`, marginBottom: 16, lineHeight: 1,
        }}>
          ORÁCULO
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 600, marginBottom: 36 }}>
          No elegís con quién hablás — te tocan tres posiciones reales y documentadas de{' '}
          <Link href="/knowledge" style={{ color: VIOLET }}>/knowledge</Link>, al azar. El sistema busca
          una conexión honesta entre esas tres y tu pregunta — citando lo que de verdad sostuvieron, no
          inventando nada nuevo en su nombre.
        </p>

        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          disabled={busy}
          placeholder={SUGGESTED_QUESTIONS[0]}
          rows={2}
          style={{
            width: '100%', background: '#0c0518', border: `1px solid ${VIOLET}33`, color: '#c8daf0',
            fontFamily: mono, fontSize: 12, padding: '14px 16px', outline: 'none', letterSpacing: 0.5,
            resize: 'vertical', marginBottom: 10, opacity: busy ? 0.6 : 1,
          }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
          {SUGGESTED_QUESTIONS.map(q => (
            <button key={q} onClick={() => setQuestion(q)} disabled={busy} style={{
              fontFamily: mono, fontSize: 8, letterSpacing: 0.5, padding: '6px 10px', cursor: busy ? 'default' : 'pointer',
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${VIOLET}33`, color: '#8fb8d6',
              opacity: busy ? 0.5 : 1,
            }}>
              {q}
            </button>
          ))}
        </div>

        <button onClick={tirar} disabled={busy} style={{
          fontFamily: mono, fontSize: 11, letterSpacing: 2, padding: '12px 28px', cursor: busy ? 'default' : 'pointer',
          background: `${VIOLET}18`, border: `1px solid ${VIOLET}66`, color: VIOLET,
          opacity: busy ? 0.5 : 1, marginBottom: 40,
        }}>
          {status === 'drawing' ? 'TIRANDO LAS CARTAS...' : status === 'reading' ? 'ARMANDO LA LECTURA...' : '▶ TIRAR LAS CARTAS'}
        </button>

        {errorMsg && (
          <div style={{ fontSize: 10, color: '#ff2d55', marginBottom: 24 }}>{errorMsg}</div>
        )}

        {cards.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32 }}>
              {cards.map((c, i) => {
                const color = clusters[c.cluster].color
                return (
                  <div key={c.id} className="oraculo-card" style={{ height: 150 }}>
                    <div className={`oraculo-card-inner ${flipped[i] ? 'oraculo-card-flipped' : ''}`}>
                      <div className="oraculo-card-face oraculo-card-back" style={{ borderColor: `${VIOLET}44` }}>
                        <span style={{ color: `${VIOLET}88`, fontSize: 18 }}>?</span>
                      </div>
                      <div className="oraculo-card-face oraculo-card-front" style={{ borderColor: `${color}66`, background: `${color}0d` }}>
                        <Link href={`/knowledge?entry=${c.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                          <div style={{ fontSize: 10, color, letterSpacing: 0.5, marginBottom: 4, fontWeight: 700 }}>{c.name}</div>
                          <div style={{ fontSize: 8, color: '#8fb8d6', letterSpacing: 0.5, marginBottom: 6 }}>{c.years}</div>
                          <div style={{ fontSize: 8, color: `${color}cc`, letterSpacing: 0.5 }}>{c.role}</div>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {reading && (
              <div className="fade-in" style={{
                border: `1px solid ${VIOLET}33`, background: 'rgba(10,2,20,0.5)', padding: 24,
                fontSize: 13, lineHeight: 2, color: '#e8d8ff', fontStyle: 'italic',
              }}>
                {reading}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
