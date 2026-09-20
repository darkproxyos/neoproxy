import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from "./schema";

// Ver el comentario equivalente en lib/core-db/index.ts: solo durante el
// build, solo si faltan las credenciales, y solo fuera de Vercel (NEXT_PHASE
// tambien es 'phase-production-build' en el build de Vercel; sin el chequeo
// de VERCEL, un deploy mal configurado pasaria el build en verde y fallaria
// recien en runtime). En Vercel y en runtime sigue fallando igual que antes
// si faltan TURSO_DATABASE_URL / TURSO_AUTH_TOKEN.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
const missingCreds = !process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN;
const isVercel = !!process.env.VERCEL;

const client = createClient(
  isBuildPhase && missingCreds && !isVercel
    ? { url: 'file:build-placeholder.db' }
    : {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      }
);

export const db = drizzle(client, { schema });
