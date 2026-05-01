export type PenaltyKind = "fixed" | "proportional";

export function applyFixedPenalty(points: number, delta: number) {
  return points - Math.abs(delta);
}

export function applyProportionalPenalty(points: number, ratio: number) {
  if (ratio < 0 || ratio > 1) {
    throw new Error("Proportional penalty ratio must be between 0 and 1");
  }
  return Math.round(points * (1 - ratio));
}
