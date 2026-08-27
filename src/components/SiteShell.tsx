'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

/** Below this width the phone app is the right experience, above it the site. */
export const MOBILE_BREAKPOINT = 860;

const Loading = () => (
  <div
    aria-hidden="true"
    style={{ position: 'fixed', inset: 0, background: '#0b0d11' }}
  />
);

const DesktopDesign = dynamic(() => import('@/designs/desktop'), {
  ssr: false,
  loading: Loading,
});

const MobileDesign = dynamic(() => import('@/designs/mobile'), {
  ssr: false,
  loading: Loading,
});

type Mode = 'desktop' | 'mobile' | null;

function forcedMode(): Exclude<Mode, null> | null {
  if (typeof window === 'undefined') return null;
  const view = new URLSearchParams(window.location.search).get('view');
  return view === 'desktop' || view === 'mobile' ? view : null;
}

/**
 * Two designs, one URL.
 *
 * Desktop gets the marketing site; anything phone-sized gets the iOS app design
 * running full-bleed. The choice follows the viewport rather than the user
 * agent, so a narrowed desktop window shows exactly what a phone shows — and
 * `?view=desktop` / `?view=mobile` pins either one for review.
 */
export default function SiteShell() {
  const [mode, setMode] = useState<Mode>(null);

  useEffect(() => {
    const forced = forcedMode();
    if (forced) {
      setMode(forced);
      return;
    }

    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const apply = () => setMode(query.matches ? 'mobile' : 'desktop');

    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!mode) return;
    // The app design owns the whole viewport; the site scrolls normally.
    document.documentElement.dataset.hmbMode = mode;

    // The design mounts after the browser has already given up on the hash, so
    // a shared deep link like /#credit has to be honoured once the DOM exists.
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const settle = window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView();
    }, 120);
    return () => window.clearTimeout(settle);
  }, [mode]);

  if (mode === null) return <Loading />;
  return mode === 'mobile' ? <MobileDesign /> : <DesktopDesign />;
}
