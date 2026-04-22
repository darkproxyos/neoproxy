# Server-Sent Events (SSE) Live Stream

## Overview
SSE endpoint `/api/live` that provides real-time updates from NeoProxy kernel via polling and change detection.

## Implementation Details

### Endpoint: `/api/live`

**Method:** GET  
**Response Type:** Server-Sent Events (text/event-stream)

### Features

#### 1. Real-time Polling
- **Interval**: Every 1 second
- **Endpoints polled**: `/logs` and `/status`
- **Change detection**: Compares current state with last known state
- **Efficient**: Only sends events when changes occur

#### 2. Event Types
```typescript
interface LiveEvent {
  type: 'log' | 'status' | 'error'
  timestamp: string
  data: any
}
```

#### 3. SSE Format
```
event: message
data: {"type":"log","timestamp":"2026-03-31T12:34:56.789Z","data":{...}}

```

#### 4. Connection Management
- **Active connections tracking**: Global counter
- **Connection events**: Sent on new connection
- **Graceful cleanup**: Proper interval clearing on disconnect
- **Error handling**: Fallback events on polling failures

## Event Examples

### Connection Event
```json
{
  "type": "status",
  "timestamp": "2026-03-31T12:34:56.789Z",
  "data": {
    "message": "Connected to NeoProxy Live Stream",
    "connections": 1
  }
}
```

### New Logs Event
```json
{
  "type": "log",
  "timestamp": "2026-03-31T12:34:56.789Z",
  "data": {
    "newLogs": [
      {
        "id": "py_log_002",
        "timestamp": "2026-03-31T12:34:56.789Z",
        "level": "INFO",
        "module": "validator",
        "message": "Validation completed for seed 48291"
      }
    ],
    "total": 25
  }
}
```

### Status Change Event
```json
{
  "type": "status",
  "timestamp": "2026-03-31T12:34:56.789Z",
  "data": {
    "status": "online",
    "uptime": 12345678,
    "modules": ["master", "validator", "registrar", "syncer", "cleaner"],
    "version": "0.2.0"
  }
}
```

### Error Event
```json
{
  "type": "error",
  "timestamp": "2026-03-31T12:34:56.789Z",
  "data": {
    "message": "Failed to poll kernel",
    "error": "Connection refused"
  }
}
```

## Client Implementation

### JavaScript/TypeScript
```javascript
const eventSource = new EventSource('/api/live');

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'log':
      console.log('New logs:', data.data.newLogs);
      break;
    case 'status':
      console.log('Status changed:', data.data);
      break;
    case 'error':
      console.error('Kernel error:', data.data);
      break;
  }
};

eventSource.onerror = function(event) {
  console.error('SSE connection error:', event);
};

eventSource.onopen = function(event) {
  console.log('SSE connection opened');
};
```

### React Hook
```typescript
import { useEffect, useState } from 'react';

interface LiveEvent {
  type: 'log' | 'status' | 'error';
  timestamp: string;
  data: any;
}

export function useKernelLive() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('/api/live');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEvents(prev => [...prev, data]);
    };

    eventSource.onopen = () => setIsConnected(true);
    eventSource.onerror = () => setIsConnected(false);

    return () => {
      eventSource.close();
    };
  }, []);

  return { events, isConnected };
}
```

## Performance Considerations

### Memory Management
- **In-memory state**: Last known logs and status stored globally
- **Connection tracking**: Active connection counter
- **Cleanup**: Proper interval clearing on disconnect

### Network Efficiency
- **Polling interval**: 1 second (configurable)
- **Change detection**: Only sends events on actual changes
- **Timeout**: 5 second timeout for polling requests

### Scalability
- **Multiple connections**: Supported with connection tracking
- **State sharing**: Global state across all connections
- **Resource limits**: Built-in cleanup prevents memory leaks

## Testing

### Connect to Stream
```bash
curl -N http://localhost:3000/api/live
```

### Expected Output
```
event: message
data: {"type":"status","timestamp":"2026-03-31T12:34:56.789Z","data":{"message":"Connected to NeoProxy Live Stream","connections":1}}

event: message
data: {"type":"log","timestamp":"2026-03-31T12:34:57.789Z","data":{"newLogs":[...],"total":25}}
```

## Headers
```http
Content-Type: text/event-stream
Cache-Control: no-cache, no-transform
Connection: keep-alive
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Cache-Control
```

## Environment Variables
```bash
# Configure Python backend URL
export KERNEL_URL=http://localhost:8000
```

## Monitoring

Check server logs for:
- `[SSE] New connection. Active connections: X`
- `[SSE] Connection closed. Active connections: X`
- `[SSE] Stream cancelled. Active connections: X`
- `[SSE] Polling error: ...`

## Next Steps

1. **Add authentication** via token-based SSE
2. **Implement filtering** (by log level, module)
3. **Add heartbeat** for connection health
4. **Buffer events** for reconnection scenarios
5. **Metrics dashboard** for connection monitoring
