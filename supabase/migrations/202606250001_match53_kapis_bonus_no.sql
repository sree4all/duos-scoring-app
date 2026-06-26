-- Set Kapis's bonus answer to "No" for WC 2026 match 53 (Mexico vs Czechia).
-- Run via Supabase migration or paste into SQL editor.

do $$
declare
  v_match_id uuid;
  v_kapis_user_id uuid;
  v_prompt_id uuid;
begin
  select id
  into v_match_id
  from public.matches
  where season_year = 2026
    and match_number = 53
    and (
      home_team ilike '%Mexico%'
      or away_team ilike '%Mexico%'
      or home_team ilike '%Czechia%'
      or away_team ilike '%Czechia%'
    )
  limit 1;

  if v_match_id is null then
    select id
    into v_match_id
    from public.matches
    where season_year = 2026
      and match_number = 53
    limit 1;
  end if;

  if v_match_id is null then
    raise exception 'Match 53 not found';
  end if;

  select id into v_kapis_user_id
  from public.profiles
  where display_name ilike 'Kapis'
  limit 1;

  if v_kapis_user_id is null then
    raise exception 'Profile not found for display_name Kapis';
  end if;

  select id into v_prompt_id
  from public.bonus_prompts
  where match_id = v_match_id
    and scope = 'match'
    and is_active = true
  order by display_order, created_at
  limit 1;

  if v_prompt_id is null then
    raise exception 'No active bonus prompt found for match 53';
  end if;

  insert into public.prediction_bonus_answers (
    user_id,
    match_id,
    prompt_id,
    answer_text,
    updated_at
  )
  values (
    v_kapis_user_id,
    v_match_id,
    v_prompt_id,
    'No',
    now()
  )
  on conflict (user_id, prompt_id)
  do update set
    answer_text = excluded.answer_text,
    match_id = excluded.match_id,
    updated_at = now();
end $$;
