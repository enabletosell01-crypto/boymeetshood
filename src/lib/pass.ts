/**
 * Hood Pass derivation, ported verbatim from the app design's logic class so a
 * shared card shows exactly what the visitor saw. Isomorphic on purpose: the
 * browser builds the share token, the server renders the image from it.
 */

export const MOODS = [
  { key: 'MOODY SAD', color: '#a89cff', line: 'Thunder in the charts, calm in the Hood.', sky: ['#141c33', '#2f3a63'] },
  { key: 'ANGRY', color: '#ff9a3b', line: 'Dry heat, hard wind, still standing.', sky: ['#3a1d16', '#7a3b1e'] },
  { key: 'HAPPY', color: '#c6f511', line: 'Green light, open air, easy breathing.', sky: ['#123524', '#2f7a4a'] },
  { key: 'NERVOUS', color: '#8fd8ff', line: 'Cold feet, warm bag, holding anyway.', sky: ['#152436', '#37628c'] },
] as const;

export const ART = [
  'ice', 'flame', 'cosmic', 'gold', 'king', 'bear', 'devil', 'jungle', 'skull',
  'astro', 'alien', 'pirate', 'snow', 'truck', 'scooter', 'hood', 'umbrella',
  'vamp', 'kid', 'dunk', 'soda', 'beam', 'doodle', 'wall', 'winter',
] as const;

const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

/** FNV-1a, 32-bit unsigned — the same hash the designs run on the wallet. */
export function hashWallet(wallet: string): number {
  let h = 2166136261;
  const lower = wallet.toLowerCase();
  for (let i = 0; i < lower.length; i++) {
    h ^= lower.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

export function shortenWallet(wallet: string): string {
  return wallet.length > 13 ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : wallet;
}

export type PassCard = {
  number: string;
  code: string;
  mood: (typeof MOODS)[number];
  art: (typeof ART)[number];
  shortWallet: string;
  issued: string;
};

export function passFromHash(hash: number, shortWallet: string, at = new Date()): PassCard {
  const hex = hash.toString(16).toUpperCase().padStart(8, '0');
  return {
    number: `#${String(hash % 4444).padStart(4, '0')}`,
    code: `BOYS-${hex.slice(0, 4)}-${hex.slice(4, 8)}`,
    mood: MOODS[hash % MOODS.length],
    art: ART[(hash >>> 4) % ART.length],
    shortWallet,
    issued: `${MONTHS[at.getMonth()]} / ${at.getFullYear()}`,
  };
}

/* ------------------------------------------------------------ share token */

/**
 * What travels in the share URL.
 *
 * The hash rather than the wallet: it is one-way, and everything on the card
 * except the address label derives from it. The address itself is only carried
 * in the truncated form the tweet already prints — the full one stays out of a
 * link built to be posted publicly.
 */
const base64url = {
  encode(value: string): string {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    const b64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(value).toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  decode(token: string): string | null {
    try {
      const b64 = token.replace(/-/g, '+').replace(/_/g, '/');
      if (typeof atob === 'function') {
        const binary = atob(b64);
        const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
        return new TextDecoder().decode(bytes);
      }
      return Buffer.from(b64, 'base64').toString('utf8');
    } catch {
      return null;
    }
  },
};

/** Display-only, so it is clamped to what a truncated address can contain. */
const SAFE_SHORT = /^[0-9a-zA-Z.…\-_]{1,24}$/;

export function encodePassToken(wallet: string): string {
  const hash = hashWallet(wallet);
  return base64url.encode(`${hash.toString(36)}|${shortenWallet(wallet)}`);
}

export function decodePassToken(token: string): { hash: number; shortWallet: string } | null {
  const raw = base64url.decode(token);
  if (!raw) return null;

  const split = raw.indexOf('|');
  if (split === -1) return null;

  const hash = Number.parseInt(raw.slice(0, split), 36);
  const shortWallet = raw.slice(split + 1);
  if (!Number.isFinite(hash) || hash < 0 || hash > 0xffffffff) return null;
  if (!SAFE_SHORT.test(shortWallet)) return null;

  return { hash, shortWallet };
}
