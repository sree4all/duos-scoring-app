import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPlaceholderPromptUpdate } from "@/lib/domain/world-cup/placeholder-bonus-prompts";

export type PlaceholderRefreshResult =
  | { ok: true; promptsRefreshed: number }
  | { ok: false; error: string };

/**
 * Re-render placeholder bonus prompts on a match after its fixture teams
 * change (bracket propagation). Only prompts whose `prompt_key` has a
 * registered template are touched; labels are display-only, option values
 * (and therefore saved answers) never change.
 */
export async function refreshPlaceholderBonusPrompts(
  supabase: SupabaseClient,
  matchId: string,
  homeTeam: string,
  awayTeam: string,
): Promise<PlaceholderRefreshResult> {
  const { data: prompts, error: promptsErr } = await supabase
    .from("bonus_prompts")
    .select("id, prompt_key, prompt_text")
    .eq("match_id", matchId)
    .eq("is_active", true);

  if (promptsErr) return { ok: false, error: promptsErr.message };

  let promptsRefreshed = 0;
  const now = new Date().toISOString();

  for (const prompt of prompts ?? []) {
    const update = buildPlaceholderPromptUpdate(
      prompt.prompt_key as string,
      homeTeam,
      awayTeam,
    );
    if (!update) continue;

    if (update.promptText !== (prompt.prompt_text as string)) {
      const { error: textErr } = await supabase
        .from("bonus_prompts")
        .update({ prompt_text: update.promptText, updated_at: now })
        .eq("id", prompt.id as string);
      if (textErr) return { ok: false, error: textErr.message };
    }

    const { data: options, error: optErr } = await supabase
      .from("bonus_prompt_options")
      .select("id, value, label")
      .eq("prompt_id", prompt.id as string);

    if (optErr) return { ok: false, error: optErr.message };

    for (const option of options ?? []) {
      const nextLabel = update.optionLabelsByValue[option.value as string];
      if (nextLabel === undefined || nextLabel === (option.label as string)) continue;

      const { error: labelErr } = await supabase
        .from("bonus_prompt_options")
        .update({ label: nextLabel })
        .eq("id", option.id as string);
      if (labelErr) return { ok: false, error: labelErr.message };
    }

    promptsRefreshed += 1;
  }

  return { ok: true, promptsRefreshed };
}
