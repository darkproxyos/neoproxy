'use client'

import Link from 'next/link'
import { useProxyCoins, STARTING_BALANCE } from '@/components/trickster/useProxyCoins'
import { useSessionMarket } from '@/components/trickster/useSessionMarket'
import { effectiveProfile, PROXYBILIDAD_START } from '@/components/trickster/proxybilidad'
import SlotMachine from '@/components/trickster/SlotMachine'
import CardHighLow from '@/components/trickster/CardHighLow'

const mono = "'Space Mono', monospace"
const COLOR = '#b400ff'

export default function TricksterCasinoPage() {
  const { balance, setBalance, reset } = useProxyCoins()
  const { agent, index, getOddsBias, registerRound } = useSessionMarket()

  const marketColor = agent?.color ?? COLOR
  const blurb = agent ? effectiveProfile(agent.id).blurb : null
  const trend = index !== null ? index - PROXYBILIDAD_START : 0

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto', padding: '104px 24px 80px' }}>
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

        <p style={{ fontFamily: mono, fontSize: 12, lineHeight: 2, color: '#c8daf0', marginBottom: 12, maxWidth: 560 }}>
          PROXYCOINS es el residuo de entropía que el sistema descarta cuando los agentes procesan algo.
          Encontré cómo filtrarlo antes de que se pierda. No vale nada afuera de acá — no se compra,
          no se cobra, no se canjea. Pero adentro, PROXYBILIDAD decide cuánto de ese residuo te dejan usar.
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
          marginTop: 12, marginBottom: 36,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: 2, color: '#4a6080', marginBottom: 4 }}>
                PROXYBILIDAD
              </div>
              <div style={{ fontFamily: mono, fontSize: 20, color: marketColor, letterSpacing: 1 }}>
                {index === null ? '···' : index.toFixed(1)}
                {index !== null && (
                  <span style={{ fontSize: 11, marginLeft: 8, opacity: 0.8 }}>
                    {trend >= 0 ? '▲' : '▼'} {trend >= 0 ? '+' : ''}{trend.toFixed(1)}
                  </span>
                )}
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

        {balance !== null && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            <SlotMachine balance={balance} setBalance={setBalance} getOddsBias={getOddsBias} onRound={registerRound} />
            <CardHighLow balance={balance} setBalance={setBalance} getOddsBias={getOddsBias} onRound={registerRound} />
          </div>
        )}

        <div style={{
          marginTop: 48, fontFamily: mono, fontSize: 8, letterSpacing: 1, color: '#4a6080',
          lineHeight: 1.8, borderTop: '1px solid #0f1f35', paddingTop: 20,
        }}>
          PROXYCOINS se guardan solo en este navegador. No hay cuenta, no hay dinero real involucrado
          en ningún punto de este sistema. El agente que posee el mercado se sortea una vez por pestaña
          y se mantiene mientras no la cierres.
        </div>
      </div>
    </div>
  )
}
