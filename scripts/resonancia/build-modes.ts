// Calcula los modos de la placa cuadrada libre (Ritz, Legendre hasta grado 15 = 256
// funciones) y escribe lib/resonancia/modes.json con los modos que ya convergieron:
// se comparan con una base más chica (grado 13) y se guardan los que cambian < 0,1 %.
//   npx tsx scripts/resonancia/build-modes.ts
import fs from 'fs'
import { solvePlate, NU } from '../../lib/resonancia/ritz'

const big = solvePlate(15), small = solvePlate(13)
const LEISSA = [13.468, 19.596, 24.270, 34.801, 34.801, 61.093, 61.093, 63.686, 69.272] // Leissa (1969), ν = 0,3
const modes: { lambda: number; conv: number; coef: number[] }[] = []
for (let k = 3; k < big.lambda.length && modes.length < 48; k++) {
  const conv = Math.abs(big.lambda[k] - small.lambda[k]) / big.lambda[k]
  if (conv > 1e-3) break
  modes.push({ lambda: +big.lambda[k].toFixed(5), conv: +conv.toExponential(2), coef: big.coef[k].map((c) => (Math.abs(c) < 1e-9 ? 0 : +c.toPrecision(7))) })
}
const check = LEISSA.map((l, i) => ({ leissa: l, ritz: modes[i].lambda, err: +((modes[i].lambda - l) / l).toExponential(2) }))
fs.writeFileSync('lib/resonancia/modes.json', JSON.stringify({ n: 15, nu: NU, note: 'Placa cuadrada libre, Kirchhoff, Rayleigh–Ritz con P_i(x)P_j(y) en [-1,1]². λ = ω a² √(ρh/D).', leissa: check, modes }) + '\n')
console.log(`${modes.length} modos convergidos, λ ${modes[0].lambda} … ${modes[modes.length - 1].lambda}`)
console.log(check.map((c) => `${c.leissa}→${c.ritz} (${c.err})`).join('  '))
