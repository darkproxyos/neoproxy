# NeoProxy (neoproxy.art)

Ecosistema ciberpunk-industrial: web Next.js + kernel de agentes Python + FPGA + fabricación en resina + artefactos NFC.
Filosofía: el software se comporta como un organismo vivo (modular, reactivo, observable). Estética: Ghost in the Shell, Ergo Proxy, Serial Experiments Lain, Giger.

Este repo (`neoproxy-art/neoproxy`, local `/home/user/neoproxy`) es el único destino de despliegue (Vercel). Otros repos relacionados (`neoproxy-lab`, `digitalseed`, `npos-shell`, `_archive_neoproxy_repo`) viven aparte — el motor NMK, FPGA y el orquestador de `digitalseed` NO están en este repo.

## Stack
Next.js 16.1.6 (App Router, Turbopack), TypeScript, Babylon.js/Three.js/R3F, NextAuth v5 (Credentials provider, sin adapter — ver Auth), Drizzle ORM, Turso/libSQL (`neoproxy-prod`), Mercado Pago (`/api/checkout`), Pusher. Deploy: Vercel (`npx vercel --prod --force`).

## Agentes (7 en total — 6 conceptuales + Prototype, emergente)
DarkProxy (root), Metatron (orquestador), D (daemon), Snake (Runtime.Python), Genos (geometría/fabricación), Trickster (exploración), Prototype (emergente — ensamblado de residuos de los otros cinco, no estaba en el canon original).
Los siete tienen lore completo, arte canónico (`public/canon/*-v1.{png,jpg}`) y perfil propio en `/proxyverse/[id]` (datos en `components/proxyverse/agents.ts`) — esto es contenido de la web, ya shipeado. Es una capa distinta del estado del kernel real.
Cascade y Antigravity son herramientas externas, NO agentes. No crear entradas en `Memory/hub.json` para ellas.
`Memory/hub.json` (el kernel real, no la web) hoy solo tiene la entrada `metatron` — que Proxyverse tenga perfil para los otros seis no implica que existan como estado de kernel real; no asumirlo hasta que se agreguen ahí.

## Auth y datos (verificado en código, no en docs viejas)
- `auth.ts` es un `Credentials` provider con hash SHA-256 manual contra `users.passwordHash` — **no usa `DrizzleAdapter`**. Consulta vía `lib/core-db`, que apunta a Turso (`TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN`).
- `src/db/index.ts` y `lib/core-db/index.ts` apuntan a la **misma instancia Turso**.
- `src/db/db/index.ts` es un tercer cliente (`better-sqlite3` local, `neoproxy_memory.sqlite`) que **nada en el repo importa** — código huérfano, candidato a borrar, no a "migrar".
- `middleware.ts` protege actualmente `/admin/:path*` y `/kernel/:path*` (no `/npos`). Si la intención es proteger `/npos`, el matcher hay que actualizarlo explícitamente — hoy no lo hace.
- `app/admin/overseer/page.tsx` sigue teniendo el gate `password === 'ROOT'` client-side (queda como teatro visual, ya no protege nada por sí solo). Las 4 Server Actions de `app/admin/actions.ts` (`purgeEntropy`, `injectCorruption`, `getSystemState`, `getSystemHistory`) ahora llaman a un `requireRoot()` que verifica `auth()` y `session.user.role === 'root'` server-side antes de tocar la DB — arreglado. Depende de que la cuenta real tenga `role: 'root'` en la tabla `users` (`scripts/seed-root.ts` crea el usuario `darkproxy` con ese rol); si esa cuenta no lo tiene seteado en la Turso real, quedaría sin acceso hasta corregirlo ahí.

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
- ~~**TS error en `app/games/wired/page.tsx`**~~: resuelto — la página se reescribió completa (migró del hack de `<script>` CDN de Three.js r128 a `import * as THREE from 'three'`, ya instalado). `MemoryBridge.ts` tenía además un import roto (`@/systems/...` en vez de `@/src/systems/...`) que nunca se había notado porque nada tipaba el archivo que lo usaba — corregido ahí mismo. `CoherenceSystem` ganó `dispose()`/`reset()` (antes su `setInterval` nunca se limpiaba al desmontar la página).
- ~~**Overseer auth**~~: resuelto — ver sección "Auth y datos" arriba.
- **`src/db/db/index.ts`**: cliente SQLite local huérfano, sin imports en todo el repo. Confirmar que no se necesita y borrarlo, o documentar por qué existe.
- **GitHub PAT expuesto**: no encontrado en este repo (ni en `git log --all -p` ni en el árbol de trabajo). Si el leak es real, está en otro repo o medio — confirmar ahí, no acá.
- **NMK / Genesis Nodes / FPGA**: no hay código de esto en `neoproxy-art/neoproxy`. Vive en `neoproxy-lab` o `digitalseed`. No asumir su estado desde este repo.
- **Tienda**: `app/shop/page.tsx` ya es una plantilla de 4 categorías (insumos electrónicos, impresión 3D, modelos 3D, arte) con checkout real solo en la categoría arte (`app/shop/drop01`) — las otras tres usan un CTA `mailto:` como catálogo inicial, no checkout propio. No existen `app/shop/hardware` ni `app/shop/components` como rutas separadas; si se les agrega checkout real, es dentro de esta misma página, no módulos nuevos. `app/store` y `app/gallery` (páginas huérfanas que duplicaban `/artifacts`) se eliminaron.
- Mapeo de pines LED del TRNG (EP4CE6E22C8): fuera de este repo, no verificable acá.
