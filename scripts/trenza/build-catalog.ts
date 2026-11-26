// Construye lib/trenza/catalog.json a partir de las condiciones iniciales publicadas
// (Šuvakov y Dmitrašinović 2013, 6 cifras; el ocho, Chenciner y Montgomery 2000).
// Para cada órbita: refina (p1, p2, T) con Gauss–Newton hasta que cierre, mide la deriva
// de la energía en un período, el acercamiento mínimo, la palabra de la trenza y cuántos
// períodos aguanta antes de deshacerse con una perturbación de 1e-6 y de 1e-9.
//   npx tsx scripts/trenza/build-catalog.ts
import fs from 'fs'
import { refine, integrate, initial, energy, braidWord, reduceWord, divergence, returnError } from '../../lib/trenza/nbody'

const PUB: { id: string; name: string; en: string; p1: number; p2: number; T: number }[] = [
  { id: 'ocho', name: 'OCHO', en: 'Figure-eight', p1: 0.347111, p2: 0.532728, T: 6.325913 },
  { id: 'mariposa-1', name: 'MARIPOSA I', en: 'Butterfly I', p1: 0.306893, p2: 0.125507, T: 6.2356 },
  { id: 'mariposa-2', name: 'MARIPOSA II', en: 'Butterfly II', p1: 0.392955, p2: 0.097579, T: 7.0039 },
  { id: 'mariposa-3', name: 'MARIPOSA III', en: 'Butterfly III', p1: 0.405916, p2: 0.230163, T: 13.8658 },
  { id: 'polilla-1', name: 'POLILLA I', en: 'Moth I', p1: 0.464445, p2: 0.396060, T: 14.8939 },
  { id: 'polilla-2', name: 'POLILLA II', en: 'Moth II', p1: 0.439166, p2: 0.452968, T: 28.6703 },
  { id: 'polilla-3', name: 'POLILLA III', en: 'Moth III', p1: 0.383444, p2: 0.377364, T: 25.8406 },
  { id: 'anteojos', name: 'ANTEOJOS', en: 'Goggles', p1: 0.083300, p2: 0.127889, T: 10.4668 },
  { id: 'libelula', name: 'LIBÉLULA', en: 'Dragonfly', p1: 0.080584, p2: 0.588836, T: 21.2710 },
  { id: 'abejorro', name: 'ABEJORRO', en: 'Bumblebee', p1: 0.184279, p2: 0.587188, T: 63.5345 },
  { id: 'ovillo', name: 'OVILLO', en: 'Yarn', p1: 0.559064, p2: 0.349192, T: 55.5018 },
  { id: 'yinyang-1a', name: 'YIN-YANG Ia', en: 'Yin-yang Ia', p1: 0.513938, p2: 0.304736, T: 17.3284 },
  { id: 'yinyang-1b', name: 'YIN-YANG Ib', en: 'Yin-yang Ib', p1: 0.282699, p2: 0.327209, T: 10.9626 },
]
const HORIZON = 40 // períodos

const out = []
for (const o of PUB) {
  const t0 = Date.now()
  const r = refine(o.p1, o.p2, o.T, 12)
  const tr = integrate(initial(r.p1, r.p2), r.T)
  const y1 = tr.y[tr.y.length - 1], e0 = energy(initial(r.p1, r.p2)), e1 = energy(y1)
  const word = reduceWord(braidWord(tr, r.T))
  const div = [1e-6, 1e-9].map((eps) => { const d = divergence(r.p1, r.p2, eps, HORIZON * r.T); return d === null ? null : +(d / r.T).toFixed(2) })
  const entry = {
    id: o.id, name: o.name, en: o.en,
    published: { p1: o.p1, p2: o.p2, T: o.T, returnError: +returnError(o.p1, o.p2, o.T).toExponential(2) },
    p1: r.p1, p2: r.p2, T: r.T, returnError: +r.hist[r.hist.length - 1].toExponential(2),
    energy: +e0.toFixed(6), energyDrift: +Math.abs((e1 - e0) / e0).toExponential(2),
    steps: tr.steps, minDist: +tr.minDist.toFixed(4), word,
    diverge: { eps6: div[0], eps9: div[1], horizon: HORIZON },
  }
  out.push(entry)
  console.log(`${o.name.padEnd(13)} cierre ${entry.published.returnError} → ${entry.returnError} · T ${o.T} → ${r.T.toFixed(6)} · ΔE ${entry.energyDrift} · dmín ${entry.minDist} · trenza ${word.length} cruces · aguanta ${div.map((d) => (d === null ? `>${HORIZON}` : d)).join(' / ')} períodos · ${((Date.now() - t0) / 1000).toFixed(1)} s`)
}
fs.writeFileSync('lib/trenza/catalog.json', JSON.stringify(out, null, 1) + '\n')
console.log('escrito lib/trenza/catalog.json')
