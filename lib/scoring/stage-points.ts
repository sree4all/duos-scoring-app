import type { StageKey } from "@/lib/domain/world-cup/types";
import { DEFAULT_STAGE_RULES } from "@/lib/server/world-cup/seed-stage-rules";

export function defaultIncorrectPenaltyForStage(stageKey: string | undefined): number {
  if (!stageKey || stageKey === "group_stage") return 0;
  const rule = DEFAULT_STAGE_RULES.find((r) => r.stageKey === stageKey);
  return rule?.incorrectPenalty ?? 0;
}

/**
 * Resolve wrong-pick penalty for a stage.
 * Knockout rows often keep schema default 0 in contest_stage_scoring_rules; treat that as
 * "unset" and apply platform defaults (-1 for R32, etc.).
 */
export function resolveIncorrectPenalty(
  stageKey: string | undefined,
  dbPenalty: number | null | undefined,
): number {
  const penalty = Number(dbPenalty ?? 0);
  if (!stageKey || stageKey === "group_stage") return penalty;

  const knockoutDefault = defaultIncorrectPenaltyForStage(stageKey);
  if (penalty === 0 && knockoutDefault !== 0) {
    return knockoutDefault;
  }
  return penalty > 0 ? -penalty : penalty;
}

export function resolveStagePointsFromDb(
  stageKey: StageKey | string | undefined,
  correctPoints: number | null | undefined,
  incorrectPenalty: number | null | undefined,
  fallbackCorrect: number,
): { correct: number; incorrect: number } {
  if (!stageKey) {
    return { correct: fallbackCorrect, incorrect: 0 };
  }

  const defaultRule = DEFAULT_STAGE_RULES.find((r) => r.stageKey === stageKey);
  if (correctPoints == null && incorrectPenalty == null) {
    if (defaultRule) {
      return {
        correct: defaultRule.correctPoints,
        incorrect: defaultRule.incorrectPenalty,
      };
    }
    return { correct: fallbackCorrect, incorrect: 0 };
  }

  return {
    correct: Number(correctPoints ?? defaultRule?.correctPoints ?? fallbackCorrect),
    incorrect: resolveIncorrectPenalty(stageKey, incorrectPenalty),
  };
}
