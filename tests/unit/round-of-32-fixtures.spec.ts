/**
 * Run: npx tsx tests/unit/round-of-32-fixtures.spec.ts
 */
import assert from "node:assert/strict";
import {
  ROUND_OF_32_FIXTURES,
  fixtureTeamsMatch,
  roundOf32KickoffUtc,
} from "@/lib/domain/world-cup/round-of-32-fixtures";

assert.equal(ROUND_OF_32_FIXTURES.length, 16);
assert.equal(ROUND_OF_32_FIXTURES.find((f) => f.matchNumber === 73)?.homeTeam, "South Africa");
assert.equal(ROUND_OF_32_FIXTURES.find((f) => f.matchNumber === 88)?.awayTeam, "Egypt");

// Brazil vs Japan — match 76, 1 PM ET Houston (FIFA/NBC)
const m76 = ROUND_OF_32_FIXTURES.find((f) => f.matchNumber === 76)!;
assert.equal(m76.homeTeam, "Brazil");
assert.equal(m76.awayTeam, "Japan");
assert.equal(roundOf32KickoffUtc(76), "2026-06-29T17:00:00.000Z");
assert.ok(fixtureTeamsMatch("Brazil", "Japan", m76));
assert.ok(!fixtureTeamsMatch("Japan", "Brazil", m76));

// Match 88 — Australia vs Egypt, 2 PM ET Dallas (R32; no longer tournament forecast lock)
const m88 = ROUND_OF_32_FIXTURES.find((f) => f.matchNumber === 88)!;
assert.equal(m88.homeTeam, "Australia");
assert.equal(m88.awayTeam, "Egypt");
assert.equal(roundOf32KickoffUtc(88), "2026-07-03T18:00:00.000Z");

// Aliases for import spelling drift
assert.ok(fixtureTeamsMatch("Côte d'Ivoire", "Norway", ROUND_OF_32_FIXTURES.find((f) => f.matchNumber === 78)!));
assert.ok(fixtureTeamsMatch("USA", "Bosnia and Herzegovina", ROUND_OF_32_FIXTURES.find((f) => f.matchNumber === 81)!));

// Kickoff UTC for every fixture
for (const f of ROUND_OF_32_FIXTURES) {
  assert.ok(roundOf32KickoffUtc(f.matchNumber), `missing UTC for match ${f.matchNumber}`);
}

console.log("round-of-32-fixtures: OK");
