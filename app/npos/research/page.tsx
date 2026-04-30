'use client';

import ResearchCenter from '@/components/npos/research/ResearchCenter';

export default function ResearchPage() {
  return (
    <div className="research-page-wrapper">
      <header className="page-header">
        <h1>KNOWLEDGE_LAYERS: RESEARCH_CENTER</h1>
        <p className="page-subtitle">Explorando la ontología, ciencia y memoria de NeoProxy OS</p>
      </header>
      
      <ResearchCenter />

      <style jsx>{`
        .research-page-wrapper {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .page-header {
          margin-bottom: 3rem;
          border-bottom: 2px solid #1a2c42;
          padding-bottom: 1rem;
        }
        h1 {
          font-family: 'Space Mono', monospace;
          font-size: 1.5rem;
          color: #00d4ff;
          margin: 0;
          letter-spacing: 2px;
        }
        .page-subtitle {
          color: #4a6080;
          font-size: 0.8rem;
          margin-top: 0.5rem;
          font-family: 'Space Mono', monospace;
        }
      `}</style>
    </div>
  );
}
