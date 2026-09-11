import { neon } from '@neondatabase/serverless';

/**
 * Neon's HTTP driver: one stateless request per query, which is what a
 * serverless function wants — no pool to warm up and nothing to leak between
 * invocations. Runtime queries go through the pooled URL.
 */
let client: ReturnType<typeof neon> | null = null;

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  if (!client) client = neon(url);
  return client;
}

export const isConfigured = () => Boolean(process.env.DATABASE_URL);
