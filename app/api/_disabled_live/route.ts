import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { NextRequest } from 'next/server'
import { onWake, offWake, WakeEvent } from '@/lib/event-emitter'

// Event Bus interface
interface EventBusEvent {
  id: number
  type: string
  timestamp: string
  payload: any
}

// SSE Event interface
interface LiveEvent {
  type: 'log' | 'status' | 'error' | 'batch'
  timestamp: string
  data: any
  events?: EventBusEvent[]
}

// Connection state
let activeConnections = 0
const connectionLastEventIds = new Map<ReadableStreamDefaultController<Uint8Array>, number>()

// SQLite Event Bus connection
let eventBus: any = null

async function getEventBus() {
  if (!eventBus) {
    const dbPath = process.env.EVENT_DB_PATH || './events.db'
    eventBus = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })
  }
  return eventBus
}

// Poll Event Bus instead of API endpoints
function pollEventBus(controller: ReadableStreamDefaultController<Uint8Array>): () => void {
  const pollInterval = setInterval(async () => {
    try {
      const db = await getEventBus()
      const lastEventId = connectionLastEventIds.get(controller) || 0
      
      // Get new events from Event Bus
      const events = await db.get(
        `SELECT * FROM events WHERE id > ? ORDER BY id ASC LIMIT 50`,
        [lastEventId]
      )
      
      if (events && events.length > 0) {
        // Batch events for efficiency
        if (events.length === 1) {
          // Single event - send directly
          const event = events[0]
          const liveEvent: LiveEvent = {
            type: event.type as any,
            timestamp: event.timestamp,
            data: event.payload
          }
          
          const eventData = `event: message\ndata: ${JSON.stringify(liveEvent)}\n\n`
          controller.enqueue(new TextEncoder().encode(eventData))
        } else {
          // Multiple events - send as batch
          const batchEvent: LiveEvent = {
            type: 'batch',
            timestamp: new Date().toISOString(),
            data: {
              count: events.length,
              batch: true
            },
            events: events
          }
          
          const eventData = `event: message\ndata: ${JSON.stringify(batchEvent)}\n\n`
          controller.enqueue(new TextEncoder().encode(eventData))
        }
        
        // Update last event ID for this connection
        const lastId = Math.max(...events.map((e: any) => e.id))
        connectionLastEventIds.set(controller, lastId)
      }

    } catch (error) {
      console.error('[SSE] Event Bus polling error:', error)
      
      // Send error event
      const errorEvent: LiveEvent = {
        type: 'error',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Failed to poll Event Bus',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
      
      const eventData = `event: message\ndata: ${JSON.stringify(errorEvent)}\n\n`
      controller.enqueue(new TextEncoder().encode(eventData))
    }
  }, 500) // Poll every 500ms for better responsiveness

  // Wake handler for immediate event processing
  const wakeHandler = async (wakeEvent: WakeEvent) => {
    try {
      const db = await getEventBus()
      const lastEventId = connectionLastEventIds.get(controller) || 0
      
      // Get new events immediately after wake
      const events = await db.get(
        `SELECT * FROM events WHERE id > ? ORDER BY id ASC LIMIT 50`,
        [lastEventId]
      )
      
      if (events && events.length > 0) {
        // Send events immediately (real-time response)
        if (events.length === 1) {
          const event = events[0]
          const liveEvent: LiveEvent = {
            type: event.type as any,
            timestamp: event.timestamp,
            data: event.payload
          }
          
          const eventData = `event: message\ndata: ${JSON.stringify(liveEvent)}\n\n`
          controller.enqueue(new TextEncoder().encode(eventData))
        } else {
          const batchEvent: LiveEvent = {
            type: 'batch',
            timestamp: new Date().toISOString(),
            data: {
              count: events.length,
              batch: true,
              triggered: 'wake'
            },
            events: events
          }
          
          const eventData = `event: message\ndata: ${JSON.stringify(batchEvent)}\n\n`
          controller.enqueue(new TextEncoder().encode(eventData))
        }
        
        // Update last event ID
        const lastId = Math.max(...events.map((e: any) => e.id))
        connectionLastEventIds.set(controller, lastId)
      }
    } catch (error) {
      console.error('[SSE] Wake handler error:', error)
    }
  }

  // Listen for wake events
  onWake(wakeHandler)

  // Cleanup on connection close
  return () => {
    clearInterval(pollInterval)
    offWake(wakeHandler) // CRITICAL: Remove wake listener to prevent memory leaks
    connectionLastEventIds.delete(controller)
    activeConnections--
    console.log(`[SSE] Connection closed. Active connections: ${activeConnections}`)
  }
}

export async function GET(request: NextRequest) {
  // Get Last-Event-ID header for reconnection support
  const lastEventId = parseInt(request.headers.get('Last-Event-ID') || '0')
  
  const stream = new ReadableStream({
    start(controller) {
      activeConnections++
      console.log(`[SSE] New connection. Active connections: ${activeConnections}`)
      
      // Set initial last event ID for this connection
      connectionLastEventIds.set(controller, lastEventId)
      
      // Send initial connection event
      const connectEvent: LiveEvent = {
        type: 'status',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Connected to NeoProxy Event Bus',
          connections: activeConnections,
          lastEventId
        }
      }
      
      const connectData = `event: message\ndata: ${JSON.stringify(connectEvent)}\n\n`
      controller.enqueue(new TextEncoder().encode(connectData))
      
      // Start polling Event Bus
      const cleanup = pollEventBus(controller)
      
      // Handle connection close
      request.signal.addEventListener('abort', () => {
        cleanup()
        controller.close()
      })
    },
    
    cancel() {
      activeConnections--
      console.log(`[SSE] Stream cancelled. Active connections: ${activeConnections}`)
    }
  })

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control, Last-Event-ID',
    },
  })
}
