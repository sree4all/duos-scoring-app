import type { SupabaseClient } from "@supabase/supabase-js";
import { isPlaceholderTeam } from "@/lib/domain/world-cup/advanced-bracket";

function uniqueTeams(rows: { home_team: string; away_team: string }[]): string[] {
  const teams = new Set<string>();
  for (const row of rows) {
    const home = String(row.home_team ?? "").trim();
    const away = String(row.away_team ?? "").trim();
    if (home && !isPlaceholderTeam(home)) teams.add(home);
    if (away && !isPlaceholderTeam(away)) teams.add(away);
  }
  return [...teams].sort((a, b) => a.localeCompare(b));
}

/** Four teams that reached the semi-finals (from semi-finals fixtures). */
export async function deriveSemiFinalistTeams(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("home_team, away_team")
    .eq("season_year", seasonYear)
    .eq("stage_key", "semi_finals");

  if (error) throw error;
  return uniqueTeams((data ?? []) as { home_team: string; away_team: string }[]);
}

/** Two finalists — winners of completed semi-final matches. */
export async function deriveFinalistTeams(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("winner")
    .eq("season_year", seasonYear)
    .eq("stage_key", "semi_finals")
    .eq("status", "completed");

  if (error) throw error;

  const teams = new Set<string>();
  for (const row of data ?? []) {
    const winner = String(row.winner ?? "").trim();
    if (winner && !isPlaceholderTeam(winner)) teams.add(winner);
  }
  return [...teams].sort((a, b) => a.localeCompare(b));
}

/** Tournament winner from the completed final. */
export async function deriveTournamentWinner(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("matches")
    .select("winner")
    .eq("season_year", seasonYear)
    .eq("stage_key", "final")
    .eq("status", "completed")
    .maybeSingle();

  if (error) throw error;
  const winner = String(data?.winner ?? "").trim();
  if (!winner || isPlaceholderTeam(winner)) return null;
  return winner;
}

export async function isStageFullyCompleted(
  supabase: SupabaseClient,
  stageKey: string,
  seasonYear = 2026,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("matches")
    .select("status")
    .eq("season_year", seasonYear)
    .eq("stage_key", stageKey);

  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return false;
  return rows.every((r) => (r.status as string) === "completed");
}
