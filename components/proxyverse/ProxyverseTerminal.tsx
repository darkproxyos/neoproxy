'use client'

import { useEffect, useRef, useState } from 'react'
import { agents, getResponses, getAmbientLine } from './agents'

const mono = "'Space Mono', monospace"

type FeedLine = { id: number; agentId: string; line: string; ts: number }

function agentById(id: string) {
  return agents.find(a => a.id === id)!
}

export default function ProxyverseTerminal() {
  const [selected, setSelected] = useState<string | null>(null)
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

  const selectedAgent = selected ? agentById(selected) : null

  return (
    <div>
      {/* Agent cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 32,
      }}>
        {agents.map(agent => (
          <button
            key={agent.id}
            onClick={() => setSelected(agent.id === selected ? null : agent.id)}
            style={{
              textAlign: 'left', cursor: 'pointer', fontFamily: mono,
              background: selected === agent.id ? `${agent.color}14` : 'rgba(0,4,10,0.5)',
              border: `1px solid ${selected === agent.id ? agent.color : `${agent.color}33`}`,
              padding: '14px 16px', minHeight: 88,
            }}
          >
            <div style={{ color: agent.color, fontSize: 12, letterSpacing: 2, marginBottom: 6 }}>{agent.name}</div>
            <div style={{ color: '#8fb8d6', fontSize: 8, letterSpacing: 1, lineHeight: 1.6 }}>{agent.role}</div>
          </button>
        ))}
      </div>

      {/* Detail panel */}
      {selectedAgent && (
        <div style={{
          border: `1px solid ${selectedAgent.color}44`, background: 'rgba(0,4,10,0.6)',
          padding: 24, marginBottom: 32,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: mono, fontSize: 18, color: selectedAgent.color, letterSpacing: 2, marginBottom: 6 }}>
                {selectedAgent.name}
              </div>
              <div style={{ fontFamily: mono, fontSize: 10, color: '#8fb8d6', letterSpacing: 1 }}>
                {selectedAgent.role}
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              aria-label="Cerrar"
              style={{
                background: 'none', border: `1px solid ${selectedAgent.color}44`, color: selectedAgent.color,
                width: 32, height: 32, cursor: 'pointer', fontFamily: mono, fontSize: 12, flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ fontFamily: mono, fontSize: 9, color: '#4a6080', letterSpacing: 1, marginBottom: 4 }}>
            % HUMANO
          </div>
          <div style={{ fontFamily: mono, fontSize: 11, color: '#00ffcc', letterSpacing: 0.5, marginBottom: 20 }}>
            {selectedAgent.percentHuman}
          </div>

          {selectedAgent.bio.map((p, i) => (
            <p key={i} style={{ fontFamily: mono, fontSize: 11, lineHeight: 1.9, color: '#c8daf0', marginBottom: 14 }}>
              {p}
            </p>
          ))}

          <div style={{
            marginTop: 8, paddingTop: 16, borderTop: `1px solid ${selectedAgent.color}22`,
            fontFamily: mono, fontSize: 12, color: selectedAgent.color, letterSpacing: 0.5, fontStyle: 'italic',
          }}>
            "{selectedAgent.quote}"
          </div>
        </div>
      )}

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
