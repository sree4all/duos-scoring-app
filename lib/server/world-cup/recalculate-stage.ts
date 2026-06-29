import type { SupabaseClient } from "@supabase/supabase-js";
import { applyMatchScoring } from "@/lib/scoring/match-scoring";
import { mirrorMatchLedgerToContest } from "@/lib/server/world-cup/contest-ledger-mirror";

export async function recalculateStageScoring(
  supabase: SupabaseClient,
  contestId: string,
  stageKey: string,
  reason: string,
  seasonYear = 2026,
): Promise<{ rescored: number; errors: string[] }> {
  const { data: events, error } = await supabase
    .from("events")
    .select("id, source_match_id, matches!inner(status, stage_key)")
    .eq("contest_id", contestId)
    .eq("stage_key", stageKey)
    .eq("voided", false);

  if (error) throw error;

  let rescored = 0;
  const errors: string[] = [];

  for (const ev of events ?? []) {
    const joined = ev.matches as
      | { status: string; stage_key: string }
      | { status: string; stage_key: string }[]
      | null;
    const match = Array.isArray(joined) ? joined[0] : joined;
    if (!match || match.status !== "completed") continue;
    const matchId = ev.source_match_id as string;
    const outcome = await applyMatchScoring(supabase, matchId, seasonYear, {
      contestId,
      stageKey,
      auditReason: `recalculate_stage:${stageKey}:${reason}`,
    });
    if (outcome.ok) {
      await mirrorMatchLedgerToContest(
        supabase,
        contestId,
        ev.id as string,
        matchId,
      );
      rescored++;
    } else {
      errors.push(`${matchId}: ${outcome.error}`);
    }
  }

  return { rescored, errors };
}
