'use client'
import { useState } from 'react'
import Link from 'next/link'

const mono = "'Space Mono', monospace"

// Pseudo-3D: NO se reescribe el juego ni los 29 niveles -- es el mismo
// iframe de siempre (/digiz/index.html), inclinado con un transform CSS
// 3D (perspective + rotateX) desde afuera. El control sigue siendo
// moveToPointer sobre el mouse/dedo real: los navegadores ya resuelven el
// hit-testing de eventos a través de la cadena de transforms del padre
// antes de entregarle al documento del iframe sus coordenadas LOCALES
// (no transformadas) -- así que adentro del iframe, Phaser sigue viendo
// las mismas coordenadas de siempre, sin ningún cálculo extra de nuestra
// parte. Verificado con Playwright antes de shippear esto.
export default function Digiz3D() {
  const [tilt, setTilt] = useState(24)

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'radial-gradient(ellipse at 50% 30%, #0a1420 0%, #000205 70%)',
      overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
      perspective: '1500px',
    }}>
      <div
        style={{
          width: '112vw', height: '112vh',
          transform: `rotateX(${tilt}deg) scale(1.08)`,
          transformStyle: 'preserve-3d',
          boxShadow: '0 60px 160px rgba(0,0,0,0.75)',
        }}
      >
        <iframe
          src="/digiz/index.html"
          title="Digiz 3D"
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          allow="autoplay"
        />
      </div>

      <Link className="tap-ext"
        href="/games/digiz"
        style={{
          position: 'absolute', top: 14, left: 14, zIndex: 10,
          fontFamily: mono, fontSize: 9, letterSpacing: 2, color: '#c8daf0',
          background: 'rgba(0,2,5,0.72)', border: '1px solid #4a608066',
          padding: '6px 12px', textDecoration: 'none', backdropFilter: 'blur(4px)',
        }}
      >
        ← 2D
      </Link>

      <div style={{
        position: 'absolute', bottom: 14, left: 14, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: mono, fontSize: 9, letterSpacing: 2, color: '#4a6080',
        background: 'rgba(0,2,5,0.72)', border: '1px solid #4a608066',
        padding: '8px 12px', backdropFilter: 'blur(4px)',
      }}>
        INCLINACIÓN
        <input
          type="range" min={0} max={45} value={tilt}
          onChange={(e) => setTilt(Number(e.target.value))}
          style={{ width: 120 }}
        />
      </div>
    </div>
  )
}
