import type { SupabaseClient } from "@supabase/supabase-js";
import { validateMatchPick } from "@/lib/domain/world-cup/match-outcome";
import { worldCupCopy } from "@/lib/copy/world-cup";
import { isPredictionsLocked } from "@/lib/utils/match-lock";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import {
  assertEventRevealedForMember,
  resolveEventStageKey,
} from "@/lib/server/world-cup/schedule-query";

type Result = { ok: true } | { ok: false; error: string };

type SaveMatchPickParams = {
  userId: string;
  contestId: string;
  eventId: string;
  matchId: string;
  predictedWinner: string;
  activeGroupId: string;
};

export async function saveMatchPickForUser(
  supabase: SupabaseClient,
  params: SaveMatchPickParams,
  writeSupabase?: SupabaseClient,
): Promise<Result> {
  const { userId, contestId, eventId, matchId, predictedWinner, activeGroupId } = params;

  await requireGroupMembership(supabase, activeGroupId, userId);
  await new GroupContestService(supabase).assertContestInGroup(contestId, activeGroupId);

  const { data: event } = await supabase
    .from("events")
    .select("stage_key, lock_at, source_match_id")
    .eq("id", eventId)
    .eq("contest_id", contestId)
    .maybeSingle();

  if (!event) return { ok: false, error: "Match not found." };

  const reveal = await assertEventRevealedForMember(
    supabase,
    contestId,
    event.stage_key as string | null,
    {
      stage_key: event.stage_key as string | null,
      source_match_id: event.source_match_id as string | null,
    },
  );
  if (!reveal.ok) return { ok: false, error: reveal.message };

  const { data: match } = await supabase
    .from("matches")
    .select("home_team, away_team, match_time_utc")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) return { ok: false, error: "Match not found." };

  if (
    isPredictionsLocked(
      match.match_time_utc as string,
      event.lock_at as string | null,
    )
  ) {
    return { ok: false, error: worldCupCopy.errors.predictionsClosed };
  }

  const stageKey = await resolveEventStageKey(supabase, {
    stage_key: event.stage_key as string | null,
    source_match_id: event.source_match_id as string | null,
  });

  const pickCheck = validateMatchPick(
    stageKey,
    predictedWinner,
    match.home_team as string,
    match.away_team as string,
  );
  if (!pickCheck.ok) return { ok: false, error: pickCheck.error };

  const writer = writeSupabase ?? supabase;
  const { error } = await writer.from("predictions").upsert(
    {
      user_id: userId,
      match_id: matchId,
      predicted_winner: pickCheck.value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,match_id" },
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function saveMatchBonusAnswerForUser(
  supabase: SupabaseClient,
  params: {
    userId: string;
    contestId: string;
    eventId: string;
    matchId: string;
    promptId: string;
    answerText: string;
    activeGroupId: string;
  },
  writeSupabase?: SupabaseClient,
): Promise<Result> {
  const { userId, contestId, eventId, matchId, promptId, answerText, activeGroupId } = params;

  await requireGroupMembership(supabase, activeGroupId, userId);
  await new GroupContestService(supabase).assertContestInGroup(contestId, activeGroupId);

  const { data: event } = await supabase
    .from("events")
    .select("stage_key, lock_at, source_match_id")
    .eq("id", eventId)
    .eq("contest_id", contestId)
    .maybeSingle();

  if (!event) return { ok: false, error: "Match not found." };

  const reveal = await assertEventRevealedForMember(
    supabase,
    contestId,
    event.stage_key as string | null,
    {
      stage_key: event.stage_key as string | null,
      source_match_id: event.source_match_id as string | null,
    },
  );
  if (!reveal.ok) return { ok: false, error: reveal.message };

  const { data: match } = await supabase
    .from("matches")
    .select("match_time_utc")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) return { ok: false, error: "Match not found." };

  if (
    isPredictionsLocked(
      match.match_time_utc as string,
      event.lock_at as string | null,
    )
  ) {
    return { ok: false, error: worldCupCopy.errors.predictionsClosed };
  }

  const trimmed = answerText.trim();
  if (!trimmed) {
    return { ok: false, error: "Choose an answer." };
  }

  const { data: prompt } = await supabase
    .from("bonus_prompts")
    .select("id, match_id, is_active")
    .eq("id", promptId)
    .eq("match_id", matchId)
    .eq("is_active", true)
    .maybeSingle();

  if (!prompt) {
    return { ok: false, error: "Bonus question not found for this match." };
  }

  const writer = writeSupabase ?? supabase;
  const { error } = await writer.from("prediction_bonus_answers").upsert(
    {
      user_id: userId,
      match_id: matchId,
      prompt_id: promptId,
      answer_text: trimmed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,prompt_id" },
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
