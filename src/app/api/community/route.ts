import { NextResponse } from 'next/server';
import { isConfigured } from '@/lib/db';
import {
  COMMUNITIES,
  claimsOpen,
  communityPostUrl,
  communityStatus,
  isMissingCommunityTables,
} from '@/lib/community';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** What the tiles show before the database has anything to say. */
const unloaded = () => COMMUNITIES.map((c) => ({ ...c, claimed: 0, remaining: c.cap, holders: 0 }));

/** Spots left per community, for the tiles. */
export async function GET() {
  const base = { ok: true, open: claimsOpen(), postUrl: communityPostUrl() || null };
  const headers = { 'Cache-Control': 'no-store' };

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
