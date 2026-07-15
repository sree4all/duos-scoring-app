/**
 * Run: npx tsx tests/unit/advanced-bracket.spec.ts
 */
import assert from "node:assert/strict";
import {
  ADVANCED_BRACKET_LOCK_FALLBACK_UTC,
  ADVANCED_BRACKET_POINTS,
  ROUND_OF_16_MATCH_NUMBER_MIN,
  countCorrectPicks,
  evaluateForecastStatsRow,
  reconcileCascadingPicks,
  validateAdvancedBracketPicks,
} from "@/lib/domain/world-cup/advanced-bracket";
import { computeBracketState } from "@/lib/domain/world-cup/forecast-eligibility";
import { ADVANCED_BRACKET_LOCK_FALLBACK_UTC as LOCK_FALLBACK } from "@/lib/server/world-cup/advanced-bracket-lock";

const bracketState = computeBracketState([]);

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

assert.equal(validateAdvancedBracketPicks(validPicks, teams, bracketState), null);

const finalistNotInSemi = {
  semiFinalistTeams: teams.slice(0, 4),
  finalistTeams: [teams[0], teams[10]],
  winnerTeam: teams[0],
};
assert.match(
  validateAdvancedBracketPicks(finalistNotInSemi, teams, bracketState) ?? "",
  /finalist/,
);

const winnerNotFinalist = {
  semiFinalistTeams: teams.slice(0, 4),
  finalistTeams: teams.slice(0, 2),
  winnerTeam: teams[2],
};
assert.match(validateAdvancedBracketPicks(winnerNotFinalist, teams, bracketState) ?? "", /finalist/);

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
assert.match(validateAdvancedBracketPicks(tooFewSemi, teams, bracketState) ?? "", /4 semi-finalists/);

assert.equal(countCorrectPicks(["France", "Spain", "Italy"], ["France", "Germany", "Spain"]), 2);
assert.equal(countCorrectPicks(["France"], ["France"]), 1);

const semiHits = countCorrectPicks(
  ["France", "Spain", "Brazil", "Japan"],
  ["France", "Spain", "Germany", "Portugal"],
);
assert.equal(semiHits * ADVANCED_BRACKET_POINTS.semiFinalist, 20);

const statsEval = evaluateForecastStatsRow(
  {
    semiFinalistTeams: ["Argentina", "England", "Brazil", "Spain"],
    finalistTeams: ["Argentina", "Brazil"],
    winnerTeam: "Argentina",
  },
  {
    semiFinalistTeams: ["Argentina", "England", "France", "Spain"],
    finalistTeams: ["Argentina", "Spain"],
    winnerTeam: null,
  },
);
assert.equal(statsEval.semiFinalistResults.filter((r) => r.correct).length, 3);
assert.equal(statsEval.semiFinalistResults.find((r) => r.team === "Brazil")?.correct, false);
assert.equal(statsEval.finalistResults.find((r) => r.team === "Argentina")?.correct, true);
assert.equal(statsEval.finalistResults.find((r) => r.team === "Brazil")?.correct, false);
assert.equal(statsEval.winnerResult?.correct, null);
assert.equal(
  statsEval.points,
  3 * ADVANCED_BRACKET_POINTS.semiFinalist + 1 * ADVANCED_BRACKET_POINTS.finalist,
);

const pendingEval = evaluateForecastStatsRow(validPicks, {
  semiFinalistTeams: [],
  finalistTeams: [],
  winnerTeam: null,
});
assert.ok(pendingEval.semiFinalistResults.every((r) => r.correct === null));
assert.equal(pendingEval.points, 0);

assert.equal(ROUND_OF_16_MATCH_NUMBER_MIN, 89);
assert.equal(ADVANCED_BRACKET_LOCK_FALLBACK_UTC, "2026-07-06T19:00:00.000Z");
assert.equal(LOCK_FALLBACK, ADVANCED_BRACKET_LOCK_FALLBACK_UTC);

console.log("advanced-bracket: OK");
