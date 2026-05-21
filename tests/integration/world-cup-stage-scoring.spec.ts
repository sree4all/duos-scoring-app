/**
 * SC-003: stage scoring matrix
 * Run: npx tsx tests/integration/world-cup-stage-scoring.spec.ts
 */
import fixture from "../fixtures/world-cup-stage-scoring.json";
import { DEFAULT_STAGE_RULES } from "@/lib/server/world-cup/seed-stage-rules";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function run() {
  assert(fixture.cases.length === DEFAULT_STAGE_RULES.length, "fixture length matches defaults");
  for (const c of fixture.cases) {
    const row = DEFAULT_STAGE_RULES.find((r) => r.stageKey === c.stageKey);
    assert(Boolean(row), `missing default for ${c.stageKey}`);
    assert(row!.correctPoints === c.correct, `${c.stageKey} correct`);
    assert(row!.incorrectPenalty === c.incorrect, `${c.stageKey} incorrect`);
  }
  console.log("world-cup-stage-scoring: OK");
}

run();
