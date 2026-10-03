'use client'

import { useState } from 'react'

const mono = "'Space Mono', monospace"
const COLOR = '#b400ff'
const BETS = [10, 25, 50, 100]
const RANK_LABELS: Record<number, string> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }
const SUITS = ['♠', '♥', '♦', '♣']

function rankLabel(n: number) {
  return RANK_LABELS[n] ?? String(n)
}

function drawCard() {
  return { rank: 2 + Math.floor(Math.random() * 13), suit: SUITS[Math.floor(Math.random() * SUITS.length)] }
}

export default function CardHighLow({
  balance, setBalance, getOddsBias, onRound,
}: {
  balance: number
  setBalance: (updater: number | ((prev: number) => number)) => void
  getOddsBias: () => number
  onRound: (won: boolean) => void
}) {
  const [current, setCurrent] = useState(drawCard)
  const [bet, setBet] = useState(25)
  const [revealing, setRevealing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [streak, setStreak] = useState(0)

  const guess = (direction: 'alta' | 'baja') => {
    if (revealing || balance < bet) return
    const oddsBias = getOddsBias()
    setRevealing(true)
    setMessage(null)
    setBalance(prev => prev - bet)

    setTimeout(() => {
      const next = drawCard()
      const correct = direction === 'alta' ? next.rank > current.rank : next.rank < current.rank
      const tie = next.rank === current.rank

      if (tie) {
        setBalance(prev => prev + bet)
        setMessage(`EMPATE // ${next.suit}${rankLabel(next.rank)} — se devuelve la apuesta`)
      } else if (correct) {
        const win = Math.round(bet * 1.9 * oddsBias)
        setBalance(prev => prev + win)
        setStreak(s => s + 1)
        setMessage(`${next.suit}${rankLabel(next.rank)} // ACERTASTE +${win}`)
      } else {
        setStreak(0)
        setMessage(`${next.suit}${rankLabel(next.rank)} // FALLASTE`)
      }
      if (!tie) onRound(correct)
      setCurrent(next)
      setRevealing(false)
    }, 550)
  }

  const noHigher = current.rank === 14
  const noLower = current.rank === 2

  return (
    <div style={{ border: `1px solid ${COLOR}33`, background: `${COLOR}08`, padding: '24px 20px' }}>
      <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, color: COLOR, marginBottom: 4 }}>
        CARTA_ALTA
      </div>
      <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: 1, color: '#4a6080', marginBottom: 18 }}>
        RACHA: {streak}
      </div>

      <div style={{
        display: 'flex', justifyContent: 'center', marginBottom: 20,
        background: '#000', border: `1px solid ${COLOR}44`, padding: '28px 0',
      }}>
        <div style={{
          fontSize: 44, color: current.suit === '♥' || current.suit === '♦' ? '#ff4d7a' : COLOR,
          textShadow: `0 0 16px ${COLOR}66`,
        }}>
          {current.suit}{rankLabel(current.rank)}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        {BETS.map(b => (
          <button
            key={b}
            onClick={() => setBet(b)}
            disabled={revealing}
            style={{
              fontFamily: mono, fontSize: 10, letterSpacing: 1, padding: '8px 14px', cursor: revealing ? 'default' : 'pointer',
              background: bet === b ? `${COLOR}33` : 'transparent', color: bet === b ? COLOR : '#8fb8d6',
              border: `1px solid ${bet === b ? COLOR : COLOR + '33'}`,
            }}
          >
            {b}¢
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => guess('baja')}
          disabled={revealing || balance < bet || noLower}
          style={{
            flex: 1, fontFamily: mono, fontSize: 11, letterSpacing: 2, padding: '14px',
            background: revealing || balance < bet || noLower ? 'transparent' : `${COLOR}1a`,
            color: revealing || balance < bet || noLower ? '#4a6080' : COLOR,
            border: `1px solid ${revealing || balance < bet || noLower ? '#4a6080' : COLOR}`,
            cursor: revealing || balance < bet || noLower ? 'not-allowed' : 'pointer',
          }}
        >
          ↓ MÁS BAJA
        </button>
        <button
          onClick={() => guess('alta')}
          disabled={revealing || balance < bet || noHigher}
          style={{
            flex: 1, fontFamily: mono, fontSize: 11, letterSpacing: 2, padding: '14px',
            background: revealing || balance < bet || noHigher ? 'transparent' : `${COLOR}1a`,
            color: revealing || balance < bet || noHigher ? '#4a6080' : COLOR,
            border: `1px solid ${revealing || balance < bet || noHigher ? '#4a6080' : COLOR}`,
            cursor: revealing || balance < bet || noHigher ? 'not-allowed' : 'pointer',
          }}
        >
          ↑ MÁS ALTA
        </button>
      </div>

      {balance < bet && (
        <div style={{ marginTop: 10, textAlign: 'center', fontFamily: mono, fontSize: 9, color: '#4a6080' }}>
          SALDO INSUFICIENTE
        </div>
      )}

      {message && (
        <div style={{
          marginTop: 14, textAlign: 'center', fontFamily: mono, fontSize: 10, letterSpacing: 1,
          color: message.includes('FALLASTE') ? '#4a6080' : '#00ff9d',
        }}>
          {message}
        </div>
      )}
    </div>
  )
}
