export type MatchBonusOption = {
  id: string;
  label: string;
  value: string;
  sortOrder: number;
};

export type MatchBonusPrompt = {
  id: string;
  matchId: string;
  /** Stable key used for placeholder re-renders (e.g. wc2026:final:potm-team). */
  promptKey: string;
  promptText: string;
  correctPoints: number;
  incorrectPenalty: number;
  correctAnswer: string | null;
  isActive: boolean;
  options: MatchBonusOption[];
};

/** Wrong-answer penalties are stored as zero or a negative delta. */
export function normalizeIncorrectPenalty(value: number): number {
  if (!Number.isFinite(value) || value === 0) return 0;
  return value > 0 ? -value : value;
}
