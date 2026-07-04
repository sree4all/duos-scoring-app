import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildKnockoutBracket,
  type KnockoutBracket,
  type KnockoutFixture,
  ROUND_OF_32_MATCH_NUMBERS,
} from "@/lib/domain/world-cup/knockout-bracket";
import { isPlaceholderTeam } from "@/lib/domain/world-cup/advanced-bracket";

type RoundOf32MatchRow = {
  match_number: number;
  home_team: string;
  away_team: string;
  winner: string | null;
  status: string;
};

/** Losers from completed Round of 32 matches. */
export async function loadRoundOf32EliminatedTeams(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("matches")
    .select("home_team, away_team, winner")
    .eq("season_year", seasonYear)
    .in("match_number", [...ROUND_OF_32_MATCH_NUMBERS])
    .eq("status", "completed")
    .not("winner", "is", null);

  if (error) throw error;

  const eliminated = new Set<string>();
  for (const row of data ?? []) {
    const winner = String(row.winner ?? "").trim();
    if (!winner || isPlaceholderTeam(winner)) continue;
    for (const team of [String(row.home_team ?? "").trim(), String(row.away_team ?? "").trim()]) {
      if (team && team !== winner && !isPlaceholderTeam(team)) eliminated.add(team);
    }
  }
  return eliminated;
}

async function loadRoundOf32MatchRows(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<RoundOf32MatchRow[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("match_number, external_key, home_team, away_team, winner, status")
    .eq("season_year", seasonYear)
    .in("match_number", [...ROUND_OF_32_MATCH_NUMBERS])
    .order("match_number", { ascending: true });

  if (error) throw error;
  return (data ?? []) as RoundOf32MatchRow[];
}

function fixtureTeamsFromRow(row: RoundOf32MatchRow): [string, string] | null {
  const home = String(row.home_team ?? "").trim();
  const away = String(row.away_team ?? "").trim();
  if (isPlaceholderTeam(home) || isPlaceholderTeam(away)) return null;

  const winner = String(row.winner ?? "").trim();
  if (row.status === "completed" && winner && !isPlaceholderTeam(winner)) {
    return [winner, winner];
  }
  return [home, away];
}

/** Distinct team names from Round of 32 fixtures, excluding eliminated teams. */
export async function listRoundOf32Teams(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<string[]> {
  const [rows, eliminated] = await Promise.all([
    loadRoundOf32MatchRows(supabase, seasonYear),
    loadRoundOf32EliminatedTeams(supabase, seasonYear),
  ]);

  const teams = new Set<string>();
  for (const row of rows) {
    const pair = fixtureTeamsFromRow(row);
    if (!pair) continue;
    for (const team of pair) {
      if (team && !eliminated.has(team)) teams.add(team);
    }
  }
  return [...teams].sort((a, b) => a.localeCompare(b));
}

/** Round of 32 fixtures with team names for bracket-path UI rules. */
export async function loadKnockoutBracket(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<KnockoutBracket> {
  const rows = await loadRoundOf32MatchRows(supabase, seasonYear);

  const fixtures: KnockoutFixture[] = [];
  for (const row of rows) {
    const pair = fixtureTeamsFromRow(row);
    if (!pair) continue;
    fixtures.push({
      matchNumber: Number(row.match_number),
      homeTeam: pair[0],
      awayTeam: pair[1],
    });
  }

  return buildKnockoutBracket(fixtures);
}

export function serializeKnockoutFixtures(bracket: KnockoutBracket): KnockoutFixture[] {
  return [...bracket.fixtures.values()].sort((a, b) => a.matchNumber - b.matchNumber);
}
