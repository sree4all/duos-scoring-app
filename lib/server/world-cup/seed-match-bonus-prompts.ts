import type { SupabaseClient } from "@supabase/supabase-js";

type MatchBonusSeed = {
  matchNumber: number;
  teamHint?: string;
  promptKey: string;
  promptText: string;
  options: string[];
  correctPoints?: number;
  incorrectPenalty?: number;
};

export const MATCH_BONUS_SEEDS: MatchBonusSeed[] = [
  {
    matchNumber: 19,
    teamHint: "Argentina",
    promptKey: "wc2026:m19:first-goal-minute-bracket",
    promptText: "In which minute bracket will the first goal of the match be scored?",
    options: [
      "A) 1st – 15th minute",
      "B) 16th – 45th minute (including first-half stoppage time)",
      "C) 46th – 75th minute",
      "D) 76th – 90th+ minute (including second-half stoppage time)",
      "E) No goals scored (0–0 draw)",
    ],
  },
];

/** Upsert predefined match bonus prompts after schedule import (idempotent). */
export async function seedPredefinedMatchBonusPrompts(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<void> {
  for (const seed of MATCH_BONUS_SEEDS) {
    let matchQuery = supabase
      .from("matches")
      .select("id")
      .eq("season_year", seasonYear)
      .eq("match_number", seed.matchNumber);

    if (seed.teamHint) {
      matchQuery = matchQuery.or(
        `home_team.ilike.%${seed.teamHint}%,away_team.ilike.%${seed.teamHint}%`,
      );
    }

    const { data: match, error: matchErr } = await matchQuery.maybeSingle();
    if (matchErr) throw matchErr;
    if (!match) continue;

    const matchId = match.id as string;

    const { data: existing, error: existingErr } = await supabase
      .from("bonus_prompts")
      .select("id")
      .eq("match_id", matchId)
      .eq("prompt_key", seed.promptKey)
      .maybeSingle();
    if (existingErr) throw existingErr;

    let promptId = existing?.id as string | undefined;

    if (promptId) {
      const { error: updateErr } = await supabase
        .from("bonus_prompts")
        .update({
          prompt_text: seed.promptText,
          is_active: true,
          correct_points: seed.correctPoints ?? 2,
          incorrect_penalty: seed.incorrectPenalty ?? 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", promptId);
      if (updateErr) throw updateErr;

      const { error: deleteErr } = await supabase
        .from("bonus_prompt_options")
        .delete()
        .eq("prompt_id", promptId);
      if (deleteErr) throw deleteErr;
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from("bonus_prompts")
        .insert({
          season_year: seasonYear,
          scope: "match",
          match_id: matchId,
          prompt_key: seed.promptKey,
          prompt_text: seed.promptText,
          input_type: "single_choice",
          correct_points: seed.correctPoints ?? 2,
          incorrect_penalty: seed.incorrectPenalty ?? 0,
          display_order: 0,
        })
        .select("id")
        .single();
      if (insertErr) throw insertErr;
      promptId = inserted.id as string;
    }

    const { error: optionsErr } = await supabase.from("bonus_prompt_options").insert(
      seed.options.map((label, sortOrder) => ({
        prompt_id: promptId,
        label,
        value: label,
        sort_order: sortOrder,
      })),
    );
    if (optionsErr) throw optionsErr;
  }
}
