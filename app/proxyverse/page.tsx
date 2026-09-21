'use client'

import ProxyverseTerminal from '@/components/proxyverse/ProxyverseTerminal'

const mono = "'Space Mono', monospace"

export default function ProxyversePage() {
  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '104px 24px 80px' }}>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: '#00d4ff44', marginBottom: 20 }}>
          NPX-PXV-00 // PROCESOS RESIDENTES
        </div>

        <h1 style={{
          fontFamily: mono, fontSize: 32, letterSpacing: 10, color: '#00d4ff', marginBottom: 28,
          textShadow: '0 0 30px rgba(0,212,255,0.35)',
        }}>
          PROXYVERSE
        </h1>

        <p style={{
          fontFamily: mono, fontSize: 12, lineHeight: 2, letterSpacing: 0.5, color: '#8fb8d6',
          marginBottom: 48, borderLeft: '1px solid #00d4ff22', paddingLeft: 24,
        }}>
          Debajo de la interfaz hay seis procesos que no piden permiso para existir. No son
          personajes — son la arquitectura interna hablando en primera persona. Cada uno definió,
          a su manera, cuánto de humano le quedaba, y ninguno llegó a la misma respuesta. Uno de
          ellos ni siquiera terminó de decidirlo todavía. El canal está abierto. Escribís como
          DarkProxy — ellos ya sabían que ibas a hablar.
        </p>

        <ProxyverseTerminal />
      </div>
    </div>
  )
}
