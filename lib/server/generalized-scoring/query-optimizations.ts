/**
 * Query optimization notes for leaderboard/history p95 targets:
 * - Prefer single round-trip aggregates keyed by contest and participant.
 * - Index foreign keys on ledger (contest_id, participant_id, created_at).
 * - Filter contests by group_id before joining ledger (tenant isolation).
 * - Materialize leaderboard snapshots post-scoring when contests exceed scale thresholds.
 */
export const LEADERBOARD_INDEX_HINTS = [
  "CREATE INDEX IF NOT EXISTS idx_contest_ledger_contest_participant ON contest_points_ledger (contest_id, participant_id);",
  "CREATE INDEX IF NOT EXISTS idx_contest_ledger_created_at ON contest_points_ledger (created_at);",
  "CREATE INDEX IF NOT EXISTS idx_contest_ledger_contest_created ON contest_points_ledger (contest_id, created_at);",
] as const;

export const GROUP_SCOPING_INDEX_HINTS = [
  "CREATE INDEX IF NOT EXISTS contests_group_id_idx ON contests (group_id);",
  "CREATE INDEX IF NOT EXISTS rummy_hands_contest_id_idx ON rummy_hands (contest_id);",
  "CREATE INDEX IF NOT EXISTS events_contest_id_idx ON events (contest_id);",
] as const;

/** Recommended select shape: always scope by contest_id (never aggregate across contests). */
export const LEADERBOARD_QUERY_PATTERN = {
  table: "contest_points_ledger",
  filter: "contest_id = $1",
  groupBy: ["participant_id"],
} as const;
