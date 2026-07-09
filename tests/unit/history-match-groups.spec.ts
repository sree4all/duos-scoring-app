/**
 * Run: npx tsx tests/unit/history-match-groups.spec.ts
 */
import assert from "node:assert/strict";
import { buildGroupedHistory } from "@/lib/domain/world-cup/history-match-groups";

const matchId = "match-97";
const promptId = "prompt-goals";
const eventId = "event-97";

const result = buildGroupedHistory({
  ledgerRows: [
    {
      id: "ledger-winner",
      eventId,
      actionType: "match_winner",
      reasonText: "match_winner",
      pointsDelta: 8,
      provisional: false,
    },
  ],
  matchIdByEventId: new Map([[eventId, matchId]]),
  voidedByEventId: new Map([[eventId, false]]),
  matchesById: new Map([
    [
      matchId,
      {
        id: matchId,
        matchNumber: 97,
        homeTeam: "France",
        awayTeam: "Morocco",
        winner: "France",
        status: "completed",
      },
    ],
  ]),
  predictionsByMatchId: new Map([
    [matchId, { predictedWinner: "France", bonusPick: null }],
  ]),
  promptsByMatchId: new Map([
    [
      matchId,
      [
        {
          id: promptId,
          matchId,
          promptText: "How many total goals will be scored in regulation (90 minutes)?",
          correctAnswer: "2-3 goals",
        },
      ],
    ],
  ]),
  optionsByPromptId: new Map([
    [
      promptId,
      [
        { value: "2-3 goals", label: "2–3 goals" },
        { value: "4 or more goals", label: "4 or more goals" },
      ],
    ],
  ]),
  bonusAnswersByMatchPrompt: new Map([[`${matchId}\t${promptId}`, "4 or more goals"]]),
});

assert.equal(result.matches.length, 1);
const group = result.matches[0]!;
assert.equal(group.matchNumber, 97);
assert.equal(group.winner?.pointsDelta, 8);
assert.equal(group.bonuses.length, 1);
assert.equal(group.bonuses[0]?.chosenAnswer, "4 or more goals");
assert.equal(group.bonuses[0]?.correctAnswer, "2–3 goals");
assert.equal(group.bonuses[0]?.pointsDelta, 0);

const withBonusLedger = buildGroupedHistory({
  ledgerRows: [
    {
      id: "ledger-winner",
      eventId,
      actionType: "match_winner",
      reasonText: "match_winner",
      pointsDelta: 8,
      provisional: false,
    },
    {
      id: "ledger-bonus",
      eventId,
      actionType: "match_bonus",
      reasonText: `match_bonus:${promptId}`,
      pointsDelta: 3,
      provisional: false,
    },
  ],
  matchIdByEventId: new Map([[eventId, matchId]]),
  voidedByEventId: new Map([[eventId, false]]),
  matchesById: new Map([
    [
      matchId,
      {
        id: matchId,
        matchNumber: 97,
        homeTeam: "France",
        awayTeam: "Morocco",
        winner: "France",
        status: "completed",
      },
    ],
  ]),
  predictionsByMatchId: new Map([
    [matchId, { predictedWinner: "France", bonusPick: null }],
  ]),
  promptsByMatchId: new Map([
    [
      matchId,
      [
        {
          id: promptId,
          matchId,
          promptText: "How many total goals will be scored in regulation (90 minutes)?",
          correctAnswer: "2-3 goals",
        },
      ],
    ],
  ]),
  optionsByPromptId: new Map([
    [
      promptId,
      [
        { value: "2-3 goals", label: "2–3 goals" },
        { value: "4 or more goals", label: "4 or more goals" },
      ],
    ],
  ]),
  bonusAnswersByMatchPrompt: new Map([[`${matchId}\t${promptId}`, "2-3 goals"]]),
});

assert.equal(withBonusLedger.matches[0]?.bonuses[0]?.pointsDelta, 3);
assert.equal(withBonusLedger.matches[0]?.totalPoints, 11);

console.log("history-match-groups.spec.ts: ok");
