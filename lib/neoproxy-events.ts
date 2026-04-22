// Simple Event Bus dispatcher for browser
class NeoProxyEventBus {
  private eventSource: EventSource | null = null
  private listeners: Map<string, Function[]> = new Map()

  connect(url: string = '/api/live') {
    if (this.eventSource) {
      this.disconnect()
    }

    this.eventSource = new EventSource(url)
    
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // Dispatch to custom listeners
        this.dispatch(data.type, data)
        
        // Also dispatch to global window events
        window.dispatchEvent(new CustomEvent("neoproxy:event", { 
          detail: data 
        }))
        
        console.log('[NeoProxy Event]', data)
      } catch (error) {
        console.error('[NeoProxy] Event parse error:', error)
      }
    }

    this.eventSource.onopen = () => {
      console.log('[NeoProxy] Event Bus connected')
      this.dispatch('connection', { connected: true })
    }

    this.eventSource.onerror = (error) => {
      console.error('[NeoProxy] Event Bus error:', error)
      this.dispatch('connection', { connected: false, error })
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
      console.log('[NeoProxy] Event Bus disconnected')
    }
  }

  on(eventType: string, callback: Function) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    this.listeners.get(eventType)!.push(callback)
  }

  off(eventType: string, callback: Function) {
    const callbacks = this.listeners.get(eventType)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private dispatch(eventType: string, data: any) {
    const callbacks = this.listeners.get(eventType)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('[NeoProxy] Callback error:', error)
        }
      })
    }
  }

  isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN
  }
}

// Global instance
export const neoproxyEvents = new NeoProxyEventBus()

// Auto-connect when imported
if (typeof window !== 'undefined') {
  neoproxyEvents.connect()
}
