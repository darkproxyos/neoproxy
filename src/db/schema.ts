import { sqliteTable, text, integer, real, primaryKey } from "drizzle-orm/sqlite-core";

export const systemState = sqliteTable("system_state", {
  id: text("id").primaryKey().default("GLOBAL"),
  totalCoherence: real("total_coherence").notNull().default(100.0),
  totalCorruption: real("total_corruption").notNull().default(0.0),
  totalNodesAbsorbed: integer("total_nodes_absorbed").notNull().default(0),
  entropyLevel: real("entropy_level").notNull().default(0.0),
  lastUpdated: integer("last_updated", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const memoryEvents = sqliteTable("memory_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timestamp: integer("timestamp", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  eventType: text("event_type").notNull(),
  payload: text("payload", { mode: "json" }).notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("operator"),
  createdAt: integer("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: integer("expires_at").notNull(),
});

// SIGNAL Economy
export const signalTransactions = sqliteTable('signal_transactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(), // PURCHASE, HEARTBEAT, REFERRAL, CODEX, etc
  referenceId: text('reference_id'),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
})

// Cola de fabricación: especímenes generados en /lab/proxygenesis que un
// visitante decide mandar a la cola (no se persiste la malla — igual que
// la galería local, con los parámetros alcanza para regenerarla). La
// comunidad vota, DarkProxy decide manualmente cuál se fabrica de verdad
// (declareFabricationWinner en app/admin/actions.ts) — el voto es insumo,
// no un gatillo automático sobre algo que cuesta plata y tiempo real.
export const fabricationSubmissions = sqliteTable('fabrication_submissions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  source: text('source').notNull(), // 'proxygenesis', a futuro otros origenes
  mode: text('mode').notNull(), // 'coral' | 'arbol' | 'concha'
  label: text('label'),
  params: text('params', { mode: 'json' }).notNull().$type<Record<string, number | string>>(),
  thumbnail: text('thumbnail').notNull(), // dataURL jpeg chico, mismo formato que la galería local
  weekOf: text('week_of').notNull(), // bucket ISO semana, ej "2026-W44"
  status: text('status').notNull().default('voting'), // voting | winner | fabricated
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const fabricationVotes = sqliteTable('fabrication_votes', {
  submissionId: text('submission_id').notNull().references(() => fabricationSubmissions.id),
  visitorId: text('visitor_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (t) => [primaryKey({ columns: [t.submissionId, t.visitorId] })])

// Sueños de agente: un cron diario (ver app/api/cron/agent-dreams/route.ts)
// le pide a cada agente con stub de kernel (metatron, d, snake, genos,
// trickster, prototype — no darkproxy, que no tiene entrada de kernel
// porque es el root/jugador) un fragmento de diario basado en actividad
// real del sitio (entropía, eventos de memoria, cola de fabricación), no
// inventada. Clave única (agentId, dateKey): el cron es idempotente, correr
// dos veces el mismo día no duplica.
export const agentDiaryEntries = sqliteTable('agent_diary_entries', {
  agentId: text('agent_id').notNull(),
  dateKey: text('date_key').notNull(), // 'YYYY-MM-DD'
  entry: text('entry').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (t) => [primaryKey({ columns: [t.agentId, t.dateKey] })])
