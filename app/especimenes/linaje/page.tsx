'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FAMILIES, FAMILY_COLOR, FAMILY_LABEL, type Family } from '@/lib/specimens/families'
import type { ArchiveEntry } from '@/lib/specimens/evolution'
import type { Votes } from '@/lib/specimens/votes'

const mono = "'Space Mono', monospace"
const ACCENT = '#00ffcc'
const COL_W = 150, LANE_H = 30, TOP = 34, LEFT_PAD = 24

type Hist = { gen: number; hall: number; survivors: number; died: number; born: { mutante: number; cruce: number; nacida: number }; archive?: number; coverage?: number; novelty?: number }
type Node = ArchiveEntry & { x: number; y: number; alive: boolean }

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0) / 4294967296 }
const KIND = { n: 'nacida', m: 'mutante', c: 'cruce' } as const

export default function LinajePage() {
  const router = useRouter()
  const [entries, setEntries] = useState<ArchiveEntry[] | null>(null)
  const [aliveIds, setAliveIds] = useState<Set<string>>(new Set())
  const [generation, setGeneration] = useState(0)
  const [history, setHistory] = useState<Hist[]>([])
  const [votes, setVotes] = useState<Record<string, Votes>>({})
  const [error, setError] = useState(false)
  const [hover, setHover] = useState<Node | null>(null)
  const [picked, setPicked] = useState<Node | null>(null)
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [cw, setCw] = useState(0)

  // con pocas generaciones el árbol se ensancha para llenar el espacio; con
  // muchas, cada columna mide COL_W y se desplaza horizontalmente
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setCw(el.clientWidth))
    ro.observe(el); setCw(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    Promise.all([
      fetch('/proxygenesis/archive.json').then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch('/proxygenesis/pool.json').then((r) => (r.ok ? r.json() : Promise.reject())),
    ]).then(([a, p]) => {
      setEntries(a.entries)
      setAliveIds(new Set<string>(p.hall.map((h: { id: string }) => h.id)))
      setGeneration(p.generation ?? 0)
      setHistory(p.history ?? [])
    }).catch(() => setError(true))
    fetch('/api/specimens/votes?all=1').then((r) => (r.ok ? r.json() : Promise.reject())).then((j) => { if (j.ok) setVotes(j.votes) }).catch(() => { /* sin votos */ })
  }, [])

  const lanes = FAMILIES as readonly Family[]
  const colW = Math.max(COL_W, cw ? Math.floor((cw - LEFT_PAD * 2) / (generation + 1)) : COL_W)
  const width = (generation + 1) * colW + LEFT_PAD * 2
  const height = TOP + lanes.length * LANE_H + 16

  const graph = useMemo(() => {
    if (!entries) return null
    const nodes = new Map<string, Node>()
    for (const e of entries) {
      const lane = lanes.indexOf(e.f)
      nodes.set(e.id, {
        ...e, alive: aliveIds.has(e.id),
        x: LEFT_PAD + e.b * colW + 12 + hash(e.id + 'x') * (colW - 30),
        y: TOP + lane * LANE_H + 5 + hash(e.id + 'y') * (LANE_H - 10),
      })
    }
    const kids = new Map<string, string[]>()
    for (const n of nodes.values()) for (const p of n.p ?? []) kids.set(p, [...(kids.get(p) ?? []), n.id])
    return { nodes, kids }
  }, [entries, aliveIds, lanes, colW])

  // ascendencia y descendencia de la pieza señalada
  const related = useMemo(() => {
    const focus = hover ?? picked
    if (!focus || !graph) return null
    const set = new Set<string>([focus.id])
    const up = (id: string) => { for (const p of graph.nodes.get(id)?.p ?? []) if (!set.has(p) && graph.nodes.has(p)) { set.add(p); up(p) } }
    const down = (id: string) => { for (const c of graph.kids.get(id) ?? []) if (!set.has(c)) { set.add(c); down(c) } }
    up(focus.id); down(focus.id)
    return set
  }, [hover, picked, graph])

  const stats = useMemo(() => {
    if (!entries) return null
    const alive = entries.filter((e) => e.x === undefined).length
    return {
      total: entries.length, alive, dead: entries.length - alive,
      m: entries.filter((e) => e.k === 'm').length, c: entries.filter((e) => e.k === 'c').length,
    }
  }, [entries])

  const draw = useCallback(() => {
    const cv = canvasRef.current
    if (!cv || !graph) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    cv.width = width * dpr; cv.height = height * dpr
    const ctx = cv.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    // franjas de familia y encabezados de generación
    ctx.font = `9px ${mono}`
    lanes.forEach((f, i) => {
      if (i % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.025)'; ctx.fillRect(0, TOP + i * LANE_H, width, LANE_H) }
    })
    ctx.fillStyle = '#6f86a3'; ctx.textAlign = 'left'
    for (let g = 0; g <= generation; g++) {
      const x = LEFT_PAD + g * colW
      ctx.fillText(`GEN ${g}`, x + 4, 18)
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(x, 24); ctx.lineTo(x, height - 8); ctx.stroke()
    }
    const dim = related !== null
    const on = (id: string) => !dim || related!.has(id)
    // aristas
    for (const n of graph.nodes.values()) for (const pid of n.p ?? []) {
      const p = graph.nodes.get(pid); if (!p) continue
      const lit = on(n.id) && on(pid)
      ctx.strokeStyle = n.k === 'c' ? `rgba(242,240,255,${lit ? (dim ? 0.95 : 0.5) : 0.04})` : `${FAMILY_COLOR[n.f]}${lit ? (dim ? 'ee' : '66') : '0a'}`
      ctx.lineWidth = lit && dim ? 1.6 : 0.8
      ctx.beginPath(); ctx.moveTo(p.x, p.y)
      ctx.bezierCurveTo(p.x + colW * 0.45, p.y, n.x - colW * 0.45, n.y, n.x, n.y); ctx.stroke()
    }
    // nodos
    for (const n of graph.nodes.values()) {
      const lit = on(n.id), r = 2.2 + n.s * 2.4
      const l = votes[n.id]?.l ?? 0
      if (l > 0 && lit) { ctx.fillStyle = 'rgba(255,214,102,0.35)'; ctx.beginPath(); ctx.arc(n.x, n.y, r + 4, 0, 6.2832); ctx.fill() }
      ctx.globalAlpha = lit ? (n.alive ? 1 : 0.38) : 0.06
      ctx.fillStyle = FAMILY_COLOR[n.f]
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 6.2832); ctx.fill()
      if (n.alive && lit) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(n.x, n.y, r + 1.6, 0, 6.2832); ctx.stroke() }
      if (n.k === 'c' && lit) { ctx.strokeStyle = '#f2f0ff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(n.x - r - 2, n.y); ctx.lineTo(n.x + r + 2, n.y); ctx.moveTo(n.x, n.y - r - 2); ctx.lineTo(n.x, n.y + r + 2); ctx.stroke() }
      ctx.globalAlpha = 1
    }
    const focus = hover ?? picked
    if (focus) { ctx.strokeStyle = ACCENT; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(focus.x, focus.y, 8, 0, 6.2832); ctx.stroke() }
  }, [graph, width, height, lanes, generation, related, hover, picked, votes, colW])

  useEffect(() => { draw() }, [draw])
  useEffect(() => { if (graph && scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth }, [graph])

  const nearest = (clientX: number, clientY: number): Node | null => {
    if (!graph || !canvasRef.current) return null
    const b = canvasRef.current.getBoundingClientRect()
    const x = clientX - b.left, y = clientY - b.top
    let best: Node | null = null, bd = 100
    for (const n of graph.nodes.values()) {
      const d = (n.x - x) ** 2 + (n.y - y) ** 2
      if (d < bd) { bd = d; best = n }
    }
    return best
  }

  const lastHist = history[history.length - 1]
  const box = { padding: '16px 18px', border: `1px solid ${ACCENT}22`, background: 'rgba(255,255,255,0.02)' } as const

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative', overflowX: 'hidden' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '104px 24px 100px' }}>
        <Link href="/especimenes/laboratorio" className="press" style={{ fontSize: 9, letterSpacing: 3, color: '#8fa8c4', textDecoration: 'none', display: 'inline-block', marginBottom: 28 }}>
          ← VOLVER AL LABORATORIO
        </Link>
        <div style={{ fontSize: 9, letterSpacing: 6, color: `${ACCENT}99`, marginBottom: 14 }}>NPX-ESP-LINAJE // MEMORIA DE LO QUE EXISTIÓ</div>
        <h1 style={{ fontSize: 'clamp(26px, 5.5vw, 42px)', letterSpacing: 4, color: ACCENT, textShadow: `0 0 40px ${ACCENT}44`, margin: '0 0 14px', lineHeight: 1.1 }}>
          ÁRBOL GENEALÓGICO
        </h1>
        <p style={{ fontSize: 12, lineHeight: 2, color: '#9fb4cc', maxWidth: 780, margin: '0 0 24px' }}>
          Cada punto es una pieza que existió en el laboratorio; las líneas la unen con su madre (mutante) o con sus dos madres (cruce, ✕).
          Las filas son los algoritmos y las columnas, las generaciones. Las piezas con anillo blanco siguen vivas; las tenues desaparecieron
          y solo queda esta huella. Pasa el cursor sobre una pieza para ver toda su ascendencia y su descendencia.
        </p>

        {error && <p style={{ color: '#ff8a8a', fontSize: 12 }}>No se pudo cargar el archivo histórico. Recarga la página.</p>}

        {stats && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, ...box, marginBottom: 18 }}>
            {[
              [generation, 'GENERACIÓN', 'la actual'],
              [stats.alive, 'VIVAS', 'en el salón hoy'],
              [stats.dead, 'DESAPARECIDAS', 'solo queda su huella'],
              [stats.m, 'MUTANTES', `${stats.c} cruces`],
              [lastHist?.coverage ?? '–', 'CELDAS DE FORMA', 'ocupadas alguna vez de 4096'],
              [lastHist?.novelty !== undefined ? lastHist.novelty.toFixed(2) : '–', 'NOVEDAD MEDIA', 'de las últimas nacidas'],
            ].map(([n, t, sub]) => (
              <div key={String(t)} style={{ flex: '1 1 130px', minWidth: 120 }}>
                <div style={{ fontSize: 24, color: ACCENT }}>{n}</div>
                <div style={{ fontSize: 9, letterSpacing: 2, color: '#c8daf0', marginTop: 4 }}>{t}</div>
                <div style={{ fontSize: 9, color: '#6f86a3', marginTop: 3 }}>{sub}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', border: `1px solid ${ACCENT}22`, background: 'rgba(4,8,14,0.7)' }}>
          <div style={{ flex: '0 0 112px', position: 'relative', borderRight: `1px solid ${ACCENT}22`, height }}>
            {lanes.map((f, i) => (
              <div key={f} style={{ position: 'absolute', top: TOP + i * LANE_H, height: LANE_H, left: 8, right: 4, display: 'flex', alignItems: 'center', fontSize: 8, letterSpacing: 1, color: FAMILY_COLOR[f], overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {FAMILY_LABEL[f]}
              </div>
            ))}
          </div>
          <div ref={scrollRef} style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', position: 'relative', touchAction: 'pan-x' }}>
            <canvas ref={canvasRef} style={{ width, height, display: 'block', cursor: hover ? 'pointer' : 'default' }}
              onMouseMove={(e) => { const n = nearest(e.clientX, e.clientY); setHover(n); setTip(n ? { x: e.clientX, y: e.clientY } : null) }}
              onMouseLeave={() => { setHover(null); setTip(null) }}
              onClick={(e) => {
                const n = nearest(e.clientX, e.clientY)
                if (!n) { setPicked(null); return }
                if (n.alive) router.push(`/especimenes/laboratorio?id=${n.id}`)
                else setPicked(n)
              }} />
          </div>
        </div>

        {tip && hover && (
          <div style={{ position: 'fixed', left: Math.min(tip.x + 14, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 250), top: tip.y + 14, zIndex: 50, width: 232, padding: '10px 12px', background: '#05080cf2', border: `1px solid ${FAMILY_COLOR[hover.f]}66`, fontSize: 10, lineHeight: 1.7, pointerEvents: 'none' }}>
            <div style={{ color: FAMILY_COLOR[hover.f], letterSpacing: 2 }}>{FAMILY_LABEL[hover.f]}</div>
            <div style={{ color: '#fff' }}>{hover.id.toUpperCase()}</div>
            <div style={{ color: '#9fb4cc' }}>{KIND[hover.k]} · nació en la generación {hover.b}</div>
            <div style={{ color: hover.alive ? '#6fd89b' : '#9a8a8a' }}>{hover.alive ? 'viva: clic para abrirla' : `desapareció en la generación ${hover.x}`}</div>
            {hover.nov !== undefined && <div style={{ color: '#6f86a3' }}>novedad histórica {hover.nov.toFixed(2)}</div>}
            {(votes[hover.id]?.l ?? 0) + (votes[hover.id]?.d ?? 0) > 0 && <div style={{ color: '#ff9ecf' }}>♥ {votes[hover.id]?.l ?? 0} · ✕ {votes[hover.id]?.d ?? 0}</div>}
          </div>
        )}

        {picked && !picked.alive && (
          <p style={{ marginTop: 14, fontSize: 11, color: '#9a8a8a' }}>
            {picked.id.toUpperCase()} ({FAMILY_LABEL[picked.f]}) nació en la generación {picked.b} y desapareció en la {picked.x}.
            Ya no se puede abrir ni descargar: eso es parte de la obra.
          </p>
        )}

        <p style={{ marginTop: 26, fontSize: 10, lineHeight: 1.9, color: '#6f86a3', maxWidth: 780 }}>
          La «novedad histórica» es la distancia entre una pieza y lo más parecido que existió alguna vez. Las celdas de forma cuentan cuántas
          regiones del espacio de formas se han ocupado. Son medidas aproximadas y propias de este laboratorio, no una validación científica.
        </p>
      </div>
    </div>
  )
}
