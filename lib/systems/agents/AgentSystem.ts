import { useAgentStore } from '@/store/useAgentStore';
import { useEntityStore } from '@/store/useEntityStore';
import { Agent, Entity } from '@/lib/types';

export class AgentSystem {
  private interval: NodeJS.Timeout | null = null;
  private tickRate: number = 100; // 10Hz

  constructor() {}

  public start() {
    if (this.interval) return;
    console.log("🤖 Agent Runtime STARTED (10Hz)");
    this.interval = setInterval(() => this.tick(), this.tickRate);
  }

  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private tick() {
    const agents = useAgentStore.getState().agents;
    const entities = useEntityStore.getState().entities;

    Object.values(agents).forEach(agent => {
      this.processAgent(agent, entities);
    });
  }

  private processAgent(agent: Agent, entities: Record<string, Entity>) {
    const store = useAgentStore.getState();

    switch (agent.role) {
      case 'REPAIR':
        this.processRepairAgent(agent, entities, store);
        break;
      // Otros roles aquí...
    }
    
    // Sync Agent as Entity for visualization
    this.syncAgentToEntity(agent);
  }

  private processRepairAgent(agent: Agent, entities: Record<string, Entity>, store: any) {
    // 1. Perception: Buscar anomalías
    const anomalies = Object.values(entities).filter(e => e.type === 'ANOMALY');
    
    if (anomalies.length > 0 && agent.state !== 'INTERACTING') {
      const target = anomalies[0]; // Simple targeting
      const dist = this.getDistance(agent.position, target.position);

      if (dist < 1.0) {
        // En rango para reparar
        store.updateAgent(agent.id, { 
            state: 'INTERACTING', 
            targetId: target.id, 
            lastAction: `REPAIRING_${target.id}` 
        });
        
        // Simular reparación (remover anomalía)
        setTimeout(() => {
            useEntityStore.getState().removeEntity(target.id);
            store.updateAgent(agent.id, { state: 'IDLE', targetId: undefined, lastAction: 'SUCCESSFUL_REPAIR' });
        }, 1500);

      } else {
        // Moverse hacia el objetivo
        const newPos = this.moveTowards(agent.position, target.position, 0.5);
        store.updateAgent(agent.id, { 
            position: newPos, 
            state: 'MOVING', 
            targetId: target.id,
            lastAction: `NAVIGATING_TO_${target.id}`
        });
      }
    } else if (anomalies.length === 0 && agent.state !== 'IDLE') {
        store.updateAgent(agent.id, { state: 'IDLE', targetId: undefined, lastAction: 'SCANNING_CLEAN_SYSTEM' });
    }
  }

  private syncAgentToEntity(agent: Agent) {
    // Convertir el estado del agente en una entidad visual para Stardust
    useEntityStore.getState().updateEntity(`agent_${agent.id}`, {
        id: `agent_${agent.id}`,
        type: 'AGENT',
        name: `Unit ${agent.id}`,
        position: agent.position,
        state: { role: agent.role, agentState: agent.state },
        owner: 'AGENT',
        lastUpdate: Date.now()
    });
  }

  private getDistance(p1: any, p2: any) {
    return Math.sqrt(
      Math.pow(p1.x - p2.x, 2) + 
      Math.pow(p1.y - p2.y, 2) + 
      Math.pow(p1.z - p2.z, 2)
    );
  }

  private moveTowards(current: any, target: any, speed: number) {
    const dir = {
      x: target.x - current.x,
      y: target.y - current.y,
      z: target.z - current.z
    };
    const mag = Math.sqrt(dir.x**2 + dir.y**2 + dir.z**2);
    if (mag === 0) return current;
    
    return {
      x: current.x + (dir.x / mag) * speed,
      y: current.y + (dir.y / mag) * speed,
      z: current.z + (dir.z / mag) * speed
    };
  }
}

// Singleton instance
export const agentSystem = new AgentSystem();
