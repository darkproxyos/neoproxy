'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { KatanaCmd, KatanaMsg, PartOut } from '@/lib/katana/worker'
import type { Verification } from '@/lib/katana/build'
import { DEFAULTS, type KatanaOpts } from '@/lib/katana/model'
import { zipStore } from '@/lib/antesis/zip'
import type { KatanaViewerApi } from './KatanaViewer'

const KatanaViewer = dynamic(() => import('./KatanaViewer'), { ssr: false })

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff', AMBER = '#e0b070', GREEN = '#7cf0b0', RED = '#ff7a7a', DIM = '#8fa8c4', FAINT = '#6f86a3'
const card: React.CSSProperties = { background: '#080c12', border: '1px solid #ffffff12', padding: '14px 16px' }

function Chip({ on, onClick, children, color = CYAN }: { on: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return <button type="button" className="press" aria-pressed={on} onClick={onClick} style={{ minHeight: 36, padding: '0 11px', flexShrink: 0, whiteSpace: 'nowrap', fontFamily: mono, fontSize: 11, letterSpacing: 1.1, cursor: 'pointer', background: on ? `${color}22` : 'transparent', border: `1px solid ${on ? color : '#ffffff26'}`, color: on ? color : '#9fb4cc' }}>{children}</button>
}
function Slider({ label, unit, value, min, max, step, onChange }: { label: string; unit?: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, letterSpacing: 1.4, color: DIM }}><span>{label}</span><b style={{ color: '#fff', fontWeight: 400 }}>{value}{unit}</b></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: CYAN, minHeight: 28 }} />
    </label>
  )
}
const H = ({ children }: { children: React.ReactNode }) => <div style={{ fontSize: 11, letterSpacing: 3, color: `${CYAN}cc`, margin: '0 0 8px' }}>{children}</div>

const GROUPS: [string, string][] = [['hoja', 'HOJA'], ['abrazadera', 'ABRAZADERAS'], ['tsuba', 'TSUBA'], ['fuchi', 'FUCHI'], ['mango', 'MANGO'], ['kashira', 'REMATE'], ['menuki', 'SENSORES']]

export default function KatanaApp() {
  const [o, setO] = useState<KatanaOpts>({ ...DEFAULTS })
  const [parts, setParts] = useState<PartOut[]>([])
  const [info, setInfo] = useState<{ nagasa: number; sori: number; segmentos: number[]; mango: number; pocket: boolean; focus: Record<string, { c: [number, number, number]; r: number }> } | null>(null)
  const [v, setV] = useState<Verification | null>(null)
  const [busy, setBusy] = useState('GENERANDO…'), [err, setErr] = useState('')
  const [explode, setExplode] = useState(0), [glow, setGlow] = useState(true), [spin, setSpin] = useState(true)
  const [hidden, setHidden] = useState<string[]>([])
  const api = useRef<KatanaViewerApi | null>(null), worker = useRef<Worker | null>(null), req = useRef(0)
  const lastParts = useRef<PartOut[]>([]), optsRef = useRef(o)
  optsRef.current = o // eslint-disable-line react-hooks/refs -- espejo para el worker (se lee solo desde manejadores)

  const apply = useCallback((p: PartOut[], center: [number, number, number], radius: number) => {
    api.current?.setScene({ parts: p, center, radius })
  }, [])
  const onReady = useCallback((a: KatanaViewerApi | null) => { api.current = a; if (a && lastParts.current.length) a.setScene({ parts: lastParts.current, center: [0, 0, 0], radius: 300 }) }, [])

  useEffect(() => {
    const w = new Worker(new URL('../../lib/katana/worker.ts', import.meta.url), { type: 'module' })
    worker.current = w
    w.onmessage = (e: MessageEvent<KatanaMsg>) => {
      const m = e.data
      if (m.req !== req.current) return
      if (m.type === 'error') { setBusy(''); setErr(m.error); return }
      if (m.type === 'built') {
        lastParts.current = m.parts; setParts(m.parts); setInfo(m.info); setErr(''); setBusy('VERIFICANDO…')
        apply(m.parts, m.info.center, m.info.radius)
      } else if (m.type === 'verified') { setV(m.v); setBusy('') }
      else if (m.type === 'exported') {
        const zip = zipStore(m.files.map((f) => ({ name: f.name, data: new Uint8Array(f.data) })))
        const a = document.createElement('a'); a.href = URL.createObjectURL(zip); a.download = `katana-cyborg-${optsRef.current.nagasa}mm.zip`; a.click()
        setV(m.v); setBusy('')
      }
    }
    return () => { w.terminate(); worker.current = null }
  }, [apply])

  // reconstruir al cambiar las opciones (con una pausa para no recalcular a cada paso del control)
  useEffect(() => {
    const t = setTimeout(() => {
      const id = ++req.current
      setBusy('GENERANDO…')
      worker.current?.postMessage({ type: 'build', opts: o, req: id } satisfies KatanaCmd)
    }, 260)
    return () => clearTimeout(t)
  }, [o])
  useEffect(() => { api.current?.setExplode(explode) }, [explode, parts])
  useEffect(() => { api.current?.setGlow(glow) }, [glow, parts])
  useEffect(() => { api.current?.setSpin(spin) }, [spin])

  const set = <K extends keyof KatanaOpts>(k: K, val: KatanaOpts[K]) => setO((p) => ({ ...p, [k]: val }))
  const toggleGroup = (g: string) => {
    const on = hidden.includes(g)
    setHidden((h) => (on ? h.filter((x) => x !== g) : [...h, g]))
    for (const p of lastParts.current) if (p.key.startsWith(g)) api.current?.setVisible(p.key, on)
  }
  const exportAll = () => {
    const id = ++req.current
    setBusy('PREPARANDO STL EN ALTA RESOLUCIÓN…')
    worker.current?.postMessage({ type: 'export', opts: optsRef.current, req: id } satisfies KatanaCmd)
  }
  const exporting = busy.startsWith('PREPARANDO')

  return (
    <div className="kt-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(300px, 1fr)', gap: 18, alignItems: 'start' }}>
      <div className="kt-view" style={{ position: 'sticky', top: 84, display: 'grid', gap: 10 }}>
        <div style={{ position: 'relative', height: 'min(66vh, 640px)', minHeight: 320, background: 'radial-gradient(circle at 50% 38%, #0b1016 0%, #020408 75%)', border: '1px solid #ffffff14' }}>
          <KatanaViewer onReady={onReady} />
          <div style={{ position: 'absolute', left: 10, top: 10, fontSize: 10.5, letterSpacing: 1.6, color: busy ? AMBER : GREEN, background: 'rgba(3,6,10,.72)', padding: '5px 9px', border: '1px solid #ffffff1e' }} role="status">{busy ? `● ${busy}` : '● LISTO'}</div>
        </div>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, letterSpacing: 1.4, color: DIM }}><span>EXPLOSIÓN · cómo se arma</span><b style={{ color: '#fff', fontWeight: 400 }}>{Math.round(explode * 100)}%</b></span>
          <input type="range" min={0} max={1} step={0.01} value={explode} onChange={(e) => { const x = Number(e.target.value); setExplode(x); const f = info?.focus.todo; if (f) api.current?.focus(f.c, f.r * (1 + x * 0.9)) }} style={{ width: '100%', accentColor: CYAN, minHeight: 28 }} />
        </label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 10.5, letterSpacing: 1.5, color: FAINT }}>ENCUADRE</span>
          {([['todo', 'TODO'], ['punta', 'PUNTA'], ['tsuba', 'TSUBA'], ['mango', 'MANGO'], ['remate', 'REMATE']] as const).map(([k, l]) => <Chip key={k} on={false} onClick={() => { const f = info?.focus[k]; if (f) api.current?.focus(f.c, f.r) }}>{l}</Chip>)}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {GROUPS.map(([g, l]) => <Chip key={g} on={!hidden.includes(g)} onClick={() => toggleGroup(g)} color={AMBER}>{l}</Chip>)}
          <Chip on={glow} onClick={() => setGlow((x) => !x)} color={GREEN}>BRILLO</Chip>
          <Chip on={spin} onClick={() => setSpin((x) => !x)} color={GREEN}>GIRO</Chip>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        <section style={{ ...card, display: 'grid', gap: 12 }}>
          <H>HOJA</H>
          <Slider label="LARGO" unit=" mm" value={o.nagasa} min={300} max={900} step={10} onChange={(x) => set('nagasa', x)} />
          <Slider label="CURVATURA (SORI)" unit=" %" value={o.sori} min={0.8} max={3.6} step={0.1} onChange={(x) => set('sori', x)} />
          <Slider label="PUNTA (KISSAKI)" unit=" %" value={o.kissaki} min={5} max={11} step={0.5} onChange={(x) => set('kissaki', x)} />
          <div>
            <div style={{ fontSize: 11, letterSpacing: 1.4, color: DIM, marginBottom: 6 }}>HAMON · CANAL DE LUZ</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {([['circuito', 'CIRCUITO'], ['notare', 'NOTARE'], ['gunome', 'GUNOME'], ['ninguno', 'NINGUNO']] as const).map(([k, l]) => <Chip key={k} on={o.hamon === k} onClick={() => set('hamon', k)}>{l}</Chip>)}
            </div>
          </div>
          <Slider label="VENTILAS" value={o.ventilas} min={0} max={12} step={1} onChange={(x) => set('ventilas', x)} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><Chip on={o.aletas} onClick={() => set('aletas', !o.aletas)} color={AMBER}>ALETAS EN EL LOMO</Chip></div>
        </section>

        <section style={{ ...card, display: 'grid', gap: 12 }}>
          <H>GUARDA Y MANGO</H>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 1.4, color: DIM, marginBottom: 6 }}>TSUBA</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {([['engranaje', 'ENGRANAJE'], ['octogono', 'OCTÓGONO'], ['calado', 'CALADO']] as const).map(([k, l]) => <Chip key={k} on={o.tsuba === k} onClick={() => set('tsuba', k)}>{l}</Chip>)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 1.4, color: DIM, marginBottom: 6 }}>ENVOLTURA DEL MANGO</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {([['diamante', 'DIAMANTES'], ['anillos', 'ANILLOS']] as const).map(([k, l]) => <Chip key={k} on={o.mango === k} onClick={() => set('mango', k)}>{l}</Chip>)}
              <Chip on={o.electronica} onClick={() => set('electronica', !o.electronica)} color={AMBER}>HUECO PARA ELECTRÓNICA</Chip>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, letterSpacing: 1.4, color: DIM }}>SEMILLA</span>
            <b style={{ color: '#fff', fontWeight: 400, fontSize: 12 }}>{o.seed}</b>
            <Chip on={false} onClick={() => set('seed', Math.floor(Math.random() * 99999) + 1)}>↻ OTRA</Chip>
          </div>
        </section>

        <section style={{ ...card, display: 'grid', gap: 12 }}>
          <H>TU IMPRESORA</H>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Chip on={o.proc === 'fdm'} onClick={() => set('proc', 'fdm')}>FILAMENTO (FDM)</Chip>
            <Chip on={o.proc === 'resina'} onClick={() => set('proc', 'resina')}>RESINA</Chip>
          </div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 1.4, color: DIM, marginBottom: 6 }}>CAMA DE IMPRESIÓN (LADO)</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[160, 200, 220, 250, 300].map((b) => <Chip key={b} on={o.maxPieza === b} onClick={() => set('maxPieza', b)}>{b} mm</Chip>)}
            </div>
          </div>
          <p style={{ fontSize: 11, lineHeight: 1.8, color: FAINT, margin: 0 }}>
            Con una cama más chica, la hoja se corta en más segmentos y el mango se acorta. Las holguras de las uniones dependen del proceso ({o.proc === 'fdm' ? '0,25 mm' : '0,12 mm'}).
          </p>
        </section>

        <section style={{ ...card, display: 'grid', gap: 8 }}>
          <H>PIEZAS A IMPRIMIR</H>
          {info && <div style={{ fontSize: 11.5, color: DIM, lineHeight: 1.8 }}>Hoja de {info.nagasa} mm en {info.segmentos.length} {info.segmentos.length === 1 ? 'segmento' : 'segmentos'} ({info.segmentos.join(' + ')} mm), flecha del arco {info.sori} mm, mango de {info.mango} mm.</div>}
          <div style={{ display: 'grid', gap: 3 }}>
            {parts.map((p) => (
              <div key={p.key} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, fontSize: 11.5, color: '#c8daf0', padding: '4px 0', borderBottom: '1px solid #ffffff0d' }}>
                <span>{p.name} <b style={{ color: AMBER, fontWeight: 400 }}>×{p.count}</b></span>
                <span style={{ color: p.fits ? GREEN : RED }}>{p.printMm[0]}×{p.printMm[1]}×{p.printMm[2]}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...card, display: 'grid', gap: 8 }}>
          <H>VERIFICACIÓN</H>
          {!v && <div style={{ fontSize: 11.5, color: FAINT }}>Midiendo piezas y holguras…</div>}
          {v && <div style={{ fontSize: 10.5, lineHeight: 1.7, color: v.definitive ? GREEN : AMBER }}>{v.definitive ? `Medido al descargar, con malla de ${v.resolutionMm} mm (las holguras tienen una incertidumbre de ±${(v.resolutionMm / 2).toFixed(2)} mm).` : `Vista previa con malla de ${v.resolutionMm} mm: las holguras se confirman al descargar, con una malla más fina.`}</div>}
          {v && v.checks.map((c) => (
            <div key={c.name} style={{ fontSize: 11.5, lineHeight: 1.7, color: c.ok ? '#c8daf0' : RED }}>
              <span style={{ color: c.ok ? GREEN : RED }}>{c.ok ? '●' : '✕'}</span> <b style={{ fontWeight: 400, color: '#fff' }}>{c.name}</b> <span style={{ color: DIM }}>— {c.detail}</span>
            </div>
          ))}
          <button type="button" className="press" onClick={exportAll} disabled={!parts.length || (!!busy && !exporting)} style={{ minHeight: 48, marginTop: 6, background: `linear-gradient(90deg,${CYAN},#9fe8ff)`, color: '#021018', border: 'none', fontFamily: mono, fontWeight: 700, fontSize: 12, letterSpacing: 1.5, cursor: 'pointer', opacity: parts.length && (!busy || exporting) ? 1 : 0.5 }}>
            {exporting ? busy : 'DESCARGAR TODO (STL + JSON)'}
          </button>
          <p style={{ fontSize: 11, lineHeight: 1.8, color: FAINT, margin: 0 }}>
            El ZIP trae un STL por pieza, ya orientado para imprimir sin soportes (las piezas partidas en dos vienen como mitad A y mitad B, que es su espejo), y un JSON con medidas, holguras, materiales, orden de armado y esta verificación.
          </p>
          {err && <div style={{ fontSize: 11.5, color: RED }}>{err}</div>}
        </section>
      </div>
      <style>{`@media (max-width: 900px) { .kt-grid { grid-template-columns: 1fr !important; } .kt-view { position: static !important; } }`}</style>
    </div>
  )
}
