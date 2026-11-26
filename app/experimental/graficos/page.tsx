'use client'

// GRÁFICOS — pedido explícito: una muestra jugable de los distintos tipos
// de gráfico que ofrece D3, cada uno sobre información real de NeoProxy
// (nada de datos de ejemplo). Mismo criterio que /knowledge/atlas: D3 solo
// para la matemática (escalas, pie/arc, simulación de fuerzas) — el
// render es JSX/SVG normal de React, sin d3.select tocando el DOM. La
// única excepción real es la red de fuerzas: esa sí es dinámica de verdad
// (d3-force corriendo en vivo), con arrastre de nodos implementado con
// eventos de puntero de React en vez de d3-drag, para no mezclar los dos
// dueños del DOM.
//
// Seis tipos de gráfico, seis datasets reales distintos:
//  I.   Red de fuerzas    — las zonas y uniones reales del Home 3D
//  II.  Dispersión        — los algoritmos reales que corren en /experimental, por año de publicación
//  III. Donut             — especímenes curados por modo generativo
//  IV.  Burbujas           — especímenes: nodos generados vs. velocidad real de la corrida
//  V.   Barra radial       — nombres del Codex por cluster
//  VI.  Barra simple       — PROXYGAMES por estado (jugable / demo)

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  scaleLinear, scaleBand, scaleSqrt, pie, arc,
  forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide,
} from 'd3'
import {
  ZONE_GRAPH_NODES, ZONE_GRAPH_LINKS, ALGORITHMS_TIMELINE, GAMES_BY_STATUS,
} from '@/components/dataviz/neoproxyChartsData'
import { loadCuratedSpecimens, type CuratedSpecimen, type CuratedMode } from '@/components/proxygenesis/curated'
import { entries, clusters, type Cluster } from '@/components/knowledge/entries'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'
const RED = '#cc0000'

const MODE_COLOR: Record<CuratedMode, string> = {
  coral: '#ff5e9e', arbol: '#00ff9d', concha: '#ffb800', red: '#00d4ff', muda: '#a0ffd0', retazos: '#6644aa',
}
const MODE_LABEL: Record<CuratedMode, string> = {
  coral: 'CORAL', arbol: 'ÁRBOL', concha: 'CONCHA', red: 'RED NEURONAL', muda: 'MUDA', retazos: 'RETAZOS',
}

function SectionLabel({ roman, title, kind }: { roman: string; title: string; kind: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 2, color: `${CYAN}66` }}>{kind}</div>
      <div style={{ fontFamily: mono, fontSize: 15, letterSpacing: 2, color: '#fff' }}>
        <span style={{ color: CYAN }}>{roman}.</span> {title}
      </div>
    </div>
  )
}

function ChartBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${CYAN}22`, background: 'rgba(0,4,10,0.5)', padding: '20px 16px', marginBottom: 64, overflowX: 'auto' }}>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------
// I. RED DE FUERZAS — d3-force en vivo, arrastrable
// ---------------------------------------------------------------------
function ForceGraph() {
  const W = 760, H = 440
  const svgRef = useRef<SVGSVGElement>(null)
  const simRef = useRef<any>(null)
  const [nodes, setNodes] = useState<any[]>([])
  const [links, setLinks] = useState<any[]>([])
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    let disposed = false
    const simNodes = ZONE_GRAPH_NODES.map((n) => ({ ...n }))
    const simLinks = ZONE_GRAPH_LINKS.map((l) => ({ ...l }))
    const sim = forceSimulation(simNodes as any)
      .force('link', forceLink(simLinks as any).id((d: any) => d.id).distance((l: any) =>
        (l.source as any).group === 'zone' && (l.target as any).group === 'zone' ? 150 : 65).strength(0.8))
      .force('charge', forceManyBody().strength(-220))
      .force('center', forceCenter(W / 2, H / 2))
      .force('collide', forceCollide((d: any) => (d.group === 'zone' ? 32 : 20)))
    sim.on('tick', () => {
      if (disposed) return
      setNodes([...simNodes])
      setLinks([...simLinks])
    })
    simRef.current = sim
    return () => { disposed = true; sim.stop() }
  }, [])

  const toSvgPoint = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect()
    return { x: (clientX - rect.left) * (W / rect.width), y: (clientY - rect.top) * (H / rect.height) }
  }

  const startDrag = (node: any) => (e: React.PointerEvent) => {
    e.preventDefault()
    simRef.current?.alphaTarget(0.3).restart()
    const p = toSvgPoint(e.clientX, e.clientY)
    node.fx = p.x; node.fy = p.y
    const onMove = (ev: PointerEvent) => {
      const p2 = toSvgPoint(ev.clientX, ev.clientY)
      node.fx = p2.x; node.fy = p2.y
    }
    const onUp = () => {
      node.fx = null; node.fy = null
      simRef.current?.alphaTarget(0)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 320, display: 'block', touchAction: 'none' }}>
        {links.map((l, i) => (
          <line key={i} x1={l.source.x} y1={l.source.y} x2={l.target.x} y2={l.target.y} stroke="#ffffff20" strokeWidth={1} />
        ))}
        {nodes.map((n) => (
          <g
            key={n.id}
            onPointerDown={startDrag(n)}
            onMouseEnter={() => setHovered(n.id)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'grab' }}
          >
            <circle
              cx={n.x} cy={n.y} r={n.group === 'zone' ? 11 : 6}
              fill={n.color} fillOpacity={hovered === n.id ? 1 : 0.85}
              stroke="#01040a" strokeWidth={1.5}
            />
            <text
              x={n.x} y={n.y - (n.group === 'zone' ? 17 : 11)} textAnchor="middle"
              fontSize={n.group === 'zone' ? 9.5 : 7.5} fontFamily={mono}
              fill={hovered === n.id ? '#fff' : '#8fb8d6'}
            >
              {n.label}
            </text>
            <title>{n.label} → {n.href}</title>
          </g>
        ))}
      </svg>
      <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1, color: '#6f86a3', marginTop: 8 }}>
        ARRASTRÁ CUALQUIER NODO — ES UNA SIMULACIÓN DE FUERZAS REAL (d3-force), NO UNA POSICIÓN FIJA
      </div>
    </>
  )
}

// ---------------------------------------------------------------------
// II. DISPERSIÓN TEMPORAL — algoritmos reales por año de publicación
// ---------------------------------------------------------------------
function AlgorithmScatter() {
  const W = 760, H = 220
  const MARGIN = { top: 10, right: 20, bottom: 30, left: 110 }
  const modes = [...new Set(ALGORITHMS_TIMELINE.map((a) => a.mode))]
  const years = ALGORITHMS_TIMELINE.map((a) => a.year)
  const x = scaleLinear().domain([Math.min(...years) - 4, Math.max(...years) + 4]).range([MARGIN.left, W - MARGIN.right])
  const y = scaleBand<string>().domain(modes).range([MARGIN.top, H - MARGIN.bottom]).padding(0.4)
  const xTicks = x.ticks(8)

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 560, display: 'block' }}>
        {modes.map((m) => (
          <g key={m}>
            <line x1={MARGIN.left} x2={W - MARGIN.right} y1={(y(m) ?? 0) + y.bandwidth() / 2} y2={(y(m) ?? 0) + y.bandwidth() / 2} stroke="#ffffff14" />
            <text x={MARGIN.left - 12} y={(y(m) ?? 0) + y.bandwidth() / 2 + 3} textAnchor="end" fontSize={9} fontFamily={mono} fill="#8fb8d6">{m}</text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={t} x={x(t)} y={H - MARGIN.bottom + 18} textAnchor="middle" fontSize={9} fontFamily={mono} fill="#4a6080">{t}</text>
        ))}
        {ALGORITHMS_TIMELINE.map((a) => (
          <a key={a.name} href={a.href}>
            <circle cx={x(a.year)} cy={(y(a.mode) ?? 0) + y.bandwidth() / 2} r={6} fill={a.modeColor} fillOpacity={0.88} stroke="#01040a" strokeWidth={1}>
              <title>{`${a.name} (${a.year})`}</title>
            </circle>
          </a>
        ))}
      </svg>
      <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1, color: '#6f86a3', marginTop: 8 }}>
        CADA PUNTO ES UN ALGORITMO REAL CORRIENDO HOY EN /experimental — TOCALO PARA IR A SU MODO
      </div>
    </>
  )
}

// ---------------------------------------------------------------------
// III. DONUT — especímenes curados por modo generativo
// ---------------------------------------------------------------------
function SpecimenDonut({ specimens }: { specimens: CuratedSpecimen[] }) {
  const counts = new Map<CuratedMode, number>()
  specimens.forEach((s) => counts.set(s.mode, (counts.get(s.mode) ?? 0) + 1))
  const data = [...counts.entries()].map(([mode, count]) => ({ mode, count }))
  const R = 100
  const pieGen = pie<{ mode: CuratedMode; count: number }>().value((d) => d.count).sort(null)
  const arcGen = arc<any>().innerRadius(R * 0.55).outerRadius(R)
  const arcs = pieGen(data)

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'center' }}>
      <svg width={R * 2 + 20} height={R * 2 + 20} viewBox={`${-R - 10} ${-R - 10} ${R * 2 + 20} ${R * 2 + 20}`}>
        {arcs.map((d) => (
          <path key={d.data.mode} d={arcGen(d) ?? undefined} fill={MODE_COLOR[d.data.mode]} fillOpacity={0.88} stroke="#01040a" strokeWidth={2}>
            <title>{`${MODE_LABEL[d.data.mode]}: ${d.data.count}`}</title>
          </path>
        ))}
        <text textAnchor="middle" y={-4} fontSize={22} fontFamily={mono} fill="#fff">{specimens.length}</text>
        <text textAnchor="middle" y={14} fontSize={8} fontFamily={mono} fill="#4a6080" letterSpacing={1}>ESPECÍMENES</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d) => (
          <div key={d.mode} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: mono, fontSize: 11 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: MODE_COLOR[d.mode], display: 'inline-block' }} />
            <span style={{ color: '#8fb8d6' }}>{MODE_LABEL[d.mode]}</span>
            <span style={{ color: MODE_COLOR[d.mode] }}>{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------
// IV. BURBUJAS — especímenes: nodos generados vs. velocidad real de corrida
// ---------------------------------------------------------------------
function SpecimenBubbles({ specimens }: { specimens: CuratedSpecimen[] }) {
  const W = 760, H = 320
  const MARGIN = { top: 20, right: 30, bottom: 40, left: 70 }
  const maxNodes = Math.max(...specimens.map((s) => s.stats.nodeCount))
  const maxSpeed = Math.max(...specimens.map((s) => s.stats.iterationsPerSecond))
  const x = scaleLinear().domain([0, maxNodes * 1.1]).range([MARGIN.left, W - MARGIN.right])
  const y = scaleLinear().domain([0, maxSpeed * 1.15]).range([H - MARGIN.bottom, MARGIN.top])
  const r = scaleSqrt().domain([0, Math.max(...specimens.map((s) => s.stats.elapsedSeconds))]).range([5, 26])

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 560, display: 'block' }}>
        {x.ticks(6).map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={MARGIN.top} y2={H - MARGIN.bottom} stroke="#ffffff0a" />
            <text x={x(t)} y={H - MARGIN.bottom + 16} textAnchor="middle" fontSize={8.5} fontFamily={mono} fill="#4a6080">{t}</text>
          </g>
        ))}
        {y.ticks(5).map((t) => (
          <g key={t}>
            <line x1={MARGIN.left} x2={W - MARGIN.right} y1={y(t)} y2={y(t)} stroke="#ffffff0a" />
            <text x={MARGIN.left - 10} y={y(t) + 3} textAnchor="end" fontSize={8.5} fontFamily={mono} fill="#4a6080">{t}</text>
          </g>
        ))}
        <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={9} fontFamily={mono} fill="#8fb8d6" letterSpacing={1}>NODOS GENERADOS</text>
        <text x={14} y={H / 2} textAnchor="middle" fontSize={9} fontFamily={mono} fill="#8fb8d6" letterSpacing={1} transform={`rotate(-90, 14, ${H / 2})`}>ITERACIONES / SEG</text>
        {specimens.map((s) => (
          <circle
            key={s.id} cx={x(s.stats.nodeCount)} cy={y(s.stats.iterationsPerSecond)} r={r(s.stats.elapsedSeconds)}
            fill={MODE_COLOR[s.mode]} fillOpacity={0.55} stroke={MODE_COLOR[s.mode]} strokeWidth={1.5}
          >
            <title>{`${s.title} — ${s.stats.nodeCount} nodos, ${s.stats.iterationsPerSecond.toFixed(1)} it/s, corrida de ${Math.round(s.stats.elapsedSeconds)}s (radio = duración real)`}</title>
          </circle>
        ))}
      </svg>
      <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1, color: '#6f86a3', marginTop: 8 }}>
        EL TAMAÑO DE CADA BURBUJA ES LA DURACIÓN REAL DE ESA CORRIDA, EN SEGUNDOS
      </div>
    </>
  )
}

// ---------------------------------------------------------------------
// V. BARRA RADIAL — nombres del Codex por cluster
// ---------------------------------------------------------------------
function ClusterRadialBar() {
  const CLUSTER_ORDER: Cluster[] = ['informacion', 'mente', 'autoorganizacion', 'sistemas', 'computacion', 'estetica', 'geometria']
  const counts = CLUSTER_ORDER
    .map((c) => ({ cluster: c, count: entries.filter((e) => e.cluster === c).length }))
    .filter((d) => d.count > 0)
  const R_INNER = 40, R_OUTER = 150
  const maxCount = Math.max(...counts.map((d) => d.count))
  const radius = scaleLinear().domain([0, maxCount]).range([R_INNER, R_OUTER])
  const angle = scaleBand<string>().domain(counts.map((d) => d.cluster)).range([0, Math.PI * 2]).padding(0.25)
  // margen generoso a propósito: varios labels reales son largos ("COMPUTACIÓN
  // // LA PILA COMPLETA") y quedaban recortados contra el borde del viewBox --
  // visto y corregido en la verificación con captura antes de este commit.
  const SIZE = R_OUTER * 2 + 230
  const barArc = arc<any>()
    .innerRadius(R_INNER)
    .outerRadius((d: any) => radius(d.count))
    .startAngle((d: any) => angle(d.cluster) ?? 0)
    .endAngle((d: any) => (angle(d.cluster) ?? 0) + angle.bandwidth())
    .padAngle(0.02)
    .cornerRadius(3)

  return (
    <>
      <svg viewBox={`${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`} width="100%" style={{ maxWidth: SIZE, display: 'block', margin: '0 auto' }}>
        {counts.map((d) => {
          const a = (angle(d.cluster) ?? 0) + angle.bandwidth() / 2 - Math.PI / 2
          const labelR = R_OUTER + 24
          // los labels reales con "//" (ej. "COMPUTACIÓN // LA PILA COMPLETA")
          // se parten en dos líneas en ese mismo separador -- una sola línea
          // larga era lo que se salía del viewBox.
          const labelLines = clusters[d.cluster].label.split(' // ')
          return (
            <g key={d.cluster}>
              <path d={barArc(d) ?? undefined} fill={clusters[d.cluster].color} fillOpacity={0.82} transform="rotate(-90)">
                <title>{`${clusters[d.cluster].label}: ${d.count} nombres`}</title>
              </path>
              <text
                x={Math.cos(a) * labelR} y={Math.sin(a) * labelR}
                textAnchor="middle" fontSize={9} fontFamily={mono} fill={clusters[d.cluster].color}
              >
                {labelLines.map((line, i) => (
                  <tspan key={i} x={Math.cos(a) * labelR} dy={i === 0 ? 0 : 11}>{line}</tspan>
                ))}
              </text>
              <text
                x={Math.cos(a) * (labelR + 13 + (labelLines.length - 1) * 11)} y={Math.sin(a) * (labelR + 13 + (labelLines.length - 1) * 11)}
                textAnchor="middle" fontSize={8} fontFamily={mono} fill="#4a6080"
              >
                {d.count}
              </text>
            </g>
          )
        })}
      </svg>
      <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1, color: '#6f86a3', marginTop: 8, textAlign: 'center' }}>
        LARGO DEL ARCO = CANTIDAD DE NOMBRES REALES EN ESE CLUSTER DE /knowledge
      </div>
    </>
  )
}

// ---------------------------------------------------------------------
// VI. BARRA SIMPLE — PROXYGAMES por estado
// ---------------------------------------------------------------------
function GamesStatusBar() {
  const jugable = GAMES_BY_STATUS.filter((g) => g.status === 'jugable')
  const demo = GAMES_BY_STATUS.filter((g) => g.status === 'demo')
  const max = GAMES_BY_STATUS.length
  const w = scaleLinear().domain([0, max]).range([0, 420])
  const rows = [
    { label: 'JUGABLE', items: jugable, color: '#00ffcc' },
    { label: 'DEMO', items: demo, color: '#ffb800' },
  ]
  return (
    <>
      {rows.map((row) => (
        <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 70, fontFamily: mono, fontSize: 11, color: '#8fb8d6', textAlign: 'right' }}>{row.label}</div>
          <svg width={440} height={22}>
            <rect x={0} y={3} width={Math.max(w(row.items.length), 2)} height={16} fill={row.color} fillOpacity={0.85}>
              <title>{row.items.map((g) => g.title).join(', ')}</title>
            </rect>
          </svg>
          <div style={{ fontFamily: mono, fontSize: 12, color: row.color }}>{row.items.length}</div>
        </div>
      ))}
      <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1, color: '#6f86a3', marginTop: 6 }}>
        PASÁ EL MOUSE SOBRE CADA BARRA PARA VER LOS TÍTULOS REALES
      </div>
    </>
  )
}

export default function GraficosPage() {
  const [specimens, setSpecimens] = useState<CuratedSpecimen[] | null>(null)
  useEffect(() => { loadCuratedSpecimens().then(setSpecimens) }, [])

  return (
    <div style={{ background: '#01040a', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '104px 24px 100px' }}>
        <Link href="/experimental" className="press tap-ext" style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 3, color: `${RED}aa`, textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>
          ← VOLVER A EXPERIMENTAL
        </Link>

        <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: 6, color: `${CYAN}66`, marginBottom: 16 }}>
          NPX-XP-GRAFICOS // GALERÍA DE D3
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 700, letterSpacing: 6, color: CYAN, textShadow: `0 0 40px ${CYAN}44`, marginBottom: 16, lineHeight: 1 }}>
          GRÁFICOS
        </h1>
        <p style={{ fontSize: 12.5, lineHeight: 2, color: '#8fb8d6', maxWidth: 680, marginBottom: 56 }}>
          Seis formas distintas de graficar con D3 — red de fuerzas, dispersión, donut, burbujas, barra radial,
          barra simple — cada una sobre un dato real de NeoProxy, no un ejemplo de relleno. La red de fuerzas es
          la única con física de verdad corriendo en vivo: arrastrá cualquier nodo.
        </p>

        <SectionLabel roman="I" title="LAS ZONAS DEL HOME, COMO RED DE FUERZAS" kind="GRÁFICO DE RED (FORCE-DIRECTED)" />
        <ChartBox><ForceGraph /></ChartBox>

        <SectionLabel roman="II" title="ALGORITMOS REALES DE /experimental, POR AÑO" kind="DISPERSIÓN / LÍNEA DE TIEMPO" />
        <ChartBox><AlgorithmScatter /></ChartBox>

        <SectionLabel roman="III" title="ESPECÍMENES CURADOS, POR MODO GENERATIVO" kind="DONUT" />
        <ChartBox>
          {specimens ? <SpecimenDonut specimens={specimens} /> : <Loading />}
        </ChartBox>

        <SectionLabel roman="IV" title="CADA CORRIDA REAL DEL MOTOR GENERATIVO" kind="DISPERSIÓN DE BURBUJAS" />
        <ChartBox>
          {specimens ? <SpecimenBubbles specimens={specimens} /> : <Loading />}
        </ChartBox>

        <SectionLabel roman="V" title="EL CODEX, POR CLUSTER TEMÁTICO" kind="BARRA RADIAL / POLAR" />
        <ChartBox><ClusterRadialBar /></ChartBox>

        <SectionLabel roman="VI" title="PROXYGAMES, JUGABLE VS. DEMO" kind="BARRA HORIZONTAL" />
        <ChartBox><GamesStatusBar /></ChartBox>
      </div>
    </div>
  )
}

function Loading() {
  return <div style={{ fontFamily: mono, fontSize: 11, color: '#6f86a3', letterSpacing: 1, padding: '20px 0' }}>CARGANDO ESPECÍMENES REALES...</div>
}
