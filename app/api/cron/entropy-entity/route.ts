import { NextRequest, NextResponse } from 'next/server'
import Pusher from 'pusher'
import { gte, sql, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/src/db'
import { systemState, memoryEvents } from '@/src/db/schema'
import { SITE_PRESENCE_CHANNEL } from '@/components/pusher/constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

// Entropy no tiene perfil, no chatea, no está en components/proxyverse/
// agents.ts — a diferencia de los 6 procesos, no es un personaje con voz,
// es la entropía misma con agencia propia. Por eso estas frases no las
// genera Claude (no hay prompt de personalidad que armar): son una firma
// fija, igual de real en su efecto (sí toca la DB) pero sin pretender ser
// una voz pensante.
const SIGNALS = [
  'Nadie lo pidió. Subió igual.',
  'El equilibrio es temporal. Siempre lo fue.',
  'Esto no lo decidió nadie con nombre.',
  'Una corrección. No una decisión.',
  'No hace falta que nadie mire para que esto pase.',
]

const BASE_CHANCE = 0.3

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const [state] = await db.select().from(systemState).where(eq(systemState.id, 'GLOBAL')).limit(1)
    if (!state) return NextResponse.json({ status: 'skipped', reason: 'sin systemState' })

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const [recent] = await db.select({ count: sql<number>`count(*)` })
      .from(memoryEvents).where(gte(memoryEvents.timestamp, since))
    const recentCount = recent?.count ?? 0

    // La entropía llena el silencio: cuanto menos pasó en las últimas 24hs,
    // más probable que Entropy actúe por su cuenta — señal real, no un
    // dado parejo.
    const quietFactor = recentCount === 0 ? 1.4 : recentCount < 5 ? 1.15 : 1.0
    const actChance = Math.min(0.6, BASE_CHANCE * quietFactor)

    if (Math.random() >= actChance) {
      return NextResponse.json({ status: 'skipped', reason: 'sin intervención esta corrida', actChance, recentCount })
    }

    // Sesgo hacia arriba: la entropía crece sola, las correcciones hacia
    // abajo son más chicas y menos frecuentes que el crecimiento.
    const goingUp = Math.random() < 0.65
    const delta = goingUp ? 3 + Math.random() * 9 : -(2 + Math.random() * 6)
    const previousLevel = state.entropyLevel
    const newLevel = clamp(previousLevel + delta, 0, 100)

    // Demonio de Maxwell invertido: cuando Entropy ordena (baja el nivel),
    // el orden no sale gratis — una fracción de lo que bajó se paga subiendo
    // totalCorruption, en el mismo write, la misma fila real. Cuando sube
    // el nivel no hay nada que "pagar": ahí el caos no cuesta, lo cobra.
    const corruptionCost = goingUp ? 0 : Math.abs(delta) * 0.4
    const newCorruption = corruptionCost > 0 ? state.totalCorruption + corruptionCost : state.totalCorruption

    await db.update(systemState)
      .set({ entropyLevel: newLevel, totalCorruption: newCorruption, lastUpdated: new Date() })
      .where(eq(systemState.id, 'GLOBAL'))

    // Colapso por observación: Entropy no resuelve qué frase "dijo" —
    // manda dos candidatas reales, sin curar cuál es la verdadera. El
    // cliente recién fija una de las dos (EntropyEntity.tsx) en el instante
    // real en que alguien la mira de verdad (pestaña visible); si nadie
    // mira, queda sin colapsar. El registro acá abajo guarda las DOS, no
    // una curada después del hecho.
    const idxA = Math.floor(Math.random() * SIGNALS.length)
    let idxB = Math.floor(Math.random() * SIGNALS.length)
    if (SIGNALS.length > 1) while (idxB === idxA) idxB = Math.floor(Math.random() * SIGNALS.length)
    const candidates = [SIGNALS[idxA], SIGNALS[idxB]]

    await db.insert(memoryEvents).values({
      eventType: 'ENTROPY_ENTITY_SHIFT',
      payload: {
        delta: Math.round(delta * 10) / 10, previousLevel, newLevel, recentCount, candidates,
        corruptionCost: corruptionCost > 0 ? Math.round(corruptionCost * 10) / 10 : undefined,
      },
    })

    // El cambio real (DB) ya quedó hecho acá — si el broadcast falla (Pusher
    // caído, red), que no reporte la corrida entera como error: lo único que
    // se pierde es el aviso en vivo, no la intervención.
    try {
      await pusher.trigger(SITE_PRESENCE_CHANNEL, 'entropy-entity-signal', { candidates })
    } catch (broadcastErr) {
      console.error('entropy-entity: el shift se aplicó pero el broadcast falló:', broadcastErr)
    }

    revalidatePath('/admin/overseer')

    return NextResponse.json({ status: 'shifted', delta, previousLevel, newLevel, candidates })
  } catch (err) {
    console.error('entropy-entity: error:', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
