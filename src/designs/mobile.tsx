'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useRef, useState, type ComponentType } from 'react';
import JoinFlow from '@/components/JoinFlow';
import { encodePassToken, hashIdentity, passFromHash, toDesignPass } from '@/lib/pass';
import { fetchWaitlistTotal } from '@/lib/waitlist-client';
import RawLogic from './mobile.logic';
import { css, defaultProps, template } from './mobile.design';

/**
 * `NEXT_PUBLIC_INTRO=off` skips the splash and the breach-in glitch for a
 * straight load — useful when the animation is in the way (recording a demo,
 * or a visitor who has seen it a hundred times). Baked in at build time, so
 * flipping it needs a redeploy.
 */
const introEnabled = process.env.NEXT_PUBLIC_INTRO !== 'off';

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

    // The intro sets `animation: hmbWorldIn …` inline on the app bar and the
    // scroll area and never takes it off. Its first keyframe squashes them to
    // scaleY(.02), so anything that stops the animation from finishing — a
    // background tab, where Chrome freezes the animation timeline and throttles
    // timers — leaves the page collapsed to a hairline until it is focused. The
    // desktop handoff clears its own intro animation after it plays; this does
    // the same for mobile.
    this.introCleanup = window.setTimeout(() => {
      for (const el of document.querySelectorAll<HTMLElement>('[data-appbar],[data-scroll]')) {
        if (el.style.animation.includes('hmbWorldIn')) el.style.animation = '';
      }
    }, 3400);

    void fetchWaitlistTotal().then((total) => {
      if (total !== null && total > 0) this.setState({ queue: total });
    });
  }

  componentWillUnmount() {
    super.componentWillUnmount?.();
    window.clearTimeout(this.introCleanup);
  }

  renderVals() {
    const live = mintTarget() !== null;
    const vals = super.renderVals();
    const openJoin = () => this.props.onOpenJoin?.();

    // Every route into the design's own waitlist screen — the home button, the
    // header JOIN, the tab bar — hands off to the shared flow instead. Once a
    // pass exists that screen is a stale copy of a form nobody can complete
    // again, so those same routes point at the pass screen rather than at it.
    const waitlist = this.state.joined ? vals.goPass : openJoin;
    const swap = (rows: any[]) =>
      Array.isArray(rows)
        ? rows.map((row) => (row?.label === 'WAITLIST' ? { ...row, go: waitlist } : row))
        : rows;

    return {
      ...vals,
      goWaitlist: waitlist,
      tabs: swap(vals.tabs),
      jumps: swap(vals.jumps),
      mintLive: live,
      mintTba: !live,
      mintEyebrow: live ? 'GENESIS MINT · ESTIMATED' : 'GENESIS MINT · DATE TBA',
    };
  }

  componentDidUpdate(prevProps: any, prevState: any) {
    super.componentDidUpdate?.(prevProps, prevState);
  }
}

const App = MobileApp as unknown as ComponentType<Record<string, unknown>>;

export default function MobileDesign() {
  const [joinOpen, setJoinOpen] = useState(false);
  const app = useRef<any>(null);

  /**
   * Hand the finished pass back to the design so the app agrees it happened:
   * the header chip flips, "join the waitlist" becomes "view your Hood Pass",
   * and the design's own pass screen renders the pass the flow just minted.
   */
  const onJoined = useCallback((total: number, handle: string, wallet: string) => {
    const instance = app.current;
    if (!instance) return;

    const pass = passFromHash(hashIdentity(handle), `@${handle}`);
    // The design's POST ON X reads this; without it the tweet loses its card.
    instance.shareUrl = `${window.location.origin}/p/${encodePassToken(handle, `@${handle}`)}`;
    instance.setState({ joined: true, queue: total, pass: toDesignPass(pass, wallet) });
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <App
        ref={app}
        {...defaultProps}
        splash={introEnabled && defaultProps.splash}
        glitch={introEnabled && defaultProps.glitch}
        onOpenJoin={() => setJoinOpen(true)}
        __dcTemplate={template}
      />
      <JoinFlow
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        source="mobile"
        onJoined={onJoined}
      />
    </>
  );
}
