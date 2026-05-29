'use client';

import { StardustConfig } from '../engine/StardustEngine';

interface SynthesisProps {
  config: StardustConfig;
  onChange: (key: string, val: number) => void;
}

export default function Synthesis({ config, onChange }: SynthesisProps) {
  return (
    <div className="p-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[32px] w-[300px] pointer-events-auto space-y-4">
      <h2 className="text-white font-bold text-lg">SYNTHESIS</h2>
      
      {[
        { label: 'DENSITY', key: 'density', min: 10, max: 300, step: 1 },
        { label: 'COMPLEXITY', key: 'complexity', min: 1, max: 100, step: 1 },
        { label: 'SCALE', key: 'scale', min: 0.1, max: 5.0, step: 0.1, factor: 1 },
      ].map(row => (
        <div key={row.key} className="space-y-1">
          <div className="flex justify-between text-[10px] text-white/40 tracking-widest">
            <span>{row.label}</span>
            <span className="text-cyan-400">{(config as any)[row.key]}</span>
          </div>
          <input 
            type="range" 
            min={row.min} 
            max={row.max} 
            step={row.step}
            value={(config as any)[row.key] * (row.key === 'scale' ? 1 : 1)}
            onChange={e => onChange(row.key, parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none accent-cyan-500 cursor-pointer"
          />
        </div>
      ))}

      <div className="mt-4 p-3 bg-white/5 rounded-xl flex justify-between items-center text-[10px]">
        <span className="text-white/30 font-bold">SEED:</span>
        <span className="text-cyan-400 font-mono">#{config.seed}</span>
      </div>
    </div>
  );
}
