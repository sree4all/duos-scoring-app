-- Matches 73–88 are Round of 32. Some rows were left as group_stage (or null)
-- from early imports, so knockout penalties (+3/-1) were not applied.

begin;

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

commit;
