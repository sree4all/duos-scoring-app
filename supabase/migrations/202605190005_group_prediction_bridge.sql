-- Bridge group-scoped prediction contests to legacy match/tournament scoring

begin;

alter table public.contests
  add column if not exists format_label text,
  add column if not exists legacy_tournament_scope_id uuid;

comment on column public.contests.format_label is 'UI label: prediction | rummy_points';
comment on column public.contests.legacy_tournament_scope_id is
  'Optional scope id for group-scoped tournament_config during legacy bridge';

alter table public.events
  add column if not exists source_match_id uuid references public.matches (id) on delete set null;

create index if not exists events_source_match_id_idx on public.events (source_match_id);

-- Per-group tournament config (mirrors global tournament_config for parity)
create table if not exists public.group_tournament_config (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  season_year integer not null,
  answer_lock_utc timestamptz,
  season_bonuses_visible_after_utc timestamptz,
  season_bonuses_revealed_by_admin boolean not null default false,
  mega_bonus_all_answers_visible boolean not null default false,
  maintenance_mode boolean not null default false,
  maintenance_banner_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, season_year)
);

grant select, insert, update, delete on public.group_tournament_config to authenticated;

insert into public.game_types (key, name, mode)
values
  ('prediction_league', 'Prediction league', 'prediction'),
  ('points_rummy_standard', 'Points rummy', 'score_entry')
on conflict (key) do nothing;

commit;
