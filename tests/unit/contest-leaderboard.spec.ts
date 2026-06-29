/**
 * Run: npx tsx tests/unit/contest-leaderboard.spec.ts
 */
import assert from "node:assert/strict";

type Row = { participantId: string; totalPoints: number };

function mergeLeaderboard(
  members: string[],
  seasonByUser: Map<string, number>,
  contestExtraByUser: Map<string, number>,
): Row[] {
  return members.map((participantId) => ({
    participantId,
    totalPoints:
      (seasonByUser.get(participantId) ?? 0) + (contestExtraByUser.get(participantId) ?? 0),
  }));
}

const members = ["a", "b", "c"];
const season = new Map([
  ["a", 56],
  ["b", 45],
  ["c", 38],
]);
const extra = new Map<string, number>();

const totals = mergeLeaderboard(members, season, extra);
assert.equal(totals.find((r) => r.participantId === "b")?.totalPoints, 45);
assert.equal(totals.find((r) => r.participantId === "c")?.totalPoints, 38);

const withBracket = mergeLeaderboard(members, season, new Map([["a", 10]]));
assert.equal(withBracket.find((r) => r.participantId === "a")?.totalPoints, 66);

console.log("contest-leaderboard: OK");
