-- Private groups tenancy (005-prediction-rummy-groups)

begin;

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  slug text unique,
  status text not null default 'active' check (status in ('active', 'archived')),
  current_invite_code text not null unique,
  invite_code_rotated_at timestamptz,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  is_owner boolean not null default false,
  is_scorer boolean not null default false,
  joined_at timestamptz not null default now(),
  removed_at timestamptz
);

create unique index if not exists group_memberships_active_unique_idx
  on public.group_memberships (group_id, user_id)
  where removed_at is null;

create index if not exists group_memberships_user_idx
  on public.group_memberships (user_id)
  where removed_at is null;

create table if not exists public.group_invite_code_history (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  invite_code text not null,
  revoked_at timestamptz not null default now()
);

create index if not exists groups_current_invite_code_idx
  on public.groups (current_invite_code);

grant select, insert, update, delete on public.groups to authenticated, service_role;
grant select, insert, update, delete on public.group_memberships to authenticated, service_role;
grant select, insert on public.group_invite_code_history to authenticated, service_role;

commit;
