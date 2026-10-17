'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { agents } from '@/components/proxyverse/agents'
import { computeIdentity, type IdentitySummary } from '@/components/proxyverse/identity'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'

export default function ProxyIdPage() {
  const [identity, setIdentity] = useState<IdentitySummary | null>(null)

  useEffect(() => {
    setIdentity(computeIdentity())
  }, [])

  const maxScore = identity ? Math.max(1, ...Object.values(identity.scorePerAgent)) : 1

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/proxyverse" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#00d4ff88', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A PROXYVERSE
        </Link>

        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${CYAN}66`, marginBottom: 16 }}>
          NPX-PXV-ID // IDENTIDAD DE PROCESO
        </div>
        <h1 style={{
          fontSize: 34, fontWeight: 700, letterSpacing: 6, color: CYAN,
          textShadow: `0 0 30px ${CYAN}44`, marginBottom: 16, lineHeight: 1,
        }}>
          PROXY ID
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 580, marginBottom: 40 }}>
          No es una cuenta — es lo que este navegador acumuló de vos: con quién hablaste, qué generaste,
          hasta dónde llegaste. Todo vive en localStorage, nadie más lo ve. Cuanto más interactúes con
          el sistema, más preciso se pone.
        </p>

        {identity === null && (
          <div style={{ fontSize: 10, color: '#3a4a60' }}>LEYENDO...</div>
        )}

        {identity !== null && !identity.hasAnySignal && (
          <div style={{ border: '1px solid rgba(255,255,255,0.1)', padding: 24, marginBottom: 32 }}>
            <div style={{ fontSize: 12, color: '#8fb8d6', lineHeight: 1.9, marginBottom: 16 }}>
              Todavía no hay señal. Tu Proxy ID se arma solo con lo que hagas en el sitio:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 10 }}>
              <Link href="/proxyverse" style={{ color: CYAN }}>→ Hablá con un proceso en Proxyverse</Link>
              <Link href="/realidad-aumentada/neocam" style={{ color: CYAN }}>→ Sacate un retrato en NeoCam</Link>
              <Link href="/lab/proxygenesis" style={{ color: CYAN }}>→ Generá una pieza en Proxygenesis</Link>
              <Link href="/games/trickster" style={{ color: CYAN }}>→ Jugá una partida de Trickster</Link>
              <Link href="/experimental/scan" style={{ color: CYAN }}>→ Escaneá un tag NFC</Link>
            </div>
          </div>
        )}

        {identity !== null && identity.hasAnySignal && (
          <>
            <div style={{
              border: `1px solid ${identity.dominant ? identity.dominant.color + '66' : 'rgba(255,255,255,0.15)'}`,
              background: identity.dominant ? `${identity.dominant.color}0a` : 'rgba(255,255,255,0.02)',
              padding: 28, marginBottom: 28,
            }}>
              <div style={{ fontSize: 9, color: '#4a6080', letterSpacing: 2, marginBottom: 8 }}>
                TU PROCESO DOMINANTE
              </div>
              {identity.dominant ? (
                <>
                  <div style={{
                    fontSize: 28, letterSpacing: 4, color: identity.dominant.color,
                    textShadow: `0 0 24px ${identity.dominant.color}66`, marginBottom: 6,
                  }}>
                    {identity.dominant.name}
                  </div>
                  <div style={{ fontSize: 10, color: '#8fb8d6', letterSpacing: 1, marginBottom: 16 }}>
                    {identity.dominant.role}
                  </div>
                  <div style={{ fontSize: 11, fontStyle: 'italic', color: '#c8daf0', lineHeight: 1.7, marginBottom: 18 }}>
                    "{identity.dominant.quote}"
                  </div>
                  <Link href={`/proxyverse/${identity.dominant.id}`} style={{ fontSize: 9, color: identity.dominant.color, letterSpacing: 1 }}>
                    VER SU PERFIL →
                  </Link>
                </>
              ) : (
                <div style={{ fontSize: 11, color: '#8fb8d6' }}>Todavía sin un proceso dominante claro.</div>
              )}
            </div>

            {Object.keys(identity.scorePerAgent).length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 9, color: CYAN, letterSpacing: 2, marginBottom: 12 }}>AFINIDAD POR PROCESO</div>
                {agents.filter(a => a.id !== 'darkproxy' && (identity.scorePerAgent[a.id] || 0) > 0).map(a => {
                  const score = identity.scorePerAgent[a.id] || 0
                  const pct = Math.round((score / maxScore) * 100)
                  return (
                    <div key={a.id} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#8fb8d6', marginBottom: 3 }}>
                        <span>{a.name}</span><span style={{ color: a.color }}>{score} pts</span>
                      </div>
                      <div style={{ height: 6, background: '#0c1420', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: a.color, borderRadius: 2, boxShadow: `0 0 8px ${a.color}66` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ fontSize: 9, color: CYAN, letterSpacing: 2, marginBottom: 12 }}>REGISTRO</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
              <StatCard label="PIEZAS GENERADAS" value={identity.proxygenesisCount} href="/lab/proxygenesis/galeria" />
              <StatCard label="MENSAJES ENVIADOS" value={Object.values(identity.chatCounts).reduce((a, b) => a + b, 0)} href="/proxyverse" />
              <StatCard label="NIVEL MÁXIMO TRICKSTER" value={`${identity.trickster.bestLevel}/4`} href="/games/trickster" />
              <StatCard label="VICTORIAS TRICKSTER" value={identity.trickster.victories} href="/games/trickster" />
              <StatCard label="TAGS NFC ESCANEADOS" value={identity.nfcScans} href="/experimental/scan" />
              {identity.portrait && (
                <StatCard
                  label="ÚLTIMO RETRATO"
                  value={`${identity.portrait.affinity}%`}
                  sub={agents.find(a => a.id === identity.portrait!.agentId)?.name}
                  href="/realidad-aumentada/neocam"
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, href }: { label: string; value: string | number; sub?: string; href: string }) {
  return (
    <Link href={href} className="artifact-card" style={{ display: 'block', padding: 16, textDecoration: 'none', color: 'inherit' }}>
      <div style={{ fontSize: 8, color: '#4a6080', letterSpacing: 1, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 22, color: CYAN, letterSpacing: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: '#8fb8d6', marginTop: 4 }}>{sub}</div>}
    </Link>
  )
}
