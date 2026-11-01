import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db'
import { memoryEvents } from '@/src/db/schema'
import { agents } from '@/components/proxyverse/agents'

const VALID_IDS = new Set(agents.map(a => a.id))

// Topología de mundo pequeño: cada vez que un visitante le habla a un
// SEGUNDO agente real en la misma sesión (AgentChannel.tsx), queda un
// evento real de que esos dos "aparecieron juntos" — agregado y anónimo,
// sin guardar quién fue. /proxyverse/topologia lee todos estos eventos y
// arma el grafo real de qué procesos se visitan juntos más seguido.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { a, b } = body ?? {}
    if (typeof a !== 'string' || typeof b !== 'string' || !VALID_IDS.has(a) || !VALID_IDS.has(b) || a === b) {
      return NextResponse.json({ error: 'par inválido' }, { status: 400 })
    }
    const pair = [a, b].sort()

    await db.insert(memoryEvents).values({
      eventType: 'AGENT_PAIR_SEEN',
      payload: { a: pair[0], b: pair[1] },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error en agent-pair-seen:', error)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
