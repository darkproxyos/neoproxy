'use client';

import { useKernelStore } from '@/store/useKernelStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignalFeed() {
  const signals = useKernelStore((s) => s.signals);

  return (
    <div className="flex flex-col gap-2 p-4 h-[300px] overflow-hidden bg-black/20 border border-cyan-900/10 rounded-lg">
      <div className="text-[10px] uppercase text-cyan-500/30 mb-2 tracking-widest font-bold">Signal Stream</div>
      <div className="space-y-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence initial={false}>
          {signals.map((signal) => (
            <motion.div
              key={`${signal.timestamp}-${signal.type}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-3 py-1 px-2 text-[11px] font-mono border-l-2 border-cyan-500/20 bg-cyan-950/10 hover:bg-cyan-900/20 transition-colors"
            >
              <span className="text-cyan-700">[{new Date(signal.timestamp * 1000).toLocaleTimeString([], { hour12: false })}]</span>
              <span className={`px-1 rounded ${
                signal.type.includes('SPIKE') ? 'bg-red-900/30 text-red-400' : 
                signal.type.includes('CRITICAL') ? 'bg-orange-900/30 text-orange-400' :
                'bg-green-900/30 text-green-400'
              }`}>
                {signal.type}
              </span>
              <span className="text-cyan-200/60 truncate italic">
                {JSON.stringify(signal.payload)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {signals.length === 0 && (
          <div className="text-cyan-900 text-center py-10 italic">NO SIGNALS DETECTED</div>
        )}
      </div>
    </div>
  );
}
