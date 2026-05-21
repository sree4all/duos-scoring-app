export type MatchBonusOption = {
  id: string;
  label: string;
  value: string;
  sortOrder: number;
};

export type MatchBonusPrompt = {
  id: string;
  matchId: string;
  promptText: string;
  correctPoints: number;
  incorrectPenalty: number;
  correctAnswer: string | null;
  isActive: boolean;
  options: MatchBonusOption[];
};
