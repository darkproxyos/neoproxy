'use client'
import Link from 'next/link'

const mono = "'Space Mono', monospace"

// Juego legacy (Phaser 2, scripts globales por nivel -- 29 niveles, cada uno
// un archivo separado que asume las variables globales que arma index.js).
// Portarlo a componentes/ES-modules sería reescribir un juego entero sin
// necesidad real -- vive intacto en public/digiz/ y se embebe tal cual en un
// iframe del mismo origen, igual que corría standalone en GitHub Pages.
export default function DigizGame() {
  return (
    // 100vw/100vh explícitos, no inset:0 -- el layout global envuelve todo
    // en .neo-organism-filter (app/globals.css), que tiene un CSS `filter`
    // activo; eso convierte a ese div en el containing block de cualquier
    // position:fixed de acá adentro (mismo efecto que un transform), y como
    // no tiene una altura propia fijada, el fixed con inset:0 colapsaba a
    // 0px de alto -- el iframe (y el canvas de Phaser adentro) se achicaban
    // a la par. vw/vh ignoran ese containing block y miden el viewport real.
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000' }}>
      <iframe
        src="/digiz/index.html"
        title="Digiz"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        allow="autoplay"
      />
      <Link className="tap-ext"
        href="/games"
        style={{
          position: 'absolute', top: 14, left: 14, zIndex: 10,
          fontFamily: mono, fontSize: 9, letterSpacing: 2, color: '#c8daf0',
          background: 'rgba(0,2,5,0.72)', border: '1px solid #4a608066',
          padding: '6px 12px', textDecoration: 'none', backdropFilter: 'blur(4px)',
        }}
      >
        ← VOLVER
      </Link>
      <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 10, display: 'flex', gap: 8 }}>
        <Link
          href="/games/digiz/3d"
          style={{
            fontFamily: mono, fontSize: 9, letterSpacing: 2, color: '#00d4ff',
            background: 'rgba(0,2,5,0.72)', border: '1px solid #00d4ff66',
            padding: '6px 12px', textDecoration: 'none', backdropFilter: 'blur(4px)',
          }}
        >
          TILT 3D →
        </Link>
        <Link
          href="/games/digiz/babylon"
          style={{
            fontFamily: mono, fontSize: 9, letterSpacing: 2, color: '#00ffcc',
            background: 'rgba(0,2,5,0.72)', border: '1px solid #00ffcc66',
            padding: '6px 12px', textDecoration: 'none', backdropFilter: 'blur(4px)',
          }}
        >
          BABYLON 3D →
        </Link>
      </div>
    </div>
  )
}
