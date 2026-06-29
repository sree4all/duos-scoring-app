-- Round of 32 kickoff corrections from FIFA World Cup 2026 official schedule
-- (Eastern wall clock → UTC). Updates match_time_utc only; match_number / external_key
-- and predictions are untouched.
-- Source: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures

with kickoffs(match_number, new_time) as (
  values
    (73, timestamptz '2026-06-28T23:00:00+00'), -- Sun 28 Jun 19:00 ET — Los Angeles
    (74, timestamptz '2026-06-30T00:30:00+00'), -- Mon 29 Jun 20:30 ET — Boston
    (75, timestamptz '2026-06-30T05:00:00+00'), -- Tue 30 Jun 01:00 ET — Monterrey
    (76, timestamptz '2026-06-29T21:00:00+00'), -- Mon 29 Jun 17:00 ET — Houston
    (77, timestamptz '2026-07-01T01:00:00+00'), -- Tue 30 Jun 21:00 ET — New York / New Jersey
    (78, timestamptz '2026-06-30T21:00:00+00'), -- Tue 30 Jun 17:00 ET — Dallas
    (79, timestamptz '2026-07-01T05:00:00+00'), -- Wed  1 Jul 01:00 ET — Mexico City
    (80, timestamptz '2026-07-01T20:00:00+00'), -- Wed  1 Jul 16:00 ET — Atlanta
    (81, timestamptz '2026-07-02T04:00:00+00'), -- Thu  2 Jul 00:00 ET — San Francisco Bay Area
    (82, timestamptz '2026-07-02T00:00:00+00'), -- Wed  1 Jul 20:00 ET — Seattle
    (83, timestamptz '2026-07-03T03:00:00+00'), -- Thu  2 Jul 23:00 ET — Toronto
    (84, timestamptz '2026-07-02T23:00:00+00'), -- Thu  2 Jul 19:00 ET — Los Angeles
    (85, timestamptz '2026-07-03T07:00:00+00'), -- Fri  3 Jul 03:00 ET — Vancouver
    (86, timestamptz '2026-07-04T02:00:00+00'), -- Fri  3 Jul 22:00 ET — Miami
    (87, timestamptz '2026-07-04T05:00:00+00'), -- Sat  4 Jul 01:00 ET — Kansas City
    (88, timestamptz '2026-07-03T22:00:00+00')  -- Fri  3 Jul 18:00 ET — Dallas
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
