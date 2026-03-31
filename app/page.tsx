"use client";

import Link from 'next/link';

export default function SurfacePortal() {
  return (
    <div className="relative w-full h-screen bg-[#020408] flex items-center justify-center p-8">
      {/* Background Grid */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.2) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />
      
      <div className="z-10 max-w-4xl w-full">
        <div className="text-[11px] font-mono text-[#00d4ff] tracking-[0.2em] uppercase mb-8 flex items-center gap-2">
          <span className="text-[#4a6080]">//</span>
          NeoProxy OS — v0.2 — Surface Portal
        </div>

        <h1 className="font-sans text-5xl md:text-7xl font-extrabold leading-none tracking-tight mb-12">
          <span className="text-[#00d4ff]">Neo</span>
          <span className="text-white">Proxy</span>
          <span className="block text-[0.35em] text-[#4a6080] tracking-[0.3em] uppercase font-normal mt-4">
            Creative Operating System
          </span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#0f1f35] border border-[#0f1f35]">
          <Link href="/lab" className="group bg-[#080d14] p-8 transition-colors hover:bg-[#0d1825]">
            <span className="text-2xl mb-4 block">⚗️</span>
            <h2 className="font-sans text-lg font-bold text-white mb-2">Generative Lab</h2>
            <p className="text-sm text-[#4a6080]">
              Laboratorio de geometría. Zona científica de exploración pura: algoritmos, formas, experimentos procedurales.
            </p>
          </Link>
          
          <Link href="/fabrication" className="group bg-[#080d14] p-8 transition-colors hover:bg-[#0d1825]">
            <span className="text-2xl mb-4 block">🔧</span>
            <h2 className="font-sans text-lg font-bold text-white mb-2">Fabrication Lab</h2>
            <p className="text-sm text-[#4a6080]">
              La conexión con el taller físico. Donde el arte digital se convierte en objeto real mediante resina, luz y electrónica.
            </p>
          </Link>
          
          <Link href="/memory" className="group bg-[#080d14] p-8 transition-colors hover:bg-[#0d1825]">
            <span className="text-2xl mb-4 block">🧬</span>
            <h2 className="font-sans text-lg font-bold text-white mb-2">Memory Lab</h2>
            <p className="text-sm text-[#4a6080]">
              Un archivo vivo de conversaciones con IA, procesos creativos, errores y descubrimientos. El diario del sistema.
            </p>
          </Link>
        </div>
      </div>
      
      <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center z-10 text-[11px] font-mono text-[#4a6080] tracking-widest uppercase">
        <div className="font-sans font-extrabold text-[#c8daf0] text-lg normal-case tracking-normal">
          <span className="text-[#00d4ff]">Neo</span>Proxy <span className="text-[11px] font-normal font-mono text-[#4a6080]">OS</span>
        </div>
        <div>NPos KERNEL: <span className="text-[#5ef0c0]">IDLE</span></div>
      </div>
    </div>
  );
}
