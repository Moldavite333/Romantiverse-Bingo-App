-- Applied to the Cheese Louise Supabase project (wgvsnmukiaobcbyqhkkt).
-- Only the server-side Bingo public poster feed can read/write this cache.
-- No HQ movie notes, workspaces, personal data or publication records are copied.
create table if not exists public.bingo_poster_cache (
  title text not null check (char_length(title) between 1 and 250),
  release_year integer not null check (release_year between 1900 and 2100),
  poster_url text,
  poster_source text,
  match_score integer check (match_score between 0 and 100),
  checked_at timestamptz not null default now(),
  primary key (title, release_year),
  constraint bingo_poster_cache_source check (poster_source is null or poster_source in ('tmdb','watchmode'))
);
alter table public.bingo_poster_cache enable row level security;
revoke all on public.bingo_poster_cache from public, anon, authenticated;
grant all on public.bingo_poster_cache to service_role;

create table if not exists public.bingo_poster_sync_control (
  id integer primary key check (id = 1),
  next_refresh_at timestamptz not null default '-infinity'::timestamptz,
  last_success_at timestamptz,
  last_error text
);
alter table public.bingo_poster_sync_control enable row level security;
revoke all on public.bingo_poster_sync_control from public, anon, authenticated;
grant all on public.bingo_poster_sync_control to service_role;
insert into public.bingo_poster_sync_control(id) values (1) on conflict (id) do nothing;

create or replace function public.claim_bingo_poster_refresh()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.bingo_poster_sync_control
     set next_refresh_at = now() + interval '15 minutes'
   where id = 1 and next_refresh_at <= now();
  return found;
end;
$$;
revoke all on function public.claim_bingo_poster_refresh() from public, anon, authenticated;
grant execute on function public.claim_bingo_poster_refresh() to service_role;
