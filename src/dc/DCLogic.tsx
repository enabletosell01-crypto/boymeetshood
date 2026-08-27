'use client';

import { Component, type ReactNode } from 'react';
import { parseTemplate } from './parse';
import { renderTemplate, type Vals } from './render';

export type DcTemplateProps = { __dcTemplate: string };

/**
 * Base class for a Claude Design logic module.
 *
 * The handoff ships two halves: markup full of `{{ bindings }}`, and a class
 * that owns the state and exposes one flat object of values per render. This
 * gives that class a real React `render()` so the design runs as an ordinary
 * component — no prototype runtime, no CDN, no in-browser Babel.
 */
export class DCLogic<
  P extends object = Record<string, unknown>,
  S extends object = Record<string, unknown>,
> extends Component<P & DcTemplateProps, S> {
  /** Overridden by the design's logic class. */
  renderVals(): Vals {
    return {};
  }

  render(): ReactNode {
    return renderTemplate(parseTemplate(this.props.__dcTemplate), this.renderVals());
  }
}
