'use client'

import { useState, useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  // Boot sequence state
  const [bootLines, setBootLines] = useState<string[]>([])
  const [bootComplete, setBootComplete] = useState(false)
  const [bootShrunk, setBootShrunk] = useState(false)
  const [soulData, setSoulData] = useState<any>(null)
  const [showLogin, setShowLogin] = useState(false)

  const bootLinesRef = useRef<string[]>([])

  useEffect(() => {
    const fetchSoulState = async () => {
      try {
        const res = await fetch('/api/system/soul-state')
        if (res.ok) {
          const data = await res.json()
          setSoulData(data)
          
          // Build boot lines with real data
          const lines = [
            '> INITIALIZING NEOPROXY KERNEL',
            `> MEMORY... [${data.events_count} events, ${data.decisions_count} decisions, ${data.artifacts_count} artifacts]`,
            data.last_commit 
              ? `> LAST COMMIT... ${data.last_commit.date}: "${data.last_commit.message}"`
              : '> LAST COMMIT... NO DATA',
            `> ACTIVITY... ${data.commits_30d} commits / 30d · streak ${data.streak_days ?? 0}d`,
            '> AWAITING OPERATOR AUTHENTICATION...'
          ]
          
          bootLinesRef.current = lines
          
          // Reveal lines one by one
          let i = 0
          const interval = setInterval(() => {
            if (i < lines.length) {
              setBootLines(prev => [...prev, lines[i]])
              i++
            } else {
              clearInterval(interval)
              setBootComplete(true)
              // Shrink and move to corner after 500ms
              setTimeout(() => setBootShrunk(true), 500)
              // Show login form after 1s
              setTimeout(() => setShowLogin(true), 1000)
            }
          }, 200) // 200ms between lines
          
          return () => clearInterval(interval)
        } else {
          setBootLines(['> MEMORY LINK UNSTABLE'])
          setBootComplete(true)
          setTimeout(() => setBootShrunk(true), 500)
          setTimeout(() => setShowLogin(true), 1000)
        }
      } catch {
        setBootLines(['> MEMORY LINK UNSTABLE'])
        setBootComplete(true)
        setTimeout(() => setBootShrunk(true), 500)
        setTimeout(() => setShowLogin(true), 1000)
      }
    }

    fetchSoulState()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    })
    if (result?.error) {
      setError('ACCESO DENEGADO // CREDENCIALES INVÁLIDAS')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050505',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"JetBrains Mono", "Space Mono", monospace',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Boot sequence text */}
      {!bootShrunk ? (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'left',
          fontSize: 14,
          color: '#e4e4e7',
          lineHeight: 2,
          whiteSpace: 'pre',
          transition: 'all 0.5s ease-out',
        }}>
          {bootLines.map((line, i) => (
            <div key={i} style={{ opacity: 1 }}>{line}</div>
          ))}
        </div>
      ) : (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          fontSize: 10,
          color: '#71717a',
          lineHeight: 1.8,
          whiteSpace: 'pre',
          transition: 'all 0.5s ease-out',
        }}>
          {bootLines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}

      {/* Login form - appears after boot */}
      {showLogin && (
        <div style={{
          width: '100%',
          maxWidth: '400px',
          padding: '32px',
          background: '#0f0f0f',
          border: '1px solid #1f1f23',
          borderRadius: 8,
          opacity: 0,
          animation: 'fadeIn 1s ease-out forwards',
        }}>
          {error && (
            <div style={{
              color: '#ef4444',
              fontSize: 11,
              marginBottom: 16,
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                color: '#71717a',
                fontSize: 10,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #1f1f23',
                  borderRadius: 4,
                  color: '#e4e4e7',
                  fontFamily: '"JetBrains Mono", "Space Mono", monospace',
                  fontSize: 13,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#27272a'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#1f1f23'}
                required
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                color: '#71717a',
                fontSize: 10,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #1f1f23',
                  borderRadius: 4,
                  color: '#e4e4e7',
                  fontFamily: '"JetBrains Mono", "Space Mono", monospace',
                  fontSize: 13,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#27272a'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#1f1f23'}
                required
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                background: '#0a0a0a',
                color: '#e4e4e7',
                border: '1px solid #1f1f23',
                borderRadius: 4,
                fontFamily: '"JetBrains Mono", "Space Mono", monospace',
                fontSize: 11,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#27272a'
                e.currentTarget.style.borderColor = '#3f3f46'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#0a0a0a'
                e.currentTarget.style.borderColor = '#1f1f23'
              }}
            >
              Iniciar sesión
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
