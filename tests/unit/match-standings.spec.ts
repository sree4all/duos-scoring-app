/**
 * Run: npx tsx tests/unit/match-standings.spec.ts
 */
import assert from "node:assert/strict";
import { formatStageLabel } from "@/lib/server/world-cup/match-standings";
import { aggregateLeaderboardForContest } from "@/lib/server/generalized-scoring/scoring-projection-service";

assert.equal(formatStageLabel("round_of_32"), "Round of 32");
assert.equal(formatStageLabel(null), null);

const ledger = [
  { participantId: "a", pointsDelta: 3 },
  { participantId: "b", pointsDelta: -1 },
  { participantId: "a", pointsDelta: 0 },
];

const totals = aggregateLeaderboardForContest(ledger);
assert.equal(totals.find((row) => row.participantId === "a")?.totalPoints, 3);
assert.equal(totals.find((row) => row.participantId === "b")?.totalPoints, -1);

console.log("match-standings: OK");
