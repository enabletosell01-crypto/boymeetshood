#!/usr/bin/env node
/**
 * Turns a Claude Design handoff (`design-source/*.dc.html`) into the modules the
 * Next.js app imports: the template markup, the helmet CSS, the default props
 * and the logic class.
 *
 * Nothing here rewrites the design by hand — every change is a named patch that
 * throws if its target disappears, so re-exporting from Claude Design and
 * running `npm run designs` either produces a correct build or fails loudly.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'design-source');
const OUT = join(ROOT, 'src', 'designs');

const BANNER = (name) =>
  `/* AUTO-GENERATED from design-source/${name}.dc.html — do not edit by hand.\n` +
  `   Re-export the design from Claude Design, drop it in, then: npm run designs */\n`;

/** Fail loudly instead of silently shipping an un-patched design. */
function replaceOnce(text, find, replaceWith, label) {
  const parts = text.split(find);
  if (parts.length !== 2) {
    throw new Error(
      `patch "${label}" expected exactly 1 match for ${JSON.stringify(find)}, found ${parts.length - 1}`
    );
  }
  return parts[0] + replaceWith + parts[1];
}

function decodeEntities(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** Assets live at /assets/** in `public`, so relative design paths need a root. */
function absolutizeAssets(text) {
  return text.replace(/(["'(])assets\//g, '$1/assets/');
}

function extract(name) {
  const raw = readFileSync(join(SRC, `${name}.dc.html`), 'utf8');

  const open = /<x-dc(?:\s[^>]*)?>/.exec(raw);
  const close = raw.lastIndexOf('</x-dc>');
  if (!open || close === -1) throw new Error(`${name}: no <x-dc> block`);
  let template = raw.slice(open.index + open[0].length, close);

  const scriptOpen = /<script[^>]*data-dc-script[^>]*>/.exec(raw);
  if (!scriptOpen) throw new Error(`${name}: no data-dc-script block`);
  const logicStart = scriptOpen.index + scriptOpen[0].length;
  const logicEnd = raw.indexOf('</script>', logicStart);
  if (logicEnd === -1) throw new Error(`${name}: unterminated data-dc-script`);
  const logic = raw.slice(logicStart, logicEnd);

  const propsAttr = /data-props="([^"]*)"/.exec(scriptOpen[0]);
  const propsMeta = propsAttr ? JSON.parse(decodeEntities(propsAttr[1])) : {};
  const defaults = {};
  for (const [key, meta] of Object.entries(propsMeta)) {
    if (key.startsWith('$')) continue;
    if (meta && typeof meta === 'object' && 'default' in meta) defaults[key] = meta.default;
  }

  return { template, logic, defaults };
}

/** Pull <helmet> out of the template; its <style> becomes page-scoped CSS. */
function splitHelmet(template, name) {
  const match = /<helmet(?:\s[^>]*)?>([\s\S]*?)<\/helmet>/.exec(template);
  if (!match) throw new Error(`${name}: no <helmet> block`);
  const inner = match[1];
  const body = template.slice(0, match.index) + template.slice(match.index + match[0].length);

  const styles = [...inner.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  return { css: styles.join('\n').trim(), body: body.trim() };
}

/* ------------------------------------------------------------------ desktop */

function buildDesktop() {
  const { template, logic, defaults } = extract('desktop');
  const { css, body } = splitHelmet(template, 'desktop');
  return {
    name: 'desktop',
    css: absolutizeAssets(css),
    template: absolutizeAssets(body),
    logic: absolutizeAssets(logic),
    defaults,
  };
}

/* ------------------------------------------------------------------- mobile */

/**
 * The mobile handoff is a *canvas*: an explainer column, an <x-import> iPhone
 * bezel around the real screens, and a "jump to screen" column. On a real phone
 * the phone frame is the phone, so we keep only what was inside the bezel and
 * hand the notch/home-indicator padding over to env(safe-area-inset-*).
 */
function buildMobile() {
  const { template, logic, defaults } = extract('mobile');
  const { css, body } = splitHelmet(template, 'mobile');

  const frame = /<x-import\b[^>]*>([\s\S]*)<\/x-import>/.exec(body);
  if (!frame) throw new Error('mobile: no <x-import> device frame to unwrap');
  let screen = frame[1].trim();

  screen = replaceOnce(
    screen,
    'padding:58px 18px 12px',
    'padding:calc(env(safe-area-inset-top, 0px) + 16px) 18px 12px',
    'header respects the notch'
  );
  screen = replaceOnce(
    screen,
    'padding:8px 8px 30px',
    'padding:8px 8px calc(env(safe-area-inset-bottom, 0px) + 14px)',
    'tab bar clears the home indicator'
  );
  screen = replaceOnce(
    screen,
    'padding:18px 18px 34px',
    'padding:18px 18px calc(env(safe-area-inset-bottom, 0px) + 22px)',
    'notify sheet clears the home indicator'
  );

  // The bezel gave the screen its height; now the viewport does.
  const shell =
    '<div style="position:fixed;top:0;left:0;right:0;height:100dvh;overflow:hidden;overscroll-behavior:none">\n' +
    screen +
    '\n</div>';

  return {
    name: 'mobile',
    css: absolutizeAssets(css),
    template: absolutizeAssets(shell),
    logic: absolutizeAssets(logic),
    defaults,
  };
}

/* -------------------------------------------------------------------- emit */

function emit({ name, css, template, logic, defaults }) {
  mkdirSync(OUT, { recursive: true });

  writeFileSync(
    join(OUT, `${name}.design.ts`),
    BANNER(name) +
      `\nexport const template = ${JSON.stringify(template)};\n` +
      `\nexport const css = ${JSON.stringify(css)};\n` +
      `\nexport const defaultProps = ${JSON.stringify(defaults, null, 2)} as const;\n`
  );

  writeFileSync(
    join(OUT, `${name}.logic.ts`),
    BANNER(name) +
      `/* eslint-disable */\n// @ts-nocheck\nimport { DCLogic } from '@/dc/DCLogic';\n\n` +
      logic.trim() +
      `\n\nexport default Component;\n`
  );

  const bytes = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(1)}kb`;
  console.log(
    `  ${name}: template ${bytes(template)} · css ${bytes(css)} · logic ${bytes(logic)} · props ${Object.keys(defaults).join(', ') || '—'}`
  );
}

console.log('building designs…');
for (const design of [buildDesktop(), buildMobile()]) emit(design);
console.log('done.');
