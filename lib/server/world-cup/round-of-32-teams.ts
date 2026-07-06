import type { SupabaseClient } from "@supabase/supabase-js";
import {
  activeTeamsFromKnockoutFixtures,
  buildEffectiveKnockoutBracket,
  buildEffectiveKnockoutFixtures,
  type KnockoutMatchState,
} from "@/lib/domain/world-cup/knockout-bracket-build";
import {
  KNOCKOUT_ELIMINATION_MATCH_NUMBERS,
  PRE_SEMI_KNOCKOUT_MATCHES,
  type KnockoutBracket,
  type KnockoutFixture,
} from "@/lib/domain/world-cup/knockout-bracket";
import { isPlaceholderTeam } from "@/lib/domain/world-cup/advanced-bracket";

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
): Promise<KnockoutMatchState[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("match_number, home_team, away_team, winner, status")
    .eq("season_year", seasonYear)
    .in("match_number", [...matchNumbers])
    .order("match_number", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    matchNumber: Number(row.match_number),
    homeTeam: String(row.home_team ?? ""),
    awayTeam: String(row.away_team ?? ""),
    winner: (row.winner as string | null) ?? null,
    status: String(row.status ?? ""),
  }));
}

/** Distinct team names from knockout fixtures, excluding eliminated teams. */
export async function listRoundOf32Teams(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<string[]> {
  const [rows, eliminated] = await Promise.all([
    loadKnockoutMatchRows(supabase, seasonYear, PRE_SEMI_KNOCKOUT_MATCHES),
    loadKnockoutEliminatedTeams(supabase, seasonYear),
  ]);

  const fixtures = buildEffectiveKnockoutFixtures(rows);
  return activeTeamsFromKnockoutFixtures(fixtures, eliminated);
}

/** Knockout fixtures with team names for bracket-path UI rules (R32 through QF). */
export async function loadKnockoutBracket(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<KnockoutBracket> {
  const rows = await loadKnockoutMatchRows(supabase, seasonYear, PRE_SEMI_KNOCKOUT_MATCHES);
  return buildEffectiveKnockoutBracket(rows);
}

export function serializeKnockoutFixtures(bracket: KnockoutBracket): KnockoutFixture[] {
  return [...bracket.fixtures.values()].sort((a, b) => a.matchNumber - b.matchNumber);
}
