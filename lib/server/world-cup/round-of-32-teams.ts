import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildKnockoutBracket,
  KNOCKOUT_ELIMINATION_MATCH_NUMBERS,
  PRE_SEMI_KNOCKOUT_MATCHES,
  type KnockoutBracket,
  type KnockoutFixture,
} from "@/lib/domain/world-cup/knockout-bracket";
import { isPlaceholderTeam } from "@/lib/domain/world-cup/advanced-bracket";

type KnockoutMatchRow = {
  match_number: number;
  home_team: string;
  away_team: string;
  winner: string | null;
  status: string;
};

/** Losers from completed knockout matches (R32 through semi-finals). */
export async function loadKnockoutEliminatedTeams(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("matches")
    .select("home_team, away_team, winner")
    .eq("season_year", seasonYear)
    .in("match_number", [...KNOCKOUT_ELIMINATION_MATCH_NUMBERS])
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

/** @deprecated Use {@link loadKnockoutEliminatedTeams}. */
export async function loadRoundOf32EliminatedTeams(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<Set<string>> {
  return loadKnockoutEliminatedTeams(supabase, seasonYear);
}

async function loadKnockoutMatchRows(
  supabase: SupabaseClient,
  seasonYear = 2026,
  matchNumbers: readonly number[] = PRE_SEMI_KNOCKOUT_MATCHES,
): Promise<KnockoutMatchRow[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("match_number, external_key, home_team, away_team, winner, status")
    .eq("season_year", seasonYear)
    .in("match_number", [...matchNumbers])
    .order("match_number", { ascending: true });

  if (error) throw error;
  return (data ?? []) as KnockoutMatchRow[];
}

function fixtureTeamsFromRow(row: KnockoutMatchRow): [string, string] | null {
  const home = String(row.home_team ?? "").trim();
  const away = String(row.away_team ?? "").trim();
  if (isPlaceholderTeam(home) || isPlaceholderTeam(away)) return null;

  const winner = String(row.winner ?? "").trim();
  if (row.status === "completed" && winner && !isPlaceholderTeam(winner)) {
    return [winner, winner];
  }
  return [home, away];
}

/** Distinct team names from knockout fixtures, excluding eliminated teams. */
export async function listRoundOf32Teams(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<string[]> {
  const [rows, eliminated] = await Promise.all([
    loadKnockoutMatchRows(supabase, seasonYear, KNOCKOUT_ELIMINATION_MATCH_NUMBERS),
    loadKnockoutEliminatedTeams(supabase, seasonYear),
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

/** Knockout fixtures with team names for bracket-path UI rules (R32 through QF). */
export async function loadKnockoutBracket(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<KnockoutBracket> {
  const rows = await loadKnockoutMatchRows(supabase, seasonYear, PRE_SEMI_KNOCKOUT_MATCHES);

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
