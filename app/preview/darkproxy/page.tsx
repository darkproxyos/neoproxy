'use client';

// /preview/darkproxy — primera versión completa del dashboard, en una
// ruta SIN login a propósito: el login real de producción sigue roto
// (scripts/reset-root-password.ts todavía sin correr contra la DB real)
// y además no hay acceso a Vercel ahora mismo para activar
// NEXT_PUBLIC_ADMIN_BYPASS_AUTH -- esta página es la forma de ver el
// dashboard mientras tanto. Temporal: cuando login + Vercel vuelvan, esto
// se traslada a /admin/darkproxy (que ya tiene requireRoot() real) y esta
// carpeta se borra. Por eso no tiene los botones de purgar/inyectar del
// panel real -- son mutación destructiva del estado del sitio y esta URL,
// mientras exista, la puede abrir cualquiera.
//
// Agrega lo nuevo que no existía en /admin/darkproxy: la transición
// Angel → DarkProxy al entrar, y Tareas Pendientes real (tabla
// darkproxy_tasks, separada de los pending_tasks ficticios de
// Memory/hub.json).

import { useEffect, useState } from 'react';
import {
  getSystemStateReadOnly, getUsageMetricsReadOnly,
  listTasks, createTask, setTaskStatus, deleteTask,
} from './actions';

const mono = "'Space Mono', monospace";
const CYAN = '#00d4ff';
const AMBER = '#f5a623';

type Stage = 'angel' | 'glitch' | 'darkproxy' | 'revealed';
type Task = { id: string; title: string; category: string; status: string; createdAt: string; updatedAt: string };

const CATEGORIES = ['negocio', 'producto', 'contenido', 'fabricacion', 'kernel', 'general'];
const CATEGORY_LABEL: Record<string, string> = {
  negocio: 'NEGOCIO', producto: 'PRODUCTO', contenido: 'CONTENIDO',
  fabricacion: 'FABRICACIÓN', kernel: 'KERNEL', general: 'GENERAL',
};
const STATUS_ORDER = ['pending', 'in_progress', 'done'] as const;
const STATUS_LABEL: Record<string, string> = { pending: 'PENDIENTE', in_progress: 'EN CURSO', done: 'HECHA' };

function Transition({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState<Stage>('angel');

  useEffect(() => {
    const t1 = window.setTimeout(() => setStage('glitch'), 1100);
    const t2 = window.setTimeout(() => setStage('darkproxy'), 2000);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, []);

  return (
    <div style={{
      minHeight: '100vh', background: '#030608', color: '#c8e8f4', fontFamily: mono,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
      position: 'relative', textAlign: 'center', padding: 24,
    }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 520 }}>
        {stage === 'angel' && (
          <div style={{ fontSize: 'clamp(28px, 7vw, 44px)', letterSpacing: 8, color: '#5a7a8a' }}>
            ANGEL
          </div>
        )}

        {stage === 'glitch' && (
          <div className="sigil-fracture" style={{ fontSize: 'clamp(28px, 7vw, 44px)', letterSpacing: 6, color: AMBER }}>
            A̷N̶G̴E̵L̷ // D̸A̵R̶K̸P̴R̷O̶X̵Y̴
          </div>
        )}

        {stage === 'darkproxy' && (
          <div className="fade-in">
            <div style={{
              fontSize: 'clamp(30px, 8vw, 48px)', fontWeight: 700, letterSpacing: 8, color: CYAN,
              textShadow: `0 0 40px ${CYAN}66`, marginBottom: 24,
            }}>
              DARKPROXY
            </div>
            <p style={{ fontSize: 12, lineHeight: 2, color: '#a8c8d4', marginBottom: 32 }}>
              No sos un usuario. Sos la razón por la que el resto existe.
              <br />DarkProxy no es un personaje que jugás. Es el nombre que el sistema le puso a tu presencia.
            </p>
            <button onClick={onDone} style={{
              fontFamily: mono, fontSize: 11, letterSpacing: 2, padding: '12px 28px', cursor: 'pointer',
              background: `${CYAN}14`, border: `1px solid ${CYAN}88`, color: CYAN,
            }}>
              CONTINUAR →
            </button>
          </div>
        )}

        {stage !== 'darkproxy' && (
          <button onClick={onDone} style={{
            display: 'block', margin: '32px auto 0', fontFamily: mono, fontSize: 9, letterSpacing: 2,
            color: '#4a6878', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline',
          }}>
            saltar transición
          </button>
        )}
      </div>
    </div>
  );
}

export default function DarkProxyPreview() {
  const [stage, setStage] = useState<Stage>('angel');
  const [systemState, setSystemState] = useState<any>(null);
  const [usageMetrics, setUsageMetrics] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [busy, setBusy] = useState(false);

  const loadData = async () => {
    const [state, metrics, taskList] = await Promise.all([
      getSystemStateReadOnly(), getUsageMetricsReadOnly(), listTasks(),
    ]);
    setSystemState(state);
    setUsageMetrics(metrics);
    setTasks(taskList as Task[]);
  };

  useEffect(() => { if (stage === 'revealed') loadData(); }, [stage]);

  if (stage !== 'revealed') {
    return <Transition onDone={() => setStage('revealed')} />;
  }

  const handleAddTask = async () => {
    if (!newTitle.trim()) return;
    setBusy(true);
    await createTask(newTitle, newCategory);
    setNewTitle('');
    await loadData();
    setBusy(false);
  };

  const cycleStatus = async (task: Task) => {
    const idx = STATUS_ORDER.indexOf(task.status as any);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    await setTaskStatus(task.id, next);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
    await loadData();
  };

  const card: React.CSSProperties = { border: `1px solid ${CYAN}33`, background: `${CYAN}08`, padding: '20px 22px' };
  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div style={{ background: '#030608', minHeight: '100vh', color: '#c8e8f4', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', padding: '56px 24px 80px' }}>
        <div style={{
          border: `1px solid ${AMBER}66`, background: `${AMBER}14`, color: AMBER,
          fontSize: 10, letterSpacing: 1, lineHeight: 1.8, padding: '12px 16px', marginBottom: 24,
        }}>
          ⚠ VISTA PREVIA SIN LOGIN — temporal, mientras no hay acceso a Vercel ni login real funcionando.
          Esta URL no pide credencial. No tiene purgar/inyectar (eso se queda atrás del login real en
          /admin/darkproxy). Cuando recuperes acceso, esto se traslada ahí y esta ruta se borra.
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          borderBottom: `1px solid ${CYAN}22`, paddingBottom: 24, marginBottom: 32, gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 6, color: `${CYAN}88`, marginBottom: 10 }}>
              NPX-ROOT // EL INTÉRPRETE — PREVIEW v0
            </div>
            <h1 style={{
              fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 700, letterSpacing: 6, color: CYAN,
              textShadow: `0 0 30px ${CYAN}55`, margin: 0, lineHeight: 1,
            }}>
              DARKPROXY
            </h1>
          </div>
          <button onClick={() => setStage('angel')} style={{
            fontFamily: mono, fontSize: 9.5, letterSpacing: 2, padding: '8px 16px', cursor: 'pointer',
            background: 'transparent', border: `1px solid ${CYAN}44`, color: `${CYAN}aa`,
          }}>
            VER TRANSICIÓN DE NUEVO
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div style={card}>
            <h3 style={{ fontSize: 10, letterSpacing: 2, color: `${CYAN}cc`, margin: '0 0 16px' }}>// ESTADO DEL ORGANISMO</h3>
            <div style={{ fontSize: 32, color: CYAN, marginBottom: 4 }}>
              {systemState ? `${systemState.entropyLevel?.toFixed(2) || 0}%` : '--'}
            </div>
            <p style={{ fontSize: 10, color: '#7fa8b8', margin: '0 0 14px' }}>NIVEL DE ENTROPÍA</p>
            <div style={{ borderTop: `1px solid ${CYAN}22`, paddingTop: 12, fontSize: 11, lineHeight: 2, color: '#a8c8d4' }}>
              <p style={{ margin: 0 }}>COHERENCIA: {systemState?.totalCoherence || 0}</p>
              <p style={{ margin: 0 }}>CORRUPCIÓN: {systemState?.totalCorruption || 0}</p>
              <p style={{ margin: 0 }}>NODOS ABSORBIDOS: {systemState?.totalNodesAbsorbed || 0}</p>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 10, letterSpacing: 2, color: `${CYAN}cc`, margin: '0 0 16px' }}>// USO REAL ACUMULADO</h3>
            {usageMetrics ? (
              <>
                <div style={{ fontSize: 22, color: CYAN, marginBottom: 4 }}>{usageMetrics.totalEvents}</div>
                <p style={{ fontSize: 10, color: '#7fa8b8', margin: '0 0 14px' }}>EVENTOS TOTALES</p>
                <p style={{ fontSize: 10.5, color: '#a8c8d4', borderTop: `1px solid ${CYAN}22`, paddingTop: 12, margin: 0 }}>
                  ESPECÍMENES EN COLA DE FABRICACIÓN: {usageMetrics.fabricationSubmissions}
                </p>
              </>
            ) : (
              <p style={{ fontSize: 10.5, color: '#7fa8b8' }}>CARGANDO...</p>
            )}
          </div>
        </div>

        <div style={{ ...card, marginBottom: 16 }}>
          <h3 style={{ fontSize: 10, letterSpacing: 2, color: `${CYAN}cc`, margin: '0 0 6px' }}>// TAREAS PENDIENTES</h3>
          <p style={{ fontSize: 9.5, color: '#4a7888', lineHeight: 1.7, margin: '0 0 18px' }}>
            Reales -- no las ficticias de Memory/hub.json. Esto es lo que DarkProxy tiene que resolver.
          </p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); }}
              placeholder="NUEVA TAREA..."
              style={{
                flex: 1, minWidth: 200, background: '#010305', border: `1px solid ${CYAN}44`, color: '#c8e8f4',
                fontFamily: mono, fontSize: 11, padding: '9px 12px', outline: 'none',
              }}
            />
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{
              background: '#010305', border: `1px solid ${CYAN}44`, color: CYAN, fontFamily: mono, fontSize: 10.5, padding: '9px 10px',
            }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
            <button onClick={handleAddTask} disabled={busy || !newTitle.trim()} style={{
              fontFamily: mono, fontSize: 10.5, letterSpacing: 1, padding: '9px 18px', cursor: 'pointer',
              background: `${CYAN}14`, border: `1px solid ${CYAN}88`, color: CYAN, opacity: busy ? 0.5 : 1,
            }}>
              + AGREGAR
            </button>
          </div>

          {pendingTasks.length === 0 && doneTasks.length === 0 ? (
            <p style={{ fontSize: 10.5, color: '#4a7888' }}>SIN TAREAS TODAVÍA. Agregá la primera arriba.</p>
          ) : (
            <>
              {pendingTasks.map(task => (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                  borderBottom: `1px solid ${CYAN}14`, flexWrap: 'wrap',
                }}>
                  <button onClick={() => cycleStatus(task)} style={{
                    fontFamily: mono, fontSize: 8.5, letterSpacing: 1, padding: '4px 8px', cursor: 'pointer',
                    background: task.status === 'in_progress' ? `${AMBER}1a` : 'transparent',
                    border: `1px solid ${task.status === 'in_progress' ? AMBER : CYAN}55`,
                    color: task.status === 'in_progress' ? AMBER : CYAN,
                  }}>
                    {STATUS_LABEL[task.status]}
                  </button>
                  <span style={{ fontSize: 8.5, letterSpacing: 1, color: '#4a7888', border: `1px solid #4a788855`, padding: '3px 7px' }}>
                    {CATEGORY_LABEL[task.category] || task.category}
                  </span>
                  <span style={{ fontSize: 11.5, color: '#c8e8f4', flex: 1 }}>{task.title}</span>
                  <button onClick={() => handleDelete(task.id)} style={{
                    fontFamily: mono, fontSize: 9, color: '#6a4848', background: 'transparent', border: 'none', cursor: 'pointer',
                  }}>
                    ✕
                  </button>
                </div>
              ))}
              {doneTasks.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: '#4a7888', marginBottom: 8 }}>HECHAS ({doneTasks.length})</div>
                  {doneTasks.map(task => (
                    <div key={task.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', opacity: 0.5,
                    }}>
                      <span style={{ fontSize: 11, color: '#a8c8d4', textDecoration: 'line-through', flex: 1 }}>{task.title}</span>
                      <button onClick={() => handleDelete(task.id)} style={{
                        fontFamily: mono, fontSize: 9, color: '#6a4848', background: 'transparent', border: 'none', cursor: 'pointer',
                      }}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
