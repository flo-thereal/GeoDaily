import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/drizzle/schema.ts',
  out: './server/drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://geodaily:geodaily_secret@localhost:5432/geodaily',
  },
  verbose: true,
  strict: true,
});
