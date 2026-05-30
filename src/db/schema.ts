import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

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
