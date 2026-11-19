// Motor de análisis de voz para /realidad-aumentada/freestyle -- convierte
// lo que el Web Speech API transcribe en "barras" (una por resultado final
// del reconocimiento, que en la práctica coincide con una pausa al rapear)
// y detecta recursos reales de rima y repetición sobre esas barras.
//
// Es una heurística de acentuación española estándar (aguda/llana/esdrújula,
// diptongo vs. hiato aproximado por grupos de vocales consecutivas), no un
// analizador fonético certificado -- suficiente para una herramienta de
// práctica de freestyle, no para filología.

const ACCENTED: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' }
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'á', 'é', 'í', 'ó', 'ú', 'ü'])
const STRONG = ['a', 'e', 'o']
const DIGRAPHS = ['ch', 'll', 'rr', 'qu', 'gu']

export function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// Minúsculas + solo letras (conserva ñ y tildes, hacen falta para el acento).
export function normalizeKeepAccents(s: string): string {
  return s.toLowerCase().replace(/[^a-zñáéíóúü\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

// Para comparar contra lo reconocido por voz (que a veces llega sin tildes)
// o contra los conceptos del pool -- sin acentos ni signos, todo junto.
export function normalizeForMatch(s: string): string {
  return stripAccents(s.toLowerCase()).replace(/[^a-zñ]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function tokenize(text: string): string[] {
  const norm = normalizeKeepAccents(text)
  return norm.length ? norm.split(' ') : []
}

type Nucleus = { start: number; end: number; accented: boolean }

function findNuclei(word: string): Nucleus[] {
  const nuclei: Nucleus[] = []
  let i = 0
  while (i < word.length) {
    if (VOWELS.has(word[i])) {
      const start = i
      let accented = false
      while (i < word.length && VOWELS.has(word[i])) {
        if (word[i] in ACCENTED) accented = true
        i++
      }
      nuclei.push({ start, end: i, accented })
    } else {
      i++
    }
  }
  return nuclei
}

// Vocal "representativa" de un núcleo silábico: en un diptongo la vocal
// fuerte (a/e/o) es la que lleva el peso fonético para efectos de rima --
// así "-ión" y "-ón" (corazón/avión) quedan comparables, como pasa en la
// práctica real del verso cantado en español.
function nucleusRepresentative(text: string): string {
  const base = stripAccents(text)
  for (const s of STRONG) if (base.includes(s)) return s
  return base[base.length - 1] || ''
}

export function rhymeKey(wordRaw: string): { consonante: string; asonante: string } {
  const word = wordRaw.toLowerCase()
  if (!word) return { consonante: '', asonante: '' }
  const nuclei = findNuclei(word)
  if (nuclei.length === 0) return { consonante: stripAccents(word), asonante: '' }

  let stressedIdx = nuclei.findIndex((n) => n.accented)
  if (stressedIdx === -1) {
    const last = word[word.length - 1]
    const endsVowelNS = VOWELS.has(last) || last === 'n' || last === 's'
    stressedIdx = endsVowelNS ? Math.max(0, nuclei.length - 2) : nuclei.length - 1
  }

  let consonante = ''
  for (let k = stressedIdx; k < nuclei.length; k++) {
    consonante += nucleusRepresentative(word.slice(nuclei[k].start, nuclei[k].end))
    const nextStart = k + 1 < nuclei.length ? nuclei[k + 1].start : word.length
    consonante += stripAccents(word.slice(nuclei[k].end, nextStart))
  }
  const asonante = consonante.replace(/[^aeiou]/g, '')
  return { consonante, asonante }
}

function initialSound(t: string): string {
  for (const d of DIGRAPHS) if (t.startsWith(d)) return d
  return t[0] || ''
}

export type ResourceType =
  | 'rima_final'
  | 'rima_interna'
  | 'aliteracion'
  | 'anafora'
  | 'anadiplosis'
  | 'repeticion'

export type DetectedResource = {
  id: number
  type: ResourceType
  label: string
  detail: string
  words: string[]
  barIndex: number
}

let resourceId = 0
function mk(type: ResourceType, label: string, detail: string, words: string[], barIndex: number): DetectedResource {
  resourceId += 1
  return { id: resourceId, type, label, detail, words, barIndex }
}

const MIN_LEN = 3

// Analiza la última barra (bars[bars.length-1]) contra sí misma y contra la
// barra anterior -- se llama una vez por cada resultado final nuevo del
// reconocimiento de voz, nunca reprocesa barras viejas.
export function analyzeNewBar(bars: string[]): DetectedResource[] {
  const idx = bars.length - 1
  const tokens = tokenize(bars[idx])
  if (tokens.length === 0) return []
  const found: DetectedResource[] = []

  // Aliteración: 3+ palabras de la misma barra comparten sonido inicial.
  const byInitial = new Map<string, string[]>()
  for (const t of tokens) {
    if (t.length < MIN_LEN) continue
    const key = initialSound(t)
    if (!key) continue
    const arr = byInitial.get(key) ?? []
    arr.push(t)
    byInitial.set(key, arr)
  }
  for (const [key, ws] of byInitial) {
    if (ws.length >= 3) {
      found.push(mk('aliteracion', `ALITERACIÓN EN "${key.toUpperCase()}-"`, ws.join(' · '), ws, idx))
    }
  }

  // Rima interna: 2+ palabras de la misma barra con la misma terminación.
  const byRhyme = new Map<string, string[]>()
  for (const t of tokens) {
    if (t.length < MIN_LEN) continue
    const { consonante } = rhymeKey(t)
    if (consonante.length < 2) continue
    const arr = byRhyme.get(consonante) ?? []
    arr.push(t)
    byRhyme.set(consonante, arr)
  }
  for (const [key, ws] of byRhyme) {
    if (ws.length >= 2 && new Set(ws).size >= 2) {
      found.push(mk('rima_interna', `RIMA INTERNA EN "-${key}"`, ws.join(' · '), ws, idx))
    }
  }

  // Repetición: una palabra de esta barra ya salió en las 4 anteriores.
  const windowStart = Math.max(0, idx - 4)
  const prevTokens = bars.slice(windowStart, idx).flatMap(tokenize).map(stripAccents)
  const prevSet = new Set(prevTokens)
  const repeated = [...new Set(tokens.filter((t) => t.length >= 4 && prevSet.has(stripAccents(t))))]
  if (repeated.length) {
    found.push(mk('repeticion', 'PALABRA REPETIDA', repeated.join(' · '), repeated, idx))
  }

  if (idx > 0) {
    const prev = tokenize(bars[idx - 1])
    const prevLast = prev[prev.length - 1]
    const curLast = tokens[tokens.length - 1]
    const prevFirst = prev[0]
    const curFirst = tokens[0]

    if (prevFirst && curFirst && prevFirst.length >= MIN_LEN && stripAccents(prevFirst) === stripAccents(curFirst)) {
      found.push(mk('anafora', 'ANÁFORA', `ambas barras empiezan con "${curFirst}"`, [curFirst], idx))
    }

    if (prevLast && curFirst && prevLast.length >= MIN_LEN && stripAccents(prevLast) === stripAccents(curFirst)) {
      found.push(mk('anadiplosis', 'ANADIPLOSIS', `"${prevLast}" cierra una barra y abre la siguiente`, [prevLast], idx))
    }

    if (prevLast && curLast && prevLast.length >= MIN_LEN && curLast.length >= MIN_LEN) {
      const a = rhymeKey(prevLast)
      const b = rhymeKey(curLast)
      if (a.consonante && a.consonante === b.consonante) {
        found.push(mk('rima_final', 'RIMA FINAL (CONSONANTE)', `"${prevLast}" / "${curLast}"`, [prevLast, curLast], idx))
      } else if (a.asonante && a.asonante === b.asonante) {
        found.push(mk('rima_final', 'RIMA FINAL (ASONANTE)', `"${prevLast}" / "${curLast}"`, [prevLast, curLast], idx))
      }
    }
  }

  return found
}
