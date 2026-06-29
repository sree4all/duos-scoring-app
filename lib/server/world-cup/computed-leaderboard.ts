import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseMatchNumberFromExternalKey,
  resolveScoringStageKey,
} from "@/lib/domain/world-cup/match-stage";
import { resolveStagePointsFromDb } from "@/lib/scoring/stage-points";
import { winnerPickDelta } from "@/lib/scoring/winner-pick-delta";
import type { ContestLeaderboardEntry } from "@/lib/server/world-cup/contest-leaderboard";

type CompletedMatchRow = {
  matchId: string;
  winner: string | null;
  stageKey: string | undefined;
};

/**
 * Standings from predictions + official results + stage rules (no ledger mirror).
 * Uses service role so scoring is not blocked by points_ledger RLS or stale mirrors.
 */
export async function computePredictionContestLeaderboard(
  supabase: SupabaseClient,
  contestId: string,
): Promise<ContestLeaderboardEntry[]> {
  const { data: contest, error: cErr } = await supabase
    .from("contests")
    .select("group_id")
    .eq("id", contestId)
    .maybeSingle();
  if (cErr) throw cErr;
  if (!contest?.group_id) throw new Error("Contest has no group");

  const groupId = contest.group_id as string;

  const { data: members, error: mErr } = await supabase
    .from("group_memberships")
    .select("user_id")
    .eq("group_id", groupId)
    .is("removed_at", null);
  if (mErr) throw mErr;

  const memberIds = (members ?? []).map((m) => m.user_id as string);
  const totals = new Map<string, number>();
  for (const id of memberIds) totals.set(id, 0);

  const { data: rules, error: rErr } = await supabase
    .from("contest_stage_scoring_rules")
    .select("stage_key, correct_points, incorrect_penalty")
    .eq("contest_id", contestId);
  if (rErr) throw rErr;

  const rulesByStage = new Map(
    (rules ?? []).map((r) => [
      r.stage_key as string,
      {
        correct: r.correct_points as number | null,
        incorrect: r.incorrect_penalty as number | null,
      },
    ]),
  );

  const { data: events, error: eErr } = await supabase
    .from("events")
    .select(
      "source_match_id, matches!inner(id, status, winner, stage_key, match_number, external_key)",
    )
    .eq("contest_id", contestId)
    .eq("voided", false);
  if (eErr) throw eErr;

  const completed: CompletedMatchRow[] = [];
  for (const ev of events ?? []) {
    const joined = ev.matches as
      | {
          id: string;
          status: string;
          winner: string | null;
          stage_key: string | null;
          match_number: number | null;
          external_key: string | null;
        }
      | {
          id: string;
          status: string;
          winner: string | null;
          stage_key: string | null;
          match_number: number | null;
          external_key: string | null;
        }[]
      | null;
    const match = Array.isArray(joined) ? joined[0] : joined;
    if (!match || match.status !== "completed") continue;

    const matchNumber =
      match.match_number ?? parseMatchNumberFromExternalKey(match.external_key);
    completed.push({
      matchId: match.id,
      winner: match.winner,
      stageKey: resolveScoringStageKey(match.stage_key, matchNumber),
    });
  }

  const matchIds = completed.map((m) => m.matchId);
  const pickByUserMatch = new Map<string, string>();

  if (matchIds.length > 0) {
    const { data: predictions, error: pErr } = await supabase
      .from("predictions")
      .select("user_id, match_id, predicted_winner")
      .in("match_id", matchIds);
    if (pErr) throw pErr;

    for (const p of predictions ?? []) {
      pickByUserMatch.set(
        `${p.user_id as string}:${p.match_id as string}`,
        (p.predicted_winner as string) ?? "",
      );
    }

    const { data: bonusRows, error: bErr } = await supabase
      .from("points_ledger")
      .select("user_id, points_delta")
      .in("source_id", matchIds)
      .eq("source_type", "bonus");
    if (bErr) throw bErr;

    for (const row of bonusRows ?? []) {
      const uid = row.user_id as string;
      totals.set(uid, (totals.get(uid) ?? 0) + Number(row.points_delta ?? 0));
    }
  }

  for (const match of completed) {
    const rule = match.stageKey ? rulesByStage.get(match.stageKey) : undefined;
    const pts = resolveStagePointsFromDb(
      match.stageKey,
      rule?.correct ?? null,
      rule?.incorrect ?? null,
      2,
    );

    for (const uid of memberIds) {
      const pick = pickByUserMatch.get(`${uid}:${match.matchId}`);
      const delta = winnerPickDelta(pick, match.winner, pts.correct, pts.incorrect);
      if (delta !== 0) {
        totals.set(uid, (totals.get(uid) ?? 0) + delta);
      }
    }
  }

  const { data: extraRows, error: xErr } = await supabase
    .from("contest_points_ledger")
    .select("participant_id, points_delta")
    .eq("contest_id", contestId)
    .not("correlation_id", "like", "match:%");
  if (xErr) throw xErr;

  for (const row of extraRows ?? []) {
    const uid = row.participant_id as string;
    totals.set(uid, (totals.get(uid) ?? 0) + Number(row.points_delta ?? 0));
  }

  return memberIds.map((participantId) => ({
    participantId,
    totalPoints: totals.get(participantId) ?? 0,
  }));
}
