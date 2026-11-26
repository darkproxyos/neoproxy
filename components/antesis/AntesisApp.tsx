'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { AntesisCmd, AntesisMsg, PartOut } from '@/lib/antesis/worker'
import type { AntesisOpts, Verification } from '@/lib/antesis/build'
import type { Symmetry } from '@/lib/antesis/layout'
import { zipStore } from '@/lib/antesis/zip'
import type { AntesisViewerApi } from './AntesisViewer'

const AntesisViewer = dynamic(() => import('./AntesisViewer'), { ssr: false })
const mono = "'Space Mono', monospace"
const ACCENT = '#d4b0ff', PINK = '#ff8fc8', OK = '#7cf0b0', WARN = '#ffb86b'
const WA = '56993550010'
const fmt = (n: number, d = 1) => n.toFixed(d).replace('.', ',')

const SYMS: { k: Symmetry; label: string; sub: string }[] = [
  { k: 'tetra', label: 'TETRA', sub: '4 + 4 engranajes' },
  { k: 'octa', label: 'OCTA', sub: '6 + 8 engranajes' },
  { k: 'icosa', label: 'ICOSA', sub: '12 + 20 engranajes' },
]
type Pal = Record<string, string>
const PALETTES: { k: string; label: string; c: Pal }[] = [
  { k: 'neoproxy', label: 'NEOPROXY', c: { nucleo: '#141925', 'engranaje-a': '#7fd8ff', 'engranaje-b': '#b99cff', 'deco-a': '#9a6bff', 'deco-b': '#e9ecff', 'pasador-a': '#cfd5e2', 'pasador-b': '#cfd5e2' } },
  { k: 'violeta', label: 'VIOLETA', c: { nucleo: '#4a3a78', 'engranaje-a': '#9d86e8', 'engranaje-b': '#9d86e8', 'deco-a': '#a98cf5', 'deco-b': '#a98cf5', 'pasador-a': '#9d86e8', 'pasador-b': '#9d86e8' } },
  { k: 'fucsia', label: 'FUCSIA', c: { nucleo: '#d9d4de', 'engranaje-a': '#ff9088', 'engranaje-b': '#ff9088', 'deco-a': '#df1a7c', 'deco-b': '#1f1f26', 'pasador-a': '#1f1f26', 'pasador-b': '#1f1f26' } },
  { k: 'girasol', label: 'GIRASOL', c: { nucleo: '#1d8f8b', 'engranaje-a': '#5fd383', 'engranaje-b': '#5fd383', 'deco-a': '#ffd21f', 'deco-b': '#ff9b42', 'pasador-a': '#ff9b42', 'pasador-b': '#ff9b42' } },
  { k: 'resina', label: 'RESINA', c: { nucleo: '#a7b3c6', 'engranaje-a': '#a7b3c6', 'engranaje-b': '#a7b3c6', 'deco-a': '#a7b3c6', 'deco-b': '#a7b3c6', 'pasador-a': '#a7b3c6', 'pasador-b': '#a7b3c6' } },
]

function Chip({ on, onClick, children, title, color = ACCENT, disabled }: { on: boolean; onClick: () => void; children: React.ReactNode; title?: string; color?: string; disabled?: boolean }) {
  return <button type="button" className="press" title={title} disabled={disabled} aria-pressed={on} onClick={onClick} style={{ minHeight: 40, padding: '0 14px', fontFamily: mono, fontSize: 11.5, letterSpacing: 1.6, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.45 : 1, background: on ? `${color}22` : 'rgba(2,4,8,0.7)', borderStyle: 'solid', borderWidth: 1, borderColor: on ? color : '#ffffff26', color: on ? color : '#9fb4cc' }}>{children}</button>
}
function Slider({ label, value, onChange, readout, min, max, step }: { label: string; value: number; onChange: (v: number) => void; readout: string; min: number; max: number; step: number }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, letterSpacing: 1.5, color: '#8fa8c4', marginBottom: 6 }}><span>{label}</span><span style={{ color: '#fff' }}>{readout}</span></div>
      <input type="range" className="an-range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%' }} />
    </label>
  )
}
function Stat({ k, v, warn, title }: { k: string; v: string; warn?: boolean; title?: string }) {
  return <div title={title} style={{ padding: '10px 12px', background: '#080c12', border: '1px solid #ffffff10' }}><div style={{ fontSize: 11, letterSpacing: 1.6, color: '#7f96b2', marginBottom: 5 }}>{k}</div><div style={{ fontSize: 14, color: warn ? WARN : '#fff' }}>{v}</div></div>
}
const Panel = ({ title, color = ACCENT, children }: { title: string; color?: string; children: React.ReactNode }) => (
  <section style={{ background: '#080c12', borderStyle: 'solid', borderWidth: '1px 1px 1px 3px', borderColor: `${color}2a ${color}2a ${color}2a ${color}`, padding: '18px 20px', display: 'grid', gap: 14, alignContent: 'start' }}>
    <div style={{ fontSize: 11.5, letterSpacing: 3, color }}>{title}</div>
    {children}
  </section>
)

type Built = Extract<AntesisMsg, { type: 'built' }>

// ---- modo reel: 25 s en vertical, para grabar con el teléfono ----
type ReelPhase = 'titulo' | 'gira' | 'desarma' | 'arma' | 'semillas' | 'fin'
const REEL: { k: ReelPhase; t: number }[] = [
  { k: 'titulo', t: 0 }, { k: 'gira', t: 3.2 }, { k: 'desarma', t: 7.6 }, { k: 'arma', t: 11.6 }, { k: 'semillas', t: 15 }, { k: 'fin', t: 21 },
]
const REEL_END = 25.5
// otras flores que pasan en «cada número es otra flor»
const EXTRA: { sym: Symmetry; size: number; seed: number; reach: number; pal: string }[] = [
  { sym: 'octa', size: 64, seed: 3, reach: 1.72, pal: 'girasol' },
  { sym: 'tetra', size: 64, seed: 6, reach: 1.8, pal: 'fucsia' },
  { sym: 'icosa', size: 90, seed: 8, reach: 1.72, pal: 'violeta' },
]
const PREFETCH = 1_000_000
const win = (t: number, a: number, b: number, f = 0.35) => Math.max(0, Math.min(1, (t - a) / f, (b - t) / f))

function readHash(): Partial<AntesisOpts> & { pal?: string } {
  if (typeof window === 'undefined') return {}
  const q = new URLSearchParams(window.location.hash.slice(1)), o: Partial<AntesisOpts> & { pal?: string } = {}
  const s = q.get('s'); if (s === 'tetra' || s === 'octa' || s === 'icosa') o.sym = s
  const n = (k: string) => { const v = Number(q.get(k)); return q.has(k) && Number.isFinite(v) ? v : undefined }
  o.size = n('d'); o.seed = n('f'); o.reach = n('a'); o.ratio = n('r')
  const p = q.get('p'); if (p === 'fdm' || p === 'resina') o.proc = p
  if (q.get('i') === '1') o.invert = true
  const c = q.get('e'); if (c && /^\d+:\d+$/.test(c)) { const [NA, NB] = c.split(':').map(Number); o.combo = { NA, NB } }
  const pal = q.get('c'); if (pal) o.pal = pal
  for (const k of Object.keys(o) as (keyof typeof o)[]) if (o[k] === undefined) delete o[k]
  return o
}

export default function AntesisApp() {
  const workerRef = useRef<Worker | null>(null), viewerRef = useRef<AntesisViewerApi | null>(null), reqRef = useRef(0)
  const [opts, setOpts] = useState<AntesisOpts>({ sym: 'octa', size: 64, ratio: 1.35, proc: 'fdm', seed: 12, reach: 1.72, invert: false, quality: 'vista' })
  const [pal, setPal] = useState('neoproxy')
  const [built, setBuilt] = useState<Built | null>(null), [ver, setVer] = useState<Verification | null>(null)
  const [busy, setBusy] = useState(''), [err, setErr] = useState('')
  const [spin, setSpin] = useState(true), [speed, setSpeed] = useState(0.55), [explode, setExplode] = useState(0)
  const [hidden, setHidden] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState(false)
  const lastScene = useRef<Built | null>(null)
  const exportReq = useRef(0)
  const seedRef = useRef(opts.seed)
  useEffect(() => { seedRef.current = opts.seed }, [opts.seed])
  const [reel, setReel] = useState<{ phase: ReelPhase; flower: number; t0: number } | null>(null)
  const reelScenes = useRef(new Map<number, Built>())

  const palette = PALETTES.find((p) => p.k === pal) ?? PALETTES[0]

  useEffect(() => {
    const apply = () => { const h = readHash(); if (Object.keys(h).length) { const { pal: p, ...rest } = h; setOpts((o) => ({ ...o, ...rest })); if (p) setPal(p) } }
    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [])

  const pushScene = useCallback((b: Built) => {
    const v = viewerRef.current; if (!v) return
    v.setScene({ parts: b.parts, framesA: b.framesA, framesB: b.framesB, NA: b.NA, NB: b.NB, bounds: b.bounds, explodeStep: b.coreR * 0.42 })
  }, [])

  useEffect(() => {
    const w = new Worker(new URL('../../lib/antesis/worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = w
    w.onmessage = (e: MessageEvent<AntesisMsg>) => {
      const m = e.data
      if (m.type === 'built' && m.req >= PREFETCH) { reelScenes.current.set(m.req - PREFETCH, m); return }
      if (m.type === 'built') {
        if (m.req !== reqRef.current) return
        lastScene.current = m; setBuilt(m); setBusy('VERIFICANDO…'); pushScene(m)
      } else if (m.type === 'verified') {
        if (m.req !== reqRef.current) return
        setVer(m.v); setBusy('')
      } else if (m.type === 'exported') {
        if (m.req !== exportReq.current) return
        const blob = zipStore(m.files.map((f) => ({ name: f.name, data: new Uint8Array(f.data) })))
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `antesis-${lastScene.current?.NA}x${lastScene.current?.NB}-flor-${seedRef.current}.zip`; a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 4000)
        setBusy('')
      } else if (m.type === 'error') { setErr(m.error); setBusy('') }
    }
    return () => { w.terminate(); workerRef.current = null }
  }, [pushScene])

  // recalcular al cambiar las opciones (con un respiro para los deslizadores)
  useEffect(() => {
    const t = setTimeout(() => {
      const w = workerRef.current; if (!w) return
      const req = ++reqRef.current
      setBusy('CALCULANDO…'); setErr(''); setVer(null)
      w.postMessage({ type: 'build', opts: { ...opts, quality: 'vista' }, req } satisfies AntesisCmd)
      const q = new URLSearchParams({ s: opts.sym, d: String(opts.size), f: String(opts.seed), a: String(opts.reach), r: String(opts.ratio), p: opts.proc, c: pal })
      if (opts.invert) q.set('i', '1')
      if (opts.combo) q.set('e', `${opts.combo.NA}:${opts.combo.NB}`)
      history.replaceState(null, '', `#${q.toString()}`)
    }, 220)
    return () => clearTimeout(t)
  }, [opts, pal])

  useEffect(() => { viewerRef.current?.setColors(palette.c) }, [palette])
  useEffect(() => { viewerRef.current?.setSpin(spin ? speed : 0) }, [spin, speed])
  useEffect(() => { viewerRef.current?.setExplode(explode) }, [explode])

  const onViewer = useCallback((api: AntesisViewerApi | null) => {
    viewerRef.current = api
    if (!api) return
    api.setColors((PALETTES.find((p) => p.k === pal) ?? PALETTES[0]).c)
    api.setSpin(0.55)
    if (lastScene.current) pushScene(lastScene.current)
  }, [pal, pushScene])

  const set = (p: Partial<AntesisOpts>) => setOpts((o) => ({ ...o, ...p }))
  const exportAll = () => {
    const w = workerRef.current; if (!w) return
    const req = ++exportReq.current
    setBusy('PREPARANDO STL EN ALTA RESOLUCIÓN…')
    w.postMessage({ type: 'export', opts: { ...opts, quality: 'exportar' }, req } satisfies AntesisCmd)
  }
  const share = async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* sin portapapeles */ } }
  const toggle = (k: string) => { const on = !!hidden[k]; setHidden((h) => ({ ...h, [k]: !on })); viewerRef.current?.setVisible(k, on) }

  const palOf = (k: string) => (PALETTES.find((p) => p.k === k) ?? PALETTES[0]).c
  const enterReel = () => {
    const v = viewerRef.current, w = workerRef.current
    if (!v || !w || !lastScene.current) return
    reelScenes.current.clear()
    EXTRA.forEach((x, i) => w.postMessage({ type: 'build', opts: { ...opts, sym: x.sym, size: x.size, seed: x.seed, reach: x.reach, combo: undefined, invert: false, quality: 'vista' }, req: PREFETCH + i, noVerify: true } satisfies AntesisCmd))
    document.documentElement.classList.add('an-reel-on')
    v.setReel(true)
    setReel({ phase: 'titulo', flower: -1, t0: performance.now() })
  }
  const exitReel = useCallback(() => {
    document.documentElement.classList.remove('an-reel-on')
    const v = viewerRef.current
    if (v) {
      v.setReel(false)
      if (lastScene.current) pushScene(lastScene.current)
      v.setColors(palette.c); v.setSpin(spin ? speed : 0); v.setExplode(explode)
    }
    setReel(null)
  }, [palette, spin, speed, explode, pushScene])
  useEffect(() => () => { document.documentElement.classList.remove('an-reel-on') }, [])
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && reel) exitReel() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [reel, exitReel])

  // la coreografía: cada fase mueve la cámara, el giro y el desarme; los textos entran y
  // salen con el mismo reloj (requestAnimationFrame), así el reel también se puede grabar
  // cuadro a cuadro
  const reelOn = reel !== null, reelT0 = reel?.t0 ?? 0
  useEffect(() => {
    if (!reelOn) return
    let raf = 0, last = ''
    const t0 = reelT0
    const apply = (ph: ReelPhase, fl: number) => {
      const v = viewerRef.current; if (!v) return
      if (ph === 'titulo') { v.setExplode(0); v.setSpin(0.35); v.setOrbit(0.22); v.setBeta(1.16); v.setFraming(1.5, 0.03) }
      if (ph === 'gira') { v.setSpin(1.25); v.setOrbit(0.12); v.setBeta(0.98); v.setFraming(0.9, 0.02) }
      if (ph === 'desarma') { v.setExplode(1.35); v.setSpin(0.5); v.setOrbit(0.2); v.setBeta(1.1); v.setFraming(0.95, 0.02) }
      if (ph === 'arma') { v.setExplode(0); v.setSpin(0.9); v.setOrbit(0.16); v.setBeta(1.02); v.setFraming(0.92, 0.02) }
      if (ph === 'semillas') {
        const sc = reelScenes.current.get(fl)
        if (sc) { pushScene(sc); v.setColors(palOf(EXTRA[fl].pal)) }
        v.setSpin(1); v.setOrbit(0.3); v.setBeta(1.05); v.setFraming(1, 0.02)
      }
      if (ph === 'fin') {
        if (lastScene.current) pushScene(lastScene.current)
        v.setColors(palette.c); v.setSpin(0.45); v.setOrbit(0.18); v.setBeta(1.12); v.setFraming(1.3, 0.22)
      }
    }
    const tick = () => {
      const t = (performance.now() - t0) / 1000
      let ph: ReelPhase = 'titulo'
      for (const s of REEL) if (t >= s.t) ph = s.k
      const fl = ph === 'semillas' ? Math.min(EXTRA.length - 1, Math.floor((t - 15) / 2)) : -1
      const key = `${ph}${fl}`
      if (key !== last) { last = key; apply(ph, fl); setReel((r) => (r ? { ...r, phase: ph, flower: fl } : r)) }
      if (t < REEL_END) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reelOn]) // eslint-disable-line react-hooks/exhaustive-deps

  const b = built
  const partsCount = b ? b.parts.reduce((s, p) => s + p.count, 0) : 0
  const sizeOf = (p: PartOut) => `${fmt(p.sizeMm[0], 0)} × ${fmt(p.sizeMm[1], 0)} × ${fmt(p.sizeMm[2], 0)} mm`
  const sym = SYMS.find((s) => s.k === opts.sym)!
  const totalMm = b ? 2 * b.bounds : 0

  return (
    <div>
      <div className={reel ? 'an-reel' : ''} data-phase={reel?.phase} style={reel ? { position: 'fixed', inset: 0, zIndex: 400, background: '#000', display: 'grid', placeItems: 'center' } : {}}>
      <div className={reel ? 'an-reel-box' : ''} style={reel ? { position: 'relative', height: 'min(100vh, 100vw * 16 / 9)', aspectRatio: '9 / 16', background: '#030306', overflow: 'hidden' } : { position: 'relative', height: 'min(80vh, 760px)', minHeight: 460, background: '#030306', border: '1px solid #ffffff14' }}>
        <AntesisViewer onReady={onViewer} />
        {reel && <ReelOverlay reel={reel} b={b} partsCount={partsCount} seed={opts.seed} symLabel={sym.label}  onExit={exitReel} />}
        {!reel && <>
        <div style={{ position: 'absolute', left: 14, top: 12, pointerEvents: 'none', textShadow: '0 1px 4px #000', fontSize: 11, letterSpacing: 1.8, color: '#ffffffcc', lineHeight: 1.8 }}>
          <div style={{ color: ACCENT }}>FLOR {opts.seed} · {sym.label} · {sym.sub}</div>
          {b && <div>{b.NA} : {b.NB} dientes · módulo {fmt(b.m, 2)} mm · Ø {fmt(totalMm, 0)} mm</div>}
          {busy && <div style={{ color: '#ffd27c' }}>{busy}</div>}
          {!busy && ver && <div style={{ color: ver.ok ? OK : WARN }}>{ver.ok ? '✓ ENGRANA Y GIRA SIN CHOCAR' : '⚠ REVISA LA VERIFICACIÓN'}</div>}
        </div>
        <div style={{ position: 'absolute', left: 10, bottom: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Chip on={spin} onClick={() => setSpin((s) => !s)} title="Girar los engranajes">{spin ? '❚❚ PAUSA' : '▶ GIRAR'}</Chip>
          <Chip on={explode > 0} onClick={() => setExplode((e) => (e > 0 ? 0 : 1))} color={PINK} title="Separar las piezas a lo largo de cada eje: así se arman">{explode > 0 ? '◉ ARMAR' : '◎ DESARMAR'}</Chip>
        </div>
        </>}
      </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', margin: '12px 0 16px' }}>
        <button type="button" className="press" onClick={() => set({ seed: Math.floor(Math.random() * 99999) + 1 })} style={{ minHeight: 48, padding: '0 24px', fontFamily: mono, fontWeight: 700, fontSize: 12, letterSpacing: 3, cursor: 'pointer', border: 'none', background: `linear-gradient(90deg,${ACCENT},${PINK})`, color: '#08040c' }}>✿ OTRA FLOR</button>
        <Chip on={false} onClick={() => set({ seed: Math.max(1, opts.seed - 1) })} title="Flor anterior">←</Chip>
        <Chip on={false} onClick={() => set({ seed: opts.seed + 1 })} title="Flor siguiente">→</Chip>
        <div style={{ minWidth: 200, flex: '0 1 260px' }}><Slider label="VELOCIDAD" value={speed} min={0.1} max={2} step={0.05} readout={`${fmt(speed, 2)} rad/s`} onChange={(v) => { setSpeed(v); setSpin(true) }} /></div>
        <div style={{ minWidth: 200, flex: '0 1 260px' }}><Slider label="DESARMAR" value={explode} min={0} max={1.6} step={0.05} readout={explode ? fmt(explode, 2) : 'armada'} onChange={setExplode} /></div>
        <span style={{ flex: 1 }} />
        <Chip on={!!reel} onClick={enterReel} disabled={!b} color="#ffd27c" title="Pantalla vertical de 25 segundos que corre sola: para grabarla con el teléfono">▣ MODO REEL</Chip>
      </div>
      {err && <p style={{ color: WARN, fontSize: 12 }}>{err}</p>}

      <div className="an-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 22 }}>
        <Panel title="LA FLOR">
          <div>
            <div style={{ fontSize: 11, letterSpacing: 1.5, color: '#8fa8c4', marginBottom: 6 }}>SIMETRÍA</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SYMS.map((s) => <Chip key={s.k} on={opts.sym === s.k} onClick={() => set({ sym: s.k, combo: undefined, size: s.k === 'icosa' ? Math.max(opts.size, 84) : opts.size })} title={s.sub}>{s.label} <span style={{ opacity: 0.7 }}>· {s.sub.split(' ')[0]}+{s.sub.split(' ')[2]}</span></Chip>)}
            </div>
          </div>
          <Slider label="ALCANCE" value={opts.reach} min={1.45} max={2.1} step={0.01} readout={`${fmt(opts.reach, 2)} × la esfera`} onChange={(v) => set({ reach: v })} />
          <div>
            <div style={{ fontSize: 11, letterSpacing: 1.5, color: '#8fa8c4', marginBottom: 6 }}>PÉTALOS EN</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Chip on={!opts.invert} onClick={() => set({ invert: false })}>LOS A (MAYORES)</Chip>
              <Chip on={opts.invert} onClick={() => set({ invert: true })}>LOS B</Chip>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 1.5, color: '#8fa8c4', marginBottom: 6 }}>COLORES (EN PANTALLA)</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PALETTES.map((p) => (
                <Chip key={p.k} on={pal === p.k} onClick={() => setPal(p.k)}>
                  <span aria-hidden style={{ display: 'inline-flex', gap: 2, marginRight: 6, verticalAlign: 'middle' }}>{['engranaje-a', 'deco-a', 'deco-b'].map((k) => <i key={k} style={{ width: 9, height: 9, background: p.c[k], display: 'inline-block' }} />)}</span>{p.label}
                </Chip>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#6f86a3', lineHeight: 1.8 }}>
            Cada número es una flor: cantidad de pétalos, torsión, ancho, puntas, brazos de la corona, ganchos y gotas salen de la semilla. La forma siempre se ajusta a su espacio: ningún pétalo puede alcanzar al vecino.
          </div>
        </Panel>
        <Panel title="EL MECANISMO" color="#9fe8ff">
          <Slider label="ESFERA DE ENGRANAJES" value={opts.size} min={opts.sym === 'icosa' ? 72 : 48} max={130} step={1} readout={`Ø ${opts.size} mm`} onChange={(v) => set({ size: v, combo: undefined })} />
          <div>
            <div style={{ fontSize: 11, letterSpacing: 1.5, color: '#8fa8c4', marginBottom: 6 }}>IMPRESIÓN</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Chip on={opts.proc === 'fdm'} color="#9fe8ff" onClick={() => set({ proc: 'fdm', combo: undefined })} title="Filamento: holguras más amplias y dientes más gruesos">FDM (FILAMENTO)</Chip>
              <Chip on={opts.proc === 'resina'} color="#9fe8ff" onClick={() => set({ proc: 'resina', combo: undefined })} title="Resina: holguras finas, dientes más chicos">RESINA</Chip>
            </div>
          </div>
          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, color: '#8fa8c4', marginBottom: 6 }}>DIENTES (A : B)</div>
            <select value={b ? `${b.NA}:${b.NB}` : ''} onChange={(e) => { const [NA, NB] = e.target.value.split(':').map(Number); set({ combo: { NA, NB }, ratio: NA / NB }) }}
              style={{ width: '100%', minHeight: 40, background: '#02040a', color: '#fff', border: '1px solid #ffffff2a', fontFamily: mono, fontSize: 12, padding: '0 10px' }}>
              {(b?.combos ?? []).map((c) => <option key={`${c.NA}:${c.NB}`} value={`${c.NA}:${c.NB}`}>{c.NA} : {c.NB} · módulo {fmt(c.m, 2)} mm</option>)}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
            <Stat k="ENGRANAJES" v={b ? `${b.info.A} + ${b.info.B}` : '…'} />
            <Stat k="UNIONES" v={b ? String(b.info.uniones) : '…'} title="Pares de engranajes que se tocan" />
            <Stat k="ÁNGULO ENTRE EJES" v={b ? `${fmt(Number(b.info.sigma), 2)}°` : '…'} />
            <Stat k="MÓDULO" v={b ? `${fmt(b.m, 2)} mm` : '…'} title="Tamaño del diente en el borde exterior" warn={!!b && opts.proc === 'fdm' && b.m < 1.3} />
          </div>
        </Panel>
      </div>

      <section style={{ marginTop: 22, background: '#080c12', border: `1px solid ${ver ? (ver.ok ? OK : WARN) : '#ffffff'}22`, padding: '18px 20px' }}>
        <div style={{ fontSize: 11.5, letterSpacing: 3, color: ver ? (ver.ok ? OK : WARN) : '#9fe8ff', marginBottom: 12 }}>VERIFICACIÓN {busy && !ver ? `· ${busy}` : ''}</div>
        {ver ? (
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 12, lineHeight: 2, color: '#a9bdd4' }}>
            <li><b style={{ color: ver.teeth.penetrations === 0 ? OK : WARN }}>{ver.teeth.penetrations === 0 ? 'Los dientes no se traban.' : 'Hay dientes que se traban.'}</b> Un par girado {ver.teeth.steps} posiciones a lo largo de un diente completo: holgura mínima entre flancos {fmt(ver.teeth.minClear, 3)} mm (el juego elegido, repartido entre los dos).</li>
            <li><b style={{ color: ver.teethAll.penetrations === 0 ? OK : WARN }}>{ver.teethAll.penetrations === 0 ? `Las ${ver.teethAll.pairs} uniones engranan a la vez.` : 'Alguna unión no engrana.'}</b> Todas medidas con los engranajes en su lugar real: holgura mínima {fmt(ver.teethAll.minClear, 3)} mm.</li>
            <li><b style={{ color: ver.sweepMin > 0.3 ? OK : WARN }}>{ver.sweepMin > 0.3 ? 'Lo que gira no choca.' : 'Hay piezas que se rozan al girar.'}</b> Distancia mínima entre lo que barren dos vecinos en una vuelta entera: {fmt(ver.sweepMin, 2)} mm ({ver.sweep.length} pruebas).</li>
            <li><b style={{ color: ver.meshes.every((m) => m.closed) ? OK : WARN }}>{ver.meshes.every((m) => m.closed) ? 'Mallas cerradas.' : 'Hay mallas abiertas.'}</b> {ver.meshes.length} piezas distintas, todas sólidas: cada arista la comparten exactamente dos triángulos.</li>
            {ver.stack.map((s) => <li key={s} style={{ color: WARN }}>{s}</li>)}
          </ul>
        ) : <div style={{ fontSize: 12, color: '#6f86a3' }}>Calculando…</div>}
      </section>

      <section style={{ marginTop: 22 }}>
        <div style={{ fontSize: 11.5, letterSpacing: 3, color: '#9fe8ff', marginBottom: 10 }}>PIEZAS · {partsCount} EN TOTAL</div>
        <div style={{ display: 'grid', gap: 6 }}>
          {(b?.parts ?? []).map((p) => (
            <div key={p.key} style={{ display: 'grid', gridTemplateColumns: '14px minmax(0,1fr) auto auto', gap: 12, alignItems: 'center', padding: '8px 12px', background: '#080c12', border: '1px solid #ffffff10', fontSize: 12 }}>
              <i aria-hidden style={{ width: 14, height: 14, background: palette.c[p.key] ?? '#888', display: 'block', border: '1px solid #ffffff30' }} />
              <div><span style={{ color: '#fff' }}>{p.name}</span> <span style={{ color: '#7f96b2' }}>· {sizeOf(p)}</span></div>
              <span style={{ color: ACCENT, letterSpacing: 1 }}>× {p.count}</span>
              <button type="button" className="press" onClick={() => toggle(p.key)} aria-pressed={!hidden[p.key]} title={hidden[p.key] ? 'Mostrar' : 'Ocultar'} style={{ minWidth: 44, minHeight: 34, background: 'transparent', border: '1px solid #ffffff22', color: hidden[p.key] ? '#6f86a3' : '#c8daf0', fontFamily: mono, fontSize: 11, cursor: 'pointer' }}>{hidden[p.key] ? 'OCULTO' : 'VISIBLE'}</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginTop: 14 }}>
          <button className="press" onClick={exportAll} disabled={!b || !!busy} style={{ minHeight: 48, background: `linear-gradient(90deg,${ACCENT},${PINK})`, color: '#08040c', border: 'none', fontFamily: mono, fontWeight: 700, fontSize: 12, letterSpacing: 1.5, cursor: 'pointer', opacity: b && !busy ? 1 : 0.5 }}>{busy.startsWith('PREPARANDO') ? busy : 'DESCARGAR TODO (STL + JSON)'}</button>
          <button className="press" onClick={share} style={{ minHeight: 48, background: 'transparent', border: '1px solid #ffffff2a', color: '#c8daf0', fontFamily: mono, fontSize: 11.5, letterSpacing: 1.5, cursor: 'pointer' }}>{copied ? 'ENLACE COPIADO' : 'COPIAR ENLACE A ESTA FLOR'}</button>
          <a href={`https://wa.me/${WA}`} onClick={(e) => { e.currentTarget.href = `https://wa.me/${WA}?text=${encodeURIComponent(`Hola, quiero imprimir esta flor de engranajes ANTESIS: ${window.location.href}`)}` }} target="_blank" rel="noopener noreferrer" className="press" style={{ minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#25d366', color: '#04210f', fontWeight: 700, fontSize: 12, letterSpacing: 1.5, textDecoration: 'none' }}>PEDIRLA IMPRESA</a>
        </div>
        <p style={{ fontSize: 11, color: '#6f86a3', lineHeight: 1.8, margin: '12px 0 0' }}>
          El ZIP trae un STL por tipo de pieza (el nombre dice cuántas imprimir), ya orientado para imprimir: los engranajes con la cara grande abajo, el núcleo sobre una de sus caras planas. Y un JSON con todas las medidas, holguras y la verificación.
        </p>
      </section>

      <style>{`
        .an-range { -webkit-appearance: none; appearance: none; height: 3px; background: #ffffff2a; outline: none; border-radius: 2px; }
        .an-range::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${ACCENT}; border: 2px solid #02060a; cursor: pointer; }
        .an-range::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: ${ACCENT}; border: 2px solid #02060a; cursor: pointer; }
        @media (max-width: 900px) { .an-grid { grid-template-columns: 1fr !important; } }
        html.an-reel-on, html.an-reel-on body { overflow: hidden !important; }
        html.an-reel-on .neo-organism-filter { filter: none !important; transition: none !important; }
        html.an-reel-on .an-layer { z-index: 2000 !important; }
        .an-reel button[aria-label="Acercar"], .an-reel button[aria-label="Alejar"], .an-reel button[aria-label="Restablecer la vista"] { display: none !important; }
      `}</style>
    </div>
  )
}

// fase y opacidades a partir del mismo reloj
function reelClock(t: number) {
  let ph: ReelPhase = 'titulo'
  for (const s of REEL) if (t >= s.t) ph = s.k
  const fl = ph === 'semillas' ? Math.min(EXTRA.length - 1, Math.floor((t - 15) / 2)) : -1
  const i = REEL.findIndex((s) => s.k === ph), a = REEL[i].t, b = i + 1 < REEL.length ? REEL[i + 1].t : 1e9
  const segA = ph === 'semillas' ? 15 + 2 * Math.max(0, fl) : a, segB = ph === 'semillas' ? segA + 2 : b
  return {
    black: Math.max(0, 1 - t / 1.2), title: win(t, 0.3, 3.0, 0.5),
    cap: ph === 'titulo' || ph === 'fin' ? 0 : win(t, segA + 0.15, segB - 0.1, 0.3), fin: win(t, 21.3, 1e9, 0.7),
  }
}

function ReelOverlay({ reel, b, partsCount, seed, symLabel, onExit }: {
  reel: { phase: ReelPhase; flower: number; t0: number }; b: Built | null; partsCount: number; seed: number; symLabel: string
  onExit: () => void
}) {
  // los textos entran y salen con el reloj de requestAnimationFrame (no con transiciones CSS):
  // así el reel también se puede grabar cuadro a cuadro, con el tiempo controlado
  const black = useRef<HTMLDivElement>(null), title = useRef<HTMLDivElement>(null), capRef = useRef<HTMLDivElement>(null), fin = useRef<HTMLDivElement>(null)
  const t0 = reel.t0
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const o = reelClock((performance.now() - t0) / 1000)
      if (black.current) black.current.style.opacity = String(o.black)
      if (title.current) title.current.style.opacity = String(o.title)
      if (capRef.current) capRef.current.style.opacity = String(o.cap)
      if (fin.current) fin.current.style.opacity = String(o.fin)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [t0])
  const gears = b ? Number(b.info.A) + Number(b.info.B) : 0, unions = b ? Number(b.info.uniones) : 0
  const x = reel.flower >= 0 ? EXTRA[reel.flower] : null
  const cap: Record<ReelPhase, [string, string]> = {
    titulo: ['', ''], fin: ['', ''],
    gira: ['Gira uno, giran todos.', `${gears} engranajes · ${unions} uniones · cero choques`],
    desarma: [`${partsCount} piezas.`, 'núcleo · engranajes · pasadores · pétalos y coronas'],
    arma: ['Se imprimen por separado.', 'y encajan: el diente, el pasador, el hexágono'],
    semillas: ['Cada número es otra flor.', x ? `FLOR #${x.seed} · ${SYMS.find((s) => s.k === x.sym)?.label}` : ''],
  }
  const [big, small] = cap[reel.phase]
  const vh = (n: number, min: number, max: number) => `clamp(${min}px, ${n}vh, ${max}px)`
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', fontFamily: mono, textAlign: 'center' }}>
      <div ref={black} style={{ position: 'absolute', inset: 0, background: '#000' }} />
      <div ref={title} style={{ position: 'absolute', top: '8%', left: 0, right: 0, padding: '0 6%', opacity: 0 }}>
        <div style={{ fontSize: vh(1.5, 10, 15), letterSpacing: 5, color: ACCENT }}>NEO·PROXY // MECANISMO</div>
        <div style={{ fontSize: vh(7.6, 34, 84), letterSpacing: '0.22em', fontWeight: 700, color: '#fff', textShadow: `0 0 40px ${ACCENT}aa`, margin: '0.25em 0 0.1em', paddingLeft: '0.22em' }}>ANTESIS</div>
        <div style={{ fontSize: vh(2.1, 12, 21), color: '#e6dcff' }}>una flor que es un mecanismo</div>
        <div style={{ fontSize: vh(1.5, 10, 15), letterSpacing: 3, color: '#ffffff99', marginTop: '0.8em' }}>FLOR #{seed} · {symLabel}</div>
      </div>
      <div ref={capRef} style={{ position: 'absolute', top: '7%', left: 0, right: 0, padding: '0 7%', opacity: 0, textShadow: '0 2px 10px #000' }}>
        <div style={{ fontSize: vh(3.3, 18, 36), fontWeight: 700, color: '#fff', letterSpacing: 1, lineHeight: 1.25 }}>{big}</div>
        <div style={{ fontSize: vh(1.75, 11, 18), color: PINK, letterSpacing: 1.5, marginTop: '0.7em' }}>{small}</div>
      </div>
      <div ref={fin} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '18% 7% 9%', opacity: 0, background: 'linear-gradient(transparent, #000000e6 38%)' }}>
        <div style={{ fontSize: vh(6, 30, 66), letterSpacing: '0.22em', paddingLeft: '0.22em', fontWeight: 700, color: '#fff', textShadow: `0 0 34px ${ACCENT}aa` }}>ANTESIS</div>
        <div style={{ fontSize: vh(2.5, 14, 26), color: '#fff', fontWeight: 700, marginTop: '0.7em' }}>Comenta un número:</div>
        <div style={{ fontSize: vh(2.5, 14, 26), color: PINK, fontWeight: 700 }}>esa es tu flor.</div>
        <div style={{ fontSize: vh(1.7, 11, 18), color: '#9fe8ff', letterSpacing: 2, marginTop: '1.1em' }}>neoproxy.art/antesis</div>
      </div>
      <div style={{ position: 'absolute', left: '6%', right: '6%', bottom: '2.6%', display: 'flex', justifyContent: 'space-between', fontSize: vh(1.25, 9, 13), letterSpacing: 3, color: '#ffffff66', opacity: reel.phase === 'fin' || reel.phase === 'titulo' ? 0 : 1 }}>
        <span>NEO·PROXY</span><span>neoproxy.art/antesis</span>
      </div>
      <button type="button" className="an-reel-exit" onClick={onExit} style={{ position: 'absolute', top: 10, right: 10, pointerEvents: 'auto', opacity: reel.phase === 'titulo' ? 1 : 0.3, fontFamily: mono, fontSize: 12, letterSpacing: 2, padding: '8px 12px', background: '#000a', color: '#9fb4cc', border: '1px solid #ffffff30', cursor: 'pointer' }}>SALIR ✕</button>
    </div>
  )
}
