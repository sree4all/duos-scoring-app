/**
 * Run: npx tsx tests/unit/prediction-visibility.spec.ts
 */
import assert from "node:assert/strict";
import {
  isBeforeKickoff,
  shouldHidePeerPredictions,
} from "@/lib/server/world-cup/prediction-visibility";

const futureKickoff = new Date(Date.now() + 60_000).toISOString();
const pastKickoff = new Date(Date.now() - 60_000).toISOString();

assert.equal(isBeforeKickoff(futureKickoff), true);
assert.equal(isBeforeKickoff(pastKickoff), false);

assert.equal(shouldHidePeerPredictions(false, futureKickoff), true);
assert.equal(shouldHidePeerPredictions(false, pastKickoff), false);
assert.equal(shouldHidePeerPredictions(true, futureKickoff), false);

console.log("prediction-visibility.spec.ts: ok");
