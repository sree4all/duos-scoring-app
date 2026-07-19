import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemberAdvancedBracketRow } from "@/components/world-cup/advanced-bracket-stats-panel";
import {
  evaluateForecastStatsRow,
  type ForecastOfficialAnswers,
  type ForecastScoredPhases,
} from "@/lib/domain/world-cup/advanced-bracket";
import {
  deriveFinalistTeams,
  deriveSemiFinalistTeams,
  deriveTournamentWinner,
} from "@/lib/server/world-cup/advanced-bracket-official";
import { loadAdvancedBracketOfficial } from "@/lib/server/world-cup/advanced-bracket-service";

type ResolvedForecastOfficial = {
  answers: ForecastOfficialAnswers;
  scoredPhases: ForecastScoredPhases;
};

/** Prefer derived fixture/results answers; fall back to stored official row. */
async function resolveOfficialAnswers(
  supabase: SupabaseClient,
  contestId: string,
  seasonYear = 2026,
): Promise<ResolvedForecastOfficial> {
  const [derivedSemi, derivedFinalists, derivedWinner, stored] = await Promise.all([
    deriveSemiFinalistTeams(supabase, seasonYear),
    deriveFinalistTeams(supabase, seasonYear),
    deriveTournamentWinner(supabase, seasonYear),
    loadAdvancedBracketOfficial(supabase, contestId),
  ]);

  return {
    answers: {
      semiFinalistTeams:
        derivedSemi.length === 4 ? derivedSemi : (stored?.semiFinalistTeams ?? []),
      finalistTeams:
        derivedFinalists.length === 2 ? derivedFinalists : (stored?.finalistTeams ?? []),
      winnerTeam: derivedWinner ?? stored?.winnerTeam ?? null,
    },
    scoredPhases: {
      semiFinalists: Boolean(stored?.semiFinalistsScoredAt),
      finalists: Boolean(stored?.finalistsScoredAt),
      winner: Boolean(stored?.winnerScoredAt),
    },
  };
}

export async function loadAdvancedBracketStatsForContest(
  supabase: SupabaseClient,
  contestId: string,
  groupId: string,
): Promise<{ rows: MemberAdvancedBracketRow[]; official: ForecastOfficialAnswers }> {
  const { data: memberRows } = await supabase
    .from("group_memberships")
    .select("user_id")
    .eq("group_id", groupId)
    .is("removed_at", null);

  const memberIds = (memberRows ?? []).map((r) => r.user_id as string);
  const displayNameByUserId = new Map<string, string>();

  if (memberIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", memberIds);
    for (const p of profiles ?? []) {
      displayNameByUserId.set(
        p.id as string,
        (p.display_name as string)?.trim() || "Player",
      );
    }
  }

  const picksByUserId = new Map<
    string,
    { semiFinalistTeams: string[]; finalistTeams: string[]; winnerTeam: string | null }
  >();

  if (memberIds.length > 0) {
    const { data: predictions } = await supabase
      .from("advanced_bracket_predictions")
      .select("user_id, semi_finalist_teams, finalist_teams, winner_team")
      .eq("contest_id", contestId)
      .in("user_id", memberIds);

    for (const row of predictions ?? []) {
      picksByUserId.set(row.user_id as string, {
        semiFinalistTeams: (row.semi_finalist_teams as string[]) ?? [],
        finalistTeams: (row.finalist_teams as string[]) ?? [],
        winnerTeam: (row.winner_team as string | null) ?? null,
      });
    }
  }

  const { answers: official, scoredPhases } = await resolveOfficialAnswers(
    supabase,
    contestId,
  );

  const rows: MemberAdvancedBracketRow[] = memberIds.map((uid) => {
    const picks = picksByUserId.get(uid) ?? {
      semiFinalistTeams: [],
      finalistTeams: [],
      winnerTeam: null,
    };
    const evaluation = evaluateForecastStatsRow(picks, official, scoredPhases);
    return {
      displayName: displayNameByUserId.get(uid) ?? `Player ${uid.slice(0, 6)}`,
      semiFinalistTeams: picks.semiFinalistTeams,
      finalistTeams: picks.finalistTeams,
      winnerTeam: picks.winnerTeam,
      semiFinalistResults: evaluation.semiFinalistResults,
      finalistResults: evaluation.finalistResults,
      winnerResult: evaluation.winnerResult,
      points: evaluation.points,
    };
  });

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return a.displayName.localeCompare(b.displayName);
  });
  return { rows, official };
}
