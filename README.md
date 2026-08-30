# BoyMeetsHood

4,444 Boys. One Hood. Real Financial Utility.

Next.js app that serves two designs from one URL: the marketing site on desktop,
and the iOS app design running full-bleed on phones. Waitlist submissions are
stored in Neon Postgres.

```
Desktop (> 860px)          Phone (≤ 860px)
┌──────────────────┐       ┌────────┐
│ hero · toolkit   │       │ app UI │
│ credit · automint│       │ tabs   │
│ treasury · juice │       │ sheets │
└──────────────────┘       └────────┘
        └──────── one URL ────────┘
```

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Waitlist store | Neon Postgres (`@neondatabase/serverless`) |
| Hosting | Vercel — zero config |

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL and WAITLIST_ADMIN_TOKEN
npm run db:setup             # creates the waitlist table (idempotent)
npm run dev
```

Open http://localhost:3000. Resize the window across 860px to swap between the
two designs, or pin one with `?view=desktop` / `?view=mobile`.

## Deploying

1. Import this repo on Vercel. No build settings to change.
2. **Storage → Neon → Connect to Project**, or paste `DATABASE_URL` yourself.
   Connecting through Vercel also injects a set of `PG*`/`POSTGRES_*` aliases;
   the app ignores them and reads `DATABASE_URL` only.
3. Add `WAITLIST_ADMIN_TOKEN` and `NEXT_PUBLIC_SITE_URL` (Production, Preview
   and Development).
4. Run `npm run db:setup` once against that database.
5. Redeploy so the new variables are picked up.

Until a database is reachable the site still works — the pass is generated
client-side and the join is simply not recorded.

## Waitlist API

| Route | What it does |
|---|---|
| `GET /api/waitlist` | `{ total }` — queue size shown in the UI |
| `POST /api/waitlist` | `{ wallet, passNo?, source }` → `{ total, position, created }` |
| `GET /api/waitlist/export?token=…` | Full JSON dump (owner only) |
| `GET /api/waitlist/export?token=…&format=csv` | Same, as CSV |

The token is `WAITLIST_ADMIN_TOKEN`. It also works as
`Authorization: Bearer <token>`, which keeps it out of browser history. If the
export answers `Unauthorized`, that variable is missing or different on the
deployment — the site keeps recording signups either way.

## Pulling the waitlist

Straight from the database, no deployment or token involved:

```bash
npm run waitlist                    # table in the terminal
npm run waitlist -- --csv           # boymeetshood-waitlist.csv
npm run waitlist -- --json          # boymeetshood-waitlist.json
npm run waitlist -- --since 2026-09-01
```

It reads `DATABASE_URL` from `.env.local`, so it sees exactly what production
writes. Exported files are gitignored — they hold wallet addresses.

Over HTTP instead, once `WAITLIST_ADMIN_TOKEN` is set on the deployment:

```bash
curl -H "Authorization: Bearer $WAITLIST_ADMIN_TOKEN" \
  https://boymeetshood.xyz/api/waitlist/export
```

One row per wallet in `waitlist` (`db/schema.sql`). Uniqueness is on
`wallet_key`, the lowercased address, so `0xAB…` and `0xab…` are one person.
Re-joining upserts — `joined_at` is never touched, so queue order is whoever
showed up first, and a `pass_no` already on file survives a re-submit that
sends none. No IP address is stored; only the coarse country header Vercel
provides.

## The join flow

`src/components/JoinFlow.tsx`. One implementation, opened from every waitlist
entry point in both designs:

```
handle  →  pass is minted  →  claim it  →  wallet
 @you      the share card     quote        0x… / .eth
            you will post     like
                              comment
```

The pass keys off the **X handle**, not the wallet, so the card carries a name
people recognise in a timeline. Step two previews it by loading
`/p/<token>/opengraph-image` — the same route X fetches, so nobody is shown one
picture and posts another.

`NEXT_PUBLIC_LAUNCH_POST_URL` names the post to quote/like/reply to. Without
it the claim step falls back to a single follow task rather than pointing at
nothing.

### What the flow can and cannot know

Nothing in a browser can confirm a like, a quote or a reply — that needs the X
API and an authorised account. Each step opens the real intent and records what
the visitor says they did, stored in `quoted` / `liked` / `commented`, and the
copy on the step says exactly that. Treat those columns as claims to check
against the account before the drop, not as verified facts.

A handle already on the list under a *different* wallet is rejected (409)
rather than silently overwritten: that is either a typo or someone farming
spots, and either way overwriting moves somebody else's place in the queue.

Joining hands the pass back to the design — the header chip flips to
`PASS #NNNN`, the home CTA becomes "view your Hood Pass", and the design's own
pass screen renders it — so the app never insists you have not joined.

## Shared pass cards

X gives a web page no way to attach an image to a tweet — `intent/post` takes
text and a URL and nothing else. A picture only appears if the tweet carries a
URL whose page advertises one, so every pass gets a page:

```
/p/<token>                      landing page + card metadata
/p/<token>/opengraph-image      the card, rendered per request
/p/<token>/twitter-image        same image; X reads this one
```

The token is base64url of `<hash>|<short wallet>`. The hash rather than the
address: it is one-way, and everything on the card except the address label
derives from it, so a link built to be posted publicly never carries the full
wallet. `src/lib/pass.ts` ports the design's derivation exactly, so the card
matches what the visitor saw.

`metadataBase` for these pages comes off the request host rather than an env
var, so the card resolves on `*.vercel.app`, on preview deployments and on the
custom domain without anything having to be configured first.

The share URL itself is built client-side from `window.location.origin` in
`src/designs/*.tsx`, for the same reason.

## The intro

The lime splash holds for 1.5s, flips its caption to BREACHING, then tears
itself apart — channel split, slice displacement, static, tear bands — collapses
to a scan line and blows out into a portal flash while the page unfolds from a
hairline behind it. All of it is the design's own markup and keyframes.

```bash
NEXT_PUBLIC_INTRO=off    # straight load, no splash, no glitch
```

That maps onto the props the handoffs already expose (`splashEnabled` and
`glitchIntro` on desktop, `splash` and `glitch` on mobile) rather than
short-circuiting anything, so the design stays the source of truth.

## The mint countdown

The hero reads **TO BE ANNOUNCED · STAY TUNED** by default. Set
`NEXT_PUBLIC_MINT_AT` to an ISO 8601 instant and the handoff's own countdown
takes over, ticking down to it:

```bash
NEXT_PUBLIC_MINT_AT=2026-10-01T15:00:00Z
```

Both treatments live in the template — `scripts/build-designs.mjs` wraps the
original countdown in `sc-if mintLive` and adds an `sc-if mintTba` panel beside
it, so neither is ever deleted and the switch is one variable. The value is
inlined at build time, so changing it needs a redeploy. An unparseable date
warns in the console and falls back to "to be announced" rather than rendering
`NaN`.

## Where the designs live

The two designs came out of [Claude Design](https://claude.ai/design) as
`.dc.html` handoffs: markup full of `{{ bindings }}` plus a class that owns the
state. They are checked in unmodified under `design-source/`.

```
design-source/*.dc.html   the handoffs, exactly as exported
scripts/build-designs.mjs extracts template + CSS + logic + props
src/designs/*.design.ts   generated: template, CSS, default props
src/designs/*.logic.ts    generated: the design's state class
src/designs/*.tsx         hand-written: waitlist wiring on top
src/dc/                   renders a design template with React
```

`src/dc/` is a small renderer — about 300 lines — that walks the template and
builds React elements: `{{ path }}` bindings, `sc-if`, `sc-for`, `style-hover`
and `style-focus`. Rendering the design's own markup rather than transcribing it
into JSX is what keeps the site pixel-identical to what was signed off.

It also decodes `sc-camel-*` attributes. HTML lowercases attribute names, so a
bundled export ships `onClick` as `sc-camel-on-click` and `viewBox` as
`sc-camel-view-box`. Dropping those would leave a page that looks perfect and
does nothing, which is exactly what happened the first time a bundle was
imported.

### Importing an offline bundle

A "Download offline" export inlines every asset as base64 behind a UUID — 8.6MB
for the desktop design. `scripts/import-offline.mjs` turns one back into a
normal handoff, hashing each embedded resource to match it against the files
already in `public/assets` and reporting anything it cannot place:

```bash
node scripts/import-offline.mjs ~/Downloads/bundle.html desktop
npm run designs
```

### Updating a design

Re-export from Claude Design, drop the file over the matching
`design-source/*.dc.html`, then:

```bash
npm run designs
```

Every adjustment the script makes to the mobile handoff — unwrapping the iPhone
bezel, handing notch padding to `env(safe-area-inset-*)` — is a named patch that
throws if its target is gone, so a changed design fails the build loudly instead
of shipping broken.

Two of those patches rewrite copy, and they are deliberately separate:

- `rebrand()` swaps the compound name to BoyMeetsHood. Only the joined token —
  "Hood Credit", "Hood Pass" and "4,444 Boys" use the words on their own.
- `xAccount()` points every reference at the real X handle, `X_HANDLE`. It is
  its own constant because the handle is **not** the brand spelling
  (`boymeetsh00d`, with zeros); folding it into the rename would silently
  repoint the follow button whenever the brand changed. The `#BoyMeetsHood`
  hashtag stays — a hashtag is brand text, not an account.
- `passCode()` recuts the pass serial as `BOYS-XXXX-XXXX`. The handoff printed
  `INK 4F2C-3054-0780`, whose last group was the pass number repeated from the
  line above it.
- `dropInviteCode()` removes the "INVITE CODE / COPY" card from the pass
  screen. See below.

### Why there is no invite code

The handoff shipped one, and it looked real: a code on the pass, a copy button,
and "friends who join with your code move you up the queue". None of it was
connected to anything — the code was derived from the wallet hash in the
browser, nothing ever sent it anywhere, and no column records who referred whom.
Shipping it would have told people something untrue about their position in
line, so the card and that sentence are patched out. If a referral programme is
ever built for real, `waitlist` needs a `referred_by` column and the code needs
to travel with the POST; the card can come back then.

## Viewport height on mobile

Anything that fills the screen — the app shell, the join overlay, the pass page
— sizes itself with `.bmh-viewport` / `.bmh-viewport-min` from
`src/app/globals.css`, never with `100vh` or `100dvh` inline.

`dvh` is the *dynamic* viewport, and inside an in-app browser (X's especially)
it resolves to the tall one and keeps going behind the URL bar. A fixed shell
sized that way centres its contents against a box taller than anything the
reader can see, which is exactly why the splash logo sat low in the X browser
while looking fine everywhere else. `svh` is the small viewport — the size with
chrome showing, which in an in-app browser is simply the size.

Two details worth keeping:

- The override sits inside `@supports (height: 100svh)`. Written as two plain
  declarations the minifier drops the first one, which would leave older
  browsers with no height at all rather than a fallback.
- The join overlay sets `box-sizing: border-box` on itself. `globals.css` ships
  no reset on purpose — both designs depend on the default box model — so its
  16px padding would otherwise add to the viewport height and push the panel
  off the bottom of a short screen.

## Notes

- The designs are rendered on the client. Metadata, OG tags, `robots.txt` and
  `sitemap.xml` are server-rendered, so links and crawlers see real data.
- `src/app/globals.css` is deliberately almost empty. Both designs assume the
  browser's default box model, so a CSS reset here would move their layouts.
- `npm run db:setup` is idempotent and safe to re-run; it only ever issues
  `create … if not exists`.
- Nothing transacts yet. Mint is not live and no contract is deployed.
