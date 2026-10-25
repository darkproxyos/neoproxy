'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { entries } from '@/components/knowledge/entries'
import { tensions } from '@/components/knowledge/tensions'

const mono = "'Space Mono', monospace"
const RED = '#cc0000'
const COLOR_A = '#ff3fa4'
const COLOR_B = '#00d4ff'
const SISTEMA = '#8fb8d6'

type ExchangeLine = { id: number; speaker: 'a' | 'b' | 'sistema'; entryId?: string; role: string; line: string }
type Status = 'idle' | 'loading' | 'revealing' | 'done' | 'error'

export default function DialecticaPage() {
  const [tensionId, setTensionId] = useState(tensions[0].id)
  const [topic, setTopic] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [visible, setVisible] = useState<ExchangeLine[]>([])
  const idRef = useRef(0)
  const revealTimers = useRef<number[]>([])

  const tension = tensions.find(t => t.id === tensionId)!
  const entryA = entries.find(e => e.id === tension.aId)!
  const entryB = entries.find(e => e.id === tension.bId)!

  const clearTimers = () => {
    revealTimers.current.forEach(t => window.clearTimeout(t))
    revealTimers.current = []
  }

  const selectTension = (id: string) => {
    if (status === 'loading' || status === 'revealing') return
    setTensionId(id)
    setTopic('')
    clearTimers()
    setVisible([])
    setStatus('idle')
    setErrorMsg('')
  }

  const abrir = async () => {
    if (status === 'loading' || status === 'revealing') return
    clearTimers()
    setVisible([])
    setErrorMsg('')
    setStatus('loading')
    try {
      const res = await fetch('/api/dialectica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tensionId, topic: topic.trim() }),
      })
      if (!res.ok) throw new Error('la dialéctica no respondió')
      const data = await res.json()
      const exchange: { speaker: 'a' | 'b' | 'sistema'; entryId?: string; role: string; line: string }[] =
        Array.isArray(data?.exchange) ? data.exchange : []
      if (exchange.length === 0) throw new Error('intercambio vacío')

      setStatus('revealing')
      exchange.forEach((e, i) => {
        const timer = window.setTimeout(() => {
          idRef.current += 1
          setVisible(prev => [...prev, { id: idRef.current, ...e }])
          if (i === exchange.length - 1) setStatus('done')
        }, i * 1400)
        revealTimers.current.push(timer)
      })
    } catch (err) {
      console.error('Error en la dialéctica:', err)
      setErrorMsg('No se pudo abrir la dialéctica. Probá de nuevo.')
      setStatus('error')
    }
  }

  const busy = status === 'loading' || status === 'revealing'
  const speakerColor = (s: ExchangeLine['speaker']) => (s === 'a' ? COLOR_A : s === 'b' ? COLOR_B : SISTEMA)
  const speakerName = (s: ExchangeLine['speaker']) => (s === 'a' ? entryA.name : s === 'b' ? entryB.name : 'SISTEMA')

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

        <div style={{ fontSize: 9, color: `${RED}66`, letterSpacing: 6, marginBottom: 16 }}>
          NPX-XP-DIALÉCTICA // TENSIONES REALES, NO INVENTADAS
        </div>
        <h1 style={{
          fontSize: 34, fontWeight: 700, letterSpacing: 6, color: RED,
          textShadow: `0 0 30px ${RED}44`, marginBottom: 16, lineHeight: 1,
        }}>
          DIALÉCTICA
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 600, marginBottom: 36 }}>
          No cualquier par de pensadores charlando — una oposición filosófica real y documentada,
          cada uno argumentando solo desde su posición registrada en{' '}
          <Link href="/knowledge" style={{ color: RED }}>/knowledge</Link>. Tesis, antítesis, réplica —
          y un cierre honesto sobre si hay síntesis o la tensión queda abierta.
        </p>

        <div style={{ fontSize: 9, color: RED, letterSpacing: 2, marginBottom: 10 }}>
          ELEGÍ UNA TENSIÓN
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, marginBottom: 28 }}>
          {tensions.map(t => {
            const a = entries.find(e => e.id === t.aId)!
            const b = entries.find(e => e.id === t.bId)!
            const active = t.id === tensionId
            return (
              <button key={t.id} onClick={() => selectTension(t.id)} disabled={busy} style={{
                textAlign: 'left', fontFamily: mono, padding: '12px 14px', cursor: busy ? 'default' : 'pointer',
                background: active ? `${RED}18` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? RED : 'rgba(255,255,255,0.15)'}`,
                opacity: busy ? 0.6 : 1,
              }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: active ? RED : '#8fb8d6', marginBottom: 6 }}>{t.label}</div>
                <div style={{ fontSize: 10, color: COLOR_A }}>{a.name}</div>
                <div style={{ fontSize: 8, color: '#4a6080', margin: '2px 0' }}>vs</div>
                <div style={{ fontSize: 10, color: COLOR_B }}>{b.name}</div>
              </button>
            )
          })}
        </div>

        <textarea
          value={topic}
          onChange={e => setTopic(e.target.value)}
          disabled={busy}
          placeholder={tension.topicHint}
          rows={3}
          style={{
            width: '100%', background: '#020c18', border: `1px solid ${RED}33`, color: '#c8daf0',
            fontFamily: mono, fontSize: 12, padding: '14px 16px', outline: 'none', letterSpacing: 0.5,
            resize: 'vertical', marginBottom: 14, opacity: busy ? 0.6 : 1,
          }}
        />
        <div style={{ fontSize: 8, color: '#3a4a60', letterSpacing: 0.5, marginBottom: 18 }}>
          vacío = usa la pregunta sugerida de arriba
        </div>

        <button onClick={abrir} disabled={busy} style={{
          fontFamily: mono, fontSize: 11, letterSpacing: 2, padding: '12px 28px', cursor: busy ? 'default' : 'pointer',
          background: `${RED}18`, border: `1px solid ${RED}66`, color: RED,
          opacity: busy ? 0.5 : 1, marginBottom: 40,
        }}>
          {status === 'loading' ? 'ABRIENDO LA TENSIÓN...' : status === 'revealing' ? 'EN VIVO...' : '▶ ABRIR DIALÉCTICA'}
        </button>

        {errorMsg && (
          <div style={{ fontSize: 10, color: '#ff2d55', marginBottom: 24 }}>{errorMsg}</div>
        )}

        {(visible.length > 0 || status === 'loading') && (
          <div style={{ border: `1px solid ${RED}33`, background: 'rgba(0,4,10,0.5)', padding: 20, minHeight: 100 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: `${RED}aa`, marginBottom: 16 }}>
              INTERCAMBIO EN VIVO
            </div>
            {status === 'loading' && (
              <div style={{ fontSize: 10, color: '#4a6080', letterSpacing: 1 }}>abriendo canal...</div>
            )}
            {visible.map(v => (
              <div key={v.id} style={{
                marginBottom: 16, fontFamily: mono, fontSize: 12, lineHeight: 1.7,
                fontStyle: v.speaker === 'sistema' ? 'italic' : 'normal',
                borderLeft: v.speaker !== 'sistema' ? `2px solid ${speakerColor(v.speaker)}44` : 'none',
                paddingLeft: v.speaker !== 'sistema' ? 12 : 0,
              }}>
                <div style={{ fontSize: 8, letterSpacing: 2, color: speakerColor(v.speaker), marginBottom: 4 }}>
                  {v.role} — {speakerName(v.speaker)}
                </div>
                <span style={{ color: v.speaker === 'sistema' ? SISTEMA : '#c8daf0' }}>{v.line}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
