'use client'

import { useEffect, useState } from 'react'
import { auth } from '@/auth'

export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // System health from kernel API
  const [systemHealth, setSystemHealth] = useState<'ONLINE' | 'DEGRADED' | 'OFFLINE'>('OFFLINE')
  const [cpu, setCpu] = useState(0)
  const [ram, setRam] = useState(0)
  const [integrity, setIntegrity] = useState(0)
  const [uptime, setUptime] = useState(0)
  const [lastBackup, setLastBackup] = useState<string | null>(null)

  // Agent roster
  const [agents, setAgents] = useState([
    { id: 'metatron', name: 'Metatron', role: 'Kernel/Governance', status: 'IDLE', lastAction: null, lastActionTime: null },
    { id: 'gennos', name: 'Gennos', role: 'Fabrication', status: 'IDLE', lastAction: null, lastActionTime: null },
    { id: 'snake', name: 'Snake', role: 'Security', status: 'IDLE', lastAction: null, lastActionTime: null },
    { id: 'darkproxy', name: 'Darkproxy', role: 'Operator', status: 'ACTIVE', lastAction: 'System init', lastActionTime: new Date().toISOString() },
    { id: 'trizkter', name: 'Trizkter', role: 'Network', status: 'IDLE', lastAction: null, lastActionTime: null },
    { id: 'd', name: 'D', role: 'Chaos Agent', status: 'IDLE', lastAction: null, lastActionTime: null },
  ])
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  // Event stream
  const [events, setEvents] = useState<any[]>([])
  const [eventFilter, setEventFilter] = useState<'all' | 'system' | 'agent' | 'fabrication' | 'economy'>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const [scrollPaused, setScrollPaused] = useState(false)

  useEffect(() => {
    // Auth check
    auth().then(s => {
      if (!s?.user) {
        window.location.href = '/login'
        return
      }
      setSession(s)
      setLoading(false)
    })
  }, [])

  // Poll kernel status every 3s
  useEffect(() => {
    if (!session) return

    const fetchKernelStatus = async () => {
      try {
        const res = await fetch('/api/kernel/status')
        if (res.ok) {
          const data = await res.json()
          setSystemHealth(data.status === 'online' ? 'ONLINE' : 'DEGRADED')
          setUptime(data.uptime || 0)
        } else {
          setSystemHealth('OFFLINE')
        }
      } catch {
        setSystemHealth('OFFLINE')
      }
    }

    fetchKernelStatus()
    const interval = setInterval(fetchKernelStatus, 3000)
    return () => clearInterval(interval)
  }, [session])

  // Poll system metrics (CPU/RAM/Integrity)
  useEffect(() => {
    if (!session) return

    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/kernel/metrics')
        if (res.ok) {
          const data = await res.json()
          setCpu(data.cpu || 0)
          setRam(data.mem || 0)
          setIntegrity(data.integrity || 100)
          setLastBackup(data.lastBackup || null)
        }
      } catch {
        // Metrics unavailable - keep last known or zero
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 3000)
    return () => clearInterval(interval)
  }, [session])

  // Event stream from /api/live (SSE or polling)
  useEffect(() => {
    if (!session) return

    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/live')
        if (res.ok) {
          const data = await res.json()
          const newEvents = Array.isArray(data) ? data : (data.events || [])
          setEvents(prev => {
            const combined = [...prev, ...newEvents].slice(-100)
            return combined
          })
        }
      } catch {
        // Event stream unavailable
      }
    }

    fetchEvents()
    const interval = setInterval(fetchEvents, 2000)
    return () => clearInterval(interval)
  }, [session])

  // Auto-scroll event stream
  useEffect(() => {
    if (autoScroll && !scrollPaused) {
      const eventStreamEl = document.getElementById('event-stream')
      if (eventStreamEl) {
        eventStreamEl.scrollTop = eventStreamEl.scrollHeight
      }
    }
  }, [events, autoScroll, scrollPaused])

  if (loading) {
    return (
      <div style={{ 
        background: '#0a0a0a', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        color: '#71717a'
      }}>
        Loading...
      </div>
    )
  }

  const filteredEvents = eventFilter === 'all' 
    ? events 
    : events.filter((e: any) => e.type === eventFilter || e.category === eventFilter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#00d4ff'
      case 'ERROR': return '#ef4444'
      default: return '#3f3f46'
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'ONLINE': return '#00ff88'
      case 'DEGRADED': return '#f59e0b'
      default: return '#ef4444'
    }
  }

  return (
    <div style={{ 
      background: '#0a0a0a', 
      minHeight: '100vh', 
      fontFamily: 'Inter, sans-serif',
      color: '#e4e4e7'
    }}>
      {/* TIER 1: HEADER STATUS BAR (sticky top) */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#0a0a0a',
        borderBottom: '1px solid #1f1f23',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 32
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>SYSTEM HEALTH</div>
            <div style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: getHealthColor(systemHealth),
              letterSpacing: '0.05em'
            }}>
              {systemHealth}
            </div>
          </div>
          <div style={{ width: 1, height: 32, background: '#1f1f23' }}></div>
          <div>
            <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>CPU</div>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Space Mono, monospace' }}>
              {cpu.toFixed(1)}%
            </div>
            <div style={{ 
              width: 60, height: 2, background: '#1f1f23', marginTop: 4,
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${cpu}%`, height: '100%', background: '#3f3f46',
                transition: 'width 0.3s ease-out'
              }}></div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>RAM</div>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Space Mono, monospace' }}>
              {ram.toFixed(1)}%
            </div>
            <div style={{ 
              width: 60, height: 2, background: '#1f1f23', marginTop: 4,
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${ram}%`, height: '100%', background: '#3f3f46',
                transition: 'width 0.3s ease-out'
              }}></div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>INTEGRITY</div>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Space Mono, monospace' }}>
              {integrity.toFixed(0)}%
            </div>
            <div style={{ 
              width: 60, height: 2, background: '#1f1f23', marginTop: 4,
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${integrity}%`, height: '100%', background: '#3f3f46',
                transition: 'width 0.3s ease-out'
              }}></div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>UPTIME</div>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Space Mono, monospace' }}>
              {Math.floor(uptime / 3600)}h {Math.floor((uptime % 3600) / 60)}m
            </div>
          </div>
          {lastBackup && (
            <>
              <div style={{ width: 1, height: 32, background: '#1f1f23' }}></div>
              <div>
                <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>LAST BACKUP</div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Space Mono, monospace' }}>
                  {new Date(lastBackup).toLocaleTimeString()}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32 }}>
        {/* Left column: Agent Roster */}
        <div>
          <h2 style={{ 
            fontSize: 14, 
            fontWeight: 500, 
            color: '#71717a',
            marginBottom: 24,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Agent Roster
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16
          }}>
            {agents.map(agent => (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                style={{
                  background: '#0f0f0f',
                  border: '1px solid #1f1f23',
                  borderRadius: 8,
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease-out',
                  ...(selectedAgent === agent.id ? { borderColor: '#00d4ff' } : {})
                }}
                onMouseEnter={(e) => {
                  if (selectedAgent !== agent.id) {
                    e.currentTarget.style.borderColor = '#27272a'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedAgent !== agent.id) {
                    e.currentTarget.style.borderColor = '#1f1f23'
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{agent.name}</div>
                    <div style={{ fontSize: 12, color: '#71717a' }}>{agent.role}</div>
                  </div>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: getStatusColor(agent.status),
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: `${getStatusColor(agent.status)}22`
                  }}>
                    {agent.status}
                  </div>
                </div>
                {agent.lastAction && (
                  <div style={{ fontSize: 11, color: '#71717a', fontFamily: 'Space Mono, monospace' }}>
                    {agent.lastAction}
                    {agent.lastActionTime && (
                      <span style={{ marginLeft: 8, opacity: 0.6 }}>
                        {new Date(agent.lastActionTime).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Agent detail panel (expands when selected) */}
          {selectedAgent && (
            <div style={{
              marginTop: 24,
              background: '#0f0f0f',
              border: '1px solid #1f1f23',
              borderRadius: 8,
              padding: 24
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                {agents.find(a => a.id === selectedAgent)?.name} History
              </h3>
              <div style={{ fontSize: 12, color: '#71717a', fontFamily: 'Space Mono, monospace' }}>
                No historical data available yet. Connect to Memory/conversations or Memory/decisions.
              </div>
            </div>
          )}
        </div>

        {/* Right column: Event Stream */}
        <div style={{ 
          background: '#0f0f0f', 
          border: '1px solid #1f1f23', 
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 140px)',
          position: 'sticky',
          top: 140
        }}>
          <div style={{ 
            padding: 16, 
            borderBottom: '1px solid #1f1f23',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ 
              fontSize: 14, 
              fontWeight: 500, 
              color: '#71717a',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: 0
            }}>
              Event Stream
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['all', 'system', 'agent', 'fabrication', 'economy'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setEventFilter(filter)}
                  style={{
                    padding: '4px 12px',
                    fontSize: 11,
                    fontWeight: 500,
                    color: eventFilter === filter ? '#e4e4e7' : '#71717a',
                    background: eventFilter === filter ? '#27272a' : 'transparent',
                    border: '1px solid #1f1f23',
                    borderRadius: 4,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div 
            id="event-stream"
            style={{
              flex: 1,
              overflow: 'auto',
              padding: 16,
              fontFamily: 'Space Mono, monospace',
              fontSize: 11
            }}
            onMouseEnter={() => setScrollPaused(true)}
            onMouseLeave={() => setScrollPaused(false)}
          >
            {filteredEvents.length === 0 ? (
              <div style={{ color: '#71717a', textAlign: 'center', padding: 32 }}>
                No events yet. Waiting for system activity...
              </div>
            ) : (
              filteredEvents.map((event, i) => (
                <div key={i} style={{ 
                  marginBottom: 12, 
                  paddingBottom: 2,
                  borderBottom: '1px solid #1f1f23',
                  color: '#71717a'
                }}>
                  <div style={{ color: '#00d4ff', marginBottom: 4 }}>
                    {new Date(event.timestamp || Date.now()).toLocaleTimeString()}
                  </div>
                  <div style={{ color: '#e4e4e7' }}>
                    {event.type || 'log'}: {event.message || JSON.stringify(event.payload || event.data)}
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ 
            padding: 12, 
            borderTop: '1px solid #1f1f23',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 11,
            color: '#71717a'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Auto-scroll
            </label>
            <div>{filteredEvents.length} events</div>
          </div>
        </div>
      </div>
    </div>
  )
}
