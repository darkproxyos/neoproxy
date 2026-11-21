// Datos reales de la arquitectura técnica de NeoProxy (no el contenido del
// sitio, que ya cubren /experimental/graficos y /experimental/cartografia)
// -- verificados contra el código antes de escribir esto: middleware.ts,
// auth.ts, src/db/schema.ts, lib/core-db/schema.ts, package.json,
// Memory/hub.json, vercel.json, y un conteo real de app/api/**/route.ts.

export type ArchBox = {
  id: string
  label: string
  sub: string
  x: number; y: number; w: number; h: number
  color: string
  detail: string[]
  href?: string
}

export type ArchArrow = { from: string; to: string; reverse?: boolean }

export const ARCH_BOXES: ArchBox[] = [
  {
    id: 'cliente', label: 'NAVEGADOR DEL USUARIO', sub: 'React 19.2.3, renderizado en el cliente',
    x: 230, y: 20, w: 540, h: 70, color: '#00d4ff',
    detail: [
      'React 19.2.3 + Next.js App Router -- la mayoría de las páginas son Client Components ("use client").',
      'Librerías 3D/datos cargadas bajo demanda, sin SSR: Babylon.js 6.49 (juegos, el holograma de Wetware), Three.js 0.183 + React Three Fiber 9.5 + Drei (visor de especímenes), D3 7.9 (gráficos y cartografía).',
    ],
  },
  {
    id: 'app', label: 'NEXT.JS 16.1.6', sub: 'App Router + Turbopack — ~95 rutas reales',
    x: 230, y: 130, w: 540, h: 70, color: '#ffffff',
    detail: [
      '~95 rutas reales (el árbol completo está en /experimental/cartografia).',
      'next.config.mjs ignora errores de ESLint y de TypeScript durante el build a propósito (ignoreDuringBuilds / ignoreBuildErrors) -- un detalle real, no decorativo: el build pasa en verde aunque haya errores de tipos.',
      'Deploy en Vercel (npx vercel --prod --force).',
    ],
  },
  {
    id: 'middleware', label: 'MIDDLEWARE.TS + NEXTAUTH', sub: 'el único portón real del sitio',
    x: 50, y: 250, w: 340, h: 70, color: '#ffd60a',
    detail: [
      'Matcher real: solo protege /admin/:path*, /kernel/:path* y /login -- todo lo demás es público.',
      'NextAuth v5 (beta), provider Credentials: hash SHA-256 manual contra users.passwordHash, sin DrizzleAdapter.',
      'Bypass de auth en /admin solo si NEXT_PUBLIC_ADMIN_BYPASS_AUTH=true (apagado por default) -- nunca afecta /kernel.',
    ],
  },
  {
    id: 'servidor', label: 'API ROUTES + SERVER ACTIONS', sub: '35 endpoints reales + acciones de servidor',
    x: 610, y: 250, w: 340, h: 70, color: '#ff6b35',
    detail: [
      '35 archivos route.ts reales bajo app/api (conteo exacto, no aproximado) -- ver el desglose por categoría más abajo.',
      'Server Actions, ej. app/admin/actions.ts: requireRoot() verifica auth() + session.user.role === \'root\' server-side antes de tocar la base, para las 4 acciones del dashboard de DarkProxy.',
    ],
  },
  {
    id: 'datos', label: 'DRIZZLE ORM → TURSO / libSQL', sub: 'neoproxy-prod',
    x: 230, y: 400, w: 540, h: 70, color: '#00ff9d',
    detail: [
      'Dos clientes Drizzle reales en el código (src/db/index.ts y lib/core-db/index.ts) apuntando a la MISMA instancia Turso -- no son dos bases distintas.',
      '13 tablas reales en total -- ver el desglose por área más abajo.',
      'No confundir con Memory/hub.json: ese es un archivo del repo, no una tabla de esta base (aunque lib/core-db sí tiene una tabla llamada literalmente "memory" -- son dos cosas distintas con nombre parecido).',
    ],
  },
  {
    id: 'mercadopago', label: 'MERCADO PAGO', sub: '/api/checkout',
    x: 60, y: 520, w: 220, h: 64, color: '#b400ff',
    detail: [
      'Único checkout real de pago del sitio -- Drop 01 (/shop/drop01), vía Preference de la SDK de Mercado Pago.',
      'El resto de /shop (insumos, impresión 3D, modelos 3D) usa un CTA a WhatsApp, no pasa por acá.',
    ],
  },
  {
    id: 'pusher', label: 'PUSHER', sub: 'tiempo real',
    x: 320, y: 520, w: 220, h: 64, color: '#b400ff',
    detail: [
      'Canales reales de presencia (cursores fantasma, /api/presence/*) y chat/consejo del Proxyverse.',
      '/api/pusher/auth autoriza los canales privados antes de que el cliente se suscriba.',
    ],
  },
  {
    id: 'cron', label: 'VERCEL CRON', sub: '3 jobs reales (vercel.json)',
    x: 580, y: 520, w: 220, h: 64, color: '#b400ff',
    detail: [
      'agent-dreams -- diario 09:00 (diario de los agentes).',
      'consejo-nocturno -- domingos 10:00 (sueño colectivo semanal).',
      'entropy-entity -- diario 04:00 (señal de la entidad Entropy).',
      'Los tres disparan un route.ts bajo app/api/cron -- no al revés.',
    ],
  },
  {
    id: 'hubjson', label: 'MEMORY/HUB.JSON', sub: 'archivo real del repo, no una tabla',
    x: 100, y: 650, w: 380, h: 70, color: '#c9a24d',
    detail: [
      'Leído con fs directo desde el filesystem del deploy (ver app/api/system/soul-state/route.ts, que además corre git log --since vía child_process para commits reales de los últimos 30 días).',
      'Claves reales: kernel, pending_tasks, log.',
      'No es una base de datos ni se sincroniza con Turso -- es un archivo versionado en git, se edita con un commit como cualquier otro.',
    ],
  },
  {
    id: 'agentes', label: 'LOS 6 STUBS DEL KERNEL', sub: 'metatron, d, snake, genos, trickster, prototype',
    x: 520, y: 650, w: 380, h: 70, color: '#c9a24d',
    detail: [
      'Los 6 son status: "idle" reales en hub.json -- current_intent, current_pipeline y running_agents vacíos en los 6.',
      'Solo metatron tiene pending_tasks reales (5 tareas de contenido 3D anotadas, nunca ejecutadas por ninguna lógica real).',
      'DarkProxy NO tiene entrada de kernel -- es el root/jugador humano, nunca un proceso.',
      'La arquitectura Mission/Intent/Pipeline/Event Bus que haría esto real sigue sin implementarse (Fase B/C, a propósito) -- ver /archivo/linux sección XII para la comparación honesta con un kernel real.',
    ],
    href: '/archivo/linux',
  },
]

export const ARCH_ARROWS: ArchArrow[] = [
  { from: 'cliente', to: 'app' },
  { from: 'app', to: 'middleware' },
  { from: 'app', to: 'servidor' },
  { from: 'middleware', to: 'datos' },
  { from: 'servidor', to: 'datos' },
  { from: 'servidor', to: 'mercadopago' },
  { from: 'servidor', to: 'pusher' },
  { from: 'cron', to: 'servidor', reverse: true },
  { from: 'servidor', to: 'hubjson' },
  { from: 'hubjson', to: 'agentes' },
]

export const API_ROUTES_BY_CATEGORY = [
  { label: 'SISTEMA', count: 7, color: '#4a6080' },
  { label: 'KERNEL / ADMIN', count: 5, color: '#c9a24d' },
  { label: 'PROXYVERSE', count: 5, color: '#00ff9d' },
  { label: 'REALTIME (PUSHER)', count: 4, color: '#b400ff' },
  { label: 'FABRICACIÓN', count: 4, color: '#5f95c9' },
  { label: 'CRON', count: 3, color: '#ffd60a' },
  { label: 'ECONOMÍA (SIGNAL)', count: 2, color: '#ff6b35' },
  { label: 'EXPERIMENTAL', count: 2, color: '#cc0000' },
  { label: 'AUTH', count: 1, color: '#ffffff' },
  { label: 'PAGOS (MERCADO PAGO)', count: 1, color: '#00d4ff' },
  { label: 'REALIDAD AUMENTADA', count: 1, color: '#ff2ecb' },
]

export const DB_TABLES_BY_AREA = [
  { label: 'KERNEL / DASHBOARD ADMIN', count: 4, color: '#c9a24d', tables: ['system_state', 'memory_events', 'memory', 'events'] },
  { label: 'PREVIEW DARKPROXY', count: 3, color: '#00ff9d', tables: ['darkproxy_tasks', 'mind_entries', 'money_log'] },
  { label: 'AUTH', count: 2, color: '#ffffff', tables: ['users', 'sessions'] },
  { label: 'FABRICACIÓN', count: 2, color: '#5f95c9', tables: ['fabrication_submissions', 'fabrication_votes'] },
  { label: 'ECONOMÍA (SIGNAL)', count: 1, color: '#ff6b35', tables: ['signal_transactions'] },
  { label: 'DIARIO DE AGENTES', count: 1, color: '#b400ff', tables: ['agent_diary_entries'] },
]
