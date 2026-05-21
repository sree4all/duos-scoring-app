alter table public.events
  add column if not exists stage_key text;

create index if not exists events_contest_stage_idx
  on public.events (contest_id, stage_key);

comment on column public.events.stage_key is 'World Cup tournament phase for reveal filtering';
