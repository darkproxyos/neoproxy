import { memory, events } from './schema';
import { eq } from 'drizzle-orm';

// Mock DB for Vercel build to avoid GLIBC issues with better-sqlite3
let db: any = null;

if (typeof window === 'undefined' && process.env.VERCEL) {
  console.log("⚠️ VERCEL environment detected. Mocking SQLite DB.");
  db = {
    select: () => ({ from: () => ({ where: () => ({ get: () => null, all: () => [] }), orderBy: () => [] }) }),
    insert: () => ({ values: () => ({ returning: () => [null] }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => [null] }) }) }),
    delete: () => ({ where: () => ({ returning: () => [null] }) }),
  };
} else {
  try {
    const Database = require('better-sqlite3');
    const { drizzle } = require('drizzle-orm/better-sqlite3');
    const sqlite = new Database('./neoproxy.db');
    db = drizzle(sqlite);
  } catch (e) {
    console.error("Failed to load better-sqlite3:", e);
    // Fallback mock
    db = {}; 
  }
}

export { db };

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
