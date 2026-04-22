'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// ── SEED ENGINE (same RNG as generator) ──────────────────────────────
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

// ── RING PREVIEW (React Three Fiber 3D) ──────────────────────────────────────────────────
function RingPreview3D({ seed, size = 160 }: { seed: number; size?: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const p = paramsFromSeed(seed)
    const SEG = 128

    // Create ring geometry
    const shape = new THREE.Shape()
    const outerPoints: THREE.Vector2[] = []
    const innerPoints: THREE.Vector2[] = []

    // Generate outer ring points
    const rand = mkRand(seed)
    const vpts: [number, number][] = []
    for (let i = 0; i < 16; i++) vpts.push([rand() * Math.PI * 2, (rand() - 0.5) * p.width])

    const cr = mkRand(seed + 999)
    const cutsList: { a: number; aw: number }[] = []
    for (let k = 0; k < p.cn; k++) cutsList.push({ a: cr() * Math.PI * 2, aw: 0.1 + cr() * 0.2 })

    for (let i = 0; i <= SEG; i++) {
      const angle = (i / SEG) * Math.PI * 2
      let r = 1 // Normalized radius
      if (p.spikes) { const sp = Math.max(0, Math.sin(angle * p.sc)); r += Math.pow(sp, 3) * p.sh * 0.15 }
      if (p.waves) r += Math.sin(angle * p.wf) * p.wa * 0.08
      if (p.voro) {
        let mn = 1e9
        for (const pt of vpts) { const da = angle - pt[0]; mn = Math.min(mn, Math.abs(da)) }
        r += (0.5 - Math.min(mn / 1.5, 1)) * p.vi * 0.08
      }
      if (p.cuts) {
        for (const c of cutsList) {
          const ad = Math.abs(((angle - c.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI)
          if (ad < c.aw) r += 0.04 * (1 - ad / c.aw) * 0.7
        }
      }
      outerPoints.push(new THREE.Vector2(Math.cos(angle) * r, Math.sin(angle) * r))
    }

    // Generate inner ring points (hole)
    const innerR = p.diam / (p.diam + p.thick * 2.2)
    for (let i = 0; i <= SEG; i++) {
      const angle = (i / SEG) * Math.PI * 2
      innerPoints.push(new THREE.Vector2(Math.cos(angle) * innerR, Math.sin(angle) * innerR))
    }

    // Create ring shape
    shape.moveTo(outerPoints[0].x, outerPoints[0].y)
    for (let i = 1; i < outerPoints.length; i++) {
      shape.lineTo(outerPoints[i].x, outerPoints[i].y)
    }

    // Create hole
    const holePath = new THREE.Path()
    holePath.moveTo(innerPoints[0].x, innerPoints[0].y)
    for (let i = 1; i < innerPoints.length; i++) {
      holePath.lineTo(innerPoints[i].x, innerPoints[i].y)
    }
    shape.holes.push(holePath)

    // Extrude to create 3D geometry
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: p.width * 0.1, // Extrusion depth
      bevelEnabled: false,
    })

    mesh.geometry = geometry
  }, [seed])

  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 50 }}
      style={{ width: '100%', height: '100%', display: 'block' }}
      gl={{ antialias: true, alpha: true }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#b400ff" />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color="#00ff9d" />
      <directionalLight position={[0, 5, 5]} intensity={0.6} />

      {/* Ring Mesh */}
      <mesh ref={meshRef} rotation={[0.3, 0, 0]}>
        <meshStandardMaterial
          color="#060610"
          metalness={0.8}
          roughness={0.2}
          emissive="#b400ff"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Auto-rotation */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={true}
        autoRotate={true}
        autoRotateSpeed={1}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
      />
    </Canvas>
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
                <RingPreview3D seed={item.seed} size={200} />
                {/* Rank */}
                <div style={{
                  position: 'absolute', top: 8, left: 10,
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 18, color: 'rgba(180,0,255,0.15)',
                  pointerEvents: 'none',
                  zIndex: 10,
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
                    pointerEvents: 'none',
                    zIndex: 10,
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
                      href={`/np-ring?seed=${item.seed}`}
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
                      {item.physical ? 'RESERVAR' : 'COMPRAR STL'}
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
            <strong style={{ color: '#4a4a6a' }}>URL permanente</strong> — neoproxy.art/np-ring?seed=XXXXX
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

// ── PURCHASE HANDLER (connect to your payment system) ─────────────────────────
function handleBuy(item: typeof DROP_01_SEEDS[0]) {
  // TODO: conectar con Stripe / MercadoPago / email
  // Por ahora: mailto con el ID del objeto
  const subject = encodeURIComponent(`Reserva DROP 01 — NP-${String(item.seed).padStart(5, '0')}`)
  const body = encodeURIComponent(
    `Hola,\n\nQuiero reservar:\n\nID: NP-${String(item.seed).padStart(5, '0')}\nArquetipo: ${item.archetype}\nTipo: ${item.physical ? 'Objeto físico' : 'STL digital'}\nPrecio: $${item.price}\n\nSeed: ${item.seed}\nURL: neoproxy.art/np-ring?seed=${item.seed}`
  )
  window.location.href = `mailto:darkproxy@neoproxy.art?subject=${subject}&body=${body}`
}
