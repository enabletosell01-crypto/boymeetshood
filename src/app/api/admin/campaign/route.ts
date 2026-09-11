import { NextResponse } from 'next/server';
import { hasAdminSession, sameOrigin } from '@/lib/admin-auth';
import { postIdOf, readCampaign, saveCampaign } from '@/lib/campaign';
import { communityStatus } from '@/lib/community';
import { lookupPost } from '@/lib/x-verify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'no-store' };
const unauthorized = () => NextResponse.json({ ok: false, error: 'Sign in again.' }, { status: 401 });

/** Current campaign plus spots claimed per community, for the panel. */
export async function GET(request: Request) {
  if (!(await hasAdminSession(request))) return unauthorized();
  try {
    const [campaign, stats] = await Promise.all([readCampaign(), communityStatus()]);
    return NextResponse.json({ ok: true, campaign, stats }, { headers });
  } catch (error) {
    console.error('[admin] campaign read failed', error);
    return NextResponse.json({ ok: false, error: 'Could not load the campaign. Run npm run db:setup?' }, { status: 500 });
  }
}

/**
 * `{ postUrl }` saves the collab post; `{ live: true | false }` opens or
 * closes claims. Both can come together — GO LIVE with an unsaved link does.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ ok: false, error: 'Forbidden.' }, { status: 403 });
  if (!(await hasAdminSession(request))) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const current = await readCampaign();
  let postUrl = current.postUrl;
  let post: { author: string; text: string } | undefined;
  let warning: string | undefined;

  if ('postUrl' in body) {
    const raw = typeof body.postUrl === 'string' ? body.postUrl.trim() : '';
    if (!raw) {
      postUrl = '';
    } else {
      const found = await lookupPost(raw);
      if (!found.ok) return NextResponse.json({ ok: false, error: found.error }, { status: 400 });
      postUrl = found.url;
      post = { author: found.author, text: found.text };
      if (!found.confirmed) warning = 'Saved, but X did not answer, so the post could not be confirmed. Double-check the link.';
    }
  }

  const live = typeof body.live === 'boolean' ? body.live : current.live;
  if (live && !postIdOf(postUrl)) {
    return NextResponse.json({ ok: false, error: 'Paste the collab post first — claims need a post to reply to.' }, { status: 400 });
  }

  const campaign = await saveCampaign({ postUrl, live });
  return NextResponse.json({ ok: true, campaign, post, warning }, { headers });
}
