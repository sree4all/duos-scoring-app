"use server";

import { requireUser } from "@/lib/auth/require-user";
import { assertAdminActor } from "@/lib/auth/assert-admin";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import {
  saveMatchBonusAnswerForUser,
  saveMatchPickForUser,
} from "@/lib/server/world-cup/prediction-submission";
import { createServiceClient } from "@/lib/supabase/service";

async function requireAdminContext() {
  const { supabase, user } = await requireUser();
  const adminCheck = await assertAdminActor(supabase, user.id);
  if (!adminCheck.ok) return { ok: false as const, error: adminCheck.error };

  const activeGroupId = await resolveActiveGroupId(supabase, user.id);
  if (!activeGroupId) {
    return { ok: false as const, error: "Select an active group first." };
  }

  await requireGroupMembership(supabase, activeGroupId, user.id);
  return { ok: true as const, supabase, user, activeGroupId };
}

export async function loadMemberPredictionsForMatch(
  contestId: string,
  matchId: string,
  targetUserId: string,
) {
  const ctx = await requireAdminContext();
  if (!ctx.ok) return ctx;

  const { supabase, activeGroupId } = ctx;
  await requireGroupMembership(supabase, activeGroupId, targetUserId);
  await new GroupContestService(supabase).assertContestInGroup(contestId, activeGroupId);

  const [{ data: pick }, { data: bonusRows }] = await Promise.all([
    supabase
      .from("predictions")
      .select("predicted_winner")
      .eq("user_id", targetUserId)
      .eq("match_id", matchId)
      .maybeSingle(),
    supabase
      .from("prediction_bonus_answers")
      .select("prompt_id, answer_text")
      .eq("user_id", targetUserId)
      .eq("match_id", matchId),
  ]);

  const bonusAnswers: Record<string, string> = {};
  for (const row of bonusRows ?? []) {
    bonusAnswers[row.prompt_id as string] = row.answer_text as string;
  }

  return {
    ok: true as const,
    predictedWinner: (pick?.predicted_winner as string | null) ?? null,
    bonusAnswers,
  };
}

export async function adminSaveMatchPickForUser(
  contestId: string,
  eventId: string,
  matchId: string,
  targetUserId: string,
  predictedWinner: string,
) {
  const ctx = await requireAdminContext();
  if (!ctx.ok) return ctx;

  const serviceSupabase = createServiceClient();
  return saveMatchPickForUser(
    ctx.supabase,
    {
      userId: targetUserId,
      contestId,
      eventId,
      matchId,
      predictedWinner,
      activeGroupId: ctx.activeGroupId,
    },
    serviceSupabase,
  );
}

export async function adminSaveMatchBonusAnswerForUser(
  contestId: string,
  eventId: string,
  matchId: string,
  targetUserId: string,
  promptId: string,
  answerText: string,
) {
  const ctx = await requireAdminContext();
  if (!ctx.ok) return ctx;

  const serviceSupabase = createServiceClient();
  return saveMatchBonusAnswerForUser(
    ctx.supabase,
    {
      userId: targetUserId,
      contestId,
      eventId,
      matchId,
      promptId,
      answerText,
      activeGroupId: ctx.activeGroupId,
    },
    serviceSupabase,
  );
}
