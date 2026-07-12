'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

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
      background: '#020408',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Space Mono", monospace',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
        border: '1px solid #00d4ff',
        boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
      }}>
        <h1 style={{
          color: '#00d4ff',
          fontSize: '24px',
          marginBottom: '30px',
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '4px',
        }}>
          NEO<span style={{color: '#fff'}}>PROXY</span>
        </h1>
        
        {error && (
          <div style={{
            color: '#ff0040',
            fontSize: '12px',
            marginBottom: '20px',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#00d4ff',
              fontSize: '10px',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}>
              USUARIO
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                border: '1px solid #00d4ff',
                color: '#fff',
                fontFamily: '"Space Mono", monospace',
                fontSize: '14px',
                outline: 'none',
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              color: '#00d4ff',
              fontSize: '10px',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}>
              CONTRASEÑA
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                border: '1px solid #00d4ff',
                color: '#fff',
                fontFamily: '"Space Mono", monospace',
                fontSize: '14px',
                outline: 'none',
              }}
              required
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '15px',
              background: '#00d4ff',
              color: '#020408',
              border: 'none',
              fontFamily: '"Space Mono", monospace',
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '3px',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fff'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#00d4ff'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            INICIAR SESIÓN // ACCESO ROOT
          </button>
        </form>

        <div style={{
          marginTop: '30px',
          textAlign: 'center',
          color: '#00d4ff',
          fontSize: '10px',
          opacity: 0.5,
        }}>
          [v5.0.1] NEO<span style={{color: '#fff'}}>OS</span> AUTHENTICATION LAYER
        </div>
      </div>
    </div>
  )
}
