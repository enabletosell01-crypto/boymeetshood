'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import config from '@/data/communities.json';
import {
  BALOO,
  FLOW_KEYFRAMES,
  INK,
  LIME,
  MONO,
  PANEL,
  blurb,
  fieldStyle,
  ghostButton,
  primaryButton,
  title,
} from './flow-kit';

/**
 * Partner-community allowlist, in the order the brief laid it out:
 *
 *   pick community → paste wallet → snapshot check → comment on the post →
 *   paste the comment link → verified → spot confirmed
 *
 * No wallet connection anywhere. Eligibility is a holder snapshot; the comment
 * is what binds a claim to a real X account, and the server re-checks both
 * inside one locked transaction, so nothing this component says is trusted.
 */

const EVM = /^0x[a-fA-F0-9]{40}$/;
const RED = '#ff6f86';
const AMBER = '#ffd23b';

type Community = { slug: string; name: string; accent: string; logo: string | null; cap: number };
type Status = Community & { claimed: number; remaining: number; holders: number };

/** Tiles render from config straight away; the API fills in real counts. */
const CONFIGURED: Status[] = config.communities.map((entry) => {
  const cap = (entry as { cap?: number }).cap ?? config.cap;
  return { ...entry, cap, claimed: 0, remaining: cap, holders: -1 };
});

type Step = 'pick' | 'wallet' | 'comment' | 'done';

type Check =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'eligible'; remaining: number; cap: number }
  | { state: 'not_holder' }
  | { state: 'full'; cap: number }
  | { state: 'claimed'; communityName: string; slot: number }
  | { state: 'pending' }
  | { state: 'error'; message: string };

type Comment = { url: string; status: 'idle' | 'checking' | 'ok' | 'error'; message: string; author?: string };

export type CommunityFlowProps = {
  open: boolean;
  onClose: () => void;
  /** From `?community=<slug>` — jumps straight to that community's wallet step. */
  initialCommunity?: string | null;
  /** The BoyMeetsHood tile: no NFT needed, so it hands off to the waitlist. */
  onOpenWaitlist: () => void;
};

const short = (wallet: string) => `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
const pad = (n: number) => String(n).padStart(2, '0');

export default function CommunityFlow({ open, onClose, initialCommunity, onOpenWaitlist }: CommunityFlowProps) {
  const [step, setStep] = useState<Step>('pick');
  const [statuses, setStatuses] = useState<Status[]>(CONFIGURED);
  const [serverOpen, setServerOpen] = useState<boolean | null>(null);
  // The collab post is set from /admin_secret and only handed out once live.
  const [postUrl, setPostUrl] = useState('');
  const [slug, setSlug] = useState<string | null>(null);
  const [wallet, setWallet] = useState('');
  const [check, setCheck] = useState<Check>({ state: 'idle' });
  const [comment, setComment] = useState<Comment>({ url: '', status: 'idle', message: '' });
  const [opened, setOpened] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [claim, setClaim] = useState<{ slot: number; cap: number; author: string } | null>(null);

  const walletField = useRef<HTMLInputElement>(null);
  const commentTimer = useRef<number | undefined>(undefined);
  const latestComment = useRef('');
  const deepLinked = useRef(false);

  const claimsOpen = serverOpen === true;
  const postId = /status\/(\d+)/.exec(postUrl)?.[1] ?? '';
  const selected = statuses.find((s) => s.slug === slug) ?? null;
  const totalCap = statuses.reduce((sum, s) => sum + s.cap, 0);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/community', { cache: 'no-store' });
      const data = (await res.json()) as { open?: boolean; postUrl?: string | null; communities?: Status[] };
      if (Array.isArray(data.communities)) setStatuses(data.communities);
      if (typeof data.open === 'boolean') setServerOpen(data.open);
      setPostUrl(typeof data.postUrl === 'string' ? data.postUrl : '');
    } catch {
      /* the tiles keep their configured defaults */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadStatus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, loadStatus]);

  // A shared community link opens on that community — once per opening, so a
  // later re-render can never yank someone back from the comment step.
  useEffect(() => {
    if (!open || deepLinked.current || !initialCommunity) return;
    deepLinked.current = true;
    if (CONFIGURED.some((c) => c.slug === initialCommunity)) {
      setSlug(initialCommunity);
      setStep('wallet');
    }
  }, [open, initialCommunity]);

  useEffect(() => {
    if (!open || step !== 'wallet') return;
    const focus = window.setTimeout(() => walletField.current?.focus(), 140);
    return () => window.clearTimeout(focus);
  }, [open, step]);

  useEffect(() => () => window.clearTimeout(commentTimer.current), []);

  const reset = useCallback(() => {
    setStep('pick');
    setSlug(null);
    setWallet('');
    setCheck({ state: 'idle' });
    setComment({ url: '', status: 'idle', message: '' });
    setOpened(false);
    setError('');
    setClaim(null);
    latestComment.current = '';
    deepLinked.current = false;
  }, []);

  const close = useCallback(() => {
    onClose();
    // Let the exit finish before the contents snap back to the tiles.
    window.setTimeout(reset, 260);
  }, [onClose, reset]);

  const pick = (next: string) => {
    setSlug(next);
    setCheck({ state: 'idle' });
    setError('');
    setStep('wallet');
  };

  /* ------------------------------------------------------------- actions */

  const checkWallet = async () => {
    const value = wallet.trim();
    if (!EVM.test(value)) {
      setCheck({
        state: 'error',
        message: 'Paste a 0x wallet address — 42 characters. ENS names cannot be matched against a snapshot.',
      });
      return;
    }

    setCheck({ state: 'checking' });
    try {
      const res = await fetch('/api/community/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ community: slug, wallet: value }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        open?: boolean;
        status?: string;
        remaining?: number;
        cap?: number;
        slot?: number;
        communityName?: string;
        postUrl?: string | null;
      };
      if (!res.ok || !data.ok) {
        setCheck({ state: 'error', message: data.error ?? 'Could not check that wallet.' });
        return;
      }
      if (typeof data.open === 'boolean') setServerOpen(data.open);
      if (typeof data.postUrl === 'string') setPostUrl(data.postUrl);

      switch (data.status) {
        case 'eligible':
          setCheck({ state: 'eligible', remaining: data.remaining ?? 0, cap: data.cap ?? 0 });
          break;
        case 'not_holder':
          setCheck({ state: 'not_holder' });
          break;
        case 'full':
          setCheck({ state: 'full', cap: data.cap ?? 0 });
          break;
        case 'claimed':
          setCheck({ state: 'claimed', communityName: data.communityName ?? 'a community', slot: data.slot ?? 0 });
          break;
        default:
          setCheck({ state: 'pending' });
      }
    } catch {
      setCheck({ state: 'error', message: 'Network is not cooperating. Try again in a moment.' });
    }
  };

  const verifyComment = useCallback(async (url: string) => {
    try {
      const res = await fetch('/api/community/verify-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentUrl: url }),
      });
      const data = (await res.json()) as { ok?: boolean; author?: string; error?: string };
      // A slower answer for an older paste must not overwrite a newer one.
      if (url !== latestComment.current) return;
      setComment(
        data.ok
          ? { url, status: 'ok', author: data.author, message: `VERIFIED · @${data.author} COMMENTED ON THE POST` }
          : { url, status: 'error', message: data.error ?? 'That link did not check out.' }
      );
    } catch {
      if (url === latestComment.current) {
        setComment({ url, status: 'error', message: 'Could not reach the server. Try again.' });
      }
    }
  }, []);

  /** Checks as they type, not on blur — blur never fires if they paste and go straight for the button. */
  const onCommentChange = (url: string) => {
    latestComment.current = url;
    const filled = url.trim() !== '';
    setComment({ url, status: filled ? 'checking' : 'idle', message: filled ? 'CHECKING WITH X…' : '' });
    setError('');
    window.clearTimeout(commentTimer.current);
    if (filled) commentTimer.current = window.setTimeout(() => void verifyComment(url.trim()), 600);
  };

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/community/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ community: slug, wallet: wallet.trim(), commentUrl: comment.url.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; slot?: number; cap?: number; author?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Could not claim the spot. Try again.');
        void loadStatus();
        return;
      }
      setClaim({ slot: data.slot ?? 0, cap: data.cap ?? 0, author: data.author ?? comment.author ?? '' });
      setStep('done');
      void loadStatus();
    } catch {
      setError('Network is not cooperating. Try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  const stepIndex = step === 'pick' || step === 'wallet' ? 0 : step === 'comment' ? 1 : 2;
  const label =
    step === 'pick'
      ? 'COMMUNITY ALLOWLIST'
      : step === 'wallet'
        ? 'STEP 1 OF 3 · CHECK'
        : step === 'comment'
          ? 'STEP 2 OF 3 · CLAIM'
          : 'SPOT SECURED';

  const replyText = selected ? `Holding ${selected.name} — claiming my spot in the Hood 🤝 #BoyMeetsHood` : '';
  const replyIntent = `https://x.com/intent/post?in_reply_to=${postId}&text=${encodeURIComponent(replyText)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Check your community"
      onClick={close}
      className="bmh-viewport"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        boxSizing: 'border-box',
        background: 'rgba(4,5,8,.78)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        fontFamily: "'Outfit', system-ui, sans-serif",
        color: '#fff',
        animation: 'bmhJoinVeil .28s ease both',
      }}
    >
      <style>{FLOW_KEYFRAMES}</style>

      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 520,
          maxHeight: '100%',
          overflowY: 'auto',
          borderRadius: 30,
          padding: 1,
          background: 'linear-gradient(150deg, rgba(198,245,17,.55), rgba(124,92,255,.5) 55%, rgba(34,225,255,.45))',
          boxShadow: '0 40px 110px -30px rgba(0,0,0,.9)',
          animation: 'bmhJoinIn .42s cubic-bezier(.2,1,.3,1) both',
        }}
      >
        <div style={{ borderRadius: 29, background: INK, padding: '22px 22px 26px' }}>
          <Header stepIndex={stepIndex} label={label} onClose={close} />

          {step === 'pick' && (
            <div>
              {title('Check your community')}
              {blurb(
                `Hold one of these? ${totalCap} whitelist spots — ${config.cap} per community, first come first served. ` +
                  'No wallet connection: just paste the address.'
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))', gap: 10 }}>
                <Tile
                  name="BoyMeetsHood"
                  accent={LIME}
                  logo="/assets/logo.png"
                  chip="OPEN TO ALL"
                  chipTone={LIME}
                  highlight
                  onClick={onOpenWaitlist}
                />
                {statuses.map((s) => {
                  const loading = s.holders < 0;
                  const pending = s.holders === 0;
                  const full = !loading && !pending && s.remaining === 0;
                  return (
                    <Tile
                      key={s.slug}
                      name={s.name}
                      accent={s.accent}
                      logo={s.logo}
                      chip={
                        loading
                          ? `${s.cap} SPOTS`
                          : pending
                            ? 'SNAPSHOT PENDING'
                            : full
                              ? 'FULL'
                              : `${s.remaining}/${s.cap} LEFT`
                      }
                      chipTone={full || pending ? 'rgba(255,255,255,.4)' : s.remaining <= 5 && !loading ? AMBER : 'rgba(255,255,255,.6)'}
                      muted={full}
                      onClick={() => pick(s.slug)}
                    />
                  );
                })}
              </div>

              <p style={fine}>
                SNAPSHOT-BASED · ONE SPOT PER WALLET · ONE SPOT PER X ACCOUNT
                {!claimsOpen && (
                  <>
                    <br />
                    <span style={{ color: AMBER }}>CLAIMS OPEN WHEN THE POST GOES LIVE — CHECK YOUR WALLET NOW.</span>
                  </>
                )}
              </p>
            </div>
          )}

          {step === 'wallet' && selected && (
            <div>
              <CommunityBadge community={selected} />
              {title('Paste your wallet')}
              {blurb(`The wallet that holds your ${selected.name}. It is checked against the holder snapshot — nothing to sign, nothing to connect.`)}

              <input
                ref={walletField}
                value={wallet}
                onChange={(event) => {
                  setWallet(event.target.value);
                  setCheck({ state: 'idle' });
                }}
                onKeyDown={(event) => event.key === 'Enter' && wallet.trim() && void checkWallet()}
                placeholder="0x0000…"
                spellCheck={false}
                autoCapitalize="none"
                autoComplete="off"
                style={{ ...fieldStyle, paddingLeft: 16 }}
              />

              <CheckResult check={check} community={selected} wallet={wallet.trim()} claimsOpen={claimsOpen} />

              {check.state === 'eligible' ? (
                <button
                  onClick={() => setStep('comment')}
                  disabled={!claimsOpen}
                  style={primaryButton(claimsOpen)}
                >
                  {claimsOpen ? 'CLAIM WHITELIST SPOT' : 'CLAIMS OPEN SOON'}
                </button>
              ) : check.state === 'claimed' ? (
                <button onClick={close} style={primaryButton(true)}>
                  DONE
                </button>
              ) : (
                <button
                  onClick={() => void checkWallet()}
                  disabled={!wallet.trim() || check.state === 'checking'}
                  style={primaryButton(Boolean(wallet.trim()) && check.state !== 'checking')}
                >
                  {check.state === 'checking' ? 'CHECKING…' : 'CHECK ELIGIBILITY'}
                </button>
              )}

              {(check.state === 'not_holder' || check.state === 'full') && (
                <button onClick={onOpenWaitlist} style={{ ...ghostButton, width: '100%', marginTop: 10 }}>
                  JOIN THE PUBLIC WAITLIST INSTEAD
                </button>
              )}

              <BackLink onClick={() => setStep('pick')}>‹ ALL COMMUNITIES</BackLink>
            </div>
          )}

          {step === 'comment' && selected && (
            <div>
              <CommunityBadge community={selected} />
              {title('Claim your spot')}
              {blurb('Two things and the spot is yours: the wallet you just checked, and a comment on our latest post. First come, first served.')}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 13,
                  minHeight: 62,
                  padding: '0 15px',
                  marginBottom: 9,
                  borderRadius: 18,
                  border: '1px solid rgba(198,245,17,.45)',
                  background: 'rgba(198,245,17,.08)',
                }}
              >
                <StepDot done label="1" />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>Your wallet</span>
                  <span style={{ display: 'block', fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>
                    {short(wallet.trim())} · {selected.name.toUpperCase()} HOLDER
                  </span>
                </span>
                <button
                  onClick={() => setStep('wallet')}
                  style={{
                    marginLeft: 'auto',
                    padding: 6,
                    border: 'none',
                    background: 'transparent',
                    color: 'rgba(255,255,255,.45)',
                    fontFamily: MONO,
                    fontSize: 9.5,
                    letterSpacing: '.14em',
                    cursor: 'pointer',
                  }}
                >
                  CHANGE
                </button>
              </div>

              <a
                href={replyIntent}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpened(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 13,
                  minHeight: 62,
                  padding: '0 15px',
                  borderRadius: 18,
                  border: `1px solid ${opened ? 'rgba(198,245,17,.45)' : 'rgba(255,255,255,.1)'}`,
                  background: opened ? 'rgba(198,245,17,.08)' : 'rgba(255,255,255,.04)',
                  color: '#fff',
                  textDecoration: 'none',
                }}
              >
                <StepDot done={opened} label="2" />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>Comment on our latest post</span>
                  <span style={{ display: 'block', fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,.42)', marginTop: 2 }}>
                    Opens X with a reply ready to send
                  </span>
                </span>
                <span style={{ marginLeft: 'auto', color: opened ? LIME : 'rgba(255,255,255,.35)', fontSize: 17 }}>
                  {opened ? '✓' : '↗'}
                </span>
              </a>

              <div
                style={{
                  marginTop: 9,
                  borderRadius: 18,
                  border: `1px solid ${comment.status === 'ok' ? 'rgba(198,245,17,.4)' : 'rgba(255,255,255,.1)'}`,
                  background: 'rgba(255,255,255,.03)',
                  padding: '13px 15px',
                }}
              >
                <label htmlFor="bmh-comment" style={fieldLabel}>
                  PASTE THE LINK TO YOUR COMMENT
                </label>
                <input
                  id="bmh-comment"
                  value={comment.url}
                  onChange={(event) => onCommentChange(event.target.value)}
                  placeholder="https://x.com/you/status/…"
                  spellCheck={false}
                  autoCapitalize="none"
                  autoComplete="off"
                  style={{ ...fieldStyle, paddingLeft: 14, fontSize: 13, borderRadius: 13 }}
                />
                <div
                  style={{
                    marginTop: 8,
                    fontFamily: MONO,
                    fontSize: 9.5,
                    letterSpacing: '.12em',
                    lineHeight: 1.6,
                    color: comment.status === 'ok' ? LIME : comment.status === 'error' ? RED : 'rgba(255,255,255,.4)',
                  }}
                >
                  {comment.message || 'ON X: TAP SHARE ON YOUR REPLY → COPY LINK, THEN DROP IT HERE.'}
                </div>
              </div>

              <button
                onClick={() => void confirm()}
                disabled={comment.status !== 'ok' || busy}
                style={primaryButton(comment.status === 'ok' && !busy)}
              >
                {busy ? 'CLAIMING…' : 'CONFIRM MY SPOT'}
              </button>

              <p style={fine}>
                ONE SPOT PER WALLET AND PER X ACCOUNT. KEEP THE COMMENT UP — IT IS THE RECORD OF YOUR CLAIM.
              </p>

              <BackLink onClick={() => setStep('wallet')}>‹ BACK</BackLink>
            </div>
          )}

          {step === 'done' && selected && claim && (
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.24em', color: LIME, marginBottom: 8, animation: 'bmhJoinPulse 2.4s ease-in-out infinite' }}>
                SPOT SECURED
              </div>
              {title("You're on the list.")}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  marginTop: 4,
                  borderRadius: 22,
                  border: '1px solid rgba(198,245,17,.3)',
                  background: PANEL,
                  padding: 16,
                  animation: 'bmhJoinCard .7s cubic-bezier(.2,1,.3,1) both',
                }}
              >
                <Logo name={selected.name} accent={selected.accent} logo={selected.logo} size={56} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: BALOO, fontWeight: 800, fontSize: 20, lineHeight: 1.1 }}>{selected.name}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.12em', color: 'rgba(255,255,255,.5)', marginTop: 4 }}>
                    {short(wallet.trim())} · @{claim.author}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 24, color: LIME, letterSpacing: '-.02em' }}>
                    {pad(claim.slot)}/{claim.cap}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '.16em', color: 'rgba(255,255,255,.4)' }}>SPOT</div>
                </div>
              </div>

              <p style={{ margin: '16px 0 0', fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,.62)' }}>
                This wallet is on the BoyMeetsHood mint list. Nothing to sign now — mint details come later.
              </p>

              <button onClick={close} style={primaryButton(true)}>
                DONE
              </button>
            </div>
          )}

          {error && (
            <p role="alert" style={{ margin: '14px 0 0', fontFamily: MONO, fontSize: 11, letterSpacing: '.1em', lineHeight: 1.7, color: RED }}>
              {error.toUpperCase()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ parts */

const fine: CSSProperties = {
  margin: '14px 0 0',
  fontFamily: MONO,
  fontSize: 9,
  lineHeight: 1.8,
  letterSpacing: '.1em',
  color: 'rgba(255,255,255,.32)',
};

const fieldLabel: CSSProperties = {
  display: 'block',
  fontFamily: MONO,
  fontSize: 10,
  letterSpacing: '.18em',
  color: 'rgba(255,255,255,.5)',
  marginBottom: 8,
};

function Header({ stepIndex, label, onClose }: { stepIndex: number; label: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            style={{
              width: index === stepIndex ? 22 : 8,
              height: 8,
              borderRadius: 99,
              transition: 'width .3s ease, background .3s ease',
              background: index <= stepIndex ? LIME : 'rgba(255,255,255,.18)',
            }}
          />
        ))}
      </div>
      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.22em', color: 'rgba(255,255,255,.42)' }}>{label}</span>
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          marginLeft: 'auto',
          width: 34,
          height: 34,
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,.14)',
          background: 'rgba(255,255,255,.05)',
          color: '#fff',
          fontSize: 17,
          lineHeight: 1,
          cursor: 'pointer',
        }}
      >
        ×
      </button>
    </div>
  );
}

/** Pixel-art logos stay crisp; a missing file falls back to a monogram. */
function Logo({ name, accent, logo, size }: { name: string; accent: string; logo: string | null; size: number }) {
  const [failed, setFailed] = useState(false);
  const box: CSSProperties = { width: size, height: size, borderRadius: Math.round(size * 0.3), flex: '0 0 auto' };

  if (logo && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt=""
        width={size}
        height={size}
        onError={() => setFailed(true)}
        style={{ ...box, objectFit: 'cover', imageRendering: 'pixelated', display: 'block' }}
      />
    );
  }

  const initials = name
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      aria-hidden="true"
      style={{
        ...box,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `${accent}1f`,
        border: `1px solid ${accent}66`,
        color: accent,
        fontFamily: BALOO,
        fontWeight: 800,
        fontSize: Math.round(size * 0.4),
        boxSizing: 'border-box',
      }}
    >
      {initials}
    </span>
  );
}

function Tile({
  name,
  accent,
  logo,
  chip,
  chipTone,
  highlight = false,
  muted = false,
  onClick,
}: {
  name: string;
  accent: string;
  logo: string | null;
  chip: string;
  chipTone: string;
  highlight?: boolean;
  muted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 10,
        minHeight: 132,
        // 12px, not 14: on a 360px phone the two-column tile has 110px inside,
        // and "BoyMeetsHood" needs ~107px at 16px with the tightened tracking.
        padding: 12,
        borderRadius: 20,
        border: `1px solid ${highlight ? 'rgba(198,245,17,.45)' : 'rgba(255,255,255,.1)'}`,
        background: highlight ? 'rgba(198,245,17,.07)' : 'rgba(255,255,255,.04)',
        color: '#fff',
        cursor: 'pointer',
        textAlign: 'left',
        opacity: muted ? 0.5 : 1,
        boxSizing: 'border-box',
      }}
    >
      <Logo name={name} accent={accent} logo={logo} size={44} />
      <span style={{ fontFamily: BALOO, fontWeight: 800, fontSize: 16, lineHeight: 1.1, letterSpacing: '-.02em' }}>{name}</span>
      <span style={{ marginTop: 'auto', fontFamily: MONO, fontSize: 9, letterSpacing: '.14em', color: chipTone }}>{chip}</span>
    </button>
  );
}

function CommunityBadge({ community }: { community: Status }) {
  const known = community.holders > 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <Logo name={community.name} accent={community.accent} logo={community.logo} size={40} />
      <div>
        <div style={{ fontFamily: BALOO, fontWeight: 800, fontSize: 17, lineHeight: 1.1 }}>{community.name}</div>
        <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.14em', color: 'rgba(255,255,255,.45)', marginTop: 3 }}>
          {known ? `${community.remaining}/${community.cap} SPOTS LEFT · ${community.holders.toLocaleString('en-US')} IN SNAPSHOT` : `${community.cap} SPOTS`}
        </div>
      </div>
    </div>
  );
}

function StepDot({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      style={{
        flex: '0 0 auto',
        width: 26,
        height: 26,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: MONO,
        fontSize: 12,
        fontWeight: 700,
        background: done ? LIME : 'rgba(255,255,255,.09)',
        color: done ? INK : 'rgba(255,255,255,.6)',
      }}
    >
      {done ? '✓' : label}
    </span>
  );
}

function CheckResult({
  check,
  community,
  wallet,
  claimsOpen,
}: {
  check: Check;
  community: Status;
  wallet: string;
  claimsOpen: boolean;
}) {
  if (check.state === 'idle' || check.state === 'checking') return null;

  const panel = (tone: string, headline: string, detail: string) => (
    <div
      style={{
        marginTop: 12,
        borderRadius: 16,
        border: `1px solid ${tone}55`,
        background: `${tone}12`,
        padding: '13px 15px',
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', color: tone }}>{headline}</div>
      <div style={{ fontSize: 13, lineHeight: 1.55, color: 'rgba(255,255,255,.66)', marginTop: 5 }}>{detail}</div>
    </div>
  );

  const who = EVM.test(wallet) ? short(wallet) : 'THIS WALLET';
  const name = community.name.toUpperCase();

  switch (check.state) {
    case 'eligible':
      return panel(
        LIME,
        `ELIGIBLE · ${who} HOLDS ${name}`,
        claimsOpen
          ? `${check.remaining} of ${check.cap} spots left. Next: one comment on X, and the spot is yours.`
          : `${check.remaining} of ${check.cap} spots left. Claims open when the post goes live — first ${check.cap} wallets take the spots.`
      );
    case 'not_holder':
      return panel(
        RED,
        `NOT IN THE ${name} SNAPSHOT`,
        'Holding on another wallet? Paste that one. Eligibility comes from a holder snapshot, so a very recent buy may not show.'
      );
    case 'full':
      return panel(AMBER, `ALL ${check.cap} ${name} SPOTS ARE TAKEN`, 'The public waitlist is still open.');
    case 'claimed':
      return panel(
        LIME,
        `ALREADY IN · SPOT ${pad(check.slot)} · ${check.communityName.toUpperCase()}`,
        'This wallet is on the mint list. One spot per wallet, so there is nothing else to do.'
      );
    case 'pending':
      return panel(AMBER, `${name} SNAPSHOT NOT LOADED YET`, 'Check back shortly.');
    case 'error':
      return panel(RED, 'CHECK FAILED', check.message);
  }
}

function BackLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        marginTop: 10,
        padding: 12,
        border: 'none',
        background: 'transparent',
        color: 'rgba(255,255,255,.45)',
        fontFamily: MONO,
        fontSize: 10.5,
        letterSpacing: '.14em',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
