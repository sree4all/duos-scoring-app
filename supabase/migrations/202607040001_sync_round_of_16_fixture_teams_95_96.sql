-- Sync Round of 16 team names and venues for matches 95–96 after R32 results.
-- FIFA bracket: M95 = winner M86 (Argentina) v winner M88 (Egypt); M96 = winner M85 (Switzerland) v winner M87 (Colombia).
-- Kickoffs unchanged (see 202606300006_round_of_16_kickoffs.sql).

with fixtures(match_number, home_team, away_team, venue_label) as (
  values
    (95, 'Argentina', 'Egypt', 'Atlanta — Mercedes-Benz Stadium'),
    (96, 'Switzerland', 'Colombia', 'Vancouver — BC Place')
),
needs_update as (
  select m.id, f.home_team, f.away_team, f.venue_label
  from public.matches m
  inner join fixtures f on f.match_number = m.match_number
  where m.season_year = 2026
    and m.match_number in (95, 96)
    and not (
      m.home_team ilike f.home_team
      and m.away_team ilike f.away_team
    )
)
update public.matches m
set
  home_team = nu.home_team,
  away_team = nu.away_team,
  home_team_display = nu.home_team,
  away_team_display = nu.away_team,
  venue_label = nu.venue_label,
  updated_at = now()
from needs_update nu
where m.id = nu.id;

update public.events e
set
  title = 'Match ' || m.match_number::text || ': ' || m.home_team || ' vs ' || m.away_team,
  updated_at = now()
from public.matches m
where e.source_match_id = m.id
  and m.season_year = 2026
  and m.match_number in (95, 96)
  and e.title is distinct from (
    'Match ' || m.match_number::text || ': ' || m.home_team || ' vs ' || m.away_team
  );
