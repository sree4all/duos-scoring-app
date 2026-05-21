-- World Cup fixture metadata on matches (additive)

alter table public.matches
  add column if not exists match_number integer,
  add column if not exists season_year integer not null default 2026,
  add column if not exists stage_key text,
  add column if not exists venue_label text,
  add column if not exists home_team_display text,
  add column if not exists away_team_display text,
  add column if not exists external_team_home_id text,
  add column if not exists external_team_away_id text,
  add column if not exists dataset_version text;

create index if not exists matches_season_stage_idx on public.matches (season_year, stage_key);
create unique index if not exists matches_season_match_number_idx
  on public.matches (season_year, match_number)
  where match_number is not null;

comment on column public.matches.stage_key is 'World Cup phase key for stage scoring rules';
