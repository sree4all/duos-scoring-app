/**
 * Run: npx tsx tests/unit/fixture-gating-and-loser-propagation.spec.ts
 */
import assert from "node:assert/strict";
import { isFixtureKnown } from "@/lib/server/world-cup/schedule-query";
import {
  THIRD_PLACE_MATCH_NUMBER,
  loserSlotTargetsForSource,
  winnerSlotTargetsForSource,
} from "@/lib/domain/world-cup/knockout-bracket";

// Fixture gating: members only see matches with two real teams.
assert.equal(isFixtureKnown("France", "Spain"), true);
assert.equal(isFixtureKnown("England", "TBD"), false);
assert.equal(isFixtureKnown("TBD", "TBD"), false);
assert.equal(isFixtureKnown("Winner Match 101", "England"), false);
assert.equal(isFixtureKnown("", "Spain"), false);
assert.equal(isFixtureKnown(null, null), false);

// Semi-final losers feed the third-place playoff.
const sf1Losers = loserSlotTargetsForSource(101);
assert.equal(sf1Losers.length, 1);
assert.equal(sf1Losers[0]!.targetMatchNumber, THIRD_PLACE_MATCH_NUMBER);
assert.equal(sf1Losers[0]!.slot, "home");

const sf2Losers = loserSlotTargetsForSource(102);
assert.equal(sf2Losers.length, 1);
assert.equal(sf2Losers[0]!.targetMatchNumber, THIRD_PLACE_MATCH_NUMBER);
assert.equal(sf2Losers[0]!.slot, "away");

// Only semi-finals feed the third-place match; winner feeders are untouched.
assert.equal(loserSlotTargetsForSource(100).length, 0);
assert.equal(loserSlotTargetsForSource(104).length, 0);
assert.ok(winnerSlotTargetsForSource(101).some((t) => t.targetMatchNumber === 104));
assert.ok(winnerSlotTargetsForSource(102).some((t) => t.targetMatchNumber === 104));

console.log("fixture-gating-and-loser-propagation.spec.ts: ok");
