import type { StageKey } from "@/lib/domain/world-cup/types";

export type OddBonusTemplate = {
  promptText: string;
  options: string[];
};

type TemplateContext = {
  homeTeam: string;
  awayTeam: string;
  stageKey: StageKey | null;
  matchNumber: number;
};

const TEMPLATE_BUILDERS: ((ctx: TemplateContext) => OddBonusTemplate)[] = [
  (ctx) => ({
    promptText: `Will ${ctx.homeTeam} score first?`,
    options: [`Yes — ${ctx.homeTeam}`, `Yes — ${ctx.awayTeam}`, "No goals in regulation"],
  }),
  () => ({
    promptText: "How many total goals will be scored in regulation (90 minutes)?",
    options: ["0–1 goals", "2–3 goals", "4 or more goals"],
  }),
  (ctx) => ({
    promptText: `Will ${ctx.awayTeam} keep a clean sheet through regulation?`,
    options: ["Yes", "No"],
  }),
  () => ({
    promptText: "Will the match go to extra time or penalties?",
    options: [
      "Decided in regulation",
      "Extra time needed",
      "Penalties needed",
    ],
  }),
  (ctx) => ({
    promptText: `Which team will have more corner kicks in regulation?`,
    options: [ctx.homeTeam, ctx.awayTeam, "Tie on corners"],
  }),
  () => ({
    promptText: "Will a card be shown in the first 15 minutes?",
    options: ["Yes", "No"],
  }),
  (ctx) => ({
    promptText: `Will both ${ctx.homeTeam} and ${ctx.awayTeam} score in regulation?`,
    options: ["Yes — both score", `No — only ${ctx.homeTeam}`, `No — only ${ctx.awayTeam}`, "No goals"],
  }),
  () => ({
    promptText: "Which half will have more goals?",
    options: ["First half", "Second half", "Equal or no goals"],
  }),
];

export function buildOddMatchBonusTemplate(ctx: TemplateContext): OddBonusTemplate {
  const index = Math.abs(ctx.matchNumber) % TEMPLATE_BUILDERS.length;
  return TEMPLATE_BUILDERS[index]!(ctx);
}

export function oddMatchBonusPromptKey(matchNumber: number): string {
  return `wc2026:auto:odd:m${matchNumber}`;
}
