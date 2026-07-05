/**
 * Run: npx tsx tests/unit/bracket-propagation.spec.ts
 */
import assert from "node:assert/strict";
import {
  bonusAnswerReferencesTeam,
  pickMatchesFixture,
  shouldClearBonusAnswer,
  teamsRemovedFromFixture,
} from "@/lib/domain/world-cup/bracket-propagation";
import {
  MIN_PROPAGATION_MATCH_NUMBER,
  buildWinnerToSlotMap,
  winnerSlotTargetsForSource,
} from "@/lib/domain/world-cup/knockout-bracket";

const slotMap = buildWinnerToSlotMap();

assert.equal(MIN_PROPAGATION_MATCH_NUMBER, 89);

const r16ToQf = winnerSlotTargetsForSource(89);
assert.ok(r16ToQf.some((t) => t.targetMatchNumber === 97 && t.slot === "home"));

const r32Feeder = winnerSlotTargetsForSource(73);
assert.equal(r32Feeder.length, 0);

assert.ok(slotMap.every((e) => e.sourceMatchNumber >= 89));

assert.equal(pickMatchesFixture("Mexico", "England", "Mexico"), true);
assert.equal(pickMatchesFixture("Mexico", "England", "Brazil"), false);

const removed = teamsRemovedFromFixture("Mexico", "TBD", "Mexico", "England");
assert.deepEqual(removed, ["TBD"]);

assert.equal(bonusAnswerReferencesTeam("Yes — Mexico", ["Mexico"]), true);
assert.equal(bonusAnswerReferencesTeam("2–3 goals", ["Mexico"]), false);
assert.equal(shouldClearBonusAnswer("Yes — Mexico", ["Mexico"]), true);
assert.equal(shouldClearBonusAnswer("2–3 goals", ["Mexico"]), false);

console.log("bracket-propagation.spec.ts: ok");
