'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const LAYERS = [
  { id: 'philosophy', name: 'PHILOSOPHY', icon: '🌀' },
  { id: 'science', name: 'SCIENCE', icon: '📐' },
  { id: 'engineering', name: 'ENGINEERING', icon: '⚙️' },
  { id: 'memory', name: 'MEMORY', icon: '💾' }
];

export default function ResearchCenter() {
  const [activeLayer, setActiveLayer] = useState(LAYERS[0].id);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  // In a real app, this would fetch from a dynamic API that reads /lib/knowledge
  // For now, we mock the retrieval based on our created files.
  const fetchLayerContent = async (layer: string) => {
    setLoading(true);
    // Simulation of file reading
    let file = '';
    if (layer === 'philosophy') file = 'entropy_aesthetics.md';
    if (layer === 'science') file = 'generative_systems.md';
    if (layer === 'engineering') file = 'pantheon_architecture.md';
    
    // Mocking the raw content for the demo since we can't easily fetch server-side files in client-side without an API
    const mockContent: Record<string, string> = {
      philosophy: "# Filosofía NeoProxy: El Arte de la Entropía Controlada 🌀\n\n## 1. Relación entre Entropía y Software\nEn NeoProxy, el software no se ve como una estructura rígida, sino como un organismo que busca el equilibrio entre el orden algorítmico y el caos generativo.",
      science: "# Ciencia NeoProxy: Dominios del Conocimiento 📐🔬\n\nExplorando los pilares matemáticos y físicos:\n- **[Física]**: Entropía, Sistemas Dinámicos.\n- **[Matemáticas]**: Topología, Fractales.\n- **[Sistemas Complejos]**: Emergencia, Teoría del Caos.",
      engineering: "# Ingeniería NeoProxy: Arquitectura del Panteón 🏛️⚙️\n\n## 1. El Kernel NeoProxy\nUn núcleo de ejecución asíncrono que orquestra la comunicación entre agentes.",
      memory: "# Memoria NeoProxy: Diario de Evolución 💾\n\n*Logs de Chronos detectados... Explorando historial de mutaciones.*"
    };

    setContent(mockContent[layer] || '# Content not found.');
    setLoading(false);
  };

  useEffect(() => {
    fetchLayerContent(activeLayer);
  }, [activeLayer]);

  return (
    <div className="research-container">
      <div className="research-sidebar">
        {LAYERS.map(layer => (
          <button 
            key={layer.id}
            onClick={() => setActiveLayer(layer.id)}
            className={`layer-btn ${activeLayer === layer.id ? 'active' : ''}`}
          >
            <span className="icon">{layer.icon}</span>
            <span className="label">{layer.name}</span>
          </button>
        ))}
      </div>

      <div className="research-content">
        {loading ? (
          <div className="loader">LOADING_KNOWLEDGE...</div>
        ) : (
          <div className="markdown-body">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>

      <style jsx>{`
        .research-container {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 2rem;
          min-height: 500px;
          background: rgba(var(--neo-background-rgb), 0.8);
          border: var(--neo-border-width) solid var(--neo-glow);
          padding: 2rem;
          backdrop-filter: blur(var(--neo-blur));
        }
        .research-sidebar {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .layer-btn {
          background: rgba(26, 44, 66, 0.3);
          border: 1px solid #1a2c42;
          color: #4a6080;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem;
          text-align: left;
        }
        .layer-btn:hover {
          background: var(--neo-glow);
          border-color: var(--neo-primary);
          color: var(--neo-primary);
        }
        .layer-btn.active {
          background: rgba(var(--neo-primary-rgb), 0.1);
          border-color: var(--neo-primary);
          color: var(--neo-primary);
          box-shadow: 0 0 15px var(--neo-glow);
        }
        .research-content {
          padding: 1rem;
          max-width: 800px;
          color: #c8daf0;
          font-family: 'Inter', sans-serif;
        }
        .markdown-body {
          line-height: 1.6;
        }
        .loader {
          opacity: 0.5;
          font-family: 'Space Mono', monospace;
        }
        @media (max-width: 768px) {
          .research-container {
            grid-template-columns: 1fr;
          }
          .research-sidebar {
            flex-direction: row;
            overflow-x: auto;
          }
          .layer-btn {
            flex-shrink: 0;
            padding: 0.5rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}
