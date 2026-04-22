'use server'

import { db } from "@/db";
import { systemState, memoryEvents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function purgeEntropy() {
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
  try {
    const state = await db.select().from(systemState).where(eq(systemState.id, "GLOBAL")).get();
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
  try {
    const state = await db.select().from(systemState).where(eq(systemState.id, "GLOBAL")).get();
    return state;
  } catch (error) {
    console.error("Error fetching state:", error);
    return null;
  }
}

export async function getSystemHistory() {
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
