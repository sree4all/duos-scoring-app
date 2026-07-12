/**
 * Run: npx tsx tests/unit/advanced-bracket-phase-readiness.spec.ts
 */
import assert from "node:assert/strict";
import { evaluatePhaseReadiness } from "@/lib/domain/world-cup/advanced-bracket";

function byPhase(
  items: ReturnType<typeof evaluatePhaseReadiness>,
  phase: "semi_finalists" | "finalists" | "winner",
) {
  const item = items.find((i) => i.phase === phase);
  assert.ok(item, `missing phase ${phase}`);
  return item;
}

// Quarter-finals not finished: only 3 semi-finalists known.
const beforeQf = evaluatePhaseReadiness({
  semiFinalistTeams: ["England", "France", "Spain"],
  semiFinalsCompleted: false,
  finalistTeams: [],
  finalCompleted: false,
  winnerTeam: null,
});
assert.equal(byPhase(beforeQf, "semi_finalists").ready, false);
assert.match(byPhase(beforeQf, "semi_finalists").blockedReason ?? "", /3 of 4/);
assert.equal(byPhase(beforeQf, "finalists").ready, false);
assert.equal(byPhase(beforeQf, "winner").ready, false);

// Quarter-finals done: semi-finalists scoreable BEFORE the semis are played.
const afterQf = evaluatePhaseReadiness({
  semiFinalistTeams: ["Argentina", "England", "France", "Spain"],
  semiFinalsCompleted: false,
  finalistTeams: [],
  finalCompleted: false,
  winnerTeam: null,
});
assert.equal(byPhase(afterQf, "semi_finalists").ready, true);
assert.deepEqual(byPhase(afterQf, "semi_finalists").officialPreview, [
  "Argentina",
  "England",
  "France",
  "Spain",
]);
assert.equal(byPhase(afterQf, "finalists").ready, false);

// Semis done: finalists scoreable BEFORE the Final is played.
const afterSemis = evaluatePhaseReadiness({
  semiFinalistTeams: ["Argentina", "England", "France", "Spain"],
  semiFinalsCompleted: true,
  finalistTeams: ["England", "France"],
  finalCompleted: false,
  winnerTeam: null,
});
assert.equal(byPhase(afterSemis, "finalists").ready, true);
assert.deepEqual(byPhase(afterSemis, "finalists").officialPreview, ["England", "France"]);
assert.equal(byPhase(afterSemis, "winner").ready, false);

// One semi completed, one pending: finalists not ready even with a partial winner list.
const midSemis = evaluatePhaseReadiness({
  semiFinalistTeams: ["Argentina", "England", "France", "Spain"],
  semiFinalsCompleted: false,
  finalistTeams: ["France"],
  finalCompleted: false,
  winnerTeam: null,
});
assert.equal(byPhase(midSemis, "finalists").ready, false);

// Final done: champion scoreable.
const afterFinal = evaluatePhaseReadiness({
  semiFinalistTeams: ["Argentina", "England", "France", "Spain"],
  semiFinalsCompleted: true,
  finalistTeams: ["England", "France"],
  finalCompleted: true,
  winnerTeam: "France",
});
assert.equal(byPhase(afterFinal, "winner").ready, true);
assert.deepEqual(byPhase(afterFinal, "winner").officialPreview, ["France"]);

console.log("advanced-bracket-phase-readiness.spec.ts: ok");
