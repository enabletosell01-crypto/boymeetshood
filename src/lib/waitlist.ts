import { createHmac, timingSafeEqual } from 'node:crypto';
import { list, put, type ListBlobResult } from '@vercel/blob';

export const BLOB_PREFIX = 'waitlist/v1/';

export type WaitlistEntry = {
  /** The address exactly as the visitor typed it. */
  wallet: string;
  /** `desktop` (web) or `mobile` (in-app) — which surface they joined from. */
  source: string;
  /** The Hood Pass number the client generated for them, when it sent one. */
  passNo: string | null;
  /** ISO timestamp of the first successful join. */
  joinedAt: string;
  /** Coarse geo from Vercel's edge headers. No IP is ever stored. */
  country: string | null;
};

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

/**
 * Blob objects are served from public URLs, so the pathname must not be
 * guessable from the wallet address. An HMAC keyed on WAITLIST_SALT keeps the
 * name stable (one object per wallet, so re-joining is idempotent) without
 * making the store enumerable by anyone who knows an address.
 */
export function blobKeyFor(wallet: string): string {
  const salt = process.env.WAITLIST_SALT;
  if (!salt) throw new Error('WAITLIST_SALT is not set');
  const digest = createHmac('sha256', salt).update(wallet.toLowerCase()).digest('hex');
  return `${BLOB_PREFIX}${digest}.json`;
}

export function isAuthorizedAdmin(token: string | null): boolean {
  const expected = process.env.WAITLIST_ADMIN_TOKEN;
  if (!expected || !token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ---------------------------------------------------------------- store */

async function listAll(): Promise<ListBlobResult['blobs']> {
  const blobs: ListBlobResult['blobs'] = [];
  let cursor: string | undefined;

  do {
    const page: ListBlobResult = await list({ prefix: BLOB_PREFIX, limit: 1000, cursor });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return blobs;
}

/** A per-instance cache, so the countdown page does not re-list on every hit. */
let totalCache: { value: number; at: number } | null = null;
const TOTAL_TTL_MS = 30_000;

export async function countEntries(force = false): Promise<number> {
  if (!force && totalCache && Date.now() - totalCache.at < TOTAL_TTL_MS) return totalCache.value;
  const value = (await listAll()).length;
  totalCache = { value, at: Date.now() };
  return value;
}

export async function saveEntry(entry: WaitlistEntry): Promise<{ total: number; created: boolean }> {
  const pathname = blobKeyFor(entry.wallet);
  const existing = await list({ prefix: pathname, limit: 1 });
  const created = !existing.blobs.some((blob) => blob.pathname === pathname);

  // Overwrite on re-join so the newest pass/source wins, but keep the first
  // joinedAt — position in the queue belongs to whoever showed up first.
  const record: WaitlistEntry = created
    ? entry
    : { ...entry, joinedAt: (await readEntry(existing.blobs[0].url))?.joinedAt ?? entry.joinedAt };

  await put(pathname, JSON.stringify(record, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    // The store rejects anything under a minute; entries barely change after
    // they are written, so the shortest allowed window is the right one.
    cacheControlMaxAge: 60,
  });

  const total = await countEntries(true);
  return { total, created };
}

async function readEntry(url: string): Promise<WaitlistEntry | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as WaitlistEntry;
  } catch {
    return null;
  }
}

/** Reads every entry, a few at a time so a big list does not open 5,000 sockets. */
export async function readAllEntries(): Promise<WaitlistEntry[]> {
  const blobs = await listAll();
  const entries: WaitlistEntry[] = [];
  const BATCH = 25;

  for (let i = 0; i < blobs.length; i += BATCH) {
    const chunk = await Promise.all(blobs.slice(i, i + BATCH).map((blob) => readEntry(blob.url)));
    for (const entry of chunk) if (entry) entries.push(entry);
  }

  entries.sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
  return entries;
}
