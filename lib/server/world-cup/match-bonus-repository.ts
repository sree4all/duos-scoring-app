import type { SupabaseClient } from "@supabase/supabase-js";
import type { MatchBonusPrompt } from "@/lib/domain/world-cup/match-bonus";

function mapPrompt(
  row: Record<string, unknown>,
  options: MatchBonusPrompt["options"],
): MatchBonusPrompt {
  return {
    id: row.id as string,
    matchId: row.match_id as string,
    promptText: row.prompt_text as string,
    correctPoints: Number(row.correct_points ?? 2),
    incorrectPenalty: Number(row.incorrect_penalty ?? 0),
    correctAnswer: (row.correct_answer as string | null) ?? null,
    isActive: Boolean(row.is_active ?? true),
    options,
  };
}

export class MatchBonusRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listForMatch(matchId: string, seasonYear = 2026): Promise<MatchBonusPrompt[]> {
    const { data: prompts, error } = await this.supabase
      .from("bonus_prompts")
      .select("*")
      .eq("season_year", seasonYear)
      .eq("scope", "match")
      .eq("match_id", matchId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) throw error;
    if (!prompts?.length) return [];

    const ids = prompts.map((p) => p.id as string);
    const { data: optRows, error: optErr } = await this.supabase
      .from("bonus_prompt_options")
      .select("id, prompt_id, label, value, sort_order")
      .in("prompt_id", ids)
      .order("sort_order", { ascending: true });

    if (optErr) throw optErr;

    const optsByPrompt = new Map<string, MatchBonusPrompt["options"]>();
    for (const o of optRows ?? []) {
      const pid = o.prompt_id as string;
      const list = optsByPrompt.get(pid) ?? [];
      list.push({
        id: o.id as string,
        label: o.label as string,
        value: o.value as string,
        sortOrder: Number(o.sort_order ?? 0),
      });
      optsByPrompt.set(pid, list);
    }

    return prompts.map((p) =>
      mapPrompt(p as Record<string, unknown>, optsByPrompt.get(p.id as string) ?? []),
    );
  }

  async createPrompt(input: {
    matchId: string;
    seasonYear: number;
    promptText: string;
    options: { label: string; value: string }[];
    correctPoints: number;
    incorrectPenalty: number;
    correctAnswer?: string | null;
  }): Promise<MatchBonusPrompt> {
    const promptKey = `wc:${input.matchId}:${Date.now()}`;
    const { data: prompt, error } = await this.supabase
      .from("bonus_prompts")
      .insert({
        season_year: input.seasonYear,
        scope: "match",
        match_id: input.matchId,
        prompt_key: promptKey,
        prompt_text: input.promptText.trim(),
        input_type: "single_choice",
        is_active: true,
        revealed_by_admin: true,
        correct_points: input.correctPoints,
        incorrect_penalty: input.incorrectPenalty,
        correct_answer: input.correctAnswer?.trim() || null,
        display_order: 0,
      })
      .select("*")
      .single();

    if (error) throw error;

    const optionRows = input.options.map((o, i) => ({
      prompt_id: prompt.id as string,
      label: o.label.trim(),
      value: o.value.trim(),
      sort_order: i,
    }));

    const { data: insertedOpts, error: optErr } = await this.supabase
      .from("bonus_prompt_options")
      .insert(optionRows)
      .select("id, prompt_id, label, value, sort_order");

    if (optErr) throw optErr;

    return mapPrompt(
      prompt as Record<string, unknown>,
      (insertedOpts ?? []).map((o) => ({
        id: o.id as string,
        label: o.label as string,
        value: o.value as string,
        sortOrder: Number(o.sort_order ?? 0),
      })),
    );
  }

  async updatePrompt(
    promptId: string,
    patch: {
      promptText?: string;
      correctPoints?: number;
      incorrectPenalty?: number;
      correctAnswer?: string | null;
      isActive?: boolean;
      options?: { label: string; value: string }[];
    },
  ): Promise<void> {
    const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.promptText !== undefined) body.prompt_text = patch.promptText.trim();
    if (patch.correctPoints !== undefined) body.correct_points = patch.correctPoints;
    if (patch.incorrectPenalty !== undefined) body.incorrect_penalty = patch.incorrectPenalty;
    if (patch.correctAnswer !== undefined) body.correct_answer = patch.correctAnswer?.trim() || null;
    if (patch.isActive !== undefined) body.is_active = patch.isActive;

    if (Object.keys(body).length > 1) {
      const { error } = await this.supabase
        .from("bonus_prompts")
        .update(body)
        .eq("id", promptId);
      if (error) throw error;
    }

    if (patch.options) {
      const { error: delErr } = await this.supabase
        .from("bonus_prompt_options")
        .delete()
        .eq("prompt_id", promptId);
      if (delErr) throw delErr;

      const rows = patch.options.map((o, i) => ({
        prompt_id: promptId,
        label: o.label.trim(),
        value: o.value.trim(),
        sort_order: i,
      }));
      const { error: insErr } = await this.supabase.from("bonus_prompt_options").insert(rows);
      if (insErr) throw insErr;
    }
  }
}
