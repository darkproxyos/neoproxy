import { create } from 'zustand';
import { socket } from '@/lib/socket';
import { Entity, EntityType } from '@/lib/types';

interface EntityStore {
  entities: Record<string, Entity>;
  setEntities: (entities: Record<string, Entity>) => void;
  updateEntity: (id: string, data: Partial<Entity>) => void;
  removeEntity: (id: string) => void;
}

export const useEntityStore = create<EntityStore>((set) => ({
  entities: {},
  
  setEntities: (entities) => set({ entities }),
  
  updateEntity: (id, data) => set((s) => ({
    entities: {
      ...s.entities,
      [id]: { ...s.entities[id], ...data } as Entity
    }
  })),

  removeEntity: (id) => set((s) => {
    const newEntities = { ...s.entities };
    delete newEntities[id];
    return { entities: newEntities };
  }),
}));

// Escuchar sincronización de jugadores (Multiplayer)
socket.on('state', (players: any) => {
  const store = useEntityStore.getState();
  const newEntities: Record<string, Entity> = { ...store.entities };
  
  // Mapear jugadores a entidades tipo OPERATOR
  Object.keys(players).forEach(id => {
    const p = players[id];
    newEntities[id] = {
      id: p.id,
      type: 'OPERATOR',
      position: p.position,
      velocity: p.velocity,
      name: p.name,
      state: { avatarIdx: p.avatarIdx },
      lastUpdate: Date.now()
    };
  });
  
  // Limpiar desconectados (opcional, dependiendo de si queremos persistencia)
  // Por ahora lo hacemos 1:1 con el estado del socket
  Object.keys(newEntities).forEach(id => {
    if (!players[id] && newEntities[id].type === 'OPERATOR') {
      delete newEntities[id];
    }
  });

  store.setEntities(newEntities);
});

// Escuchar señales del EventBus para crear anomalías o nodos
socket.on('EVENTBUS_UPDATE', (data: any) => {
  if (data.type === 'CPU_SPIKE') {
    const id = `anomaly_${data.timestamp}`;
    useEntityStore.getState().updateEntity(id, {
      id,
      type: 'ANOMALY',
      name: 'System Tension',
      position: { 
        x: (Math.random() - 0.5) * 40, 
        y: (Math.random() - 0.5) * 40, 
        z: (Math.random() - 0.5) * 40 
      },
      state: { severity: data.payload.value },
      lastUpdate: Date.now()
    });
    
    // Auto-remover anomalías después de 10s
    setTimeout(() => useEntityStore.getState().removeEntity(id), 10000);
  }
});
