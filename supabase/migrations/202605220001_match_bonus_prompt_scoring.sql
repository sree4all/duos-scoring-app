-- Per-match bonus questions: configurable correct/wrong points (group owner).

alter table public.bonus_prompts
  add column if not exists correct_points integer not null default 2,
  add column if not exists incorrect_penalty integer not null default 0;

grant select, insert, update, delete on public.bonus_prompts to authenticated;
grant select, insert, update, delete on public.bonus_prompt_options to authenticated;
grant select, insert, update, delete on public.prediction_bonus_answers to authenticated;

alter table public.bonus_prompts enable row level security;
alter table public.bonus_prompt_options enable row level security;

drop policy if exists "bonus_prompts_select_authenticated" on public.bonus_prompts;
create policy "bonus_prompts_select_authenticated"
  on public.bonus_prompts for select
  to authenticated
  using (true);

drop policy if exists "bonus_prompts_owner_write" on public.bonus_prompts;
create policy "bonus_prompts_owner_write"
  on public.bonus_prompts for all
  to authenticated
  using (
    scope = 'match'
    and match_id is not null
    and exists (
      select 1
      from public.events e
      join public.contests c on c.id = e.contest_id
      join public.group_memberships gm on gm.group_id = c.group_id
      where e.source_match_id = bonus_prompts.match_id
        and gm.user_id = auth.uid()
        and gm.is_owner = true
        and gm.removed_at is null
    )
  )
  with check (
    scope = 'match'
    and match_id is not null
    and exists (
      select 1
      from public.events e
      join public.contests c on c.id = e.contest_id
      join public.group_memberships gm on gm.group_id = c.group_id
      where e.source_match_id = bonus_prompts.match_id
        and gm.user_id = auth.uid()
        and gm.is_owner = true
        and gm.removed_at is null
    )
  );

drop policy if exists "bonus_prompt_options_select_authenticated" on public.bonus_prompt_options;
create policy "bonus_prompt_options_select_authenticated"
  on public.bonus_prompt_options for select
  to authenticated
  using (true);

drop policy if exists "bonus_prompt_options_owner_write" on public.bonus_prompt_options;
create policy "bonus_prompt_options_owner_write"
  on public.bonus_prompt_options for all
  to authenticated
  using (
    exists (
      select 1
      from public.bonus_prompts bp
      join public.events e on e.source_match_id = bp.match_id
      join public.contests c on c.id = e.contest_id
      join public.group_memberships gm on gm.group_id = c.group_id
      where bp.id = bonus_prompt_options.prompt_id
        and gm.user_id = auth.uid()
        and gm.is_owner = true
        and gm.removed_at is null
    )
  )
  with check (
    exists (
      select 1
      from public.bonus_prompts bp
      join public.events e on e.source_match_id = bp.match_id
      join public.contests c on c.id = e.contest_id
      join public.group_memberships gm on gm.group_id = c.group_id
      where bp.id = bonus_prompt_options.prompt_id
        and gm.user_id = auth.uid()
        and gm.is_owner = true
        and gm.removed_at is null
    )
  );

drop policy if exists "prediction_bonus_answers_upsert_own" on public.prediction_bonus_answers;
create policy "prediction_bonus_answers_insert_own"
  on public.prediction_bonus_answers for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "prediction_bonus_answers_update_own" on public.prediction_bonus_answers;
create policy "prediction_bonus_answers_update_own"
  on public.prediction_bonus_answers for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
