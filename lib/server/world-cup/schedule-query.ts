import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseMatchNumberFromExternalKey,
  resolveScoringStageKey,
} from "@/lib/domain/world-cup/match-stage";
import { StageRulesRepository } from "@/lib/server/world-cup/stage-rules-repository";
import { worldCupCopy } from "@/lib/copy/world-cup";
import { buildLinkedMatchEventTitle } from "@/lib/domain/world-cup/match-event-title";
import { resolvePredictionLockAtIso } from "@/lib/utils/match-lock";

export type ScheduleEventRow = {
  eventId: string;
  matchId: string;
  matchNumber: number | null;
  title: string;
  homeTeam: string;
  awayTeam: string;
  venueLabel: string | null;
  kickoffUtc: string;
  kickoffTzOffset: string | null;
  lockAt: string | null;
  stageKey: string | null;
  matchStatus: string;
};

/** Prefer linked match stage_key (source of truth); fall back to denormalized event row. */
export async function resolveEventStageKey(
  supabase: SupabaseClient,
  event: { stage_key: string | null; source_match_id: string | null },
): Promise<string | null> {
  const matchId = event.source_match_id as string | null;
  if (matchId) {
    const { data: match } = await supabase
      .from("matches")
      .select("stage_key, match_number, external_key")
      .eq("id", matchId)
      .maybeSingle();
    if (match) {
      const matchNumber =
        (match.match_number as number | null) ??
        parseMatchNumberFromExternalKey(match.external_key as string | null);
      const resolved = resolveScoringStageKey(
        match.stage_key as string | null,
        matchNumber,
      );
      if (resolved) return resolved;
    }
  }
  return (event.stage_key as string | null) ?? null;
}

export async function listRevealedScheduleEvents(
  supabase: SupabaseClient,
  contestId: string,
  memberView = true,
): Promise<ScheduleEventRow[]> {
  const rulesRepo = new StageRulesRepository(supabase);
  const revealed = await rulesRepo.listForContest(contestId, memberView);
  const revealedKeys = new Set<string>(revealed.map((r) => r.stageKey));
  if (memberView && revealedKeys.size === 0) return [];

  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, lock_at, stage_key, source_match_id")
    .eq("contest_id", contestId)
    .not("source_match_id", "is", null)
    .order("lock_at", { ascending: true });

  if (error) throw error;

  const matchIds = (events ?? [])
    .map((e) => e.source_match_id as string)
    .filter(Boolean);
  const matchById = new Map<string, Record<string, unknown>>();
  if (matchIds.length > 0) {
    const { data: matchRows } = await supabase
      .from("matches")
      .select(
        "id, match_number, external_key, home_team, away_team, venue_label, match_time_utc, kickoff_tz_offset, status, stage_key",
      )
      .in("id", matchIds);
    for (const m of matchRows ?? []) {
      matchById.set(m.id as string, m as Record<string, unknown>);
    }
  }

  const rows: ScheduleEventRow[] = [];
  for (const ev of events ?? []) {
    const matchId = ev.source_match_id as string;
    const match = matchById.get(matchId);
    if (!match) continue;

    const matchNumber =
      (match.match_number as number | null) ??
      parseMatchNumberFromExternalKey(match.external_key as string | null);
    const stageKey =
      resolveScoringStageKey(match.stage_key as string | null, matchNumber) ??
      (ev.stage_key as string | null) ??
      null;
    if (memberView && (!stageKey || !revealedKeys.has(stageKey))) continue;

    rows.push({
      eventId: ev.id as string,
      matchId,
      matchNumber: (match.match_number as number | null) ?? null,
      title: buildLinkedMatchEventTitle(
        matchNumber,
        match.home_team as string,
        match.away_team as string,
      ),
      homeTeam: match.home_team as string,
      awayTeam: match.away_team as string,
      venueLabel: (match.venue_label as string | null) ?? null,
      kickoffUtc: (match.match_time_utc as string) ?? (ev.lock_at as string),
      kickoffTzOffset: (match.kickoff_tz_offset as string | null) ?? null,
      lockAt: resolvePredictionLockAtIso(
        (match.match_time_utc as string) ?? (ev.lock_at as string),
        ev.lock_at as string | null,
      ),
      stageKey,
      matchStatus: match.status as string,
    });
  }

  return rows;
}

/** Non-completed matches in kickoff order for the predictions schedule. */
export function listUpcomingScheduleEvents(events: ScheduleEventRow[]): ScheduleEventRow[] {
  return events
    .filter((e) => e.matchStatus !== "completed")
    .sort(
      (a, b) => new Date(a.kickoffUtc).getTime() - new Date(b.kickoffUtc).getTime(),
    );
}

export async function assertEventRevealedForMember(
  supabase: SupabaseClient,
  contestId: string,
  stageKey: string | null,
  event?: { stage_key: string | null; source_match_id: string | null },
): Promise<{ ok: true; stageKey: string } | { ok: false; message: string }> {
  const resolved =
    stageKey ?? (event ? await resolveEventStageKey(supabase, event) : null);
  if (!resolved) return { ok: false, message: worldCupCopy.errors.notOpenYet };
  const repo = new StageRulesRepository(supabase);
  const revealed = await repo.isStageRevealed(contestId, resolved);
  if (!revealed) return { ok: false, message: worldCupCopy.errors.notOpenYet };
  return { ok: true, stageKey: resolved };
}
