-- Sync denormalized event.stage_key from matches after stage corrections on matches.

update public.events e
set
  stage_key = m.stage_key,
  updated_at = now()
from public.matches m
where e.source_match_id = m.id
  and m.stage_key is not null
  and e.stage_key is distinct from m.stage_key;
