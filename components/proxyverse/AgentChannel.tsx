'use client'

import { useRef, useState } from 'react'
import { type ProxyAgent, pickRandom, matchAgentLine } from './agents'

const mono = "'Space Mono', monospace"

type Line = { id: number; from: 'you' | 'agent'; text: string }

export default function AgentChannel({ agent }: { agent: ProxyAgent }) {
  const [feed, setFeed] = useState<Line[]>([])
  const [input, setInput] = useState('')
  const idRef = useRef(0)

  const push = (from: Line['from'], text: string) => {
    idRef.current += 1
    setFeed(prev => [...prev.slice(-29), { id: idRef.current, from, text }])
  }

  const send = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    push('you', trimmed)
    setInput('')
    setTimeout(() => push('agent', matchAgentLine(agent, trimmed)), 500)
  }

  const generate = () => {
    const pool = agent.ambient.length ? agent.ambient : agent.fallback
    push('agent', pickRandom(pool))
  }

  return (
    <div style={{ border: `1px solid ${agent.color}33`, background: 'rgba(0,4,10,0.5)' }}>
      <div style={{
        padding: '10px 16px', borderBottom: `1px solid ${agent.color}22`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
      }}>
        <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${agent.color}aa` }}>
          CANAL DIRECTO // {agent.name}
        </span>
        <button onClick={generate} style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 1, color: agent.color,
          background: `${agent.color}11`, border: `1px solid ${agent.color}44`, padding: '6px 12px', cursor: 'pointer',
        }}>
          GENERAR SEÑAL
        </button>
      </div>

      <div style={{ minHeight: 140, maxHeight: 260, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {feed.length === 0 && (
          <div style={{ fontFamily: mono, fontSize: 10, color: '#ffffff22', letterSpacing: 1 }}>
            CANAL ABIERTO. SIN TRÁFICO TODAVÍA.
          </div>
        )}
        {feed.map(f => (
          <div key={f.id} style={{ fontFamily: mono, fontSize: 11 }}>
            <span style={{ color: f.from === 'you' ? '#8fb8d6' : agent.color, letterSpacing: 1 }}>
              {f.from === 'you' ? 'VOS ' : `${agent.name} `}
            </span>
            <span style={{ color: '#c8daf0' }}>{f.text}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: 12, borderTop: `1px solid ${agent.color}22`, display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={`transmitile algo a ${agent.name}...`}
          style={{
            flex: 1, minWidth: 0, background: '#020c18', border: `1px solid ${agent.color}33`, color: agent.color,
            fontFamily: mono, fontSize: 11, padding: '10px 14px', outline: 'none', letterSpacing: 1, minHeight: 40,
          }}
        />
        <button onClick={send} style={{
          background: `${agent.color}11`, border: `1px solid ${agent.color}44`, color: agent.color,
          fontFamily: mono, fontSize: 10, letterSpacing: 2, padding: '10px 20px', cursor: 'pointer', minHeight: 40,
        }}>
          TX
        </button>
      </div>
    </div>
  )
}
