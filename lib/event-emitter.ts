import { EventEmitter } from 'events'

// Global event emitter for internal communication
export const eventEmitter = new EventEmitter()

// Set max listeners to avoid warnings
eventEmitter.setMaxListeners(50)

// Wake event interface
export interface WakeEvent {
  timestamp: string
  source: string
  data?: any
}

// Emit wake event
export function emitWake(source: string, data?: any) {
  const wakeEvent: WakeEvent = {
    timestamp: new Date().toISOString(),
    source,
    data
  }
  
  eventEmitter.emit('wake', wakeEvent)
  console.log(`[EventEmitter] Wake emitted from: ${source}`)
}

// Listen for wake events
export function onWake(callback: (event: WakeEvent) => void) {
  eventEmitter.on('wake', callback)
}

// Remove wake listener
export function offWake(callback: (event: WakeEvent) => void) {
  eventEmitter.off('wake', callback)
}
