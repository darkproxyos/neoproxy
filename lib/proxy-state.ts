let ws: WebSocket | null = null

export function connectProxyRuntime(onState: (s: any) => void) {
  const connect = () => {
    ws = new WebSocket('ws://localhost:3333')
    ws.onopen = () => console.log('[ProxyOS] L3 connected to L2')
    ws.onmessage = (e) => {
      try { onState(JSON.parse(e.data)) } catch {}
    }
    ws.onclose = () => {
      console.log('[ProxyOS] L2 disconnected — retry in 3s')
      setTimeout(connect, 3000)
    }
  }
  connect()
  return () => ws?.close()
}
