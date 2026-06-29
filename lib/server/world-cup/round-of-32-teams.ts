import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildKnockoutBracket,
  type KnockoutBracket,
  type KnockoutFixture,
  ROUND_OF_32_MATCH_NUMBERS,
} from "@/lib/domain/world-cup/knockout-bracket";
import { isPlaceholderTeam } from "@/lib/domain/world-cup/advanced-bracket";

/** Distinct team names from Round of 32 fixtures (32 teams). */
export async function listRoundOf32Teams(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<string[]> {
  const bracket = await loadKnockoutBracket(supabase, seasonYear);
  const teams = new Set<string>();
  for (const matchNumber of ROUND_OF_32_MATCH_NUMBERS) {
    for (const team of bracket.fixtures.get(matchNumber)
      ? [bracket.fixtures.get(matchNumber)!.homeTeam, bracket.fixtures.get(matchNumber)!.awayTeam]
      : []) {
      if (team && !isPlaceholderTeam(team)) teams.add(team);
    }
  }
  return [...teams].sort((a, b) => a.localeCompare(b));
}

/** Round of 32 fixtures with team names for bracket-path UI rules. */
export async function loadKnockoutBracket(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<KnockoutBracket> {
  const { data, error } = await supabase
    .from("matches")
    .select("match_number, external_key, home_team, away_team")
    .eq("season_year", seasonYear)
    .in("match_number", [...ROUND_OF_32_MATCH_NUMBERS])
    .order("match_number", { ascending: true });

  if (error) throw error;

  const fixtures: KnockoutFixture[] = [];
  for (const row of data ?? []) {
    const home = String(row.home_team ?? "").trim();
    const away = String(row.away_team ?? "").trim();
    if (isPlaceholderTeam(home) || isPlaceholderTeam(away)) continue;
    fixtures.push({
      matchNumber: Number(row.match_number),
      homeTeam: home,
      awayTeam: away,
    });
  }

  return buildKnockoutBracket(fixtures);
}

export function serializeKnockoutFixtures(bracket: KnockoutBracket): KnockoutFixture[] {
  return [...bracket.fixtures.values()].sort((a, b) => a.matchNumber - b.matchNumber);
}
