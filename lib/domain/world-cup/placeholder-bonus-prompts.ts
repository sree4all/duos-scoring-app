/**
 * Team-name placeholders for bonus prompts on matches whose fixture is not
 * yet known (e.g. the Final before both semi-finals conclude).
 *
 * Prompts are seeded with fallback labels ("Winner of Semi Final 1"). When
 * bracket propagation fills a match's home/away teams, the prompt text and
 * option labels are re-rendered from the templates below. Option VALUES are
 * stable tokens and never change, so saved answers and official answers
 * remain valid across re-renders (including result corrections).
 */

export const HOME_TEAM_TOKEN = "{{HOME_TEAM}}";
export const AWAY_TEAM_TOKEN = "{{AWAY_TEAM}}";

export type PlaceholderPromptTemplate = {
  promptText: string;
  /** Option label template keyed by the stable option value. */
  optionLabelsByValue: Record<string, string>;
  homeFallback: string;
  awayFallback: string;
};

export const PLACEHOLDER_PROMPT_TEMPLATES: Record<string, PlaceholderPromptTemplate> = {
  "wc2026:final:potm-team": {
    promptText: "The official Player of the Match award goes to a player from…",
    optionLabelsByValue: {
      finalist_sf1: HOME_TEAM_TOKEN,
      finalist_sf2: AWAY_TEAM_TOKEN,
    },
    homeFallback: "Winner of Semi Final 1",
    awayFallback: "Winner of Semi Final 2",
  },
  "wc2026:final:exact-result": {
    promptText: "Call the exact 90-minute result of the Final.",
    optionLabelsByValue: {
      finalist_sf1_wins_1_0: `${HOME_TEAM_TOKEN} wins 1-0`,
      finalist_sf1_wins_2_1: `${HOME_TEAM_TOKEN} wins 2-1`,
      finalist_sf1_wins_by_2plus: `${HOME_TEAM_TOKEN} wins by 2+ goals`,
      finalist_sf2_wins_1_0: `${AWAY_TEAM_TOKEN} wins 1-0`,
      finalist_sf2_wins_2_1: `${AWAY_TEAM_TOKEN} wins 2-1`,
      finalist_sf2_wins_by_2plus: `${AWAY_TEAM_TOKEN} wins by 2+ goals`,
      level_after_90: "Level after 90 minutes",
    },
    homeFallback: "Winner of Semi Final 1",
    awayFallback: "Winner of Semi Final 2",
  },
};

export function isPlaceholderTeamName(name: string | null | undefined): boolean {
  const n = (name ?? "").trim().toLowerCase();
  return !n || n.includes("tbd") || n.includes("winner") || n.includes("playoff");
}

/** Real team name, or the template fallback while the slot is unresolved. */
export function resolveTeamDisplayName(
  raw: string | null | undefined,
  fallback: string,
): string {
  const name = (raw ?? "").trim();
  return isPlaceholderTeamName(name) ? fallback : name;
}

export type PlaceholderPromptUpdate = {
  promptText: string;
  optionLabelsByValue: Record<string, string>;
};

/**
 * Rendered prompt text + option labels for the current fixture, or null when
 * the prompt key has no placeholder template.
 */
export function buildPlaceholderPromptUpdate(
  promptKey: string,
  homeTeam: string | null | undefined,
  awayTeam: string | null | undefined,
): PlaceholderPromptUpdate | null {
  const template = PLACEHOLDER_PROMPT_TEMPLATES[promptKey];
  if (!template) return null;

  const home = resolveTeamDisplayName(homeTeam, template.homeFallback);
  const away = resolveTeamDisplayName(awayTeam, template.awayFallback);
  const render = (text: string) =>
    text.replaceAll(HOME_TEAM_TOKEN, home).replaceAll(AWAY_TEAM_TOKEN, away);

  const optionLabelsByValue: Record<string, string> = {};
  for (const [value, labelTemplate] of Object.entries(template.optionLabelsByValue)) {
    optionLabelsByValue[value] = render(labelTemplate);
  }

  return { promptText: render(template.promptText), optionLabelsByValue };
}

export type BonusOptionForDisplay = { value: string; label: string };

/**
 * Overlay template-rendered labels (actual team names) onto stored options so
 * display stays correct even if DB option labels were not refreshed yet.
 */
export function optionsWithResolvedPlaceholderLabels(
  options: BonusOptionForDisplay[],
  promptKey: string | null | undefined,
  homeTeam: string | null | undefined,
  awayTeam: string | null | undefined,
): BonusOptionForDisplay[] {
  if (!promptKey?.trim()) return options;
  const update = buildPlaceholderPromptUpdate(promptKey, homeTeam, awayTeam);
  if (!update) return options;
  return options.map((opt) => ({
    value: opt.value,
    label: update.optionLabelsByValue[opt.value] ?? opt.label,
  }));
}
