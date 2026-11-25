// Una generación de evolución del salón (ver lib/specimens/evolution.ts).
//
//   scripts/specimens/evolve.sh        corre todas las etapas en 4 núcleos
//
// Etapas (cada una lee/escribe en /tmp y pool.json):
//   --measure k --of 4    mide el descriptor de los miembros que aún no lo tienen
//   --select              elige sobrevivientes y cría hijas (mutantes, cruces, nacidas)
//   --offspring k --of 4  mide las hijas
//   --merge               elige las que entran, escribe pool.json, borra miniaturas de las muertas
//   --thumbs k --of 4     renderiza las miniaturas que faltan

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { FAMILY_COLOR, buildField, type Family } from '../../lib/specimens/families'
import { resolveGenome, genomeId, type Genome } from '../../lib/specimens/genome'
import { sampleGrid, polygonize } from '../../lib/specimens/polygonize'
import { analyze, orientForPrint, DEFAULT_SIZE_MM, type Metrics } from '../../lib/specimens/analyze'
import { descriptor, HALL_MIN_PRINT } from '../../lib/specimens/select'
import { pickSurvivors, breed, fillSlots, coverage, type Member, type Offspring, type Kind, type ArchiveEntry } from '../../lib/specimens/evolution'
import { inheritedTaste, type Votes } from '../../lib/specimens/votes'
import { renderMesh } from './raster'

const arg = (n: string, d: number) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? Number(process.argv[i + 1]) : d }
const has = (n: string) => process.argv.includes(`--${n}`)
const OF = arg('of', 4)
const RES = 56, THUMB_RES = 112, T = 256
const OUT = path.join(process.cwd(), 'public/proxygenesis')
const POOL = path.join(OUT, 'pool.json')
const ARCHIVE = path.join(OUT, 'archive.json')
const THUMBS = path.join(OUT, 'pool-thumbs')
const tmp = (name: string) => path.join(os.tmpdir(), `np-evo-${name}.json`)
const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const r3 = (v: number) => Math.round(v * 1000) / 1000

type Item = {
  nov?: number
  id: string; family: Family; seed: number; g?: Genome; gen?: number; kind?: Kind; parents?: string[]
  m: ReturnType<typeof compact>; d?: number[]
}

function compact(m: Metrics) {
  return {
    printScore: r3(m.printScore), richness: r3(m.richness), fitness: r3(m.fitness),
    up: m.up, overhangFrac: r3(m.overhangFrac), contactFrac: r3(m.contactFrac),
    wallP10Mm: Math.round(m.wallP10Mm * 10) / 10, thinFrac: r3(m.thinFrac),
    material: m.material, bboxMm: m.bboxMm.map((v) => Math.round(v * 10) / 10),
    genus: m.genus, tris: m.tris, sizeMm: m.sizeMm, cell: m.cell,
  }
}

const genomeOf = (it: Item): Genome => it.g ?? { f: it.family, s: it.seed }

function evaluateGenome(g: Genome, res = RES) {
  const grid = sampleGrid(buildField(resolveGenome(g)), res)
  return analyze(polygonize(grid), grid, DEFAULT_SIZE_MM)
}

const readPool = () => JSON.parse(fs.readFileSync(POOL, 'utf8'))
const readTmp = (name: string) => JSON.parse(fs.readFileSync(tmp(name), 'utf8'))
const writeTmp = (name: string, v: unknown) => fs.writeFileSync(tmp(name), JSON.stringify(v))

const readArchive = (): ArchiveEntry[] => (fs.existsSync(ARCHIVE) ? JSON.parse(fs.readFileSync(ARCHIVE, 'utf8')).entries : [])
const kcode = (k: Kind): 'n' | 'm' | 'c' => (k === 'mutante' ? 'm' : k === 'cruce' ? 'c' : 'n')

// Votos de los visitantes: se leen del sitio publicado (conteos agregados, sin
// datos personales). Si no hay red o la ruta no responde, la generación corre
// sin votos (el gusto es neutral), y se avisa; nunca se inventan.
async function loadVotes(): Promise<Record<string, Votes>> {
  const url = process.env.VOTES_URL ?? 'https://neoproxy.art/api/specimens/votes?all=1'
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const j = await res.json()
    if (!j.ok) throw new Error('respuesta sin ok')
    console.log(`votos leídos de ${url}: ${Object.keys(j.votes).length} piezas con votos`)
    return j.votes
  } catch (e) {
    console.log(`SIN VOTOS (${(e as Error).message}): la selección corre con gusto neutral`)
    return {}
  }
}

// ---- etapas --------------------------------------------------------------------

function stageMeasure(k: number) {
  const pool = readPool()
  const out: Record<string, number[] | null> = {}
  pool.hall.forEach((it: Item, i: number) => {
    if (it.d || i % OF !== k) return
    const res = evaluateGenome(genomeOf(it))
    out[it.id] = res && res.metrics.tris === it.m.tris ? descriptor(res.metrics).map(r3) : null
  })
  writeTmp(`pop-${k}`, out)
  console.log(`medición ${k}: ${Object.keys(out).length} miembros`)
}

async function stageSelect() {
  const pool = readPool()
  const dMap: Record<string, number[] | null> = {}
  for (let k = 0; k < OF; k++) Object.assign(dMap, readTmp(`pop-${k}`))
  const votes = await loadVotes()
  const G = (pool.generation ?? 0) + 1
  const members: Member[] = []
  const items: Record<string, Item> = {}
  let lost = 0
  for (const it of pool.hall as Item[]) {
    const d = it.d ?? dMap[it.id]
    if (!d) { lost++; continue }   // ya no se regenera igual: no puede sobrevivir
    items[it.id] = { ...it, d }
    members.push({ id: it.id, g: genomeOf(it), gen: it.gen ?? 0, kind: it.kind ?? 'nacida', parents: it.parents, fit: it.m.fitness, printScore: it.m.printScore, d, votes: votes[it.id] })
  }
  const hallSize = pool.hall.length
  const survN = Math.round(hallSize * 0.55)
  const survivors = pickSurvivors(members, survN, G)
  const slots = hallSize - survivors.length
  const offspring = breed(survivors, G, slots * 3)
  const dead = members.filter((m) => !survivors.includes(m)).map((m) => m.id)
  writeTmp('state', { G, hallSize, slots, survivors, items, offspring, dead, lost, votes })
  console.log(`archivo histórico: ${readArchive().length} piezas | generación ${G}: ${members.length} vivos (${lost} perdidos) -> sobreviven ${survivors.length}, desaparecen ${dead.length}; se crían ${offspring.length} hijas para ${slots} vacantes`)
}

function stageOffspring(k: number) {
  const st = readTmp('state')
  const out: (Member & { m: ReturnType<typeof compact> })[] = []
  ;(st.offspring as Offspring[]).forEach((o, i) => {
    if (i % OF !== k) return
    const res = evaluateGenome(o.g)
    if (!res) return
    const tf = inheritedTaste((o.parents ?? []).map((pid) => st.votes[pid]))
    out.push({ id: genomeId(o.g), g: o.g, gen: st.G, kind: o.kind, parents: o.parents, tf, fit: res.metrics.fitness, printScore: res.metrics.printScore, d: descriptor(res.metrics).map(r3), m: compact(res.metrics) })
  })
  writeTmp(`off-${k}`, out)
  console.log(`hijas ${k}: ${out.length} medidas`)
}

const groupOf = (it: Item) => it.family
function interleave(items: Item[]): Item[] {
  const groups = new Map<string, Item[]>()
  for (const it of items) groups.set(groupOf(it), [...(groups.get(groupOf(it)) ?? []), it])
  const lists = [...groups.values()].map((l) => l.sort((a, b) => b.m.fitness - a.m.fitness)).sort((a, b) => b[0].m.fitness - a[0].m.fitness)
  const out: Item[] = []
  for (let i = 0; out.length < items.length; i++) for (const l of lists) if (l[i]) out.push(l[i])
  return out
}

function stageMerge() {
  const st = readTmp('state')
  const G: number = st.G
  const survivors: Member[] = st.survivors
  const surv = new Set(survivors.map((s) => s.id))
  let measured = 0
  const seen = new Set<string>(surv)
  const cands: (Member & { m: ReturnType<typeof compact> })[] = []
  for (let k = 0; k < OF; k++) for (const c of readTmp(`off-${k}`)) {
    measured++
    if (c.printScore < HALL_MIN_PRINT || seen.has(c.id)) continue
    seen.add(c.id); cands.push(c)
  }
  const archive = readArchive()
  const born = fillSlots(survivors, cands, st.slots, archive) as (Member & { m: ReturnType<typeof compact> })[]
  // novedad histórica: distancia a lo más parecido que existió alguna vez (o vive)
  const refs = [...archive, ...survivors]
  const novelty = (d: number[]) => Math.min(...refs.map((r) => Math.sqrt(r.d.reduce((a, v, i) => a + (v - d[i]) ** 2, 0))))

  const kept: Item[] = survivors.map((s) => {
    const it: Item = st.items[s.id]
    return { ...it, gen: it.gen ?? 0, kind: it.kind ?? 'nacida' }
  })
  const fresh: Item[] = born.map((b) => ({
    id: b.id, family: b.g.f, seed: b.g.s, ...(b.g.m || b.g.x ? { g: b.g } : {}),
    gen: G, kind: b.kind, ...(b.parents ? { parents: b.parents } : {}), m: b.m, d: b.d, nov: r3(novelty(b.d)),
  }))
  const hall = interleave([...kept, ...fresh])

  // archivo: se cierra a las muertas, se agregan las nacidas (y las vivas que faltaran)
  const deadSet = new Set<string>(st.dead)
  const known = new Set(archive.map((a) => a.id))
  const updated: ArchiveEntry[] = archive.map((a) => (deadSet.has(a.id) && a.x === undefined ? { ...a, x: G } : a))
  for (const it of [...kept, ...fresh]) if (!known.has(it.id)) {
    updated.push({ id: it.id, f: it.family, b: it.gen ?? 0, k: kcode(it.kind ?? 'nacida'), ...(it.parents ? { p: it.parents } : {}), d: it.d!, s: it.m.fitness, ...(it.nov !== undefined ? { nov: it.nov } : {}) })
  }
  fs.writeFileSync(ARCHIVE, JSON.stringify({ version: 1, generation: G, entries: updated }))

  const pool = readPool()
  const count = (k: Kind) => fresh.filter((f) => f.kind === k).length
  pool.generation = G
  pool.generatedAt = new Date().toISOString()
  pool.history = [...(pool.history ?? []), {
    gen: G, date: pool.generatedAt, hall: hall.length, survivors: kept.length, died: st.dead.length + st.lost,
    born: { mutante: count('mutante'), cruce: count('cruce'), nacida: count('nacida') }, measured,
    archive: updated.length, coverage: coverage(updated), novelty: r3(fresh.reduce((a, f) => a + (f.nov ?? 0), 0) / Math.max(1, fresh.length)),
  }]
  for (const f of Object.keys(pool.stats.byFamily)) pool.stats.byFamily[f].hall = hall.filter((h) => h.family === f).length
  pool.hall = hall
  fs.writeFileSync(POOL, JSON.stringify(pool))

  // miniaturas: fuera las de las muertas
  const alive = new Set(hall.map((h) => `${h.id}.webp`))
  fs.mkdirSync(THUMBS, { recursive: true })
  let removed = 0
  for (const f of fs.readdirSync(THUMBS)) if (!alive.has(f)) { fs.unlinkSync(path.join(THUMBS, f)); removed++ }
  console.log(`generación ${G}: salón de ${hall.length} | nacen ${fresh.length} (${count('mutante')} mutantes, ${count('cruce')} cruces, ${count('nacida')} nuevas) | desaparecen ${st.dead.length + st.lost} | miniaturas retiradas ${removed}`)
}

async function stageThumbs(k: number) {
  const pool = readPool()
  let n = 0
  for (let i = 0; i < pool.hall.length; i++) {
    const it: Item = pool.hall[i]
    if (i % OF !== k || fs.existsSync(path.join(THUMBS, `${it.id}.webp`))) continue
    const g = genomeOf(it)
    const check = evaluateGenome(g)
    if (!check || check.metrics.tris !== it.m.tris) throw new Error(`regeneración no determinista en ${it.id}`)
    const res = evaluateGenome(g, THUMB_RES)
    if (!res) throw new Error(`no se pudo regenerar ${it.id} a ${THUMB_RES}`)
    const raw = renderMesh(orientForPrint(res.mesh, res.metrics.up, DEFAULT_SIZE_MM), { size: T * 2, color: hex(FAMILY_COLOR[it.family]) })
    await sharp(Buffer.from(raw), { raw: { width: T * 2, height: T * 2, channels: 4 } }).resize(T, T).webp({ quality: 84 }).toFile(path.join(THUMBS, `${it.id}.webp`))
    n++
  }
  console.log(`miniaturas ${k}: ${n}`)
}

// Reconstruye el archivo histórico la primera vez (a partir del salón actual y de
// la población anterior, si se indica con --gen0 <pool.json>).
function stageBootstrap() {
  if (fs.existsSync(ARCHIVE)) { console.log('el archivo histórico ya existe'); return }
  const pool = readPool()
  const gi = process.argv.indexOf('--gen0')
  const entries: ArchiveEntry[] = []
  const seen = new Set<string>()
  if (gi >= 0) {
    const gen0 = JSON.parse(fs.readFileSync(process.argv[gi + 1], 'utf8'))
    const dMap: Record<string, number[] | null> = {}
    for (let k = 0; k < OF; k++) Object.assign(dMap, readTmp(`pop-${k}`))
    const alive = new Set((pool.hall as Item[]).map((h) => h.id))
    for (const it of gen0.hall as Item[]) {
      const d = it.d ?? dMap[it.id]
      if (!d) continue
      seen.add(it.id)
      entries.push({ id: it.id, f: it.family, b: 0, ...(alive.has(it.id) ? {} : { x: pool.generation ?? 1 }), k: 'n', d, s: it.m.fitness })
    }
  }
  for (const it of pool.hall as Item[]) if (!seen.has(it.id) && it.d) {
    entries.push({ id: it.id, f: it.family, b: it.gen ?? 0, k: kcode(it.kind ?? 'nacida'), ...(it.parents ? { p: it.parents } : {}), d: it.d, s: it.m.fitness })
  }
  fs.writeFileSync(ARCHIVE, JSON.stringify({ version: 1, generation: pool.generation ?? 0, entries }))
  console.log(`archivo histórico creado: ${entries.length} piezas (${entries.filter((e) => e.x !== undefined).length} ya desaparecidas), cobertura ${coverage(entries)} celdas`)
}

async function main() {
  if (has('bootstrap')) return stageBootstrap()
  if (has('measure')) return stageMeasure(arg('measure', 0))
  if (has('select')) return stageSelect()
  if (has('offspring')) return stageOffspring(arg('offspring', 0))
  if (has('merge')) return stageMerge()
  if (has('thumbs')) return stageThumbs(arg('thumbs', 0))
  console.log('uso: scripts/specimens/evolve.sh')
}
main()
