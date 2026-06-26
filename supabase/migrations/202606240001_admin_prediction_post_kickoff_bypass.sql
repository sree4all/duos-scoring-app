-- Allow server-side admin proxy saves after kickoff (bypasses prediction lock trigger).

create or replace function public.enforce_prediction_lock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(nullif(current_setting('app.bypass_prediction_lock', true), ''), 'false') = 'true' then
    new.updated_at := now();
    return new;
  end if;

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

create or replace function public.admin_upsert_prediction(
  p_user_id uuid,
  p_match_id uuid,
  p_predicted_winner text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.matches where id = p_match_id) then
    raise exception 'match not found';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'user not found';
  end if;

  perform set_config('app.bypass_prediction_lock', 'true', true);

  insert into public.predictions (user_id, match_id, predicted_winner, updated_at)
  values (p_user_id, p_match_id, p_predicted_winner, now())
  on conflict (user_id, match_id)
  do update set
    predicted_winner = excluded.predicted_winner,
    updated_at = now();
end;
$$;

revoke all on function public.admin_upsert_prediction(uuid, uuid, text) from public;
grant execute on function public.admin_upsert_prediction(uuid, uuid, text) to service_role;
