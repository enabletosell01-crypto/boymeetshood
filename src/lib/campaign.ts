import { db } from './db';

/**
 * The community allowlist campaign: which post holders reply to, and whether
 * claims are open. It lives in the database so /admin_secret can flip it in
 * one click — no env var, no redeploy.
 */
export type Campaign = {
  postUrl: string;
  postId: string;
  live: boolean;
  liveSince: string | null;
  updatedAt: string | null;
};

const KEY = 'community_campaign';
const CLOSED: Campaign = { postUrl: '', postId: '', live: false, liveSince: null, updatedAt: null };

export const postIdOf = (url: string) => /status\/(\d+)/.exec(url)?.[1] ?? '';

/** Strict read, for the admin panel: errors surface instead of hiding. */
export async function readCampaign(): Promise<Campaign> {
  const rows = (await db()`select value, updated_at from settings where key = ${KEY}`) as {
    value: { postUrl?: unknown; live?: unknown; liveSince?: unknown };
    updated_at: string;
  }[];
  const row = rows[0];
  if (!row) return CLOSED;

  const postUrl = typeof row.value.postUrl === 'string' ? row.value.postUrl : '';
  const postId = postIdOf(postUrl);
  return {
    postUrl,
    postId,
    // Live without a post to reply to is not a state anyone can claim in.
    live: row.value.live === true && postId !== '',
    liveSince: typeof row.value.liveSince === 'string' ? row.value.liveSince : null,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

/**
 * For the public routes. If the setting cannot be read the answer is "closed":
 * a database hiccup must never be what opens first-come-first-served early.
 */
export async function getCampaign(): Promise<Campaign> {
  try {
    return await readCampaign();
  } catch (error) {
    console.error('[campaign] could not read settings — treating claims as closed', error);
    return CLOSED;
  }
}

export async function saveCampaign(next: { postUrl: string; live: boolean }): Promise<Campaign> {
  const current = await readCampaign();
  // Keep the original start time while it stays live on the same post.
  const liveSince = next.live
    ? current.live && current.postUrl === next.postUrl && current.liveSince
      ? current.liveSince
      : new Date().toISOString()
    : null;

  const value = JSON.stringify({ postUrl: next.postUrl, live: next.live, liveSince });
  await db()`
    insert into settings (key, value) values (${KEY}, ${value}::jsonb)
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  return readCampaign();
}
