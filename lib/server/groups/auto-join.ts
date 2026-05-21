import type { SupabaseClient } from "@supabase/supabase-js";
import { GroupRepository } from "@/lib/server/groups/repository";
import { GroupService } from "@/lib/server/groups/group-service";
import { normalizeInviteCode } from "@/lib/server/groups/invite-code";
import {
  getDefaultGroupId,
  getDefaultInviteCode,
  isWorldCupPrivateMode,
} from "@/lib/server/world-cup/flags";

export type AutoJoinResult =
  | { ok: true; groupId: string; joined: boolean }
  | { ok: false; error: string };

/** Join the pilot group when configured; no-op if already a member. */
export async function ensurePilotGroupMembership(
  supabase: SupabaseClient,
  userId: string,
  inviteCodeOverride?: string | null,
): Promise<AutoJoinResult> {
  if (!isWorldCupPrivateMode()) {
    return { ok: false, error: "Auto-join is only enabled in private pilot mode." };
  }

  const inviteCode = normalizeInviteCode(
    inviteCodeOverride?.trim() || getDefaultInviteCode() || "",
  );
  if (!inviteCode) {
    return { ok: false, error: "League invite code is not configured." };
  }

  const repo = new GroupRepository(supabase);
  const defaultGroupId = getDefaultGroupId();

  if (defaultGroupId) {
    const existing = await repo.getMembership(defaultGroupId, userId);
    if (existing) {
      return { ok: true, groupId: defaultGroupId, joined: false };
    }
  }

  const groups = await repo.listActiveGroupsForUser(userId);
  if (groups.length > 0) {
    const gid =
      defaultGroupId && groups.some((g) => g.id === defaultGroupId)
        ? defaultGroupId
        : groups[0]!.id;
    return { ok: true, groupId: gid, joined: false };
  }

  try {
    const groupId = await new GroupService(supabase).joinByInviteCode(inviteCode, userId);
    return { ok: true, groupId, joined: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not join the league.";
    return { ok: false, error: message };
  }
}
