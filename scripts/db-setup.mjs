#!/usr/bin/env node
/**
 * Creates the waitlist table. Idempotent — run it as often as you like.
 *
 *   npm run db:setup
 *
 * Reads .env.local when present, otherwise whatever the environment already
 * has (so it also works from a Vercel shell or CI). DDL goes over the
 * unpooled connection: pgbouncer is built for short-lived query traffic, not
 * schema changes.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.');
  process.exit(1);
}

const schema = readFileSync(join(ROOT, 'db', 'schema.sql'), 'utf8');

// The HTTP driver runs one statement per request, so split the file. Comments
// are stripped first: a `;` inside one would otherwise cut a statement short.
const statements = schema
  .split('\n')
  .map((line) => line.replace(/--.*$/, ''))
  .join('\n')
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean);

const sql = neon(url);

console.log(`applying db/schema.sql (${statements.length} statements)…`);
for (const statement of statements) {
  const label = statement.replace(/\s+/g, ' ').slice(0, 68);
  await sql.query(statement);
  console.log(`  ✓ ${label}…`);
}

const [{ total }] = await sql`select count(*)::int as total from waitlist`;
console.log(`done. waitlist currently holds ${total} ${total === 1 ? 'entry' : 'entries'}.`);
