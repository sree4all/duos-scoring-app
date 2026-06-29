-- Correct R32 kickoffs if 202606290001 was applied with FIFA UTC times misread as ET.
-- Idempotent: sets the same ET-based UTC values as the fixed 202606290001 migration.

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
to_fix as (
  select m.id, m.match_time_utc as old_time, k.new_time
  from public.matches m
  inner join kickoffs k on k.match_number = m.match_number
  where m.season_year = 2026
    and m.match_number between 73 and 88
    and m.match_time_utc is distinct from k.new_time
),
upd_matches as (
  update public.matches m
  set match_time_utc = tf.new_time, updated_at = now()
  from to_fix tf
  where m.id = tf.id
  returning m.id, tf.old_time, tf.new_time
)
update public.events e
set lock_at = um.new_time, updated_at = now()
from upd_matches um
where e.source_match_id = um.id
  and (
    e.lock_at is null
    or e.lock_at = um.old_time
    or e.lock_at = um.old_time - interval '30 minutes'
  );
