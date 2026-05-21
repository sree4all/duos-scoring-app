import type { SupabaseClient } from "@supabase/supabase-js";
import { StageRulesRepository } from "@/lib/server/world-cup/stage-rules-repository";
import { worldCupCopy } from "@/lib/copy/world-cup";

export type ScheduleEventRow = {
  eventId: string;
  matchId: string;
  matchNumber: number | null;
  title: string;
  homeTeam: string;
  awayTeam: string;
  venueLabel: string | null;
  kickoffUtc: string;
  lockAt: string | null;
  stageKey: string | null;
  matchStatus: string;
};

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
      .select("id, match_number, home_team, away_team, venue_label, match_time_utc, status")
      .in("id", matchIds);
    for (const m of matchRows ?? []) {
      matchById.set(m.id as string, m as Record<string, unknown>);
    }
  }

  const rows: ScheduleEventRow[] = [];
  for (const ev of events ?? []) {
    const stageKey = ev.stage_key as string | null;
    if (memberView && stageKey && !revealedKeys.has(stageKey)) continue;

    const matchId = ev.source_match_id as string;
    const match = matchById.get(matchId);
    if (!match) continue;

    rows.push({
      eventId: ev.id as string,
      matchId,
      matchNumber: (match.match_number as number | null) ?? null,
      title: ev.title as string,
      homeTeam: match.home_team as string,
      awayTeam: match.away_team as string,
      venueLabel: (match.venue_label as string | null) ?? null,
      kickoffUtc: (match.match_time_utc as string) ?? (ev.lock_at as string),
      lockAt: (ev.lock_at as string | null) ?? null,
      stageKey,
      matchStatus: match.status as string,
    });
  }

  return rows;
}

export async function assertEventRevealedForMember(
  supabase: SupabaseClient,
  contestId: string,
  stageKey: string | null,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!stageKey) return { ok: false, message: worldCupCopy.errors.notOpenYet };
  const repo = new StageRulesRepository(supabase);
  const revealed = await repo.isStageRevealed(contestId, stageKey);
  if (!revealed) return { ok: false, message: worldCupCopy.errors.notOpenYet };
  return { ok: true };
}
