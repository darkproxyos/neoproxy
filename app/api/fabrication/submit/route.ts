import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db'
import { fabricationSubmissions } from '@/src/db/schema'
import { isoWeekKey } from '@/lib/isoWeek'

const MAX_LABEL_LEN = 60
const MAX_THUMBNAIL_LEN = 60_000 // generoso para un jpeg 220x160 q0.5 en dataURL

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { mode, label, params, thumbnail } = body ?? {}
    if (!['coral', 'arbol', 'concha'].includes(mode)) {
      return NextResponse.json({ error: 'mode inválido' }, { status: 400 })
    }
    if (typeof thumbnail !== 'string' || !thumbnail.startsWith('data:image/') || thumbnail.length > MAX_THUMBNAIL_LEN) {
      return NextResponse.json({ error: 'thumbnail inválido' }, { status: 400 })
    }
    if (typeof params !== 'object' || params === null) {
      return NextResponse.json({ error: 'params inválido' }, { status: 400 })
    }

    const [row] = await db.insert(fabricationSubmissions).values({
      source: 'proxygenesis',
      mode,
      label: typeof label === 'string' ? label.slice(0, MAX_LABEL_LEN) : null,
      params,
      thumbnail,
      weekOf: isoWeekKey(),
    }).returning({ id: fabricationSubmissions.id })

    return NextResponse.json({ ok: true, id: row.id })
  } catch (error) {
    console.error('Error en fabrication/submit:', error)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
