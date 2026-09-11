-- BoyMeetsHood waitlist.
-- Idempotent: safe to run against a fresh or existing database.

create table if not exists waitlist (
  id          bigint generated always as identity primary key,

  -- The address exactly as the visitor typed it, and the lowercased form the
  -- uniqueness constraint keys on: 0xAB… and 0xab… are one person.
  wallet      text        not null,
  wallet_key  text        not null unique,

  -- 'desktop' (web) or 'mobile' (in-app).
  source      text        not null default 'desktop',

  -- The Hood Pass number the client generated for them, when it sent one.
  pass_no     text,

  -- Coarse geo from Vercel's edge headers. No IP address is ever stored.
  country     text,

  joined_at   timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Queue position and the export are both ordered by arrival.
create index if not exists waitlist_joined_at_idx on waitlist (joined_at);

-- Added with the X-first join flow: the pass is minted from the handle, and the
-- wallet arrives last, after the engagement steps.
alter table waitlist add column if not exists x_username text;
alter table waitlist add column if not exists quoted     boolean not null default false;
alter table waitlist add column if not exists liked      boolean not null default false;
alter table waitlist add column if not exists commented  boolean not null default false;

-- One entry per handle. Partial, so rows predating the flow (which have no
-- handle) are left alone rather than colliding on null.
create unique index if not exists waitlist_x_username_key
  on waitlist (lower(x_username)) where x_username is not null;

-- The quote-RT step: the link people paste back after posting, and whether we
-- could confirm it against X's public embed endpoint.
alter table waitlist add column if not exists quote_url      text;
alter table waitlist add column if not exists quote_verified boolean not null default false;

-- The plain repost step, alongside quote / like / comment.
alter table waitlist add column if not exists retweeted boolean not null default false;

-- ─────────────────────────────────────────────────────────────────────────────
-- Partner-community allowlist.
--
-- Holders of a partner collection claim one of a fixed number of spots per
-- community, first come first served. Eligibility is a holder snapshot loaded
-- by `npm run communities:import`; nothing here talks to a chain.

create table if not exists communities (
  slug  text    primary key,
  name  text    not null,
  cap   integer not null default 20 check (cap >= 0)
);

-- Only the address is kept. Balances in the source CSVs are dropped on import.
create table if not exists community_holders (
  community  text not null references communities (slug) on delete cascade,
  wallet_key text not null,
  primary key (community, wallet_key)
);

create index if not exists community_holders_wallet_idx on community_holders (wallet_key);

create table if not exists community_claims (
  id          bigint generated always as identity primary key,
  community   text        not null references communities (slug),
  wallet      text        not null,
  -- One spot per wallet across every community: a second claim would spend a
  -- spot another holder could have had, for a wallet already on the list.
  wallet_key  text        not null unique,
  -- The reply that paid for the spot. One comment, one spot.
  comment_id  text        not null unique,
  comment_url text        not null,
  x_author    text        not null,
  country     text,
  claimed_at  timestamptz not null default now()
);

-- One spot per X account. Without a wallet connection anyone can paste an
-- address from a public holder list, so this is what stops a single account
-- from sweeping a community on other people's behalf.
create unique index if not exists community_claims_author_key
  on community_claims (lower(x_author));

create index if not exists community_claims_community_idx on community_claims (community, id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Site settings and the admin panel.
--
-- `settings` holds small JSON values the admin panel changes at runtime — the
-- community campaign (which post, live or not) and the hashed admin login —
-- so flipping them never needs an env var or a redeploy.

create table if not exists settings (
  key        text        primary key,
  value      jsonb       not null,
  updated_at timestamptz not null default now()
);

-- Admin sessions. Only a SHA-256 of each token is stored, so a database leak
-- does not hand out a working cookie.
create table if not exists admin_sessions (
  token_hash text        primary key,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
