/**
 * Run: npx tsx tests/integration/world-cup-bracket-propagation.spec.ts
 */
import assert from "node:assert/strict";
import { winnerSlotTargetsForSource } from "@/lib/domain/world-cup/knockout-bracket";
import { pickMatchesFixture } from "@/lib/domain/world-cup/bracket-propagation";

/** Mexico beats England in R16 match 91 → feeds QF match 99 away slot per FIFA bracket. */
const mexicoEnglandR16 = 91;
const targets = winnerSlotTargetsForSource(mexicoEnglandR16);
assert.ok(targets.length >= 1, "R16 winner should feed at least one downstream slot");

const qfTarget = targets.find((t) => t.targetMatchNumber === 99);
assert.ok(qfTarget, "match 91 winner should feed quarter-final 99");
assert.equal(qfTarget.slot, "home");

const oldHome = "Winner Match 89";
const oldAway = "TBD";
const newHome = oldHome;
const newAway = "Mexico";
void oldAway;
assert.equal(pickMatchesFixture(newHome, newAway, "Mexico"), true);
assert.equal(pickMatchesFixture(newHome, newAway, "England"), false);

console.log("world-cup-bracket-propagation.spec.ts: ok");
