import type { SupabaseClient } from "@supabase/supabase-js";
import type { GroupMembership } from "@/lib/domain/groups/types";
import { GroupRepository } from "@/lib/server/groups/repository";
import { canManageContests, canRecordRummyHand } from "@/lib/server/groups/role-helpers";

export class GroupAccessError extends Error {
  constructor(
    message: string,
    readonly status = 403,
  ) {
    super(message);
    this.name = "GroupAccessError";
  }
}

export async function requireGroupMembership(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
): Promise<GroupMembership> {
  const repo = new GroupRepository(supabase);
  const membership = await repo.getMembership(groupId, userId);
  if (!membership) {
    throw new GroupAccessError("You are not a member of this group", 404);
  }
  return membership;
}

export async function requireGroupOwner(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
): Promise<GroupMembership> {
  const membership = await requireGroupMembership(supabase, groupId, userId);
  if (!canManageContests(membership)) {
    throw new GroupAccessError("Only group owners can manage contests");
  }
  return membership;
}

export async function requireGroupOwnerOrScorer(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
): Promise<GroupMembership> {
  const membership = await requireGroupMembership(supabase, groupId, userId);
  if (!canRecordRummyHand(membership)) {
    throw new GroupAccessError("Only group owners and designated scorers can record Rummy hands");
  }
  return membership;
}

/** FR-024: non-owners must not configure contests for the group. */
export async function requireGroupOwnerForContestConfig(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
): Promise<GroupMembership> {
  return requireGroupOwner(supabase, groupId, userId);
}
