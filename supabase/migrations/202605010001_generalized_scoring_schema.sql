-- Generalized scoring schema scaffold
-- Phase 1 setup migration: additive-only placeholders for upcoming phases.

begin;

-- Core generalized entities
create table if not exists public.game_types (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  mode text not null check (mode in ('prediction', 'score_entry', 'hybrid')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contests (
  id uuid primary key default gen_random_uuid(),
  game_type_id uuid not null references public.game_types(id),
  name text not null,
  state text not null default 'draft' check (state in ('draft', 'published', 'completed', 'archived')),
  visibility text not null default 'public' check (visibility in ('public', 'private', 'invite_only')),
  default_lock_policy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id),
  title text not null,
  state text not null default 'draft' check (state in ('draft', 'scheduled_open', 'locked', 'scored', 'finalized', 'archived')),
  open_at timestamptz null,
  lock_at timestamptz null,
  voided boolean not null default false,
  void_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Contest-scoped ledger (separate from season points_ledger used by match/tournament scoring)
create table if not exists public.contest_points_ledger (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id),
  event_id uuid null references public.events(id),
  participant_id uuid not null,
  action_type text not null,
  points_delta numeric not null,
  reason_text text null,
  correlation_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists contest_points_ledger_contest_id_idx
  on public.contest_points_ledger (contest_id);

commit;
