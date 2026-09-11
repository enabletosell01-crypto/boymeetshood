import { NextResponse } from 'next/server';
import { isConfigured } from '@/lib/db';
import { claimsOpen, commentConflict, communityPostId } from '@/lib/community';
import { rateLimited } from '@/lib/rate-limit';
import { checkReply } from '@/lib/x-verify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Called as soon as someone pastes their comment link, so a wrong link is
 * caught while they are still looking at it. The claim route checks again —
 * this answer is for the UI, never the record.
 */
export async function POST(request: Request) {
  if (!claimsOpen()) {
    return NextResponse.json({ ok: false, error: 'Claims are not open yet.' }, { status: 403 });
  }
  if (rateLimited(request, 'community-verify', 30)) {
    return NextResponse.json({ ok: false, error: 'Too many checks. Wait a minute.' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const reply = await checkReply(body.commentUrl, communityPostId());
  if (!reply.ok) return NextResponse.json(reply, { headers: { 'Cache-Control': 'no-store' } });

  if (isConfigured()) {
    const conflict = await commentConflict(reply.id, reply.author).catch(() => null);
    if (conflict === 'comment') {
      return NextResponse.json({ ok: false, error: 'That comment was already used to claim a spot. Each spot needs its own comment.' });
    }
    if (conflict === 'author') {
      return NextResponse.json({ ok: false, error: `@${reply.author} already claimed a spot. One spot per X account.` });
    }
  }

  return NextResponse.json(
    { ok: true, author: reply.author, url: reply.url },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
