-- Preserve CSV host offset for kickoff display (e.g. -07:00 for Pacific).
alter table public.matches
  add column if not exists kickoff_tz_offset text;

comment on column public.matches.kickoff_tz_offset is
  'ISO 8601 offset from import kickoff_at (e.g. -07:00). Used with match_time_utc for stadium-local display.';
