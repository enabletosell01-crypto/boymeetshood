'use client';

import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { BALOO, INK, LIME, MONO, PANEL, fieldStyle, ghostButton, primaryButton } from '@/components/flow-kit';

type Campaign = { postUrl: string; postId: string; live: boolean; liveSince: string | null; updatedAt: string | null };
type Stat = { slug: string; name: string; cap: number; claimed: number; remaining: number; holders: number };
type Note = { tone: 'ok' | 'warn' | 'error'; text: string };

const RED = '#ff6f86';
const AMBER = '#ffd23b';

const card: CSSProperties = {
  background: PANEL,
  border: '1px solid rgba(255,255,255,.08)',
  borderRadius: 24,
  padding: 22,
  marginTop: 16,
};

const eyebrow: CSSProperties = {
  fontFamily: MONO,
  fontSize: 10,
  letterSpacing: '.22em',
  color: 'rgba(255,255,255,.45)',
  marginBottom: 12,
};

/**
 * The campaign switch for the community allowlist: paste the collab post,
 * save, go live. Everything here is enforced again by the API — this page is
 * only the controls.
 */
export default function AdminPanel() {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<Stat[]>([]);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState<'' | 'save' | 'live' | 'stop'>('');
  const [note, setNote] = useState<Note | null>(null);
  const [post, setPost] = useState<{ author: string; text: string } | null>(null);

  const load = useCallback(
    async (syncField: boolean) => {
      try {
        const res = await fetch('/api/admin/campaign', { cache: 'no-store' });
        if (res.status === 401) return router.refresh();
        const data = (await res.json()) as { ok?: boolean; error?: string; campaign?: Campaign; stats?: Stat[] };
        if (!data.ok || !data.campaign) {
          setNote({ tone: 'error', text: data.error ?? 'Could not load the campaign.' });
          return;
        }
        setCampaign(data.campaign);
        setStats(data.stats ?? []);
        // The 15s refresh must not overwrite a link someone is still typing.
        if (syncField) setUrl(data.campaign.postUrl);
      } catch {
        setNote({ tone: 'error', text: 'Network error while refreshing.' });
      }
    },
    [router]
  );

  useEffect(() => {
    void load(true);
    const timer = window.setInterval(() => void load(false), 15_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const send = async (body: { postUrl?: string; live?: boolean }, kind: 'save' | 'live' | 'stop') => {
    setBusy(kind);
    setNote(null);
    try {
      const res = await fetch('/api/admin/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 401) return router.refresh();
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        warning?: string;
        campaign?: Campaign;
        post?: { author: string; text: string };
      };
      if (!res.ok || !data.ok || !data.campaign) {
        setNote({ tone: 'error', text: data.error ?? 'Could not save.' });
        return;
      }
      setCampaign(data.campaign);
      setUrl(data.campaign.postUrl);
      if (data.post) setPost(data.post);
      setNote(
        data.warning
          ? { tone: 'warn', text: data.warning }
          : { tone: 'ok', text: kind === 'live' ? 'Claims are LIVE.' : kind === 'stop' ? 'Claims closed.' : 'Post saved.' }
      );
      void load(false);
    } catch {
      setNote({ tone: 'error', text: 'Network error. Nothing was changed.' });
    } finally {
      setBusy('');
    }
  };

  const dirty = campaign !== null && url.trim() !== campaign.postUrl;
  const live = campaign?.live ?? false;

  const goLive = () => {
    if (!url.trim()) return setNote({ tone: 'error', text: 'Paste the collab post first.' });
    const ok = window.confirm(
      'Open claims now?\n\nFirst come, first served — holders can take the 20 spots per community the moment this goes live.'
    );
    if (ok) void send(dirty ? { postUrl: url, live: true } : { live: true }, 'live');
  };

  const stop = () => {
    if (window.confirm('Close claims? Spots already claimed are kept.')) void send({ live: false }, 'stop');
  };

  const signOut = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => undefined);
    router.refresh();
  };

  const totalClaimed = stats.reduce((n, s) => n + s.claimed, 0);
  const totalCap = stats.reduce((n, s) => n + s.cap, 0);

  return (
    <main
      className="bmh-viewport-min"
      style={{ boxSizing: 'border-box', padding: '28px 16px 60px', fontFamily: "'Outfit', system-ui, sans-serif", color: '#fff' }}
    >
      <style>{'@keyframes bmhAdminPulse{0%,100%{opacity:.35}50%{opacity:1}}'}</style>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo.png" alt="" width={40} height={40} style={{ borderRadius: 12 }} />
          <div>
            <div style={{ fontFamily: BALOO, fontWeight: 800, fontSize: 20, lineHeight: 1 }}>BoyMeetsHood</div>
            <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.22em', color: LIME, marginTop: 4 }}>
              COMMUNITY ALLOWLIST · ADMIN
            </div>
          </div>
          <button onClick={() => void signOut()} style={{ ...ghostButton, marginLeft: 'auto' }}>
            SIGN OUT
          </button>
        </header>

        {/* ---------------------------------------------------------- status */}
        <section style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <StatusPill live={live} loading={campaign === null} />
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'rgba(255,255,255,.62)', flex: '1 1 260px' }}>
            {campaign === null
              ? 'Loading…'
              : live
                ? `Holders can claim now.${campaign.liveSince ? ` Live since ${new Date(campaign.liveSince).toLocaleString()}.` : ''}`
                : 'The site shows "Claims open soon". Eligibility checks still work.'}
          </div>
        </section>

        {/* ------------------------------------------------------------ post */}
        <section style={card}>
          <div style={eyebrow}>1 · COLLAB POST</div>
          <p style={{ margin: '0 0 12px', fontSize: 13.5, lineHeight: 1.55, color: 'rgba(255,255,255,.62)' }}>
            The post holders comment under to claim. Paste the full link from X.
          </p>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://x.com/boymeetsh00d/status/…"
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            style={{ ...fieldStyle, paddingLeft: 16, fontSize: 13.5 }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => void send({ postUrl: url }, 'save')}
              disabled={!dirty || busy !== ''}
              style={{ ...ghostButton, opacity: !dirty || busy !== '' ? 0.45 : 1 }}
            >
              {busy === 'save' ? 'CHECKING WITH X…' : 'SAVE'}
            </button>
            {campaign?.postUrl && (
              <a href={campaign.postUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '.1em', color: LIME }}>
                OPEN SAVED POST ↗
              </a>
            )}
            {dirty && <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.12em', color: AMBER }}>UNSAVED</span>}
          </div>
          {post && (
            <div style={{ marginTop: 12, borderLeft: `2px solid ${LIME}`, paddingLeft: 12, fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,.7)' }}>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: LIME }}>@{post.author}</span>
              {post.text ? ` — ${post.text.slice(0, 180)}${post.text.length > 180 ? '…' : ''}` : ''}
            </div>
          )}
          {live && dirty && (
            <p style={{ margin: '12px 0 0', fontFamily: MONO, fontSize: 10, lineHeight: 1.7, letterSpacing: '.1em', color: AMBER }}>
              CLAIMS ARE LIVE. SAVING A NEW POST MEANS NEW CLAIMS MUST REPLY TO THE NEW ONE.
            </p>
          )}
        </section>

        {/* ------------------------------------------------------------ live */}
        <section style={card}>
          <div style={eyebrow}>2 · CLAIMS</div>
          {live ? (
            <button
              onClick={stop}
              disabled={busy !== ''}
              style={{ ...primaryButton(true), marginTop: 0, background: 'transparent', color: RED, border: `1px solid ${RED}`, boxShadow: 'none' }}
            >
              {busy === 'stop' ? 'CLOSING…' : 'STOP — CLOSE CLAIMS'}
            </button>
          ) : (
            <button onClick={goLive} disabled={busy !== '' || !url.trim()} style={{ ...primaryButton(busy === '' && Boolean(url.trim())), marginTop: 0 }}>
              {busy === 'live' ? 'GOING LIVE…' : 'GO LIVE — OPEN CLAIMS'}
            </button>
          )}
        </section>

        {note && (
          <p
            role="status"
            style={{
              margin: '14px 4px 0',
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '.1em',
              lineHeight: 1.7,
              color: note.tone === 'ok' ? LIME : note.tone === 'warn' ? AMBER : RED,
            }}
          >
            {note.text.toUpperCase()}
          </p>
        )}

        {/* ----------------------------------------------------------- spots */}
        <section style={card}>
          <div style={{ ...eyebrow, display: 'flex' }}>
            <span>SPOTS CLAIMED</span>
            <span style={{ marginLeft: 'auto', color: LIME }}>
              {totalClaimed}/{totalCap}
            </span>
          </div>
          {stats.map((s) => (
            <Row key={s.slug} name={s.name} right={`${s.claimed}/${s.cap}`}>
              <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                <div style={{ width: `${s.cap ? (s.claimed / s.cap) * 100 : 0}%`, height: '100%', background: s.remaining === 0 ? AMBER : LIME }} />
              </div>
              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '.12em', color: 'rgba(255,255,255,.35)', marginTop: 5 }}>
                {s.holders ? `${s.holders.toLocaleString('en-US')} IN SNAPSHOT` : 'SNAPSHOT NOT LOADED'}
                {s.remaining === 0 ? ' · FULL' : ''}
              </div>
            </Row>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <a href="/api/community/export?format=txt" style={{ ...ghostButton, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
              DOWNLOAD .TXT (MINT LIST)
            </a>
            <a href="/api/community/export?format=csv" style={{ ...ghostButton, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
              DOWNLOAD .CSV
            </a>
          </div>
          <p style={{ margin: '12px 0 0', fontFamily: MONO, fontSize: 9, letterSpacing: '.1em', color: 'rgba(255,255,255,.3)' }}>
            REFRESHES EVERY 15 SECONDS.
          </p>
        </section>
      </div>
    </main>
  );
}

function StatusPill({ live, loading }: { live: boolean; loading: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 9,
        padding: '10px 16px',
        borderRadius: 999,
        fontFamily: MONO,
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '.18em',
        background: live ? LIME : 'rgba(255,255,255,.07)',
        color: live ? INK : 'rgba(255,255,255,.6)',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: live ? INK : 'rgba(255,255,255,.4)',
          animation: live ? 'bmhAdminPulse 1.6s ease-in-out infinite' : 'none',
        }}
      />
      {loading ? '…' : live ? 'LIVE · CLAIMS OPEN' : 'OFF · CLAIMS OPEN SOON'}
    </span>
  );
}

function Row({ name, right, children }: { name: string; right: string; children: ReactNode }) {
  return (
    <div style={{ padding: '11px 0', borderTop: '1px solid rgba(255,255,255,.06)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 7 }}>
        <span style={{ fontFamily: BALOO, fontWeight: 800, fontSize: 15.5 }}>{name}</span>
        <span style={{ marginLeft: 'auto', fontFamily: MONO, fontWeight: 700, fontSize: 13 }}>{right}</span>
      </div>
      {children}
    </div>
  );
}
