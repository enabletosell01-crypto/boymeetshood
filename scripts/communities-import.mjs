#!/usr/bin/env node
/**
 * Loads partner-community holder snapshots into Neon.
 *
 *   npm run communities:import                                   sync names/caps, print status
 *   npm run communities:import -- stonkbrokers=~/Downloads/stonkbrokers.csv
 *   npm run communities:import -- normies=normies.csv "chainmancers=chain mancers.csv"
 *
 * Only the address column is read — balances are dropped. Each snapshot
 * replaces the previous one for that community atomically (clear + insert in
 * one transaction), so a re-import never leaves a half-loaded list. Spots
 * already claimed are never touched.
 */
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'communities.json'), 'utf8'));
const communities = config.communities.map((c) => ({ ...c, cap: c.cap ?? config.cap }));
const bySlug = new Map(communities.map((c) => [c.slug, c]));

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Fill in .env.local (see .env.example).');
  process.exit(1);
}

const EVM = /^0x[a-fA-F0-9]{40}$/;
/** Holder exports list these as "holders". Nobody can claim on their behalf. */
const NOT_A_PERSON = new Set([
  '0x0000000000000000000000000000000000000000',
  '0x000000000000000000000000000000000000dead',
]);

const cells = (line) => line.split(',').map((cell) => cell.trim().replace(/^"(.*)"$/, '$1').trim());

function readSnapshot(path) {
  const text = readFileSync(path, 'utf8').replace(/^﻿/, '');
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return { rows: 0, keys: [], invalid: 0, burn: 0, dupes: 0 };

  const header = cells(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ''));
  let column = header.findIndex((h) => ['holderaddress', 'address', 'wallet', 'owner'].includes(h));
  let rows = lines.slice(1);
  if (column === -1) {
    // No header we recognise: use the first column, and keep line one if it is data.
    column = 0;
    if (EVM.test(cells(lines[0])[0] ?? '')) rows = lines;
  }

  const keys = new Set();
  let invalid = 0;
  let burn = 0;
  for (const line of rows) {
    const value = cells(line)[column] ?? '';
    if (!EVM.test(value)) {
      invalid++;
      continue;
    }
    const key = value.toLowerCase();
    if (NOT_A_PERSON.has(key)) {
      burn++;
      continue;
    }
    keys.add(key);
  }

  return { rows: rows.length, keys: [...keys], invalid, burn, dupes: rows.length - invalid - burn - keys.size };
}

const expand = (path) => resolve(path.replace(/^~(?=$|\/)/, homedir()));

const jobs = process.argv.slice(2).map((arg) => {
  const at = arg.indexOf('=');
  if (at === -1) throw new Error(`Expected slug=path, got ${JSON.stringify(arg)}`);
  const slug = arg.slice(0, at);
  const path = expand(arg.slice(at + 1));
  if (!bySlug.has(slug)) {
    throw new Error(`Unknown community "${slug}". Configured: ${[...bySlug.keys()].join(', ')}`);
  }
  if (!existsSync(path)) throw new Error(`No file at ${path}`);
  return { slug, path };
});

const sql = neon(url);

// Names and caps always follow src/data/communities.json.
await sql.transaction(
  communities.map(
    (c) => sql`
      insert into communities (slug, name, cap) values (${c.slug}, ${c.name}, ${c.cap})
      on conflict (slug) do update set name = excluded.name, cap = excluded.cap`
  )
);

for (const { slug, path } of jobs) {
  const snap = readSnapshot(path);
  await sql.transaction([
    sql`delete from community_holders where community = ${slug}`,
    sql`insert into community_holders (community, wallet_key)
        select ${slug}, unnest(${snap.keys}::text[])
        on conflict do nothing`,
  ]);
  const skipped = [
    snap.invalid && `${snap.invalid} not an address`,
    snap.burn && `${snap.burn} burn/null`,
    snap.dupes && `${snap.dupes} duplicate`,
  ].filter(Boolean);
  console.log(
    `  ✓ ${slug.padEnd(14)} ${String(snap.keys.length).padStart(5)} wallets loaded` +
      ` from ${snap.rows} rows${skipped.length ? ` (skipped ${skipped.join(', ')})` : ''}`
  );
}

const status = await sql`
  select c.slug, c.name, c.cap,
    (select count(*)::int from community_holders h where h.community = c.slug) as holders,
    (select count(*)::int from community_claims  k where k.community = c.slug) as claimed
  from communities c order by c.slug`;

console.log(`\n${'COMMUNITY'.padEnd(16)}${'SNAPSHOT'.padStart(9)}${'CLAIMED'.padStart(10)}`);
for (const row of status) {
  const snapshot = row.holders ? String(row.holders) : 'not loaded';
  console.log(`${row.name.padEnd(16)}${snapshot.padStart(9)}${`${row.claimed}/${row.cap}`.padStart(10)}`);
}
