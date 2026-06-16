-- Seed match 19 (Argentina) first-goal minute bracket bonus question for WC 2026.

do $$
declare
  v_match_id uuid;
  v_prompt_id uuid;
  v_prompt_key constant text := 'wc2026:m19:first-goal-minute-bracket';
  v_prompt_text constant text :=
    'In which minute bracket will the first goal of the match be scored?';
begin
  select id into v_match_id
  from public.matches
  where season_year = 2026
    and match_number = 19
    and (home_team ilike '%Argentina%' or away_team ilike '%Argentina%')
  limit 1;

  if v_match_id is null then
    select id into v_match_id
    from public.matches
    where season_year = 2026
      and match_number = 19
    limit 1;
  end if;

  if v_match_id is null then
    raise notice 'Match 19 not found; skipping first-goal bonus prompt seed.';
    return;
  end if;

  select id into v_prompt_id
  from public.bonus_prompts
  where match_id = v_match_id
    and prompt_key = v_prompt_key;

  if v_prompt_id is not null then
    update public.bonus_prompts
    set
      prompt_text = v_prompt_text,
      is_active = true,
      updated_at = now()
    where id = v_prompt_id;

    delete from public.bonus_prompt_options
    where prompt_id = v_prompt_id;
  else
    insert into public.bonus_prompts (
      season_year,
      scope,
      match_id,
      prompt_key,
      prompt_text,
      input_type,
      correct_points,
      incorrect_penalty,
      display_order
    )
    values (
      2026,
      'match',
      v_match_id,
      v_prompt_key,
      v_prompt_text,
      'single_choice',
      2,
      0,
      0
    )
    returning id into v_prompt_id;
  end if;

  insert into public.bonus_prompt_options (prompt_id, label, value, sort_order)
  values
    (
      v_prompt_id,
      'A) 1st – 15th minute',
      'A) 1st – 15th minute',
      0
    ),
    (
      v_prompt_id,
      'B) 16th – 45th minute (including first-half stoppage time)',
      'B) 16th – 45th minute (including first-half stoppage time)',
      1
    ),
    (
      v_prompt_id,
      'C) 46th – 75th minute',
      'C) 46th – 75th minute',
      2
    ),
    (
      v_prompt_id,
      'D) 76th – 90th+ minute (including second-half stoppage time)',
      'D) 76th – 90th+ minute (including second-half stoppage time)',
      3
    ),
    (
      v_prompt_id,
      'E) No goals scored (0–0 draw)',
      'E) No goals scored (0–0 draw)',
      4
    );
end $$;
