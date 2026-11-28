'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { VCmd, VMsg, PartMsg } from '@/lib/arsenal/vertice/worker'
import { specs, PALETAS, type Verification, type Spec } from '@/lib/arsenal/vertice/build'
import { DEFAULTS, type VerticeOpts, type Dims } from '@/lib/arsenal/vertice/model'
import { zipStore } from '@/lib/antesis/zip'
import type { SwordViewerApi } from './SwordViewer'

const SwordViewer = dynamic(() => import('./SwordViewer'), { ssr: false })

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff', AMBER = '#e0b070', GREEN = '#7cf0b0', RED = '#ff7a7a', DIM = '#8fa8c4', FAINT = '#6f86a3', CRIMSON = '#ff4d5e'
const card: React.CSSProperties = { background: '#080c12', border: '1px solid #ffffff12', padding: '14px 16px' }

function Chip({ on, onClick, children, color = CYAN, label }: { on: boolean; onClick: () => void; children: React.ReactNode; color?: string; label?: string }) {
  return <button type="button" className="press" aria-pressed={on} aria-label={label} onClick={onClick} style={{ minHeight: 36, padding: '0 11px', flexShrink: 0, whiteSpace: 'nowrap', fontFamily: mono, fontSize: 11, letterSpacing: 1.1, cursor: 'pointer', background: on ? `${color}22` : 'transparent', border: `1px solid ${on ? color : '#ffffff26'}`, color: on ? color : '#9fb4cc' }}>{children}</button>
}
function Slider({ label, unit, value, min, max, step, onChange }: { label: string; unit?: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, letterSpacing: 1.4, color: DIM }}><span>{label}</span><b style={{ color: '#fff', fontWeight: 400 }}>{value}{unit}</b></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: CRIMSON, minHeight: 28 }} />
    </label>
  )
}
const H = ({ children }: { children: React.ReactNode }) => <div style={{ fontSize: 11, letterSpacing: 3, color: `${CRIMSON}dd`, margin: '0 0 8px' }}>{children}</div>
const Sub = ({ children }: { children: React.ReactNode }) => <div style={{ fontSize: 11, letterSpacing: 1.4, color: DIM, marginBottom: 6 }}>{children}</div>

const GROUPS: [string, string][] = [['nucleo', 'NÚCLEO'], ['filo', 'FILO'], ['blindaje', 'BLINDAJES'], ['guarda', 'GUARDA'], ['dial', 'DIAL'], ['mango', 'MANGO'], ['pomo', 'POMO'], ['varilla', 'VARILLA'], ['manguera', 'MANGUERA']]

type Focus = Record<string, { c: [number, number, number]; r: number }>
function framing(D: Dims): { center: [number, number, number]; radius: number; focus: Focus } {
  const x0 = D.x0P, x1 = D.L, cx = (x0 + x1) / 2, r = (x1 - x0) / 2
  return {
    center: [cx, 0, 0], radius: r,
    focus: {
      todo: { c: [cx, 0, 0], r: 0 },
      punta: { c: [D.L - 0.9 * D.W, 0, 0], r: Math.max(170, 2.4 * D.W) },
      guarda: { c: [-D.Gt / 2 + 10, 4, 0], r: 190 },
      dial: { c: [-D.Gt / 2, 0, D.Gz], r: 85 },
      mango: { c: [D.xGf - D.Lg / 2, 0, 0], r: Math.max(220, D.Lg * 0.95) },
      pomo: { c: [D.x0P + 18, 6, 0], r: 120 },
    },
  }
}

// reparte las piezas entre los hilos: la más cara primero, al hilo con menos trabajo
function assign(list: Spec[], n: number): string[][] {
  const load = Array(n).fill(0), out: string[][] = Array.from({ length: n }, () => [])
  for (const s of [...list].sort((a, b) => b.cost - a.cost)) { const i = load.indexOf(Math.min(...load)); out[i].push(s.key); load[i] += s.cost }
  return out
}

type Got = Record<string, PartMsg>

export default function VerticeApp() {
  const [o, setO] = useState<VerticeOpts>({ ...DEFAULTS })
  const [got, setGot] = useState<Record<string, { printMm: [number, number, number]; fits: boolean; triangles: number }>>({})
  const [v, setV] = useState<Verification | null>(null)
  const [busy, setBusy] = useState('GENERANDO…'), [err, setErr] = useState(''), [prog, setProg] = useState<[number, number]>([0, 0])
  const [explode, setExplode] = useState(0), [glow, setGlow] = useState(true), [spin, setSpin] = useState(true), [lines, setLines] = useState(true)
  const [hidden, setHidden] = useState<string[]>([])
  const api = useRef<SwordViewerApi | null>(null), pool = useRef<Worker[]>([]), verifier = useRef<Worker | null>(null), req = useRef(0)
  const optsRef = useRef(o), job = useRef<{ req: number; mode: 'view' | 'export'; total: number; got: Got; done: number; look: Look } | null>(null)
  optsRef.current = o // eslint-disable-line react-hooks/refs -- espejo para los hilos (se lee solo desde manejadores)

  const geomKey = JSON.stringify({ ...o, paleta: undefined })
  const meta = useMemo(() => { const g = JSON.parse(geomKey) as VerticeOpts; return specs({ ...g, quality: 'vista' }) }, [geomKey])
  const frame = useMemo(() => framing(meta.D), [meta])
  const frameRef = useRef(frame)
  useEffect(() => { frameRef.current = frame }, [frame])
  const metaRef = useRef(meta)
  useEffect(() => { metaRef.current = meta }, [meta])

  const onReady = useCallback((a: SwordViewerApi | null) => {
    api.current = a
    if (!a) return
    a.setPalette(PALETAS[optsRef.current.paleta])
    const j = job.current
    if (j && j.mode === 'view') { a.begin(frameRef.current.center, frameRef.current.radius); for (const p of Object.values(j.got)) addToView(a, p, j.look) }
  }, [])

  const finishExport = useCallback((m: Extract<VMsg, { type: 'verified' }>) => {
    const j = job.current
    if (!j) return
    const files: { name: string; data: Uint8Array }[] = []
    const list = metaRef.current.list
    for (const s of list) { const p = j.got[s.key]; if (s.print && p?.stl) files.push({ name: s.print.file.replace('.stl', s.print.count > 1 ? `-x${s.print.count}.stl` : '.stl'), data: new Uint8Array(p.stl) }) }
    files.push({ name: 'vertice-parametros.json', data: new TextEncoder().encode(m.json ?? '{}') })
    files.push({ name: 'LEEME.txt', data: new TextEncoder().encode(readme(m.json ?? '{}')) })
    const zip = zipStore(files)
    const a = document.createElement('a'); a.href = URL.createObjectURL(zip); a.download = `npx-02-vertice-${optsRef.current.largo}mm.zip`; a.click()
  }, [])

  useEffect(() => {
    const n = Math.max(2, Math.min(4, (navigator.hardwareConcurrency || 4) - 1))
    const onMsg = (e: MessageEvent<VMsg>) => {
      const m = e.data, j = job.current
      if (!j || m.req !== j.req) return
      if (m.type === 'error') { setBusy(''); setErr(m.error); return }
      if (m.type === 'part') {
        j.got[m.key] = m
        setGot((g) => ({ ...g, [m.key]: { printMm: m.printMm, fits: m.fits, triangles: m.triangles } }))
        setProg([Object.keys(j.got).length, j.total])
        if (j.mode === 'view' && api.current) addToView(api.current, m, j.look)
      } else if (m.type === 'done') {
        j.done++
        if (j.done === pool.current.length) {
          setBusy(j.mode === 'view' ? 'VERIFICANDO…' : 'VERIFICANDO EN ALTA RESOLUCIÓN…')
          const meshes = Object.values(j.got).map((p) => ({ key: p.key, positions: p.positions, indices: p.indices, raw: p.raw }))
          verifier.current?.postMessage({ type: 'verify', req: j.req, opts: { ...optsRef.current, quality: j.mode === 'export' ? 'exportar' : 'vista' }, meshes, json: j.mode === 'export' } satisfies VCmd)
        }
      } else if (m.type === 'verified') {
        setV(m.v); setBusy('')
        if (j.mode === 'export') finishExport(m)
      }
    }
    pool.current = Array.from({ length: n }, () => { const w = new Worker(new URL('../../lib/arsenal/vertice/worker.ts', import.meta.url), { type: 'module' }); w.onmessage = onMsg; return w })
    const vw = new Worker(new URL('../../lib/arsenal/vertice/worker.ts', import.meta.url), { type: 'module' }); vw.onmessage = onMsg; verifier.current = vw
    return () => { for (const w of pool.current) w.terminate(); vw.terminate(); pool.current = []; verifier.current = null }
  }, [finishExport])

  const run = useCallback((mode: 'view' | 'export') => {
    const id = ++req.current, M = metaRef.current
    const list = M.list.filter((s) => mode === 'view' || s.print)
    const look: Look = {}
    for (const s of M.list) look[s.key] = { group: s.group, explode: s.explode }
    job.current = { req: id, mode, total: list.length, got: {}, done: 0, look }
    setProg([0, list.length]); setErr('')
    if (mode === 'view') { setGot({}); setV(null); api.current?.begin(frameRef.current.center, frameRef.current.radius) }
    const parts = assign(list, pool.current.length)
    pool.current.forEach((w, i) => w.postMessage({ type: 'parts', req: id, opts: optsRef.current, keys: parts[i], mode } satisfies VCmd))
  }, [])

  // reconstruir al cambiar la geometría (con una pausa para no recalcular a cada paso del control)
  useEffect(() => {
    const t = setTimeout(() => { setBusy('GENERANDO…'); run('view') }, 280)
    return () => clearTimeout(t)
  }, [geomKey, run])
  useEffect(() => { api.current?.setPalette(PALETAS[o.paleta]) }, [o.paleta])
  useEffect(() => { api.current?.setExplode(explode) }, [explode])
  useEffect(() => { api.current?.setGlow(glow) }, [glow])
  useEffect(() => { api.current?.setLines(lines) }, [lines])
  useEffect(() => { api.current?.setSpin(spin) }, [spin])

  const set = <K extends keyof VerticeOpts>(k: K, val: VerticeOpts[K]) => setO((p) => ({ ...p, [k]: val }))
  const toggleGroup = (g: string) => {
    const on = hidden.includes(g)
    setHidden((h) => (on ? h.filter((x) => x !== g) : [...h, g]))
    api.current?.setVisible(g, on)
  }
  const exporting = busy.startsWith('PREPARANDO') || busy.includes('ALTA')
  const exportAll = () => { setBusy('PREPARANDO STL EN ALTA RESOLUCIÓN…'); setV(null); run('export') }
  const D = meta.D, pal = PALETAS[o.paleta]
  const printed = meta.list.filter((s) => s.print)
  const nFiles = printed.length, nPieces = printed.reduce((s, p) => s + (p.print?.count ?? 0), 0)

  return (
    <div className="ar-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.55fr) minmax(300px, 1fr)', gap: 18, alignItems: 'start' }}>
      <div className="ar-view" style={{ position: 'sticky', top: 84, display: 'grid', gap: 10 }}>
        <div style={{ position: 'relative', height: 'min(64vh, 620px)', minHeight: 320, background: 'radial-gradient(circle at 50% 40%, #0d1118 0%, #020408 75%)', border: '1px solid #ffffff14' }}>
          <SwordViewer onReady={onReady} />
          <div style={{ position: 'absolute', left: 10, top: 10, fontSize: 10.5, letterSpacing: 1.6, color: busy ? AMBER : GREEN, background: 'rgba(3,6,10,.72)', padding: '5px 9px', border: '1px solid #ffffff1e' }} role="status">
            {busy ? `● ${busy}${prog[1] && prog[0] < prog[1] ? ` ${prog[0]}/${prog[1]}` : ''}` : '● LISTO'}
          </div>
        </div>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, letterSpacing: 1.4, color: DIM }}><span>EXPLOSIÓN · cómo se arma</span><b style={{ color: '#fff', fontWeight: 400 }}>{Math.round(explode * 100)}%</b></span>
          <input type="range" min={0} max={1} step={0.01} value={explode} onChange={(e) => setExplode(Number(e.target.value))} style={{ width: '100%', accentColor: CRIMSON, minHeight: 28 }} />
        </label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 10.5, letterSpacing: 1.5, color: FAINT }}>ENCUADRE</span>
          {([['todo', 'TODO'], ['punta', 'PUNTA'], ['guarda', 'GUARDA'], ['dial', 'DIAL'], ['mango', 'MANGO'], ['pomo', 'POMO']] as const).map(([k, l]) => (
            <Chip key={k} on={false} onClick={() => { if (k === 'todo') api.current?.resetView(); else { const f = frame.focus[k]; api.current?.focus(f.c, f.r) } }}>{l}</Chip>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {GROUPS.map(([g, l]) => <Chip key={g} on={!hidden.includes(g)} onClick={() => toggleGroup(g)} color={AMBER}>{l}</Chip>)}
          <Chip on={glow} onClick={() => setGlow((x) => !x)} color={GREEN}>BRILLO</Chip>
          <Chip on={lines} onClick={() => setLines((x) => !x)} color={GREEN}>TRAZOS</Chip>
          <Chip on={spin} onClick={() => setSpin((x) => !x)} color={GREEN}>GIRO</Chip>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        <section style={{ ...card, display: 'grid', gap: 12 }}>
          <H>HOJA</H>
          <Slider label="LARGO DE LA HOJA" unit=" mm" value={o.largo} min={500} max={1000} step={10} onChange={(x) => set('largo', x)} />
          <Slider label="ALTO (LOMO A FILO)" unit=" mm" value={o.ancho} min={48} max={84} step={1} onChange={(x) => set('ancho', x)} />
          <div>
            <Sub>PUNTA</Sub>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {([['cincel', 'CINCEL'], ['tanto', 'TANTO'], ['espolon', 'ESPOLÓN']] as const).map(([k, l]) => <Chip key={k} on={o.punta === k} onClick={() => set('punta', k)} color={CRIMSON}>{l}</Chip>)}
            </div>
          </div>
          <Slider label="VENTANAS DEL NÚCLEO (HASTA)" value={o.ventanas} min={0} max={9} step={1} onChange={(x) => set('ventanas', x)} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Chip on={o.fibra} onClick={() => set('fibra', !o.fibra)} color={AMBER}>FIBRA ÓPTICA + LED EN LA GUARDA</Chip>
          </div>
        </section>

        <section style={{ ...card, display: 'grid', gap: 12 }}>
          <H>COLORES</H>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(Object.keys(PALETAS) as (keyof typeof PALETAS)[]).map((k) => (
              <button key={k} type="button" className="press" aria-pressed={o.paleta === k} onClick={() => set('paleta', k)} style={{ minHeight: 40, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 8, fontFamily: mono, fontSize: 11, letterSpacing: 1.1, cursor: 'pointer', background: o.paleta === k ? '#ffffff10' : 'transparent', border: `1px solid ${o.paleta === k ? '#ffffffaa' : '#ffffff26'}`, color: '#dce8f6' }}>
                <span style={{ display: 'flex' }}>{(['filo', 'nucleo', 'blindaje', 'dial'] as const).map((g) => <i key={g} style={{ width: 11, height: 18, background: PALETAS[k][g], display: 'block' }} />)}</span>
                {PALETAS[k].nombre.toUpperCase()}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, lineHeight: 1.8, color: FAINT, margin: 0 }}>Cada capa se imprime en su color de filamento: núcleo, filo, blindajes, guarda y pomo, mango y dial. No hace falta pintar.</p>
        </section>

        <section style={{ ...card, display: 'grid', gap: 12 }}>
          <H>TU IMPRESORA</H>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Chip on={o.proc === 'fdm'} onClick={() => set('proc', 'fdm')}>FILAMENTO (FDM)</Chip>
            <Chip on={o.proc === 'resina'} onClick={() => set('proc', 'resina')}>RESINA</Chip>
          </div>
          <div>
            <Sub>CAMA DE IMPRESIÓN (LADO)</Sub>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[180, 220, 256, 300].map((b) => <Chip key={b} on={o.maxPieza === b} onClick={() => set('maxPieza', b)}>{b} mm</Chip>)}
            </div>
          </div>
          <p style={{ fontSize: 11, lineHeight: 1.8, color: FAINT, margin: 0 }}>
            Con una cama más chica, cada lámina se corta en más tramos (las piezas largas van en diagonal). Holgura de los encajes: {o.proc === 'fdm' ? '0,25 mm' : '0,12 mm'}.
          </p>
        </section>

        <section style={{ ...card, display: 'grid', gap: 8 }}>
          <H>PIEZAS A IMPRIMIR</H>
          <div style={{ fontSize: 11.5, color: DIM, lineHeight: 1.8 }}>
            Largo total {Math.round(D.L - D.x0P)} mm · hoja de {D.L} mm · {D.n} {D.n === 1 ? 'tramo' : 'tramos'} por lámina{D.n > 1 ? `, uniones de A y B desfasadas ${Math.round(D.s)} mm` : ''} · filo en {D.ne} · {D.windows.length} ventanas · {D.plates.length} blindajes por cara · {nFiles} archivos, {nPieces} piezas.
          </div>
          <div style={{ display: 'grid', gap: 2 }}>
            {printed.map((s) => {
              const g = got[s.key]
              return (
                <div key={s.key} style={{ display: 'grid', gridTemplateColumns: '10px 1fr auto', gap: 8, alignItems: 'center', fontSize: 11.5, color: '#c8daf0', padding: '3px 0', borderBottom: '1px solid #ffffff0d' }}>
                  <i style={{ width: 10, height: 10, background: pal[s.group as keyof typeof pal] as string, display: 'block', border: '1px solid #ffffff30' }} />
                  <span>{s.name}{(s.print?.count ?? 1) > 1 && <b style={{ color: AMBER, fontWeight: 400 }}> ×{s.print?.count}</b>}</span>
                  <span style={{ color: !g ? FAINT : g.fits ? GREEN : RED }}>{g ? `${g.printMm[0]}×${g.printMm[1]}×${g.printMm[2]}` : '…'}</span>
                </div>
              )
            })}
          </div>
        </section>

        <section style={{ ...card, display: 'grid', gap: 8 }}>
          <H>VERIFICACIÓN</H>
          {!v && <div style={{ fontSize: 11.5, color: FAINT }}>{busy ? 'Calculando piezas y midiendo encajes…' : '—'}</div>}
          {v && <div style={{ fontSize: 10.5, lineHeight: 1.7, color: v.definitive ? GREEN : AMBER }}>{v.definitive ? `Medido sobre las mallas que se descargaron (resolución ${v.resolutionMm} mm; las caras planas quedan exactas).` : `Vista previa con malla de ${v.resolutionMm} mm: al descargar se vuelve a medir con una malla de 0,4 mm.`}</div>}
          {v && v.checks.map((c) => (
            <div key={c.name} style={{ fontSize: 11.5, lineHeight: 1.7, color: c.ok ? '#c8daf0' : RED }}>
              <span style={{ color: c.ok ? GREEN : RED }}>{c.ok ? '●' : '✕'}</span> <b style={{ fontWeight: 400, color: '#fff' }}>{c.name}</b> <span style={{ color: DIM }}>— {c.detail}</span>
            </div>
          ))}
          <button type="button" className="press" onClick={exportAll} disabled={!!busy} style={{ minHeight: 48, marginTop: 6, background: `linear-gradient(90deg,${CRIMSON},#ff9aa4)`, color: '#1a0206', border: 'none', fontFamily: mono, fontWeight: 700, fontSize: 12, letterSpacing: 1.5, cursor: busy ? 'default' : 'pointer', opacity: busy && !exporting ? 0.5 : 1 }}>
            {exporting ? `${busy}${prog[1] && prog[0] < prog[1] ? ` ${prog[0]}/${prog[1]}` : ''}` : 'DESCARGAR TODO (STL + JSON)'}
          </button>
          <p style={{ fontSize: 11, lineHeight: 1.8, color: FAINT, margin: 0 }}>
            El ZIP trae un STL por pieza, ya orientado para imprimir sin soportes y con su rótulo de armado grabado en la cara de corte, un JSON con medidas, holguras, colores, herrajes, orden de armado y esta verificación, y un LEEME.
          </p>
          {err && <div style={{ fontSize: 11.5, color: RED }}>{err}</div>}
        </section>
      </div>
      <style>{`@media (max-width: 900px) { .ar-grid { grid-template-columns: 1fr !important; } .ar-view { position: static !important; } }`}</style>
    </div>
  )
}

type Look = Record<string, { group: string; explode: [number, number, number] }>
function addToView(a: SwordViewerApi, p: PartMsg, look: Look) {
  const m = look[p.key]
  if (p.view && m) a.addPart({ key: p.key, group: m.group, explode: m.explode, view: p.view })
}

function readme(json: string): string {
  try {
    const j = JSON.parse(json)
    const L: string[] = ['NPX-02 VÉRTICE · NeoProxy Arsenal', '', j.aviso, '', `Largo total ${j.medidas.largoTotalMm} mm · hoja ${j.medidas.hojaMm} mm · holgura ${j.medidas.holguraMm} mm`, '', 'PIEZAS']
    for (const p of j.piezas) L.push(`  ${p.archivo}${p.copias > 1 ? ` (×${p.copias})` : ''} — ${p.nombre} · ${p.color} · ${p.nota}`)
    L.push('', 'HERRAJES')
    for (const h of j.materiales.herrajes) L.push(`  ${h.item}${h.cantidad ? ` × ${h.cantidad}` : ''}${h.largoMm ? `, ${h.largoMm} mm` : ''}`)
    L.push('', 'ARMADO')
    j.armado.forEach((a: string, i: number) => L.push(`  ${i + 1}. ${a}`))
    L.push('', `Verificación: ${j.verificacion?.ok ? 'todo encaja' : 'revisar'}`)
    for (const c of j.verificacion?.comprobaciones ?? []) L.push(`  ${c.ok ? '[ok]' : '[!!]'} ${c.name} — ${c.detail}`)
    return L.join('\n') + '\n'
  } catch { return 'NPX-02 VÉRTICE\n' }
}
