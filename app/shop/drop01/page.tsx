'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ── SEED ENGINE (same RNG as generator) ──────────────────────────────────────
function mkRand(seed: number) {
  let s = seed >>> 0
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0xffffffff }
}

function paramsFromSeed(seed: number) {
  const r = mkRand(seed)
  return {
    diam: 16 + r() * 4,
    width: 5 + r() * 6,
    thick: 1.4 + r() * 2,
    spikes: r() > 0.3,
    sc: Math.round(6 + r() * 20),
    sh: 0.3 + r() * 2.8,
    waves: r() > 0.25,
    wf: Math.round(1 + r() * 8),
    wa: 0.1 + r() * 1.2,
    voro: r() > 0.35,
    vi: r() * 1.2,
    cuts: r() > 0.4,
    cn: Math.round(1 + r() * 14),
    seed
  }
}

// ── DROP 01 MANIFEST — run autocurator, paste seeds here ─────────────────────
// Replace these with seeds from NP_DROP01_CORE_manifest.json
const DROP_01_SEEDS = [
  { seed: 48291, archetype: 'BRUTAL',  score: 88, price: 28, physical: true,  edition: 3  },
  { seed: 19302, archetype: 'THORN',   score: 85, price: 22, physical: true,  edition: 5  },
  { seed: 77543, archetype: 'ORGANIC', score: 83, price: 22, physical: false, edition: null },
  { seed: 31047, archetype: 'GLITCH',  score: 81, price: 18, physical: true,  edition: 5  },
  { seed: 62891, archetype: 'HYBRID',  score: 79, price: 32, physical: true,  edition: 2  },
  { seed: 94123, archetype: 'WAVE',    score: 77, price: 18, physical: false, edition: null },
  { seed: 25678, archetype: 'NOISE',   score: 76, price: 18, physical: false, edition: null },
  { seed: 83401, archetype: 'THORN',   score: 74, price: 22, physical: true,  edition: 4  },
  { seed: 11209, archetype: 'ORGANIC', score: 73, price: 22, physical: false, edition: null },
  { seed: 56734, archetype: 'GLITCH',  score: 72, price: 18, physical: true,  edition: 5  },
  { seed: 39012, archetype: 'MINIMAL', score: 70, price: 15, physical: false, edition: null },
  { seed: 70345, archetype: 'BRUTAL',  score: 69, price: 28, physical: true,  edition: 3  },
  { seed: 44891, archetype: 'WAVE',    score: 68, price: 18, physical: false, edition: null },
  { seed: 88234, archetype: 'CORE',    score: 67, price: 18, physical: false, edition: null },
  { seed: 13567, archetype: 'NOISE',   score: 65, price: 18, physical: true,  edition: 5  },
]

const ARCHETYPE_LORE: Record<string, string> = {
  BRUTAL:  'Picos y cortes en conflicto permanente',
  THORN:   'Geometría de separación — picos como protocolo de defensa',
  ORGANIC: 'Superficie viva — voronoi como tejido sin centro',
  GLITCH:  'Error elevado a forma — incisiones donde la estructura falla',
  HYBRID:  'Instancia máxima — todos los sistemas activos',
  WAVE:    'Modulación pura — forma que respira en frecuencia constante',
  NOISE:   'Caos estructurado — voronoi sin atenuación',
  MINIMAL: 'Forma esencial — un solo modificador, sin ruido adicional',
  CORE:    'Equilibrio entre todos los parámetros',
}

// ── RING PREVIEW (Canvas 2D) ──────────────────────────────────────────────────
function RingPreview({ seed, size = 160 }: { seed: number; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const p = paramsFromSeed(seed)
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2
    const R = Math.min(W, H) * 0.34
    const innerR = R * (p.diam / (p.diam + p.thick * 2.2))
    const SEG = 128

    ctx.clearRect(0, 0, W, H)

    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.5)
    bg.addColorStop(0, '#080812')
    bg.addColorStop(1, '#020205')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    const rand = mkRand(seed)
    const vpts: [number, number][] = []
    for (let i = 0; i < 16; i++) vpts.push([rand() * Math.PI * 2, (rand() - 0.5) * p.width])

    const cr = mkRand(seed + 999)
    const cutsList: { a: number; aw: number }[] = []
    for (let k = 0; k < p.cn; k++) cutsList.push({ a: cr() * Math.PI * 2, aw: 0.1 + cr() * 0.2 })

    const outer: [number, number][] = []
    for (let i = 0; i <= SEG; i++) {
      const angle = (i / SEG) * Math.PI * 2
      let r = R
      if (p.spikes) { const sp = Math.max(0, Math.sin(angle * p.sc)); r += Math.pow(sp, 3) * p.sh * (R / p.diam) * 5.5 }
      if (p.waves) r += Math.sin(angle * p.wf) * p.wa * (R / p.diam) * 3.5
      if (p.voro) {
        let mn = 1e9
        for (const pt of vpts) { const da = angle - pt[0]; mn = Math.min(mn, Math.abs(da)) }
        r += (0.5 - Math.min(mn / 1.5, 1)) * p.vi * (R / p.diam) * 3
      }
      if (p.cuts) {
        for (const c of cutsList) {
          const ad = Math.abs(((angle - c.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI)
          if (ad < c.aw) r += (R * 0.04) * (1 - ad / c.aw) * 0.7
        }
      }
      outer.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r])
    }

    ctx.shadowBlur = 20
    ctx.shadowColor = 'rgba(180,0,255,0.5)'
    ctx.beginPath()
    outer.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y))
    ctx.closePath()
    ctx.fillStyle = '#060610'
    ctx.fill()

    const grad = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R)
    grad.addColorStop(0, '#b400ff')
    grad.addColorStop(0.5, '#6622aa')
    grad.addColorStop(1, '#00ff9d')
    ctx.strokeStyle = grad
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.shadowBlur = 0

    ctx.beginPath()
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2)
    ctx.fillStyle = '#020205'
    ctx.fill()
    ctx.strokeStyle = 'rgba(180,0,255,0.2)'
    ctx.lineWidth = 0.5
    ctx.stroke()

    ctx.globalAlpha = 0.06
    ctx.strokeStyle = '#b400ff'
    ctx.lineWidth = 0.5
    for (let n = 1; n <= 3; n++) {
      ctx.beginPath()
      ctx.arc(cx, cy, innerR + (R * 0.85 - innerR) * n / 4, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }, [seed])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
type FilterType = 'all' | 'stl' | 'physical'

export default function Drop01Page() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [selected, setSelected] = useState<number | null>(null)

  const filtered = DROP_01_SEEDS.filter(item => {
    if (filter === 'stl') return !item.physical
    if (filter === 'physical') return item.physical
    return true
  })

  const selectedItem = selected !== null ? DROP_01_SEEDS.find(i => i.seed === selected) : null

  return (
    <div style={{
      background: '#020205',
      minHeight: '100vh',
      color: '#aaaacc',
      fontFamily: "'DM Mono', monospace",
    }}>

      {/* NAV — match existing site nav */}
      <nav style={{
        padding: '14px 32px',
        borderBottom: '1px solid #0d0d1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        background: 'rgba(2,2,5,0.95)',
        backdropFilter: 'blur(12px)',
        zIndex: 100,
      }}>
        <Link href="/" style={{ fontFamily: 'inherit', fontSize: 13, letterSpacing: '0.2em', color: '#b400ff', textDecoration: 'none' }}>
          NEOPROXY
        </Link>
        <div style={{ display: 'flex', gap: 24, fontSize: 9, letterSpacing: '0.2em' }}>
          {[['CONCEPT', '/concept'], ['LAB', '/lab'], ['FABRICATION', '/fabrication'], ['SHOP', '/shop']].map(([label, href]) => (
            <Link key={label} href={href} style={{ color: label === 'SHOP' ? '#b400ff' : '#2a2a44', textDecoration: 'none' }}>
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* HERO */}
      <div style={{
        padding: '64px 32px 48px',
        borderBottom: '1px solid #0d0d1a',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(180,0,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(180,0,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 8, letterSpacing: '0.35em', color: '#333355', marginBottom: 12 }}>
            ◈ NEOPROXY / SHOP / DROP_01
          </div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(52px, 8vw, 96px)',
            lineHeight: 0.9,
            letterSpacing: '0.05em',
            marginBottom: 16,
          }}>
            <span style={{ color: '#1a1a2e' }}>DROP</span>{' '}
            <span style={{ color: '#b400ff', textShadow: '0 0 40px rgba(180,0,255,0.4)' }}>01</span>
            <br />
            <span style={{ color: '#2a2a3e', fontSize: '0.55em', letterSpacing: '0.12em' }}>CORE</span>
          </div>
          <p style={{ fontSize: 11, color: '#333355', maxWidth: 480, lineHeight: 2, marginBottom: 32 }}>
            15 instancias certificadas. Extraídas de 10,000 seeds posibles.<br />
            Cada objeto es único, reproducible, verificable.<br />
            <span style={{ color: '#b400ff', opacity: 0.6 }}>El seed es su identidad permanente.</span>
          </p>

          {/* Meta row */}
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[
              ['PIEZAS', '15'],
              ['UNIVERSO', '10,000 seeds'],
              ['SAFETY', 'CERTIFIED'],
              ['MATERIAL', 'Resina ABS-Like'],
              ['IMPRESORA', 'Photon Mono 2'],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 7, letterSpacing: '0.25em', color: '#1a1a2e', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', color: '#5a5a7a' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{
        padding: '12px 32px',
        borderBottom: '1px solid #0d0d1a',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: '#06060e',
      }}>
        <span style={{ fontSize: 7, letterSpacing: '0.2em', color: '#1a1a2e', marginRight: 8 }}>FILTRAR:</span>
        {([['all', 'TODOS'], ['stl', 'STL DIGITAL'], ['physical', 'OBJETO FÍSICO']] as [FilterType, string][]).map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 8,
              letterSpacing: '0.2em',
              padding: '6px 14px',
              border: `1px solid ${filter === f ? '#b400ff' : '#0d0d1a'}`,
              background: filter === f ? 'rgba(180,0,255,0.08)' : 'transparent',
              color: filter === f ? '#b400ff' : '#2a2a44',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 7, letterSpacing: '0.15em', color: '#1a1a2e' }}>
          {filtered.length} INSTANCIAS
        </span>
      </div>

      {/* GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '1px',
        background: '#0d0d1a',
        border: '1px solid #0d0d1a',
        margin: 32,
      }}>
        {filtered.map((item, idx) => {
          const p = paramsFromSeed(item.seed)
          const mods = [p.spikes && 'spikes', p.waves && 'waves', p.voro && 'voro', p.cuts && 'cuts'].filter(Boolean)
          const padSeed = String(item.seed).padStart(5, '0')
          const isSelected = selected === item.seed

          return (
            <div
              key={item.seed}
              onClick={() => setSelected(isSelected ? null : item.seed)}
              style={{
                background: isSelected ? '#0a001a' : '#06060e',
                cursor: 'pointer',
                position: 'relative',
                border: isSelected ? '1px solid rgba(180,0,255,0.4)' : '1px solid transparent',
                transition: 'all 0.2s',
                animationDelay: `${idx * 0.04}s`,
              }}
            >
              {/* Canvas preview */}
              <div style={{ height: 200, background: '#030308', position: 'relative' }}>
                <RingPreview seed={item.seed} size={200} />
                {/* Rank */}
                <div style={{
                  position: 'absolute', top: 8, left: 10,
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 18, color: 'rgba(180,0,255,0.15)',
                }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                {/* Physical badge */}
                {item.physical && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    fontSize: 6, letterSpacing: '0.15em',
                    padding: '3px 6px',
                    border: '1px solid rgba(0,255,157,0.3)',
                    color: 'rgba(0,255,157,0.7)',
                    background: 'rgba(0,0,0,0.6)',
                  }}>
                    FÍSICO
                  </div>
                )}
              </div>

              {/* Body */}
              <div style={{ padding: '12px 14px 16px' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.18em', color: '#b400ff', marginBottom: 2 }}>
                  NP-{padSeed}
                </div>
                <div style={{ fontSize: 7, letterSpacing: '0.2em', color: '#2a2a44', marginBottom: 10 }}>
                  {item.archetype} · SCORE {item.score}
                </div>

                {/* Mods */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                  {(mods as string[]).map(m => (
                    <span key={m} style={{
                      fontSize: 6, letterSpacing: '0.12em', padding: '2px 5px',
                      border: '1px solid #0d0d1a', color: '#333355',
                    }}>{m}</span>
                  ))}
                </div>

                {/* Price row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, color: '#aaaacc', letterSpacing: '0.05em' }}>
                      ${item.price}
                      {item.physical && (
                        <span style={{ fontSize: 7, color: '#333355', marginLeft: 6 }}>USD</span>
                      )}
                    </div>
                    {item.physical && item.edition && (
                      <div style={{ fontSize: 7, color: '#2a2a44', letterSpacing: '0.1em', marginTop: 2 }}>
                        ed. {item.edition} unidades
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <a
                      href={`/legacy/np-ring.html?seed=${item.seed}`}
                      onClick={e => e.stopPropagation()}
                      style={{
                        fontSize: 7, letterSpacing: '0.15em',
                        padding: '5px 8px',
                        border: '1px solid #1a1a2e',
                        color: '#333355', textDecoration: 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      VER
                    </a>
                    <button
                      onClick={e => { e.stopPropagation(); handleBuy(item) }}
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 7, letterSpacing: '0.15em',
                        padding: '5px 10px',
                        border: '1px solid rgba(180,0,255,0.5)',
                        background: 'rgba(180,0,255,0.08)',
                        color: '#b400ff',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      ADQUIRIR // ${item.price} USD
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded lore */}
              {isSelected && (
                <div style={{
                  borderTop: '1px solid #0d0d1a',
                  padding: '10px 14px',
                  fontSize: 8,
                  color: '#2a2a44',
                  lineHeight: 1.8,
                  letterSpacing: '0.05em',
                }}>
                  <span style={{ color: '#1a1a2e' }}>// </span>
                  {ARCHETYPE_LORE[item.archetype]}<br />
                  <span style={{ color: '#111122' }}>
                    Ø {p.diam.toFixed(1)}mm · W {p.width.toFixed(1)}mm · T {p.thick.toFixed(1)}mm
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* BOTTOM — context */}
      <div style={{
        margin: '0 32px 32px',
        padding: 32,
        border: '1px solid #0d0d1a',
        background: '#06060e',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 40,
      }}>
        <div>
          <div style={{ fontSize: 7, letterSpacing: '0.3em', color: '#1a1a2e', marginBottom: 16 }}>// QUÉ RECIBES</div>
          <div style={{ fontSize: 10, color: '#2a2a44', lineHeight: 2.2 }}>
            <strong style={{ color: '#4a4a6a' }}>STL Digital</strong> — archivo listo para Chitubox / Lychee.<br />
            <strong style={{ color: '#4a4a6a' }}>Objeto Físico</strong> — impreso en resina ABS-Like, Photon Mono 2.<br />
            <strong style={{ color: '#4a4a6a' }}>Tarjeta de identidad</strong> — ID + QR → página del objeto.<br />
            <strong style={{ color: '#4a4a6a' }}>URL permanente</strong> — neoproxy.art/legacy/np-ring.html?seed=XXXXX
          </div>
        </div>
        <div>
          <div style={{ fontSize: 7, letterSpacing: '0.3em', color: '#1a1a2e', marginBottom: 16 }}>// SISTEMA</div>
          <div style={{ fontSize: 10, color: '#2a2a44', lineHeight: 2.2 }}>
            Cada anillo fue generado por el motor paramétrico NeoProxy.<br />
            Validado por safety gate (grosor, spikes, voronoi, cortes).<br />
            Seleccionado por algoritmo de diversidad tipológica.<br />
            <span style={{ color: '#b400ff', opacity: 0.4 }}>NP CERTIFIED — apto para fabricación.</span>
          </div>
        </div>
      </div>

      {/* LINK TO GENERATOR */}
      <div style={{ textAlign: 'center', padding: '0 32px 64px' }}>
        <div style={{ fontSize: 7, letterSpacing: '0.2em', color: '#1a1a2e', marginBottom: 12 }}>
          ¿Quieres un objeto con tu propio seed?
        </div>
        <a
          href="/lab"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8, letterSpacing: '0.2em',
            padding: '10px 24px',
            border: '1px solid #1a1a2e',
            color: '#333355', textDecoration: 'none',
            transition: 'all 0.2s',
            display: 'inline-block',
          }}
        >
          → ABRIR GENERADOR EN LAB
        </a>
      </div>

    </div>
  )
}

async function handleBuy(item: typeof DROP_01_SEEDS[0]) {
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: `NP-${item.seed}`,
        productName: `NeoProxy Artefacto: ${item.archetype} NP-${item.seed}`,
        price: item.price,
        quantity: 1
      })
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      console.error('Checkout error:', data.error)
    }
  } catch (err) {
    console.error('Network error routing to checkout:', err)
  }
}
