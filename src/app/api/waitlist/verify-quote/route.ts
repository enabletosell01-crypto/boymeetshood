import { NextResponse } from 'next/server';
import { normalizeHandle } from '@/lib/pass';
import { checkQuote, launchTweetId } from '@/lib/x-verify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Called as soon as someone pastes their quote link, so a wrong link is caught
 * while they are still looking at it rather than at the end of the form. The
 * submit handler checks again — this answer is for the UI, not the record.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const handle = typeof body.xUsername === 'string' ? normalizeHandle(body.xUsername) : null;
  const result = await checkQuote(body.quoteUrl, handle, launchTweetId());

  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
