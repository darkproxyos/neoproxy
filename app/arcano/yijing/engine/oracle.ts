// El método real de las tres monedas -- la simplificación del método
// de los tallos de milenrama que se volvió estándar en Occidente. Tres
// monedas por línea, cara = 3, ceca = 2, sumadas: 6 (yin vieja, cambia),
// 7 (yang joven, fija), 8 (yin joven, fija), 9 (yang vieja, cambia).
// Seis líneas, de abajo hacia arriba, arman el hexagrama primario; las
// líneas "viejas" (6 y 9) se invierten para armar el hexagrama
// transformado -- hacia dónde se mueve la situación.
//
// A diferencia de /experimental/sigilo (determinístico a propósito, la
// misma frase siempre da el mismo sigilo), acá la aleatoriedad es real
// y deliberada: el método de las monedas siempre fue, literalmente,
// azar -- forzarlo a ser reproducible le quitaría el único mecanismo
// que de verdad tiene.

export type LineValue = 6 | 7 | 8 | 9

export type CastLine = {
  value: LineValue
  isYang: boolean // valor de cara (línea primaria)
  isChanging: boolean // 6 o 9
}

function tossCoin(): 2 | 3 {
  return Math.random() < 0.5 ? 2 : 3
}

export function tossLine(): CastLine {
  const sum = (tossCoin() + tossCoin() + tossCoin()) as LineValue
  return {
    value: sum,
    isYang: sum === 7 || sum === 9,
    isChanging: sum === 6 || sum === 9,
  }
}

export function castSixLines(): CastLine[] {
  return Array.from({ length: 6 }, () => tossLine())
}

export function primaryLines(cast: CastLine[]): boolean[] {
  return cast.map((l) => l.isYang)
}

export function transformedLines(cast: CastLine[]): boolean[] | null {
  const hasChanging = cast.some((l) => l.isChanging)
  if (!hasChanging) return null
  return cast.map((l) => (l.isChanging ? !l.isYang : l.isYang))
}
