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
import { systemState, memoryEvents, fabricationSubmissions, darkproxyTasks } from "@/src/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
