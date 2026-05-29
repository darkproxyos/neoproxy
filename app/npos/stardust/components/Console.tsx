'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface ConsoleProps {
  onCommand: (cmd: string) => void;
}

export default function Console({ onCommand }: ConsoleProps) {
  const [input, setInput] = useState("");
  const [lines, setLines] = useState<{ text: string, time: string }[]>([]);

  const handleSend = () => {
    if (!input) return;
    const time = new Date().toLocaleTimeString([], { hour12: false });
    setLines(prev => [...prev.slice(-10), { text: input, time }]);
    onCommand(input);
    setInput("");
  };

  return (
    <div className="p-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[32px] w-[380px] pointer-events-auto">
      <h2 className="text-cyan-400 font-bold mb-1 text-xl tracking-tight">STARDUST CONSOLE</h2>
      <p className="text-white/40 text-xs mb-4">Neural geometry sync active.</p>

      <div className="bg-black/60 border border-cyan-500/20 rounded-xl p-4 mb-4">
        <div className="h-24 overflow-y-auto text-[10px] font-mono space-y-1 mb-2 custom-scrollbar">
          {lines.map((l, i) => (
            <div key={i} className="opacity-80">
              <span className="text-cyan-600">[{l.time}]</span> <span className="text-cyan-100">{l.text}</span>
            </div>
          ))}
          {lines.length === 0 && <div className="text-cyan-900 italic">SYSTEM READY...</div>}
        </div>
        <div className="flex gap-2 border-t border-white/5 pt-3">
          <span className="text-cyan-500">&gt;</span>
          <input 
            className="bg-transparent border-none outline-none text-cyan-400 text-xs w-full"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Enter command..."
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {['REGEN', 'HXA', 'BLOOM', 'PARTICLES', 'RESET', 'CLEAR'].map(btn => (
          <button 
            key={btn}
            onClick={() => onCommand(btn.toLowerCase())}
            className="bg-cyan-500/5 border border-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 text-[10px] py-2 rounded-lg transition-all"
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}
