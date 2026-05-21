alter table public.contest_stage_scoring_rules enable row level security;
alter table public.worldcup_import_runs enable row level security;

create policy "stage_rules_select_member"
  on public.contest_stage_scoring_rules for select
  to authenticated
  using (
    exists (
      select 1 from public.group_memberships gm
      where gm.group_id = contest_stage_scoring_rules.group_id
        and gm.user_id = auth.uid()
        and gm.removed_at is null
        and (
          contest_stage_scoring_rules.revealed_at is not null
          or gm.is_owner = true
        )
    )
  );

create policy "stage_rules_owner_write"
  on public.contest_stage_scoring_rules for all
  to authenticated
  using (
    exists (
      select 1 from public.group_memberships gm
      where gm.group_id = contest_stage_scoring_rules.group_id
        and gm.user_id = auth.uid()
        and gm.is_owner = true
        and gm.removed_at is null
    )
  )
  with check (
    exists (
      select 1 from public.group_memberships gm
      where gm.group_id = contest_stage_scoring_rules.group_id
        and gm.user_id = auth.uid()
        and gm.is_owner = true
        and gm.removed_at is null
    )
  );

create policy "import_runs_owner"
  on public.worldcup_import_runs for all
  to authenticated
  using (
    exists (
      select 1 from public.group_memberships gm
      where gm.group_id = worldcup_import_runs.group_id
        and gm.user_id = auth.uid()
        and gm.is_owner = true
        and gm.removed_at is null
    )
  )
  with check (
    exists (
      select 1 from public.group_memberships gm
      where gm.group_id = worldcup_import_runs.group_id
        and gm.user_id = auth.uid()
        and gm.is_owner = true
        and gm.removed_at is null
    )
  );
