import { db } from '@/src/db'
import { memoryEvents } from '@/src/db/schema'
import { desc, eq } from 'drizzle-orm'

const mono = "'Space Mono', monospace"
const GREEN = '#39ff14'

// Sin link desde ningún menú ni página — quien llega acá ya sabía que
// buscar. No explica quién es Entropy, no lo nombra fuera del eventType
// crudo: solo el registro, como quedó, sin curar. Misma fuente de datos
// que /admin/overseer (memory_events), pero público — el admin la ve
// mezclada con el resto de su historial sin que nadie se lo explique ahí;
// esto es la misma huella, aislada, para quien ya sospecha que hay un
// patrón.
// Dinámica siempre, no ISR: página escondida, tráfico esperado ínfimo, y
// el dato cambia de forma imprevisible (una vez al día, quizás nunca) —
// más simple que acordarse de llamar revalidatePath acá desde el cron.
export const dynamic = 'force-dynamic'

type ShiftRow = { id: number; timestamp: Date; payload: unknown }

function readPayload(payload: unknown): { delta?: number; previousLevel?: number; newLevel?: number; phrase?: string } {
  return (payload && typeof payload === 'object') ? payload as Record<string, unknown> : {}
}

export default async function EntropiaLogPage() {
  let rows: ShiftRow[] = []
  try {
    rows = await db
      .select({ id: memoryEvents.id, timestamp: memoryEvents.timestamp, payload: memoryEvents.payload })
      .from(memoryEvents)
      .where(eq(memoryEvents.eventType, 'ENTROPY_ENTITY_SHIFT'))
      .orderBy(desc(memoryEvents.timestamp))
      .limit(200)
  } catch (err) {
    console.error('No se pudo leer el log de Entropy:', err)
  }

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#8fb8d6', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto', padding: '64px 24px 80px' }}>
        <div style={{ fontSize: 9, color: `${GREEN}66`, letterSpacing: 4, marginBottom: 24 }}>
          REGISTRO SIN CURAR — ENTROPY_ENTITY_SHIFT
        </div>

        {rows.length === 0 && (
          <div style={{ fontSize: 10, color: '#3a4a60', letterSpacing: 1 }}>
            SIN REGISTROS TODAVÍA.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {rows.map(r => {
            const p = readPayload(r.payload)
            const deltaSign = typeof p.delta === 'number' && p.delta >= 0 ? '+' : ''
            return (
              <div key={r.id} style={{ fontSize: 10, lineHeight: 1.9, borderLeft: `2px solid ${GREEN}33`, paddingLeft: 10 }}>
                <span style={{ color: '#4a6080' }}>{new Date(r.timestamp).toISOString()}</span>
                {' — '}
                <span style={{ color: GREEN }}>{deltaSign}{typeof p.delta === 'number' ? p.delta.toFixed(1) : '?'}</span>
                {' → '}
                <span>{typeof p.newLevel === 'number' ? p.newLevel.toFixed(1) : '?'}</span>
                {p.phrase && <span style={{ color: '#4a6080' }}> // "{p.phrase}"</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
