import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// ── Connection singleton for serverless environments ──────────────────────────
// DATABASE_URL uses PgBouncer port 6543 (pooled) — critical for Vercel
// DIRECT_URL uses port 5432 (direct) — used ONLY for migrations via drizzle-kit

declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof drizzle> | undefined;
}

function createDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const client = postgres(process.env.DATABASE_URL, {
    prepare: false, // Required for PgBouncer transaction mode
    max: 1,         // Limit connections in serverless
  });

  return drizzle(client, { schema });
}

// Reuse connection in development to avoid exhausting pool on hot reloads
export const db = globalThis.__db ?? createDb();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__db = db;
}
