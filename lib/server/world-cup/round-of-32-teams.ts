import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildForecastEligibilityFromMatches,
  computeBracketState,
  type BracketState,
  type ForecastEligibility,
  type MatchResultRow,
} from "@/lib/domain/world-cup/forecast-eligibility";
import { PRE_SEMI_KNOCKOUT_MATCHES } from "@/lib/domain/world-cup/knockout-bracket";

async function loadKnockoutMatchResultRows(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<MatchResultRow[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("match_number, home_team, away_team, winner, status, stage_key")
    .eq("season_year", seasonYear)
    .in("match_number", [...PRE_SEMI_KNOCKOUT_MATCHES])
    .order("match_number", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    match_number: row.match_number as number | null,
    home_team: String(row.home_team ?? ""),
    away_team: String(row.away_team ?? ""),
    winner: (row.winner as string | null) ?? null,
    status: String(row.status ?? ""),
    tournament_stage: (row.stage_key as string | null) ?? null,
  }));
}

export async function loadForecastBracketState(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<BracketState> {
  const rows = await loadKnockoutMatchResultRows(supabase, seasonYear);
  return computeBracketState(rows);
}

/** Eligible teams and W97–W100 exclusion groups for tournament forecast UI. */
export async function loadForecastEligibility(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<ForecastEligibility> {
  const rows = await loadKnockoutMatchResultRows(supabase, seasonYear);
  return buildForecastEligibilityFromMatches(rows);
}

/** @deprecated Use {@link loadForecastEligibility}. */
export async function listRoundOf32Teams(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<string[]> {
  const eligibility = await loadForecastEligibility(supabase, seasonYear);
  return eligibility.eligible_teams;
}
