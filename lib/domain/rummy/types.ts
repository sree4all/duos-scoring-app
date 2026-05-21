export type RummyDropType = "none" | "first" | "middle" | "full_count";

export type PointsRummyPresetKey = "points_rummy_standard";

export type PointsRummyPresetParams = {
  maxPointsPerHand: number;
  firstDropPenalty: number;
  middleDropPenalty: number;
  fullCountPenalty: number;
  /** Lower cumulative total wins when true (typical points rummy). */
  lowerTotalWins: boolean;
};

export const STANDARD_POINTS_RUMMY_PRESET: PointsRummyPresetParams = {
  maxPointsPerHand: 80,
  firstDropPenalty: 20,
  middleDropPenalty: 40,
  fullCountPenalty: 80,
  lowerTotalWins: true,
};

/** @deprecated Use STANDARD_POINTS_RUMMY_PRESET */
export const DEFAULT_POINTS_RUMMY_PRESET = STANDARD_POINTS_RUMMY_PRESET;

export type RummyHandPlayerInput = {
  participantId: string;
  dropType?: RummyDropType;
  unmeldedPoints?: number;
};
