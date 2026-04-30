import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

// Construct the db path matching the one in src/lib/db/index.ts
const DB_PATH = path.join(process.cwd(), 'neoproxy_memory.sqlite');
const sqlite = new Database(DB_PATH);

// Auto-migrate tables for demonstration (System Overseer NMSD implementation)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS system_state (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    core_temperature REAL NOT NULL DEFAULT 35.5,
    corruption_level REAL NOT NULL DEFAULT 0.0,
    last_update DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS memory_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    entropy_level REAL NOT NULL,
    operator TEXT NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  INSERT OR IGNORE INTO system_state (id, status, core_temperature, corruption_level, last_update)
  VALUES ('sys_1', 'ACTIVE', 35.5, 0.0, CURRENT_TIMESTAMP);
  
  INSERT OR IGNORE INTO memory_events (id, event_type, entropy_level, operator, timestamp)
  VALUES ('evt_init', 'SYNC', 12.5, 'DarkProxy', CURRENT_TIMESTAMP);
`);

export const db = drizzle(sqlite, { schema });
