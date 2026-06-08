-- Enable RLS on public tables flagged by Supabase database linter.
-- Policies mirror existing app access: group membership for contests/events/ledger,
-- authenticated read for global tournament tables, admin write for scoring config.

begin;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_profile_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.role = 'admin' from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.is_contest_group_member(p_contest_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.contests c
    where c.id = p_contest_id
      and c.group_id is not null
      and public.is_active_group_member(c.group_id)
  );
$$;

create or replace function public.is_contest_group_owner(p_contest_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.contests c
    where c.id = p_contest_id
      and c.group_id is not null
      and public.is_group_owner(c.group_id)
  );
$$;

create or replace function public.is_contest_group_owner_or_scorer(p_contest_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.contests c
    join public.group_memberships gm on gm.group_id = c.group_id
    where c.id = p_contest_id
      and c.group_id is not null
      and gm.user_id = auth.uid()
      and gm.removed_at is null
      and (gm.is_owner = true or gm.is_scorer = true)
  );
$$;

grant execute on function public.is_profile_admin() to authenticated, service_role;
grant execute on function public.is_contest_group_member(uuid) to authenticated, service_role;
grant execute on function public.is_contest_group_owner(uuid) to authenticated, service_role;
grant execute on function public.is_contest_group_owner_or_scorer(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- prediction_bonus_answers (policies already exist; RLS was never enabled)
-- ---------------------------------------------------------------------------

alter table public.prediction_bonus_answers enable row level security;

-- ---------------------------------------------------------------------------
-- Global tournament tables (IPL / mega-bonus portal)
-- ---------------------------------------------------------------------------

alter table public.tournament_config enable row level security;
alter table public.tournament_questions enable row level security;
alter table public.tournament_question_options enable row level security;
alter table public.tournament_answers enable row level security;

create policy "tournament_config_select_authenticated"
  on public.tournament_config for select
  to authenticated
  using (true);

create policy "tournament_config_update_admin"
  on public.tournament_config for update
  to authenticated
  using (public.is_profile_admin())
  with check (public.is_profile_admin());

create policy "tournament_questions_select_authenticated"
  on public.tournament_questions for select
  to authenticated
  using (true);

create policy "tournament_questions_update_admin"
  on public.tournament_questions for update
  to authenticated
  using (public.is_profile_admin())
  with check (public.is_profile_admin());

create policy "tournament_question_options_select_authenticated"
  on public.tournament_question_options for select
  to authenticated
  using (true);

create policy "tournament_answers_select_all_authenticated"
  on public.tournament_answers for select
  to authenticated
  using (true);

create policy "tournament_answers_insert_own"
  on public.tournament_answers for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "tournament_answers_update_own"
  on public.tournament_answers for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, update on public.tournament_config to authenticated;
grant select, update on public.tournament_config to service_role;

grant select, update on public.tournament_questions to authenticated;
grant select, update on public.tournament_questions to service_role;

grant select on public.tournament_question_options to authenticated;
grant select on public.tournament_question_options to service_role;

grant select, insert, update on public.tournament_answers to authenticated;
grant select, insert, update on public.tournament_answers to service_role;

-- ---------------------------------------------------------------------------
-- Generalized scoring / group contests
-- ---------------------------------------------------------------------------

alter table public.game_types enable row level security;
alter table public.contests enable row level security;
alter table public.events enable row level security;
alter table public.contest_points_ledger enable row level security;
alter table public.group_tournament_config enable row level security;

create policy "game_types_select_authenticated"
  on public.game_types for select
  to authenticated
  using (true);

create policy "contests_select_member"
  on public.contests for select
  to authenticated
  using (group_id is not null and public.is_active_group_member(group_id));

create policy "contests_insert_owner"
  on public.contests for insert
  to authenticated
  with check (group_id is not null and public.is_group_owner(group_id));

create policy "contests_update_owner"
  on public.contests for update
  to authenticated
  using (group_id is not null and public.is_group_owner(group_id))
  with check (group_id is not null and public.is_group_owner(group_id));

create policy "events_select_member"
  on public.events for select
  to authenticated
  using (public.is_contest_group_member(contest_id));

create policy "events_insert_owner"
  on public.events for insert
  to authenticated
  with check (public.is_contest_group_owner(contest_id));

create policy "events_update_owner"
  on public.events for update
  to authenticated
  using (public.is_contest_group_owner(contest_id))
  with check (public.is_contest_group_owner(contest_id));

create policy "contest_points_ledger_select_member"
  on public.contest_points_ledger for select
  to authenticated
  using (public.is_contest_group_member(contest_id));

create policy "contest_points_ledger_insert_owner_or_scorer"
  on public.contest_points_ledger for insert
  to authenticated
  with check (public.is_contest_group_owner_or_scorer(contest_id));

create policy "contest_points_ledger_delete_owner"
  on public.contest_points_ledger for delete
  to authenticated
  using (public.is_contest_group_owner(contest_id));

create policy "group_tournament_config_select_member"
  on public.group_tournament_config for select
  to authenticated
  using (public.is_active_group_member(group_id));

create policy "group_tournament_config_owner_write"
  on public.group_tournament_config for all
  to authenticated
  using (public.is_group_owner(group_id))
  with check (public.is_group_owner(group_id));

grant select on public.game_types to authenticated;
grant select on public.game_types to service_role;

grant select, insert, update on public.contests to authenticated;
grant select, insert, update, delete on public.contests to service_role;

grant select, insert, update on public.events to authenticated;
grant select, insert, update, delete on public.events to service_role;

grant select, insert, delete on public.contest_points_ledger to authenticated;
grant select, insert, update, delete on public.contest_points_ledger to service_role;

grant select, insert, update, delete on public.group_tournament_config to service_role;

commit;
