'use client'
import { useEffect, useState, useRef } from 'react'
import PusherClient from 'pusher-js'

export default function Chat() {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const pusher = new PusherClient('e1dd2b8f196d106ff74f', { cluster: 'mt1' })
    const ch = pusher.subscribe('neoproxy-chat')
    ch.bind('message', (data: any) => {
      setMessages(prev => [...prev.slice(-100), data])
      setUnread(n => n + 1)
    })
    return () => pusher.disconnect()
  }, [])

  useEffect(() => {
    if (open) setUnread(0)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = async () => {
    if (!input.trim()) return
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, operator: 'DARKPROXY' })
    })
    setInput('')
  }

  return (
    <>
      <button onClick={() => setOpen(!open)} style={{
        position:'fixed', bottom:24, right:24, zIndex:1000,
        background:'#020c18', border:'1px solid #00d4ff44',
        color:'#00d4ff', fontFamily:'monospace',
        fontSize:10, letterSpacing:3, padding:'8px 16px',
        cursor:'pointer', boxShadow:'0 0 20px #00d4ff22',
      }}>
        {open ? 'CLOSE' : `CHAT ${unread > 0 ? `[${unread}]` : '//'}`}
      </button>

      {open && (
        <div style={{
          position:'fixed', bottom:70, right:24, zIndex:1000,
          width:320, height:400,
          background:'#010810ee', border:'1px solid #00d4ff22',
          backdropFilter:'blur(12px)', display:'flex', flexDirection:'column',
          fontFamily:'monospace',
        }}>
          <div style={{ padding:'10px 16px', borderBottom:'1px solid #00d4ff11',
            fontSize:9, letterSpacing:4, color:'#00d4ff66' }}>
            NEOPROXY // COMMS
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:12,
            display:'flex', flexDirection:'column', gap:8 }}>
            {messages.length === 0 && (
              <div style={{ color:'#ffffff22', fontSize:9, letterSpacing:2 }}>
                NO SIGNALS DETECTED...
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ fontSize:10 }}>
                <span style={{ color:'#00d4ff' }}>{m.operator} </span>
                <span style={{ color:'#ffffff88' }}>{m.message}</span>
                <div style={{ color:'#ffffff22', fontSize:8 }}>
                  {new Date(m.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding:10, borderTop:'1px solid #00d4ff11',
            display:'flex', gap:8 }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="transmit..."
              style={{ flex:1, background:'#020c18', border:'1px solid #00d4ff22',
                color:'#00d4ff', fontFamily:'monospace', fontSize:10,
                padding:'6px 10px', outline:'none', letterSpacing:2 }}
            />
            <button onClick={send} style={{
              background:'#00d4ff11', border:'1px solid #00d4ff33',
              color:'#00d4ff', fontFamily:'monospace',
              fontSize:9, letterSpacing:2, padding:'6px 12px', cursor:'pointer',
            }}>TX</button>
          </div>
        </div>
      )}
    </>
  )
}
