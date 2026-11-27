'use client'

// RADAR — piezas compartidas entre pestañas: colores, botones, etiquetas, la clave
// personal y un almacén mínimo sobre localStorage (sin desajustes de hidratación).

export const mono = "'Space Mono', monospace"
export const AMBER = '#ffc86b', GREEN = '#7cf0b0', RED = '#ff7a7a', CYAN = '#9fe8ff', DIM = '#8fa8c4', FAINT = '#6f86a3'
export const clp = (n?: number) => (n === undefined ? '—' : '$' + Math.round(n).toLocaleString('es-CL'))

export const CLAVE_KEY = 'npx-radar-clave'
export const getClave = () => { try { return localStorage.getItem(CLAVE_KEY) || '' } catch { return '' } }
export type EstadoR = { configurada: boolean; valida: boolean; thingiverse: boolean; mercadoLibre: boolean; ia: boolean }

export const Paso = ({ n, children }: { n: string; children: React.ReactNode }) => <li style={{ fontSize: 12, lineHeight: 1.9, color: DIM }}><b style={{ color: '#fff' }}>{n}</b> {children}</li>

export function Chip({ on, onClick, children, color = AMBER }: { on: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return <button type="button" className="press" aria-pressed={on} onClick={onClick} style={{ minHeight: 36, padding: '0 12px', flexShrink: 0, whiteSpace: 'nowrap', fontFamily: mono, fontSize: 11.5, letterSpacing: 1.2, cursor: 'pointer', background: on ? `${color}22` : 'transparent', border: `1px solid ${on ? color : '#ffffff26'}`, color: on ? color : '#9fb4cc' }}>{children}</button>
}
export const Tag = ({ children, c = DIM }: { children: React.ReactNode; c?: string }) => <span style={{ fontSize: 10.5, letterSpacing: 1, padding: '2px 7px', border: `1px solid ${c}55`, color: c, whiteSpace: 'nowrap' }}>{children}</span>
export const A = ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: CYAN, fontSize: 11.5, textDecoration: 'none', borderBottom: `1px solid ${CYAN}44`, padding: '6px 0', display: 'inline-block' }}>{children}</a>

// almacén para useSyncExternalStore: lee una vez, escribe y avisa a quien escucha
export function almacen<T>(key: string, inicial: T, leer: (v: unknown) => T | null) {
  let cache: T | null = null
  const subs = new Set<() => void>()
  return {
    subscribe(cb: () => void) { subs.add(cb); return () => { subs.delete(cb) } },
    get(): T {
      if (cache === null) {
        try { const raw = localStorage.getItem(key); cache = raw ? leer(JSON.parse(raw)) ?? inicial : inicial } catch { cache = inicial }
      }
      return cache
    },
    server(): T { return inicial },
    set(v: T) { cache = v; try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* sin almacenamiento */ } subs.forEach((f) => f()) },
  }
}
