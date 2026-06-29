-- Ensure Round of 32 rows can be scored with -1 wrong-pick penalty.

begin;

-- Backfill match_number when only external_key is present (legacy CSV imports).
update public.matches
set
  match_number = (regexp_match(external_key, 'm(\d+)$'))[1]::integer,
  updated_at = now()
where season_year = 2026
  and match_number is null
  and external_key ~* 'm\d+$';

update public.matches
set
  match_number = external_key::integer,
  updated_at = now()
where season_year = 2026
  and match_number is null
  and external_key ~ '^\d+$';

-- Knockout fixtures 73–88 must be round_of_32 for stage rules lookup.
update public.matches
set
  stage_key = 'round_of_32',
  updated_at = now()
where season_year = 2026
  and match_number between 73 and 88
  and stage_key is distinct from 'round_of_32';

update public.events as e
set
  stage_key = m.stage_key,
  updated_at = now()
from public.matches as m
where e.source_match_id = m.id
  and m.season_year = 2026
  and m.match_number between 73 and 88
  and e.stage_key is distinct from m.stage_key;

-- Wrong-pick penalty must be negative for knockout rounds.
update public.contest_stage_scoring_rules
set
  incorrect_penalty = -1,
  updated_at = now()
where stage_key = 'round_of_32'
  and incorrect_penalty >= 0;

commit;
