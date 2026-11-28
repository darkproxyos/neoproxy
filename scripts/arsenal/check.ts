// ARSENAL · NPX-02 VÉRTICE — comprobaciones y exportación de prueba (corre en Node, sin navegador).
//   npx tsx scripts/arsenal/check.ts                      vista previa
//   npx tsx scripts/arsenal/check.ts exportar [carpeta]   alta resolución (+ STL y JSON si se da carpeta)
//   opciones extra como clave=valor: largo=900 ancho=70 punta=tanto maxPieza=256 proc=resina fibra=0
import { specs, verify, paramsJson, makePart, type Built } from '../../lib/arsenal/vertice/build'
import { orient } from '../../lib/arsenal/mesh'
import { meshToBinarySTL } from '../../lib/specimens/stl'
import { writeFileSync, mkdirSync } from 'node:fs'

const args = process.argv.slice(2)
const modo = args.includes('exportar') ? 'exportar' : 'vista'
const dir = args.find((a) => a !== 'exportar' && !a.includes('='))
const extra: Record<string, unknown> = {}
for (const a of args.filter((x) => x.includes('='))) { const [k, v] = a.split('='); extra[k] = isNaN(Number(v)) ? v : k === 'fibra' ? v === '1' : Number(v) }
const t0 = Date.now()
const { D, list } = specs({ ...extra, quality: modo })
const parts = list.map((s) => { const t = Date.now(); const p = makePart(s); const ms = Date.now() - t; if (ms > 400) console.log(`  · ${s.key} ${ms} ms`); return p })
const b: Built = { opts: D.o, D, parts, ms: Date.now() - t0 }
console.log(`${parts.length} piezas (${modo}) en ${((Date.now() - t0) / 1000).toFixed(1)} s · ${D.n} segmentos por lámina (ℓ ${D.ell.toFixed(0)}, desfase ${D.s.toFixed(0)}), filo en ${D.ne}, ${D.windows.length} ventanas, ${D.plates.length} placas`)
const t1 = Date.now()
const v = verify(b)
console.log(`verificación en ${((Date.now() - t1) / 1000).toFixed(1)} s`)
for (const p of v.parts) console.log(`  ${p.key.padEnd(14)} ${String(p.triangles).padStart(7)} tri  ${p.closed ? 'cerrada ' : 'ABIERTA '} ${p.volumeCm3.toFixed(1).padStart(6)} cm³  ${p.printMm.join(' × ')} mm ${p.fits ? '' : '  NO CABE'}`)
for (const c of v.checks) console.log(`  ${c.ok ? 'ok  ' : 'FALLA'} ${c.name} — ${c.detail}`)
if (dir) {
  mkdirSync(dir, { recursive: true })
  for (const p of parts) if (p.print) writeFileSync(`${dir}/${p.print.file}`, Buffer.from(meshToBinarySTL(orient(p.mesh, p.rot))))
  writeFileSync(`${dir}/vertice-parametros.json`, JSON.stringify(paramsJson(b, v), null, 2))
  console.log(`STL y JSON en ${dir}`)
}
process.exit(v.ok ? 0 : 1)
