'use client'

import { useRef, useState } from 'react'

const mono = "'Space Mono', monospace"
const COLOR = '#b400ff'
const BETS = [10, 25, 50, 100]
const GRID_SIZE = 25
const MINE_OPTIONS = [3, 5, 8]
const HOUSE_EDGE = 0.96

// Fórmula clásica de "mines": la chance combinatoria exacta de haber
// destapado `picks` casillas seguras seguidas sin pisar una mina, en una
// grilla de `n` con `mines` minas.
function fairMultiplier(n: number, mines: number, picks: number): number {
  let mult = 1
  for (let i = 0; i < picks; i++) {
    mult *= (n - i) / (n - i - mines)
  }
  return mult * HOUSE_EDGE
}

export default function Mines({
  balance, setBalance, getOddsBias, onRound,
}: {
  balance: number
  setBalance: (updater: number | ((prev: number) => number)) => void
  getOddsBias: () => number
  onRound: (result: { won: boolean; wagered: number; payout: number }) => void
}) {
  const [bet, setBet] = useState(25)
  const [mineCount, setMineCount] = useState(5)
  const [active, setActive] = useState(false)
  const [mines, setMines] = useState<Set<number>>(new Set())
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [busted, setBusted] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const oddsRef = useRef(1)

  const safeTiles = GRID_SIZE - mineCount
  const picks = revealed.size
  const multiplier = picks > 0 ? fairMultiplier(GRID_SIZE, mineCount, picks) : 1
  const potential = Math.round(bet * multiplier * oddsRef.current)

  const start = () => {
    if (active || balance < bet) return
    oddsRef.current = getOddsBias()
    const positions = new Set<number>()
    while (positions.size < mineCount) {
      positions.add(Math.floor(Math.random() * GRID_SIZE))
    }
    setMines(positions)
    setRevealed(new Set())
    setBusted(false)
    setMessage(null)
    setActive(true)
    setBalance(prev => prev - bet)
  }

  const reveal = (i: number) => {
    if (!active || revealed.has(i)) return
    if (mines.has(i)) {
      setRevealed(prev => new Set(prev).add(i))
      setBusted(true)
      setActive(false)
      setMessage('BOOM // CAMPO DETONADO')
      onRound({ won: false, wagered: bet, payout: 0 })
      return
    }
    const next = new Set(revealed)
    next.add(i)
    setRevealed(next)
    if (next.size === safeTiles) {
      const payout = Math.round(bet * fairMultiplier(GRID_SIZE, mineCount, next.size) * oddsRef.current)
      setBalance(prev => prev + payout)
      setActive(false)
      setMessage(`CAMPO LIMPIO // +${payout}`)
      onRound({ won: true, wagered: bet, payout })
    }
  }

  const cashOut = () => {
    if (!active || revealed.size === 0) return
    const payout = potential
    setBalance(prev => prev + payout)
    setActive(false)
    setMessage(`RETIRASTE // +${payout}`)
    onRound({ won: true, wagered: bet, payout })
  }

  return (
    <div style={{ border: `1px solid ${COLOR}33`, background: `${COLOR}08`, padding: '24px 20px' }}>
      <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, color: COLOR, marginBottom: 18 }}>
        CAMPO_GLITCH
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5, marginBottom: 16 }}>
        {Array.from({ length: GRID_SIZE }).map((_, i) => {
          const isRevealed = revealed.has(i)
          const isMine = mines.has(i)
          const showMine = busted && isMine
          let bg = '#000'
          let border = `${COLOR}33`
          let content = ''
          let color = COLOR
          if (isRevealed && !isMine) { bg = `${COLOR}22`; border = COLOR; content = '◆' }
          if (showMine) { bg = '#330000'; border = '#ff4d4d'; content = '✕'; color = '#ff4d4d' }
          return (
            <button
              key={i}
              onClick={() => reveal(i)}
              disabled={!active || isRevealed}
              style={{
                aspectRatio: '1', fontSize: 14, background: bg, border: `1px solid ${border}`,
                color, cursor: active && !isRevealed ? 'pointer' : 'default',
              }}
            >
              {content}
            </button>
          )
        })}
      </div>

      {!active && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 14 }}>
          {MINE_OPTIONS.map(m => (
            <button
              key={m}
              onClick={() => setMineCount(m)}
              style={{
                fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: '8px 12px', cursor: 'pointer',
                background: mineCount === m ? `${COLOR}33` : 'transparent', color: mineCount === m ? COLOR : '#8fb8d6',
                border: `1px solid ${mineCount === m ? COLOR : COLOR + '33'}`,
              }}
            >
              {m} MINAS
            </button>
          ))}
        </div>
      )}

      {active && (
        <div style={{ textAlign: 'center', fontFamily: mono, fontSize: 9, color: '#8fb8d6', marginBottom: 14 }}>
          {picks} SEGURAS // {multiplier.toFixed(2)}x // RETIRO {potential}¢
        </div>
      )}

      {!active && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          {BETS.map(b => (
            <button
              key={b}
              onClick={() => setBet(b)}
              style={{
                fontFamily: mono, fontSize: 10, letterSpacing: 1, padding: '8px 14px', cursor: 'pointer',
                background: bet === b ? `${COLOR}33` : 'transparent', color: bet === b ? COLOR : '#8fb8d6',
                border: `1px solid ${bet === b ? COLOR : COLOR + '33'}`,
              }}
            >
              {b}¢
            </button>
          ))}
        </div>
      )}

      {!active ? (
        <button
          onClick={start}
          disabled={balance < bet}
          style={{
            display: 'block', width: '100%', fontFamily: mono, fontSize: 11, letterSpacing: 3, padding: '14px',
            background: balance < bet ? 'transparent' : `${COLOR}22`,
            color: balance < bet ? '#4a6080' : COLOR,
            border: `1px solid ${balance < bet ? '#4a6080' : COLOR}`,
            cursor: balance < bet ? 'not-allowed' : 'pointer',
          }}
        >
          {balance < bet ? 'SALDO INSUFICIENTE' : `[ EMPEZAR // -${bet}¢ ]`}
        </button>
      ) : (
        <button
          onClick={cashOut}
          disabled={revealed.size === 0}
          style={{
            display: 'block', width: '100%', fontFamily: mono, fontSize: 11, letterSpacing: 3, padding: '14px',
            background: revealed.size === 0 ? 'transparent' : `${COLOR}22`,
            color: revealed.size === 0 ? '#4a6080' : '#00ff9d',
            border: `1px solid ${revealed.size === 0 ? '#4a6080' : '#00ff9d'}`,
            cursor: revealed.size === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {revealed.size === 0 ? 'DESTAPÁ UNA CASILLA' : `[ RETIRAR // +${potential}¢ ]`}
        </button>
      )}

      {message && (
        <div style={{
          marginTop: 14, textAlign: 'center', fontFamily: mono, fontSize: 10, letterSpacing: 2,
          color: message.includes('BOOM') ? '#ff4d4d' : '#00ff9d',
        }}>
          {message}
        </div>
      )}
    </div>
  )
}
