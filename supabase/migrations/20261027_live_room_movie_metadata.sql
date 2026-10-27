-- Applied to the public Bingo project yxpamyibhclilgdhgsjd on 2026-10-26.
-- Keep actual catalog collection separate from the host-selected Bingo card theme.
-- No private Cheese Louise HQ tables are used.
alter table public.live_rooms add column if not exists movie_collection text not null default 'Unspecified';
alter table public.live_rooms add column if not exists poster_url text;
alter table public.live_rooms add column if not exists release_year integer;
alter table public.live_rooms drop constraint if exists live_rooms_season_check;
alter table public.live_rooms add constraint live_rooms_season_check check (season in ('Christmas','Fall','Horror','Romance'));
alter table public.live_rooms drop constraint if exists live_rooms_collection_length_check;
alter table public.live_rooms add constraint live_rooms_collection_length_check check (char_length(movie_collection) between 1 and 40);
alter table public.live_rooms drop constraint if exists live_rooms_poster_url_length_check;
alter table public.live_rooms add constraint live_rooms_poster_url_length_check check (poster_url is null or char_length(poster_url) <= 500);
alter table public.live_rooms drop constraint if exists live_rooms_release_year_check;
alter table public.live_rooms add constraint live_rooms_release_year_check check (release_year is null or release_year between 1900 and 2100);
