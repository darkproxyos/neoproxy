import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db'
import { fabricationVotes } from '@/src/db/schema'

// drizzle envuelve el error real de libsql en su propio Error ("Failed
// query: ...") — el texto "UNIQUE constraint failed" que de verdad importa
// vive en `.cause` (o más adentro todavía), no en `.message` de primer
// nivel. Verificado con un voto duplicado real contra sqlite local: sin
// recorrer la cadena de `cause`, esto nunca matcheaba y el segundo voto
// volvía como 500 en vez de "ya votado".
function isUniqueConstraintError(err: unknown): boolean {
  let current: unknown = err
  for (let i = 0; i < 5 && current; i++) {
    if (current instanceof Error) {
      if (/unique constraint/i.test(current.message)) return true
      const code = (current as { code?: string }).code
      if (code === 'SQLITE_CONSTRAINT' || code === 'SQLITE_CONSTRAINT_PRIMARYKEY') return true
      current = (current as { cause?: unknown }).cause
    } else {
      break
    }
  }
  return false
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { submissionId, visitorId } = body ?? {}
    if (typeof submissionId !== 'string' || typeof visitorId !== 'string' || !submissionId || !visitorId) {
      return NextResponse.json({ error: 'payload inválido' }, { status: 400 })
    }

    // La clave primaria compuesta (submissionId, visitorId) en el schema es
    // la que de verdad impide el doble voto — esto solo evita que ese
    // intento legítimo (re-click, doble tab) vuelva como error 500.
    try {
      await db.insert(fabricationVotes).values({ submissionId, visitorId })
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        return NextResponse.json({ ok: true, alreadyVoted: true })
      }
      throw err
    }

    return NextResponse.json({ ok: true, alreadyVoted: false })
  } catch (error) {
    console.error('Error en fabrication/vote:', error)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
