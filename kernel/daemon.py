import time
import psutil
import requests
import json
import sys
import os
from datetime import datetime

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from python_kernel_with_wake import NeoProxyKernel

class NeoProxyDaemon:
    def __init__(self, interval: int = 5):
        self.interval = interval
        self.kernel = NeoProxyKernel()
        self.running = False
        
    def get_system_state(self):
        """Check system state (CPU, disk, memory)"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Disk usage
            disk_usage = psutil.disk_usage('/')
            disk_percent = (disk_usage.used / disk_usage.total) * 100
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            
            return {
                'cpu_percent': cpu_percent,
                'disk_percent': disk_percent,
                'memory_percent': memory_percent,
                'disk_free_gb': disk_usage.free / (1024**3),
                'memory_free_gb': memory.available / (1024**3),
                'timestamp': int(time.time())
            }
        except Exception as e:
            print(f"[Daemon] Error getting system state: {e}")
            return None
    
    def determine_priority(self, system_state):
        """Determine event priority based on thresholds"""
        if not system_state:
            return 'LOW'
            
        cpu = system_state['cpu_percent']
        disk = system_state['disk_percent']
        
        # Priority thresholds
        if disk > 90:
            return 'CRITICAL'
        elif cpu > 80:
            return 'HIGH'
        elif disk > 70 or cpu > 50:
            return 'NORMAL'
        else:
            return 'LOW'
    
    def wake(self, event_data):
        """Send wake signal to Next.js"""
        try:
            # Use environment variable for API URL
            api_url = os.getenv('NEOPROXY_API_URL', 'http://localhost:3000/api/internal/wake')
            
            response = requests.post(
                api_url,
                json=event_data,
                timeout=0.05  # Fast timeout
            )
            return response.status_code == 200
        except Exception as e:
            print(f"[Daemon] Wake failed: {e}")
            return False
    
    def run(self):
        """Main daemon loop"""
        print("[Daemon] Starting NeoProxy Daemon...")
        self.running = True
        
        while self.running:
            try:
                # 1. Check system state
                system_state = self.get_system_state()
                
                if system_state:
                    # 2. Determine priority
                    priority = self.determine_priority(system_state)
                    
                    # 3. Create event data
                    event_data = {
                        'type': 'system_monitor',
                        'priority': priority,
                        'source': 'daemon',
                        'payload': system_state
                    }
                    
                    # 4. Write event to SQLite
                    event_id = self.kernel.write_event(
                        event_data['type'],
                        event_data['priority'],
                        event_data['source'],
                        event_data['payload']
                    )
                    
                    # 5. Send wake signal
                    wake_success = self.wake(event_data)
                    
                    # Log status
                    print(f"[Daemon] Event {event_id} | Priority: {priority} | "
                          f"CPU: {system_state['cpu_percent']:.1f}% | "
                          f"Disk: {system_state['disk_percent']:.1f}% | "
                          f"Memory: {system_state['memory_percent']:.1f}% | "
                          f"Wake: {'✓' if wake_success else '✗'}")
                
                # Sleep for interval
                time.sleep(self.interval)
                
            except KeyboardInterrupt:
                print("\n[Daemon] Received interrupt signal...")
                self.running = False
                break
            except Exception as e:
                print(f"[Daemon] Error in main loop: {e}")
                time.sleep(self.interval)
        
        print("[Daemon] Daemon stopped")
    
    def stop(self):
        """Stop the daemon"""
        self.running = False

# Run guard
if __name__ == "__main__":
    daemon = NeoProxyDaemon(interval=5)
    try:
        daemon.run()
    except KeyboardInterrupt:
        print("\n[Daemon] Shutting down...")
        daemon.stop()
