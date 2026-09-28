"use client";

import Link from 'next/link';

type Category = {
  id: string;
  label: string;
  color: string;
  desc: string;
  items: string[];
  cta: { label: string; href: string; external?: boolean };
};

const categories: Category[] = [
  {
    id: 'insumos',
    label: 'INSUMOS ELECTRÓNICOS',
    color: '#00ff9d',
    desc: 'Componentes para tus propios builds: microcontroladores, sensores y actuadores.',
    items: ['ESP32 DevKit', 'Arduino Uno R3', 'Sensores (PIR, ultrasónico, temperatura)', 'Servos SG90 / MG996R'],
    cta: { label: 'CONSULTAR DISPONIBILIDAD', href: 'mailto:contact@neoproxy.art?subject=Insumos%20electr%C3%B3nicos' },
  },
  {
    id: 'impresion-3d',
    label: 'IMPRESIÓN 3D',
    color: '#ffb800',
    desc: 'Piezas impresas bajo pedido, en resina o filamento, a partir de tu modelo o el nuestro.',
    items: ['Impresión bajo pedido (STL propio)', 'Acabado y post-proceso', 'Prototipado rápido'],
    cta: { label: 'PEDIR COTIZACIÓN', href: 'mailto:contact@neoproxy.art?subject=Impresi%C3%B3n%203D' },
  },
  {
    id: 'modelos-3d',
    label: 'MODELOS 3D',
    color: '#b400ff',
    desc: 'Archivos descargables — geometría generativa lista para imprimir o modificar.',
    items: ['Archivos STL / OBJ', 'Modelos generativos NeoProxy', 'Licencia de uso personal'],
    cta: { label: 'CONSULTAR CATÁLOGO', href: 'mailto:contact@neoproxy.art?subject=Modelos%203D' },
  },
  {
    id: 'arte',
    label: 'ARTE GENERATIVO',
    color: '#00d4ff',
    desc: 'Piezas únicas certificadas, extraídas del motor generativo. La única categoría con checkout activo hoy.',
    items: ['DROP 01 — 15 piezas certificadas', 'Arquetipos THORN, ORGANIC, GLITCH y más'],
    cta: { label: 'VER DROP 01 →', href: '/shop/drop01' },
  },
];

export default function ShopPage() {
  return (
    <div className="relative w-full min-h-screen bg-[#020408] text-white overflow-x-hidden">
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
            <span className="text-[#00d4ff]">TIENDA</span>
            <span className="block text-[0.35em] text-[#4a6080] tracking-[0.3em] uppercase font-normal mt-4">
              Insumos, fabricación y arte
            </span>
          </h1>
          <p className="mt-6 text-sm text-[#4a6080] max-w-2xl">
            Catálogo inicial del ecosistema NeoProxy: insumos electrónicos para tus propios builds,
            impresión y modelos 3D, y arte generativo certificado. Esta es la primera plantilla —
            va a crecer con precios, stock y checkout real por categoría.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-[#080d14] border border-[#0f1f35] p-8 transition-all duration-200"
              >
                <div
                  className="text-[11px] font-mono tracking-[0.2em] uppercase mb-3"
                  style={{ color: cat.color }}
                >
                  {cat.label}
                </div>
                <p className="text-sm text-[#8fb8d6] mb-5">{cat.desc}</p>

                <ul className="mb-6 space-y-2">
                  {cat.items.map((item) => (
                    <li key={item} className="text-[12px] font-mono text-[#4a6080] flex items-start gap-2">
                      <span style={{ color: cat.color }}>›</span> {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href={cat.cta.href}
                  className="inline-block font-mono text-[10px] tracking-[0.2em] uppercase px-5 py-3 border transition-colors"
                  style={{ color: cat.color, borderColor: `${cat.color}66` }}
                >
                  [ {cat.cta.label} ]
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center py-12 border-t border-[#0f1f35]">
            <div className="text-[11px] font-mono text-[#4a6080] tracking-[0.2em] uppercase mb-4">
              CATÁLOGO EN CONSTRUCCIÓN
            </div>
            <p className="text-sm text-[#4a6080] max-w-xl mx-auto">
              Insumos, impresión y modelos 3D todavía no tienen checkout propio — escribinos y
              coordinamos directo. Arte generativo (Drop 01) ya funciona de punta a punta.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-8 border-t border-[#0f1f35] mt-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-[11px] font-mono text-[#4a6080] tracking-[0.2em] uppercase">
            NEOPROXY OS — TIENDA
          </div>
          <div className="text-[11px] font-mono text-[#4a6080] tracking-[0.2em] uppercase">
            SANTIAGO, CHILE
          </div>
        </div>
      </footer>
    </div>
  );
}
