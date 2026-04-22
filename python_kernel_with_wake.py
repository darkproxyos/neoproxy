import sqlite3
import time
import requests
from datetime import datetime
import json
import os

class NeoProxyKernel:
    def __init__(self, db_path='events.db'):
        self.db_path = db_path
        self.init_database()
        
    def init_database(self):
        """Initialize SQLite database for Event Bus"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create events table with correct schema
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                priority TEXT NOT NULL DEFAULT 'NORMAL',
                source TEXT NOT NULL DEFAULT 'kernel',
                payload TEXT NOT NULL DEFAULT '{}',
                processed INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL
            )
        ''')
        
        conn.commit()
        conn.close()
        
    def write_event(self, event_type: str, priority: str = 'NORMAL', source: str = 'kernel', payload: dict = None):
        """Write event to SQLite Event Bus and emit wake"""
        if payload is None:
            payload = {}
            
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Insert event with new schema
        cursor.execute('''
            INSERT INTO events (type, priority, source, payload, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (event_type, priority, source, json.dumps(payload), int(time.time())))
        
        event_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Emit wake signal to Next.js
        self.emit_wake(event_type, event_id, payload)
        
        return event_id
    
    def emit_wake(self, event_type: str, event_id: int, payload: dict):
        """Emit wake signal to Next.js SSE endpoint"""
        try:
            wake_data = {
                'type': event_type,
                'priority': 'NORMAL',  # Default priority for wake API
                'source': 'python_kernel',
                'payload': {
                    'event_id': event_id,
                    'original_payload': payload
                }
            }
            
            # Use environment variable for API URL
            api_url = os.getenv('NEOPROXY_API_URL', 'http://localhost:3000/api/internal/wake')
            
            # Send wake signal to Next.js
            response = requests.post(
                api_url,
                json=wake_data,
                timeout=1  # Fast timeout
            )
            
            if response.status_code == 200:
                print(f"[Kernel] Wake emitted for event {event_id} ({event_type})")
            else:
                print(f"[Kernel] Wake failed: {response.status_code}")
                
        except Exception as e:
            print(f"[Kernel] Wake error: {e}")
    
    def get_events_since(self, last_id: int = 0, limit: int = 50):
        """Get events since last ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, type, priority, source, payload, processed, created_at 
            FROM events 
            WHERE id > ? 
            ORDER BY id ASC 
            LIMIT ?
        ''', (last_id, limit))
        
        events = []
        for row in cursor.fetchall():
            events.append({
                'id': row[0],
                'type': row[1],
                'priority': row[2],
                'source': row[3],
                'payload': json.loads(row[4]),
                'processed': bool(row[5]),
                'created_at': row[6]
            })
        
        conn.close()
        return events

# Example usage
if __name__ == "__main__":
    kernel = NeoProxyKernel()
    
    # Write some test events with priorities
    kernel.write_event('log', 'INFO', 'master', {
        'level': 'INFO',
        'message': 'Python kernel initialized',
        'module': 'master'
    })
    
    kernel.write_event('status', 'HIGH', 'validator', {
        'status': 'online',
        'uptime': int(time.time()),
        'modules': ['master', 'validator', 'registrar']
    })
    
    kernel.write_event('log', 'CRITICAL', 'monitor', {
        'level': 'WARNING',
        'message': 'High memory usage detected',
        'module': 'monitor'
    })
    
    print("Events written and wake signals emitted")
