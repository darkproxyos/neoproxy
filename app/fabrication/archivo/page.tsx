'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'
const GREEN = '#39ff6a'

type Submission = {
  id: string
  mode: string
  label: string | null
  thumbnail: string
  status: string
  weekOf: string
  votes: number
}

type Week = { weekOf: string; submissions: Submission[] }

type Status = 'loading' | 'ready' | 'error'

export default function FabricationArchivePage() {
  const [status, setStatus] = useState<Status>('loading')
  const [weeks, setWeeks] = useState<Week[]>([])

  useEffect(() => {
    fetch('/api/fabrication/archivo', { cache: 'no-store' })
      .then(res => { if (!res.ok) throw new Error('bad response'); return res.json() })
      .then(data => { setWeeks(data.weeks ?? []); setStatus('ready') })
      .catch(err => { console.error('No se pudo cargar el archivo de fabricación:', err); setStatus('error') })
  }, [])

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/fabrication/cola" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A LA COLA
        </Link>

        <div style={{ fontSize: 9, color: `${CYAN}66`, letterSpacing: 6, marginBottom: 16 }}>
          NPX-FAB-ARCHIVO
        </div>
        <h1 style={{
          fontSize: 36, fontWeight: 700, letterSpacing: 6, color: CYAN,
          textShadow: `0 0 40px ${CYAN}44`, marginBottom: 16, lineHeight: 1,
        }}>
          ARCHIVO
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 600, marginBottom: 48 }}>
          Nada de lo que se envió alguna vez a la cola de fabricación desaparece. Lo que no ganó su
          semana no se borra — solo deja de competir. Acá queda, con los votos que tuvo.
        </p>

        {status === 'loading' && (
          <div style={{ fontSize: 10, color: '#4a6080', letterSpacing: 1 }}>CARGANDO ARCHIVO...</div>
        )}
        {status === 'error' && (
          <div style={{ fontSize: 10, color: '#ff2d55', letterSpacing: 1 }}>
            No se pudo cargar el archivo. Probá de nuevo más tarde.
          </div>
        )}
        {status === 'ready' && weeks.length === 0 && (
          <div style={{ fontSize: 10, color: '#3a4a60', letterSpacing: 1 }}>
            TODAVÍA NO HAY SEMANAS CERRADAS — lo que se vota esta semana va a aparecer acá cuando empiece la próxima.
          </div>
        )}

        {weeks.map(week => (
          <div key={week.weekOf} style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 10, color: CYAN, letterSpacing: 4, marginBottom: 16 }}>
              {week.weekOf}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {week.submissions.map(s => (
                <div key={s.id} className="artifact-card" style={{
                  padding: 14,
                  border: s.status === 'winner' ? `1px solid ${GREEN}66` : undefined,
                }}>
                  <Image src={s.thumbnail} alt={s.label || s.mode} width={220} height={160} unoptimized
                    style={{ width: '100%', height: 140, objectFit: 'cover', border: `1px solid ${CYAN}22`, marginBottom: 10 }} />
                  <div style={{ fontSize: 10, color: '#c8daf0', marginBottom: 4 }}>
                    {s.label || `${s.mode.toUpperCase()} sin nombre`}
                  </div>
                  <div style={{ fontSize: 8, color: '#4a6080', letterSpacing: 1, marginBottom: 10 }}>
                    {s.mode.toUpperCase()} · {s.votes} {s.votes === 1 ? 'voto' : 'votos'}
                    {s.status === 'winner' && <span style={{ color: GREEN }}> · ◉ GANADOR</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
