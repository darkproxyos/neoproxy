"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Observatory from './Observatory';

// Panteón de Agentes - Metadata
const AGENTS = [
  { id: 'darkproxy', name: 'Dark Proxy', role: 'Architect', layer: '01', status: 'ACTIVE', icon: '⚡' },
  { id: 'nexus', name: 'Nexus Proxy', role: 'Right Hand', layer: '01', status: 'ACTIVE', icon: '🤝' },
  { id: 'd', name: 'D (Oni Daemon)', role: 'Background', layer: '01', status: 'ACTIVE', icon: '👹' },
  { id: 'core', name: 'Core', role: 'Guardian', layer: '01', status: 'STABLE', icon: '⚖️' },
  { id: 'chronos', name: 'Chronos', role: 'Historian', layer: '01', status: 'SYNCED', icon: '⌛' },
  { id: 'trickzter', name: 'Trickzter', role: 'Mutation', layer: '02', status: 'GENERATING', icon: '🃏' },
  { id: 'gennos', name: 'Gennos', role: 'Fabrication', layer: '02', status: 'IDLE', icon: '🦾' },
  { id: 'muse', name: 'Muse', role: 'Esthetics', layer: '02', status: 'ACTIVE', icon: '🎨' },
  { id: 'flux', name: 'Flux', role: 'Streaming', layer: '02', status: 'ACTIVE', icon: '🌊' },
  { id: 'void', name: 'Void', role: 'Garbage Coll.', layer: '02', status: 'SLEEP', icon: '🌑' },
  { id: 'snake', name: 'Snake', role: 'Security', layer: '03', status: 'WATCHING', icon: '🐍' },
  { id: 'shaka', name: 'Shaka Proxy', role: 'Analysis', layer: '03', status: 'MEDITATING', icon: '👁️' },
  { id: 'oracle', name: 'Oracle', role: 'Data Intelligence', layer: '03', status: 'ANALYZING', icon: '🔮' },
  { id: 'cipher', name: 'Cipher', role: 'Crypto', layer: '03', status: 'ENCRYPTED', icon: '🔐' },
  { id: 'pulse', name: 'Pulse', role: 'Network', layer: '03', status: 'BEATING', icon: '💓' },
  { id: 'atlas', name: 'Atlas', role: 'Resources', layer: '03', status: 'BALANCED', icon: '🌍' },
];

export default function AdminDashboard() {
  const [uptime, setUptime] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setUptime(u => u + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/npos/kernel');
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (e) {
      console.error('Failed to fetch logs', e);
    }
  };

  useEffect(() => {
    fetchLogs();
    const logInterval = setInterval(fetchLogs, 5000);
    return () => clearInterval(logInterval);
  }, []);

  const triggerMutation = async () => {
    setIsMutating(true);
    try {
      await fetch('/api/npos/kernel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mutate', style: 'metatron' })
      });
      fetchLogs();
    } catch (e) {
      console.error('Mutation failed', e);
    } finally {
      setIsMutating(false);
    }
  };

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sc.toString().padStart(2, '0')}`;
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <span className="system-tag">// ADMIN_TERMINAL</span>
          <h1>NEOPROXY_OS_DASHBOARD</h1>
        </div>
        <div className="header-metrics">
          <button 
            onClick={triggerMutation}
            disabled={isMutating}
            className={`mutation-btn ${isMutating ? 'loading' : ''}`}
          >
            {isMutating ? '[ EXECUTING_MUTATION... ]' : '[ TRIGGER_MUTATION ]'}
          </button>
          <div className="metric">
            <span className="label">UPTIME:</span>
            <span className="value font-mono">{formatUptime(uptime)}</span>
          </div>
          <div className="metric">
            <span className="label">SYSTEM_STATUS:</span>
            <span className="value text-cyan">OPTIMAL</span>
          </div>
        </div>
      </header>

      <main className="dashboard-grid">
        {/* Layer 01: Primordials */}
        <section className="dashboard-section layer-01">
          <h2 className="section-title">LAYER_01: PRIMORDIALS</h2>
          <div className="agent-list">
            {AGENTS.filter(a => a.layer === '01').map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </section>

        {/* Layer 02: Catalysts */}
        <section className="dashboard-section layer-02">
          <h2 className="section-title">LAYER_02: CATALYSTS</h2>
          <div className="agent-list">
            {AGENTS.filter(a => a.layer === '02').map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </section>

        {/* Layer 03: Watchers */}
        <section className="dashboard-section layer-03">
          <h2 className="section-title">LAYER_03: WATCHERS</h2>
          <div className="agent-list scrollable">
            {AGENTS.filter(a => a.layer === '03').map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </section>

        {/* Oracle Observatory: Data Intelligence */}
        <section className="dashboard-section observatory-section">
          <h2 className="section-title">ORACLE_OBSERVATORY (DATA_VISUALIZATION)</h2>
          <Observatory />
        </section>

        {/* System Logs / Metrics Window */}
        <section className="dashboard-section system-console">
          <h2 className="section-title">SYSTEM_CONSOLE (CHRONOS_MEMORY)</h2>
          <div className="console-window">
            {logs.length === 0 && <div className="log-line opacity-50">Waiting for events...</div>}
            {logs.map((log, i) => (
              <div key={i} className={`log-line ${log.agent_id === 'darkproxy' ? 'text-white' : 'text-cyan'}`}>
                <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span> 
                <span className="mx-2">[{log.agent_id.toUpperCase()}]</span> 
                {log.message}
              </div>
            ))}
            <div className="log-cursor">_</div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .admin-dashboard {
          padding: 2rem;
          color: #fff;
          font-family: 'Space Mono', monospace;
          background: #05080c;
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 2rem;
          border-bottom: 1px solid #1a2c42;
          padding-bottom: 1rem;
        }

        .system-tag {
          color: #00d4ff;
          font-size: 0.8rem;
          letter-spacing: 0.2em;
        }

        h1 {
          font-family: 'Syne', sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0.5rem 0 0 0;
        }

        .header-metrics {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        .mutation-btn {
          background: rgba(0, 212, 255, 0.1);
          border: 1px solid #00d4ff44;
          color: #00d4ff;
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem;
          padding: 0.5rem 1rem;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.1em;
        }

        .mutation-btn:hover:not(:disabled) {
          background: rgba(0, 212, 255, 0.2);
          border-color: #00d4ff;
          box-shadow: 0 0 15px rgba(0, 212, 255, 0.2);
        }

        .mutation-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          border-color: #4a6080;
          color: #4a6080;
        }

        .mutation-btn.loading {
          animation: pulse-border 1s infinite;
        }

        @keyframes pulse-border {
          0% { border-color: rgba(0, 212, 255, 0.4); }
          50% { border-color: #00d4ff; }
          100% { border-color: rgba(0, 212, 255, 0.4); }
        }

        .metric {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .metric .label {
          font-size: 0.6rem;
          color: #4a6080;
        }

        .metric .value {
          font-size: 1rem;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: auto;
          gap: 1.5rem;
        }

        .observatory-section {
          grid-column: span 2;
        }

        @media (max-width: 1024px) {
          .observatory-section {
            grid-column: span 1;
          }
        }

        .dashboard-section {
          background: rgba(10, 18, 30, 0.5);
          border: 1px solid #1a2c42;
          padding: 1.5rem;
          position: relative;
        }

        .section-title {
          font-size: 0.7rem;
          color: #4a6080;
          letter-spacing: 0.2em;
          margin: 0 0 1rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(26, 44, 66, 0.5);
        }

        .agent-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1rem;
        }

        .agent-list.scrollable {
          max-height: 300px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .console-window {
          background: #020406;
          padding: 1rem;
          border: 1px solid #0f1f35;
          height: 300px;
          font-size: 0.75rem;
          overflow-y: hidden;
        }

        .log-line {
          margin-bottom: 0.5rem;
          opacity: 0.8;
        }

        .text-cyan { color: #00d4ff; }
        .text-yellow { color: #f0e05e; }

        .log-cursor {
          display: inline-block;
          width: 8px;
          height: 14px;
          background: #00d4ff;
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .admin-dashboard {
            padding: 1rem;
          }

          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.5rem;
          }

          .header-metrics {
            width: 100%;
            justify-content: space-between;
            gap: 1rem;
          }

          .mutation-btn {
            flex: 1;
            font-size: 0.65rem;
            padding: 0.6rem 0.5rem;
          }

          .metric .value {
            font-size: 0.85rem;
          }

          .agent-list {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }

          .section-title {
            font-size: 0.6rem;
          }
        }

        @media (max-width: 480px) {
          .header-metrics {
            flex-wrap: wrap;
          }

          .mutation-btn {
            order: 3;
            width: 100%;
            margin-top: 0.5rem;
          }

          .agent-list {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem;
          }

          .console-window {
            height: 200px;
            font-size: 0.65rem;
          }
        }
      `}</style>
    </div>
  );
}

function AgentCard({ agent }: { agent: any }) {
  return (
    <div className="agent-card">
      <div className="agent-icon">{agent.icon}</div>
      <div className="agent-info">
        <div className="agent-name">{agent.name}</div>
        <div className="agent-role">{agent.role}</div>
      </div>
      <div className={`agent-status ${agent.status.toLowerCase()}`}>
        {agent.status}
      </div>

      <style jsx>{`
        .agent-card {
          background: #080d14;
          border: 1px solid #1a2c42;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.2s ease;
        }

        .agent-card:hover {
          background: #0d1825;
          border-color: #00d4ff;
          transform: translateX(4px);
        }

        .agent-icon {
          font-size: 1.5rem;
          width: 40px;
          height: 40px;
          background: #0f1f35;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
        }

        .agent-info {
          flex: 1;
        }

        .agent-name {
          font-size: 0.8rem;
          font-weight: 700;
          color: #fff;
        }

        .agent-role {
          font-size: 0.6rem;
          color: #4a6080;
          text-transform: uppercase;
        }

        .agent-status {
          font-size: 0.5rem;
          padding: 0.2rem 0.4rem;
          border-radius: 2px;
          background: #0a121e;
          border: 1px solid #1a2c42;
        }

        .active, .stable, .synced, .beating, .balanced {
          color: #5ef0c0;
          border-color: rgba(94, 240, 192, 0.3);
        }

        .generating, .watching, .meditating {
          color: #00d4ff;
          border-color: rgba(0, 212, 255, 0.3);
        }

        .sleep {
          color: #4a6080;
        }
      `}</style>
    </div>
  );
}
