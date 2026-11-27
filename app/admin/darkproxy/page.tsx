"use client";

// DARKPROXY // TERMINAL — antes "/admin/overseer". Mismo panel, mismos
// datos reales (systemState, memory_events, fabrication) — lo que cambió
// es lo que esto *es*: no un admin panel genérico con gate de contraseña
// cosmético, sino la interfaz de DarkProxy, que ya en
// components/proxyverse/agents.ts (color #00d4ff, rol "EL INTÉRPRETE //
// ROOT") está descrito como "el nombre que el sistema le puso a tu
// presencia" — no un personaje que se juega, la persona real detrás del
// teclado. El gate `password === 'ROOT'` que tenía esta página no
// protegía nada (la protección real es requireRoot() en actions.ts, y
// antes de eso middleware.ts ya exige sesión para llegar hasta /admin);
// quitarlo no cambia la seguridad, solo quita el teatro redundante.

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { purgeEntropy, injectCorruption, getSystemState, getSystemHistory, getUsageMetrics } from '../actions';

const mono = "'Space Mono', monospace";
const CYAN = '#00d4ff';
const AMBER = '#f5a623';

export default function DarkProxyTerminal() {
  // Visible en el cliente a propósito -- si NEXT_PUBLIC_ADMIN_BYPASS_AUTH
  // está en "true" en Vercel, nadie debería poder olvidarlo mirando esta
  // pantalla. Ver middleware.ts y app/admin/actions.ts.
  const bypassActive = process.env.NEXT_PUBLIC_ADMIN_BYPASS_AUTH === 'true';
  const [entropyHistory, setEntropyHistory] = useState<any[]>([]);
  const [systemState, setSystemState] = useState<any>(null);
  const [usageMetrics, setUsageMetrics] = useState<any>(null);
  const [status, setStatus] = useState<string>('ENLACE ESTABLE');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const state = await getSystemState();
    const history = await getSystemHistory();
    const metrics = await getUsageMetrics();
    setSystemState(state);
    setEntropyHistory(history);
    setUsageMetrics(metrics);
  };

  const handlePurge = async () => {
    setLoading(true);
    const result = await purgeEntropy();
    setStatus(result.success ? 'ENTROPÍA PURGADA' : 'ERROR');
    await loadData();
    setLoading(false);
  };

  const handleInject = async () => {
    setLoading(true);
    const result = await injectCorruption(10);
    setStatus(result.success ? 'CORRUPCIÓN INYECTADA' : 'ERROR');
    await loadData();
    setLoading(false);
  };

  const card: React.CSSProperties = {
    border: `1px solid ${CYAN}33`,
    background: `${CYAN}08`,
    padding: '20px 22px',
  };
  const button: React.CSSProperties = {
    display: 'block',
    width: '100%',
    marginBottom: 8,
    padding: '10px 14px',
    fontFamily: mono,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    cursor: 'pointer',
    background: `${CYAN}14`,
    border: `1px solid ${CYAN}66`,
    color: CYAN,
  };

  return (
    <div style={{ background: '#030608', minHeight: '100vh', color: '#c8e8f4', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', padding: '56px 24px 80px' }}>
        {bypassActive && (
          <div style={{
            border: `1px solid ${AMBER}66`, background: `${AMBER}14`, color: AMBER,
            fontSize: 11, letterSpacing: 1, lineHeight: 1.8, padding: '12px 16px', marginBottom: 24,
          }}>
            ⚠ ACCESO SIN SESIÓN ACTIVO — NEXT_PUBLIC_ADMIN_BYPASS_AUTH=true. Cualquiera con esta URL
            entra sin login, incluidas purgar entropía / inyectar corrupción. Borrar la variable en
            Vercel apenas el login real funcione.
          </div>
        )}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          borderBottom: `1px solid ${CYAN}22`, paddingBottom: 24, marginBottom: 32, gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: 6, color: `${CYAN}88`, marginBottom: 10 }}>
              NPX-ROOT // EL INTÉRPRETE
            </div>
            <h1 style={{
              fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 700, letterSpacing: 6, color: CYAN,
              textShadow: `0 0 30px ${CYAN}55`, margin: 0, lineHeight: 1,
            }}>
              DARKPROXY
            </h1>
            <p style={{ fontSize: 11.5, color: '#7fa8b8', letterSpacing: 0.5, marginTop: 10, maxWidth: 480, lineHeight: 1.8 }}>
              No es un personaje. Es el nombre que el sistema le puso a tu presencia — esto es lo que
              ves cuando entrás como root.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#7fa8b8', marginBottom: 10 }}>
              {status} {loading && '// PROCESANDO...'}
            </div>
            <a href="/radar" style={{
              fontFamily: mono, fontSize: 11, letterSpacing: 2, padding: '8px 16px', marginRight: 8, display: 'inline-block',
              border: `1px solid ${AMBER}88`, color: AMBER, textDecoration: 'none',
            }}>
              RADAR // NEGOCIO →
            </a>
            <button onClick={() => signOut({ callbackUrl: '/login' })} style={{
              fontFamily: mono, fontSize: 11, letterSpacing: 2, padding: '8px 16px', cursor: 'pointer',
              background: 'transparent', border: `1px solid ${CYAN}44`, color: `${CYAN}aa`,
            }}>
              CERRAR SESIÓN
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <div style={card}>
            <h3 style={{ fontSize: 11, letterSpacing: 2, color: `${CYAN}cc`, margin: '0 0 16px' }}>// MÉTRICAS GLOBALES</h3>
            <div style={{ fontSize: 32, color: CYAN, marginBottom: 4 }}>
              {systemState ? `${systemState.entropyLevel?.toFixed(2) || 0}%` : '--'}
            </div>
            <p style={{ fontSize: 11, color: '#7fa8b8', margin: '0 0 14px' }}>NIVEL DE ENTROPÍA</p>
            <div style={{ borderTop: `1px solid ${CYAN}22`, paddingTop: 12, fontSize: 12, lineHeight: 2, color: '#a8c8d4' }}>
              <p style={{ margin: 0 }}>COHERENCIA: {systemState?.totalCoherence || 0}</p>
              <p style={{ margin: 0 }}>CORRUPCIÓN: {systemState?.totalCorruption || 0}</p>
              <p style={{ margin: 0 }}>NODOS ABSORBIDOS: {systemState?.totalNodesAbsorbed || 0}</p>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 11, letterSpacing: 2, color: `${CYAN}cc`, margin: '0 0 16px' }}>// OVERRIDE MANUAL</h3>
            <button onClick={handlePurge} style={button} disabled={loading}>Purgar entropía</button>
            <button onClick={handleInject} style={button} disabled={loading}>Inyectar corrupción (+10)</button>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 11, letterSpacing: 2, color: `${CYAN}cc`, margin: '0 0 16px' }}>// USO REAL ACUMULADO</h3>
            {usageMetrics ? (
              <>
                <div style={{ fontSize: 22, color: CYAN, marginBottom: 4 }}>{usageMetrics.totalEvents}</div>
                <p style={{ fontSize: 11, color: '#7fa8b8', margin: '0 0 14px' }}>EVENTOS TOTALES EN MEMORY_EVENTS</p>
                <div style={{ borderTop: `1px solid ${CYAN}22`, paddingTop: 12, fontSize: 11.5, lineHeight: 1.9, color: '#a8c8d4' }}>
                  {usageMetrics.byType.length === 0 ? (
                    <p style={{ margin: 0 }}>SIN EVENTOS TODAVÍA</p>
                  ) : (
                    usageMetrics.byType
                      .sort((a: any, b: any) => b.count - a.count)
                      .map((c: any) => <p key={c.eventType} style={{ margin: 0 }}>{c.eventType}: {c.count}</p>)
                  )}
                </div>
                <p style={{ fontSize: 11.5, color: '#a8c8d4', borderTop: `1px solid ${CYAN}22`, marginTop: 12, paddingTop: 12 }}>
                  ESPECÍMENES EN COLA DE FABRICACIÓN: {usageMetrics.fabricationSubmissions}
                </p>
              </>
            ) : (
              <p style={{ fontSize: 11.5, color: '#7fa8b8' }}>CARGANDO...</p>
            )}
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 11, letterSpacing: 2, color: `${CYAN}cc`, margin: '0 0 16px' }}>// REGISTRO DE EVENTOS</h3>
            <div style={{ height: 200, overflowY: 'auto', fontSize: 11.5, color: '#a8c8d4' }}>
              {entropyHistory.length === 0 ? (
                <p>// SIN EVENTOS REGISTRADOS</p>
              ) : (
                entropyHistory.map((evt, i) => (
                  <div key={i} style={{ marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid ${CYAN}14` }}>
                    [{new Date(evt.timestamp).toLocaleTimeString()}] {evt.eventType}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
