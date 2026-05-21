-- IPL portal bonus/tournament tables + season points ledger (greenfield base).
-- Required before 0009_scoring_config_and_admin_policies.sql on fresh databases.

begin;

-- Admin role for scoring policies in 0009+
alter table public.profiles
  add column if not exists role text not null default 'participant',
  add column if not exists alias_onboarding_completed boolean not null default false;

create table if not exists public.tournament_config (
  id uuid primary key default gen_random_uuid(),
  season_year integer not null unique,
  answer_lock_utc timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tournament_questions (
  id uuid primary key default gen_random_uuid(),
  season_year integer not null references public.tournament_config (season_year) on delete cascade,
  slot_no integer not null,
  question_text text not null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  correct_answer text,
  scored_at timestamptz,
  visible_after_utc timestamptz,
  revealed_by_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_year, slot_no)
);

create table if not exists public.tournament_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.tournament_questions (id) on delete cascade,
  label text not null,
  value text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tournament_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.tournament_questions (id) on delete cascade,
  answer_text text not null default '',
  answered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create table if not exists public.bonus_prompts (
  id uuid primary key default gen_random_uuid(),
  season_year integer not null,
  scope text not null check (scope in ('match', 'tournament')),
  match_id uuid references public.matches (id) on delete cascade,
  prompt_key text not null,
  prompt_text text not null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  correct_answer text,
  input_type text not null default 'text' check (input_type in ('text', 'single_choice')),
  visible_after_utc timestamptz,
  revealed_by_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bonus_prompts_match_id_idx on public.bonus_prompts (match_id);
create index if not exists bonus_prompts_season_scope_idx on public.bonus_prompts (season_year, scope);

create table if not exists public.bonus_prompt_options (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.bonus_prompts (id) on delete cascade,
  label text not null,
  value text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.prediction_bonus_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  match_id uuid references public.matches (id) on delete cascade,
  prompt_id uuid not null references public.bonus_prompts (id) on delete cascade,
  answer_text text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, prompt_id)
);

-- Season-wide points (match scoring, tournament questions, bonuses)
create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_type text not null,
  source_id text not null,
  points_delta numeric not null,
  reason text,
  awarded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists points_ledger_user_id_idx on public.points_ledger (user_id);
create index if not exists points_ledger_source_idx on public.points_ledger (source_type, source_id);

alter table public.points_ledger enable row level security;

-- Seed default season row for downstream migrations (0017, 0015, etc.)
insert into public.tournament_config (season_year, updated_at)
values (2026, now())
on conflict (season_year) do nothing;

commit;
