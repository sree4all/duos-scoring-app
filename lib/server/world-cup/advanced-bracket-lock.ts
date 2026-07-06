import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ADVANCED_BRACKET_LOCK_FALLBACK_UTC,
  ADVANCED_BRACKET_LOCK_MATCH_NUMBER,
} from "@/lib/domain/world-cup/advanced-bracket";

export { ADVANCED_BRACKET_LOCK_FALLBACK_UTC };

/** Match 93 kickoff (Portugal vs Spain), or fallback when not imported yet. */
export async function getAdvancedBracketLockKickoffUtc(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<string> {
  const { data, error } = await supabase
    .from("matches")
    .select("match_time_utc")
    .eq("season_year", seasonYear)
    .eq("match_number", ADVANCED_BRACKET_LOCK_MATCH_NUMBER)
    .not("match_time_utc", "is", null)
    .maybeSingle();

  if (error) throw error;
  return (data?.match_time_utc as string | null) ?? ADVANCED_BRACKET_LOCK_FALLBACK_UTC;
}
