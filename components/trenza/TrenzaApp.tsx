'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { ORBITS, orbitById } from '@/lib/trenza/orbit'
import type { Lines, TrenzaCmd, TrenzaMsg } from '@/lib/trenza/worker'
import type { Metrics } from '@/lib/specimens/analyze'
import type { TrenzaViewerApi, TrenzaMode } from './TrenzaViewer'
import BraidDiagram, { wordText } from './BraidDiagram'

const TrenzaViewer = dynamic(() => import('./TrenzaViewer'), { ssr: false })
const mono = "'Space Mono', monospace"
const WA = '56993550010'
const SIZE_MM = 90
const COLORS = ['#5fe3ff', '#ff4fa3', '#ffc75a']
const START = [0, 2, 1] // orden en x al comienzo: x₁ = −1, x₃ = 0, x₂ = 1
const fmt = (n: number, d = 1) => n.toFixed(d).replace('.', ',')
const ACCENT = '#ffc75a'

function Chip({ on, onClick, children, title, color = '#9fe8ff', disabled }: { on: boolean; onClick: () => void; children: React.ReactNode; title?: string; color?: string; disabled?: boolean }) {
  return <button type="button" className="press" title={title} disabled={disabled} onClick={onClick} style={{ minHeight: 38, padding: '0 14px', fontFamily: mono, fontSize: 11.5, letterSpacing: 1.6, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.45 : 1, background: on ? `${color}22` : 'rgba(2,4,8,0.7)', borderStyle: 'solid', borderWidth: 1, borderColor: on ? color : '#ffffff26', color: on ? color : '#9fb4cc' }}>{children}</button>
}
function Slider({ label, value, onChange, readout, min = 0, max = 1, step = 0.01 }: { label: string; value: number; onChange: (v: number) => void; readout: string; min?: number; max?: number; step?: number }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, letterSpacing: 1.5, color: '#8fa8c4', marginBottom: 6 }}><span>{label}</span><span style={{ color: '#fff' }}>{readout}</span></div>
      <input type="range" className="tr-range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%' }} />
    </label>
  )
}
function Stat({ k, v, warn, title }: { k: string; v: string; warn?: boolean; title?: string }) {
  return <div title={title} style={{ padding: '10px 12px', background: '#080c12', border: '1px solid #ffffff10' }}><div style={{ fontSize: 11, letterSpacing: 1.6, color: '#7f96b2', marginBottom: 5 }}>{k}</div><div style={{ fontSize: 14, color: warn ? '#ffb86b' : '#fff' }}>{v}</div></div>
}
function Glyph({ pts, on }: { pts?: number[][]; on: boolean }) {
  if (!pts) return <svg width={46} height={30} />
  let m = 0.01; for (const p of pts) for (let i = 0; i < p.length; i += 2) m = Math.max(m, Math.abs(p[i]) / 1.5, Math.abs(p[i + 1]))
  return (
    <svg width={46} height={30} viewBox="-1.55 -1 3.1 2" style={{ display: 'block' }} aria-hidden>
      {pts.map((p, b) => <polyline key={b} fill="none" stroke={COLORS[b]} strokeOpacity={on ? 1 : 0.7} strokeWidth={0.07} points={Array.from({ length: p.length / 2 }, (_, i) => `${(p[2 * i] / m).toFixed(3)},${(-p[2 * i + 1] / m).toFixed(3)}`).join(' ')} />)}
    </svg>
  )
}

type SolidInfo = { metrics: Metrics; heightMm: number; widthMm: number; ms: number }
type Reel = { phase: 'titulo' | 'danza' | 'trenza' | 'pieza' | 'caos' | 'fin' }
type Params = { id: string; periods: number; aspect: number; radius: number; speedW: number; plates: 'base' | 'ambas' }

const periodSeconds = (wordLen: number) => Math.min(11, Math.max(4.5, 3 + 0.13 * wordLen))

export default function TrenzaApp() {
  const workerRef = useRef<Worker | null>(null)
  const viewerRef = useRef<TrenzaViewerApi | null>(null)
  const [p, setP] = useState<Params>({ id: 'ocho', periods: 1, aspect: 1.6, radius: 0.045, speedW: 0.8, plates: 'base' })
  const P = useRef(p); P.current = p
  const [mode, setModeS] = useState<TrenzaMode>('danza')
  const modeRef = useRef<TrenzaMode>('danza')
  const [palette, setPalette] = useState<'trenza' | 'resina'>('trenza')
  const [glyphs, setGlyphs] = useState<Record<string, number[][]>>({})
  const [solid, setSolid] = useState<SolidInfo | null>(null)
  const [busy, setBusy] = useState(''), [err, setErr] = useState('')
  const [exporting, setExporting] = useState(false), [copied, setCopied] = useState(false)
  const [epsK, setEpsK] = useState(6)
  const [chaos, setChaos] = useState<{ split: number | null; periods: number; eps: number } | null>(null)
  const [head, setHead] = useState({ t: 0, span: 1 })
  const [playing, setPlaying] = useState(true), [ready, setReady] = useState(false)
  const [reel, setReel] = useState<Reel | null>(null)
  const reelRef = useRef<Reel | null>(null); reelRef.current = reel
  const st = useRef({ req: 0, lines: null as Lines | null, linesKey: '', solidRaw: null as null | Extract<TrenzaMsg, { type: 'solid' }>, solidKey: '', timers: [] as number[], wantStl: false })
  const o = orbitById(p.id)

  const send = (c: TrenzaCmd) => workerRef.current?.postMessage(c)
  const tScaleOf = (L: Lines, periods = L.periods) => (P.current.aspect * 2 * L.extent) / (L.T * periods)
  const clearTimers = () => { st.current.timers.forEach((t) => clearTimeout(t)); st.current.timers = [] }
  const later = (ms: number, f: () => void) => { st.current.timers.push(window.setTimeout(f, ms)) }

  const setMode = useCallback((m: TrenzaMode) => { modeRef.current = m; setModeS(m); viewerRef.current?.setMode(m) }, [])
  const solidKey = () => { const q = P.current; return `${q.id}|${q.periods}|${q.aspect}|${q.radius}|${q.speedW}|${q.plates}` }
  const requestSolid = useCallback((stl = false) => {
    const q = P.current
    st.current.wantStl = stl
    setBusy(stl ? 'CALCULANDO STL…' : 'SOLIDIFICANDO…')
    send({ type: 'solid', id: q.id, periods: q.periods, opts: { res: stl ? 176 : 112, sizeMm: SIZE_MM, aspect: q.aspect, radius: q.radius, plates: q.plates, speedWeight: q.speedW }, stl, req: ++st.current.req })
  }, [])

  // secuencia: la danza (un período desde arriba) → la trenza crece → la pieza
  const playStory = useCallback((fromDance = true) => {
    clearTimers()
    const v = viewerRef.current, L = st.current.lines
    if (!v || !L) return
    const secs = periodSeconds(orbitById(P.current.id).word.length)
    v.setGhost(null); v.setLines(L, tScaleOf(L)); v.setRate(L.T / secs); v.setPlaying(true); setPlaying(true)
    const toTrenza = () => { v.setHead(0); setMode('trenza'); later((secs * L.periods + 1.2) * 1000, () => { setMode('pieza'); if (st.current.solidKey !== solidKey()) requestSolid() }) }
    if (fromDance) { setMode('danza'); v.setHead(0); later(secs * 1000, toTrenza) } else toTrenza()
    // la pieza se calcula mientras la trenza crece
    if (st.current.solidKey !== solidKey()) requestSolid()
  }, [requestSolid, setMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadOrbit = useCallback((story = true) => {
    const q = P.current, key = `${q.id}|${q.periods}`
    if (st.current.linesKey === key && st.current.lines) { if (story) playStory(); return }
    setBusy('INTEGRANDO…'); setErr('')
    send({ type: 'orbit', id: q.id, periods: q.periods, req: ++st.current.req })
  }, [playStory])

  useEffect(() => {
    const w = new Worker(new URL('../../lib/trenza/worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = w
    w.onmessage = (e: MessageEvent<TrenzaMsg>) => {
      const m = e.data, v = viewerRef.current
      if (m.type === 'glyphs') { setGlyphs(m.glyphs); return }
      if (m.type === 'error') { setBusy(''); setExporting(false); setErr(m.error); return }
      if (m.type === 'orbit') {
        st.current.lines = m.lines; st.current.linesKey = `${P.current.id}|${P.current.periods}`; setBusy(''); setReady(true)
        playStory(); return
      }
      if (m.type === 'solid') {
        setBusy('')
        if (st.current.wantStl && m.stl) {
          const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([m.stl], { type: 'model/stl' })); a.download = `trenza-${P.current.id}-${P.current.periods}v.stl`
          document.body.appendChild(a); a.click(); a.remove(); setExporting(false); st.current.wantStl = false
          return
        }
        st.current.solidRaw = m; st.current.solidKey = solidKey()
        setSolid({ metrics: m.metrics as Metrics, heightMm: m.heightMm, widthMm: m.widthMm, ms: m.ms })
        v?.setSolid({ positions: m.positions, indices: m.indices, strand: m.strand, world: m.world }, paletteRef.current)
        return
      }
      if (m.type === 'chaos') {
        setBusy('')
        if (!v) return
        const L = m.main
        // la torre del caos mide 1,6 veces la trenza de una vuelta, tenga las vueltas que tenga
        v.setLines(L, tScaleOf(L, 2) * (3.2 / L.periods)); v.setGhost(m.ghost); v.setHead(0)
        v.setRate((L.T * L.periods) / 8); v.setPlaying(true); setPlaying(true) // todas las vueltas en 8 s
        setMode('caos')
        setChaos((c) => ({ split: m.split, periods: L.periods, eps: c?.eps ?? 1e-6 }))
      }
    }
    send({ type: 'glyphs', req: 0 })
    // enlace a una pieza
    const mm = window.location.hash.match(/^#t=([\w-]+),(\d),([\d.]+),([\d.]+),([\d.]+),([01])$/)
    if (mm && ORBITS.some((x) => x.id === mm[1])) {
      const q: Params = { id: mm[1], periods: Math.min(3, Math.max(1, +mm[2])), aspect: Math.min(3, Math.max(1, +mm[3])), radius: Math.min(0.07, Math.max(0.03, +mm[4])), speedW: Math.min(1, Math.max(0, +mm[5])), plates: mm[6] === '1' ? 'ambas' : 'base' }
      P.current = q; setP(q)
    }
    return () => { clearTimers(); w.terminate(); workerRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const paletteRef = useRef(palette); paletteRef.current = palette
  useEffect(() => { const r = st.current.solidRaw; if (r) viewerRef.current?.setSolid({ positions: r.positions, indices: r.indices, strand: r.strand, world: r.world }, palette) }, [palette])

  const onViewer = useCallback((api: TrenzaViewerApi | null) => { viewerRef.current = api; if (api) loadOrbit() }, [loadOrbit])
  const update = (patch: Partial<Params>) => { const q = { ...P.current, ...patch }; P.current = q; setP(q) }

  const pickOrbit = (id: string) => { update({ id }); setChaos(null); setSolid(null); st.current.solidRaw = null; st.current.solidKey = ''; viewerRef.current?.setSolid(null, palette); loadOrbit() }
  // los cambios de la pieza se aplican con una pausa corta (los deslizadores disparan muchos eventos)
  const pieceTimer = useRef(0)
  const changePiece = (patch: Partial<Params>) => {
    update(patch)
    if (patch.periods !== undefined) { setSolid(null); st.current.solidRaw = null; viewerRef.current?.setSolid(null, palette); loadOrbit(); return }
    const L = st.current.lines
    if (L && modeRef.current !== 'caos') viewerRef.current?.setLines(L, tScaleOf(L))
    clearTimeout(pieceTimer.current)
    pieceTimer.current = window.setTimeout(() => { if (modeRef.current === 'pieza') requestSolid() }, 350)
  }
  const goMode = (m: TrenzaMode) => {
    clearTimers()
    const v = viewerRef.current, L = st.current.lines
    if (!v || !L) return
    if (m === 'caos') { runChaos(); return }
    v.setGhost(null)
    if (modeRef.current === 'caos') v.setLines(L, tScaleOf(L))
    if (m === 'danza') { v.setHead(0); v.setRate(L.T / periodSeconds(o.word.length)) }
    if (m === 'trenza') v.setHead(0)
    if (m === 'pieza') { v.setHead(L.T * L.periods); if (st.current.solidKey !== solidKey()) requestSolid() }
    v.setPlaying(true); setPlaying(true)
    setMode(m)
  }
  const runChaos = (k = epsK, keepTimers = false) => {
    if (!keepTimers) clearTimers() // el reel sigue con su propio guion
    const eps = Math.pow(10, -k)
    const d = o.diverge.eps6 ?? null
    // se muestran los períodos suficientes para ver la separación (o 8 si la órbita aguanta)
    const periods = Math.min(10, Math.max(4, Math.ceil((d === null ? 6 : d * (k / 6)) + 2)))
    setChaos({ split: null, periods, eps }); setBusy('INTEGRANDO DOS UNIVERSOS…')
    send({ type: 'chaos', id: P.current.id, eps, periods, req: ++st.current.req })
  }

  const link = () => { const q = P.current; return `${window.location.origin}/trenza#t=${q.id},${q.periods},${q.aspect.toFixed(2)},${q.radius.toFixed(3)},${q.speedW.toFixed(2)},${q.plates === 'ambas' ? 1 : 0}` }
  const share = async () => { const l = link(); try { await navigator.clipboard.writeText(l); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { window.prompt('Copia el enlace:', l) } }
  const waHref = () => `https://wa.me/${WA}?text=${encodeURIComponent(`Hola, quiero la pieza TRENZA (${o.name.toLowerCase()}) impresa en resina. Receta: ${link()}`)}`
  const exportStl = () => { if (!solid || exporting) return; setExporting(true); requestSolid(true) }
  const exportJson = () => {
    if (!solid) return
    const m = solid.metrics, q = P.current
    const doc = {
      pieza: 'TRENZA — tres cuerpos', orbita: `${o.name} (${o.en})`, enlace: link(),
      condiciones_iniciales: {
        nota: 'G = m = 1. x₁ = (−1, 0), x₂ = (1, 0), x₃ = (0, 0); v₁ = v₂ = (p1, p2), v₃ = −2 (p1, p2). Valores publicados con 6 cifras, refinados aquí con Gauss–Newton hasta que la órbita cierra.',
        publicadas: o.published, refinadas: { p1: o.p1, p2: o.p2, T: o.T, error_de_cierre: o.returnError },
      },
      fisica: { energia: o.energy, deriva_energia_un_periodo: o.energyDrift, acercamiento_minimo: o.minDist, palabra_de_la_trenza: wordText(o.word), cruces: o.word.length, periodos_que_aguanta_con_1e6: o.diverge.eps6 ?? `más de ${o.diverge.horizon}` },
      receta: { vueltas: q.periods, alto_sobre_ancho: q.aspect, grosor_relativo: q.radius, grosor_segun_velocidad: q.speedW, placas: q.plates },
      medidas: { ancho_mm: +solid.widthMm.toFixed(1), alto_mm: +solid.heightMm.toFixed(1), triangulos: m.tris, cerrada: m.closed, piezas: m.components, genero: m.genus, voladizo: +m.overhangFrac.toFixed(3), pared_p10_mm: +m.wallP10Mm.toFixed(2), puntaje_impresion: +m.printScore.toFixed(2) },
      impresion_sugerida: { tecnologia: 'resina (SLA/MSLA)', capa_um: 50, orientacion: 'de pie, la base en la plataforma', soportes: q.plates === 'ambas' ? 'necesarios bajo la tapa' : m.overhangFrac > 0.08 ? 'probablemente en los tramos casi horizontales' : 'pocos o ninguno', advertencia: 'Sin pruebas de impresión real todavía: validar con una pieza de ensayo antes de producir.' },
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })); a.download = `trenza-${q.id}.json`
    document.body.appendChild(a); a.click(); a.remove()
  }

  // ---- modo reel ----
  const reelClass = (on: boolean) => document.documentElement.classList.toggle('tr-reel-on', on)
  useEffect(() => () => { reelClass(false) }, [])
  const enterReel = () => {
    const v = viewerRef.current, L = st.current.lines
    if (!v || !L) return
    clearTimers(); reelClass(true)
    const secs = periodSeconds(o.word.length)
    setReel({ phase: 'titulo' }); setChaos(null); v.setFraming(1.32, 0.16)
    v.setGhost(null); v.setLines(L, tScaleOf(L)); v.setRate(L.T / secs); v.setHead(0); v.setPlaying(true); setMode('danza'); v.setAutoRotate(0.05)
    if (st.current.solidKey !== solidKey()) requestSolid()
    later(2600, () => setReel({ phase: 'danza' }))
    later(2600 + secs * 1000, () => { v.setHead(0); setMode('trenza'); v.setAutoRotate(0.14); setReel({ phase: 'trenza' }) })
    const tPieza = 2600 + secs * 1000 + (secs * L.periods + 1.5) * 1000
    later(tPieza, () => { v.setHead(L.T * L.periods); setMode('pieza'); v.setAutoRotate(0.5); setReel({ phase: 'pieza' }) })
    later(tPieza + 6500, () => { setReel({ phase: 'caos' }); v.setAutoRotate(0.12); runChaos(6, true) })
    later(tPieza + 6500 + 11000, () => setReel({ phase: 'fin' }))
  }
  const exitReel = () => { clearTimers(); reelClass(false); setReel(null); viewerRef.current?.setAutoRotate(0.12); viewerRef.current?.setFraming(1, 0) }
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') exitReel() }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const m = solid?.metrics
  const growth = o.diverge.eps6 !== null && o.diverge.eps9 !== null && o.diverge.eps9 > o.diverge.eps6 ? Math.pow(1000, 1 / (o.diverge.eps9 - o.diverge.eps6)) : null
  const progress = mode === 'danza' ? 0 : Math.min(1, head.t / Math.max(1e-9, head.span))
  const chaosText = chaos ? (chaos.split === null ? (busy ? '' : `Tras ${chaos.periods} vueltas siguen juntas: esta órbita resiste una diferencia de ${chaos.eps.toExponential(0)}.`) : `Se separan a la vuelta ${fmt(chaos.split / o.T, 1)}.`) : ''

  return (
    <div>
      <div className={reel ? 'tr-reel' : ''} data-phase={reel?.phase} style={reel ? { position: 'fixed', inset: 0, zIndex: 400, background: '#000', display: 'grid', placeItems: 'center' } : {}}>
        <div style={reel ? { position: 'relative', height: 'min(100vh, 100vw * 16 / 9)', aspectRatio: '9 / 16', background: '#020308', overflow: 'hidden' } : { position: 'relative', height: 'min(78vh, 740px)', minHeight: 440, background: '#020308', border: '1px solid #ffffff14' }}>
          <TrenzaViewer onReady={onViewer} onTick={(t, span) => setHead({ t, span })} />
          {!reel && (
            <>
              <div style={{ position: 'absolute', left: 14, top: 12, fontSize: 11, letterSpacing: 1.8, color: '#ffffffcc', textShadow: '0 1px 4px #000', pointerEvents: 'none' }}>
                <div style={{ color: ACCENT }}>{o.name}</div>
                <div>{mode === 'danza' ? 'DANZA · vista desde arriba' : mode === 'trenza' ? 'TRENZA · el tiempo sube' : mode === 'pieza' ? 'PIEZA' : 'CAOS · dos universos'}</div>
                <div style={{ color: '#7f96b2' }}>t = {fmt(mode === 'danza' ? head.t % o.T : head.t, 2)} · período {fmt(o.T, 3)}</div>
                {busy && <div style={{ color: '#ffd27c' }}>{busy}</div>}
              </div>
              <div style={{ position: 'absolute', right: 10, top: 10, display: 'flex', gap: 6 }}>
                <Chip on={palette === 'resina'} onClick={() => setPalette((x) => (x === 'resina' ? 'trenza' : 'resina'))} title="La pieza de un solo color, como saldría impresa">RESINA</Chip>
              </div>
              {mode === 'caos' && chaos && (
                <div style={{ position: 'absolute', left: 14, bottom: 14, right: 70, fontSize: 11.5, lineHeight: 1.7, color: '#fff', textShadow: '0 1px 4px #000', pointerEvents: 'none' }}>
                  <span style={{ color: '#ff5a48' }}>■</span> la misma órbita con p₁ corrido en {chaos.eps.toExponential(0)} · {chaosText}
                </div>
              )}
            </>
          )}
          {reel && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', fontFamily: mono }}>
              <div style={{ position: 'absolute', top: '9%', left: 0, right: 0, padding: '0 6%', textAlign: 'center', opacity: reel.phase === 'titulo' ? 1 : 0, transition: 'opacity 1.2s' }}>
                <div style={{ fontSize: 'clamp(10px, 1.6vh, 15px)', letterSpacing: 5, color: ACCENT }}>NEO·PROXY // GRAVEDAD</div>
                <div style={{ fontSize: 'clamp(30px, 7vh, 72px)', letterSpacing: 10, color: '#fff', fontWeight: 700, textShadow: '0 0 30px #ffc75a88', marginTop: 6 }}>TRENZA</div>
                <div style={{ fontSize: 'clamp(11px, min(1.9vh, 3.8vw), 18px)', color: '#cfe6ff', marginTop: 8 }}>tres soles · órbita {o.name.toLowerCase()}</div>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '56px 7% 5.5vh', textAlign: 'center', textShadow: '0 1px 6px #000', background: 'linear-gradient(transparent, #000000b0)', opacity: reel.phase === 'titulo' || reel.phase === 'fin' ? 0 : 1, transition: 'opacity .8s' }}>
                <div style={{ fontSize: 'clamp(13px, min(2.5vh, 4.8vw), 24px)', color: '#fff', fontWeight: 700, letterSpacing: 1.5, lineHeight: 1.45 }}>
                  {reel.phase === 'danza' && 'Tres soles atrapados en un baile que se repite.'}
                  {reel.phase === 'trenza' && 'Si el tiempo sube, su baile es una trenza.'}
                  {reel.phase === 'pieza' && '◆ La trenza, sólida. Lista para imprimir.'}
                  {reel.phase === 'caos' && (chaos?.split != null ? `Una millonésima de diferencia… y se separan a la vuelta ${fmt(chaos.split / o.T, 1)}.` : busy || !chaos ? 'Una millonésima de diferencia…' : `Una millonésima de diferencia… y ${o.name === 'OCHO' ? 'el ocho' : 'esta órbita'} la resiste.`)}
                </div>
                <div style={{ fontSize: 'clamp(10px, 1.6vh, 14px)', color: '#9fb4cc', letterSpacing: 2, marginTop: 8 }}>{reel.phase === 'caos' ? <><span style={{ color: '#ff5a48' }}>rojo</span>: la órbita con p₁ + 0,000001</> : `${o.name} · t = ${fmt(head.t % (o.T * (reel.phase === 'danza' ? 1 : 1e9)), 1)}`}</div>
              </div>
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: reel.phase === 'fin' ? 1 : 0, transition: 'opacity 1s', background: reel.phase === 'fin' ? '#000c' : 'transparent' }}>
                <div style={{ textAlign: 'center', padding: '0 8%' }}>
                  <div style={{ fontSize: 'clamp(30px, 7vh, 72px)', letterSpacing: 10, color: '#fff', fontWeight: 700 }}>TRENZA</div>
                  <div style={{ fontSize: 'clamp(12px, min(2.2vh, 4.2vw), 22px)', color: '#cfe6ff', margin: '14px 0' }}>Órbitas reales de tres cuerpos, convertidas en pieza.</div>
                  <div style={{ fontSize: 'clamp(12px, 2.2vh, 22px)', color: '#ffd98f', letterSpacing: 2 }}>neoproxy.art/trenza</div>
                </div>
              </div>
              <button type="button" onClick={exitReel} style={{ position: 'absolute', top: 10, right: 10, pointerEvents: 'auto', opacity: reel.phase === 'titulo' ? 1 : 0.3, fontFamily: mono, fontSize: 12, letterSpacing: 2, padding: '8px 12px', background: '#000a', color: '#9fb4cc', border: '1px solid #ffffff30', cursor: 'pointer' }}>SALIR ✕</button>
            </div>
          )}
        </div>
      </div>

      {/* modos */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', margin: '12px 0' }}>
        {(['danza', 'trenza', 'pieza', 'caos'] as TrenzaMode[]).map((x) => (
          <button key={x} type="button" className="press" onClick={() => goMode(x)}
            style={{ minHeight: 46, padding: '0 20px', fontFamily: mono, fontWeight: 700, fontSize: 12.5, letterSpacing: 2.5, cursor: 'pointer', border: 'none', background: mode === x ? (x === 'caos' ? 'linear-gradient(90deg,#ff5a48,#ff4fa3)' : 'linear-gradient(90deg,#5fe3ff,#ffc75a)') : '#0b111a', color: mode === x ? '#04060a' : '#9fb4cc' }}>
            {x === 'danza' ? '◎ DANZA' : x === 'trenza' ? '⟰ TRENZA' : x === 'pieza' ? '◆ PIEZA' : '✶ CAOS'}
          </button>
        ))}
        <Chip on={false} onClick={() => { const n = !playing; setPlaying(n); viewerRef.current?.setPlaying(n) }}>{playing ? '❚❚ PAUSA' : '▶ SEGUIR'}</Chip>
        <Chip on={false} onClick={() => playStory(true)} title="Danza, trenza y pieza, de nuevo">↺ DESDE EL INICIO</Chip>
        <span style={{ flex: 1 }} />
        <Chip on={!!reel} onClick={enterReel} disabled={!ready} color="#ffd27c" title="Pantalla vertical que corre sola: para grabarla con el teléfono">▣ MODO REEL</Chip>
      </div>
      {err && <p style={{ color: '#ffb86b', fontSize: 12 }}>{err}</p>}

      {/* catálogo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6, marginBottom: 18 }}>
        {ORBITS.map((x) => (
          <button key={x.id} type="button" className="press" onClick={() => pickOrbit(x.id)} aria-pressed={x.id === p.id}
            style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 10px', fontFamily: mono, textAlign: 'left', cursor: 'pointer', background: x.id === p.id ? '#ffc75a18' : '#070b11', border: `1px solid ${x.id === p.id ? ACCENT : '#ffffff14'}` }}>
            <Glyph pts={glyphs[x.id]} on={x.id === p.id} />
            <span>
              <span style={{ display: 'block', fontSize: 11.5, letterSpacing: 1.4, color: x.id === p.id ? ACCENT : '#cfe0f2' }}>{x.name}</span>
              <span style={{ display: 'block', fontSize: 10.5, color: '#6f86a3', marginTop: 2 }}>{x.word.length} cruces · T {fmt(x.T, 1)}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="tr-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(0,1fr)', gap: 22 }}>
        <section style={{ background: '#080c12', borderStyle: 'solid', borderWidth: '1px 1px 1px 3px', borderColor: `${ACCENT}2a ${ACCENT}2a ${ACCENT}2a ${ACCENT}`, padding: '18px 20px' }}>
          <div style={{ fontSize: 11.5, letterSpacing: 3, color: ACCENT, marginBottom: 10 }}>LA PALABRA DE LA TRENZA · {o.name}</div>
          <BraidDiagram word={o.word} start={START} colors={COLORS} progress={mode === 'danza' ? 0 : mode === 'trenza' ? progress : 1} />
          <div style={{ fontSize: 14, color: '#fff', margin: '12px 0 8px', wordBreak: 'break-word', lineHeight: 1.6 }}>{wordText(o.word)}</div>
          <p style={{ fontSize: 11.5, lineHeight: 1.85, color: '#8fa8c4', margin: 0 }}>
            Cada letra es un cruce: dos soles vecinos cambian de lugar de izquierda a derecha, y el signo dice cuál pasa por delante. Esta palabra es la huella topológica de la órbita: {o.word.length} cruces en un período de {fmt(o.T, 3)}.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginTop: 14 }}>
            <Stat k="CIERRE TRAS UN PERÍODO" v={o.returnError.toExponential(0).replace('e', '·10^')} title={`Con las 6 cifras publicadas: ${o.published.returnError}`} />
            <Stat k="DERIVA DE LA ENERGÍA" v={o.energyDrift.toExponential(0).replace('e', '·10^')} />
            <Stat k="ACERCAMIENTO MÍNIMO" v={fmt(o.minDist, 3)} title="Menor distancia entre dos soles (la separación inicial entre extremos es 2)" />
            <Stat k="AGUANTA (Δ = 10⁻⁶)" v={o.diverge.eps6 === null ? `> ${o.diverge.horizon} vueltas` : `${fmt(o.diverge.eps6, 1)} vueltas`} warn={o.diverge.eps6 !== null && o.diverge.eps6 < 6} />
            {growth && <Stat k="CRECE EL ERROR" v={`×${fmt(growth, 0)} por vuelta`} title="Cuánto se multiplica una diferencia pequeña en cada período (medido entre 10⁻⁹ y 10⁻⁶)" />}
          </div>
        </section>
        <section style={{ background: '#080c12', border: '1px solid #ffffff12', padding: '18px 20px', display: 'grid', gap: 15, alignContent: 'start' }}>
          <div style={{ fontSize: 11.5, letterSpacing: 3, color: '#9fe8ff' }}>LA PIEZA</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, letterSpacing: 1.5, color: '#8fa8c4', marginRight: 4 }}>VUELTAS</span>
            {[1, 2, 3].map((n) => <Chip key={n} on={p.periods === n} onClick={() => changePiece({ periods: n })}>{n}</Chip>)}
            <span style={{ width: 10 }} />
            <Chip on={p.plates === 'ambas'} onClick={() => changePiece({ plates: p.plates === 'ambas' ? 'base' : 'ambas' })} title="Una segunda barra arriba: el diagrama clásico de una trenza entre dos barras (necesita soportes)">TAPA</Chip>
          </div>
          <Slider label="ALTO DEL TIEMPO" value={p.aspect} min={1} max={3} step={0.05} readout={`${fmt(p.aspect, 2)} × el ancho`} onChange={(v) => changePiece({ aspect: v })} />
          <Slider label="GROSOR DE LAS HEBRAS" value={p.radius} min={0.03} max={0.07} step={0.001} readout={fmt(p.radius * 100, 1) + ' %'} onChange={(v) => changePiece({ radius: v })} />
          <Slider label="GROSOR SEGÚN LA VELOCIDAD" value={p.speedW} readout={p.speedW < 0.05 ? 'parejo' : fmt(p.speedW, 2)} onChange={(v) => changePiece({ speedW: v })} />
          <div style={{ fontSize: 11, color: '#6f86a3', lineHeight: 1.7 }}>Donde un sol va lento la hebra engorda: pasa más tiempo ahí. Más alto, menos voladizos.</div>
          <div style={{ borderTop: '1px solid #ffffff12', paddingTop: 14 }}>
            <div style={{ fontSize: 11.5, letterSpacing: 3, color: '#ff8a7a', marginBottom: 10 }}>CAOS</div>
            <Slider label="DIFERENCIA EN LA VELOCIDAD INICIAL" value={epsK} min={3} max={12} step={1} readout={`10⁻${String(epsK).split('').map((ch) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+ch]).join('')}`} onChange={(v) => setEpsK(v)} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
              <Chip on={mode === 'caos'} color="#ff8a7a" onClick={() => runChaos()}>✶ DOS UNIVERSOS</Chip>
              <span style={{ fontSize: 11.5, color: '#cfe0f2' }}>{mode === 'caos' ? chaosText : ''}</span>
            </div>
          </div>
        </section>
      </div>

      <section style={{ marginTop: 22 }}>
        <div style={{ fontSize: 11.5, letterSpacing: 3, color: '#9fe8ff', marginBottom: 10 }}>MEDIDAS{solid ? '' : busy ? ' · ' + busy : ' · ABRE ◆ PIEZA PARA MEDIRLA'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: 8 }}>
          <Stat k="MEDIDAS" v={solid ? `${fmt(solid.widthMm, 0)} × ${fmt(solid.heightMm, 0)} mm` : '…'} />
          <Stat k="TRIÁNGULOS" v={m ? m.tris.toLocaleString('es-CL') : '…'} />
          <Stat k="PIEZAS" v={m ? String(m.components) : '…'} warn={!!m && m.components > 1} />
          <Stat k="GÉNERO" v={m ? String(m.genus) : '…'} title="Agujeros de la pieza: cada lazo cerrado entre hebras y placas" />
          <Stat k="VOLADIZO" v={m ? `${fmt(100 * m.overhangFrac, 0)} %` : '…'} warn={!!m && m.overhangFrac > 0.15} />
          <Stat k="PARED MÍNIMA (P10)" v={m ? `${fmt(m.wallP10Mm, 2)} mm` : '…'} warn={!!m && m.wallP10Mm < 1} />
          <Stat k="PUNTAJE DE IMPRESIÓN" v={m ? fmt(m.printScore, 2) : '…'} warn={!!m && m.printScore < 0.5} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8, marginTop: 14 }}>
          <button className="press" onClick={exportStl} disabled={!solid || exporting} style={{ minHeight: 46, background: ACCENT, color: '#02060a', border: 'none', fontFamily: mono, fontWeight: 700, fontSize: 12, letterSpacing: 1.5, cursor: 'pointer', opacity: solid ? 1 : 0.45 }}>{exporting ? 'CALCULANDO STL…' : `DESCARGAR STL (${SIZE_MM} MM)`}</button>
          <button className="press" onClick={exportJson} disabled={!solid} style={{ minHeight: 46, background: 'transparent', border: '1px solid #4a6080', color: '#9fb4cc', fontFamily: mono, fontSize: 11.5, letterSpacing: 1.5, cursor: 'pointer', opacity: solid ? 1 : 0.45 }}>RECETA + FICHA (JSON)</button>
          <button className="press" onClick={share} style={{ minHeight: 46, background: 'transparent', border: '1px solid #4a6080', color: '#9fb4cc', fontFamily: mono, fontSize: 11.5, letterSpacing: 1.5, cursor: 'pointer' }}>{copied ? 'ENLACE COPIADO' : 'COPIAR ENLACE A ESTA PIEZA'}</button>
          <a href={`https://wa.me/${WA}`} onClick={(e) => { e.currentTarget.href = waHref() }} target="_blank" rel="noopener noreferrer" className="press" style={{ minHeight: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#25d366', color: '#04210f', fontWeight: 700, fontSize: 12, letterSpacing: 1.5, textDecoration: 'none' }}>PEDIR ESTA PIEZA EN RESINA</a>
        </div>
      </section>
      <style>{`
        .tr-range { -webkit-appearance: none; appearance: none; height: 3px; background: #ffffff2a; outline: none; border-radius: 2px; }
        .tr-range::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${ACCENT}; border: 2px solid #02060a; cursor: pointer; }
        .tr-range::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: ${ACCENT}; border: 2px solid #02060a; cursor: pointer; }
        @media (max-width: 900px) { .tr-grid { grid-template-columns: 1fr !important; } }
        html.tr-reel-on, html.tr-reel-on body { overflow: hidden !important; }
        html.tr-reel-on .neo-organism-filter { filter: none !important; transition: none !important; }
        html.tr-reel-on .tr-layer { z-index: 2000 !important; }
        .tr-reel button[aria-label="Acercar"], .tr-reel button[aria-label="Alejar"], .tr-reel button[aria-label="Restablecer la vista"] { display: none !important; }
      `}</style>
    </div>
  )
}
