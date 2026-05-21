-- Use security-definer is_group_owner() in bonus prompt RLS (avoids membership visibility edge cases).

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
      where e.source_match_id = bonus_prompts.match_id
        and c.group_id is not null
        and public.is_group_owner(c.group_id)
    )
  )
  with check (
    scope = 'match'
    and match_id is not null
    and exists (
      select 1
      from public.events e
      join public.contests c on c.id = e.contest_id
      where e.source_match_id = bonus_prompts.match_id
        and c.group_id is not null
        and public.is_group_owner(c.group_id)
    )
  );

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
      where bp.id = bonus_prompt_options.prompt_id
        and c.group_id is not null
        and public.is_group_owner(c.group_id)
    )
  )
  with check (
    exists (
      select 1
      from public.bonus_prompts bp
      join public.events e on e.source_match_id = bp.match_id
      join public.contests c on c.id = e.contest_id
      where bp.id = bonus_prompt_options.prompt_id
        and c.group_id is not null
        and public.is_group_owner(c.group_id)
    )
  );

grant select, insert, update, delete on public.bonus_prompts to service_role;
grant select, insert, update, delete on public.bonus_prompt_options to service_role;
grant select, insert, update, delete on public.prediction_bonus_answers to service_role;
