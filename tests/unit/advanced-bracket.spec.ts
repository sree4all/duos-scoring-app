/**
 * Run: npx tsx tests/unit/advanced-bracket.spec.ts
 */
import assert from "node:assert/strict";
import {
  ADVANCED_BRACKET_POINTS,
  ADVANCED_BRACKET_LOCK_MATCH_NUMBER,
  countCorrectPicks,
  reconcileCascadingPicks,
  validateAdvancedBracketPicks,
} from "@/lib/domain/world-cup/advanced-bracket";
import { ADVANCED_BRACKET_LOCK_FALLBACK_UTC } from "@/lib/server/world-cup/advanced-bracket-lock";

const teams = [
  "Argentina",
  "Belgium",
  "Brazil",
  "Canada",
  "England",
  "France",
  "Germany",
  "Japan",
  "Mexico",
  "Morocco",
  "Netherlands",
  "Norway",
  "Portugal",
  "Spain",
  "Sweden",
  "United States",
  "Australia",
  "Colombia",
  "Croatia",
  "Ecuador",
  "Egypt",
  "Ghana",
  "Ivory Coast",
  "Paraguay",
  "Senegal",
  "South Africa",
  "Switzerland",
  "Algeria",
  "Austria",
  "Bosnia and Herzegovina",
  "Cape Verde",
  "DR Congo",
];

const validPicks = {
  semiFinalistTeams: teams.slice(0, 4),
  finalistTeams: teams.slice(0, 2),
  winnerTeam: teams[0],
};

assert.equal(validateAdvancedBracketPicks(validPicks, teams), null);

const finalistNotInSemi = {
  semiFinalistTeams: teams.slice(0, 4),
  finalistTeams: [teams[0], teams[10]],
  winnerTeam: teams[0],
};
assert.match(
  validateAdvancedBracketPicks(finalistNotInSemi, teams) ?? "",
  /semi-finalist picks/,
);

const winnerNotFinalist = {
  semiFinalistTeams: teams.slice(0, 4),
  finalistTeams: teams.slice(0, 2),
  winnerTeam: teams[2],
};
assert.match(validateAdvancedBracketPicks(winnerNotFinalist, teams) ?? "", /finalist picks/);

const reconciled = reconcileCascadingPicks(
  teams.slice(0, 4),
  [teams[0], teams[4]],
  teams[4],
);
assert.deepEqual(reconciled.finalistTeams, [teams[0]]);
assert.equal(reconciled.winnerTeam, null);

const tooFewSemi = {
  ...validPicks,
  semiFinalistTeams: teams.slice(0, 3),
};
assert.match(validateAdvancedBracketPicks(tooFewSemi, teams) ?? "", /4 semi-finalists/);

assert.equal(countCorrectPicks(["France", "Spain", "Italy"], ["France", "Germany", "Spain"]), 2);
assert.equal(countCorrectPicks(["France"], ["France"]), 1);

const semiHits = countCorrectPicks(
  ["France", "Spain", "Brazil", "Japan"],
  ["France", "Spain", "Germany", "Portugal"],
);
assert.equal(semiHits * ADVANCED_BRACKET_POINTS.semiFinalist, 20);

assert.equal(ADVANCED_BRACKET_LOCK_MATCH_NUMBER, 88);
assert.equal(ADVANCED_BRACKET_LOCK_FALLBACK_UTC, "2026-07-03T18:00:00.000Z");

console.log("advanced-bracket: OK");
