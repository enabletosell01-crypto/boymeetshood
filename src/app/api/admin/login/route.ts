import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, cookieOptions, createSession, sameOrigin, verifyLogin } from '@/lib/admin-auth';
import { rateLimited } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ ok: false, error: 'Forbidden.' }, { status: 403 });
  if (rateLimited(request, 'admin-login', 8, 15 * 60_000)) {
    return NextResponse.json({ ok: false, error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const username = typeof body.username === 'string' ? body.username.slice(0, 100) : '';
  const password = typeof body.password === 'string' ? body.password.slice(0, 200) : '';

  let ok: boolean;
  try {
    ok = await verifyLogin(username, password);
  } catch (error) {
    console.error('[admin] login check failed', error);
    return NextResponse.json({ ok: false, error: 'Admin is not set up yet.' }, { status: 503 });
  }

  if (!ok) {
    await wait(400);
    return NextResponse.json({ ok: false, error: 'Wrong username or password.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, await createSession(), cookieOptions(request));
  return response;
}
