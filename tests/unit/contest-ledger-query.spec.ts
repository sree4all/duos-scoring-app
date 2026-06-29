/**
 * Run: npx tsx tests/unit/contest-ledger-query.spec.ts
 */
import assert from "node:assert/strict";
import { aggregateLeaderboardForContest } from "@/lib/server/generalized-scoring/scoring-projection-service";

function paginateAggregate(rows: { participantId: string; pointsDelta: number }[]) {
  const PAGE = 3;
  const totals: { participantId: string; pointsDelta: number }[] = [];
  for (let from = 0; from < rows.length; from += PAGE) {
    totals.push(...rows.slice(from, from + PAGE));
  }
  return aggregateLeaderboardForContest(totals);
}

const ledger = [
  { participantId: "a", pointsDelta: 10 },
  { participantId: "b", pointsDelta: 5 },
  { participantId: "a", pointsDelta: 3 },
  { participantId: "c", pointsDelta: -1 },
  { participantId: "b", pointsDelta: 2 },
  { participantId: "d", pointsDelta: -1 },
  { participantId: "e", pointsDelta: 4 },
];

const singleFetch = aggregateLeaderboardForContest(ledger);
const pagedFetch = paginateAggregate(ledger);

assert.deepEqual(
  singleFetch.map((e) => [e.participantId, e.totalPoints]).sort(),
  pagedFetch.map((e) => [e.participantId, e.totalPoints]).sort(),
);

const sumesh = pagedFetch.find((e) => e.participantId === "d");
assert.equal(sumesh?.totalPoints, -1, "wrong R32 pick penalty included in totals");

console.log("contest-ledger-query: OK");
