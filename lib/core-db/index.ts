import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { memory, events } from './schema';
import { eq } from 'drizzle-orm';

// Initialize SQLite database
const sqlite = new Database('./sqlite.db');
export const db = drizzle(sqlite);

// Export schema for use in other modules
export { memory, events };

// Memory operations
export async function createMemory(title: string, content: string) {
  const result = await db.insert(memory).values({
    title,
    content,
    createdAt: new Date(),
  }).returning();
  
  return result[0];
}

export async function getMemories() {
  return await db.select().from(memory).orderBy(memory.createdAt);
}

export async function getMemoryById(id: number) {
  const memories = await db.select().from(memory).where(eq(memory.id, id));
  return memories[0] || null;
}

export async function updateMemory(id: number, title: string, content: string) {
  const result = await db
    .update(memory)
    .set({ title, content })
    .where(eq(memory.id, id))
    .returning();
  
  return result[0] || null;
}

export async function deleteMemory(id: number) {
  const result = await db.delete(memory).where(eq(memory.id, id)).returning();
  return result[0] || null;
}

// Event Bus operations
export async function insertEvent(type: string, priority: string, source: string, payload: any) {
  const result = await db.insert(events).values({
    type,
    priority,
    source,
    payload: JSON.stringify(payload),
    createdAt: new Date(),
  }).returning();
  
  return result[0];
}

export async function getUnprocessedEvents() {
  return await db
    .select()
    .from(events)
    .where(eq(events.processed, false))
    .orderBy(events.createdAt);
}

export async function markProcessed(id: number) {
  const result = await db
    .update(events)
    .set({ processed: true })
    .where(eq(events.id, id))
    .returning();
  
  return result[0] || null;
}
