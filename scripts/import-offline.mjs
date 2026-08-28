#!/usr/bin/env node
/**
 * Turns a Claude Design "offline" bundle back into a `.dc.html` handoff.
 *
 *   node scripts/import-offline.mjs <bundle.html> <desktop|mobile>
 *
 * An offline export inlines every asset as base64 behind a UUID, which would
 * be catastrophic to ship — the desktop bundle alone is 8.6MB of image data.
 * The originals are already in `public/assets`, so each embedded resource is
 * hashed and matched back to the file it came from; only genuinely new bytes
 * get written out. Anything that cannot be matched is reported rather than
 * silently inlined.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'public', 'assets');

const [bundlePath, name] = process.argv.slice(2);
if (!bundlePath || !['desktop', 'mobile'].includes(name)) {
  console.error('usage: node scripts/import-offline.mjs <bundle.html> <desktop|mobile>');
  process.exit(1);
}

const sha = (buffer) => createHash('sha256').update(buffer).digest('hex');

/** Every file already in public/assets, indexed by content hash. */
function indexAssets(dir = ASSETS, index = new Map()) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) indexAssets(full, index);
    else index.set(sha(readFileSync(full)), `/assets/${relative(ASSETS, full)}`);
  }
  return index;
}

const source = readFileSync(bundlePath, 'utf8');

// The bundler emits two bare JSON literals on their own lines: the resource
// map, and the document with every resource reference swapped for a UUID.
let resources = null;
let document = null;
for (const line of source.split('\n')) {
  const trimmed = line.trim();
  if (!resources && trimmed.startsWith('{"') && trimmed.includes('"mime"')) {
    try {
      resources = JSON.parse(trimmed);
    } catch {
      /* not the payload */
    }
  }
  if (!document && trimmed.startsWith('"<!DOCTYPE html>')) {
    try {
      document = JSON.parse(trimmed);
    } catch {
      /* not the payload */
    }
  }
}

if (!document) throw new Error('no embedded document found in the bundle');
if (!resources) throw new Error('no resource map found in the bundle');

const byHash = indexAssets();
const matched = [];
const unmatched = [];

for (const [uuid, resource] of Object.entries(resources)) {
  if (!document.includes(uuid)) continue;

  const bytes = Buffer.from(resource.data, 'base64');
  const path = byHash.get(sha(bytes));

  if (path) {
    document = document.split(uuid).join(path);
    matched.push(`${path} (${resource.mime})`);
  } else {
    unmatched.push({ uuid, mime: resource.mime, bytes: bytes.length });
  }
}

// The runtime <script src="…"> points at a UUID too; we render with our own
// renderer, so drop the tag rather than leaving a dead reference behind.
document = document.replace(/<script src="[0-9a-f-]{36}"><\/script>\n?/g, '');

// The bundler swaps the Google Fonts stylesheet for ~10kb of inlined
// @font-face rules pointing at those UUIDs. The app loads the real stylesheet
// in layout.tsx, so drop the shim and put the original <link> back — otherwise
// the generated CSS ships 26 font faces whose sources resolve to nothing.
const fontShim = /<style[^>]*>(?:(?!<\/style>)[\s\S])*?@font-face[\s\S]*?<\/style>\n?/g;
const shimCount = (document.match(fontShim) ?? []).length;
document = document.replace(fontShim, '');

const FONTS_LINK =
  '<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800' +
  '&family=Outfit:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />';

if (shimCount && !document.includes('fonts.googleapis.com/css2')) {
  document = document.replace(
    /(<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com"[^>]*>\n?)/,
    `$1${FONTS_LINK}\n`
  );
}

const out = join(ROOT, 'design-source', `${name}.dc.html`);
const previous = readFileSync(out, 'utf8');
writeFileSync(out, document);

console.log(`imported ${bundlePath}`);
console.log(`  → design-source/${name}.dc.html  (${previous.length} → ${document.length} bytes)`);
console.log(`  matched ${matched.length} embedded assets back to public/assets`);
for (const entry of matched) console.log(`    ✓ ${entry}`);

if (unmatched.length) {
  console.log(`\n  ${unmatched.length} resource(s) could NOT be matched — check these:`);
  for (const entry of unmatched) {
    console.log(`    ! ${entry.uuid}  ${entry.mime}  ${(entry.bytes / 1024).toFixed(0)}kb`);
  }
}

const leftover = document.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g);
if (leftover) {
  console.log(`\n  WARNING: ${new Set(leftover).size} unresolved UUID reference(s) remain in the markup.`);
}
