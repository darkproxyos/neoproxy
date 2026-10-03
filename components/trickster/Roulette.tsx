'use client'

import { useRef, useState } from 'react'

const mono = "'Space Mono', monospace"
const COLOR = '#b400ff'
const SIGNAL = '#00d4ff'
const GLITCH = '#b400ff'
const NULL_COLOR = '#00ff9d'
const BETS = [10, 25, 50, 100]

// Mismo mapeo de la ruleta europea clásica (1-36), reetiquetado: en vez de
// rojo/negro, SIGNAL/GLITCH. El 0 es NULL — no paga color ni paridad.
const SIGNAL_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])

type BetType = 'signal' | 'glitch' | 'par' | 'impar' | 'numero'

function numberColor(n: number): string {
  if (n === 0) return NULL_COLOR
  return SIGNAL_NUMBERS.has(n) ? SIGNAL : GLITCH
}

export default function Roulette({
  balance, setBalance, getOddsBias, onRound,
}: {
  balance: number
  setBalance: (updater: number | ((prev: number) => number)) => void
  getOddsBias: () => number
  onRound: (result: { won: boolean; wagered: number; payout: number }) => void
}) {
  const [result, setResult] = useState<number | null>(null)
  const [bet, setBet] = useState(25)
  const [betType, setBetType] = useState<BetType>('signal')
  const [targetNumber, setTargetNumber] = useState(7)
  const [spinning, setSpinning] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const spin = () => {
    if (spinning || balance < bet) return
    if (timer.current) clearTimeout(timer.current)
    const oddsBias = getOddsBias()
    setMessage(null)
    setSpinning(true)
    setBalance(prev => prev - bet)

    const final = Math.floor(Math.random() * 37)
    const cycleId = setInterval(() => setResult(Math.floor(Math.random() * 37)), 60)

    timer.current = setTimeout(() => {
      clearInterval(cycleId)
      setResult(final)

      let won = false
      let payout = 0
      if (betType === 'numero') {
        won = final === targetNumber
        payout = won ? Math.round(bet * 35 * oddsBias) : 0
      } else if (betType === 'par') {
        won = final !== 0 && final % 2 === 0
        payout = won ? Math.round(bet * 2 * oddsBias) : 0
      } else if (betType === 'impar') {
        won = final !== 0 && final % 2 === 1
        payout = won ? Math.round(bet * 2 * oddsBias) : 0
      } else {
        const wantSignal = betType === 'signal'
        won = final !== 0 && (SIGNAL_NUMBERS.has(final) === wantSignal)
        payout = won ? Math.round(bet * 2 * oddsBias) : 0
      }

      if (won) {
        setBalance(prev => prev + payout)
        setMessage(`${final} // ACERTASTE +${payout}`)
      } else {
        setMessage(`${final} // SIN PREMIO`)
      }
      onRound({ won, wagered: bet, payout })
      setSpinning(false)
    }, 1600)
  }

  const betOptions: { id: BetType; label: string; payout: string }[] = [
    { id: 'signal', label: 'SIGNAL', payout: '2x' },
    { id: 'glitch', label: 'GLITCH', payout: '2x' },
    { id: 'par', label: 'PAR', payout: '2x' },
    { id: 'impar', label: 'IMPAR', payout: '2x' },
    { id: 'numero', label: 'NÚMERO', payout: '35x' },
  ]

  return (
    <div style={{ border: `1px solid ${COLOR}33`, background: `${COLOR}08`, padding: '24px 20px' }}>
      <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, color: COLOR, marginBottom: 18 }}>
        RULETA_ONTOLÓGICA
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20,
        background: '#000', border: `1px solid ${COLOR}44`, padding: '28px 0',
      }}>
        <div style={{
          fontSize: 40, width: 72, textAlign: 'center',
          color: result === null ? '#4a6080' : numberColor(result),
          textShadow: result === null ? 'none' : `0 0 16px ${numberColor(result)}88`,
        }}>
          {result === null ? '--' : result}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        {betOptions.map(opt => (
          <button
            key={opt.id}
            onClick={() => setBetType(opt.id)}
            disabled={spinning}
            style={{
              fontFamily: mono, fontSize: 9, letterSpacing: 0.5, padding: '8px 10px', cursor: spinning ? 'default' : 'pointer',
              background: betType === opt.id ? `${COLOR}33` : 'transparent',
              color: betType === opt.id ? COLOR : '#8fb8d6',
              border: `1px solid ${betType === opt.id ? COLOR : COLOR + '33'}`,
            }}
          >
            {opt.label} <span style={{ opacity: 0.6 }}>{opt.payout}</span>
          </button>
        ))}
      </div>

      {betType === 'numero' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontFamily: mono, fontSize: 9, color: '#8fb8d6' }}>APOSTAR AL</span>
          <input
            type="number" min={0} max={36} value={targetNumber}
            disabled={spinning}
            onChange={e => setTargetNumber(Math.min(36, Math.max(0, Number(e.target.value) || 0)))}
            style={{
              width: 56, fontFamily: mono, fontSize: 12, color: COLOR, background: '#000',
              border: `1px solid ${COLOR}44`, padding: '6px 8px', textAlign: 'center',
            }}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        {BETS.map(b => (
          <button
            key={b}
            onClick={() => setBet(b)}
            disabled={spinning}
            style={{
              fontFamily: mono, fontSize: 10, letterSpacing: 1, padding: '8px 14px', cursor: spinning ? 'default' : 'pointer',
              background: bet === b ? `${COLOR}33` : 'transparent', color: bet === b ? COLOR : '#8fb8d6',
              border: `1px solid ${bet === b ? COLOR : COLOR + '33'}`,
            }}
          >
            {b}¢
          </button>
        ))}
      </div>

      <button
        onClick={spin}
        disabled={spinning || balance < bet}
        style={{
          display: 'block', width: '100%', fontFamily: mono, fontSize: 11, letterSpacing: 3, padding: '14px',
          background: spinning || balance < bet ? 'transparent' : `${COLOR}22`,
          color: spinning || balance < bet ? '#4a6080' : COLOR,
          border: `1px solid ${spinning || balance < bet ? '#4a6080' : COLOR}`,
          cursor: spinning || balance < bet ? 'not-allowed' : 'pointer',
        }}
      >
        {spinning ? 'GIRANDO...' : balance < bet ? 'SALDO INSUFICIENTE' : `[ GIRAR // -${bet}¢ ]`}
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
