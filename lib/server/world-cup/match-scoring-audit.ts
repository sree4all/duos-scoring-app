import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseMatchNumberFromExternalKey,
  resolveScoringStageKey,
} from "@/lib/domain/world-cup/match-stage";
import { resolveStagePointsFromDb } from "@/lib/scoring/stage-points";
import { winnerPickDelta } from "@/lib/scoring/winner-pick-delta";

export type MatchScoringAuditRow = {
  participantId: string;
  displayName: string;
  predictedWinner: string | null;
  expectedDelta: number;
  seasonLedgerDelta: number | null;
  contestLedgerDelta: number | null;
};

export type MatchScoringAudit = {
  matchNumber: number;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  officialWinner: string | null;
  status: string;
  stageKey: string | null;
  correctPoints: number;
  incorrectPenalty: number;
  rows: MatchScoringAuditRow[];
};

export async function buildMatchScoringAudit(
  supabase: SupabaseClient,
  contestId: string,
  groupId: string,
  matchNumber: number,
): Promise<MatchScoringAudit | null> {
  const { data: match, error: mErr } = await supabase
    .from("matches")
    .select("id, home_team, away_team, winner, status, stage_key, match_number, external_key")
    .eq("season_year", 2026)
    .eq("match_number", matchNumber)
    .maybeSingle();
  if (mErr) throw mErr;
  if (!match) return null;

  const matchId = match.id as string;
  const resolvedNumber =
    (match.match_number as number | null) ??
    parseMatchNumberFromExternalKey(match.external_key as string | null);
  const stageKey = resolveScoringStageKey(match.stage_key as string | null, resolvedNumber);

  const { data: rule } = await supabase
    .from("contest_stage_scoring_rules")
    .select("correct_points, incorrect_penalty")
    .eq("contest_id", contestId)
    .eq("stage_key", stageKey ?? "group_stage")
    .maybeSingle();

  const pts = resolveStagePointsFromDb(
    stageKey,
    (rule?.correct_points as number | null) ?? null,
    (rule?.incorrect_penalty as number | null) ?? null,
    2,
  );

  const { data: members } = await supabase
    .from("group_memberships")
    .select("user_id")
    .eq("group_id", groupId)
    .is("removed_at", null);

  const memberIds = (members ?? []).map((m) => m.user_id as string);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", memberIds.length ? memberIds : ["00000000-0000-0000-0000-000000000000"]);

  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id as string, ((p.display_name as string) ?? "?").trim() || "?"]),
  );

  const { data: predictions } = await supabase
    .from("predictions")
    .select("user_id, predicted_winner")
    .eq("match_id", matchId);

  const pickByUser = new Map(
    (predictions ?? []).map((p) => [p.user_id as string, (p.predicted_winner as string | null) ?? null]),
  );

  const { data: seasonRows } = await supabase
    .from("points_ledger")
    .select("user_id, points_delta")
    .eq("source_id", matchId)
    .eq("source_type", "match");

  const seasonByUser = new Map<string, number>();
  for (const row of seasonRows ?? []) {
    const uid = row.user_id as string;
    seasonByUser.set(uid, (seasonByUser.get(uid) ?? 0) + Number(row.points_delta ?? 0));
  }

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("contest_id", contestId)
    .eq("source_match_id", matchId)
    .maybeSingle();

  const contestByUser = new Map<string, number>();
  if (event?.id) {
    const { data: contestRows } = await supabase
      .from("contest_points_ledger")
      .select("participant_id, points_delta")
      .eq("contest_id", contestId)
      .eq("event_id", event.id as string)
      .in("action_type", ["match_winner", "match_winner_miss"]);

    for (const row of contestRows ?? []) {
      const uid = row.participant_id as string;
      contestByUser.set(uid, (contestByUser.get(uid) ?? 0) + Number(row.points_delta ?? 0));
    }
  }

  const winner = match.winner as string | null;
  const rows: MatchScoringAuditRow[] = memberIds.map((participantId) => {
    const pick = pickByUser.get(participantId) ?? null;
    return {
      participantId,
      displayName: nameById.get(participantId) ?? participantId.slice(0, 8),
      predictedWinner: pick,
      expectedDelta: winnerPickDelta(pick, winner, pts.correct, pts.incorrect),
      seasonLedgerDelta: seasonByUser.has(participantId) ? seasonByUser.get(participantId)! : null,
      contestLedgerDelta: contestByUser.has(participantId)
        ? contestByUser.get(participantId)!
        : null,
    };
  });

  rows.sort((a, b) => a.displayName.localeCompare(b.displayName));

  return {
    matchNumber,
    matchId,
    homeTeam: match.home_team as string,
    awayTeam: match.away_team as string,
    officialWinner: winner,
    status: match.status as string,
    stageKey: stageKey ?? null,
    correctPoints: pts.correct,
    incorrectPenalty: pts.incorrect,
    rows,
  };
}
