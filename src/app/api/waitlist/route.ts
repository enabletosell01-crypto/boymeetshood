import { NextResponse } from 'next/server';
import { countEntries, normalizeWallet, saveEntry, type WaitlistEntry } from '@/lib/waitlist';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Best-effort throttle. Serverless instances do not share memory, so this only
 * blunts a hot loop from one client — it is not a security boundary. Blob
 * pathnames are keyed by wallet, so repeat submissions overwrite rather than
 * grow the store.
 */
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((at) => now - at < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

function missingBlobToken() {
  return NextResponse.json(
    {
      ok: false,
      error:
        'Blob store is not connected. Add BLOB_READ_WRITE_TOKEN (Vercel → Storage → Blob → Connect).',
    },
    { status: 503 }
  );
}

export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ ok: true, total: 0, configured: false });
  }
  try {
    return NextResponse.json(
      { ok: true, total: await countEntries(), configured: true },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[waitlist] count failed', error);
    return NextResponse.json({ ok: false, total: 0, configured: true }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN || !process.env.WAITLIST_SALT) return missingBlobToken();

  const forwarded = request.headers.get('x-forwarded-for') ?? '';
  if (rateLimited(forwarded.split(',')[0].trim() || 'unknown')) {
    return NextResponse.json({ ok: false, error: 'Too many requests.' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const wallet = normalizeWallet(body.wallet);
  if (!wallet) {
    return NextResponse.json(
      { ok: false, error: 'Paste a valid EVM address or ENS name.' },
      { status: 400 }
    );
  }

  const passNo = typeof body.passNo === 'string' ? body.passNo.slice(0, 16) : null;
  const source = body.source === 'mobile' ? 'mobile' : 'desktop';

  const entry: WaitlistEntry = {
    wallet,
    source,
    passNo,
    joinedAt: new Date().toISOString(),
    country: request.headers.get('x-vercel-ip-country'),
  };

  try {
    const { total, created } = await saveEntry(entry);
    return NextResponse.json({ ok: true, total, created }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[waitlist] save failed', error);
    return NextResponse.json({ ok: false, error: 'Could not save your spot.' }, { status: 500 });
  }
}
