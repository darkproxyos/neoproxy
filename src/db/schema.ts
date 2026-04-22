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
