'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SystemState {
  totalCoherence: number
  totalCorruption: number
  totalNodesAbsorbed: number
  entropyLevel: number
  lastUpdated: string
}

export default function StatusPage() {
  const [state, setState] = useState<SystemState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('/api/system/state')
        if (!res.ok) throw new Error('SYSTEM UNREACHABLE')
        const data = await res.json()
        setState(data)
      } catch (err) {
        setError('CONNECTION LOST')
      } finally {
        setLoading(false)
      }
    }

    fetchState()
    const interval = setInterval(fetchState, 5000)
    return () => clearInterval(interval)
  }, [])

  const getEntropyColor = (level: number) => {
    if (level < 30) return '#00FF9D'
    if (level < 60) return '#FFB800'
    return '#FF2B2B'
  }

  return (
    <div className="min-h-screen bg-[#020205] text-[#aaaabb] font-mono p-8">
      {/* Scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(0deg,transparent,transparent_3px,rgba(180,0,255,0.03)_3px,rgba(180,0,255,0.03)_4px)]" />
      
      <header className="border-b border-[#0d0d1a] pb-4 mb-8">
        <h1 className="text-3xl text-[#b400ff] tracking-widest">NEOPROXY // SYSTEM STATUS</h1>
        <p className="text-xs text-[#2a2a44] mt-2">REAL-TIME COHERENCE MONITORING</p>
      </header>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-[#b400ff]">ESTABLISHING UPLINK...</div>
        </div>
      )}

      {error && (
        <div className="border border-[#ff2b2b] bg-[#ff2b2b]/10 p-4 mb-4">
          <p className="text-[#ff2b2b]">⚠ {error}</p>
        </div>
      )}

      {state && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Entropy Level */}
          <div className="border border-[#0d0d1a] bg-[#06060e] p-6">
            <p className="text-xs text-[#2a2a44] mb-2">ENTROPY LEVEL</p>
            <p 
              className="text-4xl font-bold"
              style={{ color: getEntropyColor(state.entropyLevel) }}
            >
              {state.entropyLevel.toFixed(2)}%
            </p>
            <div className="mt-4 h-2 bg-[#0d0d1a] rounded overflow-hidden">
              <div 
                className="h-full transition-all duration-1000"
                style={{ 
                  width: `${state.entropyLevel}%`,
                  backgroundColor: getEntropyColor(state.entropyLevel)
                }}
              />
            </div>
          </div>

          {/* Coherence */}
          <div className="border border-[#0d0d1a] bg-[#06060e] p-6">
            <p className="text-xs text-[#2a2a44] mb-2">TOTAL COHERENCE</p>
            <p className="text-4xl font-bold text-[#00ff9d]">
              {state.totalCoherence.toFixed(0)}
            </p>
            <p className="text-xs text-[#2a2a44] mt-4">
              {state.totalCoherence > 50 ? 'STABLE' : 'CRITICAL'}
            </p>
          </div>

          {/* Corruption */}
          <div className="border border-[#0d0d1a] bg-[#06060e] p-6">
            <p className="text-xs text-[#2a2a44] mb-2">CORRUPTION</p>
            <p className="text-4xl font-bold text-[#ff2b2b]">
              {state.totalCorruption.toFixed(0)}
            </p>
            <p className="text-xs text-[#2a2a44] mt-4">
              {state.totalCorruption > 20 ? 'WARNING' : 'MINIMAL'}
            </p>
          </div>

          {/* Nodes */}
          <div className="border border-[#0d0d1a] bg-[#06060e] p-6">
            <p className="text-xs text-[#2a2a44] mb-2">NODES ABSORBED</p>
            <p className="text-4xl font-bold text-[#b400ff]">
              {state.totalNodesAbsorbed}
            </p>
            <p className="text-xs text-[#2a2a44] mt-4">
              NETWORK EXPANSION
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 border-t border-[#0d0d1a] pt-4">
        <p className="text-xs text-[#2a2a44]">
          LAST UPDATE: {state?.lastUpdated ? new Date(state.lastUpdated).toLocaleString() : 'N/A'}
        </p>
        <div className="mt-4 flex gap-4">
          <Link href="/" className="text-[#b400ff] hover:text-[#00ff9d] transition-colors">
            ← RETURN TO SECTOR 0
          </Link>
          <Link href="/games/wired" className="text-[#b400ff] hover:text-[#00ff9d] transition-colors">
            ENTER WIRED →
          </Link>
        </div>
      </div>
    </div>
  )
}
