-- Leaderboard totals from season points_ledger (source of truth for match scoring).
-- contest_points_ledger mirror has repeatedly drifted; members cannot SELECT
-- points_ledger directly due to RLS, so aggregate here as security definer.

begin;

create or replace function public.contest_leaderboard_totals(p_contest_id uuid)
returns table(participant_id uuid, total_points numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_contest_group_member(p_contest_id) then
    raise exception 'access denied' using errcode = '42501';
  end if;

  return query
  with members as (
    select gm.user_id as participant_id
    from public.contests c
    join public.group_memberships gm on gm.group_id = c.group_id
    where c.id = p_contest_id
      and c.group_id is not null
      and gm.removed_at is null
  ),
  contest_matches as (
    select e.source_match_id::text as match_id
    from public.events e
    where e.contest_id = p_contest_id
      and e.voided = false
      and e.source_match_id is not null
  ),
  season_match_points as (
    select pl.user_id as participant_id, sum(pl.points_delta) as pts
    from public.points_ledger pl
    inner join contest_matches cm on pl.source_id = cm.match_id
    where pl.source_type in ('match', 'bonus')
    group by pl.user_id
  ),
  contest_extra_points as (
    select cpl.participant_id, sum(cpl.points_delta) as pts
    from public.contest_points_ledger cpl
    where cpl.contest_id = p_contest_id
      and cpl.correlation_id not like 'match:%'
    group by cpl.participant_id
  )
  select
    m.participant_id,
    coalesce(smp.pts, 0) + coalesce(cep.pts, 0) as total_points
  from members m
  left join season_match_points smp on smp.participant_id = m.participant_id
  left join contest_extra_points cep on cep.participant_id = m.participant_id;
end;
$$;

grant execute on function public.contest_leaderboard_totals(uuid) to authenticated, service_role;

commit;
