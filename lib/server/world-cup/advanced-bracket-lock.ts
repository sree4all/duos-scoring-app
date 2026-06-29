import type { SupabaseClient } from "@supabase/supabase-js";
import { ADVANCED_BRACKET_LOCK_MATCH_NUMBER } from "@/lib/domain/world-cup/advanced-bracket";
import { easternWallClockToIsoUtc } from "@/lib/utils/eastern-time";

/** Fallback when match 88 is not imported yet: July 3, 2026 2:00 PM Eastern. */
export const ADVANCED_BRACKET_LOCK_FALLBACK_UTC = easternWallClockToIsoUtc(
  "2026-07-03",
  "14:00:00",
);

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
