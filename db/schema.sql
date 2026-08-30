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
