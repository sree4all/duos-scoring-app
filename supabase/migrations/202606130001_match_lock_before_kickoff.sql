-- Default match prediction lock is kickoff minus 30 minutes (matches DB trigger + app policy).
update public.events e
set
  lock_at = m.match_time_utc - interval '30 minutes',
  updated_at = now()
from public.matches m
where e.source_match_id = m.id
  and (
    e.lock_at is null
    or e.lock_at = m.match_time_utc
  );
