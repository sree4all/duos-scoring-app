/**
 * Run: npx tsx tests/unit/round-of-32-kickoffs.spec.ts
 */
import assert from "node:assert/strict";
import {
  ROUND_OF_32_KICKOFFS_ET,
  roundOf32KickoffUtc,
} from "@/lib/domain/world-cup/round-of-32-kickoffs";

assert.equal(ROUND_OF_32_KICKOFFS_ET.length, 16);
assert.equal(roundOf32KickoffUtc(73), "2026-06-28T23:00:00.000Z");
assert.equal(roundOf32KickoffUtc(74), "2026-06-30T00:30:00.000Z");
assert.equal(roundOf32KickoffUtc(88), "2026-07-03T22:00:00.000Z");
assert.equal(roundOf32KickoffUtc(72), undefined);

console.log("round-of-32-kickoffs: OK");
