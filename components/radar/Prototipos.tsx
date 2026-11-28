'use client'

// PROTOTIPOS — ideas de negocio con electrónica (ESP32, sensores, NFC) para elegir en
// qué invertir cuando haya plata. El catálogo se reordena solo según tu presupuesto y
// la época del año; la IA agrega ideas nuevas y re-analiza las que guardas en tu banco.

import { useMemo, useState, useSyncExternalStore } from 'react'
import { radarMercado, radarGenerarProyectos, radarReanalizar } from '@/app/radar/actions'
import {
  PROYECTOS, AREAS, AREA_LABEL, MODELO_LABEL, ESTADOS_B, VEREDICTO_LABEL, puntajeProyecto, ideaDeLaSemana, limpiarEntrada, sinAnalizar,
  type Proyecto, type Entrada, type EstadoB, type Area, type Veredicto,
} from '@/lib/radar/proyectos'
import { enlacesML } from '@/lib/radar/ofertas'
import { mono, AMBER, GREEN, RED, CYAN, DIM, FAINT, clp, getClave, Chip, Tag, A, almacen, type EstadoR } from './ui'

const presupStore = almacen<number>('npx-radar-presupuesto-v1', 0, (v) => (typeof v === 'number' && v >= 0 && v < 1e9 ? Math.round(v) : null))
const bancoStore = almacen<Entrada[]>('npx-radar-banco-v1', [], (v) => (Array.isArray(v) ? v.map(limpiarEntrada).filter((e): e is Entrada => !!e) : null))

const card: React.CSSProperties = { background: '#080c12', border: '1px solid #ffffff12', padding: '14px 16px' }
const btn = (c: string): React.CSSProperties => ({ minHeight: 36, padding: '0 14px', background: `${c}18`, border: `1px solid ${c}88`, color: c, fontFamily: mono, fontSize: 11.5, letterSpacing: 1, cursor: 'pointer' })
const input: React.CSSProperties = { minHeight: 38, background: '#02040a', border: '1px solid #ffffff2a', color: '#fff', fontFamily: mono, fontSize: 12, padding: '0 10px' }
const VER_C: Record<Veredicto, string> = { 'invertir-ya': GREEN, validar: CYAN, esperar: AMBER, descartar: RED }
const fechaCorta = (t: number) => new Date(t).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
const MESES = ['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

type Sub = 'catalogo' | 'banco'

export default function Prototipos({ estado }: { estado: EstadoR | null }) {
  const [sub, setSub] = useState<Sub>('catalogo')
  const [hoy] = useState(() => new Date())
  const presupuesto = useSyncExternalStore(presupStore.subscribe, presupStore.get, presupStore.server)
  const banco = useSyncExternalStore(bancoStore.subscribe, bancoStore.get, bancoStore.server)
  const iaOn = !!estado?.valida && !!estado?.ia
  const mlOn = !!estado?.valida && !!estado?.mercadoLibre
  const nuevas = banco.filter((e) => e.estado === 'nueva').length

  const guardar = (p: Proyecto, fuente: Entrada['fuente'] = 'catalogo') => {
    const b = bancoStore.get()
    if (b.some((e) => e.p.id === p.id || e.p.nombre === p.nombre)) return
    bancoStore.set([{ p, fuente, estado: 'nueva' as const, notas: '', agregado: Date.now() }, ...b].slice(0, 80))
  }
  const enBanco = (p: Proyecto) => banco.some((e) => e.p.id === p.id || e.p.nombre === p.nombre)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <p style={{ fontSize: 12, lineHeight: 1.9, color: DIM, margin: 0, maxWidth: 880 }}>
        Ideas de negocio con electrónica (ESP32, Arduino, sensores, NFC) para elegir en qué invertir cuando tengas plata. Se reordenan solas según cuánto puedes gastar y la época del año; la IA agrega ideas nuevas y vuelve a analizar las que guardas. Las cifras son estimaciones en pesos para comparar entre sí: los precios reales de los componentes los ves con <b style={{ color: '#fff' }}>PRECIOS REALES</b>.
      </p>
      <Presupuesto valor={presupuesto} />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Chip on={sub === 'catalogo'} onClick={() => setSub('catalogo')} color={CYAN}>CATÁLOGO ({PROYECTOS.length})</Chip>
        <Chip on={sub === 'banco'} onClick={() => setSub('banco')} color={CYAN}>MI BANCO ({banco.filter((e) => e.estado !== 'descartada').length}{nuevas ? ` · ${nuevas} NUEVAS` : ''})</Chip>
      </div>
      {sub === 'catalogo' && <Catalogo hoy={hoy} presupuesto={presupuesto} banco={banco} iaOn={iaOn} mlOn={mlOn} guardar={guardar} enBanco={enBanco} irBanco={() => setSub('banco')} />}
      {sub === 'banco' && <Banco hoy={hoy} presupuesto={presupuesto} banco={banco} iaOn={iaOn} mlOn={mlOn} estado={estado} />}
    </div>
  )
}

// --- presupuesto -----------------------------------------------------------------------
function Presupuesto({ valor }: { valor: number }) {
  return (
    <div style={{ ...card, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#fff' }}>
        Tengo para invertir $
        <input inputMode="numeric" aria-label="Presupuesto para invertir en pesos" value={valor ? valor.toLocaleString('es-CL') : ''} placeholder="aún no sé" onChange={(e) => presupStore.set(Number(e.target.value.replace(/\D/g, '')) || 0)} style={{ ...input, width: 130 }} />
      </label>
      {[0, 30000, 80000, 150000, 300000, 600000].map((v) => <Chip key={v} on={valor === v} onClick={() => presupStore.set(v)}>{v ? clp(v) : 'SIN DEFINIR'}</Chip>)}
    </div>
  )
}

// --- catálogo ---------------------------------------------------------------------------
function Catalogo({ hoy, presupuesto, banco, iaOn, mlOn, guardar, enBanco, irBanco }: {
  hoy: Date; presupuesto: number; banco: Entrada[]; iaOn: boolean; mlOn: boolean; guardar: (p: Proyecto, f?: Entrada['fuente']) => void; enBanco: (p: Proyecto) => boolean; irBanco: () => void
}) {
  const [area, setArea] = useState<Area | 'todas'>('todas')
  const [soloAlcanza, setSoloAlcanza] = useState(false), [soloTemp, setSoloTemp] = useState(false), [soloRec, setSoloRec] = useState(false)
  const ranked = useMemo(() => PROYECTOS.map((p) => ({ p, s: puntajeProyecto(p, presupuesto, hoy) })).sort((a, b) => b.s.total - a.s.total), [presupuesto, hoy])
  const semana = useMemo(() => ideaDeLaSemana(PROYECTOS, presupuesto, hoy), [presupuesto, hoy])
  const lista = ranked.filter(({ p, s }) => (area === 'todas' || p.area === area) && (!soloAlcanza || s.alcanza !== false) && (!soloTemp || s.enTemporada) && (!soloRec || p.recurrente))
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {semana && (
        <section style={{ display: 'grid', gap: 8 }}>
          <h2 style={{ fontSize: 12, letterSpacing: 3, color: AMBER, margin: 0 }}>IDEA DE LA SEMANA</h2>
          <div style={{ maxWidth: 560 }}><ProyectoCard p={semana} s={puntajeProyecto(semana, presupuesto, hoy)} mlOn={mlOn} destacada accion={<Guardar p={semana} en={enBanco(semana)} guardar={guardar} />} /></div>
        </section>
      )}
      <Renovar iaOn={iaOn} presupuesto={presupuesto} banco={banco} guardar={guardar} irBanco={irBanco} />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip on={area === 'todas'} onClick={() => setArea('todas')}>TODAS</Chip>
        {AREAS.map((a) => <Chip key={a} on={area === a} onClick={() => setArea(a)}>{AREA_LABEL[a].toUpperCase()}</Chip>)}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {presupuesto > 0 && <Chip on={soloAlcanza} onClick={() => setSoloAlcanza((v) => !v)} color={GREEN}>SOLO LO QUE ALCANZA</Chip>}
        <Chip on={soloTemp} onClick={() => setSoloTemp((v) => !v)} color={GREEN}>EN TEMPORADA AHORA</Chip>
        <Chip on={soloRec} onClick={() => setSoloRec((v) => !v)} color={GREEN}>CON INGRESO MENSUAL</Chip>
        <span style={{ fontSize: 11, color: FAINT, alignSelf: 'center' }}>{lista.length} de {PROYECTOS.length} · ordenadas por puntaje</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 12, alignItems: 'start' }}>
        {lista.map(({ p, s }) => <ProyectoCard key={p.id} p={p} s={s} mlOn={mlOn} accion={<Guardar p={p} en={enBanco(p)} guardar={guardar} />} />)}
      </div>
      {lista.length === 0 && <p style={{ fontSize: 12, color: FAINT, margin: 0 }}>Ninguna idea cumple todos los filtros. Quita alguno.</p>}
    </div>
  )
}

const Guardar = ({ p, en, guardar }: { p: Proyecto; en: boolean; guardar: (p: Proyecto) => void }) => (
  <button type="button" className="press" disabled={en} onClick={() => guardar(p)} style={{ ...btn(AMBER), justifySelf: 'start', opacity: en ? 0.55 : 1 }}>{en ? '✓ EN TU BANCO' : '+ A MI BANCO'}</button>
)

function Renovar({ iaOn, presupuesto, banco, guardar, irBanco }: { iaOn: boolean; presupuesto: number; banco: Entrada[]; guardar: (p: Proyecto, f: Entrada['fuente']) => void; irBanco: () => void }) {
  const [foco, setFoco] = useState(''), [n, setN] = useState(5), [busy, setBusy] = useState(false), [err, setErr] = useState(''), [ok, setOk] = useState(0)
  const run = async () => {
    setBusy(true); setErr(''); setOk(0)
    const r = await radarGenerarProyectos(getClave(), { foco, cantidad: n, presupuesto, evitar: banco.map((e) => e.p.nombre) })
    setBusy(false)
    if (!r.ok) { setErr(r.error); return }
    const antes = bancoStore.get().length
    r.data.forEach((p) => guardar(p, 'ia'))
    setOk(bancoStore.get().length - antes)
  }
  return (
    <section style={{ ...card, display: 'grid', gap: 10 }}>
      <h2 style={{ fontSize: 12, letterSpacing: 3, color: AMBER, margin: 0 }}>RENOVAR LA LISTA CON IA</h2>
      <p style={{ fontSize: 11.5, color: DIM, margin: 0, lineHeight: 1.8 }}>Claude propone ideas nuevas con tu presupuesto y la época del año, sin repetir las que ya tienes. Quedan guardadas en tu banco como NUEVAS. Cada vez usa tu clave de Anthropic (unos centavos de dólar).</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={foco} onChange={(e) => setFoco(e.target.value)} placeholder="foco opcional: ej. agro, colegios, alertas al celular…" aria-label="Foco de las ideas nuevas" style={{ ...input, flex: '1 1 280px' }} />
        {[3, 5, 8].map((k) => <Chip key={k} on={n === k} onClick={() => setN(k)}>{k} IDEAS</Chip>)}
        <button type="button" className="press" onClick={run} disabled={busy || !iaOn} style={{ ...btn(AMBER), opacity: busy || !iaOn ? 0.5 : 1 }}>{busy ? 'PENSANDO… (HASTA 1 MIN)' : '✦ BUSCAR IDEAS NUEVAS'}</button>
      </div>
      {!iaOn && <span style={{ fontSize: 11.5, color: AMBER }}>Necesita tu clave de RADAR y ANTHROPIC_API_KEY en el servidor.</span>}
      {err && <span style={{ fontSize: 11.5, color: AMBER }}>{err}</span>}
      {ok > 0 && <span style={{ fontSize: 12, color: GREEN }}>{ok} ideas nuevas en tu banco. <button type="button" onClick={irBanco} style={{ ...btn(GREEN), minHeight: 30, padding: '0 10px', marginLeft: 6 }}>VER MI BANCO</button></span>}
    </section>
  )
}

// --- tarjeta de proyecto ------------------------------------------------------------------
function ProyectoCard({ p, s, mlOn, accion, destacada, children }: { p: Proyecto; s: ReturnType<typeof puntajeProyecto>; mlOn: boolean; accion?: React.ReactNode; destacada?: boolean; children?: React.ReactNode }) {
  const [abierta, setAbierta] = useState(!!destacada)
  const colorP = s.total >= 75 ? GREEN : s.total >= 60 ? AMBER : DIM
  return (
    <article style={{ ...card, borderTop: `2px solid ${s.alcanza === false ? RED : colorP}`, display: 'grid', gap: 9, alignContent: 'start' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
        <h3 style={{ fontSize: 13.5, color: '#fff', margin: 0, lineHeight: 1.4 }}>{p.nombre}</h3>
        <span title="Puntaje: valor, demanda, facilidad, tiempo, ingreso mensual, temporada y tu presupuesto" style={{ fontSize: 13, color: colorP, fontWeight: 700 }}>{s.total}</span>
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        <Tag>{AREA_LABEL[p.area]}</Tag><Tag c={CYAN}>{MODELO_LABEL[p.modelo]}</Tag>
        {p.recurrente && <Tag c={GREEN}>MENSUAL</Tag>}
        {s.enTemporada && <Tag c={GREEN}>EN TEMPORADA</Tag>}
        {p.red220 && <Tag c={RED}>220 V</Tag>}
        <Tag c={s.alcanza === false ? RED : s.alcanza ? GREEN : AMBER}>PROTOTIPO {clp(p.proto)}</Tag>
      </div>
      <p style={{ fontSize: 12, lineHeight: 1.8, color: '#c8daf0', margin: 0 }}><b style={{ color: '#fff' }}>Problema:</b> {p.problema}</p>
      <div style={{ fontSize: 11.5, lineHeight: 1.8, color: DIM }}>
        <div><b style={{ color: '#fff' }}>Cliente:</b> {p.cliente}</div>
        <div><b style={{ color: '#fff' }}>Se vende:</b> {p.venta}</div>
        <div><b style={{ color: '#fff' }}>Inversión (estimada):</b> {clp(p.proto)} el prototipo · {clp(p.piloto)} para unas 5 unidades · ~{p.dias} días de trabajo · dificultad {'●'.repeat(p.nivel)}{'○'.repeat(3 - p.nivel)}</div>
        {p.meses.length > 0 && <div><b style={{ color: '#fff' }}>Más demanda:</b> {p.meses.map((m) => MESES[m]).join(' · ')}</div>}
      </div>
      {s.razones.length > 0 && <div style={{ fontSize: 10.5, color: FAINT, lineHeight: 1.6 }}>{s.razones.join(' · ')}</div>}
      <button type="button" onClick={() => setAbierta((v) => !v)} aria-expanded={abierta} style={{ ...btn(DIM), justifySelf: 'start', minHeight: 32, fontSize: 10.5 }}>{abierta ? '▲ MENOS' : '▼ COMPONENTES, RIESGOS Y CÓMO PROBARLA'}</button>
      {abierta && (
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ fontSize: 11.5, lineHeight: 1.8, color: DIM }}>
            <div><b style={{ color: '#fff' }}>Cómo probar que lo pagan sin invertir:</b> {p.validar}</div>
            <div><b style={{ color: '#fff' }}>Primer paso:</b> {p.primerPaso}</div>
            {p.riesgo && <div style={{ color: AMBER }}>⚠ {p.riesgo}</div>}
          </div>
          <Componentes p={p} mlOn={mlOn} />
        </div>
      )}
      {accion}
      {children}
    </article>
  )
}

function Componentes({ p, mlOn }: { p: Proyecto; mlOn: boolean }) {
  const [precios, setPrecios] = useState<Record<string, number | null> | null>(null), [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const ver = async () => {
    setBusy(true); setErr('')
    const rs = await Promise.all(p.bom.map(async (b) => [b.q, await radarMercado(getClave(), b.q)] as const))
    setBusy(false)
    const out: Record<string, number | null> = {}
    for (const [q, r] of rs) {
      if (!r.ok) { setErr(r.error); continue }
      out[q] = r.data.mediana ?? null
    }
    setPrecios(out)
  }
  const total = precios ? p.bom.reduce((t, b) => t + (precios[b.q] ?? 0) * (b.cant ?? 1), 0) : 0
  const faltan = precios ? p.bom.filter((b) => precios[b.q] == null).length : 0
  return (
    <div style={{ background: '#0b1017', padding: '10px 12px', display: 'grid', gap: 6 }}>
      <div style={{ fontSize: 11, letterSpacing: 1.5, color: DIM }}>COMPONENTES</div>
      {p.bom.map((b) => (
        <div key={b.q} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'baseline', fontSize: 11.5, color: '#c8daf0' }}>
          <span style={{ flex: '1 1 180px' }}>{b.n}{(b.cant ?? 1) > 1 ? ` ×${b.cant}` : ''}</span>
          {precios && <span style={{ color: precios[b.q] != null ? CYAN : FAINT }}>{precios[b.q] != null ? clp(precios[b.q] as number) : 'sin dato'}</span>}
          <A href={enlacesML(b.q).barato}>ver ↗</A>
        </div>
      ))}
      {mlOn ? (
        <button type="button" className="press" onClick={ver} disabled={busy} style={{ ...btn(CYAN), justifySelf: 'start', minHeight: 32, fontSize: 10.5 }}>{busy ? 'CONSULTANDO MERCADO LIBRE…' : 'PRECIOS REALES (MERCADO LIBRE)'}</button>
      ) : <span style={{ fontSize: 10.5, color: FAINT }}>Conecta Mercado Libre (pestaña CAZADOR) para ver precios reales; mientras tanto «ver» abre la búsqueda del más barato.</span>}
      {precios && (
        <div style={{ fontSize: 11.5, color: '#fff' }}>Componentes por unidad ≈ {clp(total)} <span style={{ color: FAINT }}>(precio típico de cada búsqueda{faltan ? `; ${faltan} sin dato, no suma` : ''}; revisa que el resultado sea el componente y no un accesorio)</span></div>
      )}
      {err && <span style={{ fontSize: 11, color: AMBER }}>{err}</span>}
    </div>
  )
}

// --- mi banco ----------------------------------------------------------------------------
function Banco({ hoy, presupuesto, banco, iaOn, mlOn, estado }: { hoy: Date; presupuesto: number; banco: Entrada[]; iaOn: boolean; mlOn: boolean; estado: EstadoR | null }) {
  const [busy, setBusy] = useState(false), [err, setErr] = useState(''), [ok, setOk] = useState('')
  const [ver, setVer] = useState<EstadoB | 'activas'>('activas')
  const activas = banco.filter((e) => e.estado !== 'descartada')
  const pendientes = banco.filter((e) => sinAnalizar(e, hoy.getTime()))
  const lista = useMemo(() => banco
    .filter((e) => (ver === 'activas' ? e.estado !== 'descartada' : e.estado === ver))
    .map((e) => ({ e, s: puntajeProyecto(e.p, presupuesto, hoy) }))
    .sort((a, b) => (b.e.analisis?.puntaje ?? b.s.total) - (a.e.analisis?.puntaje ?? a.s.total)), [banco, ver, presupuesto, hoy])

  const actualizar = (id: string, f: (e: Entrada) => Entrada) => bancoStore.set(bancoStore.get().map((e) => (e.p.id === id ? f(e) : e)))
  const reanalizar = async () => {
    setBusy(true); setErr(''); setOk('')
    // primero las que nunca se analizaron o llevan más de 30 días
    const objetivo = [...banco].filter((e) => e.estado !== 'descartada').sort((a, b) => (a.analisis?.fecha ?? 0) - (b.analisis?.fecha ?? 0)).slice(0, 20)
    const r = await radarReanalizar(getClave(), objetivo, presupuesto)
    setBusy(false)
    if (!r.ok) { setErr(r.error); return }
    const datos = r.data
    bancoStore.set(bancoStore.get().map((e) => (datos[e.p.id] ? { ...e, analisis: datos[e.p.id] } : e)))
    setOk(`${Object.keys(datos).length} ideas re-analizadas con la fecha y el presupuesto de hoy`)
  }

  if (!banco.length) {
    return <div style={card}><p style={{ fontSize: 12, color: DIM, margin: 0, lineHeight: 1.9 }}>Tu banco está vacío. En el CATÁLOGO toca <b style={{ color: '#fff' }}>+ A MI BANCO</b> en las ideas que te interesen, o pide ideas nuevas a la IA. Aquí las marcas como en estudio, validando o prototipo, anotas lo que averiguas, y la IA las vuelve a analizar cuando cambian la fecha o tu presupuesto.</p></div>
  }
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <section style={{ ...card, display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="press" onClick={reanalizar} disabled={busy || !iaOn || !activas.length} style={{ ...btn(AMBER), opacity: busy || !iaOn || !activas.length ? 0.5 : 1 }}>{busy ? 'ANALIZANDO… (HASTA 1 MIN)' : '↻ RE-ANALIZAR MI BANCO CON IA'}</button>
          <span style={{ fontSize: 11.5, color: pendientes.length ? AMBER : FAINT }}>{pendientes.length ? `${pendientes.length} sin analizar o con más de 30 días` : 'todas analizadas hace menos de 30 días'}</span>
        </div>
        <p style={{ fontSize: 11, color: FAINT, margin: 0, lineHeight: 1.7 }}>El análisis mira la fecha de hoy, tu presupuesto ({presupuesto ? clp(presupuesto) : 'sin definir'}), tus notas y el estado. Conviene repetirlo cada mes o cuando cambie tu presupuesto. Hasta 20 ideas por vez.</p>
        {!iaOn && <span style={{ fontSize: 11.5, color: AMBER }}>{estado && !estado.valida ? 'Escribe tu clave de RADAR arriba para usar la IA.' : 'Falta ANTHROPIC_API_KEY en el servidor.'}</span>}
        {err && <span style={{ fontSize: 11.5, color: AMBER }}>{err}</span>}
        {ok && <span style={{ fontSize: 11.5, color: GREEN }}>{ok}</span>}
      </section>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Chip on={ver === 'activas'} onClick={() => setVer('activas')} color={CYAN}>ACTIVAS ({activas.length})</Chip>
        {ESTADOS_B.map((x) => <Chip key={x.k} on={ver === x.k} onClick={() => setVer(x.k)} color={CYAN}>{x.label} ({banco.filter((e) => e.estado === x.k).length})</Chip>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 12, alignItems: 'start' }}>
        {lista.map(({ e, s }) => (
          <ProyectoCard key={e.p.id} p={e.p} s={s} mlOn={mlOn}>
            <div style={{ display: 'grid', gap: 8, borderTop: '1px solid #ffffff12', paddingTop: 10 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {e.fuente === 'ia' && <Tag c={CYAN}>CON IA</Tag>}
                <select value={e.estado} onChange={(ev) => actualizar(e.p.id, (x) => ({ ...x, estado: ev.target.value as EstadoB }))} aria-label={`Estado de ${e.p.nombre}`} style={{ ...input, minHeight: 34, fontSize: 11.5 }}>
                  {ESTADOS_B.map((x) => <option key={x.k} value={x.k}>{x.label}</option>)}
                </select>
                <span style={{ fontSize: 10.5, color: FAINT }}>guardada el {fechaCorta(e.agregado)}</span>
              </div>
              <textarea value={e.notas} onChange={(ev) => actualizar(e.p.id, (x) => ({ ...x, notas: ev.target.value.slice(0, 2000) }))} placeholder="notas: a quién le preguntaste, qué precio te dijeron, qué falta…" aria-label={`Notas de ${e.p.nombre}`} rows={2} style={{ ...input, minHeight: 56, padding: '8px 10px', resize: 'vertical' }} />
              {e.analisis ? (
                <div style={{ background: '#0b1017', borderLeft: `3px solid ${VER_C[e.analisis.veredicto]}`, padding: '8px 10px', fontSize: 11.5, lineHeight: 1.7, color: '#c8daf0' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Tag c={VER_C[e.analisis.veredicto]}>{VEREDICTO_LABEL[e.analisis.veredicto]}</Tag>
                    <b style={{ color: '#fff' }}>{e.analisis.puntaje}/100</b>
                    <span style={{ color: sinAnalizar(e, hoy.getTime()) ? AMBER : FAINT, fontSize: 10.5 }}>analizada el {fechaCorta(e.analisis.fecha)}{sinAnalizar(e, hoy.getTime()) ? ' · vieja, re-analiza' : ''}</span>
                  </div>
                  <div>{e.analisis.razon}</div>
                  {e.analisis.paso && <div style={{ color: DIM }}><b style={{ color: '#fff' }}>Próximos 7 días:</b> {e.analisis.paso}</div>}
                </div>
              ) : <span style={{ fontSize: 11, color: FAINT }}>Sin análisis todavía: usa «RE-ANALIZAR MI BANCO CON IA».</span>}
              <button type="button" onClick={() => bancoStore.set(bancoStore.get().filter((x) => x.p.id !== e.p.id))} style={{ ...btn(RED), justifySelf: 'start', minHeight: 30, fontSize: 10.5 }}>QUITAR DEL BANCO</button>
            </div>
          </ProyectoCard>
        ))}
      </div>
      {lista.length === 0 && <p style={{ fontSize: 12, color: FAINT, margin: 0 }}>Nada en este estado.</p>}
    </div>
  )
}
