import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const systemState = sqliteTable('system_state', {
  id: text('id').primaryKey(),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, MAINTENANCE
  coreTemperature: real('core_temperature').notNull().default(35.5),
  corruptionLevel: real('corruption_level').notNull().default(0.0),
  lastUpdate: integer('last_update', { mode: 'timestamp' })
});

export const memoryEvents = sqliteTable('memory_events', {
  id: text('id').primaryKey(),
  eventType: text('event_type').notNull(), // 'SYNC', 'CORRUPTION', 'PURGE'
  entropyLevel: real('entropy_level').notNull(),
  operator: text('operator').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' })
});
