# HoodMeetsBoy

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
`Authorization: Bearer <token>`, which keeps it out of browser history.

One row per wallet in `waitlist` (`db/schema.sql`). Uniqueness is on
`wallet_key`, the lowercased address, so `0xAB…` and `0xab…` are one person.
Re-joining upserts — `joined_at` is never touched, so queue order is whoever
showed up first, and a `pass_no` already on file survives a re-submit that
sends none. No IP address is stored; only the coarse country header Vercel
provides.

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

## Notes

- The designs are rendered on the client. Metadata, OG tags, `robots.txt` and
  `sitemap.xml` are server-rendered, so links and crawlers see real data.
- `src/app/globals.css` is deliberately almost empty. Both designs assume the
  browser's default box model, so a CSS reset here would move their layouts.
- `npm run db:setup` is idempotent and safe to re-run; it only ever issues
  `create … if not exists`.
- Nothing transacts yet. Mint is not live and no contract is deployed.
