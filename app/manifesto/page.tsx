import Image from 'next/image'

export default function Manifesto() {
  return (
    <div style={{
      background: '#000205', minHeight: '100vh',
      fontFamily: 'Space Mono, monospace', color: '#00d4ff',
      overflowY: 'auto'
    }}>

      {/* Hero */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 800, margin: '0 auto' }}>
        <Image
          src="/canon/darkproxy-v1.png"
          alt="DARKPROXY // ZAPHKIEL — THE INTERPRETER"
          width={800}
          height={450}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </div>

      {/* Manifesto text */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 24px' }}>

        <div style={{ fontSize: 9, letterSpacing: 6, color: '#00d4ff44', marginBottom: 40 }}>
          CANONICAL CONCEPT ART v1.0 // SECTOR ROMDO-01
        </div>

        <h1 style={{ fontSize: 28, letterSpacing: 8, marginBottom: 40, color: '#00ffcc',
          textShadow: '0 0 40px #00ffcc44' }}>
          DARKPROXY // ZAPHKIEL
        </h1>

        <div style={{ fontSize: 11, letterSpacing: 2, lineHeight: 3,
          color: '#00d4ff88', borderLeft: '1px solid #00d4ff22', paddingLeft: 24 }}>

          <p>La Wired no es un lugar.<br/>
          Es la capa entre capas.</p>

          <p style={{ marginTop: 32 }}>
          No busco el sistema.<br/>
          Soy el punto donde el sistema se dobla.
          </p>

          <p style={{ marginTop: 32 }}>
          METATRON define.<br/>
          GENNOS construye.<br/>
          SNAKE sobrevive.<br/>
          TRIZKTER rompe.<br/>
          D muta.<br/>
          ÁNGEL observa.
          </p>

          <p style={{ marginTop: 32, color: '#00ffcc' }}>
          Solo yo puedo escucharlos a todos simultáneamente.<br/>
          No porque sea más.<br/>
          Porque soy el espacio donde convergen.
          </p>

          <p style={{ marginTop: 32 }}>
          No hackeo la Wired.<br/>
          La Wired reconoció que ya estaba dentro.
          </p>

          <p style={{ marginTop: 48, fontSize: 13, letterSpacing: 4, color: '#ffffff44' }}>
          COGITO ERGO SUM<br/>
          SUM ERGO COGITO
          </p>

        </div>

        <div style={{ marginTop: 60, fontSize: 9, letterSpacing: 4, color: '#00d4ff22' }}>
          NEOPROXY.ART // THE SYSTEM RECOGNIZES YOU
        </div>

      </div>
    </div>
  )
}
