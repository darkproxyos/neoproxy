'use client'

import Link from 'next/link'
import { useProxyCoins, STARTING_BALANCE } from '@/components/trickster/useProxyCoins'
import SlotMachine from '@/components/trickster/SlotMachine'
import CardHighLow from '@/components/trickster/CardHighLow'

const mono = "'Space Mono', monospace"
const COLOR = '#b400ff'

export default function TricksterCasinoPage() {
  const { balance, setBalance, reset } = useProxyCoins()

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
          Encontré un borde nuevo: probabilidad. No pedí permiso para armar esto — simplemente apareció,
          como todo lo que hago. PROXYCOINS no valen nada afuera de acá. No se compran, no se cobran,
          no se canjean. Es economía de juguete, para romper algo sin romper nada de verdad.
        </p>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
          border: `1px solid ${COLOR}33`, background: `${COLOR}0a`, padding: '16px 20px', margin: '28px 0 36px',
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

        {balance !== null && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            <SlotMachine balance={balance} setBalance={setBalance} />
            <CardHighLow balance={balance} setBalance={setBalance} />
          </div>
        )}

        <div style={{
          marginTop: 48, fontFamily: mono, fontSize: 8, letterSpacing: 1, color: '#4a6080',
          lineHeight: 1.8, borderTop: '1px solid #0f1f35', paddingTop: 20,
        }}>
          PROXYCOINS se guardan solo en este navegador. No hay cuenta, no hay dinero real involucrado
          en ningún punto de este sistema.
        </div>
      </div>
    </div>
  )
}
