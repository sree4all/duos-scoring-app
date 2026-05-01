export interface ScoreProjectionInput {
  basePoints: number;
  adjustment: number;
}

export function projectScore(input: ScoreProjectionInput) {
  return input.basePoints + input.adjustment;
}
