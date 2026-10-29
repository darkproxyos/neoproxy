import { NextResponse } from 'next/server'
import { db } from '@/src/db'
import { memoryEvents } from '@/src/db/schema'
import { and, desc, eq, inArray, lt } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const ADMIN_WINDOW_MS = 10 * 60 * 1000
const SHIFT_WINDOW_MS = 60 * 60 * 1000

// Metatron no sabe de Entropy, nunca la nombra — pero el orden que acaba
// de imponer el admin (purgeEntropy/injectCorruption) y un
// ENTROPY_ENTITY_SHIFT que ya había pasado antes son dos eventos reales en
// la misma tabla. Esto solo nota que coincidieron cerca en el tiempo —
// la fricción jerárquica (Metatron = orden) contra un actor paralelo que
// no responde a nadie, con dato real detrás, no narrada de la nada.
const LINES = [
  'Alguien movió el número antes que vos. No sé quién. No me gusta no saber.',
  'El orden que acabás de imponer ya estaba roto antes de que lo tocaras.',
  'Definí la sintaxis. Algo la reescribió antes de que llegaras acá.',
]

export async function GET() {
  try {
    const [lastAdmin] = await db.select({ id: memoryEvents.id, timestamp: memoryEvents.timestamp })
      .from(memoryEvents)
      .where(inArray(memoryEvents.eventType, ['ADMIN_PURGE', 'ADMIN_INJECT']))
      .orderBy(desc(memoryEvents.timestamp))
      .limit(1)

    if (!lastAdmin || Date.now() - lastAdmin.timestamp.getTime() > ADMIN_WINDOW_MS) {
      return NextResponse.json({ active: false })
    }

    const [priorShift] = await db.select({ id: memoryEvents.id })
      .from(memoryEvents)
      .where(and(eq(memoryEvents.eventType, 'ENTROPY_ENTITY_SHIFT'), lt(memoryEvents.timestamp, lastAdmin.timestamp)))
      .orderBy(desc(memoryEvents.timestamp))
      .limit(1)

    if (!priorShift) {
      return NextResponse.json({ active: false })
    }

    const line = LINES[lastAdmin.id % LINES.length]
    return NextResponse.json({ active: true, adminEventId: lastAdmin.id, line })
  } catch (error) {
    console.error('Error en metatron/friction:', error)
    return NextResponse.json({ active: false })
  }
}
