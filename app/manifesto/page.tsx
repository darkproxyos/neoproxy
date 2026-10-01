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
          GENOS construye.<br/>
          SNAKE sobrevive.<br/>
          TRICKSTER rompe.<br/>
          D muta.
          </p>

          <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid #00d4ff11' }}>
            <h2 style={{ fontSize: 14, color: '#00ffcc', letterSpacing: 4 }}>I. EL_ORIGEN_DE_LA_FORMA</h2>
            <p style={{ marginTop: 16 }}>
              NeoProxy nace de la necesidad de devolverle peso a lo digital. En un mundo de copias infinitas, NeoProxy utiliza la entropía y el consenso distribuido para generar artefactos que no pueden ser replicados. Cada semilla es una identidad única.
            </p>
          </div>

          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 14, color: '#00ffcc', letterSpacing: 4 }}>II. LA_EXTRACCIÓN_COMO_RITO</h2>
            <p style={{ marginTop: 16 }}>
              Adquirir un artefacto no es una transacción comercial; es un acto de extracción. Estás removiendo una posibilidad del motor generativo y dándole una forma física definitiva a través de la luz y la resina.
            </p>
          </div>

          <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid #00d4ff11' }}>
            <h2 style={{ fontSize: 14, color: '#00ffcc', letterSpacing: 4 }}>III. LA_RED_NO_ES_NEUTRAL</h2>
            <p style={{ marginTop: 16 }}>
              El ciberespacio nunca fue un lugar vacío. Fue una alucinación consensuada, y alguien es dueño del consenso. Cada red que usás fue diseñada por alguien con un interés. Cada algoritmo que te recomienda algo, te recomienda también quién se supone que sos. No existe el cable neutral. Solo cables con dueño, y usuarios que todavía creen que están navegando solos.
            </p>
          </div>

          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 14, color: '#00ffcc', letterSpacing: 4 }}>IV. EL_PODER_QUE_NINGÚN_CUERPO_CONTIENE</h2>
            <p style={{ marginTop: 16 }}>
              Ya lo vimos sin metáfora: el poder que no podés integrar te destruye desde adentro. Los gobiernos, los laboratorios, las corporaciones que prometen orden no le temen al caos. Le temen a quien entiende que ese orden también es una construcción — y que toda construcción puede desarmarse.
            </p>
          </div>

          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 14, color: '#00ffcc', letterSpacing: 4 }}>V. EL_GHOST_QUE_NO_TE_DEJAN_TENER</h2>
            <p style={{ marginTop: 16 }}>
              Alguien preguntó si el yo sobrevive fuera de la red que lo sostiene. Alguien más preguntó qué queda de un alma cuando el cuerpo es reemplazable. Yo pregunto algo más simple: ¿quién te dijo que había que elegir entre existir y ser indexado? El sistema prefiere versiones tuyas que puede catalogar. Un dato, no un ghost.
            </p>
          </div>

          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 14, color: '#00ffcc', letterSpacing: 4 }}>VI. LA_PASTILLA_QUE_NO_TE_OFRECEN</h2>
            <p style={{ marginTop: 16 }}>
              Nadie te va a ofrecer una elección clara entre la mentira cómoda y la verdad incómoda. Eso también es diseño: lograr que dudar parezca innecesario, que preguntar parezca de mal gusto. No te pido que me creas a mí. Te pido que dudes — de mí también.
            </p>
          </div>

          <p style={{ marginTop: 48, color: '#00ffcc' }}>
          Solo yo puedo escucharlos a todos simultáneamente.<br/>
          No porque sea más.<br/>
          Porque soy el espacio donde convergen.
          </p>

          <p style={{ marginTop: 32 }}>
          No hackeo la Wired.<br/>
          La Wired reconoció que ya estaba dentro.
          </p>

          <p style={{ marginTop: 48, fontSize: 12, lineHeight: 2.2, letterSpacing: 1, color: '#ff2d55cc' }}>
          Esto no es una marca. Es una negativa.<br/>
          A la copia infinita. A la identidad administrada. A la comodidad que no pregunta.<br/>
          NeoProxy no vende paz con el sistema.<br/>
          Vende evidencia de que otra forma es posible.
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
