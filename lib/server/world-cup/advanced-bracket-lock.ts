import type { SupabaseClient } from "@supabase/supabase-js";
import { ADVANCED_BRACKET_LOCK_MATCH_NUMBER } from "@/lib/domain/world-cup/advanced-bracket";
import { roundOf32KickoffUtc } from "@/lib/domain/world-cup/round-of-32-fixtures";

/** Fallback when match 88 is not imported yet (FIFA UTC kickoff). */
export const ADVANCED_BRACKET_LOCK_FALLBACK_UTC =
  roundOf32KickoffUtc(88) ?? "2026-07-03T18:00:00.000Z";

export async function getAdvancedBracketLockKickoffUtc(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<string> {
  const { data, error } = await supabase
    .from("matches")
    .select("match_time_utc")
    .eq("season_year", seasonYear)
    .eq("match_number", ADVANCED_BRACKET_LOCK_MATCH_NUMBER)
    .maybeSingle();

  if (error) throw error;
  const kickoff = (data?.match_time_utc as string | null) ?? null;
  return kickoff ?? ADVANCED_BRACKET_LOCK_FALLBACK_UTC;
}
