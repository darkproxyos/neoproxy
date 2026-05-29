import { create } from 'zustand';
import { Agent } from '@/lib/types';

interface AgentStore {
  agents: Record<string, Agent>;
  setAgents: (agents: Record<string, Agent>) => void;
  updateAgent: (id: string, data: Partial<Agent>) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: {
    'R-01': {
      id: 'R-01',
      role: 'REPAIR',
      state: 'IDLE',
      position: { x: 5, y: 0, z: 5 },
      lastAction: 'BOOTING_AGENT'
    }
  },
  
  setAgents: (agents) => set({ agents }),
  
  updateAgent: (id, data) => set((s) => ({
    agents: {
      ...s.agents,
      [id]: { ...s.agents[id], ...data } as Agent
    }
  })),
}));
