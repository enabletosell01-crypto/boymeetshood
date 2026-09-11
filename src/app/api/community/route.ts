import { NextResponse } from 'next/server';
import { getCampaign } from '@/lib/campaign';
import { isConfigured } from '@/lib/db';
import { COMMUNITIES, communityStatus, isMissingCommunityTables } from '@/lib/community';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** What the tiles show before the database has anything to say. */
const unloaded = () => COMMUNITIES.map((c) => ({ ...c, claimed: 0, remaining: c.cap, holders: 0 }));

/** Spots left per community, and whether claims are open, for the tiles. */
export async function GET() {
  const headers = { 'Cache-Control': 'no-store' };
  const campaign = await getCampaign();
  // The post is only handed out once it is live, so the start is a moment
  // everyone sees at once rather than something readable from the API early.
  const base = { ok: true, open: campaign.live, postUrl: campaign.live ? campaign.postUrl : null };

  if (!isConfigured()) return NextResponse.json({ ...base, configured: false, communities: unloaded() }, { headers });

  try {
    return NextResponse.json({ ...base, configured: true, communities: await communityStatus() }, { headers });
  } catch (error) {
    if (isMissingCommunityTables(error)) {
      console.error('[community] tables missing — run: npm run db:setup');
      return NextResponse.json({ ...base, configured: false, communities: unloaded() }, { headers });
    }
    console.error('[community] status failed', error);
    return NextResponse.json({ ok: false, error: 'Could not load communities.' }, { status: 500 });
  }
}
