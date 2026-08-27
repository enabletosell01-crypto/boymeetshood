-- HoodMeetsBoy waitlist.
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
