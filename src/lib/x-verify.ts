/**
 * Checks a pasted post link against X's public embed endpoint.
 *
 * No API credentials and no paid tier: `cdn.syndication.twimg.com` is what the
 * embed widget itself calls. It gives us the author and the text, which is
 * enough to catch the thing worth catching — someone pasting a link to a post
 * that is not theirs.
 *
 * What it deliberately does NOT do is fail a signup on anything it cannot
 * prove. A third-party endpoint being rate-limited is not the visitor's fault,
 * so an inconclusive check records `verified: false` and lets them through;
 * only a positively wrong author is rejected.
 *
 * `checkReply` at the bottom is the deliberate exception. It gates a scarce,
 * first-come-first-served allowlist spot rather than an open waitlist, so there
 * an unconfirmed comment is not good enough: it fails closed and asks the
 * person to try again, instead of spending a spot on a link nobody checked.
 */

export type QuoteCheck = {
  /** The link is a well-formed X status URL and, if checked, is the visitor's. */
  ok: boolean;
  /** True only when we positively confirmed author and quoted target. */
  verified: boolean;
  /** Normalised `https://x.com/<author>/status/<id>`. */
  url: string | null;
  author: string | null;
  error?: string;
};

const STATUS_URL = /^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status\/(\d{1,25})/i;

export function parseStatusUrl(input: unknown): { author: string; id: string; url: string } | null {
  if (typeof input !== 'string') return null;
  const match = STATUS_URL.exec(input.trim());
  if (!match) return null;
  const [, author, id] = match;
  return { author, id, url: `https://x.com/${author}/status/${id}` };
}

export type SyndicationTweet = {
  __typename?: string;
  id_str?: string;
  text?: string;
  user?: { screen_name?: string };
  quoted_tweet?: { id_str?: string };
  entities?: { urls?: { expanded_url?: string }[] };
  /** Present on replies — the post this one answers. */
  in_reply_to_status_id_str?: string;
  parent?: { id_str?: string };
};

type Lookup =
  | { kind: 'found'; tweet: SyndicationTweet }
  /** X answered and said there is no such post. */
  | { kind: 'missing' }
  /** X did not answer, or answered with something we cannot read. */
  | { kind: 'unknown' };

async function fetchTweet(id: string): Promise<Lookup> {
  try {
    const res = await fetch(
      `https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=en&token=a`,
      { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(6000) }
    );

    // 404 for a post that is gone, 400 for an id that cannot exist. Both are a
    // real answer, and worth telling the visitor about. Anything else — a rate
    // limit, a 5xx, a timeout — is our problem, not theirs.
    if (res.status === 404 || res.status === 400) return { kind: 'missing' };
    if (!res.ok) return { kind: 'unknown' };

    return { kind: 'found', tweet: (await res.json()) as SyndicationTweet };
  } catch {
    return { kind: 'unknown' };
  }
}

/**
 * @param link      what the visitor pasted
 * @param handle    the X username they signed up with
 * @param quotedId  the whitelist post the quote is supposed to boost, if set
 */
export async function checkQuote(
  link: unknown,
  handle: string | null,
  quotedId: string
): Promise<QuoteCheck> {
  const parsed = parseStatusUrl(link);
  if (!parsed) {
    return { ok: false, verified: false, url: null, author: null, error: 'That is not a link to a post on X.' };
  }

  // Cheap check first: the URL says who wrote it.
  if (handle && parsed.author.toLowerCase() !== handle.toLowerCase()) {
    return {
      ok: false,
      verified: false,
      url: parsed.url,
      author: parsed.author,
      error: `That post is by @${parsed.author}, not @${handle}.`,
    };
  }

  const lookup = await fetchTweet(parsed.id);

  if (lookup.kind === 'missing') {
    return {
      ok: false,
      verified: false,
      url: parsed.url,
      author: parsed.author,
      error: 'No post on X at that link. Post it first, then copy the link.',
    };
  }

  if (lookup.kind === 'unknown') {
    // X did not answer. Take the link and mark it unconfirmed rather than
    // blocking someone over an endpoint we do not control.
    return { ok: true, verified: false, url: parsed.url, author: parsed.author };
  }

  const tweet = lookup.tweet;
  const author = tweet.user?.screen_name ?? parsed.author;
  if (handle && author.toLowerCase() !== handle.toLowerCase()) {
    return {
      ok: false,
      verified: false,
      url: parsed.url,
      author,
      error: `That post is by @${author}, not @${handle}.`,
    };
  }

  // Confirm it actually quotes the whitelist post. The payload names this
  // differently depending on the shape it returns, so accept either the
  // dedicated field or the id turning up among the post's links.
  const quotesTarget =
    !quotedId ||
    tweet.quoted_tweet?.id_str === quotedId ||
    (tweet.entities?.urls ?? []).some((entry) => entry.expanded_url?.includes(quotedId)) ||
    (tweet.text ?? '').includes(quotedId);

  return { ok: true, verified: quotesTarget, url: parsed.url, author };
}

/** The whitelist post id, shared by the flow and the verifier. */
export const launchTweetId = () =>
  /status\/(\d+)/.exec(process.env.NEXT_PUBLIC_LAUNCH_POST_URL ?? '')?.[1] ?? '';

/* ------------------------------------------------------------ replies */

export type ReplyCheck =
  | { ok: true; id: string; url: string; author: string }
  /** `retry` means X did not answer — not that the link is wrong. */
  | { ok: false; error: string; retry?: boolean };

/**
 * Pure half of `checkReply`: given what X returned, is this a direct reply to
 * `targetId`? Kept separate so the decision can be tested without X.
 */
export function evaluateReply(
  tweet: SyndicationTweet,
  targetId: string,
  fallback: { id: string; author: string }
): ReplyCheck {
  // Tombstones (age-gated, withheld, suspended) come back under another name.
  if (tweet.__typename && tweet.__typename !== 'Tweet') {
    return { ok: false, error: 'X will not show that post publicly, so it cannot be checked. Reply from a public account.' };
  }

  const replyTo = tweet.in_reply_to_status_id_str ?? tweet.parent?.id_str;
  if (!replyTo) {
    return {
      ok: false,
      error: 'That post is not a reply. Tap COMMENT, post your reply, then copy the link to the reply itself.',
    };
  }
  if (replyTo !== targetId) {
    return { ok: false, error: 'That is a reply to a different post. Comment on the BoyMeetsHood post.' };
  }

  const id = tweet.id_str ?? fallback.id;
  const author = tweet.user?.screen_name ?? fallback.author;
  return { ok: true, id, author, url: `https://x.com/${author}/status/${id}` };
}

/**
 * Confirms a pasted link is someone's reply to the allowlist post. Unlike
 * `checkQuote`, an unanswered lookup is a failure (see the note at the top).
 */
export async function checkReply(link: unknown, targetId: string): Promise<ReplyCheck> {
  const parsed = parseStatusUrl(link);
  if (!parsed) return { ok: false, error: 'That is not a link to a post on X.' };
  if (parsed.id === targetId) {
    return { ok: false, error: 'That is the post itself. Paste the link to your reply under it.' };
  }

  const lookup = await fetchTweet(parsed.id);
  if (lookup.kind === 'missing') {
    return {
      ok: false,
      error: 'No post on X at that link. If your account is private X hides it — reply from a public account.',
    };
  }
  if (lookup.kind === 'unknown') {
    return { ok: false, retry: true, error: 'Could not reach X to check the comment. Try again in a minute.' };
  }

  return evaluateReply(lookup.tweet, targetId, parsed);
}
