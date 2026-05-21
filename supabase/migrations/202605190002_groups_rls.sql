-- RLS for private groups

begin;

alter table public.groups enable row level security;
alter table public.group_memberships enable row level security;
alter table public.group_invite_code_history enable row level security;

create or replace function public.is_active_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_memberships gm
    where gm.group_id = p_group_id
      and gm.user_id = auth.uid()
      and gm.removed_at is null
  );
$$;

create or replace function public.is_group_owner(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_memberships gm
    where gm.group_id = p_group_id
      and gm.user_id = auth.uid()
      and gm.is_owner = true
      and gm.removed_at is null
  );
$$;

grant execute on function public.is_active_group_member(uuid) to authenticated, service_role;
grant execute on function public.is_group_owner(uuid) to authenticated, service_role;

create policy groups_select_member
  on public.groups for select
  to authenticated
  using (public.is_active_group_member(id));

create policy groups_insert_authenticated
  on public.groups for insert
  to authenticated
  with check (created_by = auth.uid());

create policy groups_update_owner
  on public.groups for update
  to authenticated
  using (public.is_group_owner(id))
  with check (public.is_group_owner(id));

create policy group_memberships_select_member
  on public.group_memberships for select
  to authenticated
  using (public.is_active_group_member(group_id));

create policy group_memberships_insert_self
  on public.group_memberships for insert
  to authenticated
  with check (user_id = auth.uid());

create policy group_memberships_update_owner
  on public.group_memberships for update
  to authenticated
  using (public.is_group_owner(group_id))
  with check (public.is_group_owner(group_id));

create policy group_invite_history_select_owner
  on public.group_invite_code_history for select
  to authenticated
  using (public.is_group_owner(group_id));

commit;
