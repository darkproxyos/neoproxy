// KATANA — comprobaciones y exportación de prueba (corre en Node, sin navegador).
//   npx tsx scripts/katana/check.ts            vista previa (rápido)
//   npx tsx scripts/katana/check.ts exportar   alta resolución + STL en la carpeta que se pase como 2.º argumento
import { build, verify, orient, paramsJson } from '../../lib/katana/build'
import { meshToBinarySTL } from '../../lib/specimens/stl'
import { writeFileSync, mkdirSync } from 'node:fs'

const modo = process.argv[2] === 'exportar' ? 'exportar' : 'vista', dir = process.argv[3]
const t0 = Date.now()
const b = build({ quality: modo })
console.log(`${b.parts.length} piezas (${modo}) en ${((Date.now() - t0) / 1000).toFixed(1)} s`)
const v = verify(b)
for (const p of v.parts) console.log(`  ${p.key.padEnd(14)} ${String(p.triangles).padStart(7)} tri  ${p.closed ? 'cerrada ' : 'ABIERTA '} ${p.volumeCm3.toFixed(1).padStart(6)} cm³  ${p.printMm.join(' × ')} mm ${p.fits ? '' : '  NO CABE'}`)
for (const c of v.checks) console.log(`  ${c.ok ? 'ok  ' : 'FALLA'} ${c.name} — ${c.detail}`)
if (dir) {
  mkdirSync(dir, { recursive: true })
  for (const p of b.parts) writeFileSync(`${dir}/katana-${p.key}${p.count > 1 ? `-x${p.count}` : ''}.stl`, Buffer.from(meshToBinarySTL(orient(p.mesh, p.rot))))
  writeFileSync(`${dir}/katana-parametros.json`, JSON.stringify(paramsJson(b, v), null, 2))
  console.log(`STL y JSON en ${dir}`)
}
process.exit(v.ok ? 0 : 1)
