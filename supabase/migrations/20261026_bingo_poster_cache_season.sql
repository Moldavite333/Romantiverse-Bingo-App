-- Public catalog theme metadata for correct direct-link card selection.
alter table public.bingo_poster_cache
  add column if not exists season text not null default 'Unspecified'
  check (season in ('Christmas','Fall','Horror','Unspecified'));
