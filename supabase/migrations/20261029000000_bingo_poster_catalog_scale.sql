-- Scale the public-only Bingo poster refresh claim to the native catalog limit.
-- Retain the 15-minute cooldown and service-role-only execution.
create or replace function public.claim_bingo_poster_refresh_with_catalog(p_catalog_count integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_catalog_count is null or p_catalog_count not between 1 and 3000 then
    return false;
  end if;
  update public.bingo_poster_sync_control
     set next_refresh_at = now() + interval '15 minutes',
         last_claim_at = now()
   where id = 1
     and (
       next_refresh_at <= now()
       or (
         p_catalog_count > (select count(*) from public.bingo_poster_cache)
         and (last_claim_at is null or last_claim_at <= now() - interval '15 minutes')
       )
     );
  return found;
end;
$$;
revoke all on function public.claim_bingo_poster_refresh_with_catalog(integer) from public, anon, authenticated;
grant execute on function public.claim_bingo_poster_refresh_with_catalog(integer) to service_role;
