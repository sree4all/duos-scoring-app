export type StageKey =
  | "group_stage"
  | "round_of_32"
  | "round_of_16"
  | "quarter_finals"
  | "semi_finals"
  | "third_place"
  | "final";

export type StageScoringRule = {
  stageKey: StageKey;
  stageName: string;
  stageOrder: number;
  correctPoints: number;
  incorrectPenalty: number;
  revealedAt: string | null;
};

export type WorldCupImportSummary = {
  matchesCreated: number;
  matchesUpdated: number;
  eventsLinked: number;
  teamsResolved: number;
  errors: string[];
};
