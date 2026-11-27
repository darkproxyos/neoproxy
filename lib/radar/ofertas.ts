// CAZADOR — lógica pura (sin red): qué vigilar, cuánto material trae cada publicación,
// precio por kg o litro, y cuándo una publicación es una oportunidad de verdad.
// Se usa en el servidor (lib/radar/ml.ts) y en el navegador (enlaces manuales).

export type Tipo = 'material' | 'equipo'
export type Vigilancia = {
  id: string
  nombre: string
  q: string // lo que se busca en Mercado Libre
  tipo: Tipo // material: se compara el precio por kg o litro; equipo: el precio total
  tope?: number // material: $ por kg o litro; equipo: $ total. Bajo esto, siempre avisa.
}

export const VIGILANCIAS_BASE: Vigilancia[] = [
  { id: 'resina', nombre: 'Resina estándar 405 nm', q: 'resina 405nm 1kg', tipo: 'material' },
  { id: 'resina-lavable', nombre: 'Resina lavable con agua', q: 'resina lavable agua 405nm', tipo: 'material' },
  { id: 'pla', nombre: 'Filamento PLA 1,75 mm', q: 'filamento pla 1.75 1kg', tipo: 'material' },
  { id: 'impresora-resina', nombre: 'Impresora 3D de resina', q: 'impresora 3d resina', tipo: 'equipo' },
  { id: 'impresora-fdm', nombre: 'Impresora 3D de filamento', q: 'impresora 3d filamento', tipo: 'equipo' },
  { id: 'isopropilico', nombre: 'Alcohol isopropílico (lavar resina)', q: 'alcohol isopropilico 99 1 litro', tipo: 'material' },
]

export type Oferta = {
  id: string
  titulo: string
  precio: number // CLP
  original?: number // precio antes del descuento, si Mercado Libre lo informa
  url: string
  img?: string
  envioGratis?: boolean
  usado?: boolean
}

export type Cantidad = { valor: number; unidad: 'kg' | 'L' }
export type Evaluada = Oferta & {
  cantidad?: Cantidad
  porUnidad?: number // $ por kg o por litro
  descuento?: number // % sobre el precio original
  bajoMediana?: number // % bajo la mediana del grupo
  enTope: boolean
  ganga: boolean
  raro: boolean // accesorio colado entre impresoras o peso mal leído: no cuenta como ganga
  motivos: string[]
}
export type Evaluacion = { items: Evaluada[]; mediana?: number; p25?: number; base: 'unidad' | 'precio'; gangas: number }

// --- cantidad de material leída del título -------------------------------------------
// «Resina Elegoo 1kg», «PLA 1.75mm 1 Kg», «Pack 2 Resina 500g», «2 x 1kg», «(3 rollos)»,
// «Isopropílico 99% 1 Litro», «1000ml». «1.75mm» o «405nm» no son cantidades.
const UNIDAD = /(\d+(?:[.,]\d+)?)\s*(kilos?|kgs?|gramos|grs?|g|litros?|lts?|lt|ml|l)(?![a-z])/i
const POR = /(\d+)\s*[x×]\s*\d+(?:[.,]\d+)?\s*(?:kilos?|kgs?|gramos|grs?|g|litros?|lts?|lt|ml|l)(?![a-z])/i
const PACK = /\b(?:pack|kit|set|combo|caja)\s*(?:de\s*|x\s*)?(\d+)\b|\b(\d+)\s*(?:rollos|unidades|uds|botellas|frascos|bidones)\b/i

export function cantidad(titulo: string): Cantidad | undefined {
  const t = titulo.replace(/ /g, ' ')
  const m = UNIDAD.exec(t)
  if (!m) return undefined
  const n = parseFloat(m[1].replace(',', '.'))
  const u = m[2].toLowerCase()
  let valor: number, unidad: Cantidad['unidad']
  if (/^k/.test(u)) { valor = n; unidad = 'kg' }
  else if (/^g/.test(u)) { valor = n / 1000; unidad = 'kg' }
  else if (u === 'ml') { valor = n / 1000; unidad = 'L' }
  else { valor = n; unidad = 'L' }
  const por = POR.exec(t), pack = PACK.exec(t)
  // «Pack 2 Kg» es un pack de 2 kg, no dos packs de 2 kg: el número del pack no puede ser el de la cantidad
  const packOk = pack && !(pack.index < m.index + m[0].length && m.index < pack.index + pack[0].length)
  const mult = por ? parseInt(por[1], 10) : packOk ? parseInt(pack[1] ?? pack[2], 10) : 1
  if (mult >= 2 && mult <= 50) valor *= mult
  if (!(valor >= 0.05 && valor <= 30)) return undefined // fuera de lo razonable: mejor no adivinar
  return { valor: Math.round(valor * 1000) / 1000, unidad }
}

const medianaDe = (xs: number[]) => (xs.length ? Math.round(xs.length % 2 ? xs[(xs.length - 1) / 2] : (xs[xs.length / 2 - 1] + xs[xs.length / 2]) / 2) : undefined)
const cuantil = (xs: number[], f: number) => (xs.length ? xs[Math.min(xs.length - 1, Math.floor(f * (xs.length - 1)))] : undefined)

// --- cuándo algo es una oportunidad ---------------------------------------------------
// ganga = 20 % o más de descuento declarado, o 20 % o más bajo la mediana del grupo
// (por kg/litro en materiales, precio total en equipos), o bajo tu tope.
// Lo que cuesta menos del 30 % de la mediana es sospechoso: en equipos suele ser un
// repuesto (lámina FEP, boquilla) y en materiales un peso mal leído.
export function evaluar(ofertas: Oferta[], v: Pick<Vigilancia, 'tipo' | 'tope'>): Evaluacion {
  const base = v.tipo === 'material' ? 'unidad' : 'precio'
  const pre = ofertas.map((o) => {
    const c = v.tipo === 'material' ? cantidad(o.titulo) : undefined
    const porUnidad = c ? Math.round(o.precio / c.valor) : undefined
    return { o, c, porUnidad, ref: base === 'unidad' ? porUnidad : o.precio }
  })
  const todos = pre.map((x) => x.ref).filter((r): r is number => r !== undefined && r > 0).sort((a, b) => a - b)
  // el precio típico se calcula sin los sospechosos: una lámina FEP de $13.000 no debe
  // bajar el «típico» de las impresoras
  const m0 = medianaDe(todos)
  const refs = m0 !== undefined && todos.length >= 5 ? todos.filter((r) => r >= m0 * 0.3) : todos
  const mediana = medianaDe(refs), p25 = cuantil(refs, 0.25), comparable = todos.length >= 5
  const items: Evaluada[] = pre.map(({ o, c, porUnidad, ref }) => {
    const descuento = o.original && o.original > o.precio ? Math.round((1 - o.precio / o.original) * 100) : undefined
    const raro = comparable && ref !== undefined && mediana !== undefined && ref < mediana * 0.3
    const bajo = comparable && !raro && ref !== undefined && mediana !== undefined && ref <= mediana * 0.8 ? Math.round((1 - ref / mediana) * 100) : undefined
    const enTope = !raro && v.tope !== undefined && v.tope > 0 && ref !== undefined && ref <= v.tope
    const motivos: string[] = []
    if (descuento !== undefined && descuento >= 5) motivos.push(`${descuento}% de descuento`)
    if (bajo !== undefined) motivos.push(`${bajo}% bajo lo típico`)
    if (enTope) motivos.push('bajo tu tope')
    if (raro) motivos.push(v.tipo === 'equipo' ? 'muy barato para ser el equipo: ¿repuesto o accesorio?' : 'precio por kg raro: revisa el título')
    const ganga = !raro && ((descuento ?? 0) >= 20 || bajo !== undefined || enTope)
    return { ...o, cantidad: c, porUnidad, descuento, bajoMediana: bajo, enTope, ganga, raro, motivos }
  })
  const key = (x: Evaluada) => (x.raro ? 2 : x.ganga ? 0 : 1)
  const refOf = (x: Evaluada) => (base === 'unidad' ? x.porUnidad : x.precio) ?? Infinity
  items.sort((a, b) => key(a) - key(b) || refOf(a) - refOf(b))
  return { items, mediana, p25, base, gangas: items.filter((x) => x.ganga).length }
}

// --- enlaces que funcionan sin ninguna conexión ----------------------------------------
const slug = (q: string) => q.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export const enlacesML = (q: string) => ({
  barato: `https://listado.mercadolibre.cl/${slug(q)}_OrderId_PRICE_NoIndex_True`,
  relevante: `https://listado.mercadolibre.cl/${slug(q)}`,
})

// --- validación de lo que llega del navegador ------------------------------------------
export function limpiarVigilancia(v: unknown): Vigilancia | null {
  if (!v || typeof v !== 'object') return null
  const r = v as Record<string, unknown>
  const q = typeof r.q === 'string' ? r.q.replace(/\s+/g, ' ').trim().slice(0, 80) : ''
  if (q.length < 2) return null
  const tipo: Tipo = r.tipo === 'equipo' ? 'equipo' : 'material'
  const tope = typeof r.tope === 'number' && Number.isFinite(r.tope) && r.tope > 0 && r.tope < 1e9 ? Math.round(r.tope) : undefined
  const id = typeof r.id === 'string' && /^[a-z0-9-]{1,40}$/i.test(r.id) ? r.id : slug(q).slice(0, 40) || 'v'
  const nombre = typeof r.nombre === 'string' && r.nombre.trim() ? r.nombre.trim().slice(0, 60) : q
  return { id, nombre, q, tipo, tope }
}
