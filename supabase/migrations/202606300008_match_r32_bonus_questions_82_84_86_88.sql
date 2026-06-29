-- Seed Round of 32 bonus questions for matches 82, 84, 86, and 88 (WC 2026).
-- +3 points if correct; no penalty for wrong answers.

do $$
declare
  rec record;
  v_match_id uuid;
  v_prompt_id uuid;
begin
  for rec in
    select *
    from (
      values
        (
          82,
          'Belgium',
          'wc2026:m82:belgium-scores-first',
          'Does Belgium score first?'
        ),
        (
          84,
          'Spain',
          'wc2026:m84:spain-possession-60',
          'Does Spain have 60%+ possession?'
        ),
        (
          86,
          'Argentina',
          'wc2026:m86:messi-goal-or-assist',
          'Does Messi get a goal or assist?'
        ),
        (
          88,
          'Australia',
          'wc2026:m88:extra-time-or-penalties',
          'Does the match need extra time or penalties?'
        )
    ) as t(match_number, team_hint, prompt_key, prompt_text)
  loop
    select id
    into v_match_id
    from public.matches
    where season_year = 2026
      and match_number = rec.match_number
      and (
        home_team ilike '%' || rec.team_hint || '%'
        or away_team ilike '%' || rec.team_hint || '%'
      )
    limit 1;

    if v_match_id is null then
      select id
      into v_match_id
      from public.matches
      where season_year = 2026
        and match_number = rec.match_number
      limit 1;
    end if;

    if v_match_id is null then
      raise notice 'Match % not found; skipping bonus prompt seed.', rec.match_number;
      continue;
    end if;

    select id
    into v_prompt_id
    from public.bonus_prompts
    where match_id = v_match_id
      and prompt_key = rec.prompt_key;

    if v_prompt_id is not null then
      update public.bonus_prompts
      set
        prompt_text = rec.prompt_text,
        is_active = true,
        correct_points = 3,
        incorrect_penalty = 0,
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
        rec.prompt_key,
        rec.prompt_text,
        'single_choice',
        3,
        0,
        0
      )
      returning id into v_prompt_id;
    end if;

    insert into public.bonus_prompt_options (prompt_id, label, value, sort_order)
    values
      (v_prompt_id, 'Yes', 'Yes', 0),
      (v_prompt_id, 'No', 'No', 1);
  end loop;
end $$;
