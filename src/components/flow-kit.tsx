import type { CSSProperties } from 'react';

/**
 * The visual kit shared by the overlay flows (join, community check), so both
 * read as one product rather than two forms that happen to sit on the site.
 */

export const LIME = '#c6f511';
export const INK = '#0b0d11';
export const PANEL = '#12141a';
export const BALOO = "'Baloo 2', cursive";
export const MONO = "'Space Mono', monospace";

export const title = (text: string) => (
  <h2 style={{ margin: '0 0 8px', fontFamily: BALOO, fontWeight: 800, fontSize: 30, letterSpacing: '-.02em' }}>
    {text}
  </h2>
);

export const blurb = (text: string) => (
  <p style={{ margin: '0 0 18px', fontSize: 14.5, lineHeight: 1.6, color: 'rgba(255,255,255,.62)' }}>{text}</p>
);

export const primaryButton = (enabled: boolean): CSSProperties => ({
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

export const ghostButton: CSSProperties = {
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

export const fieldStyle: CSSProperties = {
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

export const FLOW_KEYFRAMES = `
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
