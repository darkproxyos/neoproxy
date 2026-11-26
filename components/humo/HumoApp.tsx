'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { EXPERIMENTS, type ExperimentId } from '@/lib/humo/vortex'
import type { HumoCmd, HumoMsg } from '@/lib/humo/worker'
import type { Metrics } from '@/lib/specimens/analyze'
import type { HumoViewerApi } from './HumoViewer'

const HumoViewer = dynamic(() => import('./HumoViewer'), { ssr: false })
const mono = "'Space Mono', monospace"
const WA = '56993550010'
const SIZE_MM = 60
const IDS: ExperimentId[] = ['leapfrog', 'choque', 'oblicuo', 'nudo']
const fmt = (n: number, d = 1) => n.toFixed(d).replace('.', ',')
const C0 = [0.37, 0.89, 1], C1 = [1, 0.31, 0.64], CK = [1, 0.72, 0.42]

export const EXP_TEXT: Record<ExperimentId, { concept: string; credit: string; pedestal: boolean }> = {
  leapfrog: { pedestal: true, concept: 'Helmholtz lo predijo en 1858: dos anillos en fila se turnan. El de atrás se encoge, acelera y pasa por dentro del de adelante, que se ensancha y frena; luego al revés. El humo que no alcanza a seguirlos queda atrás como una cadena de conos: una medusa.', credit: 'Helmholtz (1858); fotografiado por Yamada y Matsui (1978).' },
  choque: { pedestal: false, concept: 'Dos anillos de frente no se atraviesan: se frenan uno al otro, se estiran hacia afuera y su borde, estirado, se ondula hasta formar una corona.', credit: 'Lim y Nickels (1992), Nature 357.' },
  oblicuo: { pedestal: true, concept: 'Al chocar en ángulo, los anillos se tuercen uno sobre el otro. En un fluido real se reconectarían en un solo lazo; aquí se ve el instante anterior, cuando el humo se enrosca.', credit: 'Kida, Takaoka y Hussain (1991), Journal of Fluid Mechanics 230.' },
  nudo: { pedestal: false, concept: 'Un vórtice anudado como un trébol. En 2013 se crearon en agua por primera vez, arrastrando alas impresas en 3D con esa forma. En la realidad el nudo se desata reconectándose; aquí se mantiene.', credit: 'Kleckner e Irvine (2013), Nature Physics 9.' },
}

function Chip({ on, onClick, children, title, color = '#9fe8ff' }: { on: boolean; onClick: () => void; children: React.ReactNode; title?: string; color?: string }) {
  return <button type="button" className="press" title={title} onClick={onClick} style={{ minHeight: 38, padding: '0 14px', fontFamily: mono, fontSize: 10.5, letterSpacing: 1.6, cursor: 'pointer', background: on ? `${color}22` : 'rgba(2,4,8,0.7)', borderStyle: 'solid', borderWidth: 1, borderColor: on ? color : '#ffffff26', color: on ? color : '#9fb4cc' }}>{children}</button>
}
function Slider({ label, value, onChange, readout }: { label: string; value: number; onChange: (v: number) => void; readout: string }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, letterSpacing: 1.5, color: '#8fa8c4', marginBottom: 6 }}><span>{label}</span><span style={{ color: '#fff' }}>{readout}</span></div>
      <input type="range" className="humo-range" min={0} max={1} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%' }} />
    </label>
  )
}
function Stat({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return <div style={{ padding: '10px 12px', background: '#080c12', border: '1px solid #ffffff10' }}><div style={{ fontSize: 9.5, letterSpacing: 1.6, color: '#7f96b2', marginBottom: 5 }}>{k}</div><div style={{ fontSize: 14, color: warn ? '#ffb86b' : '#fff' }}>{v}</div></div>
}

type Solid = { metrics: Metrics; heightMm: number; widthMm: number; ms: number; step: number }

export default function HumoApp() {
  const workerRef = useRef<Worker | null>(null)
  const viewerRef = useRef<HumoViewerApi | null>(null)
  const [exp, setExp] = useState<ExperimentId>('leapfrog')
  const [a, setA] = useState(0.5), [b, setB] = useState(0.5), [seed, setSeed] = useState(1)
  const [density, setDensity] = useState(0.5), [pedestal, setPedestal] = useState(true)
  const [palette, setPalette] = useState<'humo' | 'resina'>('humo'), [cores, setCores] = useState(true)
  const [prog, setProg] = useState({ step: 0, total: 1, t: 0, drift: 0, ms: 0 })
  const [status, setStatus] = useState<'corriendo' | 'pausa' | 'final' | 'congelando' | 'congelado'>('corriendo')
  const [solid, setSolid] = useState<Solid | null>(null)
  const [err, setErr] = useState('')
  const [exporting, setExporting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [reel, setReel] = useState<null | { phase: 'titulo' | 'humo' | 'solido' | 'fin' }>(null)
  const st = useRef({ colorsSent: false, perRing: 6000, rings: 2, frozen: false, pendingFreeze: false, exportPending: false, solidRaw: null as null | { positions: Float32Array; indices: Uint32Array; mix: Float32Array }, reel: false, autoFreeze: false })
  const latest = useRef({ exp, a, b, seed, density, pedestal, palette }); latest.current = { exp, a, b, seed, density, pedestal, palette }

  const colorsFor = (n: number) => {
    const c = new Float32Array(n * 4), per = st.current.perRing
    for (let i = 0; i < n; i++) { const r = st.current.rings === 1 ? CK : Math.floor(i / per) === 0 ? C0 : C1; c[4 * i] = r[0]; c[4 * i + 1] = r[1]; c[4 * i + 2] = r[2]; c[4 * i + 3] = 0.5 }
    return c
  }
  const send = (c: HumoCmd) => workerRef.current?.postMessage(c)
  const start = useCallback((o?: { to?: number; freezeAfter?: boolean }) => {
    const L = latest.current
    st.current.rings = L.exp === 'nudo' ? 1 : 2
    st.current.perRing = L.exp === 'nudo' ? 9000 : 6000
    st.current.colorsSent = false; st.current.frozen = false; st.current.solidRaw = null; st.current.autoFreeze = !!o?.freezeAfter
    viewerRef.current?.setSolid(null, L.palette); setSolid(null); setErr('')
    setStatus(o?.to ? 'pausa' : 'corriendo')
    send({ type: 'start', params: { exp: L.exp, seed: L.seed, a: L.a, b: L.b }, particles: st.current.perRing, to: o?.to })
  }, [])
  const freeze = useCallback((stl = false, res = 104) => {
    const L = latest.current
    setStatus('congelando'); st.current.exportPending = stl
    send({ type: 'freeze', opts: { res, sizeMm: SIZE_MM, density: L.density, pedestal: L.pedestal }, stl })
  }, [])

  // worker
  useEffect(() => {
    const w = new Worker(new URL('../../lib/humo/worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = w
    w.onmessage = (e: MessageEvent<HumoMsg>) => {
      const m = e.data, v = viewerRef.current
      if (m.type === 'frame') {
        if (v) {
          v.setParticles(m.pos, st.current.colorsSent ? null : colorsFor(m.pos.length / 3)); st.current.colorsSent = true
          v.setCores(m.cores, m.counts)
        }
        setProg({ step: m.step, total: m.total, t: m.t, drift: m.drift, ms: m.ms })
        if (m.step >= m.total && !st.current.frozen) { setStatus('final'); if (st.current.autoFreeze || st.current.reel) { st.current.autoFreeze = false; freeze() } }
      } else if (m.type === 'solid') {
        st.current.frozen = true
        const raw = { positions: m.simPositions, indices: m.indices, mix: m.mix }
        st.current.solidRaw = raw
        v?.setSolid(raw, latest.current.palette)
        setSolid({ metrics: m.metrics as Metrics, heightMm: m.heightMm, widthMm: m.widthMm, ms: m.ms, step: m.step })
        setStatus('congelado')
        if (m.stl) {
          const L = latest.current, a = document.createElement('a')
          a.href = URL.createObjectURL(new Blob([m.stl], { type: 'model/stl' })); a.download = `humo-solido-${L.exp}-${m.step}.stl`
          document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); setExporting(false)
        }
        if (st.current.reel) setReel({ phase: 'solido' })
      } else if (m.type === 'error') { setErr(m.error); setStatus('final'); setExporting(false) }
    }
    // enlace compartido: #h=exp,a,b,semilla,paso,densidad,peana
    const mm = /#h=([a-z]+),([\d.]+),([\d.]+),(\d+),(\d+),([\d.]+),([01])/.exec(window.location.hash)
    if (mm && (IDS as string[]).includes(mm[1])) {
      const e = mm[1] as ExperimentId
      latest.current = { ...latest.current, exp: e, a: +mm[2], b: +mm[3], seed: +mm[4], density: +mm[6], pedestal: mm[7] === '1' }
      setExp(e); setA(+mm[2]); setB(+mm[3]); setSeed(+mm[4]); setDensity(+mm[6]); setPedestal(mm[7] === '1')
      setTimeout(() => { start({ to: Math.max(1, +mm[5]) }); setTimeout(() => freeze(), 50) }, 0)
    } else setTimeout(() => start(), 0)
    return () => { w.terminate(); workerRef.current = null }
  }, [start, freeze])

  // volver a solidificar si cambian densidad o peana estando congelado
  useEffect(() => { if (st.current.frozen && status === 'congelado') freeze() }, [density, pedestal]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (st.current.solidRaw) viewerRef.current?.setSolid(st.current.solidRaw, palette) }, [palette])
  const coresRef = useRef(cores); coresRef.current = cores
  useEffect(() => { viewerRef.current?.setShowCores(cores) }, [cores])

  const pick = (e: ExperimentId) => { setExp(e); setPedestal(EXP_TEXT[e].pedestal); latest.current = { ...latest.current, exp: e, pedestal: EXP_TEXT[e].pedestal }; start() }
  const link = () => `${window.location.origin}/humo#h=${exp},${fmt(a, 2).replace(',', '.')},${fmt(b, 2).replace(',', '.')},${seed},${solid?.step ?? prog.step},${density.toFixed(2)},${pedestal ? 1 : 0}`
  const share = async () => { const l = link(); try { await navigator.clipboard.writeText(l); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { window.prompt('Copia el enlace:', l) } }
  const exportStl = () => { if (!st.current.frozen || exporting) return; setExporting(true); freeze(true, 150) }
  const exportJson = () => {
    if (!solid) return
    const m = solid.metrics
    const doc = {
      pieza: 'HUMO SÓLIDO', experimento: EXPERIMENTS[exp].label, enlace: link(),
      receta: { experimento: exp, perillaA: a, perillaB: b, semilla: seed, paso: solid.step, dt: 0.06, densidad: density, peana: pedestal },
      nota: 'Receta determinista: la misma receta reproduce la misma nube de humo, partícula por partícula.',
      medidas: { ancho_mm: +solid.widthMm.toFixed(1), alto_mm: +solid.heightMm.toFixed(1), triangulos: m.tris, cerrada: m.closed, genero: m.genus, orientacion: m.up, voladizo: +m.overhangFrac.toFixed(3), pared_p10_mm: +m.wallP10Mm.toFixed(2), partes_sueltas_descartadas: m.components - 1, puntaje_impresion: +m.printScore.toFixed(2) },
      impresion_sugerida: { tecnologia: 'resina (SLA/MSLA)', capa_um: 50, soportes: m.overhangFrac > 0.03 ? 'necesarios (voladizo medido)' : 'probablemente no', advertencia: 'Sin pruebas de impresión real todavía: validar con una pieza de ensayo antes de producir. Las piezas son macizas: conviene vaciarlas con drenajes en el laminador.' },
    }
    const a2 = document.createElement('a'); a2.href = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })); a2.download = `humo-solido-${exp}-${solid.step}.json`
    document.body.appendChild(a2); a2.click(); a2.remove()
  }

  // modo reel: título → humo → sólido girando → cierre
  // el layout envuelve todo en .neo-organism-filter, cuyo `filter` vuelve a ese div el
  // bloque contenedor de los position:fixed (el reel quedaba anclado al documento, fuera
  // de pantalla) y lo deja debajo del menú. Mientras dura el reel se apaga ese filtro y la
  // capa de la página sube por encima del menú y del chat.
  const reelClass = (on: boolean) => document.documentElement.classList.toggle('humo-reel-on', on)
  useEffect(() => () => { reelClass(false) }, [])
  const enterReel = () => { reelClass(true); viewerRef.current?.setShowCores(false); st.current.reel = true; setReel({ phase: 'titulo' }); viewerRef.current?.setAutoRotate(0.12); start() ; setTimeout(() => setReel((r) => (r && r.phase === 'titulo' ? { phase: 'humo' } : r)), 2600) }
  const exitReel = () => { reelClass(false); viewerRef.current?.setShowCores(coresRef.current); st.current.reel = false; setReel(null); viewerRef.current?.setAutoRotate(0.12) }
  useEffect(() => {
    if (reel?.phase === 'solido') { viewerRef.current?.setAutoRotate(0.55); const t = setTimeout(() => setReel({ phase: 'fin' }), 7000); return () => clearTimeout(t) }
  }, [reel?.phase])
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') exitReel() }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [])

  const E = EXPERIMENTS[exp], T = EXP_TEXT[exp], m = solid?.metrics
  const pct = Math.round((100 * prog.step) / Math.max(1, prog.total))
  // el enlace depende de window: se arma al pulsar, no en el render (si no, el HTML del servidor no coincide)
  const waHref = () => `https://wa.me/${WA}?text=${encodeURIComponent(`Hola, quiero la pieza HUMO SÓLIDO (${E.label.toLowerCase()}) impresa en resina. Receta: ${link()}`)}`

  return (
    <div>
      {/* visor: en modo reel ocupa la pantalla en 9:16 */}
      <div className={reel ? 'humo-reel' : ''} data-phase={reel?.phase} style={reel ? { position: 'fixed', inset: 0, zIndex: 400, background: '#000', display: 'grid', placeItems: 'center' } : {}}>
        <div style={reel ? { position: 'relative', height: 'min(100vh, 100vw * 16 / 9)', aspectRatio: '9 / 16', background: '#020308', overflow: 'hidden' } : { position: 'relative', height: 'min(76vh, 720px)', minHeight: 420, background: '#020308', border: '1px solid #ffffff14' }}>
          <HumoViewer onReady={(api) => { viewerRef.current = api; if (api) api.setShowCores(cores) }} />
          {!reel && (
            <>
              <div style={{ position: 'absolute', left: 14, top: 12, fontSize: 10, letterSpacing: 1.8, color: '#ffffffcc', textShadow: '0 1px 4px #000', pointerEvents: 'none' }}>
                <div style={{ color: '#ff8fc4' }}>{E.label}</div>
                <div>t = {fmt(prog.t, 1)} · {status === 'congelado' ? 'CONGELADO' : status === 'congelando' ? 'CONGELANDO…' : status === 'final' ? 'FIN DEL TRAMO' : `${pct} %`}</div>
                <div style={{ color: '#7f96b2' }}>impulso conservado ± {fmt(100 * prog.drift, 1)} %</div>
              </div>
              <div style={{ position: 'absolute', right: 10, top: 10, display: 'flex', gap: 6 }}>
                <Chip on={cores} onClick={() => setCores((v) => !v)} title="Los núcleos de vórtice: las líneas que mueven todo el humo">NÚCLEOS</Chip>
                <Chip on={palette === 'resina'} onClick={() => setPalette((p) => (p === 'resina' ? 'humo' : 'resina'))} title="La pieza de un solo color, como saldría impresa">RESINA</Chip>
              </div>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: '#ffffff12' }}><div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#5fe3ff,#ff4fa3)' }} /></div>
            </>
          )}
          {reel && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', fontFamily: mono }}>
              <div style={{ position: 'absolute', top: '9%', left: 0, right: 0, padding: '0 6%', textAlign: 'center', opacity: reel.phase === 'titulo' ? 1 : 0, transition: 'opacity 1.2s' }}>
                <div style={{ fontSize: 'clamp(10px, 1.6vh, 15px)', letterSpacing: 5, color: '#ff8fc4' }}>NEO·PROXY // FÍSICA DE FLUIDOS</div>
                <div style={{ fontSize: 'clamp(28px, 6vh, 64px)', letterSpacing: 8, color: '#fff', fontWeight: 700, textShadow: '0 0 30px #ff4fa388', marginTop: 6 }}>HUMO SÓLIDO</div>
                <div style={{ fontSize: 'clamp(11px, 1.9vh, 18px)', color: '#cfe6ff', marginTop: 8 }}>{E.label.toLowerCase()} · ecuaciones de Helmholtz</div>
              </div>
              <div style={{ position: 'absolute', top: '4.5%', left: 0, right: 0, textAlign: 'center', fontSize: 'clamp(10px, min(1.7vh, 3.4vw), 15px)', letterSpacing: 4, color: '#ffffffd0', textShadow: '0 1px 6px #000', opacity: reel.phase === 'humo' ? 1 : 0, transition: 'opacity 1.2s' }}>
                HUMO SÓLIDO <span style={{ color: '#ff8fc4' }}>· {E.label}</span>
              </div>
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: reel.phase === 'fin' ? 1 : 0, transition: 'opacity 1s', background: reel.phase === 'fin' ? '#000c' : 'transparent' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(28px, 6vh, 64px)', letterSpacing: 8, color: '#fff', fontWeight: 700 }}>HUMO SÓLIDO</div>
                  <div style={{ fontSize: 'clamp(12px, min(2.2vh, 4.2vw), 22px)', color: '#cfe6ff', margin: '14px 0', padding: '0 8%' }}>Humo calculado con la física de los vórtices, congelado para imprimir.</div>
                  <div style={{ fontSize: 'clamp(12px, 2.2vh, 22px)', color: '#9fe8ff', letterSpacing: 2 }}>neoproxy.art/humo</div>
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '48px 6% 5vh', textAlign: 'center', textShadow: '0 1px 6px #000', background: reel.phase === 'solido' ? 'linear-gradient(transparent, #000000c0)' : 'transparent', opacity: reel.phase === 'fin' ? 0 : 1, transition: 'opacity .8s' }}>
                <div style={{ fontSize: 'clamp(12px, min(2.4vh, 4.6vw), 22px)', letterSpacing: 4, color: '#fff', fontWeight: 700, opacity: reel.phase === 'solido' ? 1 : 0, transition: 'opacity .8s', marginBottom: 6 }}>❄ CONGELADO · LISTO PARA IMPRIMIR</div>
                <div style={{ fontSize: 'clamp(10px, 1.6vh, 14px)', color: '#9fb4cc', letterSpacing: 2 }}>t = {fmt(prog.t, 1)}</div>
              </div>
              <button type="button" onClick={exitReel} style={{ position: 'absolute', top: 10, right: 10, pointerEvents: 'auto', opacity: reel.phase === 'titulo' ? 1 : 0.3, fontFamily: mono, fontSize: 11, letterSpacing: 2, padding: '8px 12px', background: '#000a', color: '#9fb4cc', border: '1px solid #ffffff30', cursor: 'pointer' }}>SALIR ✕</button>
            </div>
          )}
        </div>
      </div>

      {/* controles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '12px 0' }}>
        {IDS.map((id) => <Chip key={id} on={exp === id} onClick={() => pick(id)} color="#ff8fc4">{EXPERIMENTS[id].label}</Chip>)}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 18 }}>
        <button type="button" className="press" onClick={() => { if (status === 'congelado' || status === 'congelando') return; freeze() }} disabled={status === 'congelado' || status === 'congelando'}
          style={{ minHeight: 48, padding: '0 26px', fontFamily: mono, fontWeight: 700, fontSize: 12, letterSpacing: 3, cursor: 'pointer', background: 'linear-gradient(90deg,#5fe3ff,#ff4fa3)', color: '#04060a', border: 'none', opacity: status === 'congelado' ? 0.5 : 1 }}>
          ❄ CONGELAR ESTE INSTANTE
        </button>
        {status === 'congelado' && <Chip on={false} onClick={() => { viewerRef.current?.setSolid(null, palette); st.current.frozen = false; setSolid(null); if (prog.step < prog.total) { setStatus('corriendo'); send({ type: 'play' }) } else setStatus('final') }}>DESCONGELAR</Chip>}
        {status === 'corriendo' && <Chip on={false} onClick={() => { send({ type: 'pause' }); setStatus('pausa') }}>❚❚ PAUSA</Chip>}
        {status === 'pausa' && <Chip on={false} onClick={() => { send({ type: 'play' }); setStatus('corriendo') }}>▶ SEGUIR</Chip>}
        <Chip on={false} onClick={() => start()}>↺ REPETIR</Chip>
        <Chip on={false} onClick={() => { setSeed((s) => s + 1); latest.current = { ...latest.current, seed: latest.current.seed + 1 }; start() }} title="Otra nube de humo inicial">OTRO HUMO</Chip>
        <span style={{ flex: 1 }} />
        <Chip on={!!reel} onClick={enterReel} color="#ffd27c" title="Pantalla vertical que corre sola: para grabarla con el teléfono">▣ MODO REEL</Chip>
      </div>
      {err && <p style={{ color: '#ffb86b', fontSize: 11 }}>{err}</p>}

      <div className="humo-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 22 }}>
        <section style={{ background: '#080c12', borderStyle: 'solid', borderWidth: '1px 1px 1px 3px', borderColor: '#ff8fc42a #ff8fc42a #ff8fc42a #ff8fc4', padding: '18px 20px' }}>
          <div style={{ fontSize: 10.5, letterSpacing: 3, color: '#ff8fc4', marginBottom: 8 }}>{E.label} — {E.tagline.toUpperCase()}</div>
          <p style={{ fontSize: 11.5, lineHeight: 1.95, color: '#a9bdd4', margin: '0 0 10px' }}>{T.concept}</p>
          <p style={{ fontSize: 10, lineHeight: 1.8, color: '#6f86a3', margin: 0 }}>{T.credit}</p>
        </section>
        <section style={{ background: '#080c12', border: '1px solid #ffffff12', padding: '18px 20px', display: 'grid', gap: 16 }}>
          <div style={{ fontSize: 10.5, letterSpacing: 3, color: '#9fe8ff' }}>PERILLAS</div>
          <Slider label={E.knobA.toUpperCase()} value={a} readout={fmt(a, 2)} onChange={(v) => { setA(v); latest.current = { ...latest.current, a: v } }} />
          <Slider label={E.knobB.toUpperCase()} value={b} readout={fmt(b, 2)} onChange={(v) => { setB(v); latest.current = { ...latest.current, b: v } }} />
          <div style={{ fontSize: 10, color: '#6f86a3', marginTop: -6 }}>Las perillas cambian las condiciones iniciales: se aplican al pulsar REPETIR.</div>
          <Slider label="DENSIDAD DEL HUMO SÓLIDO" value={density} readout={fmt(density, 2)} onChange={setDensity} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Chip on={pedestal} onClick={() => setPedestal((v) => !v)} title="Varilla y disco: la pieza queda de pie como una escultura">PEANA</Chip>
          </div>
        </section>
      </div>

      <section style={{ marginTop: 22 }}>
        <div style={{ fontSize: 10.5, letterSpacing: 3, color: '#9fe8ff', marginBottom: 10 }}>LA PIEZA{solid ? '' : ' · CONGELA UN INSTANTE PARA MEDIRLA'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: 8 }}>
          <Stat k="INSTANTE" v={solid ? `t = ${fmt(solid.step * 0.06, 1)}` : '…'} />
          <Stat k="MEDIDAS" v={solid ? `${fmt(solid.widthMm, 0)} × ${fmt(solid.heightMm, 0)} mm` : '…'} />
          <Stat k="TRIÁNGULOS" v={m ? m.tris.toLocaleString('es-CL') : '…'} />
          <Stat k="GÉNERO" v={m ? String(m.genus) : '…'} />
          <Stat k="VOLADIZO" v={m ? `${fmt(100 * m.overhangFrac, 0)} %` : '…'} warn={!!m && m.overhangFrac > 0.15} />
          <Stat k="PARED MÍNIMA (P10)" v={m ? `${fmt(m.wallP10Mm, 2)} mm` : '…'} warn={!!m && m.wallP10Mm < 1} />
          <Stat k="PARTES SUELTAS" v={m ? String(m.components - 1) : '…'} warn={!!m && m.droppedVolumeFrac > 0.05} />
          <Stat k="PUNTAJE DE IMPRESIÓN" v={m ? fmt(m.printScore, 2) : '…'} warn={!!m && m.printScore < 0.5} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8, marginTop: 14 }}>
          <button className="press" onClick={exportStl} disabled={!solid || exporting} style={{ minHeight: 46, background: '#ff8fc4', color: '#02060a', border: 'none', fontFamily: mono, fontWeight: 700, fontSize: 11, letterSpacing: 1.5, cursor: 'pointer', opacity: solid ? 1 : 0.45 }}>{exporting ? 'CALCULANDO STL…' : `DESCARGAR STL (${SIZE_MM} MM)`}</button>
          <button className="press" onClick={exportJson} disabled={!solid} style={{ minHeight: 46, background: 'transparent', border: '1px solid #4a6080', color: '#9fb4cc', fontFamily: mono, fontSize: 10.5, letterSpacing: 1.5, cursor: 'pointer', opacity: solid ? 1 : 0.45 }}>RECETA + FICHA (JSON)</button>
          <button className="press" onClick={share} style={{ minHeight: 46, background: 'transparent', border: '1px solid #4a6080', color: '#9fb4cc', fontFamily: mono, fontSize: 10.5, letterSpacing: 1.5, cursor: 'pointer' }}>{copied ? 'ENLACE COPIADO' : 'COPIAR ENLACE A ESTE INSTANTE'}</button>
          <a href={`https://wa.me/${WA}`} onClick={(e) => { e.currentTarget.href = waHref() }} target="_blank" rel="noopener noreferrer" className="press" style={{ minHeight: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#25d366', color: '#04210f', fontWeight: 700, fontSize: 11, letterSpacing: 1.5, textDecoration: 'none' }}>PEDIR ESTA PIEZA EN RESINA</a>
        </div>
        {m && m.components > 1 && <p style={{ fontSize: 10.5, color: '#ffb86b', margin: '10px 0 0' }}>El STL omite {m.components - 1} partes sueltas ({fmt(100 * m.droppedVolumeFrac, 1)} % del volumen): humo que se separó de la pieza principal{pedestal ? '; los trozos grandes quedan unidos a la peana con su propia varilla' : ''}.</p>}
      </section>
      <style>{`
        .humo-range { -webkit-appearance: none; appearance: none; height: 3px; background: #ffffff2a; outline: none; border-radius: 2px; }
        .humo-range::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #ff8fc4; border: 2px solid #02060a; cursor: pointer; }
        .humo-range::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: #ff8fc4; border: 2px solid #02060a; cursor: pointer; }
        @media (max-width: 900px) { .humo-grid { grid-template-columns: 1fr !important; } }
        html.humo-reel-on, html.humo-reel-on body { overflow: hidden !important; }
        html.humo-reel-on .neo-organism-filter { filter: none !important; transition: none !important; }
        html.humo-reel-on .humo-layer { z-index: 2000 !important; }
        .humo-reel button[aria-label="Acercar"], .humo-reel button[aria-label="Alejar"], .humo-reel button[aria-label="Restablecer la vista"] { display: none !important; }
      `}</style>
    </div>
  )
}
