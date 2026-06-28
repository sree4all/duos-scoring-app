-- Advanced bracket predictions: semi-finalists (4), finalists (2), winner (1).
-- Separate from per-match predictions; scored after semi-finals and finals stages.

begin;

create table if not exists public.advanced_bracket_predictions (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  semi_finalist_teams text[] not null default '{}',
  finalist_teams text[] not null default '{}',
  winner_team text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contest_id, user_id)
);

create table if not exists public.advanced_bracket_official (
  contest_id uuid primary key references public.contests (id) on delete cascade,
  semi_finalist_teams text[] not null default '{}',
  finalist_teams text[] not null default '{}',
  winner_team text,
  semi_finalists_scored_at timestamptz,
  finalists_scored_at timestamptz,
  winner_scored_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists advanced_bracket_predictions_contest_idx
  on public.advanced_bracket_predictions (contest_id);

alter table public.advanced_bracket_predictions enable row level security;
alter table public.advanced_bracket_official enable row level security;

create policy "advanced_bracket_predictions_select_member"
  on public.advanced_bracket_predictions for select
  to authenticated
  using (public.is_contest_group_member(contest_id));

create policy "advanced_bracket_predictions_upsert_self"
  on public.advanced_bracket_predictions for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.is_contest_group_member(contest_id)
  );

create policy "advanced_bracket_predictions_update_self"
  on public.advanced_bracket_predictions for update
  to authenticated
  using (user_id = auth.uid() and public.is_contest_group_member(contest_id))
  with check (user_id = auth.uid() and public.is_contest_group_member(contest_id));

create policy "advanced_bracket_official_select_member"
  on public.advanced_bracket_official for select
  to authenticated
  using (public.is_contest_group_member(contest_id));

create policy "advanced_bracket_official_owner_write"
  on public.advanced_bracket_official for all
  to authenticated
  using (public.is_contest_group_owner(contest_id))
  with check (public.is_contest_group_owner(contest_id));

grant select, insert, update on public.advanced_bracket_predictions to authenticated;
grant select, insert, update, delete on public.advanced_bracket_predictions to service_role;

grant select, insert, update, delete on public.advanced_bracket_official to authenticated;
grant select, insert, update, delete on public.advanced_bracket_official to service_role;

commit;
