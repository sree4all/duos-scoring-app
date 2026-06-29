-- Force FIFA official UTC kickoffs for Round of 32 (matches 73–88).
-- Also aligns event lock_at to kickoff for linked contest events.

with kickoffs(match_number, new_time) as (
  values
    (73, timestamptz '2026-06-28T19:00:00+00'),
    (76, timestamptz '2026-06-29T17:00:00+00'),
    (74, timestamptz '2026-06-29T20:30:00+00'),
    (75, timestamptz '2026-06-30T01:00:00+00'),
    (78, timestamptz '2026-06-30T17:00:00+00'),
    (77, timestamptz '2026-06-30T21:00:00+00'),
    (79, timestamptz '2026-07-01T01:00:00+00'),
    (80, timestamptz '2026-07-01T16:00:00+00'),
    (82, timestamptz '2026-07-01T20:00:00+00'),
    (81, timestamptz '2026-07-02T00:00:00+00'),
    (84, timestamptz '2026-07-02T19:00:00+00'),
    (83, timestamptz '2026-07-02T23:00:00+00'),
    (85, timestamptz '2026-07-03T03:00:00+00'),
    (88, timestamptz '2026-07-03T18:00:00+00'),
    (86, timestamptz '2026-07-03T22:00:00+00'),
    (87, timestamptz '2026-07-04T01:30:00+00')
),
upd_matches as (
  update public.matches m
  set
    match_time_utc = k.new_time,
    updated_at = now()
  from kickoffs k
  where m.season_year = 2026
    and m.match_number = k.match_number
    and m.match_time_utc is distinct from k.new_time
  returning m.id, k.new_time
)
update public.events e
set
  lock_at = um.new_time,
  updated_at = now()
from upd_matches um
where e.source_match_id = um.id;

-- Ensure locks match kickoff even when match times were already correct
update public.events e
set
  lock_at = m.match_time_utc,
  updated_at = now()
from public.matches m
where e.source_match_id = m.id
  and m.season_year = 2026
  and m.match_number between 73 and 88
  and e.lock_at is distinct from m.match_time_utc;
