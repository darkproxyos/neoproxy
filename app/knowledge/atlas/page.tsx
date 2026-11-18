'use client'

// ATLAS — mapa visual del Codex completo: una línea de tiempo real (D3
// solo para la matemática de las escalas, el render es JSX/SVG normal de
// React, no manipulación directa del DOM vía d3.select) sobre los mismos
// datos que ya existen en components/knowledge/entries.ts, sin inventar
// ninguno nuevo. El cluster 'geometria' queda afuera a propósito: sus
// entradas no tienen año real (son categorías dimensionales, "DIMENSIÓN
// 0".."DIMENSIÓN 5+"), así que entrarían al parser de año como "0", "1",
// "2"... números falsos que arruinarían la escala real del resto.
//
// Pedido explícito: una sección con estadísticas/gráficos D3, con
// conceptos, fechas y autores -- sobre el Codex tal como está ahora
// (quince documentos largos + los ~70 nombres de /knowledge).

import Link from 'next/link'
import { scaleLinear, scaleBand } from 'd3'
import { entries, clusters, type Cluster } from '@/components/knowledge/entries'
import { ARCHIVE_DOCS, type ArchiveDoc } from '@/components/knowledge/archiveDocs'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'

// Mismo parser que ya usa app/knowledge/page.tsx (parseStartYear) -- toma
// el primer número real de la cadena "years". Se repite acá en vez de
// importarlo porque esa función vive sin exportar dentro de una página.
function parseStartYear(years: string): number | null {
  const match = years.match(/\d{3,4}/) // 3-4 dígitos: descarta "0".."5" de DIMENSIÓN N
  return match ? parseInt(match[0], 10) : null
}

const TIMELINE_CLUSTERS: Cluster[] = ['informacion', 'mente', 'autoorganizacion', 'sistemas', 'computacion', 'estetica']

const FORMATS: ArchiveDoc['format'][] = ['REFERENCIA TÉCNICA', 'ANÁLISIS CULTURAL', 'TEORÍA DISPUTADA', 'ENSAYO']
const FORMAT_COLOR: Record<ArchiveDoc['format'], string> = {
  'REFERENCIA TÉCNICA': '#5fd4ff', 'ANÁLISIS CULTURAL': '#d946ef', 'TEORÍA DISPUTADA': '#39d953', 'ENSAYO': '#b06bff',
}

const W = 920
const H = 60 * TIMELINE_CLUSTERS.length + 60
const MARGIN = { top: 30, right: 40, bottom: 40, left: 180 }

export default function AtlasPage() {
  const dated = entries
    .filter(e => TIMELINE_CLUSTERS.includes(e.cluster))
    .map(e => ({ ...e, year: parseStartYear(e.years) }))
    .filter((e): e is typeof e & { year: number } => e.year !== null)

  const minYear = Math.min(...dated.map(d => d.year))
  const maxYear = Math.max(...dated.map(d => d.year))

  const x = scaleLinear().domain([minYear - 5, maxYear + 5]).range([MARGIN.left, W - MARGIN.right])
  const y = scaleBand<Cluster>().domain(TIMELINE_CLUSTERS).range([MARGIN.top, H - MARGIN.bottom]).padding(0.3)

  const xTicks = x.ticks(8)

  const clusterCounts = TIMELINE_CLUSTERS.map(c => ({ cluster: c, count: entries.filter(e => e.cluster === c).length }))
  const formatCounts = FORMATS.map(f => ({ format: f, count: ARCHIVE_DOCS.filter(d => d.format === f).length }))
  const maxFormatCount = Math.max(...formatCounts.map(f => f.count))
  const barX = scaleLinear().domain([0, maxFormatCount]).range([0, 260])

  return (
    <div style={{ background: '#01040a', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', padding: '104px 24px 100px' }}>
        <Link href="/knowledge" style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: `${CYAN}88`, textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>
          ← VOLVER AL CODEX
        </Link>

        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${CYAN}66`, marginBottom: 16 }}>
          NPX-KNW-ATLAS // EL CODEX ENTERO, EN UNA SOLA VISTA
        </div>
        <h1 style={{
          fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 700, letterSpacing: 8, color: CYAN,
          textShadow: `0 0 40px ${CYAN}44`, marginBottom: 16, lineHeight: 1,
        }}>
          ATLAS
        </h1>
        <p style={{ fontSize: 11.5, lineHeight: 2, color: '#8fb8d6', maxWidth: 680, marginBottom: 40 }}>
          Mismos datos reales que ya viven en <Link href="/knowledge" style={{ color: '#fff', textDecoration: 'underline' }}>/knowledge</Link> — nada
          inventado para esta vista, solo reorganizado en el tiempo. El cluster GEOMETRÍA queda afuera:
          sus entradas son categorías dimensionales sin año real, no personas ni hechos fechables.
        </p>

        {/* ESTADISTICAS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 56 }}>
          {[
            { label: 'NOMBRES EN EL MAPA', value: dated.length },
            { label: 'DOCUMENTOS DEL CODEX', value: ARCHIVE_DOCS.length },
            { label: 'RANGO DE AÑOS', value: `${minYear}–${maxYear}` },
            { label: 'CLUSTERS EN LA LÍNEA', value: TIMELINE_CLUSTERS.length },
          ].map(stat => (
            <div key={stat.label} style={{ border: `1px solid ${CYAN}33`, background: `${CYAN}08`, padding: '14px 18px', minWidth: 150 }}>
              <div style={{ fontSize: 20, color: CYAN }}>{stat.value}</div>
              <div style={{ fontSize: 8.5, letterSpacing: 1.5, color: '#5a7290', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* LINEA DE TIEMPO */}
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, color: '#4a6080', marginBottom: 16 }}>
          LÍNEA DE TIEMPO — TOCÁ UN PUNTO
        </div>
        <div style={{ overflowX: 'auto', marginBottom: 64, border: `1px solid ${CYAN}22`, padding: '16px 8px' }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 720, display: 'block' }}>
            {/* lineas de cluster */}
            {TIMELINE_CLUSTERS.map(c => (
              <g key={c}>
                <line
                  x1={MARGIN.left} x2={W - MARGIN.right}
                  y1={(y(c) ?? 0) + y.bandwidth() / 2} y2={(y(c) ?? 0) + y.bandwidth() / 2}
                  stroke={`${clusters[c].color}22`} strokeWidth={1}
                />
                <text
                  x={MARGIN.left - 14} y={(y(c) ?? 0) + y.bandwidth() / 2 + 3}
                  textAnchor="end" fontSize={9} fill={clusters[c].color} fontFamily={mono}
                >
                  {clusters[c].label}
                </text>
              </g>
            ))}

            {/* eje de años */}
            {xTicks.map(t => (
              <g key={t}>
                <line x1={x(t)} x2={x(t)} y1={MARGIN.top - 10} y2={H - MARGIN.bottom + 6} stroke="#ffffff0a" />
                <text x={x(t)} y={H - MARGIN.bottom + 20} textAnchor="middle" fontSize={9} fill="#4a6080" fontFamily={mono}>
                  {t}
                </text>
              </g>
            ))}

            {/* puntos */}
            {dated.map(d => (
              <a key={d.id} href={`/knowledge?entry=${d.id}`}>
                <circle
                  cx={x(d.year)} cy={(y(d.cluster) ?? 0) + y.bandwidth() / 2}
                  r={5} fill={clusters[d.cluster].color} fillOpacity={0.85}
                  stroke="#01040a" strokeWidth={1}
                >
                  <title>{`${d.name} (${d.years}) — ${d.role}`}</title>
                </circle>
              </a>
            ))}
          </svg>
        </div>

        {/* NOMBRES POR CLUSTER */}
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, color: '#4a6080', marginBottom: 16 }}>
          NOMBRES POR CLUSTER
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 64 }}>
          {clusterCounts.map(c => (
            <div key={c.cluster} style={{
              display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${clusters[c.cluster].color}44`,
              background: `${clusters[c.cluster].color}0a`, padding: '8px 14px',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: clusters[c.cluster].color, display: 'inline-block' }} />
              <span style={{ fontSize: 10, color: '#c8daf0' }}>{clusters[c.cluster].label}</span>
              <span style={{ fontSize: 10, color: clusters[c.cluster].color }}>{c.count}</span>
            </div>
          ))}
        </div>

        {/* DOCUMENTOS POR FORMATO */}
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, color: '#4a6080', marginBottom: 16 }}>
          DOCUMENTOS DEL CODEX POR FORMATO
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
          {formatCounts.map(f => (
            <div key={f.format} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 150, fontSize: 9.5, color: '#8fb8d6', textAlign: 'right' }}>{f.format}</div>
              <svg width={260} height={16}>
                <rect x={0} y={2} width={Math.max(barX(f.count), 2)} height={12} fill={FORMAT_COLOR[f.format]} />
              </svg>
              <div style={{ fontSize: 11, color: FORMAT_COLOR[f.format] }}>{f.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
