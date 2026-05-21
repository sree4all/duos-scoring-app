import type { SupabaseClient } from "@supabase/supabase-js";
import type { StageScoringRule } from "@/lib/domain/world-cup/types";

function mapRow(row: Record<string, unknown>): StageScoringRule {
  return {
    stageKey: row.stage_key as StageScoringRule["stageKey"],
    stageName: row.stage_name as string,
    stageOrder: Number(row.stage_order),
    correctPoints: Number(row.correct_points),
    incorrectPenalty: Number(row.incorrect_penalty),
    revealedAt: (row.revealed_at as string | null) ?? null,
  };
}

export class StageRulesRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listForContest(contestId: string, memberView = false): Promise<StageScoringRule[]> {
    let q = this.supabase
      .from("contest_stage_scoring_rules")
      .select("*")
      .eq("contest_id", contestId)
      .order("stage_order", { ascending: true });

    if (memberView) {
      q = q.not("revealed_at", "is", null);
    }

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
  }

  async getStageRule(contestId: string, stageKey: string) {
    const { data, error } = await this.supabase
      .from("contest_stage_scoring_rules")
      .select("correct_points, incorrect_penalty")
      .eq("contest_id", contestId)
      .eq("stage_key", stageKey)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      correctPoints: Number(data.correct_points),
      incorrectPenalty: Number(data.incorrect_penalty),
    };
  }

  async updateStageRule(
    contestId: string,
    stageKey: string,
    patch: { correctPoints?: number; incorrectPenalty?: number; revealedAt?: string | null },
  ): Promise<void> {
    const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.correctPoints !== undefined) body.correct_points = patch.correctPoints;
    if (patch.incorrectPenalty !== undefined) body.incorrect_penalty = patch.incorrectPenalty;
    if (patch.revealedAt !== undefined) body.revealed_at = patch.revealedAt;

    const { error } = await this.supabase
      .from("contest_stage_scoring_rules")
      .update(body)
      .eq("contest_id", contestId)
      .eq("stage_key", stageKey);
    if (error) throw error;
  }

  async isStageRevealed(contestId: string, stageKey: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("contest_stage_scoring_rules")
      .select("revealed_at")
      .eq("contest_id", contestId)
      .eq("stage_key", stageKey)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data?.revealed_at);
  }
}
