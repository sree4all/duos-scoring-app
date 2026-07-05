import type { SupabaseClient } from "@supabase/supabase-js";
import { isPlaceholderTeam } from "@/lib/domain/world-cup/advanced-bracket";
import {
  buildOddMatchBonusTemplate,
  oddMatchBonusPromptKey,
} from "@/lib/domain/world-cup/odd-match-bonus-templates";
import type { StageKey } from "@/lib/domain/world-cup/types";
import {
  getWorldCupOddBonusEnabledAt,
  isWorldCupOddBonusEnabled,
} from "@/lib/server/world-cup/flags";
import { createServiceClient } from "@/lib/supabase/service";

const ODD_BONUS_CORRECT_POINTS = 3;
const ODD_BONUS_INCORRECT_PENALTY = 0;

export type OddMatchBonusOutcome = {
  generated: number;
  skipped: number;
  error?: string;
};

function isAutoOddPromptKey(promptKey: string): boolean {
  return promptKey.startsWith("wc2026:auto:odd:");
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

/** Uses service role so bonus upserts are not blocked by member RLS. Never throws. */
export async function ensureOddMatchBonuses(
  _supabase: SupabaseClient,
  contestId: string,
): Promise<OddMatchBonusOutcome> {
  if (!isWorldCupOddBonusEnabled()) {
    return { generated: 0, skipped: 0 };
  }

  let supabase: SupabaseClient;
  try {
    supabase = createServiceClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Missing service credentials";
    console.error("[ensureOddMatchBonuses]", message);
    return { generated: 0, skipped: 0, error: message };
  }

  try {
    return await runEnsureOddMatchBonuses(supabase, contestId);
  } catch (err) {
    const message = errorMessage(err) || "Odd bonus generation failed";
    console.error("[ensureOddMatchBonuses]", message);
    return { generated: 0, skipped: 0, error: message };
  }
}

async function runEnsureOddMatchBonuses(
  supabase: SupabaseClient,
  contestId: string,
): Promise<OddMatchBonusOutcome> {
  const enabledAt = getWorldCupOddBonusEnabledAt();
  const now = new Date().toISOString();

  const { data: events, error: eventsErr } = await supabase
    .from("events")
    .select("source_match_id")
    .eq("contest_id", contestId)
    .not("source_match_id", "is", null);

  if (eventsErr) throw eventsErr;

  const matchIds = [
    ...new Set(
      (events ?? [])
        .map((e) => e.source_match_id as string | null)
        .filter(Boolean) as string[],
    ),
  ];

  if (matchIds.length === 0) return { generated: 0, skipped: 0 };

  const { data: matches, error: matchErr } = await supabase
    .from("matches")
    .select("id, match_number, home_team, away_team, match_time_utc, stage_key")
    .in("id", matchIds);

  if (matchErr) throw matchErr;

  let generated = 0;
  let skipped = 0;

  for (const match of matches ?? []) {
    const matchNumber = match.match_number as number | null;
    const matchId = match.id as string;
    const kickoff = new Date(match.match_time_utc as string);

    if (
      matchNumber == null ||
      matchNumber % 2 === 0 ||
      kickoff <= enabledAt
    ) {
      skipped += 1;
      continue;
    }

    const homeTeam = match.home_team as string;
    const awayTeam = match.away_team as string;
    if (isPlaceholderTeam(homeTeam) || isPlaceholderTeam(awayTeam)) {
      skipped += 1;
      continue;
    }

    const { data: existingPrompts } = await supabase
      .from("bonus_prompts")
      .select("id, prompt_key")
      .eq("match_id", matchId)
      .eq("is_active", true);

    const hasOwnerPrompt = (existingPrompts ?? []).some(
      (p) => !isAutoOddPromptKey(p.prompt_key as string),
    );
    if (hasOwnerPrompt) {
      skipped += 1;
      continue;
    }

    const template = buildOddMatchBonusTemplate({
      homeTeam,
      awayTeam,
      stageKey: (match.stage_key as StageKey | null) ?? null,
      matchNumber,
    });

    const promptKey = oddMatchBonusPromptKey(matchNumber);
    const { data: existing } = await supabase
      .from("bonus_prompts")
      .select("id")
      .eq("match_id", matchId)
      .eq("prompt_key", promptKey)
      .maybeSingle();

    let promptId = existing?.id as string | undefined;

    const promptWriteBase = {
      prompt_text: template.promptText,
      is_active: true,
      correct_points: ODD_BONUS_CORRECT_POINTS,
      incorrect_penalty: ODD_BONUS_INCORRECT_PENALTY,
      input_type: "single_choice" as const,
    };

    // Auto prompts are identified by prompt_key (wc2026:auto:odd:m{n}), not generation_source.
    if (promptId) {
      const { error: updateErr } = await supabase
        .from("bonus_prompts")
        .update({ ...promptWriteBase, updated_at: now })
        .eq("id", promptId);
      if (updateErr) throw updateErr;

      await supabase.from("bonus_prompt_options").delete().eq("prompt_id", promptId);
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from("bonus_prompts")
        .insert({
          season_year: 2026,
          scope: "match",
          match_id: matchId,
          prompt_key: promptKey,
          ...promptWriteBase,
          display_order: 0,
        })
        .select("id")
        .single();
      if (insertErr) throw insertErr;
      promptId = inserted.id as string;
    }

    const { error: optionsErr } = await supabase.from("bonus_prompt_options").insert(
      template.options.map((label, sortOrder) => ({
        prompt_id: promptId,
        label,
        value: label,
        sort_order: sortOrder,
      })),
    );
    if (optionsErr) throw optionsErr;

    generated += 1;
  }

  return { generated, skipped };
}
