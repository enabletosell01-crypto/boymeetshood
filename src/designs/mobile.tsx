'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ComponentType } from 'react';
import { fetchWaitlistTotal, reportWaitlistJoin } from '@/lib/waitlist-client';
import RawLogic from './mobile.logic';
import { css, defaultProps, template } from './mobile.design';

const Base = RawLogic as unknown as new (props: any) => any;

/**
 * Genesis mint date, as an ISO 8601 string in `NEXT_PUBLIC_MINT_AT`
 * (e.g. `2026-10-01T15:00:00Z`).
 *
 * Unset — the default — and the hero reads TO BE ANNOUNCED · STAY TUNED. Set
 * it and the handoff's own countdown takes over, ticking to that instant. The
 * markup for both lives in the template; this only decides which one renders.
 */
function mintTarget(): number | null {
  const raw = process.env.NEXT_PUBLIC_MINT_AT?.trim();
  if (!raw) return null;

  const at = Date.parse(raw);
  if (Number.isNaN(at)) {
    console.warn(
      `[hmb] NEXT_PUBLIC_MINT_AT is not a date Date.parse() understands: ${JSON.stringify(raw)}. ` +
        'Falling back to "to be announced". Expected something like 2026-10-01T15:00:00Z.'
    );
    return null;
  }
  return at;
}

/**
 * Mobile mirror of the same wiring. The app design flips `joined` when the pass
 * is issued, so that edge is what we report.
 */
class MobileApp extends Base {
  componentDidMount() {
    super.componentDidMount?.();

    // The handoff seeds `target` with a placeholder ~11 days out. When a real
    // date is configured, point the design's own ticker at it instead.
    const at = mintTarget();
    if (at !== null) this.target = at;

    void fetchWaitlistTotal().then((total) => {
      if (total !== null && total > 0) this.setState({ queue: total });
    });
  }

  renderVals() {
    const live = mintTarget() !== null;
    return {
      ...super.renderVals(),
      mintLive: live,
      mintTba: !live,
      mintEyebrow: live ? 'GENESIS MINT · ESTIMATED' : 'GENESIS MINT · DATE TBA',
    };
  }

  componentDidUpdate(prevProps: any, prevState: any) {
    super.componentDidUpdate?.(prevProps, prevState);

    if (!prevState.joined && this.state.joined) {
      const wallet = String(this.state.wallet ?? '').trim();
      void reportWaitlistJoin({
        wallet,
        passNo: this.state.pass?.num ?? null,
        source: 'mobile',
      }).then((total) => {
        if (total !== null && total > 0) this.setState({ queue: total });
      });
    }
  }
}

const App = MobileApp as unknown as ComponentType<Record<string, unknown>>;

export default function MobileDesign() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <App {...defaultProps} __dcTemplate={template} />
    </>
  );
}
