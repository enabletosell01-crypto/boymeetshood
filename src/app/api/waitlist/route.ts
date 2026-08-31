import { NextResponse } from 'next/server';
import { normalizeHandle } from '@/lib/pass';
import { checkQuote, launchTweetId } from '@/lib/x-verify';
import {
  countEntries,
  HandleTakenError,
  isConfigured,
  isMissingTable,
  normalizeWallet,
  saveEntry,
} from '@/lib/waitlist';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Best-effort throttle. Serverless instances do not share memory, so this only
 * blunts a hot loop from one client — it is not a security boundary. The real
 * guard is the unique index on wallet_key: repeat submissions update one row
 * rather than growing the table.
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

function databaseError(error: unknown) {
  if (error instanceof HandleTakenError) {
    return NextResponse.json(
      { ok: false, error: 'That X handle is already on the list with another wallet.' },
      { status: 409 }
    );
  }
  if (isMissingTable(error)) {
    console.error('[waitlist] the waitlist table is missing — run: npm run db:setup');
    return NextResponse.json(
      { ok: false, error: 'Waitlist storage is not initialised yet.' },
      { status: 503 }
    );
  }
  console.error('[waitlist] database error', error);
  return NextResponse.json({ ok: false, error: 'Could not save your spot.' }, { status: 500 });
}

export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({ ok: true, total: 0, configured: false });
  }
  try {
    return NextResponse.json(
      { ok: true, total: await countEntries(), configured: true },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    if (isMissingTable(error)) {
      console.error('[waitlist] the waitlist table is missing — run: npm run db:setup');
      return NextResponse.json({ ok: true, total: 0, configured: false });
    }
    console.error('[waitlist] count failed', error);
    return NextResponse.json({ ok: false, total: 0, configured: true }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'DATABASE_URL is not set on this deployment.' },
      { status: 503 }
    );
  }

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

  const handle = typeof body.xUsername === 'string' ? normalizeHandle(body.xUsername) : null;

  // Never trust the client's word on the quote link: check it again here, and
  // store what this check found rather than what the browser claimed.
  const quote = body.quoteUrl ? await checkQuote(body.quoteUrl, handle, launchTweetId()) : null;
  if (quote && !quote.ok) {
    return NextResponse.json({ ok: false, error: quote.error }, { status: 400 });
  }

  try {
    const { total, position, created } = await saveEntry({
      wallet,
      source: body.source === 'mobile' ? 'mobile' : 'desktop',
      passNo: typeof body.passNo === 'string' ? body.passNo.slice(0, 16) : null,
      country: request.headers.get('x-vercel-ip-country'),
      xUsername: handle,
      quoted: body.quoted === true || Boolean(quote?.ok),
      liked: body.liked === true,
      commented: body.commented === true,
      quoteUrl: quote?.url ?? null,
      quoteVerified: quote?.verified ?? false,
    });

    return NextResponse.json(
      { ok: true, total, position, created },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return databaseError(error);
  }
}
