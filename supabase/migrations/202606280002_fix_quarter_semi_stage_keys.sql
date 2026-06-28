-- Matches 97–102 were imported as group_stage because the Kaggle dataset uses
-- "Quarterfinals" / "Semifinals" (one word), which the importer did not map.
-- Wrong stage_key caused them to appear when only Group Stage was revealed.

begin;

update public.matches
set
  stage_key = 'quarter_finals',
  updated_at = now()
where season_year = 2026
  and match_number between 97 and 100
  and stage_key is distinct from 'quarter_finals';

update public.matches
set
  stage_key = 'semi_finals',
  updated_at = now()
where season_year = 2026
  and match_number between 101 and 102
  and stage_key is distinct from 'semi_finals';

update public.events as e
set
  stage_key = m.stage_key,
  updated_at = now()
from public.matches as m
where e.source_match_id = m.id
  and m.season_year = 2026
  and m.match_number between 97 and 102
  and e.stage_key is distinct from m.stage_key;

commit;
