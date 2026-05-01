/**
 * Query optimization notes for leaderboard/history p95 targets:
 * - Prefer single round-trip aggregates keyed by contest and participant.
 * - Index foreign keys on ledger (contest_id, participant_id, created_at).
 * - Materialize leaderboard snapshots post-scoring when contests exceed scale thresholds.
 */
export const LEADERBOARD_INDEX_HINTS = [
  "CREATE INDEX IF NOT EXISTS idx_ledger_contest_participant ON points_ledger (contest_id, participant_id);",
  "CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON points_ledger (created_at);",
] as const;
