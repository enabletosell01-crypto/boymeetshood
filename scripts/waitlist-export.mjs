#!/usr/bin/env node
/**
 * Pulls the waitlist straight out of Neon — no deployment, no admin token, no
 * network path through the site. Useful when you just want the list, and as a
 * fallback when the hosted export is misconfigured.
 *
 *   npm run waitlist                      print a table
 *   npm run waitlist -- --csv             write boymeetshood-waitlist.csv
 *   npm run waitlist -- --csv list.csv    write to a path you pick
 *   npm run waitlist -- --json            write boymeetshood-waitlist.json
 *   npm run waitlist -- --since 2026-09-01
 */
import { writeFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const argv = process.argv.slice(2);

/** `--flag value`, where a missing/next-flag value means "use the default". */
function option(name, fallback) {
  const at = argv.indexOf(`--${name}`);
  if (at === -1) return null;
  const next = argv[at + 1];
  return next && !next.startsWith('--') ? next : fallback;
}

const csvPath = option('csv', 'boymeetshood-waitlist.csv');
const jsonPath = option('json', 'boymeetshood-waitlist.json');
const since = option('since', null);

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Fill in .env.local (see .env.example).');
  process.exit(1);
}

if (since && Number.isNaN(Date.parse(since))) {
  console.error(`--since ${since} is not a date. Try --since 2026-09-01.`);
  process.exit(1);
}

const sql = neon(url);

const rows = since
  ? await sql`
      select wallet, source, pass_no, country, joined_at
      from waitlist where joined_at >= ${since} order by joined_at, id`
  : await sql`
      select wallet, source, pass_no, country, joined_at
      from waitlist order by joined_at, id`;

const entries = rows.map((row, index) => ({
  position: index + 1,
  wallet: row.wallet,
  source: row.source,
  passNo: row.pass_no,
  country: row.country,
  joinedAt: new Date(row.joined_at).toISOString(),
}));

if (entries.length === 0) {
  console.log(since ? `No signups since ${since}.` : 'No signups yet.');
  process.exit(0);
}

if (argv.includes('--csv')) {
  const cell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [
    'position,wallet,source,pass_no,joined_at,country',
    ...entries.map((e) =>
      [e.position, cell(e.wallet), cell(e.source), cell(e.passNo), cell(e.joinedAt), cell(e.country)].join(',')
    ),
  ].join('\n');
  writeFileSync(csvPath, `${csv}\n`);
  console.log(`wrote ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} to ${csvPath}`);
} else if (argv.includes('--json')) {
  writeFileSync(jsonPath, `${JSON.stringify(entries, null, 2)}\n`);
  console.log(`wrote ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} to ${jsonPath}`);
} else {
  const pad = (value, width) => String(value ?? '—').padEnd(width);
  console.log(`${pad('#', 5)}${pad('WALLET', 44)}${pad('SOURCE', 9)}${pad('PASS', 8)}${pad('GEO', 5)}JOINED`);
  for (const e of entries) {
    console.log(
      pad(e.position, 5) +
        pad(e.wallet, 44) +
        pad(e.source, 9) +
        pad(e.passNo, 8) +
        pad(e.country, 5) +
        e.joinedAt.replace('T', ' ').slice(0, 19) +
        ' UTC'
    );
  }

  const bySource = entries.reduce((acc, e) => ({ ...acc, [e.source]: (acc[e.source] ?? 0) + 1 }), {});
  const breakdown = Object.entries(bySource).map(([k, v]) => `${v} ${k}`).join(' · ');
  console.log(`\n${entries.length} total  (${breakdown})`);
}
