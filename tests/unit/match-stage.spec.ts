/**
 * Run: npx tsx tests/unit/match-stage.spec.ts
 */
import assert from "node:assert/strict";
import {
  parseMatchNumberFromExternalKey,
  resolveMatchScoringStageKey,
  resolveScoringStageKey,
  stageKeyFromMatchNumber,
} from "@/lib/domain/world-cup/match-stage";

assert.equal(stageKeyFromMatchNumber(72), "group_stage");
assert.equal(stageKeyFromMatchNumber(73), "round_of_32");
assert.equal(stageKeyFromMatchNumber(88), "round_of_32");
assert.equal(stageKeyFromMatchNumber(97), "quarter_finals");
assert.equal(stageKeyFromMatchNumber(104), "final");

assert.equal(parseMatchNumberFromExternalKey("wc2026:m73"), 73);
assert.equal(parseMatchNumberFromExternalKey("88"), 88);
assert.equal(parseMatchNumberFromExternalKey("match:m88"), 88);

assert.equal(resolveScoringStageKey("group_stage", 73), "round_of_32");
assert.equal(resolveMatchScoringStageKey("group_stage", "group_stage", 73), "round_of_32");
assert.equal(resolveMatchScoringStageKey("group_stage", null, 80), "round_of_32");
assert.equal(resolveScoringStageKey(null, 80), "round_of_32");
assert.equal(resolveScoringStageKey("round_of_32", 80), "round_of_32");
assert.equal(resolveScoringStageKey("group_stage", 44), "group_stage");
assert.equal(resolveScoringStageKey("quarter_finals", 97), "quarter_finals");

console.log("match-stage: OK");
