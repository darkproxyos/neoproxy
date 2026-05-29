export type EventType = 
  | 'CPU_SPIKE' 
  | 'CPU_CALM' 
  | 'MEMORY_CRITICAL' 
  | 'OPERATOR_CONNECTED' 
  | 'PROXY_STATE_UPDATE' 
  | 'UNKNOWN';

export interface EventBusPayload {
  value?: number;
  entity?: string;
  operator?: string;
  [key: string]: any;
}

export interface EventBusSignal {
  type: EventType;
  timestamp: number;
  payload: EventBusPayload;
}

export interface ProxyState {
  cpu: {
    load: number;
    count: number;
  };
  mem: {
    total: number;
    used: number;
    free: number;
    used_pct: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    used_pct: number;
  };
  events_count: number;
}

export type EntityType = 'OPERATOR' | 'NODE' | 'AGENT' | 'ANOMALY' | 'SIGNAL';

export interface Entity {
  id: string;
  type: EntityType;
  position: { x: number; y: number; z: number };
  velocity?: { x: number; y: number; z: number };
  name: string;
  state: Record<string, any>;
  lastUpdate: number;
  owner?: 'SYSTEM' | 'PLAYER' | 'AGENT';
}

export type AgentRole = 'REPAIR' | 'SCOUT' | 'WATCHER';
export type AgentState = 'IDLE' | 'MOVING' | 'ANALYZING' | 'INTERACTING';

export interface Agent {
  id: string;
  role: AgentRole;
  state: AgentState;
  targetId?: string;
  position: { x: number; y: number; z: number };
  lastAction: string;
}
