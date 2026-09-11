import { NextResponse } from 'next/server';
import { getCampaign } from '@/lib/campaign';
import { isConfigured } from '@/lib/db';
import {
  checkEligibility,
  findCommunity,
  isMissingCommunityTables,
  normalizeAddress,
} from '@/lib/community';
import { rateLimited } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Is this wallet in that community's snapshot, and is there a spot left?
 * Snapshots are public chain data, so answering for any address leaks nothing.
 */
export async function POST(request: Request) {
  if (rateLimited(request, 'community-check', 30)) {
    return NextResponse.json({ ok: false, error: 'Too many checks. Wait a minute.' }, { status: 429 });
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
  if (!wallet) {
    return NextResponse.json(
      { ok: false, error: 'Paste a 0x wallet address. Snapshots are by address, so ENS names cannot be matched.' },
      { status: 400 }
    );
  }

  if (!isConfigured()) return NextResponse.json({ ok: false, error: 'Checks are offline.' }, { status: 503 });

  try {
    const [result, campaign] = await Promise.all([checkEligibility(community.slug, wallet.toLowerCase()), getCampaign()]);
    return NextResponse.json(
      {
        ok: true,
        open: campaign.live,
        postUrl: campaign.live ? campaign.postUrl : null,
        ...result,
        ...(result.status === 'claimed' ? { communityName: findCommunity(result.community)?.name ?? result.community } : {}),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    if (isMissingCommunityTables(error)) {
      return NextResponse.json({ ok: false, error: 'Checks are not set up yet.' }, { status: 503 });
    }
    console.error('[community] check failed', error);
    return NextResponse.json({ ok: false, error: 'Could not check that wallet.' }, { status: 500 });
  }
}
