/**
 * Run: npx tsx tests/unit/match-standings.spec.ts
 */
import assert from "node:assert/strict";
import { formatStageLabel } from "@/lib/server/world-cup/match-standings";
import { aggregateLeaderboardForContest } from "@/lib/server/generalized-scoring/scoring-projection-service";

assert.equal(formatStageLabel("round_of_32"), "Round of 32");
assert.equal(formatStageLabel(null), null);

const singleMatchLedger = [
  { participantId: "a", pointsDelta: 3 },
  { participantId: "b", pointsDelta: -1 },
  { participantId: "a", pointsDelta: 0 },
];

const singleMatchTotals = aggregateLeaderboardForContest(singleMatchLedger);
assert.equal(singleMatchTotals.find((row) => row.participantId === "a")?.totalPoints, 3);
assert.equal(singleMatchTotals.find((row) => row.participantId === "b")?.totalPoints, -1);

const multiMatchLedger = [
  { participantId: "a", pointsDelta: 3 },
  { participantId: "a", pointsDelta: -1 },
  { participantId: "b", pointsDelta: 2 },
];

const multiMatchTotals = aggregateLeaderboardForContest(multiMatchLedger);
assert.equal(multiMatchTotals.find((row) => row.participantId === "a")?.totalPoints, 2);
assert.equal(multiMatchTotals.find((row) => row.participantId === "b")?.totalPoints, 2);

console.log("match-standings: OK");
