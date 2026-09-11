'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { BALOO, INK, LIME, MONO, fieldStyle, primaryButton } from '@/components/flow-kit';

const label: CSSProperties = {
  display: 'block',
  fontFamily: MONO,
  fontSize: 10,
  letterSpacing: '.2em',
  color: 'rgba(255,255,255,.45)',
  margin: '16px 0 8px',
};

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const ready = username.trim() !== '' && password !== '' && !busy;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Sign-in failed.');
        return;
      }
      router.refresh();
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      className="bmh-viewport-min"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        boxSizing: 'border-box',
        fontFamily: "'Outfit', system-ui, sans-serif",
        color: '#fff',
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: '100%',
          maxWidth: 380,
          boxSizing: 'border-box',
          background: INK,
          border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 26,
          padding: 26,
          boxShadow: '0 40px 110px -30px rgba(0,0,0,.9)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo.png" alt="" width={40} height={40} style={{ borderRadius: 12 }} />
          <div>
            <div style={{ fontFamily: BALOO, fontWeight: 800, fontSize: 20, lineHeight: 1 }}>BoyMeetsHood</div>
            <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.22em', color: LIME, marginTop: 4 }}>ADMIN</div>
          </div>
        </div>

        <label htmlFor="admin-user" style={label}>
          USERNAME
        </label>
        <input
          id="admin-user"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          style={{ ...fieldStyle, paddingLeft: 16 }}
        />

        <label htmlFor="admin-pass" style={label}>
          PASSWORD
        </label>
        <input
          id="admin-pass"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          style={{ ...fieldStyle, paddingLeft: 16 }}
        />

        <button type="submit" disabled={!ready} style={primaryButton(ready)}>
          {busy ? 'SIGNING IN…' : 'SIGN IN'}
        </button>

        {error && (
          <p role="alert" style={{ margin: '14px 0 0', fontFamily: MONO, fontSize: 11, letterSpacing: '.1em', color: '#ff6f86' }}>
            {error.toUpperCase()}
          </p>
        )}
      </form>
    </main>
  );
}
