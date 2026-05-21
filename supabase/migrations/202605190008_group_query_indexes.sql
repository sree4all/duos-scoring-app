-- Performance indexes for group-scoped leaderboard and history queries

begin;

create index if not exists idx_contest_ledger_contest_participant
  on public.contest_points_ledger (contest_id, participant_id);

create index if not exists idx_contest_ledger_contest_created
  on public.contest_points_ledger (contest_id, created_at);

create index if not exists events_contest_id_idx
  on public.events (contest_id);

commit;
