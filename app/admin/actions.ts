'use server'

import { auth } from "@/auth";
import { db } from "@/src/db";
import { systemState, memoryEvents } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// El gate de /admin/overseer/page.tsx es puramente client-side (una password
// hardcodeada) y no protege nada por si solo — cualquier sesion autenticada,
// no solo role: 'root', podia llegar a estas Server Actions. Este chequeo es
// la proteccion real.
async function requireRoot() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'root') {
    return { authorized: false as const, error: 'UNAUTHORIZED' };
  }
  return { authorized: true as const };
}

export async function purgeEntropy() {
  const gate = await requireRoot();
  if (!gate.authorized) return { success: false, error: gate.error };
  try {
    await db.update(systemState)
      .set({ 
        totalCorruption: 0, 
        entropyLevel: 0,
        lastUpdated: new Date() 
      })
      .where(eq(systemState.id, "GLOBAL"));
      
    await db.insert(memoryEvents).values({
      eventType: "ADMIN_PURGE",
      payload: { message: "Entropy purged by Overseer" }
    });

    revalidatePath("/admin/overseer");
    return { success: true, message: "Entropía purgada." };
  } catch (error) {
    console.error("Error purging entropy:", error);
    return { success: false, error: "Database connection failed" };
  }
}

export async function injectCorruption(amount: number = 10) {
  const gate = await requireRoot();
  if (!gate.authorized) return { success: false, error: gate.error };
  try {
    const results = await db.select().from(systemState).where(eq(systemState.id, "GLOBAL"));
    const state = results[0];
    if (!state) return { success: false, error: "System state not found" };

    const newCorruption = state.totalCorruption + amount;
    const newEntropy = Math.min(100, (newCorruption / (state.totalCoherence + 1)) * 50 + (state.totalNodesAbsorbed / 1000) * 10);

    await db.update(systemState)
      .set({ 
        totalCorruption: newCorruption,
        entropyLevel: newEntropy,
        lastUpdated: new Date() 
      })
      .where(eq(systemState.id, "GLOBAL"));

    await db.insert(memoryEvents).values({
      eventType: "ADMIN_INJECT",
      payload: { amount, newCorruption, newEntropy }
    });

    revalidatePath("/admin/overseer");
    return { success: true, message: `Corrupción inyectada: +${amount}` };
  } catch (error) {
    console.error("Error injecting corruption:", error);
    return { success: false, error: "Database connection failed" };
  }
}

export async function getSystemState() {
  const gate = await requireRoot();
  if (!gate.authorized) return null;
  try {
    const results = await db.select().from(systemState).where(eq(systemState.id, "GLOBAL"));
    return results[0] || null;
  } catch (error) {
    console.error("Error fetching state:", error);
    return null;
  }
}

export async function getSystemHistory() {
  const gate = await requireRoot();
  if (!gate.authorized) return [];
  try {
    const events = await db.select()
      .from(memoryEvents)
      .orderBy(desc(memoryEvents.timestamp))
      .limit(50);
      
    return events.map(e => ({
      ...e,
      timestamp: e.timestamp.toISOString()
    }));
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
}
