'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { RayoCmd, RayoMsg } from '@/lib/rayo/worker'
import type { Metrics } from '@/lib/specimens/analyze'
import type { RayoViewerApi, RayoMode } from './RayoViewer'

const RayoViewer = dynamic(() => import('./RayoViewer'), { ssr: false })
const mono = "'Space Mono', monospace"
const WA = '56993550010'
const ACCENT = '#a9b8ff'
const SIZE_MM = 100
const BOX = { nx: 64, ny: 64, nz: 96 }
const ETAS = [1.5, 2, 2.5, 3, 4]
const fmt = (n: number, d = 1) => n.toFixed(d).replace('.', ',')

function Chip({ on, onClick, children, title, color = '#9fe8ff', disabled }: { on: boolean; onClick: () => void; children: React.ReactNode; title?: string; color?: string; disabled?: boolean }) {
  return <button type="button" className="press" title={title} disabled={disabled} onClick={onClick} style={{ minHeight: 38, padding: '0 14px', fontFamily: mono, fontSize: 11.5, letterSpacing: 1.6, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.45 : 1, background: on ? `${color}22` : 'rgba(2,4,8,0.7)', borderStyle: 'solid', borderWidth: 1, borderColor: on ? color : '#ffffff26', color: on ? color : '#9fb4cc' }}>{children}</button>
}
function Slider({ label, value, onChange, readout, min, max, step }: { label: string; value: number; onChange: (v: number) => void; readout: string; min: number; max: number; step: number }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, letterSpacing: 1.5, color: '#8fa8c4', marginBottom: 6 }}><span>{label}</span><span style={{ color: '#fff' }}>{readout}</span></div>
      <input type="range" className="ry-range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%' }} />
    </label>
  )
}
function Stat({ k, v, warn, title }: { k: string; v: string; warn?: boolean; title?: string }) {
  return <div title={title} style={{ padding: '10px 12px', background: '#080c12', border: '1px solid #ffffff10' }}><div style={{ fontSize: 11, letterSpacing: 1.6, color: '#7f96b2', marginBottom: 5 }}>{k}</div><div style={{ fontSize: 14, color: warn ? '#ffb86b' : '#fff' }}>{v}</div></div>
}

// trueno y chisporroteo sintetizados (ruido filtrado): no son grabaciones
class Storm {
  ctx = new AudioContext(); noise: AudioBuffer; sizzle: GainNode
  constructor() {
    const n = this.ctx.sampleRate * 4, b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0)
    let last = 0; for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = i % 2 ? last * 3.5 : w * 0.5 } // mezcla de ruido marrón y blanco
    this.noise = b
    const src = this.ctx.createBufferSource(); src.buffer = b; src.loop = true
    const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 0.8
    this.sizzle = this.ctx.createGain(); this.sizzle.gain.value = 0
    src.connect(bp); bp.connect(this.sizzle); this.sizzle.connect(this.ctx.destination); src.start()
  }
  crackle(level: number) { this.sizzle.gain.setTargetAtTime(level * (0.4 + 0.6 * Math.random()) * 0.07, this.ctx.currentTime, 0.02) }
  thunder() {
    const t = this.ctx.currentTime
    const boom = (delay: number, gain: number, f0: number) => {
      const s = this.ctx.createBufferSource(); s.buffer = this.noise
      const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(f0, t + delay); lp.frequency.exponentialRampToValueAtTime(110, t + delay + 2.4)
      const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t + delay); g.gain.exponentialRampToValueAtTime(gain, t + delay + 0.015); g.gain.exponentialRampToValueAtTime(0.0008, t + delay + 3.4)
      s.connect(lp); lp.connect(g); g.connect(this.ctx.destination); s.start(t + delay); s.stop(t + delay + 3.6)
    }
    boom(0, 0.9, 2400); boom(0.35, 0.5, 700); boom(0.9, 0.35, 400)
  }
  stop() { this.sizzle.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05); setTimeout(() => this.ctx.close(), 300) }
}

type Info = { total: number; hit: boolean; dim: number; main: number; ms: number }
type SolidInfo = { metrics: Metrics; heightMm: number; widthMm: number; kept: number }
type Reel = { phase: 'titulo' | 'descarga' | 'impacto' | 'pieza' | 'fin' }

export default function RayoApp() {
  const workerRef = useRef<Worker | null>(null)
  const viewerRef = useRef<RayoViewerApi | null>(null)
  const [eta, setEta] = useState(2.5), [seed, setSeed] = useState(1)
  const [thick, setThick] = useState(0.65), [prune, setPrune] = useState(6), [base, setBase] = useState(true)
  const cfg = useRef({ eta, seed, thick, prune, base }); cfg.current = { eta, seed, thick, prune, base }
  const [mode, setModeS] = useState<RayoMode>('descarga')
  const modeRef = useRef<RayoMode>('descarga')
  const [info, setInfo] = useState<Info | null>(null)
  const [shown, setShown] = useState(0), [struck, setStruck] = useState(false)
  const [solid, setSolid] = useState<SolidInfo | null>(null)
  const [busy, setBusy] = useState(''), [err, setErr] = useState('')
  const [palette, setPalette] = useState<'rayo' | 'resina'>('rayo')
  const [sound, setSound] = useState(false)
  const stormRef = useRef<Storm | null>(null)
  const [flash, setFlash] = useState(0)
  const [reel, setReel] = useState<Reel | null>(null)
  const [copied, setCopied] = useState(false)
  const st = useRef({ req: 0, growReq: 0, received: 0, reveal: 0, done: false, total: 0, struck: false, raf: 0, timers: [] as number[], solidRaw: null as null | Extract<RayoMsg, { type: 'solid' }>, solidKey: '', wantStl: false, onStrike: null as null | (() => void), last: 0, lastShown: 0 })

  const send = (c: RayoCmd) => workerRef.current?.postMessage(c)
  const clearTimers = () => { st.current.timers.forEach((t) => clearTimeout(t)); st.current.timers = [] }
  const later = (ms: number, f: () => void) => { st.current.timers.push(window.setTimeout(f, ms)) }
  const setMode = (m: RayoMode) => { modeRef.current = m; setModeS(m); viewerRef.current?.setMode(m) }
  const solidKey = () => { const c = cfg.current; return `${c.eta}|${c.seed}|${c.thick}|${c.prune}|${c.base}` }
  const requestSolid = (stl = false) => {
    if (!st.current.done) return
    const c = cfg.current
    st.current.wantStl = stl; setBusy(stl ? 'CALCULANDO STL…' : 'SOLIDIFICANDO…')
    send({ type: 'solid', opts: { res: stl ? 250 : 170, sizeMm: SIZE_MM, thick: c.thick, prune: c.prune, base: c.base }, stl, req: ++st.current.req })
  }

  // una descarga nueva: se reinicia el visor y el trabajador empieza a crecerla
  const strike = useCallback((onStrike?: () => void) => {
    const c = cfg.current, v = viewerRef.current
    Object.assign(st.current, { received: 0, reveal: 0, done: false, total: 0, struck: false, solidRaw: null, solidKey: '', onStrike: onStrike ?? null })
    setInfo(null); setSolid(null); setShown(0); setStruck(false); setErr('')
    v?.setSolid(null, null, 'rayo'); v?.reset(BOX.nx, BOX.ny, BOX.nz); setMode('descarga')
    st.current.growReq = ++st.current.req
    send({ type: 'grow', eta: c.eta, seed: c.seed, req: st.current.growReq })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // la descarga se revela a ritmo propio (y no al del cálculo): unos 5 segundos
  useEffect(() => {
    const loop = (now: number) => {
      const s = st.current, dt = Math.min(0.1, (now - (s.last || now)) / 1000); s.last = now
      if (s.reveal < s.received) {
        const rate = s.done ? Math.max(240, (s.total - s.reveal) / 2.2) : 300
        s.reveal = Math.min(s.received, s.reveal + rate * dt * (0.6 + 0.8 * Math.random()))
        viewerRef.current?.setReveal(s.reveal)
        stormRef.current?.crackle(1)
        if (now - s.lastShown > 90) { s.lastShown = now; setShown(Math.floor(s.reveal)) }
      } else stormRef.current?.crackle(0)
      if (s.done && !s.struck && s.reveal >= s.total - 0.5) {
        s.struck = true; setShown(s.total); setStruck(true)
        viewerRef.current?.flash(); stormRef.current?.thunder()
        setFlash(1); setTimeout(() => setFlash(0), 90)
        if (st.current.solidKey !== solidKey()) requestSolid()
        s.onStrike?.()
      }
      s.raf = requestAnimationFrame(loop)
    }
    st.current.raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(st.current.raf)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const w = new Worker(new URL('../../lib/rayo/worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = w
    w.onmessage = (e: MessageEvent<RayoMsg>) => {
      const m = e.data, v = viewerRef.current
      if (m.type === 'error') { setBusy(''); setErr(m.error); return }
      // trozos de una descarga anterior (se pidió otra mientras crecía): se ignoran
      if ((m.type === 'chunk' || m.type === 'done') && m.req !== st.current.growReq) return
      if (m.type === 'chunk') { v?.addSites(m.from, m.xyz, m.parent); st.current.received = m.from + m.xyz.length / 3; return }
      if (m.type === 'done') {
        st.current.done = true; st.current.total = m.total
        v?.finish(m.main, m.size)
        setInfo({ total: m.total, hit: m.hit, dim: m.dim, main: m.main.length, ms: m.ms })
        return
      }
      if (m.type === 'solid') {
        setBusy('')
        if (st.current.wantStl && m.stl) {
          const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([m.stl], { type: 'model/stl' })); a.download = `rayo-eta${cfg.current.eta}-${cfg.current.seed}.stl`
          document.body.appendChild(a); a.click(); a.remove(); st.current.wantStl = false; return
        }
        st.current.solidRaw = m; st.current.solidKey = solidKey()
        setSolid({ metrics: m.metrics as Metrics, heightMm: m.heightMm, widthMm: m.widthMm, kept: m.kept })
        v?.setSolid(m.positions, m.indices, paletteRef.current)
      }
    }
    const mm = window.location.hash.match(/^#y=([\d.]+),(\d+),([\d.]+),(\d+),([01]),(descarga|pieza)$/)
    if (mm) {
      const q = { eta: ETAS.includes(+mm[1]) ? +mm[1] : 2.5, seed: +mm[2], thick: Math.min(0.9, Math.max(0.5, +mm[3])), prune: Math.min(14, Math.max(2, +mm[4])), base: mm[5] === '1' }
      setEta(q.eta); setSeed(q.seed); setThick(q.thick); setPrune(q.prune); setBase(q.base); cfg.current = q
      if (mm[6] === 'pieza') st.current.onStrike = () => later(600, () => goPieza())
    }
    return () => { clearTimers(); stormRef.current?.stop(); w.terminate(); workerRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const paletteRef = useRef(palette); paletteRef.current = palette
  useEffect(() => { const r = st.current.solidRaw; if (r) viewerRef.current?.setSolid(r.positions, r.indices, palette) }, [palette])
  const onViewer = useCallback((api: RayoViewerApi | null) => {
    viewerRef.current = api
    if (api) { const pending = st.current.onStrike; strike(pending ?? undefined) }
  }, [strike])

  const goPieza = () => { setMode('pieza'); if (st.current.solidKey !== solidKey()) requestSolid() }
  const again = (newSeed = true) => { clearTimers(); if (newSeed) { const s = cfg.current.seed + 1; setSeed(s); cfg.current = { ...cfg.current, seed: s } } strike() }
  const pickEta = (v: number) => { setEta(v); cfg.current = { ...cfg.current, eta: v }; clearTimers(); strike() }
  const pieceTimer = useRef(0)
  const changePiece = (patch: Partial<typeof cfg.current>) => {
    cfg.current = { ...cfg.current, ...patch }
    if (patch.thick !== undefined) setThick(patch.thick); if (patch.prune !== undefined) setPrune(patch.prune); if (patch.base !== undefined) setBase(patch.base)
    clearTimeout(pieceTimer.current)
    pieceTimer.current = window.setTimeout(() => { if (modeRef.current === 'pieza') requestSolid() }, 350)
  }
  const toggleSound = () => { if (stormRef.current) { stormRef.current.stop(); stormRef.current = null; setSound(false) } else { stormRef.current = new Storm(); setSound(true) } }

  const link = () => { const c = cfg.current; return `${window.location.origin}/rayo#y=${c.eta},${c.seed},${c.thick.toFixed(2)},${c.prune},${c.base ? 1 : 0},${modeRef.current}` }
  const share = async () => { const l = link(); try { await navigator.clipboard.writeText(l); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { window.prompt('Copia el enlace:', l) } }
  const waHref = () => `https://wa.me/${WA}?text=${encodeURIComponent(`Hola, quiero la pieza RAYO impresa en resina. Receta: ${link()}`)}`
  const exportJson = () => {
    if (!solid || !info) return
    const m = solid.metrics, c = cfg.current
    const doc = {
      pieza: 'RAYO', enlace: link(),
      descarga: { modelo: 'ruptura dieléctrica (Niemeyer, Pietronero y Wiesmann 1984)', eta: c.eta, semilla: c.seed, grilla: BOX, sitios: info.total, canal_principal: info.main, dimension_cajas: +info.dim.toFixed(3) },
      receta: { grosor: c.thick, poda_ramitas_menores_que: c.prune, base: c.base },
      medidas: { ancho_mm: +solid.widthMm.toFixed(1), alto_mm: +solid.heightMm.toFixed(1), triangulos: m.tris, cerrada: m.closed, piezas: m.components, voladizo: +m.overhangFrac.toFixed(3), pared_p10_mm: +m.wallP10Mm.toFixed(2), puntaje_impresion: +m.printScore.toFixed(2), sitios_impresos: solid.kept },
      impresion_sugerida: { tecnologia: 'resina (SLA/MSLA), traslúcida si se ilumina desde la base', capa_um: 50, orientacion: 'de pie, la base en la plataforma', soportes: m.overhangFrac > 0.06 ? 'bajo las ramas casi horizontales' : 'pocos', advertencia: 'Sin pruebas de impresión real todavía: validar con una pieza de ensayo antes de producir.' },
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })); a.download = `rayo-${c.eta}-${c.seed}.json`
    document.body.appendChild(a); a.click(); a.remove()
  }

  // ---- modo reel ----
  const reelClass = (on: boolean) => document.documentElement.classList.toggle('ry-reel-on', on)
  useEffect(() => () => { reelClass(false) }, [])
  const enterReel = () => {
    const v = viewerRef.current; if (!v) return
    clearTimers(); reelClass(true); v.setFraming(1.12, 0.06); setReel({ phase: 'titulo' })
    // cielo vacío para el título: se descarta la descarga anterior
    st.current.growReq = ++st.current.req
    Object.assign(st.current, { received: 0, reveal: 0, done: false, total: 0, struck: false, onStrike: null })
    v.setSolid(null, null, 'rayo'); v.reset(BOX.nx, BOX.ny, BOX.nz); setMode('descarga'); setStruck(false); setInfo(null)
    later(2400, () => {
      setReel({ phase: 'descarga' })
      strike(() => {
        setReel({ phase: 'impacto' })
        later(2600, () => { setReel({ phase: 'pieza' }); goPieza(); viewerRef.current?.setAutoRotate(0.5) })
        later(2600 + 7500, () => setReel({ phase: 'fin' }))
      })
    })
  }
  const exitReel = () => { clearTimers(); reelClass(false); setReel(null); viewerRef.current?.setFraming(1, 0); viewerRef.current?.setAutoRotate(0.08) }
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') exitReel() }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const m = solid?.metrics
  const growing = !struck && mode === 'descarga'
  // los números aparecen con el impacto, no antes (el cálculo termina antes que la animación)
  const I = struck ? info : null

  return (
    <div>
      <div className={reel ? 'ry-reel' : ''} data-phase={reel?.phase} style={reel ? { position: 'fixed', inset: 0, zIndex: 400, background: '#000', display: 'grid', placeItems: 'center' } : {}}>
        <div style={reel ? { position: 'relative', height: 'min(100vh, 100vw * 16 / 9)', aspectRatio: '9 / 16', background: '#020308', overflow: 'hidden' } : { position: 'relative', height: 'min(80vh, 760px)', minHeight: 460, background: '#020308', border: '1px solid #ffffff14' }}>
          <RayoViewer onReady={onViewer} />
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: '#dfe6ff', opacity: flash ? 0.55 : 0, transition: flash ? 'none' : 'opacity .5s', pointerEvents: 'none' }} />
          {!reel && (
            <>
              <div style={{ position: 'absolute', left: 14, top: 12, pointerEvents: 'none', textShadow: '0 1px 4px #000', fontSize: 11, letterSpacing: 1.8, color: '#ffffffcc' }}>
                <div style={{ color: ACCENT }}>η = {fmt(eta, 1)} · RAYO {seed}</div>
                <div>{mode === 'pieza' ? 'PIEZA · dado vuelta, sobre su base' : growing ? `DESCARGA · ${shown} pasos` : I?.hit ? `IMPACTO · ${I.total} pasos` : '…'}</div>
                {I && <div style={{ color: '#7f96b2' }}>dimensión fractal (cajas) {fmt(I.dim, 2)}</div>}
                {busy && <div style={{ color: '#ffd27c' }}>{busy}</div>}
              </div>
              <div style={{ position: 'absolute', right: 10, top: 10, display: 'flex', gap: 6 }}>
                <Chip on={sound} onClick={toggleSound} color={ACCENT} title="Trueno y chisporroteo sintetizados">{sound ? '♪ SONIDO' : '♪ SIN SONIDO'}</Chip>
                {mode === 'pieza' && <Chip on={palette === 'resina'} onClick={() => setPalette((x) => (x === 'resina' ? 'rayo' : 'resina'))}>RESINA</Chip>}
              </div>
            </>
          )}
          {reel && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', fontFamily: mono }}>
              <div style={{ position: 'absolute', top: '9%', left: 0, right: 0, padding: '0 6%', textAlign: 'center', opacity: reel.phase === 'titulo' ? 1 : 0, transition: 'opacity 1.1s' }}>
                <div style={{ fontSize: 'clamp(10px, 1.6vh, 15px)', letterSpacing: 5, color: ACCENT }}>NEO·PROXY // ELECTRICIDAD</div>
                <div style={{ fontSize: 'clamp(34px, 8vh, 84px)', letterSpacing: 14, color: '#fff', fontWeight: 700, textShadow: '0 0 40px #a9b8ffaa', marginTop: 6 }}>RAYO</div>
                <div style={{ fontSize: 'clamp(11px, min(1.9vh, 3.8vw), 18px)', color: '#cfe6ff', marginTop: 8 }}>una descarga, calculada paso a paso</div>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '56px 7% 5.5vh', textAlign: 'center', textShadow: '0 1px 6px #000', background: 'linear-gradient(transparent, #000000b0)', opacity: reel.phase === 'titulo' || reel.phase === 'fin' ? 0 : 1, transition: 'opacity .8s' }}>
                <div style={{ fontSize: 'clamp(13px, min(2.5vh, 4.8vw), 24px)', color: '#fff', fontWeight: 700, letterSpacing: 1.5, lineHeight: 1.45 }}>
                  {reel.phase === 'descarga' && 'La descarga avanza donde el campo eléctrico es más fuerte.'}
                  {reel.phase === 'impacto' && 'Toca tierra: el canal principal se enciende.'}
                  {reel.phase === 'pieza' && 'Dado vuelta, el rayo es un árbol. Listo para imprimir.'}
                </div>
              </div>
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: reel.phase === 'fin' ? 1 : 0, transition: 'opacity 1s', background: reel.phase === 'fin' ? '#000c' : 'transparent' }}>
                <div style={{ textAlign: 'center', padding: '0 8%' }}>
                  <div style={{ fontSize: 'clamp(34px, 8vh, 84px)', letterSpacing: 14, color: '#fff', fontWeight: 700 }}>RAYO</div>
                  <div style={{ fontSize: 'clamp(12px, min(2.2vh, 4.2vw), 22px)', color: '#cfe6ff', margin: '14px 0' }}>Una descarga eléctrica, congelada en una pieza.</div>
                  <div style={{ fontSize: 'clamp(12px, 2.2vh, 22px)', color: ACCENT, letterSpacing: 2 }}>neoproxy.art/rayo</div>
                </div>
              </div>
              {!sound && reel.phase === 'titulo' && <div style={{ position: 'absolute', top: '32%', left: 0, right: 0, textAlign: 'center', fontSize: 12, color: '#ffd27c', letterSpacing: 1.5 }}>sin sonido: actívalo antes de grabar (♪)</div>}
              <button type="button" onClick={exitReel} style={{ position: 'absolute', top: 10, right: 10, pointerEvents: 'auto', opacity: reel.phase === 'titulo' ? 1 : 0.3, fontFamily: mono, fontSize: 12, letterSpacing: 2, padding: '8px 12px', background: '#000a', color: '#9fb4cc', border: '1px solid #ffffff30', cursor: 'pointer' }}>SALIR ✕</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', margin: '12px 0 16px' }}>
        <button type="button" className="press" onClick={() => again(true)} style={{ minHeight: 48, padding: '0 24px', fontFamily: mono, fontWeight: 700, fontSize: 12, letterSpacing: 3, cursor: 'pointer', border: 'none', background: 'linear-gradient(90deg,#a9b8ff,#e6ecff)', color: '#04060a' }}>⚡ OTRO RAYO</button>
        <button type="button" className="press" onClick={() => { if (mode === 'pieza') { setMode('descarga') } else goPieza() }} disabled={!struck}
          style={{ minHeight: 48, padding: '0 22px', fontFamily: mono, fontWeight: 700, fontSize: 12.5, letterSpacing: 2.5, cursor: struck ? 'pointer' : 'default', opacity: struck ? 1 : 0.45, border: `1px solid ${ACCENT}`, background: mode === 'pieza' ? `${ACCENT}33` : '#0b111a', color: '#fff' }}>
          {mode === 'pieza' ? '↺ VOLVER A LA DESCARGA' : '◆ CONGELAR EN PIEZA'}
        </button>
        <Chip on={false} onClick={() => again(false)} title="La misma descarga otra vez">↻ REPETIR</Chip>
        <span style={{ flex: 1 }} />
        <Chip on={!!reel} onClick={enterReel} color="#ffd27c" title="Pantalla vertical que corre sola: para grabarla con el teléfono (activa el sonido antes)">▣ MODO REEL</Chip>
      </div>
      {err && <p style={{ color: '#ffb86b', fontSize: 12 }}>{err}</p>}

      <div className="ry-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 22 }}>
        <section style={{ background: '#080c12', borderStyle: 'solid', borderWidth: '1px 1px 1px 3px', borderColor: `${ACCENT}2a ${ACCENT}2a ${ACCENT}2a ${ACCENT}`, padding: '18px 20px' }}>
          <div style={{ fontSize: 11.5, letterSpacing: 3, color: ACCENT, marginBottom: 10 }}>RAMIFICACIÓN (η)</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {ETAS.map((v) => <Chip key={v} on={eta === v} color={ACCENT} onClick={() => pickEta(v)}>{fmt(v, 1)}</Chip>)}
          </div>
          <p style={{ fontSize: 11.5, lineHeight: 1.9, color: '#8fa8c4', margin: '0 0 12px' }}>
            En cada paso la descarga avanza a un punto vecino con probabilidad proporcional al campo eléctrico elevado a η. Con η bajo se abre como un coral; con η alto corre fina y directa, como un rayo.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
            <Stat k="PASOS" v={I ? I.total.toLocaleString('es-CL') : shown ? `${shown}…` : '…'} />
            <Stat k="CANAL PRINCIPAL" v={I ? `${I.main} pasos` : '…'} title="Del punto de impacto a la nube" />
            <Stat k="DIMENSIÓN (CAJAS)" v={I ? fmt(I.dim, 2) : '…'} title="Conteo de cajas de 1 a 16 celdas sobre esta descarga" />
            <Stat k="CÁLCULO" v={I ? `${fmt(I.ms / 1000, 1)} s` : '…'} />
          </div>
        </section>
        <section style={{ background: '#080c12', border: '1px solid #ffffff12', padding: '18px 20px', display: 'grid', gap: 14, alignContent: 'start' }}>
          <div style={{ fontSize: 11.5, letterSpacing: 3, color: '#9fe8ff' }}>LA PIEZA</div>
          <Slider label="GROSOR" value={thick} min={0.5} max={0.9} step={0.05} readout={fmt(thick, 2)} onChange={(v) => changePiece({ thick: v })} />
          <Slider label="PODA DE RAMITAS" value={prune} min={2} max={14} step={1} readout={`menores que ${prune} pasos`} onChange={(v) => changePiece({ prune: v })} />
          <div style={{ display: 'flex', gap: 6 }}><Chip on={base} onClick={() => changePiece({ base: !base })}>BASE</Chip></div>
          <div style={{ fontSize: 11, color: '#6f86a3', lineHeight: 1.7 }}>Cada rama engorda con la cantidad de descarga que cuelga de ella, como un río con sus afluentes. Las ramitas más cortas se podan: impresas serían pelos sueltos.</div>
        </section>
      </div>

      <section style={{ marginTop: 22 }}>
        <div style={{ fontSize: 11.5, letterSpacing: 3, color: '#9fe8ff', marginBottom: 10 }}>MEDIDAS{solid ? '' : busy ? ' · ' + busy : ' · CONGELA LA DESCARGA PARA MEDIRLA'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: 8 }}>
          <Stat k="MEDIDAS" v={solid ? `${fmt(solid.widthMm, 0)} × ${fmt(solid.heightMm, 0)} mm` : '…'} />
          <Stat k="TRIÁNGULOS" v={m ? m.tris.toLocaleString('es-CL') : '…'} />
          <Stat k="PIEZAS" v={m ? String(m.components) : '…'} warn={!!m && m.components > 1} />
          <Stat k="VOLADIZO" v={m ? `${fmt(100 * m.overhangFrac, 0)} %` : '…'} warn={!!m && m.overhangFrac > 0.15} />
          <Stat k="PARED MÍNIMA (P10)" v={m ? `${fmt(m.wallP10Mm, 2)} mm` : '…'} warn={!!m && m.wallP10Mm < 1} />
          <Stat k="PUNTAJE DE IMPRESIÓN" v={m ? fmt(m.printScore, 2) : '…'} warn={!!m && m.printScore < 0.5} />
        </div>
        {m && m.components > 1 && <p style={{ fontSize: 11.5, color: '#ffb86b', margin: '10px 0 0' }}>El STL omite {m.components - 1} partes sueltas ({fmt(100 * m.droppedVolumeFrac, 1)} % del volumen): sube el grosor o la poda.</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8, marginTop: 14 }}>
          <button className="press" onClick={() => requestSolid(true)} disabled={!solid || !!busy} style={{ minHeight: 46, background: ACCENT, color: '#02060a', border: 'none', fontFamily: mono, fontWeight: 700, fontSize: 12, letterSpacing: 1.5, cursor: 'pointer', opacity: solid ? 1 : 0.45 }}>{busy.startsWith('CALCULANDO') ? busy : `DESCARGAR STL (${SIZE_MM} MM)`}</button>
          <button className="press" onClick={exportJson} disabled={!solid} style={{ minHeight: 46, background: 'transparent', border: '1px solid #4a6080', color: '#9fb4cc', fontFamily: mono, fontSize: 11.5, letterSpacing: 1.5, cursor: 'pointer', opacity: solid ? 1 : 0.45 }}>RECETA + FICHA (JSON)</button>
          <button className="press" onClick={share} style={{ minHeight: 46, background: 'transparent', border: '1px solid #4a6080', color: '#9fb4cc', fontFamily: mono, fontSize: 11.5, letterSpacing: 1.5, cursor: 'pointer' }}>{copied ? 'ENLACE COPIADO' : 'COPIAR ENLACE A ESTE RAYO'}</button>
          <a href={`https://wa.me/${WA}`} onClick={(e) => { e.currentTarget.href = waHref() }} target="_blank" rel="noopener noreferrer" className="press" style={{ minHeight: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#25d366', color: '#04210f', fontWeight: 700, fontSize: 12, letterSpacing: 1.5, textDecoration: 'none' }}>PEDIR ESTA PIEZA EN RESINA</a>
        </div>
      </section>
      <style>{`
        .ry-range { -webkit-appearance: none; appearance: none; height: 3px; background: #ffffff2a; outline: none; border-radius: 2px; }
        .ry-range::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${ACCENT}; border: 2px solid #02060a; cursor: pointer; }
        .ry-range::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: ${ACCENT}; border: 2px solid #02060a; cursor: pointer; }
        @media (max-width: 900px) { .ry-grid { grid-template-columns: 1fr !important; } }
        html.ry-reel-on, html.ry-reel-on body { overflow: hidden !important; }
        html.ry-reel-on .neo-organism-filter { filter: none !important; transition: none !important; }
        html.ry-reel-on .ry-layer { z-index: 2000 !important; }
        .ry-reel button[aria-label="Acercar"], .ry-reel button[aria-label="Alejar"], .ry-reel button[aria-label="Restablecer la vista"] { display: none !important; }
      `}</style>
    </div>
  )
}
