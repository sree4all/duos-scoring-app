import assert from "node:assert/strict";
import {
  computeStandingPlaces,
  standingPlaceEmoji,
} from "@/lib/utils/standing-place";

assert.deepEqual(computeStandingPlaces([30, 20, 20, 10]), [1, 2, 2, 4]);
assert.deepEqual(computeStandingPlaces([10, 10, 10]), [1, 1, 1]);
assert.deepEqual(standingPlaceEmoji(1), "🥇");
assert.deepEqual(standingPlaceEmoji(2), "🥈");
assert.equal(computeStandingPlaces([]).length, 0);

console.log("standing-place.spec.ts: ok");
