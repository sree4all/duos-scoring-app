/**
 * Parity harness: group prediction adapter delegates to legacy match scoring.
 * Run with: npx tsx tests/integration/group-prediction-parity.spec.ts
 */
import { projectLedgerLines } from "@/lib/server/generalized-scoring/scoring-projection-service";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function runHarness() {
  const lines = projectLedgerLines([
    { actionType: "match_winner", pointsDelta: 10, reasonText: "Winner pick" },
    { actionType: "bonus", pointsDelta: 5, reasonText: "Mega bonus" },
    { actionType: "season_bonus", pointsDelta: 3, reasonText: "Season Q1" },
  ]);

  assert(lines.length === 3, "expected three projected lines");
  assert(lines[0]?.sourceType === "match", "match line type");
  assert(lines[1]?.sourceType === "bonus", "bonus line type");
  assert(lines[2]?.sourceType === "season_bonus", "season bonus line type");

  console.log("group-prediction-parity harness: OK");
}

runHarness();
