import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseMatchNumberFromExternalKey,
  resolveScoringStageKey,
} from "@/lib/domain/world-cup/match-stage";
import { applyMatchScoring } from "@/lib/scoring/match-scoring";

export async function recalculateStageScoring(
  supabase: SupabaseClient,
  contestId: string,
  stageKey: string,
  reason: string,
  seasonYear = 2026,
): Promise<{ rescored: number; errors: string[] }> {
  const { data: events, error } = await supabase
    .from("events")
    .select("id, source_match_id, stage_key, matches!inner(status, stage_key, match_number, external_key)")
    .eq("contest_id", contestId)
    .eq("voided", false);

  if (error) throw error;

  let rescored = 0;
  const errors: string[] = [];

  for (const ev of events ?? []) {
    const joined = ev.matches as
      | {
          status: string;
          stage_key: string | null;
          match_number: number | null;
          external_key: string | null;
        }
      | {
          status: string;
          stage_key: string | null;
          match_number: number | null;
          external_key: string | null;
        }[]
      | null;
    const match = Array.isArray(joined) ? joined[0] : joined;
    if (!match || match.status !== "completed") continue;

    const matchNumber =
      match.match_number ??
      parseMatchNumberFromExternalKey(match.external_key);
    const matchStageKey = resolveScoringStageKey(match.stage_key, matchNumber);
    if (matchStageKey !== stageKey) continue;

    const matchId = ev.source_match_id as string;
    const outcome = await applyMatchScoring(supabase, matchId, seasonYear, {
      contestId,
      stageKey: matchStageKey,
      auditReason: `recalculate_stage:${stageKey}:${reason}`,
    });
    if (outcome.ok) {
      rescored++;
    } else {
      errors.push(`${matchId}: ${outcome.error}`);
    }
  }

  return { rescored, errors };
}
