import assert from "node:assert/strict";
import { normalizeIncorrectPenalty } from "@/lib/domain/world-cup/match-bonus";
import {
  bonusPointsForAnswer,
  mergeScoringUserIds,
} from "@/lib/scoring/match-bonus-scoring";

assert.equal(normalizeIncorrectPenalty(0), 0);
assert.equal(normalizeIncorrectPenalty(2), -2);
assert.equal(normalizeIncorrectPenalty(-3), -3);

assert.equal(bonusPointsForAnswer("Yes", "yes", 2, 0), 2);
assert.equal(bonusPointsForAnswer("No", "Yes", 2, -1), -1);
assert.equal(bonusPointsForAnswer("", "Yes", 2, -1), null);
assert.equal(bonusPointsForAnswer("No", "", 2, -1), null);
assert.equal(bonusPointsForAnswer("No", "Yes", 2, 0), null);

assert.deepEqual(
  mergeScoringUserIds(["a", "b"], ["b", "c"]),
  ["a", "b", "c"],
);

console.log("match-bonus-scoring.spec.ts: ok");
