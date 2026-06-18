"use server";

import { requireUser } from "@/lib/auth/require-user";
import { isSubmissionEditable } from "@/lib/server/generalized-scoring/lock-policy-service";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { isGroupScopingEnabled } from "@/lib/server/groups/flags";
import {
  saveMatchBonusAnswerForUser,
  saveMatchPickForUser,
} from "@/lib/server/world-cup/prediction-submission";

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

  return saveMatchPickForUser(supabase, {
    userId: user.id,
    contestId,
    eventId,
    matchId,
    predictedWinner,
    activeGroupId,
  });
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

  return saveMatchBonusAnswerForUser(supabase, {
    userId: user.id,
    contestId,
    eventId,
    matchId,
    promptId,
    answerText,
    activeGroupId,
  });
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
