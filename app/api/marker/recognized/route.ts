import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db'
import { memoryEvents } from '@/src/db/schema'
import { ARTIFACTS } from '@/components/artifacts/registry'

// Hasta ahora reconocer un artefacto físico (AR por imagen en
// /realidad-aumentada/marcador, o NFC en /experimental/scan) solo tocaba
// localStorage (recordNfcScan) — nada quedaba en memory_events, así que
// una visita física no pesaba nada en las señales reales que leen los
// cron de diario/Entropy (gte sobre memory_events). Esto cierra ese
// círculo: un tap real ahora es un evento real, con el mismo peso que
// cualquier otro.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { artifactId, trigger } = body ?? {}
    if (typeof artifactId !== 'string' || !ARTIFACTS.some(a => a.id === artifactId)) {
      return NextResponse.json({ error: 'artifactId inválido' }, { status: 400 })
    }
    const safeTrigger = trigger === 'nfc' ? 'nfc' : trigger === 'image' ? 'image' : 'unknown'

    await db.insert(memoryEvents).values({
      eventType: 'MARKER_RECOGNIZED',
      payload: { artifactId, trigger: safeTrigger },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error en marker/recognized:', error)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
