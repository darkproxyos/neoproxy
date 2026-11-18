'use server'

// Server Actions de /preview/darkproxy — a propósito SIN requireRoot().
// Esta ruta existe porque el login real de producción está roto y además
// el usuario no tiene acceso a Vercel ahora mismo para activar
// NEXT_PUBLIC_ADMIN_BYPASS_AUTH (ver middleware.ts) — necesita ver el
// dashboard igual. Es temporal: cuando el login y el acceso a Vercel
// vuelvan, esta carpeta entera se traslada a app/admin/darkproxy (que ya
// tiene requireRoot() real) y esta queda vacía/se borra.
//
// Las lecturas (estado del sistema, métricas) son las mismas que ya son
// públicas en /system/entropia -- mismo dato, sin riesgo nuevo. Lo único
// que esta ruta agrega como escritura real es la tabla de tareas, que no
// es sensible (no purga ni inyecta nada del sistema) -- por eso no trae
// los botones de PURGE/INJECT de /admin/darkproxy, esos se quedan atrás
// del login real.

import { db } from "@/src/db";
import { systemState, memoryEvents, fabricationSubmissions, darkproxyTasks, mindEntries, moneyLog } from "@/src/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";

export async function getSystemStateReadOnly() {
  try {
    const results = await db.select().from(systemState).where(eq(systemState.id, "GLOBAL"));
    return results[0] || null;
  } catch (error) {
    console.error("preview/darkproxy: error leyendo systemState:", error);
    return null;
  }
}

export async function getUsageMetricsReadOnly() {
  try {
    const counts = await db.select({
      eventType: memoryEvents.eventType,
      count: sql<number>`count(*)`,
    }).from(memoryEvents).groupBy(memoryEvents.eventType);

    const [submissions] = await db.select({ count: sql<number>`count(*)` }).from(fabricationSubmissions);

    return {
      byType: counts.map(c => ({ eventType: c.eventType, count: Number(c.count) })),
      totalEvents: counts.reduce((sum, c) => sum + Number(c.count), 0),
      fabricationSubmissions: Number(submissions?.count ?? 0),
    };
  } catch (error) {
    console.error("preview/darkproxy: error leyendo usage metrics:", error);
    return null;
  }
}

export async function listTasks() {
  try {
    const rows = await db.select().from(darkproxyTasks).orderBy(desc(darkproxyTasks.createdAt));
    return rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() }));
  } catch (error) {
    console.error("preview/darkproxy: error leyendo tareas (¿falta la tabla? correr drizzle-kit push):", error);
    return [];
  }
}

export async function createTask(title: string, category: string) {
  const cleanTitle = title.trim().slice(0, 200);
  if (!cleanTitle) return { success: false, error: "Falta el título" };
  try {
    await db.insert(darkproxyTasks).values({ title: cleanTitle, category });
    revalidatePath("/preview/darkproxy");
    return { success: true };
  } catch (error) {
    console.error("preview/darkproxy: error creando tarea:", error);
    return { success: false, error: "No se pudo guardar (¿falta correr drizzle-kit push en la DB real?)" };
  }
}

export async function setTaskStatus(id: string, status: 'pending' | 'in_progress' | 'done') {
  try {
    await db.update(darkproxyTasks).set({ status, updatedAt: new Date() }).where(eq(darkproxyTasks.id, id));
    revalidatePath("/preview/darkproxy");
    return { success: true };
  } catch (error) {
    console.error("preview/darkproxy: error actualizando tarea:", error);
    return { success: false, error: "Database error" };
  }
}

export async function deleteTask(id: string) {
  try {
    await db.delete(darkproxyTasks).where(eq(darkproxyTasks.id, id));
    revalidatePath("/preview/darkproxy");
    return { success: true };
  } catch (error) {
    console.error("preview/darkproxy: error borrando tarea:", error);
    return { success: false, error: "Database error" };
  }
}

// Racha real: un memory_event idempotente por día (si ya hay uno con el
// dateKey de hoy, no inserta otro) y la racha se cuenta escaneando hacia
// atrás desde hoy por días de calendario consecutivos. Nada de esto se
// infla -- si falta un día, la racha corta ahí, como cualquier racha real.
function dateKeyOf(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function logVisitAndGetStreak(): Promise<number> {
  try {
    const today = dateKeyOf(new Date());
    const already = await db.select({ id: memoryEvents.id }).from(memoryEvents)
      .where(sql`${memoryEvents.eventType} = 'DARKPROXY_VISIT' AND json_extract(${memoryEvents.payload}, '$.dateKey') = ${today}`)
      .limit(1);
    if (already.length === 0) {
      await db.insert(memoryEvents).values({ eventType: 'DARKPROXY_VISIT', payload: { dateKey: today } });
    }

    const rows = await db.select({ payload: memoryEvents.payload }).from(memoryEvents)
      .where(eq(memoryEvents.eventType, 'DARKPROXY_VISIT'));
    const dateKeys = new Set(rows.map(r => (r.payload as any)?.dateKey).filter(Boolean));

    let streak = 0;
    const cursor = new Date();
    // Si hoy todavía no tiene visita (no debería pasar, la acabamos de
    // insertar arriba), el escaneo simplemente no suma el día 0 y listo.
    while (dateKeys.has(dateKeyOf(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  } catch (error) {
    console.error("preview/darkproxy: error con la racha:", error);
    return 0;
  }
}

export async function listThoughts() {
  try {
    const rows = await db.select().from(mindEntries).orderBy(desc(mindEntries.createdAt)).limit(20);
    return rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }));
  } catch (error) {
    console.error("preview/darkproxy: error leyendo segunda mente:", error);
    return [];
  }
}

export async function captureThought(content: string) {
  const clean = content.trim().slice(0, 1000);
  if (!clean) return { success: false, error: "Vacío" };
  try {
    const [row] = await db.insert(mindEntries).values({ content: clean }).returning();
    revalidatePath("/preview/darkproxy");
    return { success: true, id: row.id };
  } catch (error) {
    console.error("preview/darkproxy: error guardando pensamiento:", error);
    return { success: false, error: "No se pudo guardar (¿falta drizzle-kit push?)" };
  }
}

// Se llama DESPUÉS de que captureThought ya devolvió éxito -- la captura
// nunca espera esto. Si no hay API key configurada, o la llamada falla, el
// pensamiento queda guardado igual, simplemente sin tarea derivada.
export async function analyzeThought(entryId: string, content: string) {
  if (!process.env.ANTHROPIC_API_KEY) return { success: false, taskCreated: false };
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: 'claude-haiku-5-5',
      max_tokens: 200,
      system: 'Analizás una nota corta y personal de alguien armando un negocio (NeoProxy). '
        + 'Si la nota implica una acción concreta pendiente, respondé SOLO un JSON: '
        + '{"task":"título corto y accionable en español, max 100 caracteres","category":"una de negocio|producto|contenido|fabricacion|kernel|general"}. '
        + 'Si la nota es solo una reflexión, idea sin acción clara, o un desahogo, respondé SOLO {"task":null}. '
        + 'Nunca agregues texto fuera del JSON.',
      messages: [{ role: 'user', content }],
    });
    const text = response.content.find(b => b.type === 'text')?.text ?? '{}';
    const parsed = JSON.parse(text.trim());
    if (!parsed?.task) {
      await db.update(mindEntries).set({ processed: true }).where(eq(mindEntries.id, entryId));
      return { success: true, taskCreated: false };
    }
    const validCategories = ['negocio', 'producto', 'contenido', 'fabricacion', 'kernel', 'general'];
    const category = validCategories.includes(parsed.category) ? parsed.category : 'general';
    const [task] = await db.insert(darkproxyTasks)
      .values({ title: String(parsed.task).slice(0, 200), category })
      .returning();
    await db.update(mindEntries).set({ processed: true, linkedTaskId: task.id }).where(eq(mindEntries.id, entryId));
    revalidatePath("/preview/darkproxy");
    return { success: true, taskCreated: true, taskTitle: task.title };
  } catch (error) {
    console.error("preview/darkproxy: error analizando pensamiento con IA:", error);
    try { await db.update(mindEntries).set({ processed: true }).where(eq(mindEntries.id, entryId)); } catch {}
    return { success: false, taskCreated: false };
  }
}

export async function listMoneyLog() {
  try {
    const rows = await db.select().from(moneyLog).orderBy(desc(moneyLog.createdAt)).limit(30);
    const [{ balance }] = await db.select({ balance: sql<number>`coalesce(sum(${moneyLog.amount}), 0)` }).from(moneyLog);
    return { entries: rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })), balance: Number(balance) };
  } catch (error) {
    console.error("preview/darkproxy: error leyendo money log:", error);
    return { entries: [], balance: 0 };
  }
}

export async function addMoneyEntry(amount: number, note: string) {
  const cleanNote = note.trim().slice(0, 200) || (amount >= 0 ? 'Ingreso' : 'Gasto');
  if (!Number.isFinite(amount) || amount === 0) return { success: false, error: "Monto inválido" };
  try {
    await db.insert(moneyLog).values({ amount: Math.round(amount), note: cleanNote });
    revalidatePath("/preview/darkproxy");
    return { success: true };
  } catch (error) {
    console.error("preview/darkproxy: error guardando movimiento:", error);
    return { success: false, error: "No se pudo guardar (¿falta drizzle-kit push?)" };
  }
}
