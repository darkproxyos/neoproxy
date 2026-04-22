# NeoProxy Kernel API Endpoints

## Overview
Three API endpoints created to connect Next.js frontend with Python NeoProxy Kernel backend. **Now connected to real Python backend with fallback support.**

## Architecture

### HTTP Client (`lib/kernel-client.ts`)
- **Axios instance** with 10s timeout
- **Request/Response interceptors** for logging
- **Fallback mechanism** with mock data
- **Environment configurable** via `KERNEL_URL`

### Connection Flow
1. **Primary**: HTTP request to `http://localhost:8000`
2. **Fallback**: Mock data if Python unavailable
3. **Error handling**: Graceful degradation

## Endpoints

### 1. GET /api/kernel/status
Connects to Python `/status` endpoint.

**Python Response:**
```json
{
  "status": "online",
  "uptime": 12345678,
  "modules": ["master", "validator", "registrar", "syncer", "cleaner"],
  "timestamp": "2026-03-31T12:34:56.789Z",
  "version": "0.2.0"
}
```

**Fallback Response:**
```json
{
  "status": "offline",
  "uptime": 0,
  "modules": [],
  "timestamp": "2026-03-31T12:34:56.789Z",
  "version": "0.2.0",
  "error": "Python kernel not available"
}
```

### 2. GET /api/kernel/logs
Connects to Python `/logs` endpoint with query forwarding.

**Query Parameters (forwarded to Python):**
- `level`: Filter by log level
- `module`: Filter by module name  
- `limit`: Limit number of results

**Python Response:**
```json
{
  "logs": [
    {
      "id": "py_log_001",
      "timestamp": "2026-03-31T12:34:56.789Z",
      "level": "INFO",
      "module": "master",
      "message": "Python kernel initialized successfully",
      "details": { "port": 8000, "workers": 4 }
    }
  ],
  "total": 1,
  "timestamp": "2026-03-31T12:34:56.789Z"
}
```

**Fallback Response:**
```json
{
  "logs": [{
    "id": "fallback_001",
    "timestamp": "2026-03-31T12:34:56.789Z",
    "level": "ERROR",
    "module": "api",
    "message": "Failed to connect to Python kernel",
    "details": { "error": "Connection refused", "url": "http://localhost:8000" }
  }],
  "total": 1,
  "timestamp": "2026-03-31T12:34:56.789Z"
}
```

### 3. POST /api/kernel/register
Connects to Python `/register` endpoint with validation.

**Request Body:**
```json
{
  "seed": "48291",
  "type": "ring"
}
```

**Python Response:**
```json
{
  "id": "obj_1234567890_abcdef123",
  "hash": "a1b2c3d4e5f6g7h8",
  "status": "registered",
  "timestamp": "2026-03-31T12:34:56.789Z"
}
```

**Fallback Response:**
```json
{
  "id": "fallback_obj_001",
  "hash": "fallback_hash_001",
  "status": "error",
  "timestamp": "2026-03-31T12:34:56.789Z",
  "error": "Python kernel not available"
}
```

## Configuration

### Environment Variables
```bash
# Development (default)
export KERNEL_URL=http://localhost:8000

# Production
export KERNEL_URL=https://your-python-backend.com
```

### Python Server Setup
See `PYTHON_KERNEL_SERVER.md` for complete Flask server implementation.

## Error Handling

### Connection Errors
- **Timeout**: 10 seconds
- **Connection refused**: Auto-fallback to mock
- **Invalid response**: Fallback with error logging

### Validation Errors
- **400**: Bad Request (validation errors) - handled in Next.js
- **500**: Internal Server Error - fallback to mock

### Logging
- **Request logging**: `[Kernel API] GET /status`
- **Response logging**: `[Kernel API] Response 200 from /status`
- **Error logging**: `[Kernel API] Using fallback data due to: Connection refused`

## Testing

### With Python Server Running
```bash
# Start Python server (see PYTHON_KERNEL_SERVER.md)
python kernel_server.py

# Test endpoints
curl http://localhost:3000/api/kernel/status
curl "http://localhost:3000/api/kernel/logs?level=INFO&limit=2"
curl -X POST http://localhost:3000/api/kernel/register \
  -H "Content-Type: application/json" \
  -d '{"seed": "48291", "type": "ring"}'
```

### Without Python Server (Fallback Mode)
```bash
# Stop Python server and test - will return fallback data
curl http://localhost:3000/api/kernel/status
```

## Frontend Compatibility

**No changes required** - the frontend receives the exact same response structure whether connected to Python or using fallback data. This ensures seamless operation during development and production.

## Monitoring

Check browser console and server logs for:
- `[Kernel API]` prefixed messages
- Fallback activation warnings
- Connection error details

## Next Steps

1. **Deploy Python backend** to production
2. **Set KERNEL_URL** environment variable
3. **Monitor connection health** via logs
4. **Add authentication** if required
5. **Implement WebSocket** for real-time updates
