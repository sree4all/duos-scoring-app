-- Restore predictions after R32 team labels were corrected by match_number.
-- Two fixture pairs had teams on the wrong match_number row when users predicted;
-- swapping match_id on predictions realigns picks with FIFA fixtures 77/78 and 86/87.

create or replace function public.swap_predictions_match_ids(id_a uuid, id_b uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  create temp table _pred_swap on commit drop as
  select
    id,
    user_id,
    case when match_id = id_a then id_b else id_a end as match_id,
    predicted_winner,
    bonus_pick,
    updated_at
  from public.predictions
  where match_id in (id_a, id_b);

  get diagnostics n = row_count;
  if n = 0 then
    return 0;
  end if;

  delete from public.predictions where match_id in (id_a, id_b);

  insert into public.predictions (id, user_id, match_id, predicted_winner, bonus_pick, updated_at)
  select id, user_id, match_id, predicted_winner, bonus_pick, updated_at
  from _pred_swap;

  return n;
end;
$$;

create or replace function public.swap_bonus_answers_match_ids(id_a uuid, id_b uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  create temp table _bonus_swap on commit drop as
  select
    id,
    user_id,
    case when match_id = id_a then id_b else id_a end as match_id,
    prompt_id,
    answer_text,
    updated_at
  from public.prediction_bonus_answers
  where match_id in (id_a, id_b);

  get diagnostics n = row_count;
  if n = 0 then
    return 0;
  end if;

  delete from public.prediction_bonus_answers where match_id in (id_a, id_b);

  insert into public.prediction_bonus_answers (id, user_id, match_id, prompt_id, answer_text, updated_at)
  select id, user_id, match_id, prompt_id, answer_text, updated_at
  from _bonus_swap;

  return n;
end;
$$;

do $$
declare
  m77 uuid;
  m78 uuid;
  m86 uuid;
  m87 uuid;
  n77 integer;
  n78 integer;
  n86 integer;
  n87 integer;
begin
  select id into m77 from public.matches where season_year = 2026 and match_number = 77;
  select id into m78 from public.matches where season_year = 2026 and match_number = 78;
  select id into m86 from public.matches where season_year = 2026 and match_number = 86;
  select id into m87 from public.matches where season_year = 2026 and match_number = 87;

  if m77 is null or m78 is null or m86 is null or m87 is null then
    raise notice 'R32 swap skipped: one or more match rows missing';
    return;
  end if;

  n77 := public.swap_predictions_match_ids(m77, m78);
  perform public.swap_bonus_answers_match_ids(m77, m78);

  n86 := public.swap_predictions_match_ids(m86, m87);
  perform public.swap_bonus_answers_match_ids(m86, m87);

  raise notice 'Swapped predictions: M77/M78=% rows, M86/M87=% rows', n77, n86;
end;
$$;

drop function if exists public.swap_predictions_match_ids(uuid, uuid);
drop function if exists public.swap_bonus_answers_match_ids(uuid, uuid);
