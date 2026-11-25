// Semillas de partida: pinceladas aplicadas en la capa 0, a mano y deterministas. Cambian la
// forma de verdad (cuatro semillas dan un tambor con cuatro raíces; ocho en corona, un rosetón),
// y sus huellas están en scripts/capas/golden.json para que ningún cambio del motor las mueva
// sin avisar. Se probaron más (anillos de mitosis, una segunda espiral) y se descartaron:
// salían casi iguales al original o muy fragmentadas.
import type { LawId } from './laws'
import { defaultRecipe, type Recipe, type Stroke } from './session'

export type Preset = { id: string; law: LawId; label: string; hint: string; strokes: Stroke[] }

const ring = (n: number, R: number, r: number): Stroke[] =>
  Array.from({ length: n }, (_, k) => [0, Math.round(64 + R * Math.cos((2 * Math.PI * k) / n)), Math.round(64 + R * Math.sin((2 * Math.PI * k) / n)), r, 1] as Stroke)

export const PRESETS: Preset[] = [
  { id: 'coral-cuatro', law: 'coral', label: 'CUATRO SEMILLAS', hint: 'Cuatro focos más el del centro: los frentes chocan y dejan un tambor con cuatro raíces',
    strokes: [[0, 36, 40, 6, 1], [0, 92, 40, 6, 1], [0, 36, 88, 6, 1], [0, 92, 88, 6, 1]] },
  { id: 'coral-corona', law: 'coral', label: 'CORONA', hint: 'Ocho semillas en círculo: un rosetón radial sobre ocho raíces', strokes: ring(8, 36, 5) },
  { id: 'mitosis-anillo', law: 'mitosis', label: 'ANILLO', hint: 'Seis colonias en círculo que crecen hacia el centro y hacia afuera', strokes: ring(6, 30, 5) },
  { id: 'espirales-ondas', law: 'espirales', label: 'ONDAS', hint: 'Tres excitaciones extra: ondas que chocan con la espiral del centro',
    strokes: [[0, 20, 100, 5, 1], [0, 100, 30, 5, 1], [40, 90, 100, 5, 1]] },
]

export const presetRecipe = (p: Preset, seed = 7): Recipe => ({ ...defaultRecipe(p.law, seed), strokes: p.strokes.map((s) => [...s] as Stroke) })
