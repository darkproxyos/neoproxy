'use client'

import { useEffect, useRef, useState } from 'react'
import ProxyverseScene from './ProxyverseScene'
import { agents, getResponses, getAmbientLine } from './agents'

const mono = "'Space Mono', monospace"

type FeedLine = { id: number; agentId: string; line: string; ts: number }

function agentById(id: string) {
  return agents.find(a => a.id === id)!
}

export default function ProxyverseTerminal() {
  const [feed, setFeed] = useState<FeedLine[]>([])
  const [input, setInput] = useState('')
  const feedRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(0)

  const pushLine = (agentId: string, line: string) => {
    idRef.current += 1
    setFeed(prev => [...prev.slice(-59), { id: idRef.current, agentId, line, ts: Date.now() }])
  }

  useEffect(() => {
    let active = true
    let timeoutId: ReturnType<typeof setTimeout>
    const tick = () => {
      if (!active) return
      const a = getAmbientLine()
      pushLine(a.agentId, a.line)
      timeoutId = setTimeout(tick, 4500 + Math.random() * 4500)
    }
    timeoutId = setTimeout(tick, 1000)
    return () => { active = false; clearTimeout(timeoutId) }
  }, [])

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' })
  }, [feed])

  const send = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    pushLine('darkproxy', trimmed)
    const responses = getResponses(trimmed)
    setInput('')
    responses.forEach((r, i) => {
      setTimeout(() => pushLine(r.agentId, r.line), 500 + i * 900)
    })
  }

  return (
    <div>
      {/* Red de procesos: DarkProxy converge con los seis, Metatron orquesta
          a cinco, Prototype toma prestado de esos mismos cinco — las lineas
          son relaciones reales del lore, no decoracion. Click en un nodo
          navega a su perfil completo. */}
      <div style={{
        height: '55vh', minHeight: 360, marginBottom: 12,
        border: '1px solid rgba(0, 212, 255, 0.15)', background: 'rgba(0,4,10,0.4)',
        position: 'relative', overflow: 'hidden',
      }}>
        <ProxyverseScene />
        <div style={{
          position: 'absolute', bottom: 12, left: 12, fontFamily: mono, fontSize: 8,
          letterSpacing: 2, color: '#00d4ff55', pointerEvents: 'none',
        }}>
          ARRASTRAR: ORBITAR // SCROLL: ZOOM // CLICK: ENTRAR AL PERFIL
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8, marginBottom: 32,
      }}>
        {agents.map(agent => (
          <div key={agent.id} style={{
            display: 'flex', alignItems: 'center', gap: 6, fontFamily: mono, fontSize: 8,
            letterSpacing: 1, color: `${agent.color}aa`,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: agent.color,
              boxShadow: `0 0 6px ${agent.color}`, flexShrink: 0,
            }} />
            {agent.name}
          </div>
        ))}
      </div>

      {/* Terminal feed */}
      <div style={{ border: '1px solid rgba(0, 212, 255, 0.15)', background: 'rgba(0,4,10,0.5)' }}>
        <div style={{
          padding: '10px 16px', borderBottom: '1px solid rgba(0, 212, 255, 0.1)',
          fontFamily: mono, fontSize: 9, letterSpacing: 4, color: '#00d4ff66',
        }}>
          COMMS // PROXYVERSE — CANAL ABIERTO ENTRE PROCESOS
        </div>

        <div ref={feedRef} style={{
          height: 320, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {feed.length === 0 && (
            <div style={{ fontFamily: mono, fontSize: 10, color: '#ffffff22', letterSpacing: 2 }}>
              ESCANEANDO PROCESOS ACTIVOS...
            </div>
          )}
          {feed.map(f => {
            const agent = agentById(f.agentId)
            return (
              <div key={f.id} style={{ fontFamily: mono, fontSize: 11 }}>
                <span style={{ color: agent.color, letterSpacing: 1 }}>{agent.name} </span>
                <span style={{ color: '#c8daf0' }}>{f.line}</span>
              </div>
            )
          })}
        </div>

        <div style={{
          padding: 12, borderTop: '1px solid rgba(0, 212, 255, 0.1)', display: 'flex', gap: 8,
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="transmit como DARKPROXY..."
            style={{
              flex: 1, minWidth: 0, background: '#020c18', border: '1px solid #00d4ff33', color: '#00d4ff',
              fontFamily: mono, fontSize: 11, padding: '10px 14px', outline: 'none', letterSpacing: 1, minHeight: 40,
            }}
          />
          <button
            onClick={send}
            style={{
              background: '#00d4ff11', border: '1px solid #00d4ff44', color: '#00d4ff',
              fontFamily: mono, fontSize: 10, letterSpacing: 2, padding: '10px 20px', cursor: 'pointer', minHeight: 40,
            }}
          >
            TX
          </button>
        </div>
      </div>
    </div>
  )
}
