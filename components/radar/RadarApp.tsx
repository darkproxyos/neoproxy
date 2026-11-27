'use client'

// RADAR // NEGOCIO — qué imprimir y vender, cuándo, y por qué. Sin login: el catálogo,
// el calendario y el tablero (guardado en este navegador, con exportar/importar) son
// libres; la IA y las fuentes externas gastan créditos y piden la clave personal, que
// se escribe una vez y queda en este navegador.

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { IDEAS, CAT_LABEL, DERECHOS_LABEL, TEMPORADA_NOMBRE, calendario, puntaje, enlaces, type Idea, type Cat } from '@/lib/radar/ideas'
import { radarEstado, radarThingiverse, radarMercado, radarGenerarIdeas } from '@/app/radar/actions'
import type { IdeaIA } from '@/lib/radar/ia'
import type { RadarItem, Mercado } from '@/lib/radar/fuentes'

const mono = "'Space Mono', monospace"
const AMBER = '#ffc86b', GREEN = '#7cf0b0', RED = '#ff7a7a', CYAN = '#9fe8ff', DIM = '#8fa8c4', FAINT = '#6f86a3'
const clp = (n?: number) => (n === undefined ? '—' : '$' + Math.round(n).toLocaleString('es-CL'))
const fecha = (d: Date) => d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', timeZone: 'UTC' })

type Tab = 'hoy' | 'ideas' | 'generar' | 'tablero' | 'fuentes'
type Estado = 'idea' | 'prototipo' | 'reel' | 'venta' | 'descartada'
const ESTADOS: { k: Estado; label: string; c: string }[] = [
  { k: 'idea', label: 'IDEA', c: DIM }, { k: 'prototipo', label: 'PROTOTIPO', c: CYAN }, { k: 'reel', label: 'REEL', c: '#d4b0ff' },
  { k: 'venta', label: 'A LA VENTA', c: GREEN }, { k: 'descartada', label: 'DESCARTADA', c: FAINT },
]
type Item = { id: string; nombre: string; estado: Estado; notas: string; costo?: number; precio?: number; vendidas?: number; buscar?: string; creado: number }
const KEY = 'npx-radar-tablero-v1'
const load = (): Item[] => { try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : [] } catch { return [] } }
const save = (v: Item[]) => { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* sin almacenamiento */ } }
// el tablero vive en localStorage: un almacén mínimo para leerlo sin desajustes de hidratación
const EMPTY: Item[] = []
const tablero = {
  cache: null as Item[] | null,
  subs: new Set<() => void>(),
  subscribe(cb: () => void) { tablero.subs.add(cb); return () => { tablero.subs.delete(cb) } },
  get(): Item[] { if (tablero.cache === null) tablero.cache = load(); return tablero.cache },
  server(): Item[] { return EMPTY },
  set(v: Item[]) { tablero.cache = v; save(v); tablero.subs.forEach((f) => f()) },
}
const CLAVE_KEY = 'npx-radar-clave'
const getClave = () => { try { return localStorage.getItem(CLAVE_KEY) || '' } catch { return '' } }
type EstadoR = { configurada: boolean; valida: boolean; thingiverse: boolean; mercadoLibre: boolean; ia: boolean }
const Paso = ({ n, children }: { n: string; children: React.ReactNode }) => <li style={{ fontSize: 12, lineHeight: 1.9, color: DIM }}><b style={{ color: '#fff' }}>{n}</b> {children}</li>

function Chip({ on, onClick, children, color = AMBER }: { on: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return <button type="button" className="press" aria-pressed={on} onClick={onClick} style={{ minHeight: 36, padding: '0 12px', fontFamily: mono, fontSize: 11.5, letterSpacing: 1.2, cursor: 'pointer', background: on ? `${color}22` : 'transparent', border: `1px solid ${on ? color : '#ffffff26'}`, color: on ? color : '#9fb4cc' }}>{children}</button>
}
const Tag = ({ children, c = DIM }: { children: React.ReactNode; c?: string }) => <span style={{ fontSize: 10.5, letterSpacing: 1, padding: '2px 7px', border: `1px solid ${c}55`, color: c, whiteSpace: 'nowrap' }}>{children}</span>
const A = ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: CYAN, fontSize: 11.5, textDecoration: 'none', borderBottom: `1px solid ${CYAN}44`, padding: '6px 0', display: 'inline-block' }}>{children}</a>

type CardIdea = Pick<Idea, 'nombre' | 'material' | 'derechos' | 'esfuerzo' | 'valor' | 'volumen' | 'aprox' | 'porque' | 'reel' | 'buscar'> & { ojo?: string; ruta?: string; temporada?: string; primerPaso?: string; cat?: Cat }

function IdeaCard({ i, score, prox, onAdd, mlOn }: { i: CardIdea; score?: number; prox?: string; onAdd: () => void; mlOn: boolean }) {
  const [ml, setMl] = useState<Mercado | null>(null), [mlErr, setMlErr] = useState(''), [busy, setBusy] = useState(false)
  const e = enlaces(i.buscar)
  const verMl = async () => {
    setBusy(true); setMlErr('')
    const r = await radarMercado(getClave(), i.buscar)
    setBusy(false)
    if (r.ok) setMl(r.data); else setMlErr(r.error)
  }
  const derC = i.derechos === 'licencia' ? AMBER : i.derechos === 'encargo' ? CYAN : GREEN
  return (
    <article style={{ background: '#080c12', border: '1px solid #ffffff12', borderTop: `2px solid ${derC}`, padding: '14px 16px', display: 'grid', gap: 9, alignContent: 'start' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
        <h3 style={{ fontSize: 13.5, color: '#fff', margin: 0, lineHeight: 1.4 }}>{i.nombre}</h3>
        {score !== undefined && <span title="Puntaje de oportunidad: valor, volumen, esfuerzo, derechos y fecha cercana" style={{ fontSize: 13, color: score >= 75 ? GREEN : score >= 60 ? AMBER : DIM, fontWeight: 700 }}>{score}</span>}
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {i.cat && <Tag>{CAT_LABEL[i.cat]}</Tag>}
        <Tag c={CYAN}>{i.material}</Tag>
        <Tag c={derC}>{DERECHOS_LABEL[i.derechos]}</Tag>
        {prox && <Tag c={RED}>{prox}</Tag>}
        {i.temporada && <Tag c={RED}>{i.temporada}</Tag>}
      </div>
      <p style={{ fontSize: 12, lineHeight: 1.8, color: '#c8daf0', margin: 0 }}>{i.porque}</p>
      <div style={{ fontSize: 11.5, lineHeight: 1.8, color: DIM }}>
        <div><b style={{ color: '#fff' }}>Costo y tiempo:</b> {i.aprox}</div>
        <div><b style={{ color: '#fff' }}>Esfuerzo</b> {'●'.repeat(i.esfuerzo)}{'○'.repeat(3 - i.esfuerzo)} · <b style={{ color: '#fff' }}>valor</b> {'●'.repeat(i.valor)}{'○'.repeat(3 - i.valor)} · <b style={{ color: '#fff' }}>volumen</b> {'●'.repeat(i.volumen)}{'○'.repeat(3 - i.volumen)}</div>
        <div><b style={{ color: '#fff' }}>Reel:</b> {i.reel}</div>
        {i.primerPaso && <div><b style={{ color: '#fff' }}>Mañana:</b> {i.primerPaso}</div>}
        {i.ojo && <div style={{ color: AMBER }}>⚠ {i.ojo}</div>}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <A href={e.mercadoLibre}>Precios en ML ↗</A><A href={e.etsy}>Etsy ↗</A>
        <A href={e.printables}>Printables</A><A href={e.makerworld}>MakerWorld</A><A href={e.thingiverse}>Thingiverse</A><A href={e.cults}>Cults</A>
        {i.ruta && <Link href={i.ruta} style={{ color: GREEN, fontSize: 11.5 }}>Tu generador →</Link>}
      </div>
      {mlOn && !ml && <button type="button" className="press" onClick={verMl} disabled={busy} style={{ justifySelf: 'start', minHeight: 34, padding: '0 12px', background: 'transparent', border: `1px solid ${CYAN}55`, color: CYAN, fontFamily: mono, fontSize: 11, cursor: 'pointer' }}>{busy ? 'CONSULTANDO…' : 'DATOS DE MERCADO LIBRE'}</button>}
      {ml && <div style={{ fontSize: 11.5, color: '#c8daf0', background: '#0b1017', padding: '8px 10px' }}>{ml.total.toLocaleString('es-CL')} publicaciones · precio típico {clp(ml.mediana)} (la mitad entre {clp(ml.p25)} y {clp(ml.p75)}, de {ml.n} vistas)</div>}
      {mlErr && <div style={{ fontSize: 11, color: AMBER }}>{mlErr}</div>}
      <button type="button" className="press" onClick={onAdd} style={{ justifySelf: 'start', minHeight: 36, padding: '0 14px', background: `${AMBER}18`, border: `1px solid ${AMBER}88`, color: AMBER, fontFamily: mono, fontSize: 11.5, letterSpacing: 1, cursor: 'pointer' }}>+ A MI TABLERO</button>
    </article>
  )
}

export default function RadarApp() {
  const [tab, setTab] = useState<Tab>('hoy')
  const items = useSyncExternalStore(tablero.subscribe, tablero.get, tablero.server)
  const [estado, setEstado] = useState<EstadoR | null>(null)
  const [aviso, setAviso] = useState('')
  const cal = useMemo(() => calendario(), [])
  const ranked = useMemo(() => IDEAS.map((i) => ({ i, ...puntaje(i, cal) })).sort((a, b) => b.total - a.total), [cal])

  useEffect(() => { radarEstado(getClave()).then((r) => { if (r.ok) setEstado(r.data) }) }, [])
  const guardarClave = async (c: string) => {
    try { if (c) localStorage.setItem(CLAVE_KEY, c); else localStorage.removeItem(CLAVE_KEY) } catch { /* sin almacenamiento */ }
    const r = await radarEstado(c)
    if (r.ok) setEstado(r.data)
    return r.ok && r.data.valida
  }
  const upd = (f: (v: Item[]) => Item[]) => tablero.set(f(tablero.get()))
  const add = (nombre: string, buscar?: string, notas = '') => {
    upd((v) => (v.some((x) => x.nombre === nombre) ? v : [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, nombre, estado: 'idea', notas, buscar, creado: Date.now() }, ...v]))
    setAviso(`«${nombre}» está en tu tablero`); setTimeout(() => setAviso(''), 2200)
  }

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '96px 20px 80px' }}>
        <div style={{ fontSize: 11, letterSpacing: 5, color: `${AMBER}bb`, marginBottom: 10 }}>NEGOCIO · PRIVADO · <Link href="/" style={{ color: `${AMBER}bb` }}>NEOPROXY.ART</Link></div>
        <h1 style={{ fontSize: 'clamp(30px, 7vw, 54px)', letterSpacing: 10, color: AMBER, margin: '0 0 8px' }}>RADAR</h1>
        <p style={{ fontSize: 12.5, lineHeight: 1.9, color: DIM, maxWidth: 820, margin: '0 0 22px' }}>
          Qué imprimir y vender, cuándo y por qué. Ideas con su lógica de negocio, las fechas que vienen, tu tablero de producción y, cuando conectes las fuentes, lo que está subiendo en el mundo maker y los precios reales de Mercado Libre.
        </p>
        <Clave estado={estado} guardar={guardarClave} />
        <nav style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 22, position: 'sticky', top: 0, zIndex: 5, background: '#000205', padding: '8px 0' }}>
          {([['hoy', 'HOY'], ['ideas', `IDEAS (${IDEAS.length})`], ['generar', 'GENERAR CON IA'], ['tablero', `MI TABLERO (${items.filter((x) => x.estado !== 'descartada').length})`], ['fuentes', 'FUENTES']] as [Tab, string][]).map(([k, l]) => <Chip key={k} on={tab === k} onClick={() => setTab(k)}>{l}</Chip>)}
        </nav>
        {aviso && <div role="status" style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 50, background: '#0b1017', border: `1px solid ${GREEN}`, color: GREEN, padding: '10px 16px', fontSize: 12 }}>{aviso}</div>}

        {tab === 'hoy' && <Hoy cal={cal} ranked={ranked} estado={estado} items={items} onAdd={add} go={setTab} />}
        {tab === 'ideas' && <Ideas ranked={ranked} onAdd={add} mlOn={!!estado?.mercadoLibre} />}
        {tab === 'generar' && <Generar onAdd={add} estado={estado} mlOn={!!estado?.mercadoLibre} evitar={items.map((x) => x.nombre)} />}
        {tab === 'tablero' && <Tablero items={items} upd={upd} add={add} />}
        {tab === 'fuentes' && <Fuentes estado={estado} />}
      </div>
      <style>{`@media (max-width: 760px) { .rd-cols { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}

function Hoy({ cal, ranked, estado, items, onAdd, go }: { cal: ReturnType<typeof calendario>; ranked: { i: Idea; total: number; fecha?: ReturnType<typeof calendario>[number] }[]; estado: EstadoR | null; items: Item[]; onAdd: (n: string, b?: string) => void; go: (t: Tab) => void }) {
  const activos = items.filter((x) => x.estado !== 'descartada' && x.estado !== 'idea')
  return (
    <div style={{ display: 'grid', gap: 26 }}>
      <section>
        <h2 style={{ fontSize: 12, letterSpacing: 3, color: AMBER, margin: '0 0 12px' }}>LAS FECHAS QUE VIENEN</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 8 }}>
          {cal.slice(0, 6).map((t) => {
            const c = t.estado === 'ahora' ? RED : t.estado === 'prepara' ? AMBER : FAINT
            return (
              <div key={t.id} style={{ background: '#080c12', border: `1px solid ${c}55`, padding: '12px 14px' }}>
                <div style={{ fontSize: 13, color: '#fff' }}>{t.nombre}</div>
                <div style={{ fontSize: 22, color: c, margin: '4px 0' }}>{t.dias === 0 ? 'hoy' : `${t.dias} días`}</div>
                <div style={{ fontSize: 11, color: DIM, lineHeight: 1.7 }}>{fecha(t.fecha)} · {t.estado === 'ahora' ? 'produce y publica ya' : t.estado === 'prepara' ? `empieza el ${fecha(t.empezar)}` : `empieza el ${fecha(t.empezar)}`}</div>
              </div>
            )
          })}
        </div>
      </section>
      <section>
        <h2 style={{ fontSize: 12, letterSpacing: 3, color: AMBER, margin: '0 0 6px' }}>LO QUE CONVIENE AHORA</h2>
        <p style={{ fontSize: 11.5, color: FAINT, margin: '0 0 12px' }}>Las seis ideas con más puntaje hoy: valor, volumen, poco esfuerzo, derechos claros y una fecha cercana en que se venden.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {ranked.slice(0, 6).map(({ i, total, fecha: f }) => <IdeaCard key={i.id} i={i} score={total} prox={f ? `${f.nombre} en ${f.dias} d` : undefined} onAdd={() => onAdd(i.nombre, i.buscar)} mlOn={!!estado?.mercadoLibre} />)}
        </div>
      </section>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        <div style={{ background: '#080c12', border: '1px solid #ffffff12', padding: '14px 16px' }}>
          <h2 style={{ fontSize: 12, letterSpacing: 3, color: AMBER, margin: '0 0 10px' }}>EN PRODUCCIÓN</h2>
          {activos.length ? activos.slice(0, 6).map((x) => <div key={x.id} style={{ fontSize: 12, lineHeight: 2 }}><span style={{ color: ESTADOS.find((e) => e.k === x.estado)?.c }}>{ESTADOS.find((e) => e.k === x.estado)?.label}</span> · {x.nombre}</div>)
            : <p style={{ fontSize: 12, color: DIM, margin: 0 }}>Nada todavía. Agrega ideas y muévelas: idea → prototipo → reel → a la venta.</p>}
          <button type="button" className="press" onClick={() => go('tablero')} style={{ marginTop: 10, minHeight: 34, background: 'transparent', border: `1px solid ${AMBER}66`, color: AMBER, fontFamily: mono, fontSize: 11, padding: '0 12px', cursor: 'pointer' }}>ABRIR TABLERO</button>
        </div>
        <div style={{ background: '#080c12', border: '1px solid #ffffff12', padding: '14px 16px', fontSize: 12, lineHeight: 2 }}>
          <h2 style={{ fontSize: 12, letterSpacing: 3, color: AMBER, margin: '0 0 10px' }}>CONEXIONES</h2>
          {[['Ideas con IA (Claude)', estado?.ia], ['Thingiverse', estado?.thingiverse], ['Mercado Libre Chile', estado?.mercadoLibre]].map(([l, on]) => (
            <div key={String(l)}><span style={{ color: on ? GREEN : estado ? AMBER : DIM }}>{on ? '● conectado' : estado ? '○ por conectar' : '…'}</span> · {l}</div>
          ))}
          <button type="button" className="press" onClick={() => go('fuentes')} style={{ marginTop: 10, minHeight: 34, background: 'transparent', border: `1px solid ${AMBER}66`, color: AMBER, fontFamily: mono, fontSize: 11, padding: '0 12px', cursor: 'pointer' }}>CÓMO CONECTAR</button>
        </div>
      </section>
    </div>
  )
}

function Ideas({ ranked, onAdd, mlOn }: { ranked: { i: Idea; total: number; fecha?: ReturnType<typeof calendario>[number] }[]; onAdd: (n: string, b?: string) => void; mlOn: boolean }) {
  const [cat, setCat] = useState<Cat | 'todas'>('todas'), [mat, setMat] = useState<'todos' | 'PLA' | 'Resina'>('todos'), [libres, setLibres] = useState(false), [q, setQ] = useState('')
  const list = ranked.filter(({ i }) => (cat === 'todas' || i.cat === cat) && (mat === 'todos' || i.material.includes(mat)) && (!libres || i.derechos !== 'licencia')
    && (!q.trim() || `${i.nombre} ${i.porque}`.toLowerCase().includes(q.trim().toLowerCase())))
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Chip on={cat === 'todas'} onClick={() => setCat('todas')}>TODAS</Chip>
        {(Object.keys(CAT_LABEL) as Cat[]).map((c) => <Chip key={c} on={cat === c} onClick={() => setCat(c)}>{CAT_LABEL[c].toUpperCase()}</Chip>)}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['todos', 'PLA', 'Resina'] as const).map((m) => <Chip key={m} on={mat === m} onClick={() => setMat(m)} color={CYAN}>{m.toUpperCase()}</Chip>)}
        <Chip on={libres} onClick={() => setLibres((v) => !v)} color={GREEN}>SIN LICENCIAS QUE COMPRAR</Chip>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="buscar…" aria-label="Buscar ideas" style={{ minHeight: 36, minWidth: 180, flex: '0 1 240px', background: '#02040a', border: '1px solid #ffffff2a', color: '#fff', fontFamily: mono, fontSize: 12, padding: '0 10px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {list.map(({ i, total, fecha: f }) => <IdeaCard key={i.id} i={i} score={total} prox={f ? `${f.nombre} en ${f.dias} d` : undefined} onAdd={() => onAdd(i.nombre, i.buscar)} mlOn={mlOn} />)}
      </div>
      {!list.length && <p style={{ fontSize: 12, color: DIM }}>Nada con esos filtros.</p>}
    </div>
  )
}

function Generar({ onAdd, estado, mlOn, evitar }: { onAdd: (n: string, b?: string, notas?: string) => void; estado: EstadoR | null; mlOn: boolean; evitar: string[] }) {
  const iaOn = estado ? estado.valida && estado.ia : null
  const [foco, setFoco] = useState(''), [mat, setMat] = useState<'ambos' | 'PLA' | 'Resina'>('ambos'), [n, setN] = useState(5)
  const [busy, setBusy] = useState(false), [err, setErr] = useState(''), [res, setRes] = useState<IdeaIA[]>([])
  const run = async () => {
    setBusy(true); setErr('')
    const r = await radarGenerarIdeas(getClave(), { foco, material: mat, cantidad: n, evitar: [...evitar, ...res.map((x) => x.nombre)] })
    setBusy(false)
    if (r.ok) setRes((v) => [...r.data, ...v]); else setErr(r.error)
  }
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ background: '#080c12', border: '1px solid #ffffff12', padding: '16px 18px', display: 'grid', gap: 12 }}>
        <p style={{ fontSize: 12, lineHeight: 1.9, color: DIM, margin: 0 }}>
          Claude propone ideas nuevas pensando en tu equipo, las fechas que vienen y lo que ya tienes en la lista (no las repite). Cada idea trae derechos, costo, gancho de reel y el primer paso para probarla.
          Cada generación usa tu clave de Anthropic (unos centavos de dólar).
        </p>
        <label style={{ display: 'block' }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, color: DIM, marginBottom: 6 }}>FOCO (OPCIONAL)</div>
          <input value={foco} onChange={(e) => setFoco(e.target.value)} placeholder="ej.: regalos para profesores, cosas para cafeterías, mascotas, gamers…" style={{ width: '100%', minHeight: 40, background: '#02040a', border: '1px solid #ffffff2a', color: '#fff', fontFamily: mono, fontSize: 12, padding: '0 10px' }} />
        </label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {(['ambos', 'PLA', 'Resina'] as const).map((m) => <Chip key={m} on={mat === m} onClick={() => setMat(m)} color={CYAN}>{m === 'ambos' ? 'PLA O RESINA' : m.toUpperCase()}</Chip>)}
          <span style={{ width: 10 }} />
          {[3, 5, 8].map((k) => <Chip key={k} on={n === k} onClick={() => setN(k)}>{k} IDEAS</Chip>)}
        </div>
        <button type="button" className="press" onClick={run} disabled={busy || iaOn === false} style={{ justifySelf: 'start', minHeight: 46, padding: '0 22px', border: 'none', background: `linear-gradient(90deg,${AMBER},#ffe3a8)`, color: '#140c02', fontFamily: mono, fontWeight: 700, fontSize: 12, letterSpacing: 2, cursor: 'pointer', opacity: busy || iaOn === false ? 0.5 : 1 }}>{busy ? 'PENSANDO… (HASTA 1 MIN)' : '✦ GENERAR IDEAS'}</button>
        {iaOn === false && <p style={{ fontSize: 11.5, color: AMBER, margin: 0 }}>{estado && !estado.valida ? 'Escribe tu clave de RADAR arriba para usar la IA.' : 'Falta ANTHROPIC_API_KEY en el servidor (la misma que usa el oráculo).'}</p>}
        {err && <p style={{ fontSize: 11.5, color: AMBER, margin: 0 }}>{err}</p>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {res.map((i, k) => <IdeaCard key={`${i.nombre}-${k}`} i={i} onAdd={() => onAdd(i.nombre, i.buscar, `${i.porque}\nMañana: ${i.primerPaso}`)} mlOn={mlOn} />)}
      </div>
    </div>
  )
}

function Tablero({ items, upd, add }: { items: Item[]; upd: (f: (v: Item[]) => Item[]) => void; add: (n: string, b?: string) => void }) {
  const [nuevo, setNuevo] = useState('')
  const set = (id: string, p: Partial<Item>) => upd((v) => v.map((x) => (x.id === id ? { ...x, ...p } : x)))
  const mover = (id: string, d: number) => upd((v) => v.map((x) => { if (x.id !== id) return x; const k = ESTADOS.findIndex((e) => e.k === x.estado); return { ...x, estado: ESTADOS[Math.max(0, Math.min(ESTADOS.length - 1, k + d))].k } }))
  const exportar = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' })); a.download = `radar-tablero-${new Date().toISOString().slice(0, 10)}.json`; a.click() }
  const importar = (f: File) => f.text().then((t) => { try { const v = JSON.parse(t); if (Array.isArray(v)) upd(() => v) } catch { /* archivo inválido */ } })
  const num = (s: string) => { const v = Number(s.replace(/[^\d]/g, '')); return s.trim() && Number.isFinite(v) ? v : undefined }
  const totales = items.reduce((t, x) => ({ ventas: t.ventas + (x.vendidas ?? 0) * (x.precio ?? 0), margen: t.margen + (x.vendidas ?? 0) * ((x.precio ?? 0) - (x.costo ?? 0)) }), { ventas: 0, margen: 0 })
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={nuevo} onChange={(e) => setNuevo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && nuevo.trim()) { add(nuevo.trim()); setNuevo('') } }} placeholder="nueva idea propia…" aria-label="Nueva idea" style={{ minHeight: 40, flex: '1 1 240px', background: '#02040a', border: '1px solid #ffffff2a', color: '#fff', fontFamily: mono, fontSize: 12, padding: '0 10px' }} />
        <Chip on={false} onClick={() => { if (nuevo.trim()) { add(nuevo.trim()); setNuevo('') } }}>+ AGREGAR</Chip>
        <Chip on={false} onClick={exportar} color={CYAN}>EXPORTAR</Chip>
        <label className="press" style={{ minHeight: 36, padding: '0 12px', display: 'inline-flex', alignItems: 'center', border: '1px solid #ffffff26', color: '#9fb4cc', fontSize: 11.5, letterSpacing: 1.2, cursor: 'pointer' }}>IMPORTAR<input type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importar(f) }} /></label>
      </div>
      <p style={{ fontSize: 11.5, color: FAINT, margin: 0 }}>El tablero se guarda en este navegador. Expórtalo de vez en cuando (o para pasarlo a otro equipo). Ventas registradas: {clp(totales.ventas)} · margen: {clp(totales.margen)}.</p>
      <div className="rd-cols" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10, alignItems: 'start' }}>
        {ESTADOS.map((e) => (
          <section key={e.k} style={{ background: '#05080d', border: `1px solid ${e.c}33`, padding: 8, display: 'grid', gap: 8, minHeight: 80 }}>
            <h2 style={{ fontSize: 11, letterSpacing: 2, color: e.c, margin: '2px 4px' }}>{e.label} · {items.filter((x) => x.estado === e.k).length}</h2>
            {items.filter((x) => x.estado === e.k).map((x) => {
              const m = x.precio !== undefined && x.costo !== undefined ? x.precio - x.costo : undefined
              return (
                <div key={x.id} style={{ background: '#0b1017', border: '1px solid #ffffff12', padding: 8, display: 'grid', gap: 6 }}>
                  <div style={{ fontSize: 12, color: '#fff', lineHeight: 1.5 }}>{x.nombre}</div>
                  <textarea value={x.notas} onChange={(ev) => set(x.id, { notas: ev.target.value })} placeholder="notas, proveedor, ajustes de impresión…" rows={2} style={{ width: '100%', background: '#02040a', border: '1px solid #ffffff1a', color: '#c8daf0', fontFamily: mono, fontSize: 11, padding: 6, resize: 'vertical' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                    {([['costo', 'COSTO'], ['precio', 'PRECIO'], ['vendidas', 'VENDIDAS']] as const).map(([k, l]) => (
                      <label key={k} style={{ fontSize: 9.5, color: FAINT, letterSpacing: 1 }}>{l}<input inputMode="numeric" value={x[k] ?? ''} onChange={(ev) => set(x.id, { [k]: num(ev.target.value) })} style={{ width: '100%', background: '#02040a', border: '1px solid #ffffff1a', color: '#fff', fontFamily: mono, fontSize: 11, padding: '4px 5px' }} /></label>
                    ))}
                  </div>
                  {m !== undefined && <div style={{ fontSize: 10.5, color: m > 0 ? GREEN : RED }}>margen {clp(m)} por unidad{x.precio ? ` (${Math.round((100 * m) / x.precio)} %)` : ''}</div>}
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
                    <button type="button" aria-label="Mover atrás" onClick={() => mover(x.id, -1)} style={{ minWidth: 36, minHeight: 30, background: 'transparent', border: '1px solid #ffffff22', color: DIM, cursor: 'pointer' }}>←</button>
                    {x.buscar && <a href={enlaces(x.buscar).mercadoLibre} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10.5, color: CYAN, alignSelf: 'center' }}>ML ↗</a>}
                    <button type="button" aria-label="Borrar" onClick={() => { if (confirm(`¿Borrar «${x.nombre}»?`)) upd((v) => v.filter((y) => y.id !== x.id)) }} style={{ minWidth: 36, minHeight: 30, background: 'transparent', border: '1px solid #ffffff22', color: FAINT, cursor: 'pointer' }}>✕</button>
                    <button type="button" aria-label="Mover adelante" onClick={() => mover(x.id, 1)} style={{ minWidth: 36, minHeight: 30, background: 'transparent', border: '1px solid #ffffff22', color: DIM, cursor: 'pointer' }}>→</button>
                  </div>
                </div>
              )
            })}
          </section>
        ))}
      </div>
    </div>
  )
}

function Fuentes({ estado }: { estado: EstadoR | null }) {
  const [modo, setModo] = useState<'popular' | 'newest' | 'featured'>('popular'), [q, setQ] = useState(''), [solo, setSolo] = useState(false)
  const [tv, setTv] = useState<RadarItem[] | null>(null), [tvErr, setTvErr] = useState(''), [busy, setBusy] = useState(false)
  const cargar = async (m = modo) => { setBusy(true); setTvErr(''); const r = await radarThingiverse(getClave(), m, q); setBusy(false); if (r.ok) setTv(r.data); else setTvErr(r.error) }
  const conectado = !!estado?.thingiverse
  useEffect(() => {
    if (!conectado) return
    let vivo = true
    radarThingiverse(getClave(), 'popular').then((r) => { if (!vivo) return; if (r.ok) setTv(r.data); else setTvErr(r.error) })
    return () => { vivo = false }
  }, [conectado])
  const V = { si: [GREEN, 'SE PUEDE VENDER'], no: [RED, 'NO COMERCIAL'], revisar: [AMBER, 'REVISAR LICENCIA'] } as const
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section>
        <h2 style={{ fontSize: 12, letterSpacing: 3, color: AMBER, margin: '0 0 12px' }}>THINGIVERSE · LO QUE SUBE EN EL MUNDO MAKER</h2>
        {estado?.thingiverse ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {([['popular', 'POPULARES'], ['newest', 'NUEVOS'], ['featured', 'DESTACADOS']] as const).map(([k, l]) => <Chip key={k} on={modo === k} onClick={() => { setModo(k); cargar(k) }}>{l}</Chip>)}
              <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') cargar() }} placeholder="buscar (Enter)…" style={{ minHeight: 36, flex: '0 1 220px', background: '#02040a', border: '1px solid #ffffff2a', color: '#fff', fontFamily: mono, fontSize: 12, padding: '0 10px' }} />
              <Chip on={solo} onClick={() => setSolo((v) => !v)} color={GREEN}>SOLO VENDIBLES</Chip>
            </div>
            {busy && <p style={{ fontSize: 12, color: DIM }}>Cargando…</p>}
            {tvErr && <p style={{ fontSize: 12, color: AMBER }}>{tvErr}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {(tv ?? []).filter((t) => !solo || t.vendible === 'si').map((t) => (
                <a key={t.id} href={t.url} target="_blank" rel="noopener noreferrer" style={{ background: '#080c12', border: '1px solid #ffffff12', textDecoration: 'none', color: 'inherit', display: 'grid' }}>
                  {t.img && <img src={t.img} alt="" loading="lazy" style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', background: '#0b1017' }} />}
                  <div style={{ padding: '8px 10px', display: 'grid', gap: 4 }}>
                    <div style={{ fontSize: 12, color: '#fff', lineHeight: 1.4 }}>{t.titulo}</div>
                    <div style={{ fontSize: 10.5, color: DIM }}>{t.autor ?? ''}{t.likes !== undefined ? ` · ♥ ${t.likes.toLocaleString('es-CL')}` : ''}</div>
                    <span style={{ fontSize: 10, letterSpacing: 1, color: V[t.vendible][0] }}>{V[t.vendible][1]}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <ol style={{ margin: 0, padding: '0 0 0 18px' }}>
            <Paso n="1.">Entra a thingiverse.com/developers, crea una app («Web app») y copia el <b>App Token</b>.</Paso>
            <Paso n="2.">En tu terminal: <code style={{ color: '#fff' }}>vercel env add THINGIVERSE_TOKEN</code> y pega el token cuando lo pida (producción).</Paso>
            <Paso n="3.">Vuelve a desplegar. Esta sección mostrará populares, nuevos y destacados, con la licencia de cada uno.</Paso>
          </ol>
        )}
      </section>
      <section>
        <h2 style={{ fontSize: 12, letterSpacing: 3, color: AMBER, margin: '0 0 12px' }}>MERCADO LIBRE CHILE · LO QUE SE VENDE AQUÍ</h2>
        {estado?.mercadoLibre ? <p style={{ fontSize: 12, color: DIM }}>Conectado: en cada idea aparece el botón «DATOS DE MERCADO LIBRE» con la cantidad de publicaciones y el rango de precios.</p> : (
          <ol style={{ margin: 0, padding: '0 0 0 18px' }}>
            <Paso n="1.">En developers.mercadolibre.cl crea una aplicación y copia el <b>Client ID</b> y el <b>Client Secret</b>.</Paso>
            <Paso n="2.">Cárgalos con <code style={{ color: '#fff' }}>vercel env add MERCADOLIBRE_CLIENT_ID</code> y <code style={{ color: '#fff' }}>vercel env add MERCADOLIBRE_CLIENT_SECRET</code>.</Paso>
            <Paso n="3.">Mientras tanto, cada idea tiene su enlace «Precios en ML» para mirarlo a mano.</Paso>
          </ol>
        )}
      </section>
      <section>
        <h2 style={{ fontSize: 12, letterSpacing: 3, color: AMBER, margin: '0 0 6px' }}>MIRAR A MANO</h2>
        <p style={{ fontSize: 11.5, color: FAINT, margin: '0 0 10px' }}>Sin API pública (Printables, MakerWorld) o sin conectar todavía. Revisa siempre la licencia antes de vender una impresión.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
          {[
            ['Printables', 'https://www.printables.com/', 'Prusa. Concursos y modelos populares.'],
            ['MakerWorld', 'https://makerworld.com/', 'Bambu Lab. Mucho modelo nuevo; revisa la licencia.'],
            ['Thingiverse', 'https://www.thingiverse.com/', 'El archivo más grande; muchos «no comercial».'],
            ['Cults3D', 'https://cults3d.com/', 'Modelos de pago: lo que la gente compra.'],
            ['MyMiniFactory', 'https://www.myminifactory.com/', 'Miniaturas y licencias para vender impresiones.'],
            ['Etsy · impresiones 3D', 'https://www.etsy.com/search?q=3d+printed', 'Qué se vende hecho y a qué precio.'],
            ['Mercado Libre · impresión 3D', 'https://listado.mercadolibre.cl/impresion-3d', 'La competencia local.'],
          ].map(([n, u, d]) => (
            <a key={n} href={u} target="_blank" rel="noopener noreferrer" style={{ background: '#080c12', border: '1px solid #ffffff12', padding: '12px 14px', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ fontSize: 12.5, color: CYAN }}>{n} ↗</div>
              <div style={{ fontSize: 11, color: DIM, marginTop: 4, lineHeight: 1.6 }}>{d}</div>
            </a>
          ))}
        </div>
      </section>
      <section style={{ fontSize: 11.5, lineHeight: 1.9, color: FAINT }}>
        <b style={{ color: '#fff' }}>Sobre licencias:</b> «no comercial» (NC) o «uso personal» significa que no puedes vender la impresión. CC BY, CC BY-SA, CC0 o una licencia comercial comprada sí lo permiten (con atribución si la piden). Lo más seguro para vender: tus diseños y tus generadores.
        {' '}Temporadas de referencia: {Object.values(TEMPORADA_NOMBRE).join(', ')}.
      </section>
    </div>
  )
}

function Clave({ estado, guardar }: { estado: EstadoR | null; guardar: (c: string) => Promise<boolean> }) {
  const [v, setV] = useState(''), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  if (!estado) return null
  if (estado.valida) {
    return (
      <div style={{ fontSize: 11.5, color: GREEN, margin: '0 0 14px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span>● clave activa en este navegador: IA y fuentes habilitadas</span>
        <button type="button" onClick={() => { void guardar('') }} style={{ minHeight: 30, background: 'transparent', border: '1px solid #ffffff22', color: FAINT, fontFamily: mono, fontSize: 10.5, padding: '0 10px', cursor: 'pointer' }}>OLVIDAR CLAVE</button>
      </div>
    )
  }
  return (
    <div style={{ background: '#0b0a06', border: `1px solid ${AMBER}44`, padding: '12px 14px', margin: '0 0 16px', display: 'grid', gap: 8 }}>
      <div style={{ fontSize: 12, color: '#fff' }}>🔒 Ideas, calendario y tablero funcionan sin clave. La IA y las fuentes externas gastan tus créditos: piden tu clave de RADAR.</div>
      {estado.configurada ? (
        <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); const ok = await guardar(v.trim()); setBusy(false); setMsg(ok ? '' : 'Clave incorrecta.'); if (ok) setV('') }} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input type="password" value={v} onChange={(e) => setV(e.target.value)} placeholder="tu clave de RADAR" aria-label="Clave de RADAR" autoComplete="current-password" style={{ minHeight: 38, flex: '0 1 280px', background: '#02040a', border: '1px solid #ffffff2a', color: '#fff', fontFamily: mono, fontSize: 12, padding: '0 10px' }} />
          <button type="submit" disabled={busy || !v.trim()} style={{ minHeight: 38, padding: '0 14px', background: `${AMBER}22`, border: `1px solid ${AMBER}`, color: AMBER, fontFamily: mono, fontSize: 11.5, letterSpacing: 1, cursor: 'pointer' }}>{busy ? 'PROBANDO…' : 'GUARDAR EN ESTE NAVEGADOR'}</button>
          {msg && <span style={{ fontSize: 11.5, color: RED, alignSelf: 'center' }}>{msg}</span>}
        </form>
      ) : (
        <div style={{ fontSize: 11.5, color: DIM, lineHeight: 1.8 }}>
          Todavía no hay clave en el servidor. Inventa una larga (16+ caracteres) y cárgala con <code style={{ color: '#fff' }}>vercel env add RADAR_CLAVE</code> (producción); vuelve a desplegar y escríbela aquí.
        </div>
      )}
    </div>
  )
}
