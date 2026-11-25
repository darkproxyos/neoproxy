// Huellas de las recetas de referencia. Sirve para comparar motores de JavaScript distintos:
//   npx tsx scripts/capas/hash.ts        (V8, en Node)
//   bun scripts/capas/hash.ts            (JavaScriptCore, en Bun)
// Las dos salidas deben ser idénticas byte a byte.
import { LAW_IDS } from '../../lib/capas/laws'
import { Session, defaultRecipe, runRecipe, volumeHash, type Recipe } from '../../lib/capas/session'
import { mulberry32 } from '../../lib/specimens/rng'
import { PRESETS, presetRecipe } from '../../lib/capas/presets'

// Recetas de referencia: la de fábrica de cada ley y otra con pinceladas y giros de perilla al azar.
// `live` es la huella de la sesión que se pintó en vivo (para compararla con su reproducción).
export function referenceRecipes(): Record<string, { recipe: Recipe; live?: string }> {
  const out: Record<string, { recipe: Recipe; live?: string }> = {}
  for (const id of LAW_IDS) {
    out[`${id}/fabrica`] = { recipe: defaultRecipe(id, 7) }
    const rnd = mulberry32(99)
    const s = new Session({ ...defaultRecipe(id, 5), slices: 120 }, false)
    for (let i = 0; i < 119; i++) {
      for (let k = 0; k < 3; k++) if (rnd() < 0.35) s.paint(Math.floor(rnd() * 128), Math.floor(rnd() * 128), 2 + Math.floor(rnd() * 15), rnd() < 0.75 ? 1 : -1)
      if (i % 31 === 7) s.setKnob(rnd())
      s.advance(1)
    }
    out[`${id}/pinceladas`] = { recipe: s.recipe, live: volumeHash(s.volume()) }
  }
  for (const p of PRESETS) out[`semilla/${p.id}`] = { recipe: presetRecipe(p) }
  return out
}

if (require.main === module || typeof (globalThis as { Bun?: unknown }).Bun !== 'undefined') {
  const res: Record<string, string> = {}
  for (const [k, r] of Object.entries(referenceRecipes())) res[k] = volumeHash(runRecipe(r.recipe).volume())
  console.log(JSON.stringify(res, null, 2))
}
