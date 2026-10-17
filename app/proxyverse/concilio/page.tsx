'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { agents } from '@/components/proxyverse/agents'

const mono = "'Space Mono', monospace"
const GOLD = '#ffb800'

const COUNCIL_AGENTS = agents.filter(a => a.id !== 'darkproxy')
const DEFAULT_SELECTION = ['metatron', 'trickster', 'd']

type TranscriptLine = { id: number; agentId: string; line: string }
type Status = 'idle' | 'loading' | 'revealing' | 'done' | 'error'

export default function ConcilioPage() {
  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTION)
  const [question, setQuestion] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [visible, setVisible] = useState<TranscriptLine[]>([])
  const idRef = useRef(0)
  const revealTimers = useRef<number[]>([])

  const toggleAgent = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 4) return prev
      return [...prev, id]
    })
  }

  const clearTimers = () => {
    revealTimers.current.forEach(t => window.clearTimeout(t))
    revealTimers.current = []
  }

  const convocar = async () => {
    const q = question.trim()
    if (!q || selected.length < 2 || status === 'loading' || status === 'revealing') return
    clearTimers()
    setVisible([])
    setErrorMsg('')
    setStatus('loading')
    try {
      const res = await fetch('/api/proxyverse-council', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, agentIds: selected }),
      })
      if (!res.ok) throw new Error('la sala no respondió')
      const data = await res.json()
      const transcript: { agentId: string; line: string }[] = Array.isArray(data?.transcript) ? data.transcript : []
      if (transcript.length === 0) throw new Error('concilio vacío')

      setStatus('revealing')
      transcript.forEach((t, i) => {
        const timer = window.setTimeout(() => {
          idRef.current += 1
          setVisible(prev => [...prev, { id: idRef.current, agentId: t.agentId, line: t.line }])
          if (i === transcript.length - 1) setStatus('done')
        }, i * 1100)
        revealTimers.current.push(timer)
      })
    } catch (err: any) {
      console.error('Error en el concilio:', err)
      setErrorMsg('No se pudo convocar al concilio. Probá de nuevo.')
      setStatus('error')
    }
  }

  const busy = status === 'loading' || status === 'revealing'

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/proxyverse" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#00d4ff88', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A PROXYVERSE
        </Link>

        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${GOLD}66`, marginBottom: 16 }}>
          NPX-PXV-COUNCIL // SALA DE CONCILIO
        </div>
        <h1 style={{
          fontSize: 34, fontWeight: 700, letterSpacing: 6, color: GOLD,
          textShadow: `0 0 30px ${GOLD}44`, marginBottom: 16, lineHeight: 1,
        }}>
          CONCILIO
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 580, marginBottom: 36 }}>
          Convocá a 2-4 procesos a la vez con un mismo tema. No te responden a vos uno por uno —
          se responden entre ellos, en el orden que elijas, cada uno viendo lo que los anteriores
          ya dijeron en la sala.
        </p>

        <div style={{ fontSize: 9, color: GOLD, letterSpacing: 2, marginBottom: 10 }}>
          ELEGÍ 2 A 4 PROCESOS (orden = orden de habla)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
          {COUNCIL_AGENTS.map(a => {
            const idx = selected.indexOf(a.id)
            const active = idx !== -1
            return (
              <button key={a.id} onClick={() => toggleAgent(a.id)} disabled={busy} style={{
                fontFamily: mono, fontSize: 10, letterSpacing: 1, padding: '8px 14px', cursor: busy ? 'default' : 'pointer',
                background: active ? `${a.color}22` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? a.color : 'rgba(255,255,255,0.15)'}`,
                color: active ? a.color : '#8fb8d6', opacity: busy ? 0.6 : 1,
              }}>
                {active ? `${idx + 1}. ` : ''}{a.name}
              </button>
            )
          })}
        </div>

        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          disabled={busy}
          placeholder="Planteá un tema para la sala... (ej: '¿vale la pena romper una regla que nadie probó?')"
          rows={3}
          style={{
            width: '100%', background: '#020c18', border: `1px solid ${GOLD}33`, color: '#c8daf0',
            fontFamily: mono, fontSize: 12, padding: '14px 16px', outline: 'none', letterSpacing: 0.5,
            resize: 'vertical', marginBottom: 14, opacity: busy ? 0.6 : 1,
          }}
        />

        <button onClick={convocar} disabled={busy || !question.trim() || selected.length < 2} style={{
          fontFamily: mono, fontSize: 11, letterSpacing: 2, padding: '12px 28px', cursor: busy ? 'default' : 'pointer',
          background: `${GOLD}18`, border: `1px solid ${GOLD}66`, color: GOLD,
          opacity: (busy || !question.trim() || selected.length < 2) ? 0.5 : 1, marginBottom: 40,
        }}>
          {status === 'loading' ? 'LA SALA DELIBERA...' : status === 'revealing' ? 'EN VIVO...' : '▶ CONVOCAR CONCILIO'}
        </button>

        {errorMsg && (
          <div style={{ fontSize: 10, color: '#ff2d55', marginBottom: 24 }}>{errorMsg}</div>
        )}

        {(visible.length > 0 || status === 'loading') && (
          <div style={{ border: `1px solid ${GOLD}33`, background: 'rgba(0,4,10,0.5)', padding: 20, minHeight: 100 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: `${GOLD}aa`, marginBottom: 16 }}>
              TRANSCRIPCIÓN EN VIVO
            </div>
            {status === 'loading' && (
              <div style={{ fontSize: 10, color: '#4a6080', letterSpacing: 1 }}>conectando canales...</div>
            )}
            {visible.map(v => {
              const agent = agents.find(a => a.id === v.agentId)
              if (!agent) return null
              return (
                <div key={v.id} style={{ marginBottom: 14, fontFamily: mono, fontSize: 12, lineHeight: 1.7 }}>
                  <span style={{ color: agent.color, letterSpacing: 1, fontWeight: 700 }}>{agent.name}: </span>
                  <span style={{ color: '#c8daf0' }}>{v.line}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
