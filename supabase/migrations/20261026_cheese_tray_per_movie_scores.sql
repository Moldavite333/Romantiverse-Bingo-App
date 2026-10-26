-- Lifetime Cheese Tray: one best score per player per movie, never one per week.
-- Existing player/movie scores are preserved; this migration does not delete rows.
-- If duplicate pairs exist from past weeks, the new unique index deliberately
-- fails rather than silently deleting any fan's score.

alter table public.cheese_tray_scores
  drop constraint if exists cheese_tray_scores_player_hash_movie_key_week_start_key;

create unique index if not exists cheese_tray_scores_one_player_per_movie
  on public.cheese_tray_scores (player_hash,movie_key);

create or replace function public.cheese_tray_submit(
 p_device text,p_nickname text,p_movie_key text,p_movie_title text,
 p_marked integer[],p_free boolean default true
)
returns jsonb
language plpgsql security definer set search_path = ''
as $function$
declare
 v_marks integer[];
 v_lines integer:=0;
 v_best_lines integer;
 v_week date:=(date_trunc('week',now() at time zone 'UTC'))::date;
begin
 if p_device is null or p_device !~ '^[a-f0-9-]{36}$'
    or p_nickname is null or p_nickname !~ '^[a-zA-Z0-9][a-zA-Z0-9 _.-]{1,23}$'
    or p_movie_key is null or length(p_movie_key) not between 1 and 160
    or p_movie_title is null or length(p_movie_title) not between 1 and 160
 then raise exception 'Invalid player or movie'; end if;
 if p_marked is null or cardinality(p_marked)>25
    or exists(select 1 from unnest(p_marked) as x where x is null or x<0 or x>24)
 then raise exception 'Invalid marks';end if;
 select coalesce(array_agg(distinct x),array[]::integer[])
 into v_marks from unnest(p_marked) x;
 if coalesce(p_free,false) and not 12=any(v_marks)
 then v_marks:=array_append(v_marks,12);end if;
 for i in 0..4 loop
  if (select count(*) from generate_series(0,4) j where (i*5+j)=any(v_marks))=5 then v_lines:=v_lines+1;end if;
  if (select count(*) from generate_series(0,4) j where (j*5+i)=any(v_marks))=5 then v_lines:=v_lines+1;end if;
 end loop;
 if (select count(*) from generate_series(0,4) j where (j*6)=any(v_marks))=5 then v_lines:=v_lines+1;end if;
 if (select count(*) from generate_series(0,4) j where (4+j*4)=any(v_marks))=5 then v_lines:=v_lines+1;end if;
 if v_lines=0 then raise exception 'Complete a Bingo line first';end if;

 insert into public.cheese_tray_scores
 (player_hash,nickname,movie_key,movie_title,marked,has_free,line_count,week_start)
 values (
  encode(extensions.digest(p_device,'sha256'),'hex'),
  trim(p_nickname),lower(trim(p_movie_key)),trim(p_movie_title),
  v_marks,coalesce(p_free,false),v_lines,v_week
 )
 on conflict (player_hash,movie_key)
 do update set
  line_count=greatest(public.cheese_tray_scores.line_count,excluded.line_count),
  marked=case when excluded.line_count>public.cheese_tray_scores.line_count
              then excluded.marked else public.cheese_tray_scores.marked end,
  has_free=case when excluded.line_count>public.cheese_tray_scores.line_count
                then excluded.has_free else public.cheese_tray_scores.has_free end,
  nickname=excluded.nickname
 returning line_count into v_best_lines;
 return jsonb_build_object('lines',v_best_lines,'points',v_best_lines*100);
end
$function$;

-- All-time is now the default. Preserve 'week' as a backward-compatible filter
-- for older consumers; it no longer determines score uniqueness.
create or replace function public.cheese_tray_top(
 p_period text default 'all',p_limit integer default 10
)
returns table(nickname text,points bigint,lines bigint,movies bigint,rank bigint)
language sql stable security definer set search_path = ''
as $function$
 with sums as (
  select player_hash,(array_agg(nickname order by created_at desc))[1] nickname,
         sum(line_count*100)::bigint points,sum(line_count)::bigint lines,count(*)::bigint movies
  from public.cheese_tray_scores
  where (p_period='all' or week_start=(date_trunc('week',now() at time zone 'UTC'))::date)
  group by player_hash
 ), ranked as (
  select nickname,points,lines,movies,
         row_number() over(order by points desc,movies desc,nickname asc)::bigint rank
  from sums
 )
 select nickname,points,lines,movies,rank from ranked
 where rank<=least(greatest(coalesce(p_limit,10),1),10)
 order by rank
$function$;
