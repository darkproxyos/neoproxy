import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core'

export const systemState = sqliteTable('system_state', {
  id: text('id').primaryKey().default('GLOBAL'),
  totalCoherence: real('total_coherence').notNull().default(100),
  totalCorruption: real('total_corruption').notNull().default(0),
  totalNodesAbsorbed: integer('total_nodes_absorbed').notNull().default(0),
  entropyLevel: real('entropy_level').notNull().default(0),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const memoryEvents = sqliteTable('memory_events', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  timestamp: integer('timestamp', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  eventType: text('event_type', {
    enum: ['NODE_ABSORBED', 'DISSOLUTION', 'ADMIN_PURGE', 'HANDSHAKE'],
  }).notNull(),
  operatorId: text('operator_id'),
  payload: text('payload', { mode: 'json' }).$type<Record<string, unknown>>(),
})

export const nodes = sqliteTable('nodes', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['NP-RESIN', 'NP-WEB', 'NP-WIRED', 'DIGITAL'] }).notNull(),
  accessLevel: text('access_level', { enum: ['FREE', 'VIP', 'ADMIN'] }).notNull().default('FREE'),
  activations: integer('activations').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
})

export const operators = sqliteTable('operators', {
  id: text('id').primaryKey(),
  handle: text('handle'),
  coherence: real('coherence').notNull().default(100),
  corruption: real('corruption').notNull().default(0),
  nodesAbsorbed: integer('nodes_absorbed').notNull().default(0),
  dissolved: integer('dissolved', { mode: 'boolean' }).notNull().default(false),
  firstSeen: integer('first_seen', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  lastSeen: integer('last_seen', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const forgeObjects = sqliteTable('forge_objects', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  operatorId: text('operator_id').references(() => operators.id),
  stlPath: text('stl_path'),
  entropySnapshot: real('entropy_snapshot').notNull().default(0),
  status: text('status', { enum: ['PENDING', 'GENERATING', 'READY', 'SHIPPED'] }).notNull().default('PENDING'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export type SystemState = typeof systemState.$inferSelect
export type MemoryEvent = typeof memoryEvents.$inferSelect
export type Node = typeof nodes.$inferSelect
export type Operator = typeof operators.$inferSelect
export type ForgeObject = typeof forgeObjects.$inferSelect
