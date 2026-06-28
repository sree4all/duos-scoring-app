/**
 * Run: npx tsx tests/unit/match-scoring-stage.spec.ts
 */
import assert from "node:assert/strict";
import { normAnswer } from "@/lib/scoring/normalize";

/** Mirrors winner pick branch in applyMatchScoring. */
function winnerPickDelta(
  predictedWinner: string | undefined,
  actualWinner: string | null,
  winnerPts: number,
  missPts: number,
): number | null {
  if (!predictedWinner || !actualWinner) return null;
  const correct = normAnswer(predictedWinner) === normAnswer(actualWinner);
  if (correct && winnerPts !== 0) return winnerPts;
  if (!correct && missPts !== 0) return missPts;
  return null;
}

assert.equal(winnerPickDelta("Brazil", "Brazil", 3, -1), 3);
assert.equal(winnerPickDelta("Japan", "Brazil", 3, -1), -1);
assert.equal(winnerPickDelta("Japan", "Brazil", 3, 0), null);
assert.equal(winnerPickDelta("Japan", "Brazil", 0, 0), null);

console.log("match-scoring-stage: OK");
