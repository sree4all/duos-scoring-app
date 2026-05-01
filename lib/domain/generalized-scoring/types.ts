export type GameMode = "prediction" | "score_entry" | "hybrid";

export type ContestState = "draft" | "published" | "completed" | "archived";

export type EventState =
  | "draft"
  | "scheduled_open"
  | "locked"
  | "scored"
  | "finalized"
  | "archived";

export type PenaltyType = "fixed" | "proportional" | "disqualification";

export interface TieBreakRule {
  exactHitCount: number;
  submittedAt: string;
}

export interface ProvisionalScoreState {
  isProvisional: boolean;
  unresolvedMetricCount: number;
}
