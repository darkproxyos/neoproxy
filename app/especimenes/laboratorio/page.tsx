'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { FAMILIES, PURE_FAMILIES, AUTHOR_ID, FAMILY_COLOR, FAMILY_LABEL, FAMILY_BLURB, sampleRecipe, type Family, type Recipe } from '@/lib/specimens/families'
import { OP_LABEL, OP_BLURB, type SymOp } from '@/lib/specimens/symbiosis'
import { THINKERS } from '@/components/proxygenesis/curated'
import { SHOW_COUNT, ROTATE_STEP, weekIndex, nextRotationAt, visibleIndices } from '@/lib/specimens/select'
import { generateInWorker, type ClientResult } from '@/lib/specimens/client'

const PoolViewer = dynamic(() => import('@/components/especimenes/PoolViewer'), { ssr: false })

const mono = "'Space Mono', monospace"
const ACCENT = '#00ffcc'
const WA = '56993550010'

type PoolItem = {
  id: string
  family: Family
  seed: number
  m: {
    printScore: number; richness: number; fitness: number; up: string
    overhangFrac: number; contactFrac: number; wallP10Mm: number; thinFrac: number
    material: 'PLA o resina' | 'resina'; bboxMm: number[]; genus: number; tris: number; sizeMm: number
  }
}
type Pool = {
  generatedAt: string; seedBase: number; res: number; viewRes?: number; stlRes?: number; sizeMm: number
  stats: {
    generated: number; measured: number; closed: number; printable: number; eliteCells: number
    byFamily: Record<string, { generated: number; viable: number; hall: number }>
  }
  hall: PoolItem[]
}

const pct = (v: number) => `${Math.round(v * 100)}%`
// piezas de obra: lo que más se parece a un objeto terminado
const OBRAS = new Set<Family>(['vessel', 'filigree', 'flow', 'hilbert', 'reaction'])
const inFilter = (it: PoolItem, f: Family | 'all' | 'obras') => f === 'all' || (f === 'obras' ? OBRAS.has(it.family) : it.family === f)
const label = (it: PoolItem) => `${FAMILY_LABEL[it.family]} · ${it.id.split('-')[1].toUpperCase()}`

function Stat({ n, t, sub }: { n: string | number; t: string; sub?: string }) {
  return (
    <div style={{ flex: '1 1 130px', minWidth: 120 }}>
      <div style={{ fontSize: 26, color: ACCENT, letterSpacing: 1 }}>{n}</div>
      <div style={{ fontSize: 9, letterSpacing: 2, color: '#c8daf0', marginTop: 4 }}>{t}</div>
      {sub && <div style={{ fontSize: 9, color: '#6f86a3', marginTop: 3, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 10.5, padding: '6px 0', borderBottom: '1px solid #ffffff10' }}>
      <span style={{ color: '#8fa8c4' }}>{k}</span>
      <span style={{ color: '#fff', textAlign: 'right' }}>{v}</span>
    </div>
  )
}

const authorOf = (f: Family) => { const id = AUTHOR_ID[f]; return id ? THINKERS[id] : undefined }

// Árbol de ascendencia de una receta: de qué algoritmos (y autores) viene.
function lineage(r: Recipe): string {
  if (r.family !== 'symbiosis') {
    const a = authorOf(r.family)
    return a ? `${FAMILY_LABEL[r.family]} (${a.name})` : FAMILY_LABEL[r.family]
  }
  const [x, y] = r.parents!
  return `${OP_LABEL[r.params.op as SymOp]}[ ${lineage(x)} × ${lineage(y)} ]`
}

function Dna({ item, color }: { item: PoolItem; color: string }) {
  const rec = useMemo(() => sampleRecipe(item.family, item.seed), [item.family, item.seed])
  const author = authorOf(item.family)
  const box = { margin: '0 0 16px', padding: '12px 14px', border: `1px solid ${color}33`, background: `${color}0b`, fontSize: 10, lineHeight: 1.8, color: '#b6c8de' } as const
  if (rec.family === 'symbiosis') {
    const op = rec.params.op as SymOp
    const [a, b] = rec.parents!
    const m = THINKERS[AUTHOR_ID.symbiosis!]
    return (
      <div style={box}>
        <div style={{ fontSize: 9, letterSpacing: 2.5, color }}>ADN · {OP_LABEL[op]}</div>
        <div style={{ margin: '4px 0 8px' }}>{OP_BLURB[op]}</div>
        <div><span style={{ color: '#6f86a3' }}>PADRE A · </span>{lineage(a)}</div>
        <div><span style={{ color: '#6f86a3' }}>PADRE B · </span>{lineage(b)}</div>
        {m && <div style={{ marginTop: 8, fontStyle: 'italic', color: '#8fa8c4' }}>{m.name}: «{m.line}»</div>}
      </div>
    )
  }
  if (!author) return null
  return (
    <div style={box}>
      <div style={{ fontSize: 9, letterSpacing: 2.5, color }}>AUTOR · {author.name.toUpperCase()}</div>
      <div style={{ marginTop: 4, fontStyle: 'italic', color: '#8fa8c4' }}>«{author.line}»</div>
    </div>
  )
}

function SpecimenModal({ item, pool, onClose }: { item: PoolItem; pool: Pool; onClose: () => void }) {
  const [gen, setGen] = useState<{ status: 'loading' | 'ready' | 'error'; data?: ClientResult; error?: string }>({ status: 'loading' })
  const [dl, setDl] = useState<'idle' | 'busy' | 'error'>('idle')
  const [copied, setCopied] = useState(false)
  const color = FAMILY_COLOR[item.family]

  useEffect(() => {
    setGen({ status: 'loading' })
    const { promise, cancel } = generateInWorker(item.family, item.seed, pool.viewRes ?? pool.res)
    promise.then((data) => setGen({ status: 'ready', data })).catch((e) => setGen({ status: 'error', error: String(e.message ?? e) }))
    return cancel
  }, [item, pool.res])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  const download = async () => {
    setDl('busy')
    try {
      const { promise } = generateInWorker(item.family, item.seed, pool.stlRes ?? 96, true)
      const r = await promise
      const blob = new Blob([r.stl!], { type: 'model/stl' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `neoproxy-${item.id}-${pool.sizeMm}mm.stl`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 4000)
      setDl('idle')
    } catch {
      setDl('error')
    }
  }

  const link = typeof window !== 'undefined' ? `${window.location.origin}/especimenes/laboratorio?id=${item.id}` : ''
  const waText = `Hola, quiero que me imprimas el espécimen ${item.id} (${FAMILY_LABEL[item.family]}) de /especimenes/laboratorio.\n\nMaterial (PLA / resina): ${item.m.material === 'resina' ? 'resina' : ''}\nTamaño (alto o ancho máximo, mm): ${pool.sizeMm}\nCantidad:\n\n${link}`
  const share = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* sin permiso de portapapeles */ }
  }

  // Portal a <body>: el layout de la sección anima con transform, y un ancestro
  // transformado vuelve `position: fixed` relativo a sí mismo (el modal quedaba
  // fuera de la pantalla).
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={label(item)} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,2,5,0.88)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} className="lab-modal"
        style={{ width: 'min(1000px, 100%)', maxHeight: '94vh', overflow: 'auto', background: '#05080c', border: `1px solid ${color}55`, display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(280px, 1fr)' }}>
        <div style={{ position: 'relative', minHeight: 360, background: '#03050a' }}>
          {gen.status === 'ready' && gen.data && <PoolViewer positions={gen.data.positions} indices={gen.data.indices} color={color} />}
          {gen.status === 'loading' && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 10, letterSpacing: 3, color: '#8fa8c4' }}>
              GENERANDO DESDE LA RECETA…
            </div>
          )}
          {gen.status === 'error' && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center', fontSize: 11, color: '#ff8a8a' }}>
              No se pudo generar la pieza en este navegador. {gen.error}
            </div>
          )}
          <div style={{ position: 'absolute', left: 12, bottom: 10, fontSize: 9, letterSpacing: 1.5, color: '#6f86a3', pointerEvents: 'none' }}>
            ARRASTRA PARA GIRAR · RUEDA PARA ACERCAR · EL DISCO ES LA CAMA
          </div>
        </div>

        <div style={{ padding: '22px 22px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 3, color }}>{FAMILY_LABEL[item.family]}</div>
              <h2 style={{ fontSize: 20, color: '#fff', letterSpacing: 1.5, margin: '6px 0 0' }}>{item.id.toUpperCase()}</h2>
            </div>
            <button onClick={onClose} className="press" aria-label="Cerrar"
              style={{ width: 40, height: 40, background: 'transparent', border: '1px solid #4a6080', color: '#c8daf0', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
          <p style={{ fontSize: 10.5, lineHeight: 1.8, color: '#9fb4cc', margin: '14px 0 14px' }}>{FAMILY_BLURB[item.family]}</p>
          <Dna item={item} color={color} />

          <Row k="Imprimibilidad" v={`${pct(item.m.printScore)} (más es mejor)`} />
          <Row k="Riqueza formal" v={pct(item.m.richness)} />
          <Row k="Material sugerido" v={item.m.material} />
          <Row k="Voladizo (>45°)" v={`${pct(item.m.overhangFrac)} de la superficie`} />
          <Row k="Pared más fina (p10)" v={`${item.m.wallP10Mm} mm a ${pool.sizeMm} mm`} />
          <Row k="Tamaño" v={`${item.m.bboxMm.map((v) => Math.round(v)).join(' × ')} mm`} />
          <Row k="Agujeros pasantes" v={String(item.m.genus)} />
          <Row k="Triángulos (vista previa)" v={item.m.tris.toLocaleString('es-CL')} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
            <button onClick={download} disabled={dl === 'busy'} className="press"
              style={{ minHeight: 46, background: `${color}22`, border: `1px solid ${color}`, color, fontFamily: mono, fontSize: 11, letterSpacing: 2, cursor: dl === 'busy' ? 'wait' : 'pointer' }}>
              {dl === 'busy' ? 'GENERANDO STL EN ALTA RESOLUCIÓN…' : dl === 'error' ? 'REINTENTAR DESCARGA' : `DESCARGAR STL (${pool.sizeMm} MM)`}
            </button>
            <a href={`https://wa.me/${WA}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer" className="press"
              style={{ minHeight: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#25d366', color: '#04210f', fontWeight: 700, fontSize: 12, letterSpacing: 1.5, textDecoration: 'none' }}>
              Pedir esta pieza impresa
            </a>
            <button onClick={share} className="press"
              style={{ minHeight: 40, background: 'transparent', border: '1px solid #4a6080', color: '#8fa8c4', fontFamily: mono, fontSize: 10, letterSpacing: 2, cursor: 'pointer' }}>
              {copied ? 'LINK COPIADO' : 'COPIAR LINK DE ESTA PIEZA'}
            </button>
          </div>
          <p style={{ fontSize: 9.5, lineHeight: 1.7, color: '#6f86a3', margin: '14px 0 0' }}>
            El STL sale orientado para imprimir y apoyado en la cama. Las métricas son mediciones sobre la geometría
            con una pared mínima de 1 mm; antes de imprimir, abre la pieza en tu laminador.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default function LaboratorioPage() {
  const [pool, setPool] = useState<Pool | null>(null)
  const [error, setError] = useState(false)
  const [now, setNow] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [filter, setFilter] = useState<Family | 'all' | 'obras'>('all')
  const [open, setOpen] = useState<PoolItem | null>(null)
  const [how, setHow] = useState(false)

  useEffect(() => {
    setNow(Date.now())
    fetch('/proxygenesis/pool.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((p: Pool) => {
        setPool(p)
        const id = new URLSearchParams(window.location.search).get('id')
        const hit = id ? p.hall.find((x) => x.id === id) : null
        if (hit) { setOpen(hit); setShowAll(true) }
      })
      .catch(() => setError(true))
  }, [])

  const week = now === null ? 0 : weekIndex(now)
  const visible = useMemo(() => {
    if (!pool) return []
    if (showAll) return pool.hall
    return visibleIndices(pool.hall.length, week).map((i) => pool.hall[i])
  }, [pool, week, showAll])
  const shown = useMemo(() => visible.filter((it) => inFilter(it, filter)), [visible, filter])
  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    visible.forEach((it) => { c[it.family] = (c[it.family] ?? 0) + 1 })
    return c
  }, [visible])

  const openItem = useCallback((it: PoolItem | null) => {
    setOpen(it)
    const url = new URL(window.location.href)
    if (it) url.searchParams.set('id', it.id); else url.searchParams.delete('id')
    window.history.replaceState(null, '', url)
  }, [])

  const nextDate = now === null ? '' : new Date(nextRotationAt(now)).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', timeZone: 'UTC' })

  return (
    <div style={{ background: '#05080c', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '104px 24px 100px' }}>
        <Link href="/especimenes" className="press" style={{ fontSize: 9, letterSpacing: 3, color: '#8fa8c4', textDecoration: 'none', display: 'inline-block', marginBottom: 28 }}>
          ← VOLVER A ESPECÍMENES
        </Link>
        <div style={{ fontSize: 9, letterSpacing: 6, color: `${ACCENT}99`, marginBottom: 14 }}>NPX-ESP-LAB // SELECCIÓN POR CALIDAD Y DIVERSIDAD</div>
        <h1 style={{ fontSize: 'clamp(26px, 5.5vw, 42px)', letterSpacing: 4, color: ACCENT, textShadow: `0 0 40px ${ACCENT}44`, margin: '0 0 14px', lineHeight: 1.1 }}>
          LABORATORIO DE ESPECÍMENES
        </h1>
        <p style={{ fontSize: 12, lineHeight: 2, color: '#9fb4cc', maxWidth: 760, margin: '0 0 28px' }}>
          {PURE_FAMILIES.length} algoritmos, cada uno atado a un autor del sitio, generan formas, y la familia SIMBIOSIS
          (Margulis) las cruza de a dos, a veces de a tres, de siete maneras distintas: ahí emergen formas que ningún
          algoritmo da solo. Cada candidata se mide como sólido imprimible. El salón se reparte entre algoritmos y modos
          de cruce y, dentro de cada grupo, se eligen las formas más distintas entre sí, no las que más puntúan, que
          serían casi todas iguales. De ese salón de {pool ? pool.hall.length : '…'}, {SHOW_COUNT} están a la vista cada
          semana: salen {ROTATE_STEP} y entran {ROTATE_STEP} nuevas.
        </p>

        {error && <p style={{ color: '#ff8a8a', fontSize: 12 }}>No se pudo cargar el salón. Recarga la página.</p>}

        {pool && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, padding: '20px 22px', border: `1px solid ${ACCENT}33`, background: 'rgba(255,255,255,0.02)', marginBottom: 14 }}>
              <Stat n={pool.stats.generated.toLocaleString('es-CL')} t="GENERADAS" sub={`${PURE_FAMILIES.length} algoritmos y sus cruces`} />
              <Stat n={pool.stats.printable} t="IMPRIMIBLES" sub={`${Math.round((pool.stats.printable / pool.stats.measured) * 100)}% pasa el umbral`} />
              <Stat n={pool.hall.length} t="EN EL SALÓN" sub="repartido entre algoritmos y modos de cruce" />
              <Stat n={SHOW_COUNT} t="A LA VISTA" sub={nextDate ? `cambian ${ROTATE_STEP} el ${nextDate}` : undefined} />
            </div>

            <button onClick={() => setHow(!how)} className="press" aria-expanded={how}
              style={{ background: 'transparent', border: '1px solid #4a6080', color: '#8fa8c4', fontFamily: mono, fontSize: 10, letterSpacing: 2, padding: '10px 14px', cursor: 'pointer', marginBottom: 14 }}>
              {how ? '− ' : '+ '}CÓMO SE ELIGE
            </button>
            {how && (
              <div style={{ fontSize: 11, lineHeight: 1.9, color: '#9fb4cc', maxWidth: 820, padding: '4px 0 18px' }}>
                <p style={{ margin: '0 0 10px' }}>
                  <strong style={{ color: '#fff' }}>Imprimibilidad (medida):</strong> malla cerrada y sin aristas rotas, una sola pieza
                  (se descartan islas sueltas), pocas caras en voladizo en la mejor orientación, base de apoyo estable con el centro de
                  masa encima, y espesor de pared de al menos 1 mm a {pool.sizeMm} mm de alto.
                </p>
                <p style={{ margin: '0 0 10px' }}>
                  <strong style={{ color: '#fff' }}>Riqueza formal (aproximada):</strong> complejidad de superficie, cantidad de agujeros
                  pasantes y variedad de orientaciones de la superficie. Es una heurística, no un juicio de belleza.
                </p>
                <p style={{ margin: 0 }}>
                  <strong style={{ color: '#fff' }}>Diversidad:</strong> cada algoritmo aporta la misma cantidad de piezas, y cada modo de cruce un cupo 1,5 veces mayor (es donde emerge lo nuevo). Dentro de un grupo
                  se elige primero la mejor y después, una a una, la que más se aleja de las ya elegidas (complejidad, agujeros, alargamiento,
                  voladizos), ponderada por su calidad. Un primer intento con celdas tipo MAP-Elites dejaba el salón dominado por dos familias.
                  Ninguna pieza se guarda como archivo: cada una es una receta (algoritmo + semilla) que se regenera casi idéntica en tu navegador.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', margin: '8px 0 22px' }}>
              {(['all', 'obras', ...FAMILIES] as const).map((f) => {
                const active = filter === f
                const c = f === 'all' ? ACCENT : f === 'obras' ? '#ffe9a8' : FAMILY_COLOR[f]
                const n = f === 'all' ? visible.length : f === 'obras' ? visible.filter((it) => OBRAS.has(it.family)).length : counts[f] ?? 0
                return (
                  <button key={f} onClick={() => setFilter(f)} className="press" aria-pressed={active}
                    style={{ fontFamily: mono, fontSize: 9, letterSpacing: 1.5, padding: '9px 12px', minHeight: 40, cursor: 'pointer', background: active ? `${c}2a` : 'transparent', border: `1px solid ${active ? c : '#4a6080'}`, color: active ? c : '#8fa8c4' }}>
                    {f === 'all' ? 'TODAS' : f === 'obras' ? 'OBRAS' : FAMILY_LABEL[f]} · {n}
                  </button>
                )
              })}
              <span style={{ flex: 1 }} />
              <button onClick={() => setShowAll(!showAll)} className="press"
                style={{ fontFamily: mono, fontSize: 9, letterSpacing: 1.5, padding: '9px 12px', minHeight: 40, cursor: 'pointer', background: 'transparent', border: '1px solid #4a6080', color: '#c8daf0' }}>
                {showAll ? `VER SOLO LAS ${SHOW_COUNT} DE ESTA SEMANA` : `VER EL SALÓN COMPLETO (${pool.hall.length})`}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
              {shown.map((it) => {
                const c = FAMILY_COLOR[it.family]
                return (
                  <button key={it.id} onClick={() => openItem(it)} className="press" aria-label={`Abrir ${label(it)}`}
                    style={{ padding: 0, textAlign: 'left', cursor: 'pointer', background: '#080c12', border: `1px solid ${c}33`, borderTop: `2px solid ${c}`, color: 'inherit', fontFamily: mono }}>
                    <img src={`/proxygenesis/pool-thumbs/${it.id}.webp`} alt={`${FAMILY_LABEL[it.family]}, imprimibilidad ${pct(it.m.printScore)}`} loading="lazy" width={256} height={256}
                      style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '1 / 1', background: '#070a10' }} />
                    <div style={{ padding: '10px 12px 12px' }}>
                      <div style={{ fontSize: 10, letterSpacing: 1.5, color: c }}>{FAMILY_LABEL[it.family]}</div>
                      <div style={{ fontSize: 9.5, color: '#8fa8c4', marginTop: 5, lineHeight: 1.6 }}>
                        imprimible {pct(it.m.printScore)} · {it.m.material}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            {shown.length === 0 && <p style={{ fontSize: 12, color: '#8fa8c4' }}>Ninguna pieza de esta familia está a la vista esta semana. Prueba con el salón completo.</p>}
          </>
        )}
      </div>

      {open && pool && <SpecimenModal item={open} pool={pool} onClose={() => openItem(null)} />}

      <style>{`
        @media (max-width: 760px) { .lab-modal { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
