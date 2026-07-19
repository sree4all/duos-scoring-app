/**
 * Run: npx tsx tests/unit/history-line-detail.spec.ts
 */
import assert from "node:assert/strict";
import {
  classifyHistoryLine,
  parseBonusPromptId,
  resolveBonusAnswerDisplay,
} from "@/lib/domain/world-cup/history-line-detail";

assert.equal(classifyHistoryLine("match_winner", "match_winner"), "match_winner");
assert.equal(classifyHistoryLine("match_winner_miss", "match_winner_miss"), "match_winner_miss");
assert.equal(
  classifyHistoryLine("match_bonus", "match_bonus:550e8400-e29b-41d4-a716-446655440000"),
  "match_bonus",
);
assert.equal(
  classifyHistoryLine("bonus", "match_bonus_miss:550e8400-e29b-41d4-a716-446655440000"),
  "match_bonus",
);
assert.equal(classifyHistoryLine("season_bonus", "Season Q1"), "other");

assert.equal(
  parseBonusPromptId("match_bonus:550e8400-e29b-41d4-a716-446655440000"),
  "550e8400-e29b-41d4-a716-446655440000",
);
assert.equal(
  parseBonusPromptId("match_bonus_miss:550e8400-e29b-41d4-a716-446655440000"),
  "550e8400-e29b-41d4-a716-446655440000",
);
assert.equal(parseBonusPromptId("match_bonus"), null);

assert.equal(
  resolveBonusAnswerDisplay("yes", [{ value: "yes", label: "Yes" }]),
  "Yes",
);
assert.equal(
  resolveBonusAnswerDisplay("2-3 goals", [{ value: "2-3 goals", label: "2–3 goals" }]),
  "2–3 goals",
);
assert.equal(resolveBonusAnswerDisplay("  ", []), null);

// Stable option values (placeholder tokens) resolve to human-readable labels.
assert.equal(
  resolveBonusAnswerDisplay("finalist_sf2", [
    { value: "finalist_sf1", label: "Spain" },
    { value: "finalist_sf2", label: "Argentina" },
  ]),
  "Argentina",
);
assert.equal(
  resolveBonusAnswerDisplay("finalist_sf2_wins_2_1", [
    { value: "finalist_sf2_wins_2_1", label: "Argentina wins 2-1" },
    { value: "level_after_90", label: "Level after 90 minutes" },
  ]),
  "Argentina wins 2-1",
);
assert.equal(
  resolveBonusAnswerDisplay("level_after_90", [
    { value: "level_after_90", label: "Level after 90 minutes" },
  ]),
  "Level after 90 minutes",
);

console.log("history-line-detail.spec.ts: ok");
