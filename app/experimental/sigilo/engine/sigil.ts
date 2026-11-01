// Método real de reducción de intención a símbolo, sistematizado a
// principios del siglo XX y hoy un procedimiento técnico documentado y
// reproducible, no una convención arbitraria de esta página:
//   1. La intención se normaliza (mayúsculas, sin acentos, sin espacios
//      ni puntuación).
//   2. Se eliminan las letras repetidas, quedándose con la primera
//      aparición de cada una, en orden — ese es el set que "sobrevive".
//   3. El set resultante se funde en un único glifo (ver buildSigilPath).
// Es determinístico a propósito: la misma intención da siempre el mismo
// sigilo, nunca algo al azar — esa reproducibilidad es parte del método
// real, no un detalle de implementación.

export type ReducedIntention = {
  original: string
  normalizedLetters: string[] // una entrada por letra del texto normalizado, en orden, sin filtrar
  keptLetters: string[] // el set final: primera aparición de cada letra única, en orden
  keptMask: boolean[] // mismo largo que normalizedLetters — true si esa letra sobrevivió (es su primera aparición)
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function reduceIntention(raw: string): ReducedIntention {
  const original = raw.trim()
  const normalized = stripAccents(original).toUpperCase().replace(/[^A-Z]/g, '')
  const normalizedLetters = normalized.split('')

  const seen = new Set<string>()
  const keptMask: boolean[] = []
  const keptLetters: string[] = []
  for (const ch of normalizedLetters) {
    const isFirst = !seen.has(ch)
    keptMask.push(isFirst)
    if (isFirst) {
      seen.add(ch)
      keptLetters.push(ch)
    }
  }

  return { original, normalizedLetters, keptLetters, keptMask }
}

// Arte conceptual al estilo Sol LeWitt / Vera Molnár: una instrucción
// escrita en texto plano, derivada determinísticamente del mismo set de
// letras que ya produce el sigilo (reduceIntention), y después ejecutada
// al pie de la letra — nada librado al azar entre la instrucción y el
// dibujo, la instrucción ES la receta exacta de lo que se ve.
export type ConceptualInstruction = { lines: number; spacing: number; angleDeg: number; text: string }

export function buildConceptualInstruction(keptLetters: string[]): ConceptualInstruction {
  const lines = Math.max(1, keptLetters.length)
  const sum = keptLetters.reduce((acc, l) => acc + l.charCodeAt(0), 0)
  const spacing = 6 + (sum % 20)
  const angleDeg = keptLetters.length > 0 ? Math.round((keptLetters[0].charCodeAt(0) - 65) * (180 / 26)) : 0
  const text = `TRAZÁ ${lines} LÍNEA${lines === 1 ? '' : 'S'} PARALELA${lines === 1 ? '' : 'S'}, SEPARADAS ${spacing}PX, INCLINADAS ${angleDeg}°.`
  return { lines, spacing, angleDeg, text }
}

export type SigilPoint = { letter: string; x: number; y: number }
export type SigilGlyph = {
  points: SigilPoint[]
  pathD: string
  wheelPoints: { letter: string; x: number; y: number }[] // las 26 posiciones de la rueda, para dibujarla de fondo
}

const SIZE = 200
const CENTER = SIZE / 2
const RADIUS = SIZE / 2 - 18

// Rueda de 26 posiciones (A–Z) distribuidas en círculo — la implementación
// más común y reproducible del método: cada letra es un punto fijo del
// círculo, nunca se mueve, así que el mismo set de letras cae siempre en
// los mismos puntos. Empieza arriba (ángulo -90°) y avanza en sentido
// horario.
function wheelPosition(letter: string): { x: number; y: number } {
  const idx = letter.charCodeAt(0) - 65 // 'A' = 0 .. 'Z' = 25
  const angle = (idx / 26) * Math.PI * 2 - Math.PI / 2
  return {
    x: CENTER + RADIUS * Math.cos(angle),
    y: CENTER + RADIUS * Math.sin(angle),
  }
}

export function buildSigilGlyph(keptLetters: string[]): SigilGlyph {
  const wheelPoints = Array.from({ length: 26 }, (_, i) => {
    const letter = String.fromCharCode(65 + i)
    return { letter, ...wheelPosition(letter) }
  })

  const points: SigilPoint[] = keptLetters.map(letter => ({ letter, ...wheelPosition(letter) }))
  const pathD = points.length > 0
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
    : ''

  return { points, pathD, wheelPoints }
}
