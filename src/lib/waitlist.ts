import { timingSafeEqual } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

export type WaitlistEntry = {
  /** Queue position, 1-based, by arrival. */
  position: number;
  /** X handle without the @, when the entry came through the join flow. */
  xUsername: string | null;
  /** The address exactly as the visitor typed it. */
  wallet: string;
  /** Self-reported engagement steps — see the note on `saveEntry`. */
  quoted: boolean;
  liked: boolean;
  commented: boolean;
  /** `desktop` (web) or `mobile` (in-app) — which surface they joined from. */
  source: string;
  /** The Hood Pass number the client generated for them, when it sent one. */
  passNo: string | null;
  /** Coarse geo from Vercel's edge headers. No IP is ever stored. */
  country: string | null;
  joinedAt: string;
};

export type SaveResult = { total: number; position: number; created: boolean };

/* ------------------------------------------------------------- connection */

/**
 * Neon's HTTP driver: one stateless request per query, which is what a
 * serverless function wants — no pool to warm up and nothing to leak between
 * invocations. Runtime queries go through the pooled URL.
 */
let client: ReturnType<typeof neon> | null = null;

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  if (!client) client = neon(url);
  return client;
}

export const isConfigured = () => Boolean(process.env.DATABASE_URL);

/** True when the database is reachable but `npm run db:setup` never ran. */
export function isMissingTable(error: unknown): boolean {
  return /relation "waitlist" does not exist/i.test(
    error instanceof Error ? error.message : String(error)
  );
}

/* ----------------------------------------------------------- validation */

const EVM = /^0x[a-fA-F0-9]{40}$/;
/** ENS names and other chain handles, matching what the design accepts. */
const HANDLE = /^[a-zA-Z0-9._-]{8,64}$/;

export function normalizeWallet(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const wallet = input.trim();
  if (!wallet || wallet.length > 64) return null;
  if (!EVM.test(wallet) && !HANDLE.test(wallet)) return null;
  return wallet;
}

export function isAuthorizedAdmin(token: string | null): boolean {
  const expected = process.env.WAITLIST_ADMIN_TOKEN;
  if (!expected || !token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ---------------------------------------------------------------- store */

export async function countEntries(): Promise<number> {
  const rows = (await db()`select count(*)::int as total from waitlist`) as { total: number }[];
  return rows[0]?.total ?? 0;
}

/** Raised when the handle is already on the list under a different wallet. */
export class HandleTakenError extends Error {}

/**
 * The engagement flags are what the visitor said they did. Nothing here can
 * verify a like or a quote — that needs the X API and an authorised account —
 * so they are stored as claims to check against the account before the drop,
 * which is what the site tells people.
 */
export async function saveEntry(entry: {
  wallet: string;
  source: string;
  passNo: string | null;
  country: string | null;
  xUsername?: string | null;
  quoted?: boolean;
  liked?: boolean;
  commented?: boolean;
}): Promise<SaveResult> {
  const sql = db();
  const walletKey = entry.wallet.toLowerCase();
  const handle = entry.xUsername ?? null;

  // A handle already claimed by a *different* wallet is a real conflict: it is
  // either a typo or someone farming spots, and silently overwriting either way
  // would quietly move somebody else's place in the queue.
  if (handle) {
    const clash = (await sql`
      select 1 from waitlist
      where lower(x_username) = ${handle.toLowerCase()} and wallet_key <> ${walletKey}
      limit 1
    `) as unknown[];
    if (clash.length) throw new HandleTakenError(handle);
  }

  // `xmax = 0` is Postgres' own tell for "this row came from the insert, not
  // the update branch" — it distinguishes a new join from a re-join without a
  // second lookup. joined_at is never touched on conflict: the queue belongs to
  // whoever showed up first.
  const upserted = (await sql`
    insert into waitlist (wallet, wallet_key, source, pass_no, country, x_username, quoted, liked, commented)
    values (${entry.wallet}, ${walletKey}, ${entry.source}, ${entry.passNo}, ${entry.country},
            ${handle}, ${entry.quoted ?? false}, ${entry.liked ?? false}, ${entry.commented ?? false})
    on conflict (wallet_key) do update
      set wallet     = excluded.wallet,
          source     = excluded.source,
          pass_no    = coalesce(excluded.pass_no, waitlist.pass_no),
          country    = coalesce(excluded.country, waitlist.country),
          x_username = coalesce(excluded.x_username, waitlist.x_username),
          -- Steps only ever go from not-done to done.
          quoted     = waitlist.quoted    or excluded.quoted,
          liked      = waitlist.liked     or excluded.liked,
          commented  = waitlist.commented or excluded.commented,
          updated_at = now()
    returning id, (xmax = 0) as created
  `) as { id: string; created: boolean }[];

  const row = upserted[0];

  const counts = (await sql`
    select
      (select count(*)::int from waitlist)                            as total,
      (select count(*)::int from waitlist where id <= ${row.id})      as position
  `) as { total: number; position: number }[];

  return {
    total: counts[0]?.total ?? 0,
    position: counts[0]?.position ?? 0,
    created: row.created,
  };
}

export async function readAllEntries(): Promise<WaitlistEntry[]> {
  const rows = (await db()`
    select
      row_number() over (order by joined_at, id) as position,
      wallet, source, pass_no, country, joined_at,
      x_username, quoted, liked, commented
    from waitlist
    order by joined_at, id
  `) as {
    position: string;
    wallet: string;
    source: string;
    pass_no: string | null;
    country: string | null;
    joined_at: string;
    x_username: string | null;
    quoted: boolean;
    liked: boolean;
    commented: boolean;
  }[];

  return rows.map((row) => ({
    position: Number(row.position),
    xUsername: row.x_username,
    wallet: row.wallet,
    quoted: row.quoted,
    liked: row.liked,
    commented: row.commented,
    source: row.source,
    passNo: row.pass_no,
    country: row.country,
    joinedAt: new Date(row.joined_at).toISOString(),
  }));
}
