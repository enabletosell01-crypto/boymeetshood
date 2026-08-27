'use client';

import { Fragment, createElement, useState, type CSSProperties, type ReactNode } from 'react';
import type { DcNode } from './parse';

/* ------------------------------------------------------------- expressions */

/** Every binding in the handoffs is a plain dotted path: `{{ pass.code }}`. */
const PATH = '[A-Za-z_$][\\w$]*(?:\\.[A-Za-z_$][\\w$]*)*';
const WHOLE_BINDING = new RegExp(`^\\s*\\{\\{\\s*(${PATH})\\s*\\}\\}\\s*$`);
const ANY_BINDING = new RegExp(`\\{\\{\\s*(${PATH})\\s*\\}\\}`, 'g');

export type Vals = Record<string, unknown>;
type Scope = Record<string, unknown>;

function resolve(path: string, vals: Vals, scope: Scope): unknown {
  const [head, ...rest] = path.split('.');
  let cur: unknown = head in scope ? scope[head] : vals[head];
  for (const key of rest) {
    if (cur == null) return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

/** `{{ x }}` alone yields the raw value; mixed text yields a string. */
function bind(raw: string, vals: Vals, scope: Scope): unknown {
  const whole = WHOLE_BINDING.exec(raw);
  if (whole) return resolve(whole[1], vals, scope);
  if (!raw.includes('{{')) return raw;
  return raw.replace(ANY_BINDING, (_, path: string) => {
    const value = resolve(path, vals, scope);
    return value == null || value === false ? '' : String(value);
  });
}

function bindString(raw: string, vals: Vals, scope: Scope): string {
  const value = bind(raw, vals, scope);
  return value == null || value === false ? '' : String(value);
}

/* ------------------------------------------------------------------- style */

function cssPropToReact(prop: string): string {
  if (prop.startsWith('--')) return prop;
  const camel = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  // `-webkit-mask-image` → `WebkitMaskImage`, but `-ms-` stays lowercase.
  if (prop.startsWith('-ms-')) return camel.charAt(0).toLowerCase() + camel.slice(1);
  return camel;
}

/**
 * Splits a CSS declaration string, ignoring `;` inside `url(...)`/gradients.
 * Values are kept verbatim so React writes exactly what the design specified.
 */
export function parseStyle(css: string): CSSProperties {
  const out: Record<string, string> = {};
  let depth = 0;
  let start = 0;

  for (let i = 0; i <= css.length; i++) {
    const ch = css[i];
    if (ch === '(') {
      depth++;
      continue;
    }
    if (ch === ')') {
      depth--;
      continue;
    }
    if (i !== css.length && !(ch === ';' && depth === 0)) continue;

    const decl = css.slice(start, i).trim();
    start = i + 1;
    if (!decl) continue;

    const colon = decl.indexOf(':');
    if (colon < 1) continue;
    out[cssPropToReact(decl.slice(0, colon).trim())] = decl.slice(colon + 1).trim();
  }

  return out as CSSProperties;
}

/* -------------------------------------------------------------- attributes */

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/** Attributes that only mean something to the Claude Design editor. */
const EDITOR_ONLY = /^(hint-|data-dc-|sc-camel-)/;

const RENAMED: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  charset: 'charSet',
  crossorigin: 'crossOrigin',
  spellcheck: 'spellCheck',
  autocomplete: 'autoComplete',
  autocapitalize: 'autoCapitalize',
  autocorrect: 'autoCorrect',
  autofocus: 'autoFocus',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  minlength: 'minLength',
  contenteditable: 'contentEditable',
  srcset: 'srcSet',
  novalidate: 'noValidate',
  enterkeyhint: 'enterKeyHint',
  inputmode: 'inputMode',
};

function attrToProp(name: string): string {
  const renamed = RENAMED[name.toLowerCase()];
  if (renamed) return renamed;
  if (name.startsWith('data-') || name.startsWith('aria-')) return name;
  // SVG presentation attributes: `stroke-width` → `strokeWidth`.
  if (name.includes('-')) return name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  return name;
}

const isEventAttr = (name: string) => /^on[A-Z]/.test(name);

/* ------------------------------------------------------- hover / focus CSS */

let hoverCapable: boolean | null = null;

/**
 * `style-hover` stands in for CSS `:hover`, so it has to obey the same rule:
 * a touch screen has no hover, and a sticky hover state after a tap would be a
 * bug the original CSS never had.
 */
function supportsHover(): boolean {
  if (hoverCapable !== null) return hoverCapable;
  if (typeof window === 'undefined' || !window.matchMedia) return (hoverCapable = false);
  hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  return hoverCapable;
}

type InteractiveProps = {
  tag: string;
  props: Record<string, unknown>;
  base: CSSProperties;
  hover: CSSProperties | null;
  focus: CSSProperties | null;
  children: ReactNode;
  void: boolean;
};

function Interactive({ tag, props, base, hover, focus, children, void: isVoid }: InteractiveProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const style: CSSProperties = {
    ...base,
    ...(hover && hovered ? hover : null),
    ...(focus && focused ? focus : null),
  };

  const chain =
    (own: unknown, next: (e: never) => void) =>
    (event: never) => {
      if (typeof own === 'function') (own as (e: never) => void)(event);
      next(event);
    };

  const merged: Record<string, unknown> = { ...props, style };

  if (hover) {
    merged.onMouseEnter = chain(props.onMouseEnter, () => {
      if (supportsHover()) setHovered(true);
    });
    merged.onMouseLeave = chain(props.onMouseLeave, () => setHovered(false));
  }
  if (focus) {
    merged.onFocus = chain(props.onFocus, () => setFocused(true));
    merged.onBlur = chain(props.onBlur, () => setFocused(false));
  }

  return isVoid ? createElement(tag, merged) : createElement(tag, merged, children);
}

/* ------------------------------------------------------------------ render */

function renderChildren(nodes: DcNode[], vals: Vals, scope: Scope): ReactNode[] {
  const out: ReactNode[] = [];
  nodes.forEach((node, index) => {
    const rendered = renderNode(node, vals, scope, index);
    if (rendered !== null && rendered !== undefined) out.push(rendered);
  });
  return out;
}

function renderNode(node: DcNode, vals: Vals, scope: Scope, key: number): ReactNode {
  if (node.kind === 'text') {
    const value = bind(node.text, vals, scope);
    return value == null || value === false ? null : String(value);
  }

  const { tag, attrs, children } = node;

  if (tag === 'sc-if') {
    const value = attrs.value ? bind(attrs.value, vals, scope) : false;
    if (!value) return null;
    return <Fragment key={key}>{renderChildren(children, vals, scope)}</Fragment>;
  }

  if (tag === 'sc-for') {
    const list = attrs.list ? bind(attrs.list, vals, scope) : null;
    if (!Array.isArray(list)) return null;
    const alias = attrs.as || 'item';
    return (
      <Fragment key={key}>
        {list.map((item, index) => (
          <Fragment key={index}>
            {renderChildren(children, vals, { ...scope, [alias]: item, [`${alias}Index`]: index })}
          </Fragment>
        ))}
      </Fragment>
    );
  }

  // The device bezel and the editor's helmet are canvas furniture, not screen.
  if (tag === 'x-import') return <Fragment key={key}>{renderChildren(children, vals, scope)}</Fragment>;
  if (tag === 'helmet') return null;

  const props: Record<string, unknown> = { key };
  let base: CSSProperties = {};
  let hover: CSSProperties | null = null;
  let focus: CSSProperties | null = null;

  for (const [name, raw] of Object.entries(attrs)) {
    if (EDITOR_ONLY.test(name)) continue;

    if (name === 'style') {
      base = parseStyle(bindString(raw, vals, scope));
      continue;
    }
    if (name === 'style-hover') {
      hover = parseStyle(bindString(raw, vals, scope));
      continue;
    }
    if (name === 'style-focus') {
      focus = parseStyle(bindString(raw, vals, scope));
      continue;
    }

    const prop = attrToProp(name);

    if (isEventAttr(prop)) {
      const handler = bind(raw, vals, scope);
      if (typeof handler === 'function') props[prop] = handler;
      continue;
    }

    props[prop] = bind(raw, vals, scope);
  }

  // A bound `value` without `onChange` makes React shout about uncontrolled
  // inputs. One design wires `onInput` instead — React routes both to the same
  // native event, so promote it rather than leaving both attached and firing
  // the handler twice per keystroke.
  if ('value' in props && !('onChange' in props)) {
    if (typeof props.onInput === 'function') {
      props.onChange = props.onInput;
      delete props.onInput;
    } else {
      props.onChange = () => {};
    }
  }

  const isVoid = VOID_TAGS.has(tag.toLowerCase());
  const kids = isVoid ? null : renderChildren(children, vals, scope);

  if (hover || focus) {
    const { key: _key, ...rest } = props;
    return (
      <Interactive
        key={key}
        tag={tag}
        props={rest}
        base={base}
        hover={hover}
        focus={focus}
        void={isVoid}
      >
        {kids}
      </Interactive>
    );
  }

  props.style = base;
  return isVoid ? createElement(tag, props) : createElement(tag, props, kids);
}

/** Renders a parsed design template against the values its logic class exposes. */
export function renderTemplate(nodes: DcNode[], vals: Vals): ReactNode {
  return <>{renderChildren(nodes, vals, {})}</>;
}
