export const DEFAULT_TIE_BREAK_POLICY = {
  primary: "exactHitCount",
  secondary: "earliestSubmissionTimestamp",
} as const;

export const EVENT_STATES = [
  "draft",
  "scheduled_open",
  "locked",
  "scored",
  "finalized",
  "archived",
] as const;

export const CONTEST_STATES = [
  "draft",
  "published",
  "completed",
  "archived",
] as const;

export const ADMIN_ONLY_ACTIONS = [
  "publishContest",
  "overrideLock",
  "runScoring",
  "runRecompute",
  "applyPenalty",
  "resolveDispute",
] as const;
