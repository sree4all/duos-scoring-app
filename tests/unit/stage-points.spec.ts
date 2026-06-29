/**
 * Run: npx tsx tests/unit/stage-points.spec.ts
 */
import assert from "node:assert/strict";
import {
  resolveIncorrectPenalty,
  resolveStagePointsFromDb,
} from "@/lib/scoring/stage-points";

assert.equal(resolveIncorrectPenalty("group_stage", 0), 0);
assert.equal(resolveIncorrectPenalty("group_stage", -1), -1);

// DB row exists with correct=3, wrong=0 (schema default) — must still penalize R32 wrong picks.
assert.equal(resolveIncorrectPenalty("round_of_32", 0), -1);
assert.equal(resolveIncorrectPenalty("round_of_32", null), -1);
assert.equal(resolveIncorrectPenalty("round_of_32", 1), -1);
assert.equal(resolveIncorrectPenalty("round_of_32", -1), -1);

const r32FromDb = resolveStagePointsFromDb("round_of_32", 3, 0, 2);
assert.equal(r32FromDb.correct, 3);
assert.equal(r32FromDb.incorrect, -1);

const groupFromDb = resolveStagePointsFromDb("group_stage", 2, 0, 2);
assert.equal(groupFromDb.correct, 2);
assert.equal(groupFromDb.incorrect, 0);

console.log("stage-points: OK");
