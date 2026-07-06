/**
 * Run: npx tsx tests/unit/forecast-eligibility.spec.ts
 */
import assert from "node:assert/strict";
import {
  buildForecastEligibility,
  computeBracketState,
  sfGroupForTeam,
  validateForecastAnswers,
  visibleFinalistTeams,
  visibleSemiFinalistTeams,
} from "@/lib/domain/world-cup/forecast-eligibility";
import { SF_EXCLUSION_GROUPS } from "@/lib/fifa/bracket-map";

assert.equal(SF_EXCLUSION_GROUPS.length, 4);
assert.equal(SF_EXCLUSION_GROUPS.find((g) => g.group_id === "W99")?.feeder_r32_match_numbers.includes(80), true);
assert.equal(SF_EXCLUSION_GROUPS.find((g) => g.group_id === "W100")?.feeder_r32_match_numbers.includes(86), true);

const state = computeBracketState([]);
assert.ok(state.aliveTeams.has("Argentina"));
assert.ok(state.aliveTeams.has("England"));
assert.equal(sfGroupForTeam("England", state.aliveTeams), "W99");
assert.equal(sfGroupForTeam("Argentina", state.aliveTeams), "W100");

const eligibility = buildForecastEligibility(state);

const semiWithBrazil = visibleSemiFinalistTeams(eligibility, ["Brazil"]);
assert.ok(semiWithBrazil.includes("Brazil"));
assert.ok(!semiWithBrazil.includes("England"));
assert.ok(!semiWithBrazil.includes("Japan"));
assert.ok(semiWithBrazil.includes("Argentina"));

const semiPool = visibleSemiFinalistTeams(eligibility, [
  "Brazil",
  "France",
  "Portugal",
  "Argentina",
]);
const finalPool = visibleFinalistTeams(eligibility, semiPool, ["Argentina"]);
assert.ok(finalPool.includes("Argentina"));
assert.ok(!finalPool.includes("England"), "England shares right half with Argentina");

assert.equal(
  validateForecastAnswers(
    {
      semiFinalistTeams: ["Brazil", "France", "Portugal", "Argentina"],
      finalistTeams: ["Argentina", "England"],
      winnerTeam: "Argentina",
    },
    state,
  ),
  "INVALID_FINALISTS",
);

assert.equal(
  validateForecastAnswers(
    {
      semiFinalistTeams: ["Brazil", "France", "Portugal", "Argentina"],
      finalistTeams: ["France", "Argentina"],
      winnerTeam: "Argentina",
    },
    state,
  ),
  null,
);

console.log("forecast-eligibility: OK");
