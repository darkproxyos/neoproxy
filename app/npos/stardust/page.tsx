'use client';
export const dynamic = 'force-dynamic';

import { useRef } from 'react';
import Link from 'next/link';
import { useStardust } from './hooks/useStardust';
import Console from './components/Console';
import Synthesis from './components/Synthesis';
import { useKernelStore } from '@/store/useKernelStore';

export default function StardustPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { fps, config, regenerate } = useStardust(canvasRef);
  const isConnected = useKernelStore((s) => s.isConnected);

  const handleCommand = (cmd: string) => {
    // Aquí podemos mapear comandos a la lógica del engine
    if (cmd === 'regen') regenerate();
    // Otros comandos pueden implementarse aquí
  };

  const handleParamChange = (key: string, val: number) => {
    regenerate({ [key]: val });
  };

  return (
    <div className="relative w-screen h-screen bg-[#020205] text-white overflow-hidden font-sans">
      {/* Babylon Scene */}
      <canvas ref={canvasRef} className="w-full h-full outline-none" />

      {/* Overlay UI */}
      <div className="absolute inset-0 p-10 pointer-events-none flex flex-col z-10">
        <header className="flex justify-between items-center mb-auto">
          <div className="flex flex-col">
            <div className="text-2xl font-black tracking-[0.2em] flex items-center gap-3">
              <span className="text-cyan-400">NEO</span>PROXY
              <span className="text-[10px] opacity-40 font-mono tracking-normal bg-white/5 px-2 py-1 rounded">STARDUST_v3.0_RT</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Uplink: {isConnected ? 'Stable' : 'Unstable'}</span>
            </div>
          </div>
          <Link 
            href="/npos" 
            className="pointer-events-auto border border-cyan-400/20 px-6 py-2 text-cyan-400 text-[10px] font-bold hover:bg-cyan-400 hover:text-black transition-all hover:border-cyan-400 rounded-full"
          >
            TERMINATE SESSION
          </Link>
        </header>

        <main className="flex justify-between items-start">
          <Console onCommand={handleCommand} />
          <Synthesis config={config} onChange={handleParamChange} />
        </main>

        <footer className="mt-auto flex justify-between text-[10px] font-mono opacity-40 tracking-widest">
          <div className="flex gap-6">
            <span>{fps} FPS</span>
            <span>NODE: CORE-X1</span>
            <span>LAYER: VISUAL-STARDUST</span>
          </div>
          <div className="uppercase">ProxyOS // Artificial Stardust Engine</div>
        </footer>
      </div>

      {/* Post-processing Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
