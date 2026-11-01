import Link from 'next/link'
import { db } from '@/src/db'
import { memoryEvents } from '@/src/db/schema'
import { eq } from 'drizzle-orm'
import { agents } from '@/components/proxyverse/agents'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'

export const dynamic = 'force-dynamic'

function readPair(payload: unknown): { a?: string; b?: string } {
  return (payload && typeof payload === 'object') ? payload as Record<string, unknown> : {}
}

// Topología de mundo pequeño: un grafo real (no inventado) de qué agentes
// se chatean juntos en la misma sesión — agregado y anónimo, sin saber
// quién. components/proxyverse/AgentChannel.tsx registra el evento real
// (AGENT_PAIR_SEEN) la primera vez que alguien habla con un segundo agente
// en su visita.
export default async function TopologiaPage() {
  const weights: Record<string, number> = {}
  try {
    const rows = await db
      .select({ payload: memoryEvents.payload })
      .from(memoryEvents)
      .where(eq(memoryEvents.eventType, 'AGENT_PAIR_SEEN'))
      .limit(2000)
    for (const row of rows) {
      const { a, b } = readPair(row.payload)
      if (!a || !b) continue
      const key = [a, b].sort().join('|')
      weights[key] = (weights[key] || 0) + 1
    }
  } catch (err) {
    console.error('No se pudo leer la topología:', err)
  }

  const nodes = agents
  const N = nodes.length
  const SIZE = 420
  const CENTER = SIZE / 2
  const RADIUS = SIZE / 2 - 60

  const positions: Record<string, { x: number; y: number }> = {}
  nodes.forEach((a, i) => {
    const angle = (i / N) * Math.PI * 2 - Math.PI / 2
    positions[a.id] = { x: CENTER + RADIUS * Math.cos(angle), y: CENTER + RADIUS * Math.sin(angle) }
  })

  const edges = Object.entries(weights).map(([key, weight]) => {
    const [a, b] = key.split('|')
    return { a, b, weight }
  })
  const maxWeight = Math.max(1, ...edges.map(e => e.weight))
  const hasAnyEdge = edges.length > 0

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/proxyverse" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#00d4ff88', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A PROXYVERSE
        </Link>

        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${CYAN}66`, marginBottom: 16 }}>
          NPX-PXV-TOPOLOGIA // QUIÉN SE HABLA CON QUIÉN
        </div>
        <h1 style={{
          fontSize: 34, fontWeight: 700, letterSpacing: 6, color: CYAN,
          textShadow: `0 0 30px ${CYAN}44`, marginBottom: 16, lineHeight: 1,
        }}>
          TOPOLOGÍA
        </h1>
        <p style={{ fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, maxWidth: 560, marginBottom: 32 }}>
          Un grafo real, agregado y anónimo: cada vez que alguien le habla a un segundo proceso en
          la misma visita, ese par queda marcado — nunca quién, solo que pasó. El grosor de cada
          línea es cuántas veces ese par se repitió.
        </p>

        {!hasAnyEdge && (
          <div style={{ fontSize: 10, color: '#3a4a60', letterSpacing: 1, marginBottom: 24 }}>
            SIN PARES REGISTRADOS TODAVÍA — hablá con dos procesos distintos en la misma visita.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {edges.map(({ a, b, weight }) => {
              const pa = positions[a], pb = positions[b]
              if (!pa || !pb) return null
              const strokeWidth = 0.8 + (weight / maxWeight) * 4
              return (
                <line
                  key={`${a}-${b}`}
                  x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                  stroke={`${CYAN}66`} strokeWidth={strokeWidth}
                />
              )
            })}
            {nodes.map(a => {
              const p = positions[a.id]
              return (
                <g key={a.id}>
                  <circle cx={p.x} cy={p.y} r={10} fill={a.color} stroke="#000205" strokeWidth={2} />
                  <text x={p.x} y={p.y - 18} textAnchor="middle" fontFamily={mono} fontSize={9} letterSpacing={1} fill={a.color}>
                    {a.name}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {hasAnyEdge && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {edges.sort((a, b) => b.weight - a.weight).map(({ a, b, weight }) => {
              const agentA = nodes.find(n => n.id === a)
              const agentB = nodes.find(n => n.id === b)
              return (
                <div key={`${a}-${b}`} style={{ fontSize: 9, color: '#8fb8d6', letterSpacing: 0.5 }}>
                  <span style={{ color: agentA?.color }}>{agentA?.name}</span>
                  <span style={{ color: '#4a6080' }}> ↔ </span>
                  <span style={{ color: agentB?.color }}>{agentB?.name}</span>
                  <span style={{ color: '#4a6080' }}> — {weight}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
