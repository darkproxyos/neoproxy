# NeoProxy (neoproxy.art)

Ecosistema ciberpunk-industrial: web Next.js + kernel de agentes Python + FPGA + fabricación en resina + artefactos NFC.
Filosofía: el software se comporta como un organismo vivo (modular, reactivo, observable). Estética: Ghost in the Shell, Ergo Proxy, Serial Experiments Lain, Giger.

Este repo (`neoproxy-art/neoproxy`, local `/home/user/neoproxy`) es el único destino de despliegue (Vercel). Otros repos relacionados (`neoproxy-lab`, `digitalseed`, `npos-shell`, `_archive_neoproxy_repo`) viven aparte — el motor NMK, FPGA y el orquestador de `digitalseed` NO están en este repo.

## Stack
Next.js 16.1.6 (App Router, Turbopack), TypeScript, Babylon.js/Three.js/R3F, NextAuth v5 (Credentials provider, sin adapter — ver Auth), Drizzle ORM, Turso/libSQL (`neoproxy-prod`), Mercado Pago (`/api/checkout`), Pusher. Deploy: Vercel (`npx vercel --prod --force`).

## Agentes (solo 6, conceptuales — no todos tienen código en este repo)
DarkProxy (root), Metatron (orquestador), D (daemon), Snake (Runtime.Python), Genos (geometría/fabricación), Trickster (exploración).
Cascade y Antigravity son herramientas externas, NO agentes. No crear entradas en `Memory/hub.json` para ellas.
`Memory/hub.json` hoy solo tiene la entrada `metatron` — no asumir que las otras 5 existen como estado real hasta que se agreguen.

## Auth y datos (verificado en código, no en docs viejas)
- `auth.ts` es un `Credentials` provider con hash SHA-256 manual contra `users.passwordHash` — **no usa `DrizzleAdapter`**. Consulta vía `lib/core-db`, que apunta a Turso (`TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN`).
- `src/db/index.ts` y `lib/core-db/index.ts` apuntan a la **misma instancia Turso**.
- `src/db/db/index.ts` es un tercer cliente (`better-sqlite3` local, `neoproxy_memory.sqlite`) que **nada en el repo importa** — código huérfano, candidato a borrar, no a "migrar".
- `middleware.ts` protege actualmente `/admin/:path*` y `/kernel/:path*` (no `/npos`). Si la intención es proteger `/npos`, el matcher hay que actualizarlo explícitamente — hoy no lo hace.
- `app/admin/overseer/page.tsx` usa un gate `password === 'ROOT'` **puramente client-side** para un dashboard cuyas Server Actions (`app/admin/actions.ts`) no chequean rol en servidor. Cualquier sesión autenticada (no solo `role: 'root'`) puede llegar a esas acciones. Si se agrega un segundo rol de usuario, esto es escalación de privilegios inmediata — arreglarlo antes de eso.

## Reglas de operación
- Sin nuevas capas de arquitectura hasta que haya un resultado visible en pantalla o en hardware.
- La arquitectura Mission/Intent/Pipeline/Event Bus/Capability Registry es visión futura (Fase B/C), NO implementar ahora. `hub.json` se queda como está salvo pedido explícito.
- Verificar antes de afirmar: `git blame`, `git log` o inspección de archivos. Un resumen de completado no aprueba un cambio arquitectónico ni confirma un pendiente.
- `npm run build` debe pasar antes de cada commit. Un commit por cada asunto. Sin push si el build falla.
- Los parámetros de fabricación (Genesis Nodes, máscaras) se documentan en JSON antes de producir cualquier pieza física.
- Turso: tokens a nivel de grupo (`turso group tokens invalidate default`, `turso db tokens create neoproxy-prod`).
- Variables de entorno con el prompt interactivo de `vercel env add`, nunca por pipe.
- FPGA (repo aparte): `openFPGALoader`, no `quartus_pgm` (clones USB-Blaster incompatibles). `.sof` → `.rbf` con `quartus_cpf -c`, luego `sudo openFPGALoader --cable usb-blaster --file-type rbf archivo.rbf`. `-f` escribe a flash, cuidado.

## Pendientes abiertos (estado verificado contra este repo)
- **TS error en `app/games/wired/page.tsx`**: usa `CoherenceSystem` y `MemoryBridge` sin importarlas. Ambas clases existen (`src/systems/CoherenceSystem.ts`, `src/bridge/MemoryBridge.ts`) — el fix es agregar los dos imports, no crear código nuevo.
- **Overseer auth**: mover el chequeo de `role`/contraseña de `app/admin/overseer/page.tsx` (client) a `app/admin/actions.ts` (server), verificando `auth()` y `role === 'root'` ahí.
- **`src/db/db/index.ts`**: cliente SQLite local huérfano, sin imports en todo el repo. Confirmar que no se necesita y borrarlo, o documentar por qué existe.
- **GitHub PAT expuesto**: no encontrado en este repo (ni en `git log --all -p` ni en el árbol de trabajo). Si el leak es real, está en otro repo o medio — confirmar ahí, no acá.
- **NMK / Genesis Nodes / FPGA**: no hay código de esto en `neoproxy-art/neoproxy`. Vive en `neoproxy-lab` o `digitalseed`. No asumir su estado desde este repo.
- **`app/shop/hardware` y `app/shop/components`**: no existen en este repo hoy (solo `app/shop/drop01` y `app/shop/success`). Si se van a construir, son módulos nuevos, no un fix.
- Mapeo de pines LED del TRNG (EP4CE6E22C8): fuera de este repo, no verificable acá.
