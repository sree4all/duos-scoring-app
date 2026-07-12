-- Finals-week bonus questions (WC 2026): semi-finals, third place, and Final.
-- Two questions per match: one safe (no penalty) and one gamble (penalty for a
-- wrong answer). Replaces the auto-generated odd-match question on match 101.
--
-- The two Final (match 104) prompts use team-name placeholders. Their text and
-- option labels are re-rendered by bracket propagation when the semi-final
-- results resolve the finalists — templates live in
-- lib/domain/world-cup/placeholder-bonus-prompts.ts and are keyed by
-- prompt_key. Option values are stable tokens and never change.

-- 1) Retire the auto-generated question on Semi Final 1.
update public.bonus_prompts
set is_active = false, updated_at = now()
where season_year = 2026
  and prompt_key = 'wc2026:auto:odd:m101';

-- 2) Seed the eight finals-week questions (idempotent by match + prompt_key).
do $$
declare
  rec record;
  opt record;
  v_match_id uuid;
  v_prompt_id uuid;
begin
  for rec in
    select *
    from (
      values
        (
          101,
          'wc2026:sf1:penalty-awarded',
          'Will a penalty be awarded during play (excluding a shootout)?',
          3,
          0,
          0,
          '[{"label": "Yes", "value": "Yes"},
            {"label": "No", "value": "No"}]'::jsonb
        ),
        (
          101,
          'wc2026:sf1:star-duel',
          'Star duel: who registers a goal or an assist in this match?',
          5,
          -2,
          1,
          '[{"label": "Only Mbappé", "value": "only_mbappe"},
            {"label": "Only Lamine Yamal", "value": "only_yamal"},
            {"label": "Both", "value": "both"},
            {"label": "Neither", "value": "neither"}]'::jsonb
        ),
        (
          102,
          'wc2026:sf2:kane-scores',
          'Does Harry Kane score in this match?',
          3,
          0,
          0,
          '[{"label": "Yes", "value": "Yes"},
            {"label": "No", "value": "No"}]'::jsonb
        ),
        (
          102,
          'wc2026:sf2:first-goal-time',
          'When is the first goal of the match scored?',
          5,
          -2,
          1,
          '[{"label": "Before the 25th minute", "value": "before_25"},
            {"label": "Minute 25 to 70", "value": "min_25_70"},
            {"label": "After the 70th minute (incl. extra time)", "value": "after_70"},
            {"label": "No goals", "value": "no_goals"}]'::jsonb
        ),
        (
          103,
          'wc2026:third:sub-scores',
          'Does a substitute score a goal?',
          3,
          0,
          0,
          '[{"label": "Yes", "value": "Yes"},
            {"label": "No", "value": "No"}]'::jsonb
        ),
        (
          103,
          'wc2026:third:first-goal-method',
          'How is the first goal scored?',
          5,
          -3,
          1,
          '[{"label": "Open play", "value": "open_play"},
            {"label": "Set piece (corner or free kick)", "value": "set_piece"},
            {"label": "Penalty", "value": "penalty"},
            {"label": "No goals", "value": "no_goals"}]'::jsonb
        ),
        (
          104,
          'wc2026:final:potm-team',
          'The official Player of the Match award goes to a player from…',
          4,
          0,
          0,
          '[{"label": "Winner of Semi Final 1", "value": "finalist_sf1"},
            {"label": "Winner of Semi Final 2", "value": "finalist_sf2"}]'::jsonb
        ),
        (
          104,
          'wc2026:final:exact-result',
          'Call the exact 90-minute result of the Final.',
          10,
          -4,
          1,
          '[{"label": "Winner of Semi Final 1 wins 1-0", "value": "finalist_sf1_wins_1_0"},
            {"label": "Winner of Semi Final 1 wins 2-1", "value": "finalist_sf1_wins_2_1"},
            {"label": "Winner of Semi Final 1 wins by 2+ goals", "value": "finalist_sf1_wins_by_2plus"},
            {"label": "Winner of Semi Final 2 wins 1-0", "value": "finalist_sf2_wins_1_0"},
            {"label": "Winner of Semi Final 2 wins 2-1", "value": "finalist_sf2_wins_2_1"},
            {"label": "Winner of Semi Final 2 wins by 2+ goals", "value": "finalist_sf2_wins_by_2plus"},
            {"label": "Level after 90 minutes", "value": "level_after_90"}]'::jsonb
        )
    ) as t(match_number, prompt_key, prompt_text, correct_points, incorrect_penalty, display_order, options)
  loop
    select id
    into v_match_id
    from public.matches
    where season_year = 2026
      and match_number = rec.match_number
    limit 1;

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
        correct_points = rec.correct_points,
        incorrect_penalty = rec.incorrect_penalty,
        display_order = rec.display_order,
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
        is_active,
        revealed_by_admin,
        correct_points,
        incorrect_penalty,
        display_order,
        generation_source
      )
      values (
        2026,
        'match',
        v_match_id,
        rec.prompt_key,
        rec.prompt_text,
        'single_choice',
        true,
        true,
        rec.correct_points,
        rec.incorrect_penalty,
        rec.display_order,
        'owner'
      )
      returning id into v_prompt_id;
    end if;

    for opt in
      select
        elem ->> 'label' as label,
        elem ->> 'value' as value,
        ordinality - 1 as sort_order
      from jsonb_array_elements(rec.options) with ordinality as e(elem, ordinality)
    loop
      insert into public.bonus_prompt_options (prompt_id, label, value, sort_order)
      values (v_prompt_id, opt.label, opt.value, opt.sort_order);
    end loop;
  end loop;
end $$;
