'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { FAMILY_COLOR, type GeometryFamily, type Params } from '@/lib/specimens/families'
import { resolveGenome, type Genome } from '@/lib/specimens/genome'
import { generateInWorker, type ClientResult } from '@/lib/specimens/client'
import { GEO, type Control } from '@/lib/specimens/geo-specs'
import { CONWAY_OPS } from '@/lib/specimens/fields-geo'
import heroes from '@/lib/specimens/geo-heroes.json'

const PoolViewer = dynamic(() => import('@/components/especimenes/PoolViewer'), { ssr: false })

const mono = "'Space Mono', monospace"
const ACCENT = '#9fe8ff'
const WA = '56993550010'
const VIEW_RES = 80, STL_RES = 144, SIZE_MM = 60
const pct = (v: number) => `${Math.round(v * 100)}%`

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 10.5, padding: '6px 0', borderBottom: '1px solid #ffffff10' }}>
      <span style={{ color: '#8fa8c4' }}>{k}</span><span style={{ color: '#fff', textAlign: 'right' }}>{v}</span>
    </div>
  )
}

export default function Explorer({ family }: { family: GeometryFamily }) {
  const spec = GEO[family], color = FAMILY_COLOR[family]
  const [seed, setSeed] = useState<number>((heroes as Record<string, number>)[family] ?? 1)
  const [o, setO] = useState<Params>({})
  const [gen, setGen] = useState<{ status: 'loading' | 'ready' | 'error'; data?: ClientResult; error?: string }>({ status: 'loading' })
  const [dl, setDl] = useState<'idle' | 'busy' | 'error'>('idle')
  const [copied, setCopied] = useState(false)
  const cancelRef = useRef<(() => void) | null>(null)
  const ready = useRef(false)

  // estado compartido por enlace: ?s=semilla&o={...}
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const s = Number(q.get('s'))
    if (Number.isFinite(s) && s > 0) setSeed(s)
    try { const raw = q.get('o'); if (raw) setO(JSON.parse(raw)) } catch { /* enlace dañado: se ignora */ }
    ready.current = true
  }, [])

  const genome: Genome = useMemo(() => ({ f: family, s: seed, ...(Object.keys(o).length ? { o } : {}) }), [family, seed, o])
  const params = useMemo(() => resolveGenome(genome).params, [genome])

  useEffect(() => {
    if (!ready.current) return
    const url = new URL(window.location.href)
    url.searchParams.set('s', String(seed))
    if (Object.keys(o).length) url.searchParams.set('o', JSON.stringify(o)); else url.searchParams.delete('o')
    window.history.replaceState(null, '', url)
  }, [seed, o])

  // regenera con un pequeño retraso, para no calcular en cada paso de un deslizador
  useEffect(() => {
    setGen((g) => ({ ...g, status: 'loading' }))
    const t = setTimeout(() => {
      cancelRef.current?.()
      const { promise, cancel } = generateInWorker(genome, VIEW_RES)
      cancelRef.current = cancel
      promise.then((data) => setGen({ status: 'ready', data })).catch((e) => { if (String(e).indexOf('terminate') < 0) setGen({ status: 'error', error: String(e.message ?? e) }) })
    }, 380)
    return () => { clearTimeout(t); cancelRef.current?.() }
  }, [genome])

  const set = useCallback((patch: Params) => setO((cur) => ({ ...cur, ...patch })), [])

  const download = async () => {
    setDl('busy')
    try {
      const { promise } = generateInWorker(genome, STL_RES, true)
      const r = await promise
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([r.stl!], { type: 'model/stl' }))
      a.download = `neoproxy-${family}-${seed}-${SIZE_MM}mm.stl`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 4000)
      setDl('idle')
    } catch { setDl('error') }
  }

  const link = typeof window !== 'undefined' ? window.location.href : ''
  const share = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* sin permiso */ } }
  const m = gen.data?.metrics as undefined | { printScore: number; wallP10Mm: number; overhangFrac: number; genus: number; tris: number; bboxMm: number[]; material: string }

  const label = { fontSize: 9, letterSpacing: 1.5, color: '#8fa8c4' } as const
  const renderControl = (c: Control) => {
    if (c.kind !== 'text' && c.only && !c.only(params)) return null
    if (c.kind === 'range' || c.kind === 'virtual') {
      const value = c.kind === 'range' ? (params[c.key] as number) : c.read(params)
      const key = c.kind === 'range' ? c.key : c.id
      return (
        <label key={key} style={{ display: 'block', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', ...label }}><span>{c.label.toUpperCase()}</span><span style={{ color: '#fff' }}>{c.int ? Math.round(value) : value.toFixed(c.step < 0.01 ? 3 : 2)}</span></div>
          <input type="range" min={c.min} max={c.max} step={c.step} value={value} aria-label={c.label}
            onChange={(e) => { const v = c.int ? Math.round(Number(e.target.value)) : Number(e.target.value); set(c.kind === 'range' ? { [c.key]: v } : c.write(params, v)) }}
            style={{ width: '100%', accentColor: color, minHeight: 28 }} />
        </label>
      )
    }
    if (c.kind === 'select') {
      return (
        <label key={c.key} style={{ display: 'block', marginBottom: 12 }}>
          <div style={label}>{c.label.toUpperCase()}</div>
          <select value={String(params[c.key])} aria-label={c.label} onChange={(e) => { const opt = c.options.find((x) => String(x.v) === e.target.value); if (opt) set({ [c.key]: opt.v }) }}
            style={{ width: '100%', minHeight: 40, marginTop: 4, background: '#05080c', color: '#fff', border: '1px solid #4a6080', fontFamily: mono, fontSize: 11, padding: '0 8px' }}>
            {c.options.map((x) => <option key={String(x.v)} value={String(x.v)}>{x.label}</option>)}
          </select>
        </label>
      )
    }
    return (
      <div key={c.key} style={{ marginBottom: 12 }}>
        <div style={label}>{c.label.toUpperCase()} · SE LEE DE DERECHA A IZQUIERDA</div>
        <input value={String(params[c.key])} aria-label={c.label} maxLength={6} spellCheck={false}
          onChange={(e) => set({ [c.key]: e.target.value.split('').filter((ch) => CONWAY_OPS.includes(ch)).join('') })}
          style={{ width: '100%', minHeight: 40, marginTop: 4, background: '#05080c', color: '#fff', border: '1px solid #4a6080', fontFamily: mono, fontSize: 14, letterSpacing: 4, padding: '0 10px', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {CONWAY_OPS.split('').map((ch) => (
            <button key={ch} className="press" onClick={() => set({ [c.key]: (String(params[c.key]) + ch).slice(0, 6) })} aria-label={`Agregar ${ch}`}
              style={{ width: 40, height: 40, background: 'transparent', border: `1px solid ${color}66`, color, fontFamily: mono, fontSize: 14, cursor: 'pointer' }}>{ch}</button>
          ))}
          <button className="press" onClick={() => set({ [c.key]: String(params[c.key]).slice(0, -1) })} aria-label="Borrar la última"
            style={{ height: 40, padding: '0 12px', background: 'transparent', border: '1px solid #4a6080', color: '#8fa8c4', fontFamily: mono, fontSize: 10, cursor: 'pointer' }}>BORRAR</button>
        </div>
      </div>
    )
  }

  const waText = `Hola, quiero que me imprimas una pieza de GEOMETRÍAS (${spec.title}).\n\nMaterial (PLA / resina):\nTamaño (alto o ancho máximo, mm): ${SIZE_MM}\nCantidad:\n\n${link}`

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative', overflowX: 'hidden' }}>
      <div className="crt-scanlines" /><div className="tech-grid" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '104px 24px 100px' }}>
        <Link href="/geometrias" className="press tap-ext" style={{ fontSize: 9, letterSpacing: 3, color: '#8fa8c4', textDecoration: 'none', display: 'inline-block', marginBottom: 28 }}>← VOLVER A GEOMETRÍAS</Link>
        <div style={{ fontSize: 9, letterSpacing: 6, color: `${color}aa`, marginBottom: 14 }}>NPX-GEO // {spec.tagline.toUpperCase()}</div>
        <h1 style={{ fontSize: 'clamp(26px, 5.5vw, 42px)', letterSpacing: 4, color, textShadow: `0 0 40px ${color}44`, margin: '0 0 14px', lineHeight: 1.1 }}>{spec.title}</h1>
        <p style={{ fontSize: 12, lineHeight: 2, color: '#9fb4cc', maxWidth: 780, margin: '0 0 8px' }}>{spec.concept}</p>
        <p style={{ fontSize: 10, lineHeight: 1.9, color: '#6f86a3', maxWidth: 780, margin: '0 0 28px' }}>{spec.credit} {spec.note}</p>

        <div className="geo-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(300px, 1fr)', gap: 22, alignItems: 'start' }}>
          <div style={{ position: 'relative', minHeight: 420, background: '#03050a', border: `1px solid ${color}33` }}>
            {/* el visor sigue montado mientras se regenera: se ve la pieza anterior bajo el velo y el zoom del usuario no se pierde */}
            {gen.data && gen.status !== 'error' && <PoolViewer positions={gen.data.positions} indices={gen.data.indices} color={color} />}
            {gen.status !== 'ready' && (
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 10, letterSpacing: 3, color: gen.status === 'error' ? '#ff8a8a' : '#8fa8c4', textAlign: 'center', padding: 24, background: gen.data ? 'rgba(3,5,10,0.55)' : 'transparent' }}>
                {gen.status === 'error' ? `No se pudo generar esta combinación. ${gen.error ?? ''}` : 'GENERANDO…'}
              </div>
            )}
            <div style={{ position: 'absolute', left: 12, bottom: 10, fontSize: 9, letterSpacing: 1.5, color: '#6f86a3', pointerEvents: 'none' }}>ARRASTRA PARA GIRAR · RUEDA, PELLIZCO O +/− PARA ACERCAR</div>
          </div>

          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <button className="press" onClick={() => { setSeed(Math.floor(Math.random() * 1e9) + 1); setO({}) }} style={{ flex: 1, minHeight: 44, background: `${color}22`, border: `1px solid ${color}`, color, fontFamily: mono, fontSize: 10, letterSpacing: 2, cursor: 'pointer' }}>OTRA SEMILLA</button>
              <button className="press" onClick={() => setO({})} style={{ flex: 1, minHeight: 44, background: 'transparent', border: '1px solid #4a6080', color: '#8fa8c4', fontFamily: mono, fontSize: 10, letterSpacing: 2, cursor: 'pointer' }}>RESTABLECER</button>
            </div>
            <div style={{ ...label, marginBottom: 10, color: '#6f86a3' }}>PARÁMETROS · SEMILLA {seed}</div>
            {spec.controls.map(renderControl)}

            {m && (
              <div style={{ margin: '18px 0' }}>
                <Row k="Imprimibilidad" v={`${pct(m.printScore)} (más es mejor)`} />
                <Row k="Pared más fina (p10)" v={`${m.wallP10Mm.toFixed(1)} mm a ${SIZE_MM} mm`} />
                <Row k="Voladizo (>45°)" v={`${pct(m.overhangFrac)} de la superficie`} />
                <Row k="Tamaño" v={`${m.bboxMm.map((v) => Math.round(v)).join(' × ')} mm`} />
                <Row k="Agujeros pasantes" v={String(m.genus)} />
                <Row k="Triángulos (vista previa)" v={m.tris.toLocaleString('es-CL')} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="press" onClick={download} disabled={dl === 'busy' || gen.status === 'error'} style={{ minHeight: 46, background: `${color}22`, border: `1px solid ${color}`, color, fontFamily: mono, fontSize: 11, letterSpacing: 2, cursor: dl === 'busy' ? 'wait' : 'pointer' }}>
                {dl === 'busy' ? 'GENERANDO STL EN ALTA RESOLUCIÓN…' : dl === 'error' ? 'REINTENTAR DESCARGA' : `DESCARGAR STL (${SIZE_MM} MM)`}
              </button>
              <a href={`https://wa.me/${WA}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer" className="press" style={{ minHeight: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#25d366', color: '#04210f', fontWeight: 700, fontSize: 12, letterSpacing: 1.5, textDecoration: 'none' }}>Pedir esta pieza impresa</a>
              <button className="press" onClick={share} style={{ minHeight: 40, background: 'transparent', border: '1px solid #4a6080', color: '#8fa8c4', fontFamily: mono, fontSize: 10, letterSpacing: 2, cursor: 'pointer' }}>{copied ? 'LINK COPIADO' : 'COPIAR LINK CON ESTOS PARÁMETROS'}</button>
            </div>
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 900px) { .geo-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
