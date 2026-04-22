"use client";

import { useState, useEffect } from 'react';
import { purgeEntropy, injectCorruption, getSystemState, getSystemHistory } from '../actions';

const styles = {
  container: { 
    backgroundColor: '#050505', 
    color: '#CC0000', 
    fontFamily: "'IBM Plex Mono', monospace", 
    minHeight: '100vh', 
    padding: '2rem' 
  },
  header: { 
    borderBottom: '1px solid #330000', 
    paddingBottom: '1rem', 
    marginBottom: '2rem' 
  },
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
    gap: '2rem' 
  },
  card: { 
    border: '1px solid #330000', 
    padding: '1.5rem', 
    backgroundColor: '#0a0000' 
  },
  button: { 
    backgroundColor: '#1a0000', 
    color: '#FF3333', 
    border: '1px solid #CC0000', 
    padding: '0.5rem 1rem', 
    cursor: 'pointer', 
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    width: '100%',
    marginBottom: '0.5rem'
  },
  metric: {
    fontSize: '2rem',
    color: '#FF0000',
    marginBottom: '0.5rem'
  },
  logContainer: {
    height: '200px', 
    overflowY: 'scroll', 
    fontSize: '0.75rem', 
    color: '#FF6666',
    border: '1px solid #330000',
    padding: '0.5rem',
    backgroundColor: '#000000'
  }
};

export default function OverseerDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [entropyHistory, setEntropyHistory] = useState<any[]>([]);
  const [systemState, setSystemState] = useState<any>(null);
  const [status, setStatus] = useState<string>('SYSTEM ONLINE');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    const state = await getSystemState();
    const history = await getSystemHistory();
    setSystemState(state);
    setEntropyHistory(history);
  };

  const handlePurge = async () => {
    setLoading(true);
    const result = await purgeEntropy();
    setStatus(result.success ? 'ENTROPY PURGED' : 'ERROR');
    await loadData();
    setLoading(false);
  };

  const handleInject = async () => {
    setLoading(true);
    const result = await injectCorruption(10);
    setStatus(result.success ? 'CORRUPTION INJECTED' : 'ERROR');
    await loadData();
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', marginTop: '20%' }}>
          <h1>SYSTEM OVERSEER // ACCESS RESTRICTED</h1>
          <p>IDENTIFICATION REQUIRED</p>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              backgroundColor: '#000', 
              border: '1px solid #CC0000', 
              color: '#CC0000', 
              padding: '10px', 
              fontSize: '1.2rem', 
              fontFamily: 'monospace',
              width: '300px',
              textAlign: 'center'
            }} 
          />
          <br /><br />
          <button 
            onClick={() => {
              if (password === 'ROOT') setIsAuthenticated(true);
              else alert('ACCESS DENIED');
            }}
            style={styles.button}
          >
            AUTHENTICATE
          </button>
          <p style={{ fontSize: '0.8rem', color: '#550000', marginTop: '2rem' }}>
            DEFAULT CREDENTIAL: ROOT
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>SYSTEM OVERSEER // TERMINAL</h1>
        <p>STATUS: {status} {loading && '// PROCESSING...'} // USER: ADMINISTRATOR</p>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3>// GLOBAL METRICS</h3>
          <div style={styles.metric}>
            {systemState ? `${systemState.entropyLevel?.toFixed(2) || 0}%` : '--'}
          </div>
          <p>ENTROPY LEVEL</p>
          <hr style={{ borderColor: '#330000', margin: '1rem 0' }} />
          <p>COHERENCE: {systemState?.totalCoherence || 0}</p>
          <p>CORRUPTION: {systemState?.totalCorruption || 0}</p>
          <p>NODES ABSORBED: {systemState?.totalNodesAbsorbed || 0}</p>
        </div>

        <div style={styles.card}>
          <h3>// MANUAL OVERRIDE</h3>
          <button onClick={handlePurge} style={styles.button} disabled={loading}>
            PURGE ENTROPY
          </button>
          <button onClick={handleInject} style={styles.button} disabled={loading}>
            INJECT CORRUPTION (+10)
          </button>
          <button style={styles.button} disabled={loading}>
            PAUSE SYSTEM
          </button>
        </div>

        <div style={styles.card}>
          <h3>// EVENT LOG</h3>
          <div style={styles.logContainer}>
            {entropyHistory.length === 0 ? (
              <p>// NO EVENTS LOGGED</p>
            ) : (
              entropyHistory.map((evt, i) => (
                <div key={i} style={{ marginBottom: '0.25rem' }}>
                  [{new Date(evt.timestamp).toLocaleTimeString()}] {evt.eventType}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button 
          onClick={() => setIsAuthenticated(false)}
          style={{ ...styles.button, width: 'auto', padding: '0.5rem 2rem' }}
        >
          LOGOUT
        </button>
      </div>
    </div>
  );
}
