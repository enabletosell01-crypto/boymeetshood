import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { db } from './db';

/**
 * The /admin_secret login.
 *
 * The credentials are a scrypt hash in `settings` (set with
 * `npm run admin:password`), never in code — this repo is public. Sessions are
 * random tokens stored only as SHA-256 hashes, sent as an HttpOnly,
 * SameSite=Strict cookie.
 */
export const ADMIN_COOKIE = 'bmh_admin';
export const SESSION_SECONDS = 60 * 60 * 24 * 7;

type Stored = { username: string; salt: string; hash: string; N: number };

const sha256 = (value: string) => createHash('sha256').update(value).digest();
const sameString = (a: string, b: string) => timingSafeEqual(sha256(a), sha256(b));

function scryptAsync(password: string, salt: Buffer, N: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, 64, { N, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) =>
      error ? reject(error) : resolve(key)
    )
  );
}

export async function verifyLogin(username: string, password: string): Promise<boolean> {
  const rows = (await db()`select value from settings where key = 'admin_credentials'`) as { value: Stored }[];
  const stored = rows[0]?.value;

  // Always pay for one scrypt, so the response time does not reveal whether
  // it was the username or the password that was wrong.
  const salt = stored ? Buffer.from(stored.salt, 'hex') : randomBytes(16);
  const derived = await scryptAsync(password, salt, stored?.N ?? 16384);
  if (!stored) return false;

  const expected = Buffer.from(stored.hash, 'hex');
  const passwordOk = derived.length === expected.length && timingSafeEqual(derived, expected);
  const userOk = sameString(username.trim().toLowerCase(), stored.username.toLowerCase());
  return passwordOk && userOk;
}

const digest = (token: string) => sha256(token).toString('hex');

export async function createSession(): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
  await db()`delete from admin_sessions where expires_at < now()`;
  await db()`insert into admin_sessions (token_hash, expires_at) values (${digest(token)}, ${expires})`;
  return token;
}

export async function isValidSession(token: string | null | undefined): Promise<boolean> {
  if (!token || token.length > 200) return false;
  const rows = (await db()`
    select 1 from admin_sessions where token_hash = ${digest(token)} and expires_at > now()`) as unknown[];
  return rows.length > 0;
}

export async function destroySession(token: string | null | undefined): Promise<void> {
  if (token) await db()`delete from admin_sessions where token_hash = ${digest(token)}`;
}

export function tokenFromRequest(request: Request): string | null {
  const cookie = request.headers.get('cookie') ?? '';
  const match = new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`).exec(cookie);
  return match ? decodeURIComponent(match[1]) : null;
}

export const hasAdminSession = (request: Request) =>
  isValidSession(tokenFromRequest(request)).catch(() => false);

/**
 * Changing admin state must come from this site's own pages. Browsers always
 * send Origin on a POST, so a missing one is treated as foreign too.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const cookieOptions = (request: Request) => ({
  httpOnly: true,
  secure: new URL(request.url).protocol === 'https:',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: SESSION_SECONDS,
});
