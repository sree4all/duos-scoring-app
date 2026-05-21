"use server";

import { requireUser } from "@/lib/auth/require-user";
import { isSubmissionEditable } from "@/lib/server/generalized-scoring/lock-policy-service";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { isGroupScopingEnabled } from "@/lib/server/groups/flags";
import { assertEventRevealedForMember } from "@/lib/server/world-cup/schedule-query";
import { worldCupCopy } from "@/lib/copy/world-cup";

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
    .select("stage_key, lock_at")
    .eq("id", eventId)
    .eq("contest_id", contestId)
    .maybeSingle();

  if (!event) return { ok: false as const, error: "Match not found." };

  const reveal = await assertEventRevealedForMember(
    supabase,
    contestId,
    event.stage_key as string | null,
  );
  if (!reveal.ok) return { ok: false as const, error: reveal.message };

  const lockAt = event.lock_at as string | null;
  if (lockAt && new Date(lockAt).getTime() <= Date.now()) {
    return { ok: false as const, error: worldCupCopy.errors.picksClosed };
  }

  const { error } = await supabase.from("predictions").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      predicted_winner: predictedWinner,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,match_id" },
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
