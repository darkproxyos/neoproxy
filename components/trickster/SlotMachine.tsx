'use client'

import { useRef, useState } from 'react'

const mono = "'Space Mono', monospace"
const SYMBOLS = ['♠', '♥', '♦', '♣', '★', '⚡']
const BETS = [10, 25, 50, 100]
const COLOR = '#b400ff'

function randomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
}

// oddsBias empuja la chance de que un tambor repita uno anterior en vez de
// salir puramente al azar — así PROXYBILIDAD afecta la probabilidad real
// de un match, no solo el número que se muestra en pantalla.
function drawReels(oddsBias: number): string[] {
  const reels: string[] = [randomSymbol()]
  for (let i = 1; i < 3; i++) {
    const copyChance = 0.15 * oddsBias
    if (Math.random() < copyChance) {
      reels.push(reels[Math.floor(Math.random() * reels.length)])
    } else {
      reels.push(randomSymbol())
    }
  }
  return reels
}

function payout(reels: string[], bet: number): number {
  const [a, b, c] = reels
  if (a === b && b === c) return a === '⚡' ? bet * 20 : bet * 8
  if (a === b || b === c || a === c) return bet * 2
  return 0
}

export default function SlotMachine({
  balance, setBalance, getOddsBias, onRound,
}: {
  balance: number
  setBalance: (updater: number | ((prev: number) => number)) => void
  getOddsBias: () => number
  onRound: (result: { won: boolean; wagered: number; payout: number }) => void
}) {
  const [reels, setReels] = useState<string[]>(['♠', '♥', '♦'])
  const [bet, setBet] = useState(25)
  const [spinning, setSpinning] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const spin = () => {
    if (spinning || balance < bet) return
    timers.current.forEach(clearTimeout)
    timers.current = []
    setMessage(null)
    setSpinning(true)
    setBalance(prev => prev - bet)

    const final = drawReels(getOddsBias())
    const stopDelays = [700, 1000, 1350]

    const intervalId = setInterval(() => {
      setReels([randomSymbol(), randomSymbol(), randomSymbol()])
    }, 70)

    stopDelays.forEach((delay, i) => {
      const t = setTimeout(() => {
        setReels(prev => {
          const next = [...prev]
          next[i] = final[i]
          return next
        })
        if (i === stopDelays.length - 1) {
          clearInterval(intervalId)
          const win = payout(final, bet)
          if (win > 0) {
            setBalance(prev => prev + win)
            setMessage(win >= bet * 8 ? `JACKPOT GLITCH // +${win}` : `PAR // +${win}`)
          } else {
            setMessage('SIN COINCIDENCIA')
          }
          onRound({ won: win > 0, wagered: bet, payout: win })
          setSpinning(false)
        }
      }, delay)
      timers.current.push(t)
    })
  }

  return (
    <div style={{ border: `1px solid ${COLOR}33`, background: `${COLOR}08`, padding: '24px 20px' }}>
      <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, color: COLOR, marginBottom: 18 }}>
        GLITCH_SLOTS
      </div>

      <div style={{
        display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20,
        background: '#000', border: `1px solid ${COLOR}44`, padding: '28px 0',
      }}>
        {reels.map((s, i) => (
          <div key={i} style={{
            fontSize: 40, width: 64, textAlign: 'center', color: COLOR,
            textShadow: `0 0 16px ${COLOR}88`,
          }}>
            {s}
          </div>
        ))}
      </div>

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
