import Link from 'next/link'
import { MODELOS, EN_EL_TALLER } from '@/lib/arsenal/catalogo'

const mono = "'Space Mono', monospace"
const CRIMSON = '#ff4d5e', AMBER = '#e0b070', CYAN = '#00d4ff', DIM = '#8fa8c4', FAINT = '#6f86a3'
const H = ({ children, c = CRIMSON }: { children: React.ReactNode; c?: string }) => <h2 style={{ fontSize: 11.5, letterSpacing: 4, color: c, margin: '0 0 16px', fontWeight: 400 }}>{children}</h2>

// v1 → v2: qué cambió de un modelo al siguiente (para ver el avance)
const AVANCE: [string, string, string][] = [
  ['Malla', 'surface nets: cantos redondeados', 'dual contouring: caras planas y cantos vivos, simplificada'],
  ['Estructura', 'mitades pegadas con perno', 'dos láminas con uniones desfasadas y una varilla de 4 mm'],
  ['Uniones', 'espiga y perno, abrazaderas', 'colas de milano en el plano, blindajes con clavijas'],
  ['Color', 'un filamento (o pintar)', 'seis filamentos, una capa por color'],
  ['Luz', 'canal para tira LED', 'LED y pila bajo el dial, fibra óptica de brillo lateral'],
  ['Archivos', 'una mitad ×2 (espejar a mano)', 'cada pieza su archivo, con rótulo de armado grabado'],
  ['Cálculo', 'un hilo', 'varios hilos en paralelo + uno que verifica'],
]

export default function EspadasPage() {
  const log = MODELOS.flatMap((m) => m.bitacora.map((b) => ({ ...b, m }))).sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : b.v.localeCompare(a.v)))
  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative', overflowX: 'hidden' }}>
      <div className="crt-scanlines" /><div className="tech-grid" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1240, margin: '0 auto', padding: '104px 24px 100px' }}>
        <div style={{ fontSize: 11, letterSpacing: 6, color: `${CRIMSON}cc`, marginBottom: 14 }}>
          NPX-ARSENAL // <Link href="/fabrication" style={{ color: `${CRIMSON}cc` }}>FABRICACIÓN</Link>
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 8vw, 68px)', letterSpacing: 12, margin: '0 0 18px', lineHeight: 1.05, background: `linear-gradient(90deg,${CRIMSON},#ffffff 60%,${CYAN})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>ARSENAL · ESPADAS</h1>
        <p style={{ fontSize: 13, lineHeight: 2, color: '#c8daf0', maxWidth: 900, margin: '0 0 10px' }}>
          Espadas paramétricas para imprimir en piezas: cada una se calcula en tu navegador, se verifica (que cierre, que quepa en tu cama, que cada encaje tenga su holgura) y se descarga lista para laminar, sin soportes.
          <b style={{ color: '#fff' }}> Cada modelo tiene versiones; cada versión anota qué cambió y por qué.</b> La idea es iterar hasta tener la pieza perfecta para imprimir.
        </p>
        <p style={{ fontSize: 11.5, lineHeight: 1.95, color: '#7f96b2', maxWidth: 900, margin: '0 0 36px' }}>
          Son piezas de exhibición: los filos son romos y el material no corta. Los diseños son originales de NeoProxy.
        </p>

        <section style={{ display: 'grid', gap: 22 }}>
          {MODELOS.map((m) => (
            <article key={m.codigo} className="ar-card" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', background: '#070b11', border: '1px solid #ffffff14', borderTop: `2px solid ${m.acento}` }}>
              <Link href={m.href} aria-label={`Abrir ${m.codigo} ${m.nombre}`} style={{ position: 'relative', display: 'block', minHeight: 230, background: 'radial-gradient(circle at 50% 45%, #0e131b 0%, #020408 80%)', overflow: 'hidden' }}>
                {m.imagen && (
                  // eslint-disable-next-line @next/next/no-img-element -- captura fija del visor, sin optimizar
                  <img src={m.imagen} alt={`${m.codigo} ${m.nombre} en el visor`} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <span style={{ position: 'absolute', left: 12, top: 12, fontSize: 10.5, letterSpacing: 2, color: '#fff', background: 'rgba(3,6,10,.72)', border: '1px solid #ffffff22', padding: '4px 8px' }}>{m.codigo}</span>
              </Link>
              <div style={{ padding: '18px 20px 20px', display: 'grid', gap: 12, alignContent: 'start' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 10.5, letterSpacing: 1.6, color: m.acento, border: `1px solid ${m.acento}88`, padding: '3px 8px' }}>v{m.version}</span>
                  <span style={{ fontSize: 10.5, letterSpacing: 1.6, color: '#7cf0b0', border: '1px solid #7cf0b066', padding: '3px 8px' }}>● {m.estado.toUpperCase()}</span>
                  <span style={{ fontSize: 10.5, letterSpacing: 1.4, color: FAINT }}>{m.tipo}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: 'clamp(22px, 4vw, 30px)', letterSpacing: 8, color: '#fff', fontWeight: 400 }}>{m.nombre}</h3>
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.9, color: '#a9bdd4' }}>{m.resumen}</p>
                <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 14px', fontSize: 11.5 }}>
                  {m.ficha.map(([k, v]) => (
                    <div key={k} style={{ display: 'contents' }}><dt style={{ color: FAINT, letterSpacing: 1.2 }}>{k.toUpperCase()}</dt><dd style={{ margin: 0, color: '#c8daf0' }}>{v}</dd></div>
                  ))}
                </dl>
                <Link href={m.href} className="press" style={{ justifySelf: 'start', minHeight: 44, display: 'inline-flex', alignItems: 'center', padding: '0 18px', marginTop: 4, background: m.acento, color: '#05070a', fontWeight: 700, fontSize: 12, letterSpacing: 1.6, textDecoration: 'none' }}>
                  ABRIR EL GENERADOR →
                </Link>
              </div>
            </article>
          ))}
        </section>

        <section style={{ marginTop: 60 }}>
          <H>DE LA v1 A LA v2</H>
          <div style={{ overflowX: 'auto', border: '1px solid #ffffff12' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, minWidth: 560 }}>
              <thead>
                <tr style={{ background: '#0a0f16' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: FAINT, fontWeight: 400, letterSpacing: 1.4 }}></th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: CYAN, fontWeight: 400, letterSpacing: 1.4 }}>NPX-01 KATANA · v1</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: CRIMSON, fontWeight: 400, letterSpacing: 1.4 }}>NPX-02 VÉRTICE · v2</th>
                </tr>
              </thead>
              <tbody>
                {AVANCE.map(([k, a, b]) => (
                  <tr key={k} style={{ borderTop: '1px solid #ffffff0d' }}>
                    <td style={{ padding: '9px 12px', color: DIM, letterSpacing: 1.2, whiteSpace: 'nowrap' }}>{k.toUpperCase()}</td>
                    <td style={{ padding: '9px 12px', color: '#93a7bf' }}>{a}</td>
                    <td style={{ padding: '9px 12px', color: '#e6eef8' }}>{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ marginTop: 60, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28, alignItems: 'start' }}>
          <div>
            <H c={AMBER}>BITÁCORA</H>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 18 }}>
              {log.map((e) => (
                <li key={`${e.m.codigo}-${e.v}`} style={{ borderLeft: `2px solid ${e.m.acento}`, paddingLeft: 14 }}>
                  <div style={{ fontSize: 10.5, letterSpacing: 1.6, color: FAINT, marginBottom: 4 }}>{e.fecha} · <Link href={e.m.href} style={{ color: e.m.acento }}>{e.m.codigo} {e.m.nombre}</Link> · v{e.v}</div>
                  <div style={{ fontSize: 12.5, color: '#fff', marginBottom: 6 }}>{e.titulo}</div>
                  <ul style={{ margin: 0, paddingLeft: 16, display: 'grid', gap: 4 }}>
                    {e.cambios.map((c) => <li key={c} style={{ fontSize: 11.5, lineHeight: 1.8, color: '#a9bdd4' }}>{c}</li>)}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <H c={CYAN}>EN EL TALLER</H>
            <div style={{ display: 'grid', gap: 10 }}>
              {EN_EL_TALLER.map((t, i) => (
                <div key={t.titulo} style={{ background: '#080c12', border: '1px solid #ffffff12', padding: '12px 14px' }}>
                  <div style={{ fontSize: 10.5, letterSpacing: 2, color: `${CYAN}aa`, marginBottom: 4 }}>{String(i + 1).padStart(2, '0')}</div>
                  <div style={{ fontSize: 12.5, color: '#fff', marginBottom: 4 }}>{t.titulo}</div>
                  <div style={{ fontSize: 11.5, lineHeight: 1.8, color: '#a9bdd4' }}>{t.texto}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <style>{`@media (max-width: 760px) { .ar-card { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
