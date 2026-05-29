'use client';

import { SessionProvider } from 'next-auth/react';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { socket } from '@/lib/socket';
import { agentSystem } from '@/lib/systems/agents/AgentSystem';

interface SocketContextType {
  isConnected: boolean;
  lastEvent: any;
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  lastEvent: null,
});

export const useSocket = () => useContext(SocketContext);

export function Providers({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastEvent, setLastEvent] = useState<any>(null);

  useEffect(() => {
    // Iniciar Runtime de Agentes
    agentSystem.start();

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onEventBus(event: any) {
      setLastEvent(event);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('EVENTBUS_UPDATE', onEventBus); // Evento que emitiremos desde el bridge

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('EVENTBUS_UPDATE', onEventBus);
      agentSystem.stop();
    };
  }, []);

  return (
    <SessionProvider>
      <SocketContext.Provider value={{ isConnected, lastEvent }}>
        {children}
      </SocketContext.Provider>
    </SessionProvider>
  );
}
