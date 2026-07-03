import type { SupabaseClient } from "@supabase/supabase-js";
import { buildLinkedMatchEventTitle } from "@/lib/domain/world-cup/match-event-title";
import { stageKeyFromMatchNumber } from "@/lib/domain/world-cup/match-stage";
import { aggregateLeaderboardForContest } from "@/lib/server/generalized-scoring/scoring-projection-service";
import type { ContestLeaderboardEntry } from "@/lib/server/world-cup/contest-leaderboard";

/** First match included in the "Standings (New)" partial leaderboard. */
export const STANDINGS_NEW_FROM_MATCH_NUMBER = 85;

export type ScoredMatchSummary = {
  matchNumber: number;
  title: string;
  winner: string | null;
};

export type StandingsFromMatchResult = {
  fromMatchNumber: number;
  scoredMatches: ScoredMatchSummary[];
  entries: ContestLeaderboardEntry[];
};

export type MatchStandingsResult = {
  eventId: string;
  matchId: string;
  matchNumber: number;
  title: string;
  stageKey: string | null;
  homeTeam: string;
  awayTeam: string;
  winner: string | null;
  status: string | null;
  entries: ContestLeaderboardEntry[];
};

const STAGE_LABELS: Record<string, string> = {
  group_stage: "Group stage",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter_finals: "Quarter-finals",
  semi_finals: "Semi-finals",
  third_place: "Third place",
  final: "Final",
};

export function formatStageLabel(stageKey: string | null | undefined): string | null {
  if (!stageKey) return null;
  return STAGE_LABELS[stageKey] ?? stageKey.replace(/_/g, " ");
}

/** Standings for a single match within one contest (contest_points_ledger by event). */
export async function fetchMatchStandings(
  supabase: SupabaseClient,
  contestId: string,
  matchNumber: number,
): Promise<MatchStandingsResult | null> {
  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .select("id, match_number, home_team, away_team, winner, status, stage_key")
    .eq("season_year", 2026)
    .eq("match_number", matchNumber)
    .maybeSingle();

  if (matchErr) throw matchErr;
  if (!match) return null;

  const matchId = match.id as string;

  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id")
    .eq("contest_id", contestId)
    .eq("source_match_id", matchId)
    .eq("voided", false)
    .maybeSingle();

  if (eventErr) throw eventErr;
  if (!event) return null;

  const { data: ledger, error: ledgerErr } = await supabase
    .from("contest_points_ledger")
    .select("participant_id, points_delta")
    .eq("contest_id", contestId)
    .eq("event_id", event.id);

  if (ledgerErr) throw ledgerErr;

  const entries = aggregateLeaderboardForContest(
    (ledger ?? []).map((row) => ({
      participantId: row.participant_id as string,
      pointsDelta: Number(row.points_delta ?? 0),
    })),
  );

  const homeTeam = (match.home_team as string) ?? "TBD";
  const awayTeam = (match.away_team as string) ?? "TBD";
  const resolvedMatchNumber = (match.match_number as number) ?? matchNumber;

  return {
    eventId: event.id as string,
    matchId,
    matchNumber: resolvedMatchNumber,
    title: buildLinkedMatchEventTitle(resolvedMatchNumber, homeTeam, awayTeam),
    stageKey:
      stageKeyFromMatchNumber(resolvedMatchNumber) ?? (match.stage_key as string | null),
    homeTeam,
    awayTeam,
    winner: (match.winner as string | null) ?? null,
    status: (match.status as string | null) ?? null,
    entries,
  };
}

/** Cumulative standings from a match number onward (scored matches only). */
export async function fetchStandingsFromMatchNumber(
  supabase: SupabaseClient,
  contestId: string,
  fromMatchNumber: number,
): Promise<StandingsFromMatchResult> {
  const { data: events, error: eventErr } = await supabase
    .from("events")
    .select("id, source_match_id")
    .eq("contest_id", contestId)
    .eq("voided", false)
    .not("source_match_id", "is", null);

  if (eventErr) throw eventErr;

  const eventRows = events ?? [];
  if (eventRows.length === 0) {
    return { fromMatchNumber, scoredMatches: [], entries: [] };
  }

  const matchIds = [...new Set(eventRows.map((event) => event.source_match_id as string))];

  const { data: matches, error: matchErr } = await supabase
    .from("matches")
    .select("id, match_number, home_team, away_team, winner")
    .in("id", matchIds)
    .gte("match_number", fromMatchNumber)
    .order("match_number", { ascending: true });

  if (matchErr) throw matchErr;

  const matchById = new Map((matches ?? []).map((match) => [match.id as string, match]));

  const eligibleEvents = eventRows.filter((event) =>
    matchById.has(event.source_match_id as string),
  );

  const eligibleEventIds = eligibleEvents.map((event) => event.id as string);
  if (eligibleEventIds.length === 0) {
    return { fromMatchNumber, scoredMatches: [], entries: [] };
  }

  const { data: ledger, error: ledgerErr } = await supabase
    .from("contest_points_ledger")
    .select("participant_id, points_delta, event_id")
    .eq("contest_id", contestId)
    .in("event_id", eligibleEventIds);

  if (ledgerErr) throw ledgerErr;

  const ledgerRows = ledger ?? [];
  const scoredEventIds = new Set(ledgerRows.map((row) => row.event_id as string));

  const entries = aggregateLeaderboardForContest(
    ledgerRows.map((row) => ({
      participantId: row.participant_id as string,
      pointsDelta: Number(row.points_delta ?? 0),
    })),
  );

  const scoredMatches: ScoredMatchSummary[] = [];
  for (const event of eligibleEvents) {
    const eventId = event.id as string;
    if (!scoredEventIds.has(eventId)) continue;

    const match = matchById.get(event.source_match_id as string);
    if (!match) continue;

    const matchNumber = match.match_number as number;
    scoredMatches.push({
      matchNumber,
      title: buildLinkedMatchEventTitle(
        matchNumber,
        (match.home_team as string) ?? "TBD",
        (match.away_team as string) ?? "TBD",
      ),
      winner: (match.winner as string | null) ?? null,
    });
  }

  scoredMatches.sort((a, b) => a.matchNumber - b.matchNumber);

  return { fromMatchNumber, scoredMatches, entries };
}
