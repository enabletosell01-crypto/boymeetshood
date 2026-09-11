import { NextResponse } from 'next/server';
import { isConfigured } from '@/lib/db';
import {
  ClaimError,
  claimSpot,
  claimsOpen,
  communityPostId,
  findCommunity,
  isMissingCommunityTables,
  normalizeAddress,
} from '@/lib/community';
import { rateLimited } from '@/lib/rate-limit';
import { checkReply } from '@/lib/x-verify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Takes one allowlist spot: snapshot holder + a verified reply to the post +
 * a spot left, all decided inside one locked transaction in `claimSpot`.
 */
export async function POST(request: Request) {
  if (!claimsOpen()) {
    return NextResponse.json({ ok: false, error: 'Claims are not open yet.' }, { status: 403 });
  }
  if (!isConfigured()) return NextResponse.json({ ok: false, error: 'Claims are offline.' }, { status: 503 });
  if (rateLimited(request, 'community-claim', 10)) {
    return NextResponse.json({ ok: false, error: 'Too many attempts. Wait a minute.' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const community = findCommunity(body.community);
  if (!community) return NextResponse.json({ ok: false, error: 'Pick a community first.' }, { status: 400 });

  const wallet = normalizeAddress(body.wallet);
  if (!wallet) return NextResponse.json({ ok: false, error: 'Paste a 0x wallet address.' }, { status: 400 });

  // Never take the browser's word for the comment: check it again here.
  const reply = await checkReply(body.commentUrl, communityPostId());
  if (!reply.ok) {
    return NextResponse.json({ ok: false, error: reply.error }, { status: reply.retry ? 503 : 400 });
  }

  try {
    const { slot, cap, remaining } = await claimSpot({
      community,
      wallet,
      commentId: reply.id,
      commentUrl: reply.url,
      author: reply.author,
      country: request.headers.get('x-vercel-ip-country'),
    });

    return NextResponse.json(
      { ok: true, community: community.slug, name: community.name, slot, cap, remaining, author: reply.author },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    if (error instanceof ClaimError) {
      return NextResponse.json({ ok: false, code: error.code, error: error.message }, { status: 409 });
    }
    if (isMissingCommunityTables(error)) {
      return NextResponse.json({ ok: false, error: 'Claims are not set up yet.' }, { status: 503 });
    }
    console.error('[community] claim failed', error);
    return NextResponse.json({ ok: false, error: 'Could not claim the spot. Try again.' }, { status: 500 });
  }
}
