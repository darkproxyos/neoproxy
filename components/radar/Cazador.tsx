'use client'

// CAZADOR — ofertas en lo que necesitas comprar (resina, PLA, impresoras, alcohol) y lo
// que la gente está buscando en Chile esta semana. Panel solo: lo nuevo se marca
// contra tu última visita desde este navegador.

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { radarCazar, radarTendencias, radarDiagnosticoML } from '@/app/radar/actions'
import { VIGILANCIAS_BASE, enlacesML, limpiarVigilancia, type Vigilancia, type Evaluada, type Tipo } from '@/lib/radar/ofertas'
import type { Caza, Tendencias, Prueba } from '@/lib/radar/ml'
import { mono, AMBER, GREEN, RED, CYAN, DIM, FAINT, clp, getClave, Chip, Tag, A, Paso, almacen, type EstadoR } from './ui'

const vigStore = almacen<Vigilancia[]>('npx-radar-vigilancias-v1', VIGILANCIAS_BASE, (v) =>
  Array.isArray(v) ? v.map(limpiarVigilancia).filter((x): x is Vigilancia => !!x) : null)
const vistosStore = almacen<Record<string, string[]>>('npx-radar-vistos-v1', {}, (v) =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, string[]>) : null)

type Sub = 'ofertas' | 'tendencias' | 'ajustes'
const card: React.CSSProperties = { background: '#080c12', border: '1px solid #ffffff12', padding: '14px 16px' }
const btn = (c: string): React.CSSProperties => ({ minHeight: 36, padding: '0 14px', background: `${c}18`, border: `1px solid ${c}88`, color: c, fontFamily: mono, fontSize: 11.5, letterSpacing: 1, cursor: 'pointer' })
const input: React.CSSProperties = { minHeight: 38, background: '#02040a', border: '1px solid #ffffff2a', color: '#fff', fontFamily: mono, fontSize: 12, padding: '0 10px' }

export default function Cazador({ estado, ideasCon }: { estado: EstadoR | null; ideasCon: (foco: string) => void }) {
  const [sub, setSub] = useState<Sub>('ofertas')
  const vigs = useSyncExternalStore(vigStore.subscribe, vigStore.get, vigStore.server)
  const mlOn = !!estado?.valida && !!estado?.mercadoLibre
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <p style={{ fontSize: 12, lineHeight: 1.9, color: DIM, margin: 0, maxWidth: 860 }}>
        Mercado Libre Chile, mirado por ti: las publicaciones con descuento real o bajo el precio típico en lo que necesitas comprar, y lo que más está buscando la gente esta semana para pensar qué imprimir y vender.
      </p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {([['ofertas', 'OFERTAS'], ['tendencias', 'TENDENCIAS'], ['ajustes', 'QUÉ VIGILO · DIAGNÓSTICO']] as [Sub, string][]).map(([k, l]) => <Chip key={k} on={sub === k} onClick={() => setSub(k)} color={CYAN}>{l}</Chip>)}
      </div>
      {!mlOn && <SinConexion estado={estado} />}
      {sub === 'ofertas' && <Ofertas vigs={vigs} mlOn={mlOn} />}
      {sub === 'tendencias' && <TendenciasV mlOn={mlOn} ideasCon={ideasCon} />}
      {sub === 'ajustes' && <Ajustes vigs={vigs} estado={estado} />}
    </div>
  )
}

function SinConexion({ estado }: { estado: EstadoR | null }) {
  if (!estado) return null
  return (
    <div style={{ ...card, borderColor: `${AMBER}44` }}>
      <div style={{ fontSize: 12, color: '#fff', marginBottom: 6 }}>{estado.valida ? 'Mercado Libre todavía no está conectado.' : 'Escribe tu clave de RADAR arriba para que el cazador revise Mercado Libre por ti.'}</div>
      <div style={{ fontSize: 11.5, color: DIM, lineHeight: 1.8 }}>Mientras tanto, los enlaces de cada vigilancia abren Mercado Libre ordenado del más barato al más caro: funcionan ya, sin configurar nada.</div>
      {estado.valida && (
        <ol style={{ margin: '8px 0 0', padding: '0 0 0 18px' }}>
          <Paso n="1.">En developers.mercadolibre.cl entra con tu cuenta, «Crear aplicación» (nombre y descripción cualquiera; como URL de redirección puedes poner https://neoproxy.art) y copia el <b>Client ID</b> y el <b>Client Secret</b>.</Paso>
          <Paso n="2.">En Termux: <code style={{ color: '#fff' }}>vercel env add MERCADOLIBRE_CLIENT_ID production</code> y luego <code style={{ color: '#fff' }}>vercel env add MERCADOLIBRE_CLIENT_SECRET production</code>.</Paso>
          <Paso n="3."><code style={{ color: '#fff' }}>npx vercel --prod --force</code>, vuelve aquí y abre «DIAGNÓSTICO» para ver qué responde.</Paso>
        </ol>
      )}
    </div>
  )
}

// --- ofertas ----------------------------------------------------------------------
type Fila = Caza | { id: string; error: string }

function Ofertas({ vigs, mlOn }: { vigs: Vigilancia[]; mlOn: boolean }) {
  const [res, setRes] = useState<Record<string, Fila> | null>(null)
  const [nuevos, setNuevos] = useState<Record<string, string[]>>({})
  const [err, setErr] = useState(''), [cuando, setCuando] = useState<number | null>(null), [busy, setBusy] = useState(false)
  const [solo, setSolo] = useState(false)

  const aplicar = useCallback((r: Awaited<ReturnType<typeof radarCazar>>) => {
    if (!r.ok) { setErr(r.error); return }
    const vistos = vistosStore.get(), nv: Record<string, string[]> = {}, marcas: Record<string, string[]> = {}
    for (const c of r.data) {
      if (!('items' in c)) continue
      const prev = vistos[c.id], ids = c.items.map((x) => x.id)
      marcas[c.id] = prev ? ids.filter((id) => !prev.includes(id)) : [] // la primera vez nada es «nuevo»
      nv[c.id] = [...new Set([...ids, ...(prev ?? [])])].slice(0, 500)
    }
    vistosStore.set({ ...vistos, ...nv })
    setNuevos(marcas); setRes(Object.fromEntries(r.data.map((c) => [c.id, c as Fila]))); setCuando(Date.now()); setErr('')
  }, [])
  useEffect(() => {
    if (!mlOn) return
    let vivo = true
    radarCazar(getClave(), vigs).then((r) => { if (vivo) aplicar(r) })
    return () => { vivo = false }
  }, [mlOn, vigs, aplicar])
  const revisar = async () => { setBusy(true); const r = await radarCazar(getClave(), vigs); setBusy(false); aplicar(r) }
  const cargando = mlOn && !res && !err

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {mlOn && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="press" onClick={revisar} disabled={busy || cargando} style={{ ...btn(AMBER), opacity: busy || cargando ? 0.5 : 1 }}>{busy || cargando ? 'REVISANDO MERCADO LIBRE…' : '↻ REVISAR AHORA'}</button>
          <Chip on={solo} onClick={() => setSolo((v) => !v)} color={GREEN}>SOLO OPORTUNIDADES</Chip>
          {cuando && <span style={{ fontSize: 11, color: FAINT }}>revisado {new Date(cuando).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} · los precios se guardan 30 min</span>}
        </div>
      )}
      {err && <p style={{ fontSize: 12, color: AMBER, margin: 0 }}>{err}</p>}
      {vigs.map((v) => <Bloque key={v.id} v={v} f={res?.[v.id]} nuevos={nuevos[v.id] ?? []} solo={solo} cargando={cargando} />)}
      <p style={{ fontSize: 11, color: FAINT, lineHeight: 1.8, margin: 0 }}>
        Oportunidad = 20 % o más de descuento declarado, 20 % o más bajo el precio típico de la búsqueda (en materiales se compara el precio por kg o litro leído del título) o bajo tu tope. Antes de comprar mira la reputación del vendedor y el costo de envío.
      </p>
    </div>
  )
}

function Bloque({ v, f, nuevos, solo, cargando }: { v: Vigilancia; f?: Fila; nuevos: string[]; solo: boolean; cargando: boolean }) {
  const [todo, setTodo] = useState(false)
  const e = enlacesML(v.q)
  const c = f && 'items' in f ? f : undefined
  const lista = c ? c.items.filter((x) => (solo ? x.ganga : !x.raro)) : []
  const nNuevos = c ? c.items.filter((x) => nuevos.includes(x.id) && !x.raro).length : 0
  return (
    <section style={{ ...card, display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <h3 style={{ fontSize: 13.5, color: '#fff', margin: 0 }}>{v.nombre}</h3>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {c && <Tag c={c.gangas ? GREEN : DIM}>{c.gangas} {c.gangas === 1 ? 'OPORTUNIDAD' : 'OPORTUNIDADES'}</Tag>}
          {nNuevos > 0 && <Tag c={CYAN}>{nNuevos} {nNuevos === 1 ? 'NUEVA' : 'NUEVAS'}</Tag>}
          {c?.mediana !== undefined && <Tag>TÍPICO {clp(c.mediana)}{c.base === 'unidad' ? ' /KG·L' : ''}</Tag>}
          {v.tope !== undefined && <Tag c={AMBER}>TOPE {clp(v.tope)}{v.tipo === 'material' ? ' /KG·L' : ''}</Tag>}
          {c?.via === 'catalogo' && <Tag c={AMBER}>VÍA CATÁLOGO</Tag>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <A href={e.barato}>Más barato primero ↗</A><A href={e.relevante}>Más relevante ↗</A>
        {c?.categoria && <span style={{ fontSize: 11, color: FAINT, alignSelf: 'center' }}>categoría: {c.categoria}</span>}
      </div>
      {cargando && <div style={{ fontSize: 11.5, color: FAINT }}>Buscando…</div>}
      {f && 'error' in f && <div style={{ fontSize: 11.5, color: AMBER }}>{f.error}</div>}
      {c && lista.length === 0 && <div style={{ fontSize: 11.5, color: FAINT }}>{solo ? 'Nada bajo lo típico ni con descuento fuerte ahora.' : 'Sin resultados.'}</div>}
      {lista.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 8 }}>
          {(todo ? lista : lista.slice(0, 6)).map((o) => <OfertaCard key={o.id} o={o} nueva={nuevos.includes(o.id)} />)}
        </div>
      )}
      {lista.length > 6 && <button type="button" onClick={() => setTodo((t) => !t)} style={{ ...btn(DIM), justifySelf: 'start' }}>{todo ? 'VER MENOS' : `VER LAS ${lista.length}`}</button>}
    </section>
  )
}

function OfertaCard({ o, nueva }: { o: Evaluada; nueva: boolean }) {
  return (
    <a href={o.url} target="_blank" rel="noopener noreferrer" style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 10, background: '#0b1017', border: `1px solid ${o.ganga ? `${GREEN}55` : '#ffffff10'}`, padding: 8, textDecoration: 'none', color: 'inherit' }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- miniaturas externas de Mercado Libre */}
      {o.img ? <img src={o.img} alt="" loading="lazy" style={{ width: 64, height: 64, objectFit: 'contain', background: '#fff' }} /> : <span style={{ width: 64, height: 64, background: '#101820' }} />}
      <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, color: '#fff', lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{o.titulo}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, color: o.ganga ? GREEN : '#fff', fontWeight: 700 }}>{clp(o.precio)}</span>
          {o.original && o.original > o.precio && <s style={{ fontSize: 11, color: FAINT }}>{clp(o.original)}</s>}
          {o.porUnidad !== undefined && o.cantidad && <span style={{ fontSize: 11, color: CYAN }}>{clp(o.porUnidad)}/{o.cantidad.unidad} · {o.cantidad.valor.toLocaleString('es-CL')} {o.cantidad.unidad}</span>}
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {o.ganga && <Tag c={GREEN}>OPORTUNIDAD</Tag>}
          {nueva && <Tag c={CYAN}>NUEVA</Tag>}
          {o.descuento !== undefined && o.descuento >= 5 && <Tag c={GREEN}>−{o.descuento}%</Tag>}
          {o.envioGratis && <Tag>ENVÍO GRATIS</Tag>}
          {o.usado && <Tag c={AMBER}>USADO</Tag>}
          {o.raro && <Tag c={RED}>REVISAR</Tag>}
        </div>
        {o.motivos.length > 0 && <div style={{ fontSize: 10.5, color: DIM, lineHeight: 1.5 }}>{o.motivos.join(' · ')}</div>}
      </div>
    </a>
  )
}

// --- tendencias -----------------------------------------------------------------------
function TendenciasV({ mlOn, ideasCon }: { mlOn: boolean; ideasCon: (foco: string) => void }) {
  const [cat, setCat] = useState('')
  const [data, setData] = useState<{ cat: string; t: Tendencias } | null>(null), [err, setErr] = useState('')
  const [cats, setCats] = useState<Tendencias['categorias']>([])
  useEffect(() => {
    if (!mlOn) return
    let vivo = true
    radarTendencias(getClave(), cat || undefined).then((r) => {
      if (!vivo) return
      if (r.ok) { setData({ cat, t: r.data }); if (r.data.categorias.length) setCats(r.data.categorias) } else setErr(r.error)
    })
    return () => { vivo = false }
  }, [mlOn, cat])
  const cargando = mlOn && data?.cat !== cat && !err
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <p style={{ fontSize: 12, lineHeight: 1.9, color: DIM, margin: 0, maxWidth: 860 }}>
        Las búsquedas que más crecen en Mercado Libre Chile esta semana (se actualiza cada semana). Busca las que una impresión resuelve: accesorios, soportes, organizadores, repuestos, figuras, regalos. Con <b style={{ color: '#fff' }}>✦ IDEAS</b> le pides a la IA qué imprimir para esa búsqueda.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {mlOn && (
          <select value={cat} onChange={(e) => { setErr(''); setCat(e.target.value) }} aria-label="Categoría" style={{ ...input, minWidth: 240 }}>
            <option value="">Todo Chile</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        )}
        <A href="https://tendencias.mercadolibre.cl/">Tendencias en la web de Mercado Libre ↗</A>
      </div>
      {cargando && <p style={{ fontSize: 12, color: FAINT, margin: 0 }}>Cargando…</p>}
      {err && <p style={{ fontSize: 12, color: AMBER, margin: 0 }}>{err}</p>}
      {data?.cat === cat && (
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 6 }}>
          {data.t.lista.map((x, k) => (
            <li key={x.keyword} style={{ ...card, padding: '8px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: FAINT, width: 22 }}>{k + 1}</span>
              <a href={x.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: 12, color: '#fff', textDecoration: 'none', minWidth: 0, overflowWrap: 'anywhere' }}>{x.keyword} <span style={{ color: CYAN }}>↗</span></a>
              <button type="button" className="press" onClick={() => ideasCon(x.keyword)} style={{ ...btn(AMBER), minHeight: 32, padding: '0 10px', fontSize: 10.5 }}>✦ IDEAS</button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

// --- qué vigilo · diagnóstico ---------------------------------------------------------
function Ajustes({ vigs, estado }: { vigs: Vigilancia[]; estado: EstadoR | null }) {
  const [nombre, setNombre] = useState(''), [q, setQ] = useState(''), [tipo, setTipo] = useState<Tipo>('material'), [tope, setTope] = useState('')
  const [diag, setDiag] = useState<Prueba[] | null>(null), [dErr, setDErr] = useState(''), [dBusy, setDBusy] = useState(false)
  const guardar = (v: Vigilancia[]) => vigStore.set(v)
  const agregar = () => {
    const v = limpiarVigilancia({ id: `c-${Date.now().toString(36)}`, nombre, q, tipo, tope: tope ? Number(tope.replace(/\D/g, '')) : undefined })
    if (!v) return
    guardar([...vigs, v].slice(0, 12)); setNombre(''); setQ(''); setTope('')
  }
  const probar = async () => { setDBusy(true); setDErr(''); const r = await radarDiagnosticoML(getClave()); setDBusy(false); if (r.ok) setDiag(r.data); else setDErr(r.error) }
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section style={{ display: 'grid', gap: 8 }}>
        <h2 style={{ fontSize: 12, letterSpacing: 3, color: AMBER, margin: 0 }}>QUÉ VIGILO ({vigs.length}/12)</h2>
        {vigs.map((v, k) => (
          <div key={v.id} style={{ ...card, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 220px', minWidth: 0 }}>
              <div style={{ fontSize: 12.5, color: '#fff' }}>{v.nombre}</div>
              <div style={{ fontSize: 11, color: FAINT }}>«{v.q}» · {v.tipo === 'material' ? 'compara $ por kg o litro' : 'compara precio total'}</div>
            </div>
            <label style={{ fontSize: 11, color: DIM, display: 'flex', gap: 6, alignItems: 'center' }}>
              tope {v.tipo === 'material' ? '$/kg·L' : '$'}
              <input inputMode="numeric" aria-label={`Tope de ${v.nombre}`} value={v.tope ?? ''} placeholder="—" onChange={(e) => { const n = Number(e.target.value.replace(/\D/g, '')); guardar(vigs.map((x, j) => (j === k ? { ...x, tope: n > 0 ? n : undefined } : x))) }} style={{ ...input, width: 110, minHeight: 34 }} />
            </label>
            <button type="button" aria-label={`Quitar ${v.nombre}`} onClick={() => guardar(vigs.filter((_, j) => j !== k))} style={{ ...btn(RED), minHeight: 34, padding: '0 10px' }}>✕</button>
          </div>
        ))}
        <form onSubmit={(e) => { e.preventDefault(); agregar() }} style={{ ...card, display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, color: DIM }}>AGREGAR</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="qué buscar (ej.: filamento petg 1kg)" aria-label="Qué buscar" style={{ ...input, flex: '1 1 240px' }} />
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="nombre (opcional)" aria-label="Nombre" style={{ ...input, flex: '1 1 160px' }} />
            <input value={tope} onChange={(e) => setTope(e.target.value)} inputMode="numeric" placeholder={tipo === 'material' ? 'tope $/kg (opcional)' : 'tope $ (opcional)'} aria-label="Tope" style={{ ...input, flex: '0 1 170px' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip on={tipo === 'material'} onClick={() => setTipo('material')} color={CYAN}>MATERIAL ($/KG·L)</Chip>
            <Chip on={tipo === 'equipo'} onClick={() => setTipo('equipo')} color={CYAN}>EQUIPO ($ TOTAL)</Chip>
            <button type="submit" disabled={q.trim().length < 2 || vigs.length >= 12} style={{ ...btn(AMBER), opacity: q.trim().length < 2 ? 0.5 : 1 }}>+ VIGILAR</button>
            <button type="button" onClick={() => guardar(VIGILANCIAS_BASE)} style={{ ...btn(DIM) }}>RESTAURAR LAS DE FÁBRICA</button>
          </div>
        </form>
        <p style={{ fontSize: 11, color: FAINT, margin: 0, lineHeight: 1.8 }}>Esta lista vive en este navegador. Las publicaciones nuevas se marcan contra tu última visita; avisos por Telegram todavía no.</p>
      </section>
      <section style={{ display: 'grid', gap: 8 }}>
        <h2 style={{ fontSize: 12, letterSpacing: 3, color: AMBER, margin: 0 }}>DIAGNÓSTICO DE MERCADO LIBRE</h2>
        <p style={{ fontSize: 11.5, color: DIM, margin: 0, lineHeight: 1.8 }}>Mercado Libre restringió su API en 2025 y a algunas apps les bloquea la búsqueda. Esto prueba, con tu app, qué partes responden; si la búsqueda está bloqueada, las ofertas salen del catálogo (sin usados ni descuentos de publicaciones sueltas).</p>
        <button type="button" className="press" onClick={probar} disabled={dBusy || !estado?.valida} style={{ ...btn(CYAN), justifySelf: 'start', opacity: dBusy || !estado?.valida ? 0.5 : 1 }}>{dBusy ? 'PROBANDO…' : 'PROBAR MERCADO LIBRE'}</button>
        {!estado?.valida && <span style={{ fontSize: 11.5, color: AMBER }}>Necesita tu clave de RADAR.</span>}
        {dErr && <span style={{ fontSize: 11.5, color: AMBER }}>{dErr}</span>}
        {diag && (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
            {diag.map((p) => <li key={p.nombre} style={{ fontSize: 12, color: p.ok ? GREEN : RED }}>{p.ok ? '●' : '✕'} <b>{p.nombre}</b> <span style={{ color: DIM }}>— {p.detalle}</span></li>)}
          </ul>
        )}
      </section>
    </div>
  )
}
