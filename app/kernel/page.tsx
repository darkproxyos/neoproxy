'use client';

import { useKernelStore } from '@/store/useKernelStore';
import TelemetryPanel from '@/components/kernel/TelemetryPanel';
import SignalFeed from '@/components/kernel/SignalFeed';
import { motion } from 'framer-motion';

export default function KernelPage() {
  const isConnected = useKernelStore((s) => s.isConnected);

  return (
    <main className="min-h-screen bg-[#020408] text-cyan-50 p-6 md:p-12 font-mono relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cyan-900/40 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 animate-pulse'}`} />
              <h1 className="text-3xl font-bold tracking-tighter uppercase italic">NeoProxy Kernel</h1>
            </div>
            <p className="text-cyan-600 text-xs">DISTRIBUTED REALTIME RUNTIME :: v0.2.1-EXPERIMENTAL</p>
          </div>
          
          <div className="flex gap-8 text-right">
            <div>
              <div className="text-[10px] text-cyan-700 uppercase">System Status</div>
              <div className="text-sm">{isConnected ? 'OPERATIONAL' : 'OFFLINE'}</div>
            </div>
            <div>
              <div className="text-[10px] text-cyan-700 uppercase">Uplink</div>
              <div className="text-sm">SOCKET.IO:4000</div>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Telemetry & Info */}
          <section className="lg:col-span-1 space-y-6">
            <TelemetryPanel />
            
            <div className="p-4 bg-cyan-950/10 border border-cyan-900/20 rounded-lg">
              <h3 className="text-[10px] uppercase text-cyan-500/50 mb-3 tracking-widest font-bold">Node Identification</h3>
              <div className="space-y-3">
                {[
                  { name: 'Core Engine', status: 'ACTIVE', pid: 1436 },
                  { name: 'ProxyD', status: 'ACTIVE', pid: 1442 },
                  { name: 'EventBus', status: 'ACTIVE', pid: 1443 },
                  { name: 'Multiplayer', status: 'ACTIVE', pid: 41186 },
                ].map((node) => (
                  <div key={node.name} className="flex justify-between items-center text-[11px] border-b border-cyan-900/10 pb-1">
                    <span className="text-cyan-100">{node.name}</span>
                    <div className="flex gap-3">
                      <span className="text-cyan-700">PID:{node.pid}</span>
                      <span className="text-green-500 font-bold">{node.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Right Column: Signal Stream */}
          <section className="lg:col-span-2 space-y-6">
            <SignalFeed />
            
            {/* Visual Placeholder for Graph */}
            <div className="h-[200px] bg-black/40 border border-cyan-900/10 rounded-lg relative overflow-hidden flex items-center justify-center">
               <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, #06b6d4 1px, transparent 0)', backgroundSize: '24px 24px'}} />
               <div className="text-cyan-900 text-xs text-center">
                 <div className="w-40 h-[1px] bg-cyan-900 mx-auto mb-2" />
                 TOPOLOGICAL STATE MAPPING INACTIVE
                 <div className="text-[10px] mt-1">AWAITING STARDUST SYNC</div>
               </div>
            </div>
          </section>
        </div>

        {/* Footer Info */}
        <footer className="pt-12 text-[9px] text-cyan-900 flex justify-between uppercase tracking-widest">
           <span>ProxyOS Collective :: DarkProxy Operator</span>
           <span>SECURE_LAYER_STABLE_SIGNAL_A92</span>
        </footer>
      </div>
    </main>
  );
}
