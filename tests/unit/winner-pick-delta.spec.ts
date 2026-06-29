/**
 * Run: npx tsx tests/unit/winner-pick-delta.spec.ts
 */
import assert from "node:assert/strict";
import { winnerPickDelta } from "@/lib/scoring/winner-pick-delta";

assert.equal(winnerPickDelta("Canada", "Canada", 3, -1), 3);
assert.equal(winnerPickDelta("South Africa", "Canada", 3, -1), -1);
assert.equal(winnerPickDelta("South Africa", "Canada", 3, 0), 0);
assert.equal(winnerPickDelta(null, "Canada", 3, -1), 0);
assert.equal(winnerPickDelta("Canada", null, 3, -1), 0);

console.log("winner-pick-delta: OK");
