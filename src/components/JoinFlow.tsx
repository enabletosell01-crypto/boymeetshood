'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { encodePassToken, hashIdentity, normalizeHandle, passFromHash } from '@/lib/pass';

/**
 * The join flow, in the order the drop actually works:
 *
 *   handle → pass is minted → claim it (quote · like · comment) → wallet
 *
 * It lives here rather than in either handoff because both designs need the
 * identical flow, and because the pass now keys off the X handle — a change
 * that runs deeper than the waitlist screens either design shipped with.
 *
 * On what it can and cannot know: nothing in a browser can confirm a like, a
 * quote or a reply. Those need the X API and an authorised account. So each
 * step opens the real intent and records what the visitor says they did, and
 * the copy says exactly that — the same promise the site already makes about
 * follows, which is that they are checked against the account before the drop.
 */

const LIME = '#c6f511';
const INK = '#0b0d11';
const PANEL = '#12141a';
const BALOO = "'Baloo 2', cursive";
const MONO = "'Space Mono', monospace";

/** The post people quote and reply to. Without it, the flow asks for a follow. */
const LAUNCH_POST = process.env.NEXT_PUBLIC_LAUNCH_POST_URL?.trim() || '';
const LAUNCH_TWEET_ID = /status\/(\d+)/.exec(LAUNCH_POST)?.[1] ?? '';
const X_HANDLE = 'boymeetsh00d';

type Step = 'identity' | 'pass' | 'claim' | 'done';
type TaskId = 'quoted' | 'retweeted' | 'liked' | 'commented';

export type JoinFlowProps = {
  open: boolean;
  onClose: () => void;
  source: 'desktop' | 'mobile';
  /** Lets the surrounding design catch up: queue size, and the pass just minted. */
  onJoined?: (total: number, handle: string, wallet: string) => void;
};

const EVM = /^0x[a-fA-F0-9]{40}$/;
const LOOSE = /^[a-zA-Z0-9._-]{8,64}$/;

export default function JoinFlow({ open, onClose, source, onJoined }: JoinFlowProps) {
  const [step, setStep] = useState<Step>('identity');
  const [handle, setHandle] = useState('');
  const [wallet, setWallet] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Record<TaskId, boolean>>({
    quoted: false,
    retweeted: false,
    liked: false,
    commented: false,
  });
  const [quote, setQuote] = useState<{
    url: string;
    status: 'idle' | 'checking' | 'ok' | 'unconfirmed' | 'error';
    message: string;
  }>({ url: '', status: 'idle', message: '' });
  const [result, setResult] = useState<{ position: number; total: number } | null>(null);
  const [origin, setOrigin] = useState('');

  const firstField = useRef<HTMLInputElement>(null);
  const quoteTimer = useRef<number | undefined>(undefined);

  useEffect(() => setOrigin(window.location.origin), []);

  // The app design owns the viewport with position:fixed, so the overlay has to
  // sit above it and stop the page underneath from scrolling with it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const focus = window.setTimeout(() => firstField.current?.focus(), 120);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(focus);
    };
  }, [open, onClose]);

  const cleanHandle = normalizeHandle(handle);
  const pass = useMemo(
    () => (cleanHandle ? passFromHash(hashIdentity(cleanHandle), `@${cleanHandle}`) : null),
    [cleanHandle]
  );
  const token = cleanHandle ? encodePassToken(cleanHandle, `@${cleanHandle}`) : '';
  const passUrl = token && origin ? `${origin}/p/${token}` : '';

  const reset = useCallback(() => {
    setStep('identity');
    setHandle('');
    setWallet('');
    setError('');
    setResult(null);
    setQuote({ url: '', status: 'idle', message: '' });
    setDone({ quoted: false, retweeted: false, liked: false, commented: false });
  }, []);

  const close = useCallback(() => {
    onClose();
    // Let the exit finish before the contents snap back to step one.
    window.setTimeout(reset, 260);
  }, [onClose, reset]);

  /* ------------------------------------------------------------- actions */

  const createPass = () => {
    if (!cleanHandle) {
      setError('That is not an X username. Letters, numbers and _ only, up to 15.');
      return;
    }
    setError('');
    setStep('pass');
  };

  /**
   * Checks the pasted link the moment it lands. The submit handler checks again
   * server-side — this is so a wrong link is caught while they are still
   * looking at it, not four fields later.
   */
  const verifyQuote = useCallback(
    async (url: string) => {
      if (!url.trim()) return setQuote({ url, status: 'idle', message: '' });
      setQuote({ url, status: 'checking', message: 'CHECKING WITH X…' });
      try {
        const res = await fetch('/api/waitlist/verify-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quoteUrl: url, xUsername: cleanHandle }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          verified?: boolean;
          author?: string | null;
          error?: string;
        };
        if (!data.ok) {
          setQuote({ url, status: 'error', message: data.error ?? 'That link did not check out.' });
          return;
        }
        setQuote(
          data.verified
            ? { url, status: 'ok', message: `VERIFIED · @${data.author} QUOTED THE POST` }
            : { url, status: 'unconfirmed', message: `POST FOUND · @${data.author} · QUOTE NOT CONFIRMED` }
        );
      } catch {
        setQuote({ url, status: 'unconfirmed', message: 'COULD NOT REACH X — LINK SAVED ANYWAY' });
      }
    },
    [cleanHandle]
  );

  /**
   * Checks as they type rather than on blur. Blur never fires if someone pastes
   * and goes straight for the button, which would let an unchecked — or plainly
   * wrong — link through the form.
   */
  const onQuoteChange = useCallback(
    (url: string) => {
      setQuote({ url, status: url.trim() ? 'checking' : 'idle', message: url.trim() ? 'CHECKING WITH X…' : '' });
      window.clearTimeout(quoteTimer.current);
      if (!url.trim()) return;
      quoteTimer.current = window.setTimeout(() => void verifyQuote(url), 600);
    },
    [verifyQuote]
  );

  useEffect(() => () => window.clearTimeout(quoteTimer.current), []);

  const openTask = (id: TaskId, url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    setDone((current) => ({ ...current, [id]: true }));
  };

  const submitWallet = async () => {
    const value = wallet.trim();
    if (!value) return setError('Paste the wallet that should hold the mint.');
    if (!EVM.test(value) && !LOOSE.test(value)) return setError('That address does not look right.');

    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: value,
          xUsername: cleanHandle,
          passNo: pass?.number ?? null,
          quoteUrl: quote.url.trim() || null,
          source,
          ...done,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; position?: number; total?: number };

      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Could not save your spot. Try again in a moment.');
        return;
      }
      setResult({ position: data.position ?? 0, total: data.total ?? 0 });
      if (typeof data.total === 'number') onJoined?.(data.total, cleanHandle ?? '', value);
      setStep('done');
    } catch {
      setError('Network is not cooperating. Try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  /* --------------------------------------------------------------- tasks */

  // Short, carries the pass, names the account, ends on a hook — and leaves
  // room for the quoted post's own 23 characters.
  const quoteText = pass
    ? `I just claimed my Hood Pass 👀\n\n` +
      `HOOD PASS ${pass.number} · MOOD · ${pass.mood.key}\n` +
      `4,444 Boys are gathering on @${X_HANDLE}\n\n` +
      `Who's getting HOODED? 🔥`
    : '';

  const tasks = LAUNCH_TWEET_ID
    ? [
        {
          id: 'quoted' as const,
          title: 'Quote the whitelist post',
          hint: 'Opens X with your pass already written',
          url: `https://x.com/intent/post?text=${encodeURIComponent(quoteText)}&url=${encodeURIComponent(LAUNCH_POST)}`,
        },
        {
          id: 'retweeted' as const,
          title: 'Repost it',
          hint: 'One tap on X',
          url: `https://x.com/intent/retweet?tweet_id=${LAUNCH_TWEET_ID}`,
        },
        {
          id: 'liked' as const,
          title: 'Like it',
          hint: 'One tap on X',
          url: `https://x.com/intent/like?tweet_id=${LAUNCH_TWEET_ID}`,
        },
        {
          id: 'commented' as const,
          title: 'Leave a comment',
          hint: 'Say something in the replies',
          url: `https://x.com/intent/post?in_reply_to=${LAUNCH_TWEET_ID}`,
        },
      ]
    : [
        {
          id: 'quoted' as const,
          title: `Follow @${X_HANDLE}`,
          hint: 'The drop post is not up yet',
          url: `https://x.com/intent/follow?screen_name=${X_HANDLE}`,
        },
      ];

  const stepIndex = step === 'identity' ? 0 : step === 'pass' ? 1 : 2;
  const stepLabel = step === 'done' ? 'YOU ARE ON THE LIST' : `STEP ${stepIndex + 1} OF 3`;

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Submit waitlist"
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
        // globals.css deliberately ships no reset — the designs depend on the
        // default box model — so the overlay has to opt in, or its padding adds
        // to 100svh and pushes the panel past the bottom of a short screen.
        boxSizing: 'border-box',
        background: 'rgba(4,5,8,.78)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        fontFamily: "'Outfit', system-ui, sans-serif",
        animation: 'bmhJoinVeil .28s ease both',
      }}
    >
      <style>{KEYFRAMES}</style>

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
          background: `linear-gradient(150deg, rgba(198,245,17,.55), rgba(124,92,255,.5) 55%, rgba(34,225,255,.45))`,
          boxShadow: '0 40px 110px -30px rgba(0,0,0,.9)',
          animation: 'bmhJoinIn .42s cubic-bezier(.2,1,.3,1) both',
        }}
      >
        <div style={{ borderRadius: 29, background: INK, padding: '22px 22px 26px' }}>
          <Header stepIndex={stepIndex} label={stepLabel} onClose={close} />

          {step === 'identity' && (
            <Identity
              inputRef={firstField}
              handle={handle}
              setHandle={(value) => {
                setHandle(value);
                setError('');
              }}
              onSubmit={createPass}
            />
          )}

          {step === 'pass' && pass && (
            <PassReveal
              handle={cleanHandle ?? ''}
              pass={pass}
              token={token}
              onBack={() => setStep('identity')}
              onClaim={() => setStep('claim')}
            />
          )}

          {step === 'claim' && (
            <Claim
              tasks={tasks}
              done={done}
              openTask={openTask}
              needsQuoteLink={Boolean(LAUNCH_TWEET_ID)}
              quote={quote}
              onQuoteChange={onQuoteChange}
              wallet={wallet}
              setWallet={(value) => {
                setWallet(value);
                setError('');
              }}
              busy={busy}
              onSubmit={submitWallet}
              onBack={() => setStep('pass')}
            />
          )}

          {step === 'done' && pass && result && (
            <Confirmed
              pass={pass}
              handle={cleanHandle ?? ''}
              result={result}
              passUrl={passUrl}
              quoteText={quoteText}
              onClose={close}
            />
          )}

          {error && (
            <p
              role="alert"
              style={{
                margin: '14px 0 0',
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: '.1em',
                lineHeight: 1.7,
                color: '#ff6f86',
              }}
            >
              {error.toUpperCase()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ parts */

function Header({
  stepIndex,
  label,
  onClose,
}: {
  stepIndex: number;
  label: string;
  onClose: () => void;
}) {
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
      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.22em', color: 'rgba(255,255,255,.42)' }}>
        {label}
      </span>
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

const title = (text: string) => (
  <h2 style={{ margin: '0 0 8px', fontFamily: BALOO, fontWeight: 800, fontSize: 30, letterSpacing: '-.02em' }}>
    {text}
  </h2>
);

const blurb = (text: string) => (
  <p style={{ margin: '0 0 18px', fontSize: 14.5, lineHeight: 1.6, color: 'rgba(255,255,255,.62)' }}>{text}</p>
);

const primaryButton = (enabled: boolean): React.CSSProperties => ({
  width: '100%',
  minHeight: 56,
  marginTop: 18,
  borderRadius: 20,
  border: 'none',
  fontFamily: BALOO,
  fontWeight: 800,
  fontSize: 18,
  cursor: enabled ? 'pointer' : 'not-allowed',
  background: enabled ? LIME : 'rgba(255,255,255,.08)',
  color: enabled ? INK : 'rgba(255,255,255,.35)',
  boxShadow: enabled ? '0 14px 40px -14px rgba(198,245,17,.8)' : 'none',
  transition: 'transform .18s cubic-bezier(.2,1.4,.4,1)',
});

const ghostButton: React.CSSProperties = {
  minHeight: 44,
  padding: '0 16px',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,.14)',
  background: 'rgba(255,255,255,.05)',
  color: '#fff',
  fontFamily: MONO,
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '.12em',
  cursor: 'pointer',
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,.05)',
  border: '1px solid rgba(255,255,255,.14)',
  borderRadius: 16,
  padding: '16px 16px 16px 40px',
  color: '#fff',
  fontFamily: MONO,
  fontSize: 15,
  outline: 'none',
};

function Identity({
  inputRef,
  handle,
  setHandle,
  onSubmit,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  handle: string;
  setHandle: (value: string) => void;
  onSubmit: () => void;
}) {
  const valid = normalizeHandle(handle) !== null;
  return (
    <div>
      {title('Who are you on X?')}
      {blurb('Your pass is minted from your handle, so the card you post carries your name — not a wallet address.')}

      <div style={{ position: 'relative' }}>
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 17,
            top: '50%',
            transform: 'translateY(-50%)',
            fontFamily: MONO,
            fontSize: 15,
            color: valid ? LIME : 'rgba(255,255,255,.4)',
          }}
        >
          @
        </span>
        <input
          ref={inputRef}
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && onSubmit()}
          placeholder="yourhandle"
          spellCheck={false}
          autoCapitalize="none"
          autoComplete="off"
          maxLength={16}
          style={fieldStyle}
        />
      </div>

      <p style={{ margin: '10px 0 0', fontFamily: MONO, fontSize: 10, letterSpacing: '.14em', color: 'rgba(255,255,255,.38)' }}>
        NO SIGN-IN. NO WALLET YET. NOTHING TRANSACTS.
      </p>

      <button onClick={onSubmit} disabled={!valid} style={primaryButton(valid)}>
        CREATE PASS
      </button>
    </div>
  );
}

function PassReveal({
  handle,
  pass,
  token,
  onBack,
  onClaim,
}: {
  handle: string;
  pass: ReturnType<typeof passFromHash>;
  token: string;
  onBack: () => void;
  onClaim: () => void;
}) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.24em', color: LIME, marginBottom: 8 }}>
        PASS MINTED · @{handle.toUpperCase()}
      </div>
      {title('Here it is.')}

      {/* The preview is the share card itself, rendered by the same route X
          fetches — so nobody is shown one picture and posts another. */}
      <div
        style={{
          position: 'relative',
          borderRadius: 22,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,.12)',
          background: PANEL,
          aspectRatio: '1200 / 630',
          animation: 'bmhJoinCard .7s cubic-bezier(.2,1,.3,1) both',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/p/${token}/opengraph-image`}
          alt={`Hood Pass ${pass.number}`}
          width={1200}
          height={630}
          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 16, fontFamily: MONO, fontSize: 11, letterSpacing: '.1em' }}>
        <span style={{ color: 'rgba(255,255,255,.55)' }}>PASS {pass.number}</span>
        <span style={{ color: pass.mood.color }}>{pass.mood.key}</span>
        <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,.35)' }}>{pass.code}</span>
      </div>

      <button onClick={onClaim} style={primaryButton(true)}>
        CLAIM PASS &amp; SUBMIT WALLET
      </button>

      <button
        onClick={onBack}
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
        ‹ DIFFERENT HANDLE
      </button>
    </div>
  );
}

type QuoteState = {
  url: string;
  status: 'idle' | 'checking' | 'ok' | 'unconfirmed' | 'error';
  message: string;
};

function Claim({
  tasks,
  done,
  openTask,
  needsQuoteLink,
  quote,
  onQuoteChange,
  wallet,
  setWallet,
  busy,
  onSubmit,
  onBack,
}: {
  tasks: { id: TaskId; title: string; hint: string; url: string }[];
  done: Record<TaskId, boolean>;
  openTask: (id: TaskId, url: string) => void;
  needsQuoteLink: boolean;
  quote: QuoteState;
  onQuoteChange: (url: string) => void;
  wallet: string;
  setWallet: (value: string) => void;
  busy: boolean;
  onSubmit: () => void;
  onBack: () => void;
}) {
  // 'idle' and 'checking' are not good enough: the link has to have come back
  // from a check before the form will take it.
  const quoteSettled =
    !needsQuoteLink || quote.status === 'ok' || quote.status === 'unconfirmed';
  const ready = wallet.trim().length > 0 && quoteSettled && !busy;

  const quoteTone =
    quote.status === 'ok'
      ? LIME
      : quote.status === 'error'
        ? '#ff6f86'
        : quote.status === 'unconfirmed'
          ? '#ffd23b'
          : 'rgba(255,255,255,.4)';

  return (
    <div>
      {title('Claim it.')}
      {blurb(
        tasks.length > 1
          ? `${tasks.length} taps on X, then the wallet that should hold the mint.`
          : 'One tap on X, then the wallet that should hold the mint.'
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {tasks.map((task, index) => {
          const complete = done[task.id];
          return (
            <button
              key={task.id}
              onClick={() => openTask(task.id, task.url)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 13,
                width: '100%',
                minHeight: 62,
                padding: '0 15px',
                borderRadius: 18,
                border: `1px solid ${complete ? 'rgba(198,245,17,.45)' : 'rgba(255,255,255,.1)'}`,
                background: complete ? 'rgba(198,245,17,.08)' : 'rgba(255,255,255,.04)',
                color: '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color .25s ease, background .25s ease',
              }}
            >
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
                  background: complete ? LIME : 'rgba(255,255,255,.09)',
                  color: complete ? INK : 'rgba(255,255,255,.6)',
                }}
              >
                {complete ? '✓' : index + 1}
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{task.title}</span>
                <span style={{ display: 'block', fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,.42)', marginTop: 2 }}>
                  {task.hint}
                </span>
              </span>
              <span style={{ marginLeft: 'auto', color: complete ? LIME : 'rgba(255,255,255,.35)', fontSize: 17 }}>
                {complete ? '✓' : '↗'}
              </span>
            </button>
          );
        })}

        {needsQuoteLink && (
          <div
            style={{
              borderRadius: 18,
              border: `1px solid ${quote.status === 'ok' ? 'rgba(198,245,17,.4)' : 'rgba(255,255,255,.1)'}`,
              background: 'rgba(255,255,255,.03)',
              padding: '13px 15px',
            }}
          >
            <label
              htmlFor="bmh-quote"
              style={{
                display: 'block',
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: '.18em',
                color: 'rgba(255,255,255,.5)',
                marginBottom: 8,
              }}
            >
              PASTE THE LINK TO YOUR QUOTE
            </label>
            <input
              id="bmh-quote"
              value={quote.url}
              onChange={(event) => onQuoteChange(event.target.value)}
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
                color: quoteTone,
              }}
            >
              {quote.message || 'POST IT FIRST, THEN COPY THE LINK FROM X AND DROP IT HERE.'}
            </div>
          </div>
        )}
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,.09)', margin: '20px 0 18px' }} />

      <label
        htmlFor="bmh-wallet"
        style={{ display: 'block', fontFamily: MONO, fontSize: 10, letterSpacing: '.2em', color: 'rgba(255,255,255,.45)', marginBottom: 9 }}
      >
        YOUR WALLET
      </label>
      <input
        id="bmh-wallet"
        value={wallet}
        onChange={(event) => setWallet(event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && ready && onSubmit()}
        placeholder="0x0000… or yourname.eth"
        spellCheck={false}
        autoCapitalize="none"
        autoComplete="off"
        style={{ ...fieldStyle, paddingLeft: 16 }}
      />

      <button onClick={onSubmit} disabled={!ready} style={primaryButton(ready)}>
        {busy ? 'SUBMITTING…' : 'SUBMIT WALLET'}
      </button>

      <p style={{ margin: '14px 0 0', fontFamily: MONO, fontSize: 9, lineHeight: 1.8, letterSpacing: '.1em', color: 'rgba(255,255,255,.3)' }}>
        THE STEPS OPEN X — WE CANNOT SEE WHAT YOU DO THERE, SO THEY ARE RECORDED AS
        YOUR WORD AND CHECKED AGAINST YOUR ACCOUNT BEFORE THE DROP. THE PASS RECORDS
        INTEREST ONLY — IT IS NOT AN ALLOWLIST SPOT, A TOKEN, OR A RIGHT TO MINT.
      </p>

      <button
        onClick={onBack}
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
        ‹ BACK TO PASS
      </button>
    </div>
  );
}

function Confirmed({
  pass,
  handle,
  result,
  passUrl,
  quoteText,
  onClose,
}: {
  pass: ReturnType<typeof passFromHash>;
  handle: string;
  result: { position: number; total: number };
  passUrl: string;
  quoteText: string;
  onClose: () => void;
}) {
  const share = `https://x.com/intent/post?text=${encodeURIComponent(
    `I just claimed my spot in the Hood.\n\n${quoteText}\n\n@boymeetsh00d #BoyMeetsHood #NFTFi`
  )}${passUrl ? `&url=${encodeURIComponent(passUrl)}` : ''}`;

  return (
    <div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: '.24em',
          color: LIME,
          marginBottom: 8,
          animation: 'bmhJoinPulse 2.4s ease-in-out infinite',
        }}
      >
        YOU ARE IN THE QUEUE
      </div>
      {title(`@${handle} is in the Hood.`)}

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        {[
          ['POSITION', `#${String(result.position).padStart(3, '0')}`],
          ['IN QUEUE', String(result.total).padStart(3, '0')],
          ['PASS', pass.number],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              flex: 1,
              borderRadius: 18,
              border: '1px solid rgba(255,255,255,.09)',
              background: PANEL,
              padding: '14px 12px',
            }}
          >
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 19, letterSpacing: '-.02em' }}>{value}</div>
            <div style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '.16em', color: 'rgba(255,255,255,.4)', marginTop: 3 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      <a href={share} target="_blank" rel="noopener noreferrer" style={{ ...primaryButton(true), display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
        POST YOUR PASS
      </a>

      <div style={{ display: 'flex', gap: 9, marginTop: 10 }}>
        <a href={passUrl} target="_blank" rel="noopener noreferrer" style={{ ...ghostButton, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
          VIEW CARD
        </a>
        <button onClick={onClose} style={{ ...ghostButton, flex: 1 }}>
          DONE
        </button>
      </div>
    </div>
  );
}

const KEYFRAMES = `
@keyframes bmhJoinVeil { from { opacity: 0 } to { opacity: 1 } }
@keyframes bmhJoinIn {
  0%   { opacity: 0; transform: perspective(1200px) rotateX(10deg) translateY(34px) scale(.95); filter: blur(8px) }
  60%  { opacity: 1; filter: blur(0) }
  100% { opacity: 1; transform: perspective(1200px) rotateX(0) translateY(0) scale(1) }
}
@keyframes bmhJoinCard {
  0%   { opacity: 0; clip-path: inset(48% 0 48% 0); filter: brightness(4) }
  45%  { opacity: 1; clip-path: inset(12% 0 12% 0); filter: brightness(1.5) drop-shadow(-3px 0 #ff3b5c) drop-shadow(3px 0 #22e1ff) }
  100% { opacity: 1; clip-path: inset(0 0 0 0); filter: none }
}
@keyframes bmhJoinPulse { 0%, 100% { opacity: .45 } 50% { opacity: 1 } }
`;
