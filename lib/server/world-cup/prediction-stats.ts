import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemberPredictionRow } from "@/components/world-cup/prediction-stats-panel";
import type { PredictionStatsEvent } from "@/components/world-cup/prediction-stats-panel";
import { listRevealedScheduleEvents } from "@/lib/server/world-cup/schedule-query";

export async function loadPredictionStatsForContest(
  supabase: SupabaseClient,
  contestId: string,
  groupId: string,
  memberView: boolean,
): Promise<{
  events: PredictionStatsEvent[];
  predictionsByEventId: Record<string, MemberPredictionRow[]>;
}> {
  const schedule = await listRevealedScheduleEvents(supabase, contestId, memberView);
  const events: PredictionStatsEvent[] = schedule.map((e) => ({
    eventId: e.eventId,
    label: `Match ${e.matchNumber ?? "—"}: ${e.homeTeam} vs ${e.awayTeam}`,
    kickoffUtc: e.kickoffUtc,
    homeTeam: e.homeTeam,
    awayTeam: e.awayTeam,
  }));

  const matchIds = schedule.map((e) => e.matchId);

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

  const pickByMatchAndUser = new Map<string, string>();
  if (matchIds.length > 0) {
    const { data: predictions } = await supabase
      .from("predictions")
      .select("user_id, match_id, predicted_winner")
      .in("match_id", matchIds);
    for (const p of predictions ?? []) {
      pickByMatchAndUser.set(
        `${p.match_id as string}:${p.user_id as string}`,
        p.predicted_winner as string,
      );
    }
  }

  const predictionsByEventId: Record<string, MemberPredictionRow[]> = {};

  for (const ev of schedule) {
    const rows: MemberPredictionRow[] = memberIds.map((uid) => ({
      displayName: displayNameByUserId.get(uid) ?? `Player ${uid.slice(0, 6)}`,
      predictedWinner: pickByMatchAndUser.get(`${ev.matchId}:${uid}`) ?? null,
    }));
    rows.sort((a, b) => a.displayName.localeCompare(b.displayName));
    predictionsByEventId[ev.eventId] = rows;
  }

  return { events, predictionsByEventId };
}
