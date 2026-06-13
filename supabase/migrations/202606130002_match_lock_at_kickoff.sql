-- Default prediction lock is kickoff; owner may set an earlier lock on the event.

create or replace function public.enforce_prediction_lock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.matches where id = new.match_id) then
    raise exception 'match not found';
  end if;
  if now() > (
    select match_time_utc
    from public.matches
    where id = new.match_id
  ) then
    raise exception 'MATCH_LOCKED' using errcode = 'P0001';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

update public.events e
set
  lock_at = m.match_time_utc,
  updated_at = now()
from public.matches m
where e.source_match_id = m.id
  and (
    e.lock_at is null
    or e.lock_at = m.match_time_utc - interval '30 minutes'
  );
