/**
 * Run: npx tsx tests/unit/knockout-bracket.spec.ts
 */
import assert from "node:assert/strict";
import {
  buildKnockoutBracket,
  hiddenSemiFinalistTeams,
  semiFinalistPicksConflict,
  teamsInKnockoutSubtree,
  validateSemiFinalistBracketPath,
  visibleSemiFinalistTeams,
} from "@/lib/domain/world-cup/knockout-bracket";

const bracket = buildKnockoutBracket([
  { matchNumber: 73, homeTeam: "South Africa", awayTeam: "Canada" },
  { matchNumber: 74, homeTeam: "Germany", awayTeam: "Paraguay" },
  { matchNumber: 75, homeTeam: "Netherlands", awayTeam: "Morocco" },
  { matchNumber: 76, homeTeam: "Brazil", awayTeam: "Japan" },
]);

const allTeams = [
  "South Africa",
  "Canada",
  "Germany",
  "Paraguay",
  "Netherlands",
  "Morocco",
  "Brazil",
  "Japan",
];

assert.deepEqual(teamsInKnockoutSubtree(bracket, 73), ["South Africa", "Canada"]);
assert.deepEqual(teamsInKnockoutSubtree(bracket, 89), [
  "South Africa",
  "Canada",
  "Netherlands",
  "Morocco",
]);

const hiddenForSa = hiddenSemiFinalistTeams(bracket, ["South Africa"]);
assert.ok(hiddenForSa.has("Canada"));
assert.ok(hiddenForSa.has("Netherlands"));
assert.ok(hiddenForSa.has("Morocco"));
assert.ok(hiddenForSa.has("Germany"));
assert.ok(hiddenForSa.has("Paraguay"));

const visibleForSa = visibleSemiFinalistTeams(bracket, allTeams, ["South Africa"]);
assert.ok(visibleForSa.includes("South Africa"));
assert.ok(!visibleForSa.includes("Canada"));
assert.ok(!visibleForSa.includes("Netherlands"));
assert.ok(visibleForSa.includes("Brazil"));

assert.ok(semiFinalistPicksConflict(bracket, "South Africa", "Canada"));
assert.ok(semiFinalistPicksConflict(bracket, "South Africa", "Netherlands"));
assert.ok(semiFinalistPicksConflict(bracket, "South Africa", "Germany"));
assert.ok(!semiFinalistPicksConflict(bracket, "South Africa", "Brazil"));

assert.match(
  validateSemiFinalistBracketPath(bracket, ["South Africa", "Canada"]) ?? "",
  /cannot both reach/,
);

console.log("knockout-bracket: OK");
