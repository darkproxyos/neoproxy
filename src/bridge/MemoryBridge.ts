import { CoherenceSystem } from "@/systems/CoherenceSystem";

type MemoryEvent = { type: string; [key: string]: any };

export class MemoryBridge {
  private eventQueue: MemoryEvent[] = [];
  private syncInterval = 10000;
  private timer: NodeJS.Timeout | null = null;
  private coherenceSystem: CoherenceSystem;

  constructor(coherenceSystem: CoherenceSystem) {
    this.coherenceSystem = coherenceSystem;
    this.startSync();
  }

  public pushEvent(event: MemoryEvent) {
    this.eventQueue.push({
      ...event,
      timestamp: Date.now(),
      globalCoherence: this.coherenceSystem.getCoherence(),
    });
  }

  private startSync() {
    this.timer = setInterval(() => this.sync(), this.syncInterval);
  }

  private async sync() {
    if (this.eventQueue.length === 0) return;
    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch("/api/memory/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: eventsToSend }),
      });
      if (!response.ok) throw new Error("Sync failed");
      const data = await response.json();
      console.log("[MemoryBridge] State:", data.state);
    } catch (error) {
      console.error("[MemoryBridge] Error:", error);
      this.eventQueue.unshift(...eventsToSend);
    }
  }

  public dispose() {
    if (this.timer) clearInterval(this.timer);
    this.sync();
  }
}
