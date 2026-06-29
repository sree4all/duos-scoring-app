/**
 * Run: npx tsx tests/unit/world-cup-stage-key.spec.ts
 */
import assert from "node:assert/strict";
import {
  normalizeStageKey,
  parseStagesCsvContent,
} from "@/lib/server/world-cup/csv-parsers";

assert.equal(normalizeStageKey("Quarterfinals"), "quarter_finals");
assert.equal(normalizeStageKey("Semifinals"), "semi_finals");
assert.equal(normalizeStageKey("Quarter-Finals"), "quarter_finals");
assert.equal(normalizeStageKey("Semi-Finals"), "semi_finals");

const kaggleStages = `id,stage_name,stage_order
1,Group Stage,1
2,Round of 32,2
3,Round of 16,3
4,Quarterfinals,4
5,Semifinals,5
6,Third Place Playoff,6
7,Final,7`;

const stages = parseStagesCsvContent(kaggleStages);
assert.equal(stages.find((s) => s.id === "4")?.stageKey, "quarter_finals");
assert.equal(stages.find((s) => s.id === "5")?.stageKey, "semi_finals");

console.log("world-cup-stage-key: OK");
