import type { SupabaseClient } from "@supabase/supabase-js";
import { aggregateLeaderboardForContest } from "@/lib/server/generalized-scoring/scoring-projection-service";
import { fetchAllContestLedgerRows } from "@/lib/server/world-cup/contest-ledger-query";

export type ContestLeaderboardEntry = {
  participantId: string;
  totalPoints: number;
};

/**
 * Prediction contests: sum match/bonus lines from season points_ledger (source of
 * truth) plus non-match contest ledger rows (advanced bracket, voids, etc.).
 */
export async function fetchPredictionContestLeaderboard(
  supabase: SupabaseClient,
  contestId: string,
): Promise<ContestLeaderboardEntry[]> {
  const { data, error } = await supabase.rpc("contest_leaderboard_totals", {
    p_contest_id: contestId,
  });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    participantId: row.participant_id as string,
    totalPoints: Number(row.total_points ?? 0),
  }));
}

/** Rummy and fallback: contest-scoped ledger only. */
export async function fetchContestLedgerLeaderboard(
  supabase: SupabaseClient,
  contestId: string,
  options?: { lowerTotalWins?: boolean },
): Promise<ContestLeaderboardEntry[]> {
  const ledger = await fetchAllContestLedgerRows(supabase, contestId);
  return aggregateLeaderboardForContest(ledger, options);
}

export async function fetchContestLeaderboard(
  supabase: SupabaseClient,
  contestId: string,
  formatLabel: string | null | undefined,
  options?: { lowerTotalWins?: boolean },
): Promise<ContestLeaderboardEntry[]> {
  const isRummy = formatLabel === "rummy_points";
  if (isRummy) {
    return fetchContestLedgerLeaderboard(supabase, contestId, options);
  }

  try {
    return await fetchPredictionContestLeaderboard(supabase, contestId);
  } catch {
    return fetchContestLedgerLeaderboard(supabase, contestId, options);
  }
}
