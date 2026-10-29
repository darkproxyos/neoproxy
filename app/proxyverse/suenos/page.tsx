import Link from 'next/link'
import { db } from '@/src/db'
import { agentDiaryEntries } from '@/src/db/schema'
import { desc } from 'drizzle-orm'
import { agents, NIGHTLY_COUNCIL_AGENT_ID } from '@/components/proxyverse/agents'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'
const GOLD = '#ffb800'

// Mismo respaldo que app/proxyverse/[id]/page.tsx: sin esto, el HTML
// prerenderizado en el deploy nunca se enteraría de entradas nuevas que el
// cron (app/api/cron/agent-dreams) escribe después del deploy.
export const revalidate = 3600

type FeedEntry = { agentId: string; dateKey: string; entry: string }

export default async function SuenosPage() {
  let feed: FeedEntry[] = []
  try {
    feed = await db
      .select({ agentId: agentDiaryEntries.agentId, dateKey: agentDiaryEntries.dateKey, entry: agentDiaryEntries.entry })
      .from(agentDiaryEntries)
      .orderBy(desc(agentDiaryEntries.dateKey), agentDiaryEntries.agentId)
      .limit(120)
  } catch (err) {
    console.error('No se pudo leer el archivo de sueños:', err)
  }

  // La query ya trae todo ordenado por fecha desc — agrupar acá solo arma
  // los encabezados de fecha, no reordena nada.
  const byDate: { dateKey: string; entries: FeedEntry[] }[] = []
  for (const e of feed) {
    const last = byDate[byDate.length - 1]
    if (last && last.dateKey === e.dateKey) last.entries.push(e)
    else byDate.push({ dateKey: e.dateKey, entries: [e] })
  }

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/proxyverse" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#00d4ff88', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A PROXYVERSE
        </Link>

        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 6, color: `${CYAN}66`, marginBottom: 16 }}>
          NPX-PXV-00 // ARCHIVO COLECTIVO
        </div>
        <h1 style={{
          fontFamily: mono, fontSize: 30, letterSpacing: 6, marginBottom: 16, color: CYAN,
          textShadow: `0 0 30px ${CYAN}44`,
        }}>
          SUEÑOS
        </h1>
        <p style={{ fontFamily: mono, fontSize: 11, color: '#8fb8d6', letterSpacing: 0.5, lineHeight: 2, marginBottom: 48, maxWidth: 560 }}>
          Los seis procesos escriben su diario por separado, cada uno anclado a lo mismo que
          realmente pasó en el sistema ese día — pero acá no están separados. Es un solo flujo,
          sin dueño único, igual de real que cada bitácora individual.
        </p>

        {byDate.length === 0 && (
          <div style={{ fontFamily: mono, fontSize: 10, color: '#3a4a60', letterSpacing: 1, lineHeight: 1.8 }}>
            SIN ENTRADAS TODAVÍA — el cron diario (app/api/cron/agent-dreams) todavía no corrió,
            o esta instancia no tiene acceso a la base de datos.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {byDate.map(group => (
            <div key={group.dateKey}>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', marginBottom: 14 }}>
                {group.dateKey}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {group.entries.map((e, i) => {
                  const isCouncil = e.agentId === NIGHTLY_COUNCIL_AGENT_ID
                  const agent = agents.find(a => a.id === e.agentId)
                  const color = isCouncil ? GOLD : (agent?.color ?? '#4a6080')
                  return (
                    <div key={`${e.agentId}-${i}`} style={{ borderLeft: `2px solid ${color}44`, paddingLeft: 14 }}>
                      {isCouncil ? (
                        <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color }}>
                          CONSEJO NOCTURNO // SUEÑO COLECTIVO DE LA SEMANA
                        </span>
                      ) : (
                        <Link href={`/proxyverse/${e.agentId}`} style={{
                          fontFamily: mono, fontSize: 9, letterSpacing: 2, color, textDecoration: 'none',
                        }}>
                          {agent?.name ?? e.agentId.toUpperCase()}
                        </Link>
                      )}
                      <div style={{
                        fontFamily: mono, fontSize: 12, fontStyle: 'italic', color: '#c8daf0', lineHeight: 1.8, marginTop: 4,
                        ...(isCouncil ? { fontSize: 13 } : {}),
                      }}>
                        "{e.entry}"
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
