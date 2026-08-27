'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ComponentType } from 'react';
import { fetchWaitlistTotal, reportWaitlistJoin } from '@/lib/waitlist-client';
import RawLogic from './mobile.logic';
import { css, defaultProps, template } from './mobile.design';

const Base = RawLogic as unknown as new (props: any) => any;

/**
 * Mobile mirror of the same wiring. The app design flips `joined` when the pass
 * is issued, so that edge is what we report.
 */
class MobileApp extends Base {
  componentDidMount() {
    super.componentDidMount?.();
    void fetchWaitlistTotal().then((total) => {
      if (total !== null && total > 0) this.setState({ queue: total });
    });
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
