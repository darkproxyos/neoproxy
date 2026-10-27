'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getVoterId } from '@/components/proxyverse/identity'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'
const GREEN = '#39ff6a'

type Submission = {
  id: string
  mode: string
  label: string | null
  thumbnail: string
  status: string
  votes: number
  votedByMe: boolean
}

type Status = 'loading' | 'ready' | 'error'

export default function FabricationQueuePage() {
  const [status, setStatus] = useState<Status>('loading')
  const [weekOf, setWeekOf] = useState('')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [votingId, setVotingId] = useState<string | null>(null)

  const load = async () => {
    try {
      const voterId = getVoterId()
      const res = await fetch(`/api/fabrication/queue?visitorId=${encodeURIComponent(voterId)}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('bad response')
      const data = await res.json()
      setWeekOf(data.weekOf)
      setSubmissions(data.submissions)
      setStatus('ready')
    } catch (err) {
      console.error('No se pudo cargar la cola de fabricación:', err)
      setStatus('error')
    }
  }

  useEffect(() => { load() }, [])

  const vote = async (submissionId: string) => {
    if (votingId) return
    setVotingId(submissionId)
    setSubmissions(prev => prev.map(s => s.id === submissionId
      ? { ...s, votes: s.votedByMe ? s.votes : s.votes + 1, votedByMe: true }
      : s))
    try {
      await fetch('/api/fabrication/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, visitorId: getVoterId() }),
      })
    } catch (err) {
      console.error('No se pudo registrar el voto:', err)
    } finally {
      setVotingId(null)
      load()
    }
  }

  const leader = submissions.length > 0 ? submissions[0] : null
  const winner = submissions.find(s => s.status === 'winner')

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/fabrication" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A FABRICACIÓN
        </Link>

        <div style={{ fontSize: 9, color: `${GREEN}66`, letterSpacing: 6, marginBottom: 16 }}>
          NPX-FAB-COLA // {weekOf || '...'}
        </div>
        <h1 style={{
          fontSize: 36, fontWeight: 700, letterSpacing: 6, color: GREEN,
          textShadow: `0 0 40px ${GREEN}44`, marginBottom: 16, lineHeight: 1,
        }}>
          COLA DE FABRICACIÓN
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 600, marginBottom: 8 }}>
          Especímenes reales generados en <Link href="/lab/proxygenesis" style={{ color: GREEN }}>Proxygenesis</Link>, enviados
          por quien los generó. Votá el que te gustaría ver fabricado de verdad en resina — el voto
          es insumo, no una promesa automática: DarkProxy decide a mano cuál se imprime.
        </p>
        <p style={{ fontSize: 9, color: '#4a6080', letterSpacing: 1, lineHeight: 1.8, maxWidth: 600, marginBottom: 48 }}>
          Un voto por visitante por semana ISO. La cola se vacía cada semana — lo que no se vota no se pierde,
          solo deja de competir.
        </p>

        {winner && (
          <div style={{ border: `1px solid ${GREEN}66`, background: `${GREEN}0d`, padding: 20, marginBottom: 32 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: GREEN, marginBottom: 6 }}>
              ◉ GANADOR DECLARADO ESTA SEMANA
            </div>
            <div style={{ fontSize: 11, color: '#c8daf0' }}>
              {winner.label || `${winner.mode.toUpperCase()} sin nombre`} — pasa a fabricación real.
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div style={{ fontSize: 10, color: '#4a6080', letterSpacing: 1 }}>CARGANDO COLA...</div>
        )}
        {status === 'error' && (
          <div style={{ fontSize: 10, color: '#ff2d55', letterSpacing: 1 }}>
            No se pudo cargar la cola. Probá de nuevo más tarde.
          </div>
        )}
        {status === 'ready' && submissions.length === 0 && (
          <div style={{ fontSize: 10, color: '#3a4a60', letterSpacing: 1 }}>
            SIN ENVÍOS ESTA SEMANA TODAVÍA — generá algo en Proxygenesis y envialo.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {submissions.map(s => (
            <div key={s.id} className="artifact-card" style={{
              padding: 14,
              border: s.id === leader?.id ? `1px solid ${GREEN}66` : undefined,
            }}>
              <Image src={s.thumbnail} alt={s.label || s.mode} width={220} height={160} unoptimized
                style={{ width: '100%', height: 140, objectFit: 'cover', border: `1px solid ${CYAN}22`, marginBottom: 10 }} />
              <div style={{ fontSize: 10, color: '#c8daf0', marginBottom: 4 }}>
                {s.label || `${s.mode.toUpperCase()} sin nombre`}
              </div>
              <div style={{ fontSize: 8, color: '#4a6080', letterSpacing: 1, marginBottom: 10 }}>
                {s.mode.toUpperCase()} {s.id === leader?.id && s.votes > 0 && <span style={{ color: GREEN }}>· LÍDER</span>}
              </div>
              <button
                onClick={() => vote(s.id)}
                disabled={s.votedByMe || votingId === s.id}
                style={{
                  width: '100%', fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '8px 0',
                  cursor: s.votedByMe ? 'default' : 'pointer',
                  background: s.votedByMe ? `${GREEN}18` : 'transparent',
                  border: `1px solid ${s.votedByMe ? GREEN : CYAN}66`,
                  color: s.votedByMe ? GREEN : CYAN,
                  opacity: votingId === s.id ? 0.5 : 1,
                }}
              >
                {s.votedByMe ? `◉ VOTADO — ${s.votes}` : `△ VOTAR — ${s.votes}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
