#!/usr/bin/env node
/**
 * Sets the /admin_secret login.
 *
 *   npm run admin:password -- admin              prompts for the password
 *   ADMIN_PASSWORD=… npm run admin:password -- admin
 *
 * Only a scrypt hash is stored, in Neon (`settings.admin_credentials`) — the
 * repo is public, so the login must never live in the code. Changing it signs
 * out every open admin session.
 */
import { randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline';
import { neon } from '@neondatabase/serverless';

const username = (process.argv[2] ?? '').trim();
if (!username) {
  console.error('Usage: npm run admin:password -- <username>');
  process.exit(1);
}

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Fill in .env.local (see .env.example).');
  process.exit(1);
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (text) => {
      if (text.includes(question)) process.stdout.write(text);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

const password = process.env.ADMIN_PASSWORD || (await askHidden('New admin password: '));
if (password.length < 10) {
  console.error('Use at least 10 characters.');
  process.exit(1);
}

const N = 16384;
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64, { N, r: 8, p: 1 });
const value = JSON.stringify({ username, salt: salt.toString('hex'), hash: hash.toString('hex'), N });

const sql = neon(url);
await sql`
  insert into settings (key, value) values ('admin_credentials', ${value}::jsonb)
  on conflict (key) do update set value = excluded.value, updated_at = now()`;
const signedOut = await sql`delete from admin_sessions returning 1`;

console.log(`admin login set for "${username}" (scrypt hash stored). Signed out ${signedOut.length} session(s).`);
