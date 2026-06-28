import type { SupabaseClient } from "@supabase/supabase-js";
import { isPlaceholderTeam } from "@/lib/domain/world-cup/advanced-bracket";

/** Distinct team names from Round of 32 fixtures (32 teams). */
export async function listRoundOf32Teams(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("home_team, away_team")
    .eq("season_year", seasonYear)
    .eq("stage_key", "round_of_32");

  if (error) throw error;

  const teams = new Set<string>();
  for (const row of data ?? []) {
    const home = String(row.home_team ?? "").trim();
    const away = String(row.away_team ?? "").trim();
    if (home && !isPlaceholderTeam(home)) teams.add(home);
    if (away && !isPlaceholderTeam(away)) teams.add(away);
  }

  return [...teams].sort((a, b) => a.localeCompare(b));
}
