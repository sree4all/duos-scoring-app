/**
 * Run: npx tsx tests/unit/round-of-32-kickoffs.spec.ts
 */
import assert from "node:assert/strict";
import {
  ROUND_OF_32_KICKOFFS_ET,
  roundOf32KickoffUtc,
} from "@/lib/domain/world-cup/round-of-32-kickoffs";

assert.equal(ROUND_OF_32_KICKOFFS_ET.length, 16);
assert.equal(roundOf32KickoffUtc(73), "2026-06-28T19:00:00.000Z");
assert.equal(roundOf32KickoffUtc(76), "2026-06-29T17:00:00.000Z"); // Brazil vs Japan — 1 PM ET
assert.equal(roundOf32KickoffUtc(74), "2026-06-29T20:30:00.000Z");
assert.equal(roundOf32KickoffUtc(88), "2026-07-03T18:00:00.000Z"); // 2 PM ET
assert.equal(roundOf32KickoffUtc(87), "2026-07-04T01:30:00.000Z"); // 9:30 PM ET
assert.equal(roundOf32KickoffUtc(72), undefined);

console.log("round-of-32-kickoffs: OK");
