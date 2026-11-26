import Link from 'next/link'

// FENÓMENOS: la serie de piezas que nacen de una ley de la naturaleza. Cada entrada es una
// página propia con su simulación, sus medidas, lo que no sabe, su pieza imprimible y su
// modo reel. Para sumar una nueva basta agregarla a SERIE (y sus dos imágenes en
// public/fenomenos/: el fenómeno y la pieza).
type Entry = {
  n: string; id: string; href: string; name: string; law: string; color: string
  hook: string; measured: string; piece: string; tags: string[]
}
const SERIE: Entry[] = [
  {
    n: '01', id: 'capas', href: '/capas', name: 'CAPAS', law: 'autómatas · tiempo apilado', color: '#ff8fb4',
    hook: 'Un mundo plano que vive según una ley simple. Cada instante es una capa: apiladas, su historia entera se vuelve un objeto.',
    measured: 'Nacimientos, divisiones, fusiones y muertes registrados capa por capa; la misma receta da la misma pieza.',
    piece: 'La pila de capas, con base, lista para imprimir en resina.',
    tags: ['tiempo → altura', 'determinista', 'reel'],
  },
  {
    n: '02', id: 'humo', href: '/humo', name: 'HUMO SÓLIDO', law: 'vórtices · Helmholtz', color: '#5fe3ff',
    hook: 'Anillos de humo calculados con la física real de los vórtices: se adelantan, chocan, se anudan. Un instante se congela.',
    measured: 'Un anillo avanza a la velocidad de Kelvin con 3–4 % de diferencia; el impulso del flujo se conserva.',
    piece: 'El humo de ese instante, sólido, sobre una peana.',
    tags: ['instante congelado', 'fluidos', 'reel'],
  },
  {
    n: '03', id: 'trenza', href: '/trenza', name: 'TRENZA', law: 'tres cuerpos · Newton', color: '#ffc75a',
    hook: 'Tres soles en órbitas periódicas reales. Con el tiempo como altura, su baile es una trenza; una millonésima la deshace.',
    measured: '13 órbitas publicadas, refinadas hasta cerrar a 5·10⁻¹⁰; el ocho da la palabra (σ₁ σ₂⁻¹)³.',
    piece: 'Las tres líneas de mundo como tubos fundidos sobre una base.',
    tags: ['tiempo → altura', 'caos', 'reel'],
  },
  {
    n: '04', id: 'resonancia', href: '/resonancia', name: 'RESONANCIA', law: 'placas · Chladni', color: '#7cf0d0',
    hook: 'Arena sobre una placa de acero que vibra. Cada nota dibuja una figura: la arena huye de lo que se mueve y se junta en lo quieto.',
    measured: 'Las frecuencias de la placa libre coinciden con las tablas de Leissa (1969) con error bajo 0,01 %.',
    piece: 'La figura en relieve sobre una baldosa, o el barrido entero apilado como columna.',
    tags: ['sonido', 'frecuencia → altura', 'reel con audio'],
  },
  {
    n: '05', id: 'rayo', href: '/rayo', name: 'RAYO', law: 'descargas · Niemeyer', color: '#a9b8ff',
    hook: 'Una descarga avanza paso a paso hacia donde el campo eléctrico es más fuerte. Toca tierra, el canal principal se enciende y truena.',
    measured: 'En el plano su dimensión fractal da 1,74 ± 0,02, contra el 1,75 ± 0,02 medido por Niemeyer y colaboradores (1984).',
    piece: 'El rayo dado vuelta: un árbol que engorda como un río, sobre su base.',
    tags: ['fractal', 'electricidad', 'reel con trueno'],
  },
]

const mono = "'Space Mono', monospace"

export default function FenomenosPage() {
  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative', overflowX: 'hidden' }}>
      <div className="crt-scanlines" /><div className="tech-grid" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1240, margin: '0 auto', padding: '104px 24px 110px' }}>
        <div style={{ fontSize: 9.5, letterSpacing: 6, color: '#7f96b2', marginBottom: 14 }}>NPX-FENÓMENOS // SERIE</div>
        <h1 style={{ fontSize: 'clamp(34px, 8vw, 68px)', letterSpacing: 10, margin: '0 0 20px', lineHeight: 1.05, background: 'linear-gradient(90deg,#ff8fb4,#5fe3ff 40%,#ffc75a 70%,#7cf0d0)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>FENÓMENOS</h1>
        <p style={{ fontSize: 13.5, lineHeight: 2, color: '#c8daf0', maxWidth: 860, margin: '0 0 12px' }}>
          Piezas que no se diseñan: se dejan caer de una ley de la naturaleza. Un mundo que crece, un fluido que gira, tres soles que se persiguen, una placa que suena, una descarga que busca tierra.
          Cada una se calcula en vivo en el navegador, se mide, dice lo que no sabe, y termina como un objeto que se puede imprimir.
        </p>
        <p style={{ fontSize: 10.5, lineHeight: 1.9, color: '#7f96b2', maxWidth: 860, margin: '0 0 46px' }}>
          {SERIE.length} fenómenos hasta ahora. Cada uno tiene su MODO REEL: una versión vertical que corre sola, para grabarla con el teléfono.
        </p>

        <div style={{ display: 'grid', gap: 34 }}>
          {SERIE.map((e, i) => (
            <Link key={e.id} href={e.href} className="fx-card" style={{ display: 'grid', gridTemplateColumns: i % 2 ? 'minmax(0,0.9fr) minmax(0,1.1fr)' : 'minmax(0,1.1fr) minmax(0,0.9fr)', gap: 0, textDecoration: 'none', color: 'inherit', background: '#060a10', border: '1px solid #ffffff12', borderTop: `2px solid ${e.color}` }}>
              <div className="fx-pair" style={{ order: i % 2 ? 2 : 1, display: 'grid', gridTemplateColumns: '1fr 1fr', position: 'relative', minHeight: 220 }}>
                {(['a', 'b'] as const).map((k) => (
                  <div key={k} style={{ position: 'relative', overflow: 'hidden', background: '#020308' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/fenomenos/${e.id}-${k}.jpg`} alt={`${e.name}: ${k === 'a' ? 'el fenómeno' : 'la pieza'}`} loading={i < 2 ? 'eager' : 'lazy'} className="fx-img" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <span style={{ position: 'absolute', left: 10, bottom: 8, fontSize: 9, letterSpacing: 2.5, color: '#ffffffcc', textShadow: '0 1px 4px #000' }}>{k === 'a' ? 'EL FENÓMENO' : 'LA PIEZA'}</span>
                  </div>
                ))}
                <span aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 34, height: 34, borderRadius: '50%', background: '#000c', border: `1px solid ${e.color}`, color: e.color, display: 'grid', placeItems: 'center', fontSize: 14 }}>→</span>
              </div>
              <div style={{ order: i % 2 ? 1 : 2, padding: '24px 26px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span style={{ fontSize: 11, color: e.color, letterSpacing: 2 }}>{e.n}</span>
                  <span style={{ fontSize: 'clamp(20px, 3vw, 28px)', letterSpacing: 5, color: '#fff' }}>{e.name}</span>
                </div>
                <div style={{ fontSize: 9.5, letterSpacing: 3, color: `${e.color}cc` }}>{e.law.toUpperCase()}</div>
                <p style={{ fontSize: 12, lineHeight: 1.95, color: '#c8daf0', margin: 0 }}>{e.hook}</p>
                <div style={{ fontSize: 10.5, lineHeight: 1.85, color: '#8fa8c4' }}><span style={{ color: '#7cf0b0' }}>MEDIDO · </span>{e.measured}</div>
                <div style={{ fontSize: 10.5, lineHeight: 1.85, color: '#8fa8c4' }}><span style={{ color: e.color }}>PIEZA · </span>{e.piece}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
                  {e.tags.map((t) => <span key={t} style={{ fontSize: 9, letterSpacing: 1.5, padding: '4px 8px', border: '1px solid #ffffff1c', color: '#9fb4cc' }}>{t}</span>)}
                  <span style={{ marginLeft: 'auto', fontSize: 10.5, letterSpacing: 2.5, color: e.color }}>ENTRAR →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <section style={{ marginTop: 70, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: 4, color: '#9fe8ff', marginBottom: 16 }}>LAS REGLAS DE LA SERIE</div>
            <ol style={{ margin: 0, padding: '0 0 0 18px', fontSize: 11, lineHeight: 2.05, color: '#a9bdd4' }}>
              <li><b style={{ color: '#fff' }}>Una ley de verdad.</b> Física o matemática publicada, con sus fuentes; no un efecto que se parezca.</li>
              <li><b style={{ color: '#fff' }}>Medida.</b> Cada página compara su cálculo con algo conocido y publica el error. Las pruebas viven en el repositorio.</li>
              <li><b style={{ color: '#fff' }}>Honesta.</b> Cada página dice lo que su modelo no hace y que las piezas aún no se han impreso.</li>
              <li><b style={{ color: '#fff' }}>Reproducible.</b> Un enlace reconstruye la misma pieza; una ficha JSON guarda la receta y los parámetros de fabricación.</li>
              <li><b style={{ color: '#fff' }}>Termina en un objeto.</b> Una malla cerrada, medida para imprimir en resina, que se puede pedir.</li>
            </ol>
          </div>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: 4, color: '#ffd27c', marginBottom: 16 }}>CÓMO GRABAR UN REEL</div>
            <ol style={{ margin: 0, padding: '0 0 0 18px', fontSize: 11, lineHeight: 2.05, color: '#a9bdd4' }}>
              <li>Abre el fenómeno en el teléfono y elige una receta (una órbita, una nota, un experimento).</li>
              <li>En RESONANCIA y RAYO activa ♪ antes: el reel lleva el sonido de la placa o el trueno.</li>
              <li>Pulsa ▣ MODO REEL y empieza a grabar la pantalla: corre solo, en vertical 9:16, y termina con la dirección de la página.</li>
            </ol>
          </div>
        </section>
      </div>
      <style>{`
        .fx-card { transition: border-color .25s, transform .25s; }
        .fx-card:hover { border-color: #ffffff30 !important; transform: translateY(-2px); }
        .fx-card .fx-img { transition: transform 1.2s ease; }
        .fx-card:hover .fx-img { transform: scale(1.04); }
        @media (max-width: 860px) { .fx-card { grid-template-columns: 1fr !important; } .fx-card > div { order: 0 !important; } .fx-pair { min-height: 0 !important; aspect-ratio: 2 / 1.2; } }
        @media (prefers-reduced-motion: reduce) { .fx-card, .fx-card .fx-img { transition: none; } .fx-card:hover, .fx-card:hover .fx-img { transform: none; } }
      `}</style>
    </div>
  )
}
