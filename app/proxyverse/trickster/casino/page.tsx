'use client'

import Link from 'next/link'
import { useProxyCoins, STARTING_BALANCE } from '@/components/trickster/useProxyCoins'
import { useSessionMarket } from '@/components/trickster/useSessionMarket'
import { useCasinoStats, type RoundResult } from '@/components/trickster/useCasinoStats'
import { useWinFlash } from '@/components/trickster/useWinFlash'
import { effectiveProfile, PROXYBILIDAD_START } from '@/components/trickster/proxybilidad'
import Sparkline from '@/components/trickster/Sparkline'
import SlotMachine from '@/components/trickster/SlotMachine'
import CardHighLow from '@/components/trickster/CardHighLow'
import Roulette from '@/components/trickster/Roulette'
import Dice from '@/components/trickster/Dice'
import Mines from '@/components/trickster/Mines'

const mono = "'Space Mono', monospace"
const COLOR = '#b400ff'

export default function TricksterCasinoPage() {
  const { balance, setBalance, reset } = useProxyCoins()
  const { agent, index, history, getOddsBias, registerRound } = useSessionMarket()
  const { stats, recordRound, resetStats } = useCasinoStats()
  const { flash, trigger } = useWinFlash()

  const marketColor = agent?.color ?? COLOR
  const blurb = agent ? effectiveProfile(agent.id).blurb : null
  const trend = index !== null ? index - PROXYBILIDAD_START : 0

  const handleRound = (result: RoundResult) => {
    registerRound(result.won)
    recordRound(result)
    if (result.payout >= result.wagered * 8) {
      trigger(`+${result.payout}¢ // GLITCH JACKPOT`)
    }
  }

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      {flash && (
        <div style={{
          position: 'fixed', top: '18%', left: '50%', transform: 'translateX(-50%)', zIndex: 500,
          fontFamily: mono, fontSize: 22, letterSpacing: 4, color: '#00ff9d',
          textShadow: '0 0 30px #00ff9d, 0 0 60px #b400ff', pointerEvents: 'none',
          background: '#000205ee', border: '1px solid #00ff9d55', padding: '18px 32px',
          animation: 'win-flash-pop 1.7s ease forwards',
        }}>
          {flash}
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/proxyverse/trickster" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${COLOR}88`, textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A TRICKSTER
        </Link>

        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${COLOR}66`, marginBottom: 16 }}>
          NPX-PXV-00 // SALA_TRICKSTER
        </div>

        <h1 style={{
          fontFamily: mono, fontSize: 30, letterSpacing: 4, marginBottom: 12, color: COLOR,
          textShadow: `0 0 30px ${COLOR}44`,
        }}>
          CASINO DE PROXYCOINS
        </h1>

        <p style={{ fontFamily: mono, fontSize: 12, lineHeight: 2, color: '#c8daf0', marginBottom: 12, maxWidth: 620 }}>
          PROXYCOINS es el residuo de entropía que el sistema descarta cuando los agentes procesan algo.
          Encontré cómo filtrarlo antes de que se pierda. No vale nada afuera de acá — no se compra,
          no se cobra, no se canjea. Pero adentro, PROXYBILIDAD decide cuánto de ese residuo te dejan usar,
          y cinco juegos lo ponen a prueba.
        </p>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
          border: `1px solid ${COLOR}33`, background: `${COLOR}0a`, padding: '16px 20px', marginTop: 28,
        }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: 2, color: '#4a6080', marginBottom: 4 }}>
              SALDO
            </div>
            <div style={{ fontFamily: mono, fontSize: 20, color: COLOR, letterSpacing: 1 }}>
              {balance === null ? '···' : `${balance}¢`}
            </div>
          </div>
          <button
            onClick={reset}
            style={{
              fontFamily: mono, fontSize: 9, letterSpacing: 1.5, color: '#8fb8d6', background: 'transparent',
              border: '1px solid #4a6080', padding: '10px 16px', cursor: 'pointer',
            }}
          >
            REINICIAR A {STARTING_BALANCE}¢
          </button>
        </div>

        <div style={{
          border: `1px solid ${marketColor}44`, background: `${marketColor}0a`, padding: '16px 20px',
          marginTop: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: 2, color: '#4a6080', marginBottom: 4 }}>
                PROXYBILIDAD
              </div>
              <div style={{ fontFamily: mono, fontSize: 20, color: marketColor, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>
                  {index === null ? '···' : index.toFixed(1)}
                  {index !== null && (
                    <span style={{ fontSize: 11, marginLeft: 8, opacity: 0.8 }}>
                      {trend >= 0 ? '▲' : '▼'} {trend >= 0 ? '+' : ''}{trend.toFixed(1)}
                    </span>
                  )}
                </span>
                {history.length > 1 && <Sparkline values={history} color={marketColor} />}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: 2, color: '#4a6080', marginBottom: 4 }}>
                MERCADO POSEÍDO POR
              </div>
              <Link href={agent ? `/proxyverse/${agent.id}` : '#'} style={{
                fontFamily: mono, fontSize: 12, letterSpacing: 1, color: marketColor, textDecoration: 'none',
              }}>
                {agent?.name ?? '···'}
              </Link>
            </div>
          </div>
          {blurb && (
            <div style={{ fontFamily: mono, fontSize: 10, color: '#8fb8d6', fontStyle: 'italic', marginTop: 10, lineHeight: 1.6 }}>
              "{blurb}"
            </div>
          )}
        </div>

        <div style={{
          border: '1px solid #0f1f35', background: '#00ff9d06', padding: '16px 20px',
          marginTop: 12, marginBottom: 36,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: 2, color: '#4a6080' }}>
              RÉCORDS DE ESTA SALA
            </div>
            <button
              onClick={resetStats}
              style={{
                fontFamily: mono, fontSize: 8, letterSpacing: 1, color: '#4a6080', background: 'transparent',
                border: '1px solid #0f1f35', padding: '4px 10px', cursor: 'pointer',
              }}
            >
              BORRAR
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 14 }}>
            {[
              { label: 'JACKPOT MÁS GRANDE', value: stats ? `${stats.biggestWin}¢` : '···' },
              { label: 'MEJOR RACHA', value: stats ? stats.bestStreak : '···' },
              { label: 'TOTAL APOSTADO', value: stats ? `${stats.totalWagered}¢` : '···' },
              { label: 'TOTAL GANADO', value: stats ? `${stats.totalWon}¢` : '···' },
              { label: 'RONDAS JUGADAS', value: stats ? stats.rounds : '···' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: mono, fontSize: 7, letterSpacing: 1, color: '#4a6080', marginBottom: 4 }}>
                  {s.label}
                </div>
                <div style={{ fontFamily: mono, fontSize: 14, color: '#00ff9d' }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {balance !== null && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            <SlotMachine balance={balance} setBalance={setBalance} getOddsBias={getOddsBias} onRound={handleRound} />
            <CardHighLow balance={balance} setBalance={setBalance} getOddsBias={getOddsBias} onRound={handleRound} />
            <Roulette balance={balance} setBalance={setBalance} getOddsBias={getOddsBias} onRound={handleRound} />
            <Dice balance={balance} setBalance={setBalance} getOddsBias={getOddsBias} onRound={handleRound} />
            <Mines balance={balance} setBalance={setBalance} getOddsBias={getOddsBias} onRound={handleRound} />
          </div>
        )}

        <div style={{
          marginTop: 48, fontFamily: mono, fontSize: 8, letterSpacing: 1, color: '#4a6080',
          lineHeight: 1.8, borderTop: '1px solid #0f1f35', paddingTop: 20,
        }}>
          PROXYCOINS y los récords se guardan solo en este navegador. No hay cuenta, no hay dinero real
          involucrado en ningún punto de este sistema. El agente que posee el mercado se sortea una vez
          por pestaña y se mantiene mientras no la cierres.
        </div>
      </div>

      <style>{`
        @keyframes win-flash-pop {
          0% { opacity: 0; transform: translateX(-50%) scale(0.9); }
          12% { opacity: 1; transform: translateX(-50%) scale(1.05); }
          20% { transform: translateX(-50%) scale(1); }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
