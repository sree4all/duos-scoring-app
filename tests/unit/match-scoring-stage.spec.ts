/**
 * Run: npx tsx tests/unit/match-scoring-stage.spec.ts
 */
import assert from "node:assert/strict";
import { resolveMatchScoringStageKey } from "@/lib/domain/world-cup/match-stage";
import { resolveStagePointsFromDb } from "@/lib/scoring/stage-points";
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

const r32Stage = resolveMatchScoringStageKey("group_stage", "group_stage", 75);
assert.equal(r32Stage, "round_of_32");
assert.equal(winnerPickDelta("Japan", "Brazil", 3, -1), -1);

// Match 73 (South Africa vs Canada): wrong SA pick when Canada wins uses R32 defaults.
const m73Stage = resolveMatchScoringStageKey("group_stage", "group_stage", 73);
assert.equal(m73Stage, "round_of_32");
const m73Pts = resolveStagePointsFromDb("round_of_32", 3, 0, 2);
assert.equal(m73Pts.correct, 3);
assert.equal(m73Pts.incorrect, -1);
assert.equal(winnerPickDelta("South Africa", "Canada", m73Pts.correct, m73Pts.incorrect), -1);
assert.equal(winnerPickDelta("Canada", "Canada", m73Pts.correct, m73Pts.incorrect), 3);

console.log("match-scoring-stage: OK");
