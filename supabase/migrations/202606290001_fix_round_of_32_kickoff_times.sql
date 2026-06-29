-- Round of 32 kickoff corrections (US Eastern wall clock → UTC).
-- Updates match_time_utc only; match_number / external_key / predictions untouched.
-- ET source: NBC Sports R32 schedule (https://www.nbcsports.com/soccer/news/2026-world-cup-schedule-kick-off-times-stadiums-dates-groups-how-to-watch-live-bracket)
-- Note: FIFA.com scores-fixtures displays kickoff in UTC, not ET.

with kickoffs(match_number, new_time) as (
  values
    (73, timestamptz '2026-06-28T19:00:00+00'), -- Sun 28 Jun  3:00 PM ET — Los Angeles
    (76, timestamptz '2026-06-29T17:00:00+00'), -- Mon 29 Jun  1:00 PM ET — Houston
    (74, timestamptz '2026-06-29T20:30:00+00'), -- Mon 29 Jun  4:30 PM ET — Boston
    (75, timestamptz '2026-06-30T01:00:00+00'), -- Mon 29 Jun  9:00 PM ET — Monterrey
    (78, timestamptz '2026-06-30T17:00:00+00'), -- Tue 30 Jun  1:00 PM ET — Dallas
    (77, timestamptz '2026-06-30T21:00:00+00'), -- Tue 30 Jun  5:00 PM ET — New York / New Jersey
    (79, timestamptz '2026-07-01T01:00:00+00'), -- Tue 30 Jun  9:00 PM ET — Mexico City
    (80, timestamptz '2026-07-01T16:00:00+00'), -- Wed  1 Jul 12:00 PM ET — Atlanta
    (82, timestamptz '2026-07-01T20:00:00+00'), -- Wed  1 Jul  4:00 PM ET — Seattle
    (81, timestamptz '2026-07-02T00:00:00+00'), -- Wed  1 Jul  8:00 PM ET — San Francisco Bay Area
    (84, timestamptz '2026-07-02T19:00:00+00'), -- Thu  2 Jul  3:00 PM ET — Los Angeles
    (83, timestamptz '2026-07-02T23:00:00+00'), -- Thu  2 Jul  7:00 PM ET — Toronto
    (85, timestamptz '2026-07-03T03:00:00+00'), -- Thu  2 Jul 11:00 PM ET — Vancouver
    (88, timestamptz '2026-07-03T18:00:00+00'), -- Fri  3 Jul  2:00 PM ET — Dallas
    (86, timestamptz '2026-07-03T22:00:00+00'), -- Fri  3 Jul  6:00 PM ET — Miami
    (87, timestamptz '2026-07-04T01:30:00+00')  -- Fri  3 Jul  9:30 PM ET — Kansas City
),
to_fix as (
  select
    m.id,
    m.match_time_utc as old_time,
    k.new_time
  from public.matches m
  inner join kickoffs k on k.match_number = m.match_number
  where m.season_year = 2026
    and m.match_number between 73 and 88
    and m.match_time_utc is distinct from k.new_time
),
upd_matches as (
  update public.matches m
  set
    match_time_utc = tf.new_time,
    updated_at = now()
  from to_fix tf
  where m.id = tf.id
  returning m.id, tf.old_time, tf.new_time
)
update public.events e
set
  lock_at = um.new_time,
  updated_at = now()
from upd_matches um
where e.source_match_id = um.id
  and (
    e.lock_at is null
    or e.lock_at = um.old_time
    or e.lock_at = um.old_time - interval '30 minutes'
  );
