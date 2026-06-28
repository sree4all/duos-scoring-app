/**
 * Run: npx tsx tests/unit/advanced-bracket.spec.ts
 */
import assert from "node:assert/strict";
import {
  ADVANCED_BRACKET_POINTS,
  countCorrectPicks,
  validateAdvancedBracketPicks,
} from "@/lib/domain/world-cup/advanced-bracket";

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

console.log("advanced-bracket: OK");
