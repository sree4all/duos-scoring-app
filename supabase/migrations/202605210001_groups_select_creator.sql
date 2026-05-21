-- Allow group creators to read their row immediately after insert (before membership insert).

begin;

drop policy if exists groups_select_member on public.groups;

create policy groups_select_member
  on public.groups for select
  to authenticated
  using (
    public.is_active_group_member(id)
    or created_by = auth.uid()
  );

commit;
