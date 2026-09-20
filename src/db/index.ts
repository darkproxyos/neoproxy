import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from "./schema";

// Ver el comentario equivalente en lib/core-db/index.ts: solo durante el
// build, y solo si faltan las credenciales, se usa un archivo local de
// relleno que nunca se consulta de verdad. En runtime sigue fallando igual
// que antes si faltan TURSO_DATABASE_URL / TURSO_AUTH_TOKEN.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
const missingCreds = !process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN;

const client = createClient(
  isBuildPhase && missingCreds
    ? { url: 'file:build-placeholder.db' }
    : {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      }
);

export const db = drizzle(client, { schema });
