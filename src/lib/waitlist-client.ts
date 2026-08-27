'use client';

/**
 * Browser side of the waitlist. Both designs generate the Hood Pass locally and
 * keep working if the network is down — these calls only mirror the join into
 * the Blob store and sync the live queue count back into the UI.
 */

export type JoinInput = {
  wallet: string;
  passNo?: string | null;
  source: 'desktop' | 'mobile';
};

/** Current queue size, or `null` when the store is unreachable. */
export async function fetchWaitlistTotal(): Promise<number | null> {
  try {
    const res = await fetch('/api/waitlist', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as { total?: number; configured?: boolean };
    return data.configured === false ? null : typeof data.total === 'number' ? data.total : null;
  } catch {
    return null;
  }
}

/** Records a join. Resolves to the new total, or `null` if it did not land. */
export async function reportWaitlistJoin({
  wallet,
  passNo = null,
  source,
}: JoinInput): Promise<number | null> {
  if (!wallet) return null;
  try {
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet, passNo, source }),
    });
    const data = (await res.json()) as { ok?: boolean; total?: number };
    if (!res.ok || !data.ok) return null;
    return typeof data.total === 'number' ? data.total : null;
  } catch {
    return null;
  }
}
