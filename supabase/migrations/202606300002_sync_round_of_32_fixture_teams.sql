-- Sync Round of 32 team names and venues to FIFA post–group-stage fixtures.
-- Does NOT change match_number or external_key. Predictions reference match_id;
-- team labels are updated only when the row does not already match (incl. aliases).

with fixtures(match_number, home_team, away_team, venue_label) as (
  values
    (73, 'South Africa', 'Canada', 'Los Angeles — SoFi Stadium'),
    (74, 'Germany', 'Paraguay', 'Boston — Gillette Stadium'),
    (75, 'Netherlands', 'Morocco', 'Monterrey — Estadio BBVA'),
    (76, 'Brazil', 'Japan', 'Houston — NRG Stadium'),
    (77, 'France', 'Sweden', 'New York / New Jersey — MetLife Stadium'),
    (78, 'Ivory Coast', 'Norway', 'Dallas — AT&T Stadium'),
    (79, 'Mexico', 'Ecuador', 'Mexico City — Estadio Azteca'),
    (80, 'England', 'DR Congo', 'Atlanta — Mercedes-Benz Stadium'),
    (81, 'USA', 'Bosnia and Herzegovina', 'San Francisco Bay Area — Levi''s Stadium'),
    (82, 'Belgium', 'Senegal', 'Seattle — Lumen Field'),
    (83, 'Portugal', 'Croatia', 'Toronto — BMO Field'),
    (84, 'Spain', 'Austria', 'Los Angeles — SoFi Stadium'),
    (85, 'Switzerland', 'Algeria', 'Vancouver — BC Place'),
    (86, 'Argentina', 'Cape Verde', 'Miami — Hard Rock Stadium'),
    (87, 'Colombia', 'Ghana', 'Kansas City — Arrowhead Stadium'),
    (88, 'Australia', 'Egypt', 'Dallas — AT&T Stadium')
),
needs_update as (
  select m.id, f.home_team, f.away_team, f.venue_label
  from public.matches m
  inner join fixtures f on f.match_number = m.match_number
  where m.season_year = 2026
    and m.match_number between 73 and 88
    and not (
      (
        m.home_team ilike f.home_team
        or (f.home_team = 'Ivory Coast' and m.home_team ilike any (array['%ivory coast%', '%côte d''ivoire%', '%cote d''ivoire%']))
        or (f.home_team = 'DR Congo' and m.home_team ilike any (array['%dr congo%', '%congo dr%', '%democratic republic%']))
        or (f.home_team = 'USA' and m.home_team ilike any (array['usa', 'united states', 'us']))
      )
      and (
        m.away_team ilike f.away_team
        or (f.away_team = 'Bosnia and Herzegovina' and m.away_team ilike any (array['%bosnia%']))
        or (f.away_team = 'DR Congo' and m.away_team ilike any (array['%dr congo%', '%congo dr%', '%democratic republic%']))
      )
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
