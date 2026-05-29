import { create } from 'zustand';
import { socket } from '@/lib/socket';
import { EventBusSignal, ProxyState } from '@/lib/types';

interface KernelStore {
  signals: EventBusSignal[];
  state: ProxyState | null;
  isConnected: boolean;
  
  // Actions
  addSignal: (signal: EventBusSignal) => void;
  updateState: (state: ProxyState) => void;
  setConnected: (status: boolean) => void;
}

export const useKernelStore = create<KernelStore>((set) => ({
  signals: [],
  state: null,
  isConnected: socket.connected,

  addSignal: (signal) => set((s) => ({ 
    signals: [signal, ...s.signals].slice(0, 50) // Keep last 50
  })),

  updateState: (state) => set({ state }),
  
  setConnected: (isConnected) => set({ isConnected }),
}));

// Vincular Socket con Zustand
socket.on('connect', () => useKernelStore.getState().setConnected(true));
socket.on('disconnect', () => useKernelStore.getState().setConnected(false));

socket.on('EVENTBUS_UPDATE', (data: any) => {
  const store = useKernelStore.getState();
  
  // Si parece una actualización de estado de ProxyD
  if (data.cpu && data.mem) {
    store.updateState(data as ProxyState);
  } else if (data.type) {
    store.addSignal(data as EventBusSignal);
  }
});
