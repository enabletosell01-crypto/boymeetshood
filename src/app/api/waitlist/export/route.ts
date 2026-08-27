import { NextResponse } from 'next/server';
import { isAuthorizedAdmin, readAllEntries } from '@/lib/waitlist';

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
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Blob store not connected.' }, { status: 503 });
  }

  const entries = await readAllEntries();

  if (url.searchParams.get('format') === 'csv') {
    const rows = [
      'position,wallet,source,pass_no,joined_at,country',
      ...entries.map((entry, index) =>
        [
          index + 1,
          csvCell(entry.wallet),
          csvCell(entry.source),
          csvCell(entry.passNo),
          csvCell(entry.joinedAt),
          csvCell(entry.country),
        ].join(',')
      ),
    ];
    return new NextResponse(rows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="hoodmeetsboy-waitlist.csv"',
        'Cache-Control': 'no-store',
      },
    });
  }

  return NextResponse.json(
    { ok: true, total: entries.length, entries },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
