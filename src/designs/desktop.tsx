'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useRef, useState, type ComponentType } from 'react';
import JoinFlow from '@/components/JoinFlow';
import { fetchWaitlistTotal } from '@/lib/waitlist-client';
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

  /** The design's own waitlist modal is replaced by the shared join flow. */
  renderVals() {
    return {
      ...super.renderVals(),
      onOpen: (event: any) => {
        event?.preventDefault?.();
        this.props.onOpenJoin?.();
      },
    };
  }

  componentDidUpdate(prevProps: any, prevState: any) {
    super.componentDidUpdate?.(prevProps, prevState);
  }
}

const Site = DesktopSite as unknown as ComponentType<Record<string, unknown>>;

export default function DesktopDesign() {
  const [joinOpen, setJoinOpen] = useState(false);
  const site = useRef<any>(null);

  const onJoined = useCallback((total: number) => {
    // Keep the design's queue label honest once a real join lands.
    site.current?.setState({ queue: total });
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <Site
        ref={site}
        {...defaultProps}
        splashEnabled={introEnabled && defaultProps.splashEnabled}
        glitchIntro={introEnabled && defaultProps.glitchIntro}
        onOpenJoin={() => setJoinOpen(true)}
        __dcTemplate={template}
      />
      <JoinFlow
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        source="desktop"
        onJoined={onJoined}
      />
    </>
  );
}
