-- Additive theme support. Existing rooms, player cards and history remain intact.
alter table public.live_rooms drop constraint if exists live_rooms_season_check;
alter table public.live_rooms add constraint live_rooms_season_check
  check (season in ('Christmas','Fall','Horror','Romance','Spring','Summer'));
