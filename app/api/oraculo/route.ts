import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { eq, desc, sql } from 'drizzle-orm'
import { entries, type KnowledgeEntry } from '@/components/knowledge/entries'
import { db } from '@/src/db'
import { systemState, fabricationSubmissions, fabricationVotes } from '@/src/db/schema'
import { isoWeekKey } from '@/lib/isoWeek'

export const runtime = 'nodejs'

// El oráculo no lee solo un archivo estático — si el sistema real tiene
// algo que decir (entropía actual, quién lidera la cola de fabricación
// esta semana), se lo pasamos como contexto opcional. Que Claude decida si
// vale la pena tejerlo en la lectura o ignorarlo — no lo forzamos nosotros
// con una moneda al aire; si no aporta a la pregunta, es ruido.
async function buildLiveSignal(): Promise<string | null> {
  const parts: string[] = []
  try {
    const rows = await db.select({ entropyLevel: systemState.entropyLevel }).from(systemState).where(eq(systemState.id, 'GLOBAL')).limit(1)
    if (rows[0]) parts.push(`la entropía del sistema está en ${rows[0].entropyLevel.toFixed(1)}%`)
  } catch {
    // sin conexión a la base — el oráculo sigue funcionando solo con las 3 posiciones
  }
  try {
    const [leader] = await db.select({
      label: fabricationSubmissions.label,
      mode: fabricationSubmissions.mode,
      votes: sql<number>`count(${fabricationVotes.visitorId})`,
    })
      .from(fabricationSubmissions)
      .leftJoin(fabricationVotes, eq(fabricationVotes.submissionId, fabricationSubmissions.id))
      .where(eq(fabricationSubmissions.weekOf, isoWeekKey()))
      .groupBy(fabricationSubmissions.id)
      .orderBy(desc(sql`count(${fabricationVotes.visitorId})`))
      .limit(1)
    if (leader && leader.votes > 0) {
      parts.push(`en la cola de fabricación de esta semana lidera un espécimen ${leader.mode}${leader.label ? ` llamado "${leader.label}"` : ''} con ${leader.votes} votos`)
    }
  } catch {
    // idem
  }
  return parts.length > 0 ? parts.join('; ') + '.' : null
}

const MAX_QUESTION_LEN = 300

const hits = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 4

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  const recent = (hits.get(ip) || []).filter(t => t > windowStart)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > RATE_LIMIT_MAX
}

// A diferencia de /api/dialectica (dos pensadores documentados discutiendo
// entre sí), acá las 3 entradas no tienen relación previa — las tres te
// tocaron al azar. El trabajo de la lectura no es hacer que concuerden,
// es encontrar o forzar con honestidad una conexión real entre esas tres
// ideas documentadas y la pregunta — sin inventarle a ningún autor real
// una posición que no sostuvo.
function buildOraclePrompt(a: KnowledgeEntry, b: KnowledgeEntry, c: KnowledgeEntry, question: string, liveSignal: string | null): string {
  const lines = [
    'Sos la voz de lectura de NeoProxy — no un místico, no un personaje: el sistema leyendo tres fragmentos documentados contra una pregunta.',
    'Te tocaron al azar estas tres posiciones reales, cada una tal como consta en el archivo:',
    `1. ${a.name} (${a.years}), ${a.role}: "${a.summary}"`,
    `2. ${b.name} (${b.years}), ${b.role}: "${b.summary}"`,
    `3. ${c.name} (${c.years}), ${c.role}: "${c.summary}"`,
    `La pregunta que se hizo: "${question}"`,
  ]
  if (liveSignal) {
    lines.push(
      '',
      `Esto es lo que de verdad está pasando en el sistema ahora mismo, no un dato inventado: ${liveSignal}`,
      '- Si ese estado real le aporta algo genuino a la lectura (una resonancia real con la pregunta o las tres posiciones), tejelo adentro, de forma oblicua, sin explicarlo como si fuera una métrica de panel. Si no aporta nada, ignoralo del todo — no lo menciones solo porque está disponible.',
    )
  }
  lines.push(
    '',
    'Reglas estrictas:',
    '- Conectá las tres posiciones documentadas con la pregunta — de verdad, no decorativamente. Si dos de las tres chocan entre sí, decilo en vez de forzar que encajen.',
    '- No inventes ideas que esos tres autores no sostuvieron. Citá o parafraseá solo lo que está en su posición documentada arriba.',
    '- Nombralos a los tres por su apellido en algún momento del texto, en el orden que mejor sirva a la lectura, no necesariamente 1-2-3.',
    '- Tono: una lectura, no una clase — directo, con peso, sin new age ni misticismo inventado. La autoridad viene de que las tres posiciones son reales, no de dramatismo.',
    '- Respondé en español. Entre 3 y 5 oraciones. Nunca markdown, nunca listas, nunca digas que sos un modelo de lenguaje o una IA.',
  )
  return lines.join('\n')
}

function cannedReading(a: KnowledgeEntry, b: KnowledgeEntry, c: KnowledgeEntry): string {
  return `Sin conexión a Claude para cruzar estas tres posiciones en vivo. Tal como constan en el archivo: ${a.name} — "${a.summary}" ${b.name} — "${b.summary}" ${c.name} — "${c.summary}" La lectura en vivo está apagada; la conexión entre las tres queda para que la hagas vos.`
}

export async function POST(req: NextRequest) {
  const { question, entryIds } = await req.json()

  if (!Array.isArray(entryIds) || entryIds.length !== 3 || entryIds.some(id => typeof id !== 'string')) {
    return NextResponse.json({ error: 'entryIds debe ser un array de 3 ids' }, { status: 400 })
  }
  const [a, b, c] = entryIds.map((id: string) => entries.find(e => e.id === id))
  if (!a || !b || !c) {
    return NextResponse.json({ error: 'entrada no encontrada' }, { status: 400 })
  }
  const trimmedQuestion = (typeof question === 'string' ? question.trim() : '').slice(0, MAX_QUESTION_LEN)
  if (!trimmedQuestion) {
    return NextResponse.json({ error: 'question es requerida' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ reading: cannedReading(a, b, c), fallback: true })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ reading: cannedReading(a, b, c), fallback: true })
  }

  const client = new Anthropic({ apiKey })
  try {
    const liveSignal = await buildLiveSignal()
    const response = await client.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 320,
      output_config: { effort: 'low' },
      system: buildOraclePrompt(a, b, c, trimmedQuestion, liveSignal),
      messages: [{ role: 'user', content: 'Armá la lectura.' }],
    })
    const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text')
    const reading = textBlock?.text?.trim()
    return NextResponse.json({ reading: reading || cannedReading(a, b, c), fallback: !reading })
  } catch (err) {
    console.error('oraculo: fallo la llamada a Claude', err)
    return NextResponse.json({ reading: cannedReading(a, b, c), fallback: true })
  }
}
