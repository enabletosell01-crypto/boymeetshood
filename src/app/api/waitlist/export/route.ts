import { NextResponse } from 'next/server';
import { isAuthorizedAdmin, isConfigured, isMissingTable, readAllEntries } from '@/lib/waitlist';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const csvCell = (value: string | null) => `"${(value ?? '').replace(/"/g, '""')}"`;

/**
 * Owner-only dump of the waitlist.
 *
 *   /api/waitlist/export?token=WAITLIST_ADMIN_TOKEN
 *   /api/waitlist/export?token=...&format=csv
 *
 * The token can also travel as `Authorization: Bearer <token>` so it stays out
 * of browser history and server logs.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null;
  const token = bearer ?? url.searchParams.get('token');

  if (!isAuthorizedAdmin(token)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (!isConfigured()) {
    return NextResponse.json({ ok: false, error: 'DATABASE_URL is not set.' }, { status: 503 });
  }

  let entries;
  try {
    entries = await readAllEntries();
  } catch (error) {
    if (isMissingTable(error)) {
      return NextResponse.json(
        { ok: false, error: 'Waitlist table is missing — run: npm run db:setup' },
        { status: 503 }
      );
    }
    console.error('[waitlist] export failed', error);
    return NextResponse.json({ ok: false, error: 'Export failed.' }, { status: 500 });
  }

  if (url.searchParams.get('format') === 'csv') {
    const rows = [
      'position,x_username,wallet,pass_no,quoted,quote_url,quote_verified,liked,commented,source,joined_at,country',
      ...entries.map((entry) =>
        [
          entry.position,
          csvCell(entry.xUsername),
          csvCell(entry.wallet),
          csvCell(entry.passNo),
          entry.quoted,
          csvCell(entry.quoteUrl),
          entry.quoteVerified,
          entry.liked,
          entry.commented,
          csvCell(entry.source),
          csvCell(entry.joinedAt),
          csvCell(entry.country),
        ].join(',')
      ),
    ];
    return new NextResponse(rows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="boymeetshood-waitlist.csv"',
        'Cache-Control': 'no-store',
      },
    });
  }

  return NextResponse.json(
    { ok: true, total: entries.length, entries },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
