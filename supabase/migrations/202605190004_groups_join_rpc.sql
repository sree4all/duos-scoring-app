-- Join and invite rotation RPCs

begin;

create or replace function public.join_group_by_invite_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select g.id into v_group_id
  from public.groups g
  where upper(g.current_invite_code) = upper(trim(p_invite_code))
    and g.status = 'active';

  if v_group_id is null then
    raise exception 'Invalid or expired invite code';
  end if;

  insert into public.group_memberships (group_id, user_id, is_owner, is_scorer)
  values (v_group_id, v_user_id, false, false)
  on conflict do nothing;

  if not exists (
    select 1 from public.group_memberships gm
    where gm.group_id = v_group_id
      and gm.user_id = v_user_id
      and gm.removed_at is null
  ) then
    update public.group_memberships
    set removed_at = null, joined_at = now()
    where group_id = v_group_id and user_id = v_user_id;
  end if;

  return v_group_id;
end;
$$;

create or replace function public.regenerate_group_invite_code(p_group_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_code text;
  v_old_code text;
begin
  if not public.is_group_owner(p_group_id) then
    raise exception 'Only group owners can regenerate invite codes';
  end if;

  select current_invite_code into v_old_code from public.groups where id = p_group_id;

  v_new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  update public.groups
  set
    current_invite_code = v_new_code,
    invite_code_rotated_at = now(),
    updated_at = now()
  where id = p_group_id;

  if v_old_code is not null then
    insert into public.group_invite_code_history (group_id, invite_code)
    values (p_group_id, v_old_code);
  end if;

  return v_new_code;
end;
$$;

grant execute on function public.join_group_by_invite_code(text) to authenticated;
grant execute on function public.regenerate_group_invite_code(uuid) to authenticated;

commit;
