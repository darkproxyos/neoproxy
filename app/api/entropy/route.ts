import { NextResponse } from 'next/server'
import { db } from '@/src/db'
import { systemState } from '@/src/db/schema'
import { eq } from 'drizzle-orm'

// A diferencia de las Server Actions de app/admin/actions.ts (gateadas por
// requireRoot — mutan estado), este endpoint es de solo lectura y público a
// propósito: el nivel de entropía real ya no es un dato de panel cerrado,
// es lo que hace que el sitio entero reaccione para cualquier visitante
// (ver components/EntropyField.tsx). Un número entre 0 y 100 no es
// información sensible.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rows = await db.select({ entropyLevel: systemState.entropyLevel })
      .from(systemState)
      .where(eq(systemState.id, 'GLOBAL'))
    return NextResponse.json({ entropyLevel: rows[0]?.entropyLevel ?? 0 })
  } catch (error) {
    console.error('Error leyendo entropía:', error)
    return NextResponse.json({ entropyLevel: 0 })
  }
}
