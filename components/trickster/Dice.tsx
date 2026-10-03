'use client'

import { useRef, useState } from 'react'

const mono = "'Space Mono', monospace"
const COLOR = '#b400ff'
const BETS = [10, 25, 50, 100]
const HOUSE_EDGE = 0.95
const MIN_THRESHOLD = 5
const MAX_THRESHOLD = 95

type Direction = 'bajo' | 'alto'

function winChance(threshold: number, direction: Direction): number {
  return direction === 'bajo' ? (threshold - 1) / 100 : (100 - threshold) / 100
}

function multiplierFor(threshold: number, direction: Direction): number {
  return HOUSE_EDGE / winChance(threshold, direction)
}

export default function Dice({
  balance, setBalance, getOddsBias, onRound,
}: {
  balance: number
  setBalance: (updater: number | ((prev: number) => number)) => void
  getOddsBias: () => number
  onRound: (result: { won: boolean; wagered: number; payout: number }) => void
}) {
  const [roll, setRoll] = useState<number | null>(null)
  const [bet, setBet] = useState(25)
  const [threshold, setThreshold] = useState(50)
  const [direction, setDirection] = useState<Direction>('alto')
  const [rolling, setRolling] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const chance = winChance(threshold, direction)
  const multiplier = multiplierFor(threshold, direction)

  const rollDice = () => {
    if (rolling || balance < bet) return
    if (timer.current) clearTimeout(timer.current)
    const oddsBias = getOddsBias()
    setMessage(null)
    setRolling(true)
    setBalance(prev => prev - bet)

    const final = 1 + Math.floor(Math.random() * 100)
    const cycleId = setInterval(() => setRoll(1 + Math.floor(Math.random() * 100)), 50)

    timer.current = setTimeout(() => {
      clearInterval(cycleId)
      setRoll(final)
      const won = direction === 'bajo' ? final < threshold : final > threshold
      const payout = won ? Math.round(bet * multiplier * oddsBias) : 0
      if (won) {
        setBalance(prev => prev + payout)
        setMessage(`${final} // ACERTASTE +${payout}`)
      } else {
        setMessage(`${final} // SIN PREMIO`)
      }
      onRound({ won, wagered: bet, payout })
      setRolling(false)
    }, 1100)
  }

  return (
    <div style={{ border: `1px solid ${COLOR}33`, background: `${COLOR}08`, padding: '24px 20px' }}>
      <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, color: COLOR, marginBottom: 18 }}>
        DADOS_ENTROPÍA
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20,
        background: '#000', border: `1px solid ${COLOR}44`, padding: '28px 0',
      }}>
        <div style={{
          fontSize: 40, width: 96, textAlign: 'center', color: COLOR, textShadow: `0 0 16px ${COLOR}88`,
        }}>
          {roll === null ? '--' : roll}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 14 }}>
        <button
          onClick={() => setDirection('bajo')}
          disabled={rolling}
          style={{
            fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '8px 14px', cursor: rolling ? 'default' : 'pointer',
            background: direction === 'bajo' ? `${COLOR}33` : 'transparent', color: direction === 'bajo' ? COLOR : '#8fb8d6',
            border: `1px solid ${direction === 'bajo' ? COLOR : COLOR + '33'}`,
          }}
        >
          ↓ BAJO {threshold}
        </button>
        <button
          onClick={() => setDirection('alto')}
          disabled={rolling}
          style={{
            fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '8px 14px', cursor: rolling ? 'default' : 'pointer',
            background: direction === 'alto' ? `${COLOR}33` : 'transparent', color: direction === 'alto' ? COLOR : '#8fb8d6',
            border: `1px solid ${direction === 'alto' ? COLOR : COLOR + '33'}`,
          }}
        >
          ↑ ALTO {threshold}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, justifyContent: 'center' }}>
        <span style={{ fontFamily: mono, fontSize: 8, color: '#4a6080' }}>UMBRAL</span>
        <input
          type="range" min={MIN_THRESHOLD} max={MAX_THRESHOLD} value={threshold}
          disabled={rolling}
          onChange={e => setThreshold(Number(e.target.value))}
          style={{ width: 140 }}
        />
        <span style={{ fontFamily: mono, fontSize: 11, color: COLOR, width: 24, display: 'inline-block' }}>
          {threshold}
        </span>
      </div>

      <div style={{ textAlign: 'center', fontFamily: mono, fontSize: 9, color: '#8fb8d6', marginBottom: 16 }}>
        CHANCE {(chance * 100).toFixed(0)}% // PAGO {multiplier.toFixed(2)}x
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        {BETS.map(b => (
          <button
            key={b}
            onClick={() => setBet(b)}
            disabled={rolling}
            style={{
              fontFamily: mono, fontSize: 10, letterSpacing: 1, padding: '8px 14px', cursor: rolling ? 'default' : 'pointer',
              background: bet === b ? `${COLOR}33` : 'transparent', color: bet === b ? COLOR : '#8fb8d6',
              border: `1px solid ${bet === b ? COLOR : COLOR + '33'}`,
            }}
          >
            {b}¢
          </button>
        ))}
      </div>

      <button
        onClick={rollDice}
        disabled={rolling || balance < bet}
        style={{
          display: 'block', width: '100%', fontFamily: mono, fontSize: 11, letterSpacing: 3, padding: '14px',
          background: rolling || balance < bet ? 'transparent' : `${COLOR}22`,
          color: rolling || balance < bet ? '#4a6080' : COLOR,
          border: `1px solid ${rolling || balance < bet ? '#4a6080' : COLOR}`,
          cursor: rolling || balance < bet ? 'not-allowed' : 'pointer',
        }}
      >
        {rolling ? 'TIRANDO...' : balance < bet ? 'SALDO INSUFICIENTE' : `[ TIRAR // -${bet}¢ ]`}
      </button>

      {message && (
        <div style={{
          marginTop: 14, textAlign: 'center', fontFamily: mono, fontSize: 10, letterSpacing: 2,
          color: message.includes('SIN') ? '#4a6080' : '#00ff9d',
        }}>
          {message}
        </div>
      )}
    </div>
  )
}
