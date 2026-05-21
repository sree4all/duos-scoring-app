-- Stage scoring rules and import audit

create table if not exists public.contest_stage_scoring_rules (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  stage_key text not null,
  stage_name text not null,
  stage_order integer not null,
  correct_points integer not null,
  incorrect_penalty integer not null default 0,
  revealed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contest_id, stage_key)
);

create table if not exists public.worldcup_import_runs (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  contest_id uuid references public.contests (id) on delete set null,
  dataset_slug text not null,
  dataset_version text,
  row_counts jsonb not null default '{}'::jsonb,
  status text not null check (status in ('running', 'success', 'failed')),
  error_log jsonb,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.contest_stage_scoring_rules to authenticated;
grant select, insert, update, delete on public.contest_stage_scoring_rules to service_role;
grant select, insert, update, delete on public.worldcup_import_runs to authenticated;
grant select, insert, update, delete on public.worldcup_import_runs to service_role;
