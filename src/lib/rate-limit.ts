/**
 * Best-effort per-IP throttle. Serverless instances do not share memory, so
 * this only blunts a hot loop from one client — it is not a security boundary.
 * The real guards are the database constraints behind each route.
 */
const buckets = new Map<string, number[]>();

export function rateLimited(request: Request, scope: string, max: number, windowMs = 60_000): boolean {
  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const key = `${scope}:${ip}`;
  const now = Date.now();

  const recent = (buckets.get(key) ?? []).filter((at) => now - at < windowMs);
  recent.push(now);
  buckets.set(key, recent);
  if (buckets.size > 5000) buckets.clear();

  return recent.length > max;
}
