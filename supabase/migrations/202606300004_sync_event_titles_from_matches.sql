-- Refresh stale contest event titles from linked matches (teams were correct on
-- matches but events.title was swapped for some R32 fixtures after import).

update public.events e
set
  title = 'Match ' || m.match_number::text || ': ' || m.home_team || ' vs ' || m.away_team,
  updated_at = now()
from public.matches m
where e.source_match_id = m.id
  and m.match_number is not null
  and e.title is distinct from (
    'Match ' || m.match_number::text || ': ' || m.home_team || ' vs ' || m.away_team
  );
