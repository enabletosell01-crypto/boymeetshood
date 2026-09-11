import config from '@/data/communities.json';
import { db } from './db';

export type Community = {
  slug: string;
  name: string;
  accent: string;
  logo: string | null;
  cap: number;
};

export const COMMUNITIES: Community[] = config.communities.map((entry) => ({
  ...entry,
  cap: (entry as { cap?: number }).cap ?? config.cap,
}));

export function findCommunity(slug: unknown): Community | null {
  return typeof slug === 'string' ? (COMMUNITIES.find((c) => c.slug === slug) ?? null) : null;
}

const EVM = /^0x[a-fA-F0-9]{40}$/;

/** Snapshots are keyed by address, so ENS names cannot be matched here. */
export function normalizeAddress(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  return EVM.test(value) ? value : null;
}

/** True when the database is reachable but `npm run db:setup` never ran. */
export function isMissingCommunityTables(error: unknown): boolean {
  return /relation "(communities|community_holders|community_claims|settings)" does not exist/i.test(
    error instanceof Error ? error.message : String(error)
  );
}

/* --------------------------------------------------------------- status */

export type CommunityStatus = Community & {
  claimed: number;
  remaining: number;
  /** Wallets in the loaded snapshot. 0 means it has not been imported yet. */
  holders: number;
};

export async function communityStatus(): Promise<CommunityStatus[]> {
  const rows = (await db()`
    select
      c.slug,
      c.cap,
      (select count(*)::int from community_claims  k where k.community = c.slug) as claimed,
      (select count(*)::int from community_holders h where h.community = c.slug) as holders
    from communities c
  `) as { slug: string; cap: number; claimed: number; holders: number }[];

  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  return COMMUNITIES.map((community) => {
    const row = bySlug.get(community.slug);
    const cap = row?.cap ?? community.cap;
    const claimed = row?.claimed ?? 0;
    return { ...community, cap, claimed, remaining: Math.max(0, cap - claimed), holders: row?.holders ?? 0 };
  });
}

/* ---------------------------------------------------------- eligibility */

export type Eligibility =
  | { status: 'eligible'; remaining: number; cap: number }
  | { status: 'not_holder' }
  | { status: 'full'; cap: number }
  /** This wallet already holds a spot — possibly through another community. */
  | { status: 'claimed'; community: string; slot: number }
  /** The snapshot for this community has not been imported. */
  | { status: 'pending' };

export async function checkEligibility(slug: string, walletKey: string): Promise<Eligibility> {
  const [row] = (await db()`
    select
      exists (select 1 from community_holders where community = ${slug} and wallet_key = ${walletKey}) as holder,
      (select count(*)::int from community_holders where community = ${slug})                           as holders,
      (select cap from communities where slug = ${slug})                                               as cap,
      (select count(*)::int from community_claims where community = ${slug})                           as claimed,
      (select community from community_claims where wallet_key = ${walletKey})                         as claimed_in,
      (select count(*)::int from community_claims k
         where k.community = (select community from community_claims where wallet_key = ${walletKey})
           and k.id <= (select id from community_claims where wallet_key = ${walletKey}))             as claimed_slot
  `) as {
    holder: boolean;
    holders: number;
    cap: number | null;
    claimed: number;
    claimed_in: string | null;
    claimed_slot: number;
  }[];

  if (row.claimed_in) return { status: 'claimed', community: row.claimed_in, slot: row.claimed_slot };
  if (!row.holders || row.cap === null) return { status: 'pending' };
  if (!row.holder) return { status: 'not_holder' };

  const remaining = Math.max(0, row.cap - row.claimed);
  return remaining ? { status: 'eligible', remaining, cap: row.cap } : { status: 'full', cap: row.cap };
}

/* ---------------------------------------------------------------- claim */

export type ClaimCode =
  | 'not_holder'
  | 'full'
  | 'pending'
  | 'wallet_taken'
  | 'comment_taken'
  | 'author_taken';

export class ClaimError extends Error {
  constructor(
    readonly code: ClaimCode,
    message: string
  ) {
    super(message);
  }
}

/** Turns a unique-index hit into the reason a person can act on. */
function uniqueViolation(error: unknown): ClaimError | null {
  const e = error as { code?: string; constraint?: string; message?: string } | null;
  if (e?.code !== '23505') return null;

  const name = `${e.constraint ?? ''} ${e.message ?? ''}`;
  if (name.includes('comment_id')) {
    return new ClaimError('comment_taken', 'That comment was already used to claim a spot. Each spot needs its own comment.');
  }
  if (name.includes('author')) {
    return new ClaimError('author_taken', 'That X account already claimed a spot. One spot per account.');
  }
  return new ClaimError('wallet_taken', 'This wallet already holds a spot.');
}

export async function claimSpot(input: {
  community: Community;
  wallet: string;
  commentId: string;
  commentUrl: string;
  author: string;
  country: string | null;
}): Promise<{ slot: number; cap: number; remaining: number }> {
  const sql = db();
  const { slug, name } = input.community;
  const key = input.wallet.toLowerCase();

  let results: unknown[][];
  try {
    results = (await sql.transaction([
      // Serialise claims per community. The second of two simultaneous claims
      // waits on this row lock, then counts again after the first commits, so
      // the cap cannot be overshot by a race.
      sql`select slug from communities where slug = ${slug} for update`,
      // The slot number comes from the count *before* this row lands — a
      // RETURNING subquery sees the statement's starting snapshot — plus one.
      sql`
        insert into community_claims (community, wallet, wallet_key, comment_id, comment_url, x_author, country)
        select ${slug}, ${input.wallet}, ${key}, ${input.commentId}, ${input.commentUrl}, ${input.author}, ${input.country}
        where exists (select 1 from community_holders where community = ${slug} and wallet_key = ${key})
          and (select count(*) from community_claims where community = ${slug})
            < (select cap from communities where slug = ${slug})
        returning
          (select count(*)::int from community_claims where community = ${slug}) + 1 as slot,
          (select cap from communities where slug = ${slug})                       as cap
      `,
    ])) as unknown[][];
  } catch (error) {
    throw uniqueViolation(error) ?? error;
  }

  const inserted = (results[1] as { slot: number; cap: number }[])[0];
  if (inserted) {
    return { slot: inserted.slot, cap: inserted.cap, remaining: Math.max(0, inserted.cap - inserted.slot) };
  }

  // Nothing landed: one of the gates in the WHERE said no. Work out which.
  const why = await checkEligibility(slug, key);
  if (why.status === 'claimed') throw new ClaimError('wallet_taken', 'This wallet already holds a spot.');
  if (why.status === 'not_holder') {
    throw new ClaimError('not_holder', `This wallet is not in the ${name} holder snapshot.`);
  }
  if (why.status === 'pending') throw new ClaimError('pending', `The ${name} snapshot is not loaded yet.`);
  const cap = why.status === 'full' ? why.cap : input.community.cap;
  throw new ClaimError('full', `All ${cap} ${name} spots are taken.`);
}

/** Early, friendly version of what the unique indexes enforce at claim time. */
export async function commentConflict(commentId: string, author: string): Promise<'comment' | 'author' | null> {
  const [row] = (await db()`
    select
      exists (select 1 from community_claims where comment_id = ${commentId})              as comment,
      exists (select 1 from community_claims where lower(x_author) = ${author.toLowerCase()}) as author
  `) as { comment: boolean; author: boolean }[];
  return row.comment ? 'comment' : row.author ? 'author' : null;
}

/* --------------------------------------------------------------- export */

export type ClaimRow = {
  community: string;
  slot: number;
  wallet: string;
  xAuthor: string;
  commentUrl: string;
  country: string | null;
  claimedAt: string;
};

export async function readClaims(): Promise<ClaimRow[]> {
  const rows = (await db()`
    select
      community,
      row_number() over (partition by community order by id)::int as slot,
      wallet, x_author, comment_url, country, claimed_at
    from community_claims
    order by community, id
  `) as {
    community: string;
    slot: number;
    wallet: string;
    x_author: string;
    comment_url: string;
    country: string | null;
    claimed_at: string;
  }[];

  return rows.map((row) => ({
    community: row.community,
    slot: row.slot,
    wallet: row.wallet,
    xAuthor: row.x_author,
    commentUrl: row.comment_url,
    country: row.country,
    claimedAt: new Date(row.claimed_at).toISOString(),
  }));
}
