/**
 * Run: npx tsx tests/unit/knockout-bracket-build.spec.ts
 */
import assert from "node:assert/strict";
import {
  buildEffectiveKnockoutBracket,
  buildEffectiveKnockoutFixtures,
  type KnockoutMatchState,
} from "@/lib/domain/world-cup/knockout-bracket-build";
import {
  hiddenSemiFinalistTeams,
  semiFinalistPicksConflict,
  visibleSemiFinalistTeams,
} from "@/lib/domain/world-cup/knockout-bracket";

/** Live bracket snapshot (Jul 2026) — R32 results + known R16 pairings. */
const liveRows: KnockoutMatchState[] = [
  { matchNumber: 73, homeTeam: "South Africa", awayTeam: "Canada", winner: "South Africa", status: "completed" },
  { matchNumber: 75, homeTeam: "Netherlands", awayTeam: "Morocco", winner: "Morocco", status: "completed" },
  { matchNumber: 77, homeTeam: "France", awayTeam: "Sweden", winner: "France", status: "completed" },
  { matchNumber: 74, homeTeam: "Germany", awayTeam: "Paraguay", winner: "Germany", status: "completed" },
  { matchNumber: 90, homeTeam: "Germany", awayTeam: "France", winner: null, status: "scheduled" },
  { matchNumber: 89, homeTeam: "South Africa", awayTeam: "Morocco", winner: null, status: "scheduled" },
  { matchNumber: 83, homeTeam: "Portugal", awayTeam: "Croatia", winner: "Portugal", status: "completed" },
  { matchNumber: 84, homeTeam: "Spain", awayTeam: "Austria", winner: "Spain", status: "completed" },
  { matchNumber: 93, homeTeam: "Portugal", awayTeam: "Spain", winner: null, status: "scheduled" },
  { matchNumber: 81, homeTeam: "USA", awayTeam: "Bosnia and Herzegovina", winner: "USA", status: "completed" },
  { matchNumber: 82, homeTeam: "Belgium", awayTeam: "Senegal", winner: "Belgium", status: "completed" },
  { matchNumber: 94, homeTeam: "USA", awayTeam: "Belgium", winner: null, status: "scheduled" },
  { matchNumber: 78, homeTeam: "Ivory Coast", awayTeam: "Norway", winner: "Norway", status: "completed" },
  { matchNumber: 76, homeTeam: "Brazil", awayTeam: "Japan", winner: "Brazil", status: "completed" },
];

const bracket = buildEffectiveKnockoutBracket(liveRows);
const fixtures = buildEffectiveKnockoutFixtures(liveRows);

const m93 = fixtures.find((f) => f.matchNumber === 93);
assert.ok(m93, "M93 Portugal vs Spain should be in effective bracket");
assert.equal(m93.homeTeam, "Portugal");
assert.equal(m93.awayTeam, "Spain");

const m90 = fixtures.find((f) => f.matchNumber === 90);
assert.ok(m90, "M90 Germany vs France from R32 propagation");
assert.equal(m90.homeTeam, "Germany");
assert.equal(m90.awayTeam, "France");

const m89 = fixtures.find((f) => f.matchNumber === 89);
assert.ok(m89, "M89 South Africa vs Morocco from R32 propagation");

const allTeams = [
  "France",
  "Morocco",
  "Portugal",
  "Spain",
  "USA",
  "Belgium",
  "Brazil",
  "Norway",
  "Canada",
  "Germany",
];

assert.ok(semiFinalistPicksConflict(bracket, "Portugal", "Spain"), "R16 opponents");
assert.ok(!semiFinalistPicksConflict(bracket, "France", "Portugal"), "different QF paths");
assert.ok(semiFinalistPicksConflict(bracket, "France", "Morocco"), "QF97 opponents");
assert.ok(semiFinalistPicksConflict(bracket, "Portugal", "USA"), "QF98 opponents");

const hiddenForFrance = hiddenSemiFinalistTeams(bracket, ["France"]);
assert.ok(hiddenForFrance.has("Morocco"), "France and Morocco meet in QF97");
assert.ok(!hiddenForFrance.has("Portugal"), "France and Portugal can both reach semis");

const visibleForPortugal = visibleSemiFinalistTeams(bracket, allTeams, ["Portugal"]);
assert.ok(visibleForPortugal.includes("Portugal"));
assert.ok(visibleForPortugal.includes("France"));
assert.ok(!visibleForPortugal.includes("Spain"));

console.log("knockout-bracket-build: OK");
