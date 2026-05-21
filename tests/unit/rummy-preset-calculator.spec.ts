/**
 * Unit tests for points-rummy preset calculator against fixtures.
 * Run: npx tsx tests/unit/rummy-preset-calculator.spec.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { computeHandPoints } from "@/lib/server/rummy/preset-calculator";
import type { PointsRummyPresetParams, RummyHandPlayerInput } from "@/lib/domain/rummy/types";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const fixturePath = join(
  process.cwd(),
  "tests/fixtures/rummy-points-reference-cases.json",
);
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as {
  preset: PointsRummyPresetParams;
  hands: {
    id: string;
    players: RummyHandPlayerInput[];
    expectedComputed: Record<string, number>;
  }[];
};

for (const hand of fixture.hands) {
  const computed = computeHandPoints(hand.players, fixture.preset);
  for (const [participantId, expected] of Object.entries(hand.expectedComputed)) {
    assert(
      computed[participantId] === expected,
      `${hand.id} ${participantId}: expected ${expected}, got ${computed[participantId]}`,
    );
  }
}

console.log("rummy-preset-calculator: OK");
