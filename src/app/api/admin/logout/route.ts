import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, cookieOptions, destroySession, sameOrigin, tokenFromRequest } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ ok: false, error: 'Forbidden.' }, { status: 403 });
  await destroySession(tokenFromRequest(request)).catch(() => undefined);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, '', { ...cookieOptions(request), maxAge: 0 });
  return response;
}
