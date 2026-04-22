# Python Backend Server (NeoProxy Kernel)

## Simple Flask Server for Testing

Create this Python server to test the API integration:

```python
from flask import Flask, request, jsonify
from datetime import datetime
import time
import uuid
import hashlib

app = Flask(__name__)

# Mock kernel state
kernel_start_time = time.time()
registered_objects = []

@app.route('/status', methods=['GET'])
def get_status():
    return jsonify({
        "status": "online",
        "uptime": int(time.time() - kernel_start_time),
        "modules": ["master", "validator", "registrar", "syncer", "cleaner"],
        "timestamp": datetime.utcnow().isoformat(),
        "version": "0.2.0"
    })

@app.route('/logs', methods=['GET'])
def get_logs():
    level = request.args.get('level')
    module = request.args.get('module')
    limit = int(request.args.get('limit', 10))
    
    mock_logs = [
        {
            "id": "py_log_001",
            "timestamp": datetime.utcnow().isoformat(),
            "level": "INFO",
            "module": "master",
            "message": "Python kernel initialized successfully",
            "details": {"port": 8000, "workers": 4}
        },
        {
            "id": "py_log_002",
            "timestamp": datetime.utcnow().isoformat(),
            "level": "INFO",
            "module": "validator",
            "message": "Validation completed for seed 48291",
            "details": {"seed": "48291", "archetype": "BRUTAL", "score": 88}
        },
        {
            "id": "py_log_003",
            "timestamp": datetime.utcnow().isoformat(),
            "level": "WARNING",
            "module": "registrar",
            "message": "Duplicate seed detected",
            "details": {"seed": "19302", "existing_id": "obj_042"}
        }
    ]
    
    # Apply filters
    if level:
        mock_logs = [log for log in mock_logs if log["level"] == level.upper()]
    if module:
        mock_logs = [log for log in mock_logs if log["module"] == module.lower()]
    
    mock_logs = mock_logs[:limit]
    
    return jsonify({
        "logs": mock_logs,
        "total": len(mock_logs),
        "timestamp": datetime.utcnow().isoformat()
    })

@app.route('/register', methods=['POST'])
def register_object():
    data = request.get_json()
    
    if not data or 'seed' not in data or 'type' not in data:
        return jsonify({"error": "Missing required fields"}), 400
    
    # Generate unique ID and hash
    obj_id = f"obj_{int(time.time())}_{str(uuid.uuid4())[:8]}"
    hash_obj = hashlib.sha256(f"{data['seed']}_{data['type']}_{time.time()}".encode()).hexdigest()[:16]
    
    registered_obj = {
        "id": obj_id,
        "hash": hash_obj,
        "status": "registered",
        "timestamp": datetime.utcnow().isoformat()
    }
    
    registered_objects.append(registered_obj)
    
    return jsonify(registered_obj), 201

if __name__ == '__main__':
    print("Starting NeoProxy Kernel on http://localhost:8000")
    app.run(host='0.0.0.0', port=8000, debug=True)
```

## Installation & Running

```bash
# Install Flask
pip install flask

# Run the server
python kernel_server.py
```

## Testing the Integration

1. Start the Python server on port 8000
2. Start the Next.js development server
3. Test endpoints:

```bash
# Test status
curl http://localhost:3000/api/kernel/status

# Test logs
curl "http://localhost:3000/api/kernel/logs?level=INFO&limit=2"

# Test registration
curl -X POST http://localhost:3000/api/kernel/register \
  -H "Content-Type: application/json" \
  -d '{"seed": "48291", "type": "ring"}'
```

## Environment Variables

You can configure the kernel URL using environment variables:

```bash
# For development
export KERNEL_URL=http://localhost:8000

# For production
export KERNEL_URL=https://your-python-backend.com
```

## Error Handling

The Next.js API will automatically fallback to mock data if:
- Python server is not running
- Connection times out (10 seconds)
- Server returns an error

This ensures the frontend continues working even without the Python backend.
