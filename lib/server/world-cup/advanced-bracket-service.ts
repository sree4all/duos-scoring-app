import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ADVANCED_BRACKET_POINTS,
  type AdvancedBracketOfficial,
  type AdvancedBracketPicks,
  type AdvancedBracketScoringPhase,
  countCorrectPicks,
} from "@/lib/domain/world-cup/advanced-bracket";
import {
  deriveFinalistTeams,
  deriveSemiFinalistTeams,
  deriveTournamentWinner,
  isStageFullyCompleted,
} from "@/lib/server/world-cup/advanced-bracket-official";
import { StageRulesRepository } from "@/lib/server/world-cup/stage-rules-repository";
import { getAdvancedBracketLockKickoffUtc } from "@/lib/server/world-cup/advanced-bracket-lock";
import { validateAdvancedBracketPicks } from "@/lib/domain/world-cup/advanced-bracket";
import type { BracketState } from "@/lib/domain/world-cup/forecast-eligibility";
import { worldCupCopy } from "@/lib/copy/world-cup";
import { isPredictionsLocked } from "@/lib/utils/match-lock";

export type AdvancedBracketAccess = {
  open: boolean;
  locked: boolean;
  message?: string;
};

export async function getAdvancedBracketAccess(
  supabase: SupabaseClient,
  contestId: string,
  seasonYear = 2026,
): Promise<AdvancedBracketAccess> {
  const repo = new StageRulesRepository(supabase);
  const roundOf32Revealed = await repo.isStageRevealed(contestId, "round_of_32");
  if (!roundOf32Revealed) {
    return { open: false, locked: true, message: worldCupCopy.advancedBracket.notOpenYet };
  }

  const kickoff = await getAdvancedBracketLockKickoffUtc(supabase, seasonYear);
  const locked = isPredictionsLocked(kickoff, null);

  return {
    open: true,
    locked,
    message: locked
      ? worldCupCopy.advancedBracket.locked
      : undefined,
  };
}

export async function loadUserAdvancedBracketPicks(
  supabase: SupabaseClient,
  contestId: string,
  userId: string,
): Promise<AdvancedBracketPicks | null> {
  const { data, error } = await supabase
    .from("advanced_bracket_predictions")
    .select("semi_finalist_teams, finalist_teams, winner_team")
    .eq("contest_id", contestId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    semiFinalistTeams: (data.semi_finalist_teams as string[]) ?? [],
    finalistTeams: (data.finalist_teams as string[]) ?? [],
    winnerTeam: (data.winner_team as string | null) ?? null,
  };
}

export async function loadAdvancedBracketOfficial(
  supabase: SupabaseClient,
  contestId: string,
): Promise<AdvancedBracketOfficial | null> {
  const { data, error } = await supabase
    .from("advanced_bracket_official")
    .select(
      "semi_finalist_teams, finalist_teams, winner_team, semi_finalists_scored_at, finalists_scored_at, winner_scored_at",
    )
    .eq("contest_id", contestId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    semiFinalistTeams: (data.semi_finalist_teams as string[]) ?? [],
    finalistTeams: (data.finalist_teams as string[]) ?? [],
    winnerTeam: (data.winner_team as string | null) ?? null,
    semiFinalistsScoredAt: (data.semi_finalists_scored_at as string | null) ?? null,
    finalistsScoredAt: (data.finalists_scored_at as string | null) ?? null,
    winnerScoredAt: (data.winner_scored_at as string | null) ?? null,
  };
}

export async function saveUserAdvancedBracketPicks(
  supabase: SupabaseClient,
  contestId: string,
  userId: string,
  picks: AdvancedBracketPicks,
  eligibleTeams: string[],
  bracketState: BracketState,
  seasonYear = 2026,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await getAdvancedBracketAccess(supabase, contestId, seasonYear);
  if (!access.open) return { ok: false, error: access.message ?? "Not open yet." };
  if (access.locked) return { ok: false, error: worldCupCopy.advancedBracket.locked };

  const validationError = validateAdvancedBracketPicks(picks, eligibleTeams, bracketState);
  if (validationError) return { ok: false, error: validationError };

  const now = new Date().toISOString();
  const { error } = await supabase.from("advanced_bracket_predictions").upsert(
    {
      contest_id: contestId,
      user_id: userId,
      semi_finalist_teams: picks.semiFinalistTeams,
      finalist_teams: picks.finalistTeams,
      winner_team: picks.winnerTeam,
      updated_at: now,
    },
    { onConflict: "contest_id,user_id" },
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export type AdvancedBracketScoreOutcome =
  | { ok: true; rowsAwarded: number; officialTeams: string[] }
  | { ok: false; error: string };

export async function applyAdvancedBracketScoring(
  supabase: SupabaseClient,
  contestId: string,
  phase: AdvancedBracketScoringPhase,
  seasonYear = 2026,
): Promise<AdvancedBracketScoreOutcome> {
  if (phase === "semi_finalists") {
    const complete = await isStageFullyCompleted(supabase, "semi_finals", seasonYear);
    if (!complete) {
      return { ok: false, error: "Semi-finals stage is not fully completed yet." };
    }
    const official = await deriveSemiFinalistTeams(supabase, seasonYear);
    if (official.length !== 4) {
      return { ok: false, error: "Could not determine four semi-finalist teams from fixtures." };
    }
    return scorePhase(supabase, contestId, phase, official, ADVANCED_BRACKET_POINTS.semiFinalist);
  }

  if (phase === "finalists") {
    const finalComplete = await isStageFullyCompleted(supabase, "final", seasonYear);
    if (!finalComplete) {
      return { ok: false, error: "Final stage must be completed before scoring finalists." };
    }
    const sfComplete = await isStageFullyCompleted(supabase, "semi_finals", seasonYear);
    if (!sfComplete) {
      return { ok: false, error: "Semi-finals must be completed before scoring finalists." };
    }
    const official = await deriveFinalistTeams(supabase, seasonYear);
    if (official.length !== 2) {
      return { ok: false, error: "Could not determine two finalists from semi-final results." };
    }
    return scorePhase(supabase, contestId, phase, official, ADVANCED_BRACKET_POINTS.finalist);
  }

  const complete = await isStageFullyCompleted(supabase, "final", seasonYear);
  if (!complete) {
    return { ok: false, error: "Final match is not completed yet." };
  }
  const winner = await deriveTournamentWinner(supabase, seasonYear);
  if (!winner) {
    return { ok: false, error: "Could not determine tournament winner from final result." };
  }
  return scorePhase(supabase, contestId, phase, [winner], ADVANCED_BRACKET_POINTS.winner);
}

async function scorePhase(
  supabase: SupabaseClient,
  contestId: string,
  phase: AdvancedBracketScoringPhase,
  officialTeams: string[],
  pointsPerHit: number,
): Promise<AdvancedBracketScoreOutcome> {
  const pickColumn =
    phase === "semi_finalists"
      ? "semi_finalist_teams"
      : phase === "finalists"
        ? "finalist_teams"
        : "winner_team";

  const { data: predictions, error: pErr } = await supabase
    .from("advanced_bracket_predictions")
    .select(`user_id, ${pickColumn}`)
    .eq("contest_id", contestId);

  if (pErr) return { ok: false, error: pErr.message };

  const correlationId = `advanced_bracket:${phase}:${contestId}`;
  const actionType = `advanced_bracket_${phase}`;

  const { error: delErr } = await supabase
    .from("contest_points_ledger")
    .delete()
    .eq("contest_id", contestId)
    .eq("correlation_id", correlationId);

  if (delErr) return { ok: false, error: delErr.message };

  const now = new Date().toISOString();
  const ledgerRows: {
    contest_id: string;
    event_id: null;
    participant_id: string;
    action_type: string;
    points_delta: number;
    reason_text: string;
    correlation_id: string;
  }[] = [];

  for (const row of predictions ?? []) {
    const uid = row.user_id as string;
    const record = row as Record<string, unknown>;
    const rawPicks =
      phase === "winner"
        ? [String(record.winner_team ?? "").trim()].filter(Boolean)
        : ((record[pickColumn] as string[]) ?? []);

    const hits = countCorrectPicks(rawPicks, officialTeams);
    if (hits === 0) continue;

    const points = hits * pointsPerHit;
    ledgerRows.push({
      contest_id: contestId,
      event_id: null,
      participant_id: uid,
      action_type: actionType,
      points_delta: points,
      reason_text: `advanced_bracket_${phase}:${hits}_correct`,
      correlation_id: correlationId,
    });
  }

  if (ledgerRows.length > 0) {
    const { error: insErr } = await supabase.from("contest_points_ledger").insert(ledgerRows);
    if (insErr) return { ok: false, error: insErr.message };
  }

  const officialPatch: Record<string, unknown> = { updated_at: now };
  if (phase === "semi_finalists") {
    officialPatch.semi_finalist_teams = officialTeams;
    officialPatch.semi_finalists_scored_at = now;
  } else if (phase === "finalists") {
    officialPatch.finalist_teams = officialTeams;
    officialPatch.finalists_scored_at = now;
  } else {
    officialPatch.winner_team = officialTeams[0] ?? null;
    officialPatch.winner_scored_at = now;
  }

  const { error: offErr } = await supabase.from("advanced_bracket_official").upsert(
    { contest_id: contestId, ...officialPatch },
    { onConflict: "contest_id" },
  );
  if (offErr) return { ok: false, error: offErr.message };

  return { ok: true, rowsAwarded: ledgerRows.length, officialTeams };
}
