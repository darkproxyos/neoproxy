import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/src/db'

// Votos del laboratorio de especímenes (/especimenes/laboratorio).
//
// La tabla se crea sola, con IF NOT EXISTS, la primera vez que la ruta corre en
// cada instancia: es una tabla nueva y aislada, y así no hace falta una
// migración manual contra la base de producción. No está en src/db/schema.ts a
// propósito: un `drizzle-kit generate` futuro intentaría crearla otra vez sin
// IF NOT EXISTS y fallaría donde ya existe.
//
// Privacidad: solo se guarda el id anónimo del navegador (getVoterId), el id de
// la pieza, el voto y la hora. No se guarda IP ni ningún dato personal.
// Caché: el navegador siempre revalida (max-age=0) para que un voto recién emitido
// no se vea "perdido" tras recargar; solo el CDN guarda el agregado 10 s.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

let ready: Promise<unknown> | null = null
function ensureTable() {
  if (!ready) {
    ready = (async () => {
      await db.run(sql`CREATE TABLE IF NOT EXISTS specimen_votes (
        piece TEXT NOT NULL, voter TEXT NOT NULL, v INTEGER NOT NULL, at INTEGER NOT NULL,
        PRIMARY KEY (piece, voter))`)
      await db.run(sql`CREATE INDEX IF NOT EXISTS specimen_votes_voter_at ON specimen_votes (voter, at)`)
    })().catch((e) => { ready = null; throw e })
  }
  return ready
}

const PIECE = /^[a-z]{3}-[0-9a-z]{1,12}(\.[0-9a-z]{1,10})?$/
const VOTER = /^[0-9a-zA-Z-]{16,64}$/
const MAX_PER_HOUR = 120

// freno por instancia contra ráfagas (la serverless no comparte memoria: es un
// límite blando; el duro es MAX_PER_HOUR por votante, que sí vive en la base)
const burst = new Map<string, number[]>()
function tooFast(key: string) {
  const now = Date.now(), win = (burst.get(key) ?? []).filter((t) => now - t < 60_000)
  win.push(now); burst.set(key, win)
  if (burst.size > 5000) burst.clear()
  return win.length > 40
}

type Row = { piece: string; l: number; d: number }

export async function GET(req: NextRequest) {
  try {
    await ensureTable()
    const ids = (req.nextUrl.searchParams.get('ids') ?? '').split(',').filter((s) => PIECE.test(s)).slice(0, 600)
    const all = req.nextUrl.searchParams.get('all') === '1'
    if (!ids.length && !all) return NextResponse.json({ ok: true, votes: {} })
    const rows = (all
      ? await db.all<Row>(sql`SELECT piece, SUM(v = 1) AS l, SUM(v = -1) AS d FROM specimen_votes GROUP BY piece LIMIT 5000`)
      : await db.all<Row>(sql`SELECT piece, SUM(v = 1) AS l, SUM(v = -1) AS d FROM specimen_votes WHERE piece IN (${sql.join(ids.map((i) => sql`${i}`), sql`, `)}) GROUP BY piece`))
    const votes: Record<string, { l: number; d: number }> = {}
    for (const r of rows) votes[r.piece] = { l: Number(r.l), d: Number(r.d) }
    return NextResponse.json({ ok: true, votes }, { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=10' } })
  } catch (error) {
    console.error('Error leyendo votos de especímenes:', error)
    return NextResponse.json({ ok: false, votes: {} }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const { piece, voter, v } = body ?? {}
    if (typeof piece !== 'string' || !PIECE.test(piece) || typeof voter !== 'string' || !VOTER.test(voter) || ![-1, 0, 1].includes(v)) {
      return NextResponse.json({ ok: false, error: 'payload inválido' }, { status: 400 })
    }
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'x'
    if (tooFast(`${ip}|${voter}`)) return NextResponse.json({ ok: false, error: 'demasiado rápido' }, { status: 429 })

    await ensureTable()
    const now = Math.floor(Date.now() / 1000)
    const recent = await db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM specimen_votes WHERE voter = ${voter} AND at > ${now - 3600}`)
    if (Number(recent[0]?.n ?? 0) >= MAX_PER_HOUR) return NextResponse.json({ ok: false, error: 'límite por hora' }, { status: 429 })

    if (v === 0) await db.run(sql`DELETE FROM specimen_votes WHERE piece = ${piece} AND voter = ${voter}`)
    else await db.run(sql`INSERT INTO specimen_votes (piece, voter, v, at) VALUES (${piece}, ${voter}, ${v}, ${now})
      ON CONFLICT (piece, voter) DO UPDATE SET v = excluded.v, at = excluded.at`)

    const agg = await db.all<{ l: number; d: number }>(sql`SELECT SUM(v = 1) AS l, SUM(v = -1) AS d FROM specimen_votes WHERE piece = ${piece}`)
    return NextResponse.json({ ok: true, votes: { l: Number(agg[0]?.l ?? 0), d: Number(agg[0]?.d ?? 0) } })
  } catch (error) {
    console.error('Error votando en especímenes:', error)
    return NextResponse.json({ ok: false, error: 'internal' }, { status: 503 })
  }
}
