import type { Metadata } from 'next'
import Link from 'next/link'
import { pieces } from '@/components/gallery/pieces'
import { HeroVideo, PieceTile } from '@/components/imprimir/Media'

const WA_NUMBER = '56993550010'
const waLink = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`

export const metadata: Metadata = {
  title: 'Impresión 3D en PLA y resina, a pedido // NeoProxy',
  description:
    'Impresión 3D a pedido en PLA (FDM) y resina UV (SLA). Mandá tu STL, un boceto o una idea y te cotizo por WhatsApp. Piezas reales del taller.',
  openGraph: {
    title: 'Impresión 3D en PLA y resina, a pedido',
    description: 'Mandá tu STL, boceto o idea. Cotización por WhatsApp. Piezas reales del taller NeoProxy.',
    images: [{ url: '/gallery/oni-13-poster.jpg' }],
    type: 'website',
  },
}

const GRID_IDS = [
  'oni-13', 'criatura-05', 'figura-03', 'oni-09', 'artefacto-03', 'criatura-06',
  'oni-02', 'criatura-04', 'figura-02', 'oni-05', 'criatura-01', 'artefacto-02',
]
const grid = GRID_IDS.map((id) => pieces.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p)

const STEPS = [
  { n: '01', t: 'Me escribís', d: 'Por WhatsApp: qué querés imprimir, para qué es y qué tamaño. Con STL, foto o un boceto a mano alcanza.' },
  { n: '02', t: 'Cotizo y te confirmo', d: 'Te respondo con precio y plazo antes de imprimir nada. Si el archivo necesita arreglos, te lo digo.' },
  { n: '03', t: 'Imprimo', d: 'FDM en PLA o SLA en resina UV, según lo que pide la pieza.' },
  { n: '04', t: 'Te la entrego', d: 'Retiro o envío a convenir, con la pieza ya limpia y curada.' },
]

const CTA_TEXT = 'Hola, quiero cotizar una pieza.\n\nQué quiero imprimir:\nMaterial (PLA / resina / no sé):\nTamaño aproximado:\nTengo STL: sí / no'

export default function ImprimirPage() {
  const hero = pieces.find((p) => p.id === 'oni-13')!
  const heroSrc = hero.media.type === 'video' ? hero.media : null

  return (
    <div className="imp-root">
      <section className="imp-hero">
        {heroSrc && <HeroVideo src={heroSrc.src} poster={heroSrc.poster} alt="Máscara oni en resina impresa por NeoProxy" />}
        <div className="imp-hero-shade" />
        <div className="imp-hero-copy">
          <div className="imp-eyebrow">NEOPROXY // TALLER DE IMPRESIÓN 3D</div>
          <h1>Impresión 3D en PLA y resina, a pedido.</h1>
          <p>
            Mandame tu STL, un boceto o una idea. Te cotizo por WhatsApp antes de imprimir nada.
          </p>
          <a className="imp-cta press" href={waLink(CTA_TEXT)} target="_blank" rel="noopener noreferrer">
            Cotizar por WhatsApp
          </a>
        </div>
      </section>

      <main className="imp-wrap">
        <section aria-labelledby="como">
          <h2 id="como" className="imp-h2">Cómo se pide</h2>
          <ol className="imp-steps">
            {STEPS.map((s) => (
              <li key={s.n}>
                <span className="imp-step-n">{s.n}</span>
                <div>
                  <strong>{s.t}</strong>
                  <p>{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="materiales">
          <h2 id="materiales" className="imp-h2">PLA o resina: cuál te sirve</h2>
          <div className="imp-materials">
            <article>
              <h3>PLA <span>FDM</span></h3>
              <p>Para piezas funcionales, prototipos, soportes, carcasas y objetos grandes. Más resistente al golpe y más económico por volumen.</p>
              <ul>
                <li>Piezas de uso y prototipos</li>
                <li>Tamaños grandes</li>
                <li>Capas visibles (se puede lijar y pintar)</li>
              </ul>
            </article>
            <article>
              <h3>Resina UV <span>SLA</span></h3>
              <p>Para miniaturas, máscaras, bustos y todo lo que necesita detalle fino y superficie lisa. Es lo que ves en las fotos de abajo.</p>
              <ul>
                <li>Detalle fino y superficie lisa</li>
                <li>Figuras, máscaras, joyería, maquetas</li>
                <li>Más frágil: no para piezas que reciben golpes</li>
              </ul>
            </article>
          </div>
          <p className="imp-note">¿No sabés cuál elegir? Contame para qué es la pieza y te recomiendo.</p>
        </section>

        <section aria-labelledby="piezas">
          <h2 id="piezas" className="imp-h2">Piezas reales del taller</h2>
          <p className="imp-sub">Todo lo que ves está impreso en este taller. Toca un video para verlo.</p>
          <div className="imp-grid">
            {grid.map((p) => <PieceTile key={p.id} piece={p} />)}
          </div>
          <p className="imp-note">
            <Link href="/fabrication/gallery" className="press">Ver la galería completa →</Link>
          </p>
        </section>

        <section className="imp-final" aria-labelledby="final">
          <h2 id="final" className="imp-h2">¿Tenés una pieza en mente?</h2>
          <a className="imp-cta press" href={waLink(CTA_TEXT)} target="_blank" rel="noopener noreferrer">
            Cotizar por WhatsApp
          </a>
        </section>
      </main>

      <style>{`
        .imp-root { --ease-out: cubic-bezier(0.23, 1, 0.32, 1); background: #05080c; color: #c8daf0; min-height: 100vh; font-family: 'Space Mono', monospace; }
        .imp-hero { position: relative; min-height: min(82vh, 760px); display: flex; align-items: flex-end; overflow: hidden; }
        .imp-hero-media { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .imp-hero-shade { position: absolute; inset: 0; background: linear-gradient(to top, #05080c 4%, rgba(5,8,12,0.55) 45%, rgba(5,8,12,0.25) 100%); }
        .imp-hero-copy { position: relative; z-index: 1; width: 100%; max-width: 980px; margin: 0 auto; padding: 120px 24px 56px; }
        .imp-eyebrow { font-size: 10px; letter-spacing: 5px; color: #7fd8ff; margin-bottom: 16px; }
        .imp-hero h1 { font-size: clamp(30px, 6vw, 54px); line-height: 1.12; letter-spacing: 1px; color: #fff; margin: 0 0 16px; max-width: 14em; }
        .imp-hero p { font-size: 14px; line-height: 1.8; color: #d6e4f2; max-width: 34em; margin: 0 0 28px; }
        .imp-cta { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 28px; background: #25d366; color: #04210f; font-weight: 700; font-size: 13px; letter-spacing: 1.5px; text-decoration: none; border-radius: 6px; }
        .imp-wrap { max-width: 980px; margin: 0 auto; padding: 0 24px 96px; }
        .imp-wrap section { margin-top: 80px; }
        .imp-h2 { font-size: clamp(20px, 3.4vw, 28px); letter-spacing: 1.5px; color: #fff; margin: 0 0 24px; }
        .imp-sub { font-size: 12px; color: #9fb4cc; margin: -12px 0 24px; }
        .imp-steps { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; }
        .imp-steps li { display: flex; gap: 14px; padding: 18px; border: 1px solid rgba(127,216,255,0.18); border-radius: 8px; background: rgba(255,255,255,0.02); }
        .imp-step-n { font-size: 22px; color: #7fd8ff; line-height: 1; }
        .imp-steps strong { display: block; color: #fff; font-size: 13px; margin-bottom: 6px; }
        .imp-steps p { margin: 0; font-size: 12px; line-height: 1.7; color: #9fb4cc; }
        .imp-materials { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
        .imp-materials article { padding: 22px; border: 1px solid rgba(127,216,255,0.18); border-radius: 8px; background: rgba(255,255,255,0.02); }
        .imp-materials h3 { margin: 0 0 10px; font-size: 18px; color: #fff; }
        .imp-materials h3 span { font-size: 10px; letter-spacing: 2px; color: #7fd8ff; margin-left: 8px; }
        .imp-materials p { font-size: 12.5px; line-height: 1.75; color: #b8cadc; margin: 0 0 12px; }
        .imp-materials ul { margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.9; color: #9fb4cc; }
        .imp-note { font-size: 12px; color: #9fb4cc; margin: 18px 0 0; }
        .imp-note a { color: #7fd8ff; text-decoration: none; display: inline-block; }
        .imp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
        .imp-tile { margin: 0; border-radius: 8px; overflow: hidden; background: #0b1118; border: 1px solid rgba(127,216,255,0.14); }
        .imp-tile img, .imp-tile video { display: block; width: 100%; aspect-ratio: 3 / 4; object-fit: cover; }
        .imp-tile-play { position: relative; display: block; width: 100%; padding: 0; border: 0; background: none; cursor: pointer; }
        .imp-play-badge { position: absolute; right: 10px; bottom: 10px; width: 36px; height: 36px; display: grid; place-items: center; border-radius: 50%; background: rgba(0,0,0,0.65); color: #fff; font-size: 12px; }
        .imp-tile figcaption { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px 12px; }
        .imp-tile-title { font-size: 12px; color: #fff; }
        .imp-tile-material { font-size: 10px; color: #8fa8c4; letter-spacing: 0.5px; }
        .imp-final { text-align: center; padding: 48px 0 0; }
        @media (prefers-reduced-motion: reduce) { .imp-hero-media { animation: none; } }
      `}</style>
    </div>
  )
}
