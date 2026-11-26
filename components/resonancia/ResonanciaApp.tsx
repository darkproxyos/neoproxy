'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { DRIVES, resonances, hz, lambdaOf, MODE_LIST, PLATE, type Drive } from '@/lib/resonancia/plate'
import type { ResCmd, ResMsg } from '@/lib/resonancia/worker'
import type { Metrics } from '@/lib/specimens/analyze'
import type { ResViewerApi, ResMode } from './ResonanciaViewer'

const ResonanciaViewer = dynamic(() => import('./ResonanciaViewer'), { ssr: false })
const mono = "'Space Mono', monospace"
const WA = '56993550010'
const ACCENT = '#7cf0d0'
const F_MIN = 50, F_MAX = 1750
const fmt = (n: number, d = 1) => n.toFixed(d).replace('.', ',')
const NOTES = ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si']
export const noteName = (f: number) => { const m = Math.round(12 * Math.log2(f / 440) + 69); return `${NOTES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}` }
const GRAINS = typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent) ? 22000 : 34000

function Chip({ on, onClick, children, title, color = '#9fe8ff', disabled }: { on: boolean; onClick: () => void; children: React.ReactNode; title?: string; color?: string; disabled?: boolean }) {
  return <button type="button" className="press" title={title} disabled={disabled} onClick={onClick} style={{ minHeight: 38, padding: '0 14px', fontFamily: mono, fontSize: 11.5, letterSpacing: 1.6, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.45 : 1, background: on ? `${color}22` : 'rgba(2,4,8,0.7)', borderStyle: 'solid', borderWidth: 1, borderColor: on ? color : '#ffffff26', color: on ? color : '#9fb4cc' }}>{children}</button>
}
function Stat({ k, v, warn, title }: { k: string; v: string; warn?: boolean; title?: string }) {
  return <div title={title} style={{ padding: '10px 12px', background: '#080c12', border: '1px solid #ffffff10' }}><div style={{ fontSize: 11, letterSpacing: 1.6, color: '#7f96b2', marginBottom: 5 }}>{k}</div><div style={{ fontSize: 14, color: warn ? '#ffb86b' : '#fff' }}>{v}</div></div>
}

type Piece = { kind: 'placa' | 'columna'; info: Record<string, unknown>; ms: number; hash: string }
type Reel = { phase: 'titulo' | 'nota' | 'placa' | 'columna' | 'fin'; i?: number }

// sonido: una senoidal (y un poco de su octava) a la frecuencia de la placa
class Tone {
  ctx: AudioContext; osc: OscillatorNode; osc2: OscillatorNode; g: GainNode
  constructor(f: number) {
    this.ctx = new AudioContext(); this.g = this.ctx.createGain(); this.g.gain.value = 0; this.g.connect(this.ctx.destination)
    this.osc = this.ctx.createOscillator(); this.osc.type = 'sine'; this.osc.frequency.value = f; this.osc.connect(this.g)
    const g2 = this.ctx.createGain(); g2.gain.value = 0.12; this.osc2 = this.ctx.createOscillator(); this.osc2.frequency.value = 2 * f; this.osc2.connect(g2); g2.connect(this.g)
    this.osc.start(); this.osc2.start(); this.g.gain.setTargetAtTime(0.16, this.ctx.currentTime, 0.08)
  }
  set(f: number) { const t = this.ctx.currentTime; this.osc.frequency.setTargetAtTime(f, t, 0.03); this.osc2.frequency.setTargetAtTime(2 * f, t, 0.03) }
  stop() { this.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.06); setTimeout(() => this.ctx.close(), 400) }
}

export default function ResonanciaApp() {
  const workerRef = useRef<Worker | null>(null)
  const viewerRef = useRef<ResViewerApi | null>(null)
  const [drive, setDriveS] = useState<Drive>('centro')
  const driveRef = useRef<Drive>('centro')
  const [f, setF] = useState(() => hz(resonances('centro')[1].lambda))
  const fRef = useRef(f)
  const [mode, setModeS] = useState<ResMode>('arena')
  const modeRef = useRef<ResMode>('arena')
  const [sound, setSound] = useState(false)
  const toneRef = useRef<Tone | null>(null)
  const [vib, setVib] = useState(false)
  const [nodes, setNodes] = useState(0)
  const [seed, setSeed] = useState(1)
  const [rim, setRim] = useState(true)
  const [colA, setColA] = useState(1), [colB, setColB] = useState(3)
  const [piece, setPiece] = useState<Piece | null>(null)
  const [busy, setBusy] = useState(''), [err, setErr] = useState('')
  const [palette, setPalette] = useState<'color' | 'resina'>('color')
  const [tour, setTour] = useState(false)
  const [reel, setReel] = useState<Reel | null>(null)
  const [copied, setCopied] = useState(false)
  const st = useRef({ req: 0, raf: 0, timers: [] as number[], pieceRaw: null as null | Extract<ResMsg, { type: 'piece' }>, wantStl: false, pieceKey: '', field: null as null | { G: number; re: Float32Array } })
  const res = resonances(drive)
  const cfg = useRef({ seed, rim, colA, colB }); cfg.current = { seed, rim, colA, colB }
  const resRef = useRef(res); resRef.current = res

  const send = (c: ResCmd) => workerRef.current?.postMessage(c)
  const clearTimers = () => { st.current.timers.forEach((t) => clearTimeout(t)); st.current.timers = []; cancelAnimationFrame(st.current.raf) }
  const later = (ms: number, fn: () => void) => { st.current.timers.push(window.setTimeout(fn, ms)) }

  const tune = useCallback((hzv: number) => {
    fRef.current = hzv; setF(hzv)
    send({ type: 'tune', lambda: lambdaOf(hzv), drive: driveRef.current })
    toneRef.current?.set(hzv)
  }, [])
  // deslizamiento en escala logarítmica, como un dedo en el oscilador
  const glide = useCallback((to: number, ms = 900) => {
    cancelAnimationFrame(st.current.raf)
    const from = fRef.current, t0 = performance.now()
    const stepf = () => {
      const u = Math.min(1, (performance.now() - t0) / ms), e = u * u * (3 - 2 * u)
      tune(from * Math.pow(to / from, e))
      if (u < 1) st.current.raf = requestAnimationFrame(stepf)
    }
    st.current.raf = requestAnimationFrame(stepf)
  }, [tune])

  const setMode = (m: ResMode) => { modeRef.current = m; setModeS(m); viewerRef.current?.setMode(m) }
  const pieceKey = (kind: 'placa' | 'columna') => { const c = cfg.current; return kind === 'placa' ? `p|${driveRef.current}|${fRef.current.toFixed(2)}|${c.seed}|${c.rim}` : `c|${driveRef.current}|${c.colA}|${c.colB}` }
  const requestPiece = (kind: 'placa' | 'columna', stl = false) => {
    st.current.wantStl = stl
    setBusy(stl ? 'CALCULANDO STL…' : kind === 'placa' ? 'ASENTANDO LA ARENA…' : 'APILANDO EL BARRIDO…')
    const r = resRef.current, c = cfg.current
    // la nota se redondea igual que en el enlace (3 decimales): el enlace reconstruye la misma pieza
    if (kind === 'placa') send({ type: 'relief', req: ++st.current.req, lambda: lambdaOf(+fRef.current.toFixed(3)), drive: driveRef.current, seed: c.seed, ticks: 1500, opts: { G: stl ? 240 : 170, sizeMm: 100, baseMm: 2.4, reliefMm: 1.8, rim: c.rim }, stl })
    else {
      const a = r[Math.min(c.colA, c.colB, r.length - 1)], b = r[Math.min(Math.max(c.colA, c.colB), r.length - 1)]
      send({ type: 'column', req: ++st.current.req, drive: driveRef.current, opts: { N: stl ? 150 : 100, sizeMm: 90, lambdaA: a.lambda * 0.995, lambdaB: b.lambda * 1.005, band: 0.07, aspect: 1.5 }, stl })
    }
  }
  const goMode = (m: ResMode) => {
    setMode(m)
    if (m !== 'arena' && st.current.pieceKey !== pieceKey(m)) requestPiece(m)
  }

  useEffect(() => {
    const w = new Worker(new URL('../../lib/resonancia/worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = w
    w.onmessage = (e: MessageEvent<ResMsg>) => {
      const m = e.data, v = viewerRef.current
      if (m.type === 'field') { st.current.field = { G: m.G, re: m.re }; v?.setField(m.G, m.re); return }
      if (m.type === 'sand') { v?.setSand(m.x, m.y); if (m.nodes >= 0) setNodes(m.nodes); return }
      if (m.type === 'error') { setBusy(''); setErr(m.error); return }
      if (m.type === 'piece') {
        setBusy('')
        if (st.current.wantStl && m.stl) {
          const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([m.stl], { type: 'model/stl' })); a.download = `resonancia-${m.kind}-${Math.round(fRef.current)}hz.stl`
          document.body.appendChild(a); a.click(); a.remove(); st.current.wantStl = false; return
        }
        st.current.pieceRaw = m; st.current.pieceKey = pieceKey(m.kind)
        // huella de la geometría (para comprobar que un enlace reconstruye la misma pieza)
        let h = 2166136261; const pb = new Uint8Array(m.positions.buffer); for (let i = 0; i < pb.length; i += 7) { h ^= pb[i]; h = Math.imul(h, 16777619) >>> 0 }
        setPiece({ kind: m.kind, info: m.info, ms: m.ms, hash: h.toString(16).padStart(8, '0') })
        v?.setPiece(m.kind, m.positions, m.indices, paletteRef.current)
      }
    }
    // enlace: #r=drive,hz,seed,modo,colA,colB,marco
    const mm = window.location.hash.match(/^#r=(centro|borde|esquina),([\d.]+),(\d+),(arena|placa|columna),(\d+),(\d+),([01])$/)
    let startF = fRef.current, startMode: ResMode = 'arena'
    if (mm) {
      driveRef.current = mm[1] as Drive; setDriveS(mm[1] as Drive)
      startF = Math.min(F_MAX, Math.max(F_MIN, +mm[2])); setSeed(+mm[3]); startMode = mm[4] as ResMode
      setColA(+mm[5]); setColB(+mm[6]); setRim(mm[7] === '1')
      cfg.current = { seed: +mm[3], colA: +mm[5], colB: +mm[6], rim: mm[7] === '1' }
    }
    send({ type: 'init', grains: GRAINS, seed: mm ? +mm[3] : 1 })
    tune(startF)
    if (startMode !== 'arena') later(300, () => goMode(startMode))
    return () => { clearTimers(); toneRef.current?.stop(); w.terminate(); workerRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const paletteRef = useRef(palette); paletteRef.current = palette
  useEffect(() => { const r = st.current.pieceRaw; if (r) viewerRef.current?.setPiece(r.kind, r.positions, r.indices, palette) }, [palette])
  const vibRef = useRef(vib); vibRef.current = vib
  useEffect(() => { viewerRef.current?.setVibration(vib) }, [vib])
  useEffect(() => { const d = DRIVES[drive]; viewerRef.current?.setDrive(d.x, d.y) }, [drive])
  const onViewer = useCallback((api: ResViewerApi | null) => {
    viewerRef.current = api
    if (!api) return
    const d = DRIVES[driveRef.current]; api.setDrive(d.x, d.y)
    // lo que llegó del worker antes de que el visor existiera
    const fl = st.current.field; if (fl) api.setField(fl.G, fl.re)
    api.setVibration(vibRef.current)
  }, [])

  const toggleSound = () => {
    if (toneRef.current) { toneRef.current.stop(); toneRef.current = null; setSound(false) }
    else { toneRef.current = new Tone(fRef.current); setSound(true) }
  }
  const pickDrive = (d: Drive) => {
    driveRef.current = d; setDriveS(d)
    const r = resonances(d); setColA(1); setColB(Math.min(3, r.length - 1)); cfg.current = { ...cfg.current, colA: 1, colB: Math.min(3, r.length - 1) }
    tune(fRef.current)
  }
  const startTour = () => {
    if (tour) { clearTimers(); setTour(false); return }
    clearTimers(); setTour(true); setMode('arena')
    const r = resRef.current
    const step = (i: number) => { glide(r[i % r.length].hz * 1.0005, 1000); later(4600, () => step(i + 1)) }
    const cur = r.findIndex((x) => x.hz > fRef.current * 1.01)
    step(cur < 0 ? 0 : cur)
  }

  const link = () => { const c = cfg.current; return `${window.location.origin}/resonancia#r=${driveRef.current},${fRef.current.toFixed(3)},${c.seed},${modeRef.current},${c.colA},${c.colB},${c.rim ? 1 : 0}` }
  const share = async () => { const l = link(); try { await navigator.clipboard.writeText(l); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { window.prompt('Copia el enlace:', l) } }
  const waHref = () => `https://wa.me/${WA}?text=${encodeURIComponent(`Hola, quiero la pieza RESONANCIA (${mode === 'columna' ? 'columna' : 'placa'}, ${Math.round(fRef.current)} Hz) impresa en resina. Receta: ${link()}`)}`
  const exportJson = () => {
    if (!piece) return
    const r = resRef.current, near = nearest()
    const doc = {
      pieza: `RESONANCIA — ${piece.kind}`, enlace: link(),
      placa_de_referencia: { material: 'acero', lado_m: PLATE.side, espesor_m: PLATE.h, bordes: 'libres', empuje: DRIVES[driveRef.current].label.toLowerCase() },
      nota: piece.kind === 'placa' ? { hz: +fRef.current.toFixed(2), nota: noteName(fRef.current), modo_cercano: near.k + 1, lambda: near.lambda, semilla_arena: cfg.current.seed, saltos: 1500 } : { desde_hz: +r[Math.min(cfg.current.colA, cfg.current.colB)].hz.toFixed(1), hasta_hz: +r[Math.max(cfg.current.colA, cfg.current.colB)].hz.toFixed(1), banda_nodal: 0.07 },
      medidas: { ...piece.info, huella: piece.hash },
      impresion_sugerida: { tecnologia: 'resina (SLA/MSLA)', capa_um: 50, orientacion: piece.kind === 'placa' ? 'plana, el relieve hacia arriba' : 'de pie, la base en la plataforma', soportes: piece.kind === 'placa' ? 'no' : 'pocos o ninguno', advertencia: 'Sin pruebas de impresión real todavía: validar con una pieza de ensayo antes de producir.' },
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })); a.download = `resonancia-${piece.kind}.json`
    document.body.appendChild(a); a.click(); a.remove()
  }
  const nearest = () => { let best = MODE_LIST[0] && { k: 0, lambda: MODE_LIST[0].lambda }; const l = lambdaOf(fRef.current); MODE_LIST.forEach((m, k) => { if (Math.abs(m.lambda - l) < Math.abs(best.lambda - l)) best = { k, lambda: m.lambda } }); return best }

  // ---- modo reel ----
  const reelClass = (on: boolean) => document.documentElement.classList.toggle('rs-reel-on', on)
  useEffect(() => () => { reelClass(false) }, [])
  const enterReel = () => {
    clearTimers(); setTour(false); reelClass(true)
    const v = viewerRef.current; if (!v) return
    const r = resRef.current, picks = [1, 2, 3, 5].filter((i) => i < r.length)
    v.setFraming(1.0, 0.04); setMode('arena'); setReel({ phase: 'titulo' })
    tune(F_MIN * 1.6); send({ type: 'scatter', seed: 7 })
    let t = 2600
    picks.forEach((i, j) => { later(t, () => { setReel({ phase: 'nota', i }); glide(r[i].hz * 1.0005, 900) }); t += j === 0 ? 4800 : 4200 })
    later(t, () => { setReel({ phase: 'placa' }); goMode('placa') }); t += 5600
    later(t, () => { setReel({ phase: 'columna' }); setColA(picks[0]); setColB(picks[picks.length - 1]); cfg.current = { ...cfg.current, colA: picks[0], colB: picks[picks.length - 1] }; st.current.pieceKey = ''; goMode('columna') }); t += 6500
    later(t, () => setReel({ phase: 'fin' }))
  }
  const exitReel = () => { clearTimers(); reelClass(false); setReel(null); viewerRef.current?.setFraming(1, 0); setMode('arena') }
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') exitReel() }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const near = nearest()
  const onRes = res.find((x) => Math.abs(x.hz - f) / f < 0.01)
  const sl = Math.log(f / F_MIN) / Math.log(F_MAX / F_MIN)
  const m = piece?.kind === 'columna' ? (piece.info.metrics as Metrics) : null

  return (
    <div>
      <div className={reel ? 'rs-reel' : ''} data-phase={reel?.phase} style={reel ? { position: 'fixed', inset: 0, zIndex: 400, background: '#000', display: 'grid', placeItems: 'center' } : {}}>
        <div style={reel ? { position: 'relative', height: 'min(100vh, 100vw * 16 / 9)', aspectRatio: '9 / 16', background: '#020308', overflow: 'hidden' } : { position: 'relative', height: 'min(76vh, 720px)', minHeight: 430, background: '#020308', border: '1px solid #ffffff14' }}>
          <ResonanciaViewer onReady={onViewer} />
          {!reel && (
            <>
              <div style={{ position: 'absolute', left: 14, top: 12, pointerEvents: 'none', textShadow: '0 1px 4px #000' }}>
                <div style={{ fontSize: 30, color: '#fff', letterSpacing: 2, lineHeight: 1 }}>{fmt(f, f < 100 ? 1 : 0)} <span style={{ fontSize: 13, color: ACCENT }}>Hz</span></div>
                <div style={{ fontSize: 11, letterSpacing: 1.8, color: '#cfe0f2', marginTop: 6 }}>{noteName(f)} · {onRes ? `RESONANCIA · MODO ${onRes.k + 1}` : `cerca del modo ${near.k + 1}`}</div>
                <div style={{ fontSize: 11, letterSpacing: 1.5, color: '#7f96b2', marginTop: 3 }}>arena en las líneas quietas: {Math.round(100 * nodes)} %</div>
                {busy && <div style={{ fontSize: 11, color: '#ffd27c', marginTop: 3 }}>{busy}</div>}
              </div>
              <div style={{ position: 'absolute', right: 10, top: 10, display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '60%' }}>
                <Chip on={sound} onClick={toggleSound} color={ACCENT} title="Escucha la frecuencia (la de una placa de acero de 24 cm y 1 mm)">{sound ? '♪ SONIDO' : '♪ SIN SONIDO'}</Chip>
                <Chip on={vib} onClick={() => setVib((x) => !x)} title="Colorea la placa según cómo vibra: cian y magenta se mueven en sentidos opuestos">VIBRACIÓN</Chip>
                {mode !== 'arena' && <Chip on={palette === 'resina'} onClick={() => setPalette((x) => (x === 'resina' ? 'color' : 'resina'))}>RESINA</Chip>}
              </div>
            </>
          )}
          {reel && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', fontFamily: mono }}>
              <div style={{ position: 'absolute', top: '8%', left: 0, right: 0, padding: '0 6%', textAlign: 'center', opacity: reel.phase === 'titulo' ? 1 : 0, transition: 'opacity 1.1s' }}>
                <div style={{ fontSize: 'clamp(10px, 1.6vh, 15px)', letterSpacing: 5, color: ACCENT }}>NEO·PROXY // SONIDO</div>
                <div style={{ fontSize: 'clamp(26px, 5.6vh, 60px)', letterSpacing: 7, color: '#fff', fontWeight: 700, textShadow: '0 0 30px #7cf0d088', marginTop: 6 }}>RESONANCIA</div>
                <div style={{ fontSize: 'clamp(11px, min(1.9vh, 3.8vw), 18px)', color: '#cfe6ff', marginTop: 8 }}>arena sobre una placa de acero que vibra</div>
              </div>
              <div style={{ position: 'absolute', top: '6%', left: 0, right: 0, textAlign: 'center', opacity: reel.phase === 'nota' ? 1 : 0, transition: 'opacity .6s', textShadow: '0 2px 10px #000' }}>
                <div style={{ fontSize: 'clamp(34px, 7.5vh, 80px)', color: '#fff', fontWeight: 700, letterSpacing: 2 }}>{Math.round(f)} <span style={{ fontSize: '0.45em', color: ACCENT }}>Hz</span></div>
                <div style={{ fontSize: 'clamp(11px, 1.8vh, 17px)', color: '#cfe6ff', letterSpacing: 3, marginTop: 4 }}>{noteName(f)}</div>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '56px 7% 5.5vh', textAlign: 'center', textShadow: '0 1px 6px #000', background: 'linear-gradient(transparent, #000000b0)', opacity: reel.phase === 'titulo' || reel.phase === 'fin' ? 0 : 1, transition: 'opacity .8s' }}>
                <div style={{ fontSize: 'clamp(13px, min(2.5vh, 4.8vw), 24px)', color: '#fff', fontWeight: 700, letterSpacing: 1.5, lineHeight: 1.45 }}>
                  {reel.phase === 'nota' && 'Cada nota dibuja una figura. La arena se junta donde la placa no se mueve.'}
                  {reel.phase === 'placa' && '◆ La figura, congelada en relieve.'}
                  {reel.phase === 'columna' && '▥ Y el barrido entero, apilado: una columna de sonido.'}
                </div>
              </div>
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: reel.phase === 'fin' ? 1 : 0, transition: 'opacity 1s', background: reel.phase === 'fin' ? '#000c' : 'transparent' }}>
                <div style={{ textAlign: 'center', padding: '0 8%' }}>
                  <div style={{ fontSize: 'clamp(26px, 5.6vh, 60px)', letterSpacing: 7, color: '#fff', fontWeight: 700 }}>RESONANCIA</div>
                  <div style={{ fontSize: 'clamp(12px, min(2.2vh, 4.2vw), 22px)', color: '#cfe6ff', margin: '14px 0' }}>El sonido de una placa, convertido en pieza.</div>
                  <div style={{ fontSize: 'clamp(12px, 2.2vh, 22px)', color: ACCENT, letterSpacing: 2 }}>neoproxy.art/resonancia</div>
                </div>
              </div>
              {!sound && reel.phase === 'titulo' && <div style={{ position: 'absolute', top: '30%', left: 0, right: 0, textAlign: 'center', fontSize: 12, color: '#ffd27c', letterSpacing: 1.5 }}>sin sonido: actívalo antes de grabar (♪)</div>}
              <button type="button" onClick={exitReel} style={{ position: 'absolute', top: 10, right: 10, pointerEvents: 'auto', opacity: reel.phase === 'titulo' ? 1 : 0.3, fontFamily: mono, fontSize: 12, letterSpacing: 2, padding: '8px 12px', background: '#000a', color: '#9fb4cc', border: '1px solid #ffffff30', cursor: 'pointer' }}>SALIR ✕</button>
            </div>
          )}
        </div>
      </div>

      {/* frecuencia */}
      <div style={{ margin: '14px 0 10px' }}>
        <input type="range" className="rs-range" aria-label="Frecuencia" min={0} max={1} step={0.0005} value={sl} onChange={(e) => { clearTimers(); setTour(false); tune(F_MIN * Math.pow(F_MAX / F_MIN, Number(e.target.value))) }} style={{ width: '100%' }} />
        <div style={{ position: 'relative', height: 30, marginTop: 4 }}>
          {res.map((r) => { const u = Math.log(r.hz / F_MIN) / Math.log(F_MAX / F_MIN); if (u < 0 || u > 1) return null; const on = Math.abs(r.hz - f) / f < 0.01
            return <button key={r.k} type="button" onClick={() => { clearTimers(); setTour(false); setMode('arena'); glide(r.hz * 1.0005) }} title={`Modo ${r.k + 1}: ${fmt(r.hz, 1)} Hz (${noteName(r.hz)})`} style={{ position: 'absolute', left: `calc(${(u * 100).toFixed(2)}% - 13px)`, top: 0, width: 26, height: 26, padding: 0, fontFamily: mono, fontSize: 10, cursor: 'pointer', background: on ? ACCENT : '#0b1118', color: on ? '#02060a' : '#9fb4cc', border: `1px solid ${on ? ACCENT : '#ffffff30'}`, borderRadius: '50%' }}>{r.k + 1}</button> })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6f86a3', letterSpacing: 1 }}><span>{F_MIN} Hz</span><span>los círculos son las resonancias que se oyen desde este punto de empuje</span><span>{F_MAX} Hz</span></div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', margin: '6px 0 16px' }}>
        {(['arena', 'placa', 'columna'] as ResMode[]).map((x) => (
          <button key={x} type="button" className="press" onClick={() => { clearTimers(); setTour(false); goMode(x) }}
            style={{ minHeight: 46, padding: '0 20px', fontFamily: mono, fontWeight: 700, fontSize: 12.5, letterSpacing: 2.5, cursor: 'pointer', border: 'none', background: mode === x ? 'linear-gradient(90deg,#7cf0d0,#9fb8ff)' : '#0b111a', color: mode === x ? '#04060a' : '#9fb4cc' }}>
            {x === 'arena' ? '◌ ARENA' : x === 'placa' ? '◆ PLACA' : '▥ COLUMNA'}
          </button>
        ))}
        <Chip on={tour} onClick={startTour} color={ACCENT} title="Recorre las resonancias una por una">{tour ? '■ DETENER' : '▶ RECORRIDO'}</Chip>
        <Chip on={false} onClick={() => { const s = seed + 1; setSeed(s); cfg.current = { ...cfg.current, seed: s }; send({ type: 'scatter', seed: s }) }} title="Esparce arena nueva sobre la placa">⟳ ARENA NUEVA</Chip>
        <span style={{ flex: 1 }} />
        <Chip on={!!reel} onClick={enterReel} color="#ffd27c" title="Pantalla vertical que corre sola: para grabarla con el teléfono (activa el sonido antes)">▣ MODO REEL</Chip>
      </div>
      {err && <p style={{ color: '#ffb86b', fontSize: 12 }}>{err}</p>}

      <div className="rs-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 22 }}>
        <section style={{ background: '#080c12', borderStyle: 'solid', borderWidth: '1px 1px 1px 3px', borderColor: `${ACCENT}2a ${ACCENT}2a ${ACCENT}2a ${ACCENT}`, padding: '18px 20px' }}>
          <div style={{ fontSize: 11.5, letterSpacing: 3, color: ACCENT, marginBottom: 10 }}>DÓNDE EMPUJA EL PARLANTE</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {(Object.keys(DRIVES) as Drive[]).map((d) => <Chip key={d} on={drive === d} color={ACCENT} onClick={() => pickDrive(d)}>{DRIVES[d].label}</Chip>)}
          </div>
          <p style={{ fontSize: 11.5, lineHeight: 1.9, color: '#8fa8c4', margin: '0 0 12px' }}>
            Empujada en el centro, la placa solo puede sonar con los modos que mueven el centro: {resonances('centro').length} resonancias bajo {F_MAX} Hz. Desde el borde o en diagonal despiertan otras ({resonances('borde').length} y {resonances('esquina').length}). Un modo con una línea quieta justo en el punto de empuje no se oye: el parlante empuja donde la placa no quiere moverse.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
            <Stat k="FRECUENCIA" v={`${fmt(f, 1)} Hz`} />
            <Stat k="NOTA" v={noteName(f)} />
            <Stat k="MODO MÁS CERCANO" v={`${near.k + 1} · λ ${fmt(near.lambda, 2)}`} title="λ = ω a² √(ρh/D): la frecuencia sin unidades, la que se compara con las tablas" />
            <Stat k="ARENA EN NODOS" v={`${Math.round(100 * nodes)} %`} />
          </div>
        </section>
        <section style={{ background: '#080c12', border: '1px solid #ffffff12', padding: '18px 20px', display: 'grid', gap: 14, alignContent: 'start' }}>
          <div style={{ fontSize: 11.5, letterSpacing: 3, color: '#9fe8ff' }}>LAS PIEZAS</div>
          <div style={{ fontSize: 11.5, lineHeight: 1.85, color: '#8fa8c4' }}>
            <b style={{ color: '#fff' }}>◆ PLACA</b> — baldosa de 100 mm con la arena en relieve. Se calcula con arena nueva asentada 1500 saltos en la nota actual, así el enlace la reproduce.
          </div>
          <Chip on={rim} onClick={() => { cfg.current = { ...cfg.current, rim: !rim }; setRim(!rim); st.current.pieceKey = ''; if (modeRef.current === 'placa') requestPiece('placa') }}>MARCO</Chip>
          <div style={{ fontSize: 11.5, lineHeight: 1.85, color: '#8fa8c4', borderTop: '1px solid #ffffff12', paddingTop: 12 }}>
            <b style={{ color: '#fff' }}>▥ COLUMNA</b> — un barrido de frecuencia apilado en altura: cada capa es la línea quieta a esa frecuencia. Elige el tramo:
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 11, color: '#8fa8c4' }}>
            DESDE
            <select value={colA} onChange={(e) => { setColA(+e.target.value); cfg.current = { ...cfg.current, colA: +e.target.value }; st.current.pieceKey = '' }} style={{ background: '#05080d', color: '#fff', border: '1px solid #ffffff30', fontFamily: mono, fontSize: 12, padding: '6px' }}>{res.map((r, i) => <option key={r.k} value={i}>{Math.round(r.hz)} Hz</option>)}</select>
            HASTA
            <select value={colB} onChange={(e) => { setColB(+e.target.value); cfg.current = { ...cfg.current, colB: +e.target.value }; st.current.pieceKey = '' }} style={{ background: '#05080d', color: '#fff', border: '1px solid #ffffff30', fontFamily: mono, fontSize: 12, padding: '6px' }}>{res.map((r, i) => <option key={r.k} value={i}>{Math.round(r.hz)} Hz</option>)}</select>
            <Chip on={false} onClick={() => goMode('columna')}>APILAR</Chip>
          </div>
        </section>
      </div>

      <section style={{ marginTop: 22 }}>
        <div data-piece-hash={piece?.hash} style={{ fontSize: 11.5, letterSpacing: 3, color: '#9fe8ff', marginBottom: 10 }}>MEDIDAS{piece ? ` · ${piece.kind.toUpperCase()} · huella ${piece.hash}` : ' · ABRE ◆ PLACA O ▥ COLUMNA'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: 8 }}>
          {piece?.kind === 'placa' && <>
            <Stat k="MEDIDAS" v={`${piece.info.sizeMm} × ${piece.info.sizeMm} × ${fmt(piece.info.heightMm as number, 1)} mm`} />
            <Stat k="TRIÁNGULOS" v={(piece.info.tris as number).toLocaleString('es-CL')} />
            <Stat k="CERRADA" v={piece.info.closed ? 'sí' : 'no'} warn={!piece.info.closed} />
            <Stat k="GRANOS" v={(piece.info.grains as number).toLocaleString('es-CL')} />
            <Stat k="ARENA EN NODOS" v={`${Math.round(100 * (piece.info.nodes as number))} %`} />
            <Stat k="IMPRESIÓN" v="plana, sin soportes" />
          </>}
          {m && <>
            <Stat k="MEDIDAS" v={`${fmt(piece!.info.widthMm as number, 0)} × ${fmt(piece!.info.heightMm as number, 0)} mm`} />
            <Stat k="TRIÁNGULOS" v={m.tris.toLocaleString('es-CL')} />
            <Stat k="PIEZAS" v={String(m.components)} warn={m.components > 1} />
            <Stat k="VOLADIZO" v={`${fmt(100 * m.overhangFrac, 0)} %`} warn={m.overhangFrac > 0.15} />
            <Stat k="PARED MÍNIMA (P10)" v={`${fmt(m.wallP10Mm, 2)} mm`} warn={m.wallP10Mm < 1} />
            <Stat k="PUNTAJE DE IMPRESIÓN" v={fmt(m.printScore, 2)} warn={m.printScore < 0.5} />
          </>}
          {!piece && <Stat k="—" v="…" />}
        </div>
        {m && m.components > 1 && <p style={{ fontSize: 11.5, color: '#ffb86b', margin: '10px 0 0' }}>El STL omite {m.components - 1} partes sueltas ({fmt(100 * m.droppedVolumeFrac, 1)} % del volumen).</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8, marginTop: 14 }}>
          <button className="press" onClick={() => piece && requestPiece(piece.kind, true)} disabled={!piece || !!busy} style={{ minHeight: 46, background: ACCENT, color: '#02060a', border: 'none', fontFamily: mono, fontWeight: 700, fontSize: 12, letterSpacing: 1.5, cursor: 'pointer', opacity: piece ? 1 : 0.45 }}>{busy.startsWith('CALCULANDO') ? busy : 'DESCARGAR STL'}</button>
          <button className="press" onClick={exportJson} disabled={!piece} style={{ minHeight: 46, background: 'transparent', border: '1px solid #4a6080', color: '#9fb4cc', fontFamily: mono, fontSize: 11.5, letterSpacing: 1.5, cursor: 'pointer', opacity: piece ? 1 : 0.45 }}>RECETA + FICHA (JSON)</button>
          <button className="press" onClick={share} style={{ minHeight: 46, background: 'transparent', border: '1px solid #4a6080', color: '#9fb4cc', fontFamily: mono, fontSize: 11.5, letterSpacing: 1.5, cursor: 'pointer' }}>{copied ? 'ENLACE COPIADO' : 'COPIAR ENLACE A ESTA NOTA'}</button>
          <a href={`https://wa.me/${WA}`} onClick={(e) => { e.currentTarget.href = waHref() }} target="_blank" rel="noopener noreferrer" className="press" style={{ minHeight: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#25d366', color: '#04210f', fontWeight: 700, fontSize: 12, letterSpacing: 1.5, textDecoration: 'none' }}>PEDIR ESTA PIEZA EN RESINA</a>
        </div>
      </section>
      <style>{`
        .rs-range { -webkit-appearance: none; appearance: none; height: 4px; background: linear-gradient(90deg, #7cf0d055, #9fb8ff55); outline: none; border-radius: 2px; }
        .rs-range::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: ${ACCENT}; border: 2px solid #02060a; cursor: pointer; }
        .rs-range::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: ${ACCENT}; border: 2px solid #02060a; cursor: pointer; }
        @media (max-width: 900px) { .rs-grid { grid-template-columns: 1fr !important; } }
        html.rs-reel-on, html.rs-reel-on body { overflow: hidden !important; }
        html.rs-reel-on .neo-organism-filter { filter: none !important; transition: none !important; }
        html.rs-reel-on .rs-layer { z-index: 2000 !important; }
        .rs-reel button[aria-label="Acercar"], .rs-reel button[aria-label="Alejar"], .rs-reel button[aria-label="Restablecer la vista"] { display: none !important; }
      `}</style>
    </div>
  )
}
