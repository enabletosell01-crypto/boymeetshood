#!/usr/bin/env node
/**
 * Every claimed community allowlist spot, straight from Neon.
 *
 *   npm run allowlist              table, grouped by community
 *   npm run allowlist -- --csv     boymeetshood-allowlist.csv
 *   npm run allowlist -- --txt     boymeetshood-allowlist.txt — one address per
 *                                  line, ready to merge into the mint list
 */
import { writeFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const argv = process.argv.slice(2);
const option = (name, fallback) => {
  const at = argv.indexOf(`--${name}`);
  if (at === -1) return null;
  const next = argv[at + 1];
  return next && !next.startsWith('--') ? next : fallback;
};

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Fill in .env.local (see .env.example).');
  process.exit(1);
}

const sql = neon(url);
const rows = await sql`
  select c.name as community,
    row_number() over (partition by k.community order by k.id)::int as slot,
    c.cap, k.wallet, k.x_author, k.comment_url, k.country, k.claimed_at
  from community_claims k join communities c on c.slug = k.community
  order by c.name, k.id`;

const summary = await sql`
  select c.name, c.cap, (select count(*)::int from community_claims k where k.community = c.slug) as claimed
  from communities c order by c.name`;

if (argv.includes('--txt')) {
  const path = option('txt', 'boymeetshood-allowlist.txt');
  writeFileSync(path, rows.map((r) => r.wallet).join('\n') + (rows.length ? '\n' : ''));
  console.log(`wrote ${rows.length} address${rows.length === 1 ? '' : 'es'} to ${path}`);
} else if (argv.includes('--csv')) {
  const path = option('csv', 'boymeetshood-allowlist.csv');
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [
    'community,slot,wallet,x_author,comment_url,claimed_at,country',
    ...rows.map((r) =>
      [cell(r.community), r.slot, cell(r.wallet), cell(r.x_author), cell(r.comment_url),
       cell(new Date(r.claimed_at).toISOString()), cell(r.country)].join(',')
    ),
  ].join('\n');
  writeFileSync(path, `${csv}\n`);
  console.log(`wrote ${rows.length} claim${rows.length === 1 ? '' : 's'} to ${path}`);
} else {
  if (!rows.length) console.log('No spots claimed yet.\n');
  let current = '';
  for (const r of rows) {
    if (r.community !== current) {
      current = r.community;
      console.log(`\n${current.toUpperCase()}`);
    }
    console.log(
      `  ${String(r.slot).padStart(2)}/${r.cap}  ${r.wallet}  @${String(r.x_author).padEnd(16)}` +
        `${new Date(r.claimed_at).toISOString().replace('T', ' ').slice(0, 19)} UTC`
    );
  }
  console.log('');
  for (const s of summary) console.log(`${s.name.padEnd(16)}${`${s.claimed}/${s.cap}`.padStart(7)} claimed`);
  const total = summary.reduce((n, s) => n + s.claimed, 0);
  const cap = summary.reduce((n, s) => n + s.cap, 0);
  console.log(`${'TOTAL'.padEnd(16)}${`${total}/${cap}`.padStart(7)}`);
}
