-- Proposed schema only. Not applied to a live Supabase project.
-- Brought to you by the Cheese Louise Podcast.
create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  join_code text not null unique,
  movie_id text not null,
  mode text not null check (mode in ('classic','chase','blackout','marathon')),
  status text not null default 'lobby' check (status in ('lobby','playing','finished')),
  card_pool_version text not null,
  host_id uuid not null,
  created_at timestamptz not null default now()
);
create table if not exists public.game_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  auth_user_id uuid,
  display_name text not null check (char_length(display_name) between 1 and 32),
  card jsonb not null,
  marks jsonb not null default '[]'::jsonb,
  revision integer not null default 0,
  joined_at timestamptz not null default now()
);
create unique index if not exists game_players_auth_room_idx on public.game_players(room_id,auth_user_id) where auth_user_id is not null;
-- RLS and server-side room membership verification are REQUIRED before deployment.
-- Never enable public writes to room/player records without a secure membership policy.
