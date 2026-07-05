/**
 * Run: npx tsx tests/unit/odd-match-bonus.spec.ts
 */
import assert from "node:assert/strict";
import {
  buildOddMatchBonusTemplate,
  oddMatchBonusPromptKey,
} from "@/lib/domain/world-cup/odd-match-bonus-templates";

const template = buildOddMatchBonusTemplate({
  homeTeam: "Mexico",
  awayTeam: "England",
  stageKey: "round_of_16",
  matchNumber: 91,
});

assert.ok(template.promptText.length > 10);
assert.ok(template.options.length >= 2);
assert.match(template.promptText, /Mexico|goal|score|card|corner|half|clean|extra/i);

assert.equal(oddMatchBonusPromptKey(91), "wc2026:auto:odd:m91");

const stable = buildOddMatchBonusTemplate({
  homeTeam: "A",
  awayTeam: "B",
  stageKey: "quarter_finals",
  matchNumber: 99,
});
const again = buildOddMatchBonusTemplate({
  homeTeam: "A",
  awayTeam: "B",
  stageKey: "quarter_finals",
  matchNumber: 99,
});
assert.equal(stable.promptText, again.promptText);

console.log("odd-match-bonus.spec.ts: ok");
