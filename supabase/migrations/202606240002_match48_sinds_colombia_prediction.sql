-- Late prediction for WC 2026 match 48 (Colombia vs Congo DR), bypassing kickoff lock.
-- Run via Supabase migration or paste into SQL editor.

do $$
declare
  v_match_id uuid;
  v_home_team text;
  v_away_team text;
  v_sinds_user_id uuid;
begin
  select id, home_team, away_team
  into v_match_id, v_home_team, v_away_team
  from public.matches
  where season_year = 2026
    and match_number = 48
    and (
      home_team ilike '%Colombia%'
      or away_team ilike '%Colombia%'
      or home_team ilike '%Congo%'
      or away_team ilike '%Congo%'
    )
  limit 1;

  if v_match_id is null then
    select id, home_team, away_team
    into v_match_id, v_home_team, v_away_team
    from public.matches
    where season_year = 2026
      and match_number = 48
    limit 1;
  end if;

  if v_match_id is null then
    raise exception 'Match 48 not found';
  end if;

  select id into v_sinds_user_id
  from public.profiles
  where display_name ilike 'sinds.v'
  limit 1;

  if v_sinds_user_id is null then
    raise exception 'Profile not found for display_name sinds.v';
  end if;

  alter table public.predictions disable trigger predictions_lock_bi;

  insert into public.predictions (user_id, match_id, predicted_winner, updated_at)
  values (
    v_sinds_user_id,
    v_match_id,
    case
      when v_home_team ilike '%Colombia%' then v_home_team
      when v_away_team ilike '%Colombia%' then v_away_team
      else 'Colombia'
    end,
    now()
  )
  on conflict (user_id, match_id)
  do update set
    predicted_winner = excluded.predicted_winner,
    updated_at = now();

  alter table public.predictions enable trigger predictions_lock_bi;
end $$;
