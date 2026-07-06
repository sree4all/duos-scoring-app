-- Round of 16 official UTC kickoffs (matches 89–96).
-- Tournament forecast lock follows the earliest R16 kickoff (match 90).

begin;

with kickoffs(match_number, new_time) as (
  values
    (90, timestamptz '2026-07-04T17:00:00+00'), -- Sat  4 Jul  1:00 PM ET — Houston (first R16 kickoff)
    (89, timestamptz '2026-07-04T21:00:00+00'), -- Sat  4 Jul  5:00 PM ET — Philadelphia
    (91, timestamptz '2026-07-05T20:00:00+00'), -- Sun  5 Jul  4:00 PM ET — East Rutherford
    (92, timestamptz '2026-07-06T00:00:00+00'), -- Sat  5 Jul  8:00 PM ET — Mexico City
    (93, timestamptz '2026-07-06T19:00:00+00'), -- Mon  6 Jul  3:00 PM ET — Dallas
    (94, timestamptz '2026-07-07T00:00:00+00'), -- Mon  6 Jul  8:00 PM ET — Seattle
    (95, timestamptz '2026-07-07T16:00:00+00'), -- Tue  7 Jul 12:00 PM ET — Atlanta
    (96, timestamptz '2026-07-07T20:00:00+00')  -- Tue  7 Jul  4:00 PM ET — Vancouver
),
upd_matches as (
  update public.matches m
  set
    match_time_utc = k.new_time,
    stage_key = 'round_of_16',
    updated_at = now()
  from kickoffs k
  where m.season_year = 2026
    and m.match_number = k.match_number
    and (
      m.match_time_utc is distinct from k.new_time
      or m.stage_key is distinct from 'round_of_16'
    )
  returning m.id, k.new_time
)
update public.events e
set
  lock_at = um.new_time,
  stage_key = 'round_of_16',
  updated_at = now()
from upd_matches um
where e.source_match_id = um.id;

-- Align event locks and stage keys even when match rows were already correct
update public.events e
set
  lock_at = m.match_time_utc,
  stage_key = m.stage_key,
  updated_at = now()
from public.matches m
where e.source_match_id = m.id
  and m.season_year = 2026
  and m.match_number between 89 and 96
  and (
    e.lock_at is distinct from m.match_time_utc
    or e.stage_key is distinct from m.stage_key
  );

commit;
