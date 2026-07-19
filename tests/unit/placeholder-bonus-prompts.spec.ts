/**
 * Run: npx tsx tests/unit/placeholder-bonus-prompts.spec.ts
 */
import assert from "node:assert/strict";
import {
  PLACEHOLDER_PROMPT_TEMPLATES,
  buildPlaceholderPromptUpdate,
  isPlaceholderTeamName,
  optionsWithResolvedPlaceholderLabels,
  resolveTeamDisplayName,
} from "@/lib/domain/world-cup/placeholder-bonus-prompts";

assert.equal(isPlaceholderTeamName("TBD"), true);
assert.equal(isPlaceholderTeamName("Winner Match 101"), true);
assert.equal(isPlaceholderTeamName(""), true);
assert.equal(isPlaceholderTeamName(null), true);
assert.equal(isPlaceholderTeamName("France"), false);

assert.equal(resolveTeamDisplayName("TBD", "Winner of Semi Final 1"), "Winner of Semi Final 1");
assert.equal(resolveTeamDisplayName("France", "Winner of Semi Final 1"), "France");

// Unknown prompt keys have no template and are left untouched.
assert.equal(buildPlaceholderPromptUpdate("wc2026:sf1:star-duel", "France", "Spain"), null);

// Both slots unresolved → fallback labels (matches the seed migration exactly).
const potmTbd = buildPlaceholderPromptUpdate("wc2026:final:potm-team", "TBD", "TBD");
assert.ok(potmTbd);
assert.equal(potmTbd.promptText, "The official Player of the Match award goes to a player from…");
assert.deepEqual(potmTbd.optionLabelsByValue, {
  finalist_sf1: "Winner of Semi Final 1",
  finalist_sf2: "Winner of Semi Final 2",
});

// One slot resolved → only that side's labels change.
const potmHalf = buildPlaceholderPromptUpdate("wc2026:final:potm-team", "France", "TBD");
assert.ok(potmHalf);
assert.deepEqual(potmHalf.optionLabelsByValue, {
  finalist_sf1: "France",
  finalist_sf2: "Winner of Semi Final 2",
});

// Both resolved.
const potmFull = buildPlaceholderPromptUpdate("wc2026:final:potm-team", "France", "England");
assert.ok(potmFull);
assert.deepEqual(potmFull.optionLabelsByValue, {
  finalist_sf1: "France",
  finalist_sf2: "England",
});

// Display overlay: stored values map to rendered team labels even if DB still has fallbacks.
assert.deepEqual(
  optionsWithResolvedPlaceholderLabels(
    [
      { value: "finalist_sf1", label: "Winner of Semi Final 1" },
      { value: "finalist_sf2", label: "Winner of Semi Final 2" },
    ],
    "wc2026:final:potm-team",
    "Spain",
    "Argentina",
  ),
  [
    { value: "finalist_sf1", label: "Spain" },
    { value: "finalist_sf2", label: "Argentina" },
  ],
);

assert.deepEqual(
  optionsWithResolvedPlaceholderLabels(
    [
      { value: "finalist_sf2_wins_2_1", label: "Winner of Semi Final 2 wins 2-1" },
      { value: "level_after_90", label: "Level after 90 minutes" },
    ],
    "wc2026:final:exact-result",
    "Spain",
    "Argentina",
  ),
  [
    { value: "finalist_sf2_wins_2_1", label: "Argentina wins 2-1" },
    { value: "level_after_90", label: "Level after 90 minutes" },
  ],
);

// Non-placeholder prompts keep stored labels.
assert.deepEqual(
  optionsWithResolvedPlaceholderLabels(
    [{ value: "yes", label: "Yes" }],
    "wc2026:sf1:star-duel",
    "Spain",
    "Argentina",
  ),
  [{ value: "yes", label: "Yes" }],
);

// Result correction re-renders from the template (labels are not stuck).
const potmCorrected = buildPlaceholderPromptUpdate(
  "wc2026:final:potm-team",
  "Spain",
  "England",
);
assert.ok(potmCorrected);
assert.equal(potmCorrected.optionLabelsByValue.finalist_sf1, "Spain");

// Exact-result gamble: all seven option values, labels rendered per side.
const result = buildPlaceholderPromptUpdate("wc2026:final:exact-result", "France", "England");
assert.ok(result);
assert.equal(result.promptText, "Call the exact 90-minute result of the Final.");
assert.deepEqual(result.optionLabelsByValue, {
  finalist_sf1_wins_1_0: "France wins 1-0",
  finalist_sf1_wins_2_1: "France wins 2-1",
  finalist_sf1_wins_by_2plus: "France wins by 2+ goals",
  finalist_sf2_wins_1_0: "England wins 1-0",
  finalist_sf2_wins_2_1: "England wins 2-1",
  finalist_sf2_wins_by_2plus: "England wins by 2+ goals",
  level_after_90: "Level after 90 minutes",
});

// Option values are stable regardless of rendered team names.
const tbdValues = Object.keys(
  buildPlaceholderPromptUpdate("wc2026:final:exact-result", "TBD", "TBD")!.optionLabelsByValue,
).sort();
const fullValues = Object.keys(result.optionLabelsByValue).sort();
assert.deepEqual(tbdValues, fullValues);

// Every registered template renders without leftover tokens.
for (const promptKey of Object.keys(PLACEHOLDER_PROMPT_TEMPLATES)) {
  const update = buildPlaceholderPromptUpdate(promptKey, "France", "England");
  assert.ok(update);
  assert.ok(!update.promptText.includes("{{"));
  for (const label of Object.values(update.optionLabelsByValue)) {
    assert.ok(!label.includes("{{"), `unrendered token in label: ${label}`);
  }
}

console.log("placeholder-bonus-prompts.spec.ts: ok");
