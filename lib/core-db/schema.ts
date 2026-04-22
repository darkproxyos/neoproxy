import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const memory = sqliteTable("memory", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  priority: text("priority").notNull(), // CRITICAL | HIGH | NORMAL | LOW
  source: text("source").notNull(),     // validator | syncer | cleaner
  payload: text("payload").notNull(),   // JSON string
  processed: integer("processed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
