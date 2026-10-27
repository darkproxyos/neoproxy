// Sin 'use client': lo importan tanto componentes del navegador
// (siteConnection.ts, GhostPresence.tsx) como una API route del servidor
// (app/api/presence/cursor/route.ts) — un string no necesita boundary.
export const SITE_PRESENCE_CHANNEL = 'presence-neoproxy-site'
