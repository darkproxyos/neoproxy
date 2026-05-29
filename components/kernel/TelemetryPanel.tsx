'use client';

import { useKernelStore } from '@/store/useKernelStore';
import { motion } from 'framer-motion';

export default function TelemetryPanel() {
  const state = useKernelStore((s) => s.state);

  if (!state) return <div className="p-4 animate-pulse text-cyan-500/50">WAITING FOR PROXYD TELEMETRY...</div>;

  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-black/40 border border-cyan-900/30 rounded-lg backdrop-blur-md">
      <div className="space-y-1">
        <div className="text-[10px] uppercase text-cyan-500/50">CPU Load</div>
        <div className="flex items-end gap-2">
          <div className="text-2xl font-mono text-cyan-400">{state.cpu.load.toFixed(1)}%</div>
          <div className="text-[10px] text-cyan-600 mb-1">({state.cpu.count} CORES)</div>
        </div>
        <div className="w-full h-1 bg-cyan-950 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-cyan-500"
            initial={{ width: 0 }}
            animate={{ width: `${state.cpu.load}%` }}
            transition={{ type: 'spring', stiffness: 100 }}
          />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[10px] uppercase text-purple-500/50">Memory Used</div>
        <div className="text-2xl font-mono text-purple-400">{state.mem.used_pct.toFixed(1)}%</div>
        <div className="w-full h-1 bg-purple-950 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${state.mem.used_pct}%` }}
            transition={{ type: 'spring', stiffness: 100 }}
          />
        </div>
      </div>

      <div className="col-span-2 pt-2 border-t border-cyan-900/10">
        <div className="flex justify-between text-[9px] font-mono text-cyan-700">
          <span>EVENT_LOG_SIZE: {state.events_count}</span>
          <span>RUNTIME: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
