import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ADVANCED_BRACKET_LOCK_FALLBACK_UTC,
  ROUND_OF_16_MATCH_NUMBER_MAX,
  ROUND_OF_16_MATCH_NUMBER_MIN,
} from "@/lib/domain/world-cup/advanced-bracket";

export { ADVANCED_BRACKET_LOCK_FALLBACK_UTC };

/** Earliest imported Round of 16 kickoff, extended through the tournament forecast deadline. */
export async function getAdvancedBracketLockKickoffUtc(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<string> {
  const { data, error } = await supabase
    .from("matches")
    .select("match_time_utc")
    .eq("season_year", seasonYear)
    .gte("match_number", ROUND_OF_16_MATCH_NUMBER_MIN)
    .lte("match_number", ROUND_OF_16_MATCH_NUMBER_MAX)
    .not("match_time_utc", "is", null)
    .order("match_time_utc", { ascending: true })
    .limit(1);

  if (error) throw error;
  const kickoff = (data?.[0]?.match_time_utc as string | null) ?? null;
  const deadline = ADVANCED_BRACKET_LOCK_FALLBACK_UTC;
  if (!kickoff) return deadline;
  return new Date(kickoff) > new Date(deadline) ? kickoff : deadline;
}
