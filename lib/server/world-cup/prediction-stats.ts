import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemberPredictionRow } from "@/components/world-cup/prediction-stats-panel";
import type { PredictionStatsEvent } from "@/components/world-cup/prediction-stats-panel";
import { listRevealedScheduleEvents } from "@/lib/server/world-cup/schedule-query";
import { MatchBonusRepository } from "@/lib/server/world-cup/match-bonus-repository";
import { shouldHidePeerPredictions } from "@/lib/server/world-cup/prediction-visibility";

export type PredictionStatsLoadOptions = {
  memberView?: boolean;
  viewerUserId: string;
  isOwner: boolean;
};

export async function loadPredictionStatsForContest(
  supabase: SupabaseClient,
  contestId: string,
  groupId: string,
  options: PredictionStatsLoadOptions,
): Promise<{
  events: PredictionStatsEvent[];
  predictionsByEventId: Record<string, MemberPredictionRow[]>;
}> {
  const memberView = options.memberView ?? true;
  const schedule = await listRevealedScheduleEvents(supabase, contestId, memberView);
  const matchIds = schedule.map((e) => e.matchId);

  const bonusPromptsByMatchId = new Map<
    string,
    { id: string; promptText: string }[]
  >();
  if (matchIds.length > 0) {
    const bonusRepo = new MatchBonusRepository(supabase);
    const promptsMap = await bonusRepo.listForMatches(matchIds);
    for (const [matchId, prompts] of promptsMap) {
      bonusPromptsByMatchId.set(
        matchId,
        prompts.map((p) => ({ id: p.id, promptText: p.promptText })),
      );
    }
  }

  const events: PredictionStatsEvent[] = schedule.map((e) => ({
    eventId: e.eventId,
    label: `Match ${e.matchNumber ?? "—"}: ${e.homeTeam} vs ${e.awayTeam}`,
    kickoffUtc: e.kickoffUtc,
    kickoffTzOffset: e.kickoffTzOffset,
    homeTeam: e.homeTeam,
    awayTeam: e.awayTeam,
    bonusPrompts: bonusPromptsByMatchId.get(e.matchId) ?? [],
    peerPredictionsHidden: shouldHidePeerPredictions(
      options.isOwner,
      e.kickoffUtc,
    ),
  }));

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
  const bonusAnswerByPromptAndUser = new Map<string, string>();
  if (matchIds.length > 0) {
    const [{ data: predictions }, { data: bonusAnswers }] = await Promise.all([
      supabase
        .from("predictions")
        .select("user_id, match_id, predicted_winner")
        .in("match_id", matchIds),
      supabase
        .from("prediction_bonus_answers")
        .select("user_id, prompt_id, answer_text")
        .in("match_id", matchIds),
    ]);
    for (const p of predictions ?? []) {
      pickByMatchAndUser.set(
        `${p.match_id as string}:${p.user_id as string}`,
        p.predicted_winner as string,
      );
    }
    for (const row of bonusAnswers ?? []) {
      const answer = (row.answer_text as string)?.trim();
      if (!answer) continue;
      bonusAnswerByPromptAndUser.set(
        `${row.prompt_id as string}:${row.user_id as string}`,
        answer,
      );
    }
  }

  const predictionsByEventId: Record<string, MemberPredictionRow[]> = {};

  for (const ev of schedule) {
    const hidePeers = shouldHidePeerPredictions(options.isOwner, ev.kickoffUtc);
    const visibleMemberIds = hidePeers
      ? memberIds.filter((id) => id === options.viewerUserId)
      : memberIds;

    const bonusPrompts = bonusPromptsByMatchId.get(ev.matchId) ?? [];
    const rows: MemberPredictionRow[] = visibleMemberIds.map((uid) => ({
      displayName: displayNameByUserId.get(uid) ?? `Player ${uid.slice(0, 6)}`,
      predictedWinner: pickByMatchAndUser.get(`${ev.matchId}:${uid}`) ?? null,
      bonusAnswers:
        bonusPrompts.length > 0
          ? Object.fromEntries(
              bonusPrompts.map((prompt) => [
                prompt.id,
                bonusAnswerByPromptAndUser.get(`${prompt.id}:${uid}`) ?? null,
              ]),
            )
          : undefined,
    }));
    rows.sort((a, b) => a.displayName.localeCompare(b.displayName));
    predictionsByEventId[ev.eventId] = rows;
  }

  return { events, predictionsByEventId };
}
