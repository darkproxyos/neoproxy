"use client";

import Link from 'next/link';

export default function ShopPage() {
  return (
    <div className="relative w-full h-screen bg-[#020408] text-white overflow-x-hidden">
      {/* Background Grid */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.2) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      {/* Header */}
      <header className="relative z-10 p-8 border-b border-[#0f1f35]">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="text-[11px] font-mono text-[#00d4ff] tracking-[0.2em] uppercase mb-4 block">
            ← BACK TO NEOPROXY OS
          </Link>
          <h1 className="font-sans text-5xl md:text-7xl font-extrabold leading-none tracking-tight">
            <span className="text-[#00d4ff]">SHOP</span>
            <span className="block text-[0.35em] text-[#4a6080] tracking-[0.3em] uppercase font-normal mt-4">
              Generative Marketplace
            </span>
          </h1>
          <p className="mt-6 text-sm text-[#4a6080] max-w-2xl">
            Arte generativo certificado. Piezas únicas extraídas de algoritmos de diversidad forzada, 
            listas para impresión 3D y colección digital.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          {/* DROP 01 Link */}
          <div className="mb-12">
            <Link 
              href="/shop/drop01"
              className="group bg-[#080d14] border border-[#0f1f35] p-8 block transition-all duration-200 hover:border-[#b400ff] hover:shadow-lg hover:shadow-[#b400ff]/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono text-[#4a6080] tracking-[0.2em] uppercase mb-2">
                    FEATURED DROP
                  </div>
                  <h2 className="font-sans text-3xl font-bold text-white mb-2">
                    DROP 01 <span className="text-[#00d4ff]">CORE</span>
                  </h2>
                  <p className="text-sm text-[#4a6080] mb-4">
                    15 piezas certificadas con algoritmo de diversidad forzada. 
                    Arquetipos THORN, ORGANIC, GLITCH y más.
                  </p>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#00ff9d] rounded-full"></div>
                      <span className="text-[#00ff9d] font-mono">15 PIEZAS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#b400ff] rounded-full"></div>
                      <span className="text-[#b400ff] font-mono">SAFE CERTIFIED</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#ffb800] rounded-full"></div>
                      <span className="text-[#ffb800] font-mono">$104-130</span>
                    </div>
                  </div>
                </div>
                <div className="text-4xl font-mono text-[#b400ff] group-hover:text-[#00d4ff] transition-colors">
                  →
                </div>
              </div>
            </Link>
          </div>

          {/* Other Products Placeholder */}
          <div className="text-center py-16">
            <div className="text-[11px] font-mono text-[#4a6080] tracking-[0.2em] uppercase mb-4">
              COMING SOON
            </div>
            <p className="text-sm text-[#4a6080]">
              Más drops generativos en camino. Cada pieza certificada por el sistema NeoProxy.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-8 border-t border-[#0f1f35] mt-16">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-[11px] font-mono text-[#4a6080] tracking-[0.2em] uppercase">
            NEOPROXY OS — SHOP
          </div>
          <div className="text-[11px] font-mono text-[#4a6080] tracking-[0.2em] uppercase">
            CERTIFIED GENERATIVE ART
          </div>
        </div>
      </footer>
    </div>
  );
}
