'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { LAWS, LAW_IDS, topologicalCharge, type LawId, type Tool } from '@/lib/capas/laws'
import { Session, defaultRecipe, decodeRecipe, encodeRecipe, recipeId, volumeHash, WORLD, type Recipe } from '@/lib/capas/session'
import { colorizeField, LAW_STYLE } from '@/lib/capas/style'
import { Mesher, exportInWorker } from '@/lib/capas/client'
import { boxWidthMm, ASPECT_MAX, ASPECT_MIN } from '@/lib/capas/mesh'
import { SHAPES, footprint, type Shape } from '@/lib/capas/volume'
import type { Timeline as TL } from '@/lib/capas/events'
import type { Metrics } from '@/lib/specimens/analyze'
import Timeline, { EVENT_COLOR, EVENT_LABEL } from './Timeline'
import type { ViewerApi } from './CapasViewer'

const CapasViewer = dynamic(() => import('./CapasViewer'), { ssr: false })

const mono = "'Space Mono', monospace"
const WA = '56993550010'
const SIZE_MM = 60, RES_LIVE = 64, RES_SETTLED = 104
const EXPORT_RES = { borrador: 110, normal: 150, fina: 200 } as const
const MAX_STROKES = 600
const fmt = (n: number, d = 1) => n.toFixed(d).replace('.', ',')
const pct = (n: number, d = 1) => `${fmt(100 * n, d)} %`

type MeshInfo = { metrics: Metrics; aspect: number; auto: boolean; overhangPhys: number; widthMm: number; heightMm: number; layerMm: number; ms: number; res: number }
type Params = Omit<Recipe, 'strokes' | 'knobs'>
const paramsOf = (r: Recipe): Params => { const { strokes: _s, knobs: _k, ...p } = r; void _s; void _k; return p }

function Slider({ label, value, min, max, step, onChange, readout, disabled }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; readout: string; disabled?: boolean }) {
  return (
    <label style={{ display: 'block', opacity: disabled ? 0.45 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 9.5, letterSpacing: 1.5, color: '#8fa8c4', marginBottom: 6 }}>
        <span>{label}</span><span style={{ color: '#fff' }}>{readout}</span>
      </div>
      <input type="range" className="cap-range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%' }} />
    </label>
  )
}

function Chip({ on, onClick, children, color, title }: { on: boolean; onClick: () => void; children: React.ReactNode; color?: string; title?: string }) {
  const c = color ?? '#9fe8ff'
  return (
    <button type="button" className="press" title={title} onClick={onClick} style={{ minHeight: 34, padding: '0 12px', fontFamily: mono, fontSize: 10, letterSpacing: 1.5, cursor: 'pointer', background: on ? `${c}22` : 'transparent', border: `1px solid ${on ? c : '#ffffff22'}`, color: on ? c : '#8fa8c4' }}>
      {children}
    </button>
  )
}

function Stat({ k, v, hint, warn }: { k: string; v: string; hint?: string; warn?: boolean }) {
  return (
    <div style={{ padding: '10px 12px', background: '#080c12', border: '1px solid #ffffff10' }} title={hint}>
      <div style={{ fontSize: 8.5, letterSpacing: 1.8, color: '#6f86a3', marginBottom: 5 }}>{k}</div>
      <div style={{ fontSize: 14, color: warn ? '#ffb86b' : '#fff' }}>{v}</div>
    </div>
  )
}

export default function CapasApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewerRef = useRef<ViewerApi | null>(null)
  const mesherRef = useRef<Mesher | null>(null)

  const [params, setParams] = useState<Params>(() => paramsOf(defaultRecipe('coral')))
  const paramsRef = useRef(params); paramsRef.current = params
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(2)
  const [tool, setTool] = useState<Tool>(1)
  const [brush, setBrush] = useState(6)
  const [count, setCount] = useState(1)
  const [cutUi, setCutUi] = useState(0)
  const [follow, setFollow] = useState(true)
  const [knob, setKnob] = useState(params.knob)
  const [ffUi, setFfUi] = useState(0)
  const [charge, setCharge] = useState<{ plus: number; minus: number; total: number } | null>(null)
  const [tl, setTl] = useState<TL | null>(null)
  const [info, setInfo] = useState<MeshInfo | null>(null)
  const [meshing, setMeshing] = useState(false)
  const [rid, setRid] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [strokesN, setStrokesN] = useState(0)
  const [exp, setExp] = useState<{ res: keyof typeof EXPORT_RES; state: 'idle' | 'busy' | 'error' }>({ res: 'normal', state: 'idle' })
  const [copied, setCopied] = useState(false)
  const [markers, setMarkers] = useState(true)
  const [replay, setReplay] = useState(false)

  const st = useRef({
    sess: null as Session | null, ff: 0, follow: true, cut: 0, playing: true, speed: 2, tool: 1 as Tool, brush: 6,
    dirty: true, lastReq: 0, lastChange: 0, lastRes: 0, painting: false, last: null as [number, number] | null,
    hover: null as [number, number] | null, replay: false, meshCount: 1, aspect: 1, hashTimer: 0 as unknown as ReturnType<typeof setTimeout>, reqId: 0,
  })
  st.current.playing = playing; st.current.speed = speed; st.current.tool = tool; st.current.brush = brush

  // ---- sesión ----------------------------------------------------------------------
  const scheduleHash = useCallback(() => {
    clearTimeout(st.current.hashTimer)
    st.current.hashTimer = setTimeout(() => {
      const s = st.current.sess
      if (!s) return
      const r = s.recipe
      const enc = encodeRecipe(r)
      setRid(recipeId(r))
      setStrokesN(r.strokes.length)
      setShareUrl(`${window.location.origin}/capas#r=${enc}`)
      try { window.history.replaceState(null, '', `#r=${enc}`) } catch { /* sin historial */ }
    }, 600)
  }, [])

  const start = useCallback((rec: Recipe, ff: number) => {
    const s = st.current
    s.sess = new Session(rec, true)
    s.ff = ff; s.follow = true; s.replay = false; s.cut = 0; s.dirty = true; s.lastRes = 0
    setParams(paramsOf(rec)); setKnob(rec.knob); setFollow(true); setReplay(false)
    setTl(null); setInfo(null); setCount(1); setCutUi(0)
    viewerRef.current?.setMesh(null, rec.law)
    viewerRef.current?.setEvents([])
    scheduleHash()
  }, [scheduleHash])

  // reconstruye la sesión con otros parámetros que sí cambian la simulación; `keep` conserva las pinceladas
  const restart = useCallback((patch: Partial<Recipe>, keep: boolean) => {
    const s = st.current.sess
    const prev = s ? s.count : 1
    const base: Recipe = { ...(s ? s.recipe : defaultRecipe('coral')), ...patch }
    if (!keep) { base.strokes = []; base.knobs = [] }
    start(base, keep ? Math.min(prev, base.slices) : 0)
  }, [start])

  const setLaw = useCallback((law: LawId) => {
    const seed = st.current.sess?.recipe.seed ?? 7
    start(defaultRecipe(law, seed), 0)
  }, [start])

  // parámetros que solo cambian cómo se esculpe (no la simulación)
  const setView = useCallback((patch: Partial<Pick<Recipe, 'theta' | 'aspect' | 'shape' | 'base'>>) => {
    const s = st.current
    if (s.sess) Object.assign(s.sess.recipe, patch)
    setParams((p) => ({ ...p, ...patch }))
    s.dirty = true; s.lastChange = performance.now()
    scheduleHash()
  }, [scheduleHash])

  useEffect(() => {
    mesherRef.current = new Mesher()
    const h = typeof window !== 'undefined' ? window.location.hash : ''
    const m = /#r=([A-Za-z0-9_-]+)/.exec(h)
    const decoded = m ? decodeRecipe(m[1]) : null
    if (decoded) start(decoded, decoded.slices)
    else start(defaultRecipe('coral'), 0)
    return () => { mesherRef.current?.dispose(); mesherRef.current = null; clearTimeout(st.current.hashTimer) }
  }, [start])

  // ---- lazo: avanza el mundo, lo dibuja y actualiza el visor ------------------------
  useEffect(() => {
    let raf = 0, n = 0, lastCount = 0
    const off = document.createElement('canvas'); off.width = off.height = WORLD
    const offCtx = off.getContext('2d')!
    const img = offCtx.createImageData(WORLD, WORLD)
    const field = new Uint8Array(WORLD * WORLD), planeBuf = new Uint8Array(WORLD * WORLD * 4)
    const sl = WORLD * WORLD
    const frame = () => {
      raf = requestAnimationFrame(frame)
      const s = st.current, sess = s.sess, p = paramsRef.current
      if (!sess) return
      n++
      if (s.ff > sess.count) sess.advance(Math.min(16, s.ff - sess.count))
      else if (s.playing && !sess.full) sess.advance(s.speed)
      if (s.replay) {
        s.cut += 1.1
        if (s.cut >= sess.count - 1) { s.replay = false; s.follow = true; setReplay(false); setFollow(true) }
      }
      const cutVal = s.follow ? sess.count - 1 : Math.min(s.cut, sess.count - 1)
      const atPresent = cutVal >= sess.count - 1 - 1e-6
      if (atPresent) sess.currentField(field)
      else { const k = Math.round(cutVal); field.set(sess.data.subarray(k * sl, (k + 1) * sl)) }
      const rlim2 = footprint(p.shape, s.aspect, p.slices)(cutVal)
      if (sess.count !== lastCount) { s.dirty = true; s.lastChange = performance.now(); lastCount = sess.count }

      // lienzo 2D
      const c = canvasRef.current
      if (c) {
        const ctx = c.getContext('2d')!
        colorizeField(field, WORLD, WORLD, p.theta, p.law, img.data, { rlim2 })
        offCtx.putImageData(img, 0, 0)
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(off, 0, 0, c.width, c.height)
        const k = c.width / WORLD
        if (rlim2 !== Infinity && rlim2 > 0.03) { // el contorno de la pieza dentro del mundo
          ctx.strokeStyle = `${LAW_STYLE[p.law].accent}99`; ctx.lineWidth = 1.2; ctx.setLineDash([5, 5])
          ctx.beginPath(); ctx.arc(c.width / 2, c.height / 2, Math.sqrt(rlim2) * c.width / 2, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([])
        }
        if (s.hover && atPresent && !sess.full) {
          ctx.strokeStyle = s.tool > 0 ? '#ffffffcc' : '#ff5566cc'; ctx.lineWidth = 1.5
          ctx.beginPath(); ctx.arc((s.hover[0] + 0.5) * k, (s.hover[1] + 0.5) * k, Math.max(1, s.brush) * k, 0, Math.PI * 2); ctx.stroke()
        }
        if (!atPresent) {
          ctx.fillStyle = '#000000b0'; ctx.fillRect(8, 8, 190, 24)
          ctx.fillStyle = '#ffd27c'; ctx.font = `11px ${mono}`; ctx.fillText(`PASADO · CAPA ${Math.round(cutVal) + 1}`, 16, 24)
        }
      }
      // visor 3D
      const v = viewerRef.current
      if (v) {
        // la malla llega con algo de retraso: en modo "ahora" el corte no pasa de su última capa
        v.setCut(s.follow ? Math.min(cutVal, s.meshCount - 1) : cutVal)
        colorizeField(field, WORLD, WORLD, p.theta, p.law, planeBuf, { plane: true, rlim2 })
        v.setSlice(planeBuf, WORLD, WORLD)
      }
      // reflejo en la interfaz, ~10 veces por segundo
      if (n % 6 === 0) {
        setCount(sess.count); setCutUi(cutVal); setFfUi(s.ff > sess.count ? sess.count : 0)
        if (p.law === 'defectos') setCharge(topologicalCharge(sess.world)); else setCharge(null)
      }
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ---- mallado en segundo plano ------------------------------------------------------
  useEffect(() => {
    const iv = setInterval(async () => {
      const s = st.current, sess = s.sess, mesher = mesherRef.current
      if (!sess || !mesher || sess.count < 6) return
      const now = performance.now()
      let res = 0
      if (s.dirty && now - s.lastReq > 260) res = RES_LIVE
      else if (!s.dirty && now - s.lastChange > 700 && s.lastRes < RES_SETTLED && !(s.playing && !sess.full)) res = RES_SETTLED
      if (!res) return
      s.dirty = false; s.lastReq = now; s.lastRes = res
      const p = paramsRef.current, id = ++s.reqId, snapCount = sess.count
      setMeshing(true)
      const reply = await mesher.request(sess.snapshot(), { theta: p.theta, aspect: p.aspect, planned: p.slices, shape: p.shape, base: p.base, res, sizeMm: SIZE_MM })
      if (id === s.reqId) setMeshing(false)
      if (!reply || st.current.sess !== sess) return
      const v = viewerRef.current
      if (reply.timeline) {
        setTl(reply.timeline)
        const top = [...reply.timeline.events].sort((a, b) => b.area - a.area).slice(0, 90)
        v?.setEvents(top)
      }
      const o = reply.out
      if (!o) { v?.setMesh(null, p.law); setInfo(null); return }
      st.current.meshCount = snapCount; st.current.aspect = o.aspect
      v?.setMesh({
        positions: o.positions, indices: o.indices, times: o.times, planned: p.slices, sliceOfZ: o.sliceOfZ,
        fullHeightMm: o.layerMm * (p.slices - 1), boxMm: boxWidthMm(o.aspect, SIZE_MM),
      }, p.law)
      setInfo({ metrics: o.metrics, aspect: o.aspect, auto: o.auto, overhangPhys: o.overhangPhys, widthMm: o.widthMm, heightMm: o.heightMm, layerMm: o.layerMm, ms: reply.ms, res })
    }, 120)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => { viewerRef.current?.setMarkers(markers) }, [markers])

  // ---- pincel ------------------------------------------------------------------------
  const cell = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect()
    return [Math.min(WORLD - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * WORLD))), Math.min(WORLD - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * WORLD)))]
  }
  const canPaint = () => {
    const s = st.current, sess = s.sess
    return !!sess && !sess.full && s.ff <= sess.count && (s.follow || s.cut >= sess.count - 1) && sess.recipe.strokes.length < MAX_STROKES
  }
  const stamp = (e: React.PointerEvent<HTMLCanvasElement>, force: boolean) => {
    const s = st.current, sess = s.sess
    const [x, y] = cell(e)
    s.hover = [x, y]
    if (!s.painting || !sess || !canPaint()) return
    if (!force && s.last && Math.hypot(x - s.last[0], y - s.last[1]) < Math.max(1.5, s.brush * 0.6)) return
    s.last = [x, y]
    sess.paint(x, y, s.brush, ((e.button === 2 || (e.buttons & 2) !== 0 || e.altKey) ? -s.tool : s.tool) as Tool)
    s.dirty = true; s.lastChange = performance.now()
    scheduleHash()
  }

  // ---- acciones ----------------------------------------------------------------------
  const currentRecipe = (): Recipe => ({ ...st.current.sess!.recipe })
  const link = () => (st.current.sess ? `${window.location.origin}/capas#r=${encodeRecipe(currentRecipe())}` : shareUrl)
  const share = async () => {
    try { await navigator.clipboard.writeText(link()); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { window.prompt('Copia el enlace:', link()) }
  }
  const download = (blob: Blob, name: string) => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000)
  }
  const exportStl = async () => {
    const sess = st.current.sess
    if (!sess || exp.state === 'busy') return
    setExp((e) => ({ ...e, state: 'busy' }))
    try {
      const p = paramsRef.current, r = sess.recipe
      const { promise } = exportInWorker(sess.snapshot(), { theta: p.theta, aspect: p.aspect, planned: p.slices, shape: p.shape, base: p.base, res: EXPORT_RES[exp.res], sizeMm: SIZE_MM })
      const out = await promise
      if (!out.stl) throw new Error('sin malla')
      download(new Blob([out.stl], { type: 'model/stl' }), `capas-${recipeId(r)}-${r.law}.stl`)
      setExp((e) => ({ ...e, state: 'idle' }))
    } catch { setExp((e) => ({ ...e, state: 'error' })) }
  }
  const exportJson = () => {
    const sess = st.current.sess
    if (!sess || !info) return
    const r = currentRecipe(), m = info.metrics
    const doc = {
      id: recipeId(r), generado: new Date().toISOString(), huella_de_la_pila: volumeHash(sess.volume()),
      nota: 'Receta determinista: la misma lista de operaciones reproduce la misma pila de capas bit a bit.',
      receta: r, enlace: link(),
      pieza: {
        dimension_mayor_mm: SIZE_MM, ancho_mm: Number(info.widthMm.toFixed(2)), alto_mm: Number(info.heightMm.toFixed(2)),
        aspecto_alto_ancho: Number(info.aspect.toFixed(3)), aspecto_automatico: info.auto, capas_de_simulacion: sess.count,
        mm_por_capa_de_simulacion: Number(info.layerMm.toFixed(4)), orientacion: '+z (el tiempo es la altura; no reorientar)',
        triangulos: m.tris, cerrada: m.closed, genero: m.genus, partes_sueltas_descartadas: m.components - 1,
        voladizo_malla: Number(m.overhangFrac.toFixed(4)), voladizo_estimado_del_campo: Number(info.overhangPhys.toFixed(4)),
        pared_minima_p10_mm: Number(m.wallP10Mm.toFixed(2)), puntuacion_de_impresion: Number(m.printScore.toFixed(3)),
      },
      linaje: tl ? { ...tl.counts, partes_simultaneas_maximas: tl.peak } : null,
      impresion_sugerida: {
        tecnologia: 'resina (SLA/MSLA)', capa_um: 50, base_incluida: r.base, soportes_necesarios_por_nacimientos: tl?.counts.birth ?? null,
        capas_de_impresion_por_capa_de_simulacion: Number((info.layerMm / 0.05).toFixed(1)),
        advertencia: 'Sin pruebas de impresión real todavía: validar con una pieza de ensayo antes de producir.',
      },
    }
    download(new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' }), `capas-${recipeId(r)}-${r.law}.json`)
  }

  const L = LAWS[params.law]
  const accent = LAW_STYLE[params.law].accent
  const full = count >= params.slices
  const atPresent = follow || cutUi >= count - 1 - 1e-6
  const m = info?.metrics
  const waText = `Hola, quiero la pieza CAPAS ${rid || recipeId({ ...defaultRecipe(params.law) })} (${L.label.toLowerCase()}) impresa en resina. Receta: ${shareUrl}`
  const ffBusy = ffUi > 0

  return (
    <div>
      <div className="cap-main" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 520px) minmax(0, 1fr)', gap: 22, alignItems: 'start' }}>
        {/* ---- mundo 2D ---- */}
        <section style={{ minWidth: 0 }}>
          <div role="tablist" aria-label="Leyes del mundo" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
            {LAW_IDS.map((id) => {
              const c = LAW_STYLE[id].accent, on = id === params.law
              return (
                <button key={id} role="tab" aria-selected={on} className="press" onClick={() => setLaw(id)} style={{ minHeight: 44, fontFamily: mono, fontSize: 10, letterSpacing: 1.6, cursor: 'pointer', background: on ? `${c}22` : '#080c12', border: `1px solid ${on ? c : '#ffffff1a'}`, borderTop: `2px solid ${c}`, color: on ? c : '#8fa8c4' }}>
                  {LAWS[id].label}
                </button>
              )
            })}
          </div>
          <div style={{ position: 'relative', border: `1px solid ${accent}44`, background: '#03060a' }}>
            <canvas
              ref={canvasRef} width={512} height={512}
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); st.current.painting = true; st.current.last = null; stamp(e, true) }}
              onPointerMove={(e) => stamp(e, false)}
              onPointerUp={() => { st.current.painting = false; st.current.last = null }}
              onPointerCancel={() => { st.current.painting = false }}
              onPointerLeave={() => { st.current.hover = null }}
              onContextMenu={(e) => e.preventDefault()}
              style={{ display: 'block', width: '100%', aspectRatio: '1 / 1', cursor: 'crosshair', touchAction: 'none' }}
              aria-label={`Mundo 2D de la ley ${L.label}: arrastra para ${L.seedLabel[0].toLowerCase()}`}
            />
            <div style={{ position: 'absolute', left: 10, bottom: 8, fontSize: 9, letterSpacing: 1.6, color: '#ffffffaa', textShadow: '0 1px 3px #000' }}>
              MUNDO {WORLD}×{WORLD} · EL TIEMPO PRESENTE
            </div>
            {ffBusy && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: '#000000a0', fontSize: 11, letterSpacing: 2, color: accent }}>RECONSTRUYENDO UNIVERSO · {ffUi}/{params.slices}</div>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0' }}>
            <Chip on={tool === 1} onClick={() => setTool(1)} color={accent}>{L.seedLabel[0]}</Chip>
            <Chip on={tool === -1} onClick={() => setTool(-1)} color="#ff6677">{L.seedLabel[1]}</Chip>
            <div style={{ flex: '1 1 150px', minWidth: 150 }}><Slider label="PINCEL" value={brush} min={2} max={16} step={1} onChange={setBrush} readout={`${brush} celdas`} /></div>
          </div>
          <div style={{ fontSize: 10, lineHeight: 1.8, color: '#7f96b2', minHeight: 36 }}>
            {!atPresent ? <span style={{ color: '#ffd27c' }}>Estás viendo el pasado. Pulsa AHORA para volver al presente y pintar.</span>
              : full ? <span style={{ color: '#ffd27c' }}>La pieza está completa: ya no entran más capas. Reinicia o crea un universo nuevo.</span>
              : strokesN >= MAX_STROKES ? <span style={{ color: '#ffd27c' }}>Límite de pinceladas de la receta alcanzado.</span>
              : <>{L.note} <span style={{ color: '#5d7490' }}>Clic derecho o Alt = herramienta opuesta.</span></>}
          </div>
          {charge && (
            <div style={{ marginTop: 8, padding: '8px 12px', background: '#080c12', border: '1px solid #ffffff12', fontSize: 10, letterSpacing: 1.2, color: '#9fb4cc' }}>
              CARGA TOPOLÓGICA · vórtices + <b style={{ color: '#ffd27c' }}>{charge.plus}</b> · vórtices − <b style={{ color: '#7fd7ff' }}>{charge.minus}</b> · total <b style={{ color: charge.total === 0 ? '#7cf0b0' : '#ff6677' }}>{charge.total}</b> {charge.total === 0 ? '(se conserva)' : '(¡no debería!)'}
            </div>
          )}
        </section>

        {/* ---- escultura 3D ---- */}
        <section style={{ minWidth: 0 }}>
          <div style={{ position: 'relative', height: 'min(640px, 78vh)', minHeight: 360, background: '#03060a', border: `1px solid ${accent}33` }}>
            <CapasViewer onReady={(api) => { viewerRef.current = api; if (api) api.setMarkers(markers) }} />
            <div style={{ position: 'absolute', left: 12, top: 10, fontSize: 9.5, letterSpacing: 1.8, color: '#ffffffcc', textShadow: '0 1px 4px #000', pointerEvents: 'none' }}>
              <div style={{ color: accent }}>{L.label} · {rid || '…'}</div>
              <div>CAPA {Math.round(cutUi) + 1} / {params.slices}{info ? ` · ${fmt(cutUi * info.layerMm, 1)} mm` : ''}</div>
              {meshing && <div style={{ color: '#7f96b2' }}>calculando malla…</div>}
            </div>
            <div style={{ position: 'absolute', right: 10, top: 8, display: 'flex', gap: 6 }}>
              <Chip on={markers} onClick={() => setMarkers((v) => !v)} title="Marcadores de nacimientos, divisiones, fusiones y muertes">EVENTOS</Chip>
            </div>
            <div style={{ position: 'absolute', left: 12, bottom: 10, display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: 9, letterSpacing: 1.2, color: '#9fb4cc', pointerEvents: 'none', textShadow: '0 1px 3px #000' }}>
              {(Object.keys(EVENT_COLOR) as (keyof typeof EVENT_COLOR)[]).map((k) => (
                <span key={k}><i style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 4, background: EVENT_COLOR[k], marginRight: 5 }} />{EVENT_LABEL[k]} {tl ? tl.counts[k] : 0}</span>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <Timeline
              pop={tl?.pop ?? null} solid={tl?.solid ?? null} peak={tl?.peak ?? 1} events={tl?.events ?? []} planned={params.slices} count={count} cut={cutUi} accent={accent}
              onScrub={(s) => { const k = st.current; k.follow = false; k.replay = false; k.cut = s; setFollow(false); setReplay(false); setCutUi(s) }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              <Chip on={playing} onClick={() => setPlaying((v) => !v)} color={accent}>{playing ? '❚❚ PAUSA' : '▶ SEGUIR'}</Chip>
              <Chip on={atPresent} onClick={() => { const k = st.current; k.follow = true; k.replay = false; setFollow(true); setReplay(false) }}>AHORA</Chip>
              <Chip on={replay} onClick={() => { const k = st.current; k.follow = false; k.cut = 0; k.replay = true; setFollow(false); setReplay(true) }} color="#ffd27c" title="El cabezal sube capa por capa: así se vería la impresión">▲ IMPRIMIR (REPRODUCIR)</Chip>
              <span style={{ flex: 1 }} />
              {[1, 2, 4, 8].map((v) => <Chip key={v} on={speed === v} onClick={() => setSpeed(v)} title="Capas por cuadro">×{v}</Chip>)}
            </div>
          </div>
        </section>
      </div>

      {/* ---- ficha de la ley y perillas ---- */}
      <div className="cap-grid2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 22, marginTop: 26 }}>
        <section style={{ background: '#080c12', border: `1px solid ${accent}2a`, borderLeft: `3px solid ${accent}`, padding: '18px 20px' }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: accent, marginBottom: 6 }}>{L.label} — {L.tagline.toUpperCase()}</div>
          <div style={{ fontSize: 11, color: '#fff', margin: '0 0 12px', lineHeight: 1.8, fontFamily: mono }}>{L.equation}</div>
          <p style={{ fontSize: 11, lineHeight: 1.95, color: '#a9bdd4', margin: '0 0 10px' }}>{L.concept}</p>
          <p style={{ fontSize: 9.5, lineHeight: 1.8, color: '#6f86a3', margin: 0 }}>{L.credit}</p>
        </section>
        <section style={{ background: '#080c12', border: '1px solid #ffffff12', padding: '18px 20px', display: 'grid', gap: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: '#9fe8ff' }}>PERILLAS · LA FÍSICA TAMBIÉN SE ESCULPE</div>
          <Slider label={L.knobLabel.toUpperCase()} value={knob} min={0} max={1} step={0.01} readout={fmt(L.knobValue(knob), 4)} disabled={full || !atPresent}
            onChange={(v) => { st.current.sess?.setKnob(v); setKnob(v); scheduleHash() }} />
          <div style={{ fontSize: 9.5, lineHeight: 1.8, color: '#6f86a3', marginTop: -8 }}>Cambiarla mientras corre deja una cicatriz en la pieza, a la altura exacta en que la giraste.</div>
          <Slider label="UMBRAL θ · DÓNDE CORTA EL SÓLIDO" value={params.theta} min={0.12} max={0.8} step={0.01} readout={fmt(params.theta, 2)} onChange={(v) => setView({ theta: v })} />
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, letterSpacing: 1.5, color: '#8fa8c4', marginBottom: 6 }}>
              <span>ESTIRAMIENTO DEL TIEMPO (ALTO/ANCHO)</span><span style={{ color: '#fff' }}>{info ? fmt(info.aspect, 2) : '…'}{params.aspect === 0 ? ' · causal' : ''}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Chip on={params.aspect === 0} onClick={() => setView({ aspect: 0 })} color="#7cf0b0" title="El mínimo estiramiento con 3 % de voladizo: la velocidad de la luz de este universo">CAUSAL</Chip>
              <input type="range" className="cap-range" min={ASPECT_MIN} max={ASPECT_MAX} step={0.01} value={params.aspect === 0 ? (info?.aspect ?? 1) : params.aspect} onChange={(e) => setView({ aspect: Number(e.target.value) })} style={{ flex: 1 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 9.5, letterSpacing: 1.5, color: '#8fa8c4', marginRight: 4 }}>FORMA</span>
            {SHAPES.map((s) => <Chip key={s.id} on={params.shape === s.id} onClick={() => setView({ shape: s.id as Shape })}>{s.label.toUpperCase()}</Chip>)}
            <Chip on={params.base} onClick={() => setView({ base: !params.base })} title="Un disco macizo apoyado en la cama: el pasado de la pieza">BASE</Chip>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 9.5, letterSpacing: 1.5, color: '#8fa8c4', marginRight: 4 }}>CAPAS</span>
            {[120, 180, 240].map((n) => <Chip key={n} on={params.slices === n} onClick={() => restart({ slices: n }, true)}>{n}</Chip>)}
            {L.views.length > 1 && <><span style={{ fontSize: 9.5, letterSpacing: 1.5, color: '#8fa8c4', margin: '0 4px 0 10px' }}>VISTA</span>
              {L.views.map((v) => <Chip key={v.id} on={params.view === v.id} onClick={() => restart({ view: v.id }, true)}>{v.label.toUpperCase()}</Chip>)}</>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <Chip on={false} onClick={() => restart({}, true)} title="Vuelve a simular con las mismas pinceladas">REPETIR</Chip>
            <Chip on={false} onClick={() => restart({ seed: 1 + Math.floor(Math.random() * 2 ** 30) }, false)} color="#9fe8ff" title="Otra semilla de ruido, sin pinceladas">NUEVO UNIVERSO</Chip>
            <Chip on={false} onClick={() => setLaw(params.law)} color="#ff6677" title="Vuelve al estado inicial de esta ley">REINICIAR</Chip>
          </div>
        </section>
      </div>

      {/* ---- medidas ---- */}
      <section style={{ marginTop: 26 }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: '#9fe8ff', marginBottom: 10 }}>LA PIEZA, MEDIDA {full ? '' : '· EN CONSTRUCCIÓN'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
          <Stat k="CAPAS" v={`${count} / ${params.slices}`} hint="Instantes del mundo apilados hasta ahora" />
          <Stat k="ASPECTO CAUSAL" v={info ? fmt(info.aspect, 2) : '…'} hint="Alto/ancho mínimo para que como mucho el 3 % de la superficie quede en voladizo. Equivale a cuántas veces la señal más rápida cruza el mundo durante la pieza." />
          <Stat k="MEDIDAS" v={info ? `${fmt(info.widthMm, 0)} × ${fmt(info.heightMm, 0)} mm` : '…'} hint="Ancho × alto con la dimensión mayor fijada en 60 mm" />
          <Stat k="CAPA DE SIMULACIÓN" v={info ? `${fmt(info.layerMm, 2)} mm` : '…'} hint={info ? `Equivale a ${fmt(info.layerMm / 0.05, 0)} capas de impresión de 50 µm` : ''} />
          <Stat k="VOLADIZO" v={m ? pct(m.overhangFrac) : '…'} hint="Fracción de superficie que mira hacia abajo a menos de 45° de la vertical, medida sobre la malla" warn={!!m && m.overhangFrac > 0.1} />
          <Stat k="PUNTAJE DE IMPRESIÓN" v={m ? fmt(m.printScore, 2) : '…'} hint="0 a 1: cerrada, sin paredes finas, poco voladizo, base estable" warn={!!m && m.printScore < 0.5} />
          <Stat k="GÉNERO" v={m ? String(m.genus) : '…'} hint="Número de asas o túneles de la superficie" />
          <Stat k="PARTES SUELTAS" v={m ? `${m.components - 1}` : '…'} hint={m ? `Se descartan: ${pct(m.droppedVolumeFrac)} del volumen` : ''} warn={!!m && m.droppedVolumeFrac > 0.05} />
          <Stat k="SOPORTES (NACIMIENTOS)" v={tl ? String(tl.counts.birth) : '…'} hint="Partes que nacen en el aire: islas que al imprimir necesitan un soporte" warn={!!tl && tl.counts.birth > 12} />
          <Stat k="DIVISIONES / FUSIONES" v={tl ? `${tl.counts.split} / ${tl.counts.merge}` : '…'} hint="Ramas y puentes del árbol de la pieza" />
          <Stat k="PARTES SIMULTÁNEAS" v={tl ? String(tl.peak) : '…'} hint="Máximo de componentes conexas en una sola capa" />
          <Stat k="TRIÁNGULOS" v={m ? m.tris.toLocaleString('es-CL') : '…'} hint={info ? `Malla de resolución ${info.res}, calculada en ${info.ms} ms` : ''} />
        </div>
      </section>

      {/* ---- exportar ---- */}
      <section style={{ marginTop: 22, background: '#080c12', border: '1px solid #ffffff12', padding: '18px 20px' }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: '#9fe8ff', marginBottom: 12 }}>LLEVARLA A LA MESA</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 9.5, letterSpacing: 1.5, color: '#8fa8c4' }}>RESOLUCIÓN DEL STL</span>
          {(Object.keys(EXPORT_RES) as (keyof typeof EXPORT_RES)[]).map((k) => <Chip key={k} on={exp.res === k} onClick={() => setExp((e) => ({ ...e, res: k }))}>{k.toUpperCase()}</Chip>)}
        </div>
        <div className="cap-export" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8 }}>
          <button className="press" onClick={exportStl} disabled={!info || exp.state === 'busy'} style={{ minHeight: 46, background: accent, color: '#02060a', border: 'none', fontFamily: mono, fontWeight: 700, fontSize: 11, letterSpacing: 1.5, cursor: 'pointer', opacity: !info ? 0.5 : 1 }}>
            {exp.state === 'busy' ? 'CALCULANDO STL…' : exp.state === 'error' ? 'REINTENTAR STL' : `DESCARGAR STL (${SIZE_MM} MM)`}
          </button>
          <button className="press" onClick={exportJson} disabled={!info} style={{ minHeight: 46, background: 'transparent', border: '1px solid #4a6080', color: '#9fb4cc', fontFamily: mono, fontSize: 10.5, letterSpacing: 1.5, cursor: 'pointer' }}>RECETA + FICHA DE FABRICACIÓN (JSON)</button>
          <button className="press" onClick={share} style={{ minHeight: 46, background: 'transparent', border: '1px solid #4a6080', color: '#9fb4cc', fontFamily: mono, fontSize: 10.5, letterSpacing: 1.5, cursor: 'pointer' }}>{copied ? 'ENLACE COPIADO' : 'COPIAR ENLACE A ESTE UNIVERSO'}</button>
          <a href={`https://wa.me/${WA}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer" className="press" style={{ minHeight: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#25d366', color: '#04210f', fontWeight: 700, fontSize: 11, letterSpacing: 1.5, textDecoration: 'none' }}>PEDIR ESTA PIEZA EN RESINA</a>
        </div>
        <p style={{ fontSize: 9.5, lineHeight: 1.9, color: '#6f86a3', margin: '12px 0 0' }}>
          El enlace contiene la receta completa (ley, semilla, constantes, cada pinceladas y cada giro de perilla con su capa): quien lo abra reconstruye la misma pila de capas, bit a bit. La pieza se imprime de pie, con la base en la cama y sin reorientar.
        </p>
      </section>
      <style>{`
        .cap-range { -webkit-appearance: none; appearance: none; height: 3px; background: #ffffff2a; outline: none; border-radius: 2px; }
        .cap-range::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${accent}; border: 2px solid #02060a; cursor: pointer; }
        .cap-range::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: ${accent}; border: 2px solid #02060a; cursor: pointer; }
        .cap-range:disabled::-webkit-slider-thumb { background: #4a6080; }
        @media (max-width: 960px) { .cap-main, .cap-grid2 { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
