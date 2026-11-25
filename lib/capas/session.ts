// Una sesión de CAPAS: un mundo que avanza y una pila de capas que lo recuerda.
//
// La receta lo describe todo: ley, semilla, constantes, y la lista de golpes de
// pincel y cambios de perilla con la capa en que ocurrieron. Reproducir la
// receta con las mismas operaciones da bit a bit la misma pila (ver laws.ts), en
// Node y en el navegador, así que un enlace alcanza para reconstruir la pieza.

import { LAWS, type LawId, type Tool, type World } from './laws'
import type { Shape, Volume } from './volume'

export const WORLD = 128 // lado del mundo, en celdas
export const MAX_SLICES = 240

export type Stroke = [slice: number, x: number, y: number, r: number, tool: Tool]
export type KnobStep = [slice: number, knob: number]

export type Recipe = {
  v: 1
  law: LawId
  seed: number
  knob: number            // valor inicial de la constante de la ley, 0..1
  knobs: KnobStep[]       // cambios posteriores: la física también se esculpe
  view: string
  theta: number
  stride: number          // pasos de simulación por capa
  slices: number          // capas de la pieza
  aspect: number          // alto/ancho; 0 = causal automático
  shape: Shape
  base: boolean
  strokes: Stroke[]
}

export function defaultRecipe(law: LawId, seed = 7): Recipe {
  const L = LAWS[law]
  return {
    v: 1, law, seed, knob: L.defaults.knob, knobs: [], view: L.defaults.view, theta: L.defaults.theta,
    stride: L.stride, slices: MAX_SLICES, aspect: 0, shape: L.defaults.shape, base: true, strokes: [],
  }
}

export class Session {
  recipe: Recipe
  world: World
  readonly data: Uint8Array
  count = 0
  private frame: Uint8Array
  private applied = 0
  private knobAt = 0 // índice del próximo cambio de perilla por aplicar
  private knobNow: number

  // `replay`: las pinceladas de la receta se aplican solas al llegar a su capa
  constructor(recipe: Recipe, replay = true) {
    this.recipe = { ...recipe, strokes: [...recipe.strokes], knobs: [...recipe.knobs] }
    const L = LAWS[recipe.law]
    this.world = L.init(WORLD, WORLD, recipe.seed, recipe.knob)
    this.data = new Uint8Array(WORLD * WORLD * recipe.slices)
    this.frame = new Uint8Array(WORLD * WORLD)
    this.knobNow = recipe.knob
    if (!replay) this.applied = this.recipe.strokes.length
    this.record() // la capa 0 es el estado inicial
  }

  get full() { return this.count >= this.recipe.slices }
  get knob() { return this.knobNow }

  private record() {
    const L = LAWS[this.recipe.law]
    L.field(this.world, this.recipe.view, this.frame)
    this.data.set(this.frame, this.count * WORLD * WORLD)
    this.count++
  }

  // produce n capas más (o las que quepan)
  advance(n = 1) {
    const L = LAWS[this.recipe.law], R = this.recipe
    for (let i = 0; i < n && !this.full; i++) {
      while (this.applied < R.strokes.length && R.strokes[this.applied][0] <= this.count - 1) {
        const [, x, y, r, tool] = R.strokes[this.applied++]
        L.brush(this.world, x, y, r, tool)
      }
      while (this.knobAt < R.knobs.length && R.knobs[this.knobAt][0] <= this.count - 1) this.knobNow = R.knobs[this.knobAt++][1]
      L.step(this.world, R.stride, this.knobNow)
      this.record()
    }
  }

  // pincelada en vivo: se aplica ya y queda registrada para la próxima capa
  paint(x: number, y: number, r: number, tool: Tool) {
    if (this.full) return
    x = Math.round(x); y = Math.round(y); r = Math.round(r)
    this.recipe.strokes.push([this.count - 1, x, y, r, tool])
    this.applied = this.recipe.strokes.length
    LAWS[this.recipe.law].brush(this.world, x, y, r, tool)
  }

  // cambio de perilla en vivo (se cuantiza a centésimas para que la receta sea corta)
  setKnob(k: number) {
    k = Math.round(Math.min(1, Math.max(0, k)) * 100) / 100
    if (k === this.knobNow) return
    this.knobNow = k
    const last = this.recipe.knobs[this.recipe.knobs.length - 1]
    if (last && last[0] === this.count - 1) last[1] = k
    else this.recipe.knobs.push([this.count - 1, k])
    this.knobAt = this.recipe.knobs.length
  }

  // campo actual del mundo (incluye pinceladas aún no registradas en una capa)
  currentField(out: Uint8Array) { LAWS[this.recipe.law].field(this.world, this.recipe.view, out) }

  volume(): Volume { return { w: WORLD, h: WORLD, t: this.count, data: this.data } }

  // copia de las capas hechas, lista para transferir a un worker
  snapshot(): Volume { return { w: WORLD, h: WORLD, t: this.count, data: this.data.slice(0, this.count * WORLD * WORLD) } }
}

// Reconstruye una receta entera (para Node, pruebas y enlaces)
export function runRecipe(recipe: Recipe, upTo = recipe.slices): Session {
  const s = new Session(recipe, true)
  s.advance(upTo - 1)
  return s
}

// Huella de la pila de capas: FNV-1a de 32 bits. Sirve para comprobar que Node y
// el navegador producen exactamente el mismo universo.
export function volumeHash(vol: Volume): string {
  let h = 0x811c9dc5
  const d = vol.data, n = vol.w * vol.h * vol.t
  for (let i = 0; i < n; i++) { h ^= d[i]; h = Math.imul(h, 0x01000193) >>> 0 }
  return h.toString(16).padStart(8, '0')
}

// Identificador corto de una receta
export function recipeId(r: Recipe): string {
  const txt = JSON.stringify([r.law, r.seed, r.knob, r.knobs, r.view, r.theta, r.stride, r.slices, r.aspect, r.shape, r.base, r.strokes])
  let h = 0x811c9dc5
  for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return `CAP-${h.toString(36).toUpperCase().padStart(6, '0').slice(0, 6)}`
}

// Enlace compartible: la receta completa, comprimida a base64url
export function encodeRecipe(r: Recipe): string {
  const json = JSON.stringify(r)
  const b64 = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(json))) : Buffer.from(json, 'utf8').toString('base64')
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
export function decodeRecipe(txt: string): Recipe | null {
  try {
    const b64 = txt.replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64 + '==='.slice((b64.length + 3) % 4)
    const json = typeof atob === 'function' ? decodeURIComponent(escape(atob(pad))) : Buffer.from(pad, 'base64').toString('utf8')
    const r = JSON.parse(json) as Recipe
    if (r.v !== 1 || !(r.law in LAWS)) return null
    const L = LAWS[r.law]
    const num = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d)
    const strokes = Array.isArray(r.strokes) ? r.strokes.filter((s) => Array.isArray(s) && s.length === 5 && s.every((n) => Number.isFinite(n))).slice(0, 600) as Stroke[] : []
    const knobs = Array.isArray(r.knobs) ? r.knobs.filter((s) => Array.isArray(s) && s.length === 2 && s.every((n) => Number.isFinite(n))).slice(0, 300) as KnobStep[] : []
    return {
      v: 1, law: r.law, seed: Math.floor(num(r.seed, 1, 2 ** 31 - 1, 7)), knob: num(r.knob, 0, 1, L.defaults.knob), knobs,
      view: L.views.some((v) => v.id === r.view) ? r.view : L.defaults.view, theta: num(r.theta, 0.1, 0.9, L.defaults.theta),
      stride: Math.floor(num(r.stride, 1, 80, L.stride)), slices: Math.floor(num(r.slices, 60, MAX_SLICES, MAX_SLICES)),
      aspect: r.aspect === 0 ? 0 : num(r.aspect, 0.4, 4, 0),
      shape: r.shape === 'caja' || r.shape === 'testigo' || r.shape === 'cupula' ? r.shape : L.defaults.shape, base: r.base !== false, strokes,
    }
  } catch { return null }
}
