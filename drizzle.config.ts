import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// Drizzle Kit doesn't auto-load .env.local (that's a Next.js feature).
// We load it explicitly here so `drizzle-kit push` and `generate` work correctly.
config({ path: '.env.local' });

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // Use DIRECT_URL (port 5432) for migrations — not the pooled connection
    url: process.env.DIRECT_URL!,
  },
  verbose: true,
  strict: false, // Use --force flag when pushing to skip interactive confirmation
});
