import type { SupabaseClient } from "@supabase/supabase-js";
import type { StageKey } from "@/lib/domain/world-cup/types";

export const DEFAULT_STAGE_RULES: {
  stageKey: StageKey;
  stageName: string;
  stageOrder: number;
  correctPoints: number;
  incorrectPenalty: number;
}[] = [
  { stageKey: "group_stage", stageName: "Group Stage", stageOrder: 1, correctPoints: 2, incorrectPenalty: 0 },
  { stageKey: "round_of_32", stageName: "Round of 32", stageOrder: 2, correctPoints: 3, incorrectPenalty: -1 },
  { stageKey: "round_of_16", stageName: "Round of 16", stageOrder: 3, correctPoints: 5, incorrectPenalty: -2 },
  { stageKey: "quarter_finals", stageName: "Quarter-Finals", stageOrder: 4, correctPoints: 8, incorrectPenalty: -3 },
  { stageKey: "semi_finals", stageName: "Semi-Finals", stageOrder: 5, correctPoints: 12, incorrectPenalty: -4 },
  { stageKey: "third_place", stageName: "Third Place Playoff", stageOrder: 6, correctPoints: 8, incorrectPenalty: -3 },
  { stageKey: "final", stageName: "Final", stageOrder: 7, correctPoints: 20, incorrectPenalty: -10 },
];

export async function seedDefaultStageRules(
  supabase: SupabaseClient,
  contestId: string,
  groupId: string,
): Promise<void> {
  const rows = DEFAULT_STAGE_RULES.map((r) => ({
    contest_id: contestId,
    group_id: groupId,
    stage_key: r.stageKey,
    stage_name: r.stageName,
    stage_order: r.stageOrder,
    correct_points: r.correctPoints,
    incorrect_penalty: r.incorrectPenalty,
    revealed_at: null,
  }));

  const { error } = await supabase.from("contest_stage_scoring_rules").upsert(rows, {
    onConflict: "contest_id,stage_key",
  });
  if (error) throw error;
}
