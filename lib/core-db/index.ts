import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { memory, events } from './schema';
import { eq } from 'drizzle-orm';

// `next build` importa este modulo para inspeccionar las rutas API aunque
// nunca las ejecute (son force-dynamic). Sin credenciales reales el build
// falla al construir el cliente. Solo durante la fase de build, y solo si
// faltan las credenciales, se usa un archivo local de relleno que nunca se
// consulta de verdad. En runtime, si faltan las credenciales, se sigue
// fallando igual que antes.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
const missingCreds = !process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN;

const client = createClient(
  isBuildPhase && missingCreds
    ? { url: 'file:build-placeholder.db' }
    : {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      }
);

export const db = drizzle(client);

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
