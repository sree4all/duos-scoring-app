import type { SupabaseClient } from "@supabase/supabase-js";

/** Mirror season points_ledger match/bonus rows into contest_points_ledger for group leaderboard. */
export async function mirrorMatchLedgerToContest(
  supabase: SupabaseClient,
  contestId: string,
  eventId: string,
  matchId: string,
): Promise<void> {
  const { data: ledger, error } = await supabase
    .from("points_ledger")
    .select("user_id, source_type, points_delta, reason")
    .eq("source_id", matchId)
    .in("source_type", ["match", "bonus"]);

  if (error) throw error;

  const { error: delErr } = await supabase
    .from("contest_points_ledger")
    .delete()
    .eq("contest_id", contestId)
    .eq("event_id", eventId)
    .in("action_type", ["match_winner", "match_winner_miss", "match_bonus", "bonus"]);

  if (delErr) throw delErr;

  const rows = (ledger ?? []).map((row) => ({
    contest_id: contestId,
    event_id: eventId,
    participant_id: row.user_id as string,
    action_type: mapReasonToAction(row.reason as string | null, row.source_type as string),
    points_delta: Number(row.points_delta ?? 0),
    reason_text: row.reason as string | null,
    correlation_id: `match:${matchId}`,
  }));

  if (rows.length === 0) return;

  const { error: insErr } = await supabase.from("contest_points_ledger").insert(rows);
  if (insErr) throw insErr;
}

function mapReasonToAction(reason: string | null, sourceType: string): string {
  if (reason === "match_winner_miss") return "match_winner_miss";
  if (reason?.startsWith("match_bonus_miss")) return "match_bonus";
  if (sourceType === "bonus" || reason?.startsWith("match_bonus")) return "match_bonus";
  return "match_winner";
}
