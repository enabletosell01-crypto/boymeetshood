import { NextResponse } from 'next/server';
import { isConfigured } from '@/lib/db';
import { findCommunity, isMissingCommunityTables, readClaims } from '@/lib/community';
import { isAuthorizedAdmin } from '@/lib/waitlist';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const csvCell = (value: string | number | null) => `"${String(value ?? '').replace(/"/g, '""')}"`;

/**
 * Owner-only dump of claimed community spots.
 *
 *   /api/community/export?token=WAITLIST_ADMIN_TOKEN              JSON
 *   /api/community/export?token=…&format=csv                      full detail
 *   /api/community/export?token=…&format=txt                      one address per line, for the mint list
 *
 * Also accepts `Authorization: Bearer <token>`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null;
  if (!isAuthorizedAdmin(bearer ?? url.searchParams.get('token'))) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (!isConfigured()) return NextResponse.json({ ok: false, error: 'DATABASE_URL is not set.' }, { status: 503 });

  let claims;
  try {
    claims = await readClaims();
  } catch (error) {
    if (isMissingCommunityTables(error)) {
      return NextResponse.json({ ok: false, error: 'Tables missing — run: npm run db:setup' }, { status: 503 });
    }
    console.error('[community] export failed', error);
    return NextResponse.json({ ok: false, error: 'Export failed.' }, { status: 500 });
  }

  const format = url.searchParams.get('format');
  const headers = { 'Cache-Control': 'no-store' };

  if (format === 'txt') {
    return new NextResponse(claims.map((c) => c.wallet).join('\n') + (claims.length ? '\n' : ''), {
      headers: {
        ...headers,
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="boymeetshood-allowlist.txt"',
      },
    });
  }

  if (format === 'csv') {
    const rows = [
      'community,slot,wallet,x_author,comment_url,claimed_at,country',
      ...claims.map((c) =>
        [
          csvCell(findCommunity(c.community)?.name ?? c.community),
          c.slot,
          csvCell(c.wallet),
          csvCell(c.xAuthor),
          csvCell(c.commentUrl),
          csvCell(c.claimedAt),
          csvCell(c.country),
        ].join(',')
      ),
    ];
    return new NextResponse(rows.join('\n'), {
      headers: {
        ...headers,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="boymeetshood-allowlist.csv"',
      },
    });
  }

  return NextResponse.json({ ok: true, total: claims.length, claims }, { headers });
}
