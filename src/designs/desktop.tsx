'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ComponentType } from 'react';
import { fetchWaitlistTotal, reportWaitlistJoin } from '@/lib/waitlist-client';
import RawLogic from './desktop.logic';
import { css, defaultProps, template } from './desktop.design';

/**
 * `NEXT_PUBLIC_INTRO=off` skips the splash and the breach-in glitch for a
 * straight load — useful when the animation is in the way (recording a demo,
 * or a visitor who has seen it a hundred times). Baked in at build time, so
 * flipping it needs a redeploy.
 */
const introEnabled = process.env.NEXT_PUBLIC_INTRO !== 'off';

/** The generated logic module is untyped design JS — keep the cast in one place. */
const Base = RawLogic as unknown as new (props: any) => any;

/**
 * The design already mints the Hood Pass and tracks the queue locally, which is
 * what keeps it working offline. This subclass only mirrors a join into the Blob
 * store and pulls the real queue size back down. The design itself is untouched,
 * so a fresh export from Claude Design drops straight in.
 */
class DesktopSite extends Base {
  componentDidMount() {
    super.componentDidMount?.();
    void fetchWaitlistTotal().then((total) => {
      if (total !== null && total > 0) this.setState({ queue: total });
    });
  }

  componentDidUpdate(prevProps: any, prevState: any) {
    super.componentDidUpdate?.(prevProps, prevState);

    const pass = this.state.pass;
    if (!prevState.pass && pass?.addr) {
      void reportWaitlistJoin({ wallet: pass.addr, passNo: pass.no, source: 'desktop' }).then(
        (total) => {
          if (total !== null && total > 0) this.setState({ queue: total });
        }
      );
    }
  }
}

const Site = DesktopSite as unknown as ComponentType<Record<string, unknown>>;

export default function DesktopDesign() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <Site
        {...defaultProps}
        splashEnabled={introEnabled && defaultProps.splashEnabled}
        glitchIntro={introEnabled && defaultProps.glitchIntro}
        __dcTemplate={template}
      />
    </>
  );
}
