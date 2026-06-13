"use server";

import { requireUser } from "@/lib/auth/require-user";
import { isSubmissionEditable } from "@/lib/server/generalized-scoring/lock-policy-service";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { isGroupScopingEnabled } from "@/lib/server/groups/flags";
import {
  assertEventRevealedForMember,
  resolveEventStageKey,
} from "@/lib/server/world-cup/schedule-query";
import { validateMatchPick } from "@/lib/domain/world-cup/match-outcome";
import { worldCupCopy } from "@/lib/copy/world-cup";
import { isPredictionsLocked } from "@/lib/utils/match-lock";

export async function saveMatchPick(
  contestId: string,
  eventId: string,
  matchId: string,
  predictedWinner: string,
) {
  const { supabase, user } = await requireUser();
  const activeGroupId = await resolveActiveGroupId(supabase, user.id);
  if (!activeGroupId) {
    return { ok: false as const, error: "Select an active group first." };
  }

  await requireGroupMembership(supabase, activeGroupId, user.id);
  await new GroupContestService(supabase).assertContestInGroup(contestId, activeGroupId);

  const { data: event } = await supabase
    .from("events")
    .select("stage_key, lock_at, source_match_id")
    .eq("id", eventId)
    .eq("contest_id", contestId)
    .maybeSingle();

  if (!event) return { ok: false as const, error: "Match not found." };

  const reveal = await assertEventRevealedForMember(
    supabase,
    contestId,
    event.stage_key as string | null,
    {
      stage_key: event.stage_key as string | null,
      source_match_id: event.source_match_id as string | null,
    },
  );
  if (!reveal.ok) return { ok: false as const, error: reveal.message };

  const { data: match } = await supabase
    .from("matches")
    .select("home_team, away_team, match_time_utc")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) return { ok: false as const, error: "Match not found." };

  if (
    isPredictionsLocked(
      match.match_time_utc as string,
      event.lock_at as string | null,
    )
  ) {
    return { ok: false as const, error: worldCupCopy.errors.predictionsClosed };
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
  if (!pickCheck.ok) return { ok: false as const, error: pickCheck.error };

  const { error } = await supabase.from("predictions").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      predicted_winner: pickCheck.value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,match_id" },
  );

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function saveMatchBonusAnswer(
  contestId: string,
  eventId: string,
  matchId: string,
  promptId: string,
  answerText: string,
) {
  const { supabase, user } = await requireUser();
  const activeGroupId = await resolveActiveGroupId(supabase, user.id);
  if (!activeGroupId) {
    return { ok: false as const, error: "Select an active group first." };
  }

  await requireGroupMembership(supabase, activeGroupId, user.id);
  await new GroupContestService(supabase).assertContestInGroup(contestId, activeGroupId);

  const { data: event } = await supabase
    .from("events")
    .select("stage_key, lock_at, source_match_id")
    .eq("id", eventId)
    .eq("contest_id", contestId)
    .maybeSingle();

  if (!event) return { ok: false as const, error: "Match not found." };

  const reveal = await assertEventRevealedForMember(
    supabase,
    contestId,
    event.stage_key as string | null,
    {
      stage_key: event.stage_key as string | null,
      source_match_id: event.source_match_id as string | null,
    },
  );
  if (!reveal.ok) return { ok: false as const, error: reveal.message };

  const { data: match } = await supabase
    .from("matches")
    .select("match_time_utc")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) return { ok: false as const, error: "Match not found." };

  if (
    isPredictionsLocked(
      match.match_time_utc as string,
      event.lock_at as string | null,
    )
  ) {
    return { ok: false as const, error: worldCupCopy.errors.predictionsClosed };
  }

  const trimmed = answerText.trim();
  if (!trimmed) {
    return { ok: false as const, error: "Choose an answer." };
  }

  const { data: prompt } = await supabase
    .from("bonus_prompts")
    .select("id, match_id, is_active")
    .eq("id", promptId)
    .eq("match_id", matchId)
    .eq("is_active", true)
    .maybeSingle();

  if (!prompt) {
    return { ok: false as const, error: "Bonus question not found for this match." };
  }

  const { error } = await supabase.from("prediction_bonus_answers").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      prompt_id: promptId,
      answer_text: trimmed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,prompt_id" },
  );

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function submitParticipantEntry(contestId: string, locked: boolean) {
  if (!isSubmissionEditable(locked)) {
    return { ok: false, message: "Event is locked." };
  }

  if (isGroupScopingEnabled()) {
    const { supabase, user } = await requireUser();
    const activeGroupId = await resolveActiveGroupId(supabase, user.id);
    if (!activeGroupId) {
      return { ok: false, message: "Select an active group first." };
    }

    const contests = new GroupContestService(supabase);
    try {
      await contests.assertContestInGroup(contestId, activeGroupId);
      await requireGroupMembership(supabase, activeGroupId, user.id);
    } catch {
      return { ok: false, message: "Contest not found in your active group." };
    }
  }

  return { ok: true };
}
