-- Allow group owners to apply match scoring via the authenticated API (not admin-only).
-- applyMatchScoring writes points_ledger, updates member profiles.current_points, and marks matches.scored_at.

begin;

create or replace function public.is_group_owner_for_match(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    join public.contests c on c.id = e.contest_id
    where e.source_match_id = p_match_id
      and c.group_id is not null
      and public.is_group_owner(c.group_id)
  );
$$;

create or replace function public.is_group_owner_for_ledger_match_row(
  p_source_id text,
  p_source_type text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_source_type in ('match', 'bonus')
    and p_source_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.is_group_owner_for_match(p_source_id::uuid);
$$;

create or replace function public.is_group_owner_for_profile_points(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_memberships gm_target
    join public.group_memberships gm_actor on gm_actor.group_id = gm_target.group_id
    where gm_target.user_id = p_profile_id
      and gm_target.removed_at is null
      and gm_actor.user_id = auth.uid()
      and gm_actor.removed_at is null
      and gm_actor.is_owner = true
  );
$$;

grant execute on function public.is_group_owner_for_match(uuid) to authenticated, service_role;
grant execute on function public.is_group_owner_for_ledger_match_row(text, text) to authenticated, service_role;
grant execute on function public.is_group_owner_for_profile_points(uuid) to authenticated, service_role;

create policy "points_ledger_select_group_owner"
  on public.points_ledger for select
  to authenticated
  using (public.is_group_owner_for_ledger_match_row(source_id, source_type));

create policy "points_ledger_insert_group_owner"
  on public.points_ledger for insert
  to authenticated
  with check (public.is_group_owner_for_ledger_match_row(source_id, source_type));

create policy "points_ledger_delete_group_owner"
  on public.points_ledger for delete
  to authenticated
  using (public.is_group_owner_for_ledger_match_row(source_id, source_type));

create policy "profiles_update_group_owner_points"
  on public.profiles for update
  to authenticated
  using (public.is_group_owner_for_profile_points(id))
  with check (public.is_group_owner_for_profile_points(id));

create policy "matches_update_group_owner"
  on public.matches for update
  to authenticated
  using (public.is_group_owner_for_match(id))
  with check (public.is_group_owner_for_match(id));

grant select, insert, delete on public.points_ledger to authenticated;
grant select, insert, update, delete on public.points_ledger to service_role;

grant update on public.matches to authenticated;

commit;
