-- Migration: init schema (Beta v1 — 3 tables)
-- Phase 1 Foundation, Fri 19/6. Source of truth = this file (see brewdesk-docs/05-tech-spec.md §Schema).
-- RLS policies are intentionally deferred to Week 2 (22-28/6) — see 20260622_rls.sql when created.

-- profiles: extends auth.users with app-level display data
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz default now()
);

-- cafes: manually entered (~50 quán), admin-only writes via service role
create table public.cafes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  district text,            -- "Q1", "Q3", "BT"
  has_power_outlets boolean default false,
  has_wifi boolean default true,
  noise_level smallint,     -- 1-5
  vibe_tags text[],         -- {"silent","chill","study-friendly"}
  opening_hours jsonb,      -- {"mon":"07:00-22:00", ...}
  photo_url text,
  created_at timestamptz default now()
);

create index cafes_district_idx on public.cafes(district);
create index cafes_location_idx on public.cafes(lat, lng);

-- checkins: minimal-first (live status derived via count where checked_out_at is null)
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  checked_in_at timestamptz default now(),
  checked_out_at timestamptz,
  created_at timestamptz default now()
);

create index checkins_active_idx on public.checkins(cafe_id) where checked_out_at is null;
create index checkins_user_idx on public.checkins(user_id, checked_in_at desc);
