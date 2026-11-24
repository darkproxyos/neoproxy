'use client'

// ANATOMÍA — pedido explícito: un mapa visual, real, de la arquitectura
// técnica de NeoProxy (no el contenido del sitio, que ya cubren
// /experimental/graficos y /experimental/cartografia) -- backend,
// frontend, base de datos, servicios externos y el kernel narrativo,
// verificado contra el código real antes de dibujar nada (middleware.ts,
// auth.ts, src/db/schema.ts, lib/core-db/schema.ts, package.json,
// Memory/hub.json, vercel.json, y un conteo real de los 35 route.ts bajo
// app/api). Datos en components/dataviz/neoproxyArchitecture.ts.
//
// El diagrama de cajas es posición fija a mano (como cualquier diagrama
// de arquitectura real), no un layout de d3-hierarchy -- acá las cajas no
// son un árbol, son capas con flujo real entre ellas. D3 solo entra para
// los dos gráficos de apoyo de abajo (mismo criterio que el resto de
// /experimental/graficos).

import { useState } from 'react'
import Link from 'next/link'
import { scaleLinear } from 'd3'
import { ARCH_BOXES, ARCH_ARROWS, API_ROUTES_BY_CATEGORY, DB_TABLES_BY_AREA } from '@/components/dataviz/neoproxyArchitecture'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'
const RED = '#cc0000'

function boxCenter(id: string) {
  const b = ARCH_BOXES.find((x) => x.id === id)!
  return { x: b.x + b.w / 2, y: b.y + b.h / 2, box: b }
}

function arrowPath(fromId: string, toId: string) {
  const a = boxCenter(fromId), b = boxCenter(toId)
  // conecta borde a borde, no centro a centro -- si no, la flecha se
  // esconde detrás de las cajas de arriba.
  const dx = b.x - a.x, dy = b.y - a.y
  const steep = Math.abs(dy) > Math.abs(dx)
  let sx: number, sy: number, ex: number, ey: number
  if (steep) {
    sx = a.x; sy = a.y + Math.sign(dy) * (a.box.h / 2)
    ex = b.x; ey = b.y - Math.sign(dy) * (b.box.h / 2)
  } else {
    sx = a.x + Math.sign(dx) * (a.box.w / 2); sy = a.y
    ex = b.x - Math.sign(dx) * (b.box.w / 2); ey = b.y
  }
  const mx = (sx + ex) / 2, my = (sy + ey) / 2
  return { d: `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`, ex, ey, dx: ex - sx, dy: ey - sy }
}

function BarRow({ label, count, color, max }: { label: string; count: number; color: string; max: number }) {
  const w = scaleLinear().domain([0, max]).range([0, 280])
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <div style={{ width: 160, fontFamily: mono, fontSize: 9, color: '#8fb8d6', textAlign: 'right' }}>{label}</div>
      <svg width={300} height={16}>
        <rect x={0} y={2} width={Math.max(w(count), 2)} height={12} fill={color} fillOpacity={0.85} />
      </svg>
      <div style={{ fontFamily: mono, fontSize: 11, color }}>{count}</div>
    </div>
  )
}

export default function AnatomiaPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const selectedBox = ARCH_BOXES.find((b) => b.id === selected) ?? null
  const maxApi = Math.max(...API_ROUTES_BY_CATEGORY.map((d) => d.count))
  const maxDb = Math.max(...DB_TABLES_BY_AREA.map((d) => d.count))

  return (
    <div style={{ background: '#01040a', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', padding: '104px 24px 100px' }}>
        <Link href="/experimental" className="press" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${RED}aa`, textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>
          ← VOLVER A EXPERIMENTAL
        </Link>

        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${CYAN}66`, marginBottom: 16 }}>
          NPX-XP-ANATOMIA // LA ARQUITECTURA REAL, NO EL CONTENIDO
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 700, letterSpacing: 6, color: CYAN, textShadow: `0 0 40px ${CYAN}44`, marginBottom: 16, lineHeight: 1 }}>
          ANATOMÍA
        </h1>
        <p style={{ fontSize: 11.5, lineHeight: 2, color: '#8fb8d6', maxWidth: 680, marginBottom: 20 }}>
          No es el mapa del sitio (eso es <Link href="/experimental/cartografia" style={{ color: '#fff', textDecoration: 'underline' }}>/experimental/cartografia</Link>) —
          es la arquitectura técnica real debajo: frontend, backend, base de datos, servicios externos, y el kernel narrativo.
          Cada caja es verificable contra el código — tocala para ver el detalle real.
        </p>

        <div style={{ border: `1px solid ${CYAN}22`, background: 'rgba(0,4,10,0.5)', padding: '20px 16px', marginBottom: 20 }}>
          <svg viewBox="0 0 1000 760" width="100%" style={{ minWidth: 320, display: 'block' }}>
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#ffffff55" />
              </marker>
            </defs>

            {ARCH_ARROWS.map((a, i) => {
              const { d } = arrowPath(a.reverse ? a.to : a.from, a.reverse ? a.from : a.to)
              return <path key={i} d={d} fill="none" stroke="#ffffff33" strokeWidth={1.3} markerEnd="url(#arrowhead)" />
            })}

            {ARCH_BOXES.map((b) => {
              const isSel = selected === b.id
              return (
                <g key={b.id} onClick={() => setSelected((p) => (p === b.id ? null : b.id))} style={{ cursor: 'pointer' }}>
                  <rect
                    x={b.x} y={b.y} width={b.w} height={b.h} rx={6}
                    fill={isSel ? `${b.color}22` : 'rgba(10,14,24,0.75)'}
                    stroke={b.color} strokeWidth={isSel ? 2 : 1}
                  />
                  <text x={b.x + b.w / 2} y={b.y + b.h / 2 - 4} textAnchor="middle" fontSize={12} fontFamily={mono} fill={b.color === '#ffffff' ? '#fff' : b.color} fontWeight={700}>
                    {b.label}
                  </text>
                  <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 14} textAnchor="middle" fontSize={8.5} fontFamily={mono} fill="#8fb8d6">
                    {b.sub}
                  </text>
                </g>
              )
            })}
          </svg>

          {selectedBox ? (
            <div style={{ marginTop: 16, padding: '16px 18px', border: `1px solid ${selectedBox.color}66`, background: `${selectedBox.color}0d` }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: selectedBox.color === '#ffffff' ? '#fff' : selectedBox.color, marginBottom: 10 }}>
                {selectedBox.label}
              </div>
              {selectedBox.detail.map((line, i) => (
                <p key={i} style={{ fontSize: 10, lineHeight: 1.8, color: '#c8daf0', margin: 0, marginBottom: 8 }}>
                  — {line}
                </p>
              ))}
              {selectedBox.href && (
                <Link href={selectedBox.href} className="press" style={{ fontSize: 9, letterSpacing: 1, color: selectedBox.color, textDecoration: 'underline' }}>
                  → VER /archivo/linux (LA COMPARACIÓN HONESTA CON UN KERNEL REAL)
                </Link>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 16, fontSize: 9, letterSpacing: 1, color: '#4a6080', textAlign: 'center' }}>
              TOCÁ CUALQUIER CAJA PARA VER EL DETALLE REAL VERIFICADO CONTRA EL CÓDIGO
            </div>
          )}
        </div>

        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, color: '#4a6080', marginBottom: 16, marginTop: 56 }}>
          LOS 35 API ROUTES REALES, POR CATEGORÍA
        </div>
        <div style={{ marginBottom: 56 }}>
          {API_ROUTES_BY_CATEGORY.map((d) => (
            <BarRow key={d.label} label={d.label} count={d.count} color={d.color} max={maxApi} />
          ))}
        </div>

        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, color: '#4a6080', marginBottom: 16 }}>
          LAS 13 TABLAS REALES DE TURSO, POR ÁREA
        </div>
        <div>
          {DB_TABLES_BY_AREA.map((d) => (
            <div key={d.label} style={{ marginBottom: 10 }}>
              <BarRow label={d.label} count={d.count} color={d.color} max={maxDb} />
              <div style={{ fontSize: 8, color: '#4a6080', paddingLeft: 172, marginTop: -4 }}>
                {d.tables.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
