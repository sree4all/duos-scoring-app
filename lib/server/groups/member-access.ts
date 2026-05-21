import { notFound, redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Group, GroupMembership } from "@/lib/domain/groups/types";
import { GroupRepository } from "@/lib/server/groups/repository";
import { canManageContests } from "@/lib/server/groups/role-helpers";
import { isWorldCupPrivateMode } from "@/lib/server/world-cup/flags";

export function joinGroupRedirectPath(groupId: string): string {
  const next = encodeURIComponent(`/groups/${groupId}`);
  return `/groups/join?next=${next}`;
}

/** Load group home data; non-members go to join (not 404) in private pilot mode. */
export async function requireGroupPageAccess(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
): Promise<{ group: Group; membership: GroupMembership }> {
  const repo = new GroupRepository(supabase);
  const membership = await repo.getMembership(groupId, userId);

  if (!membership) {
    if (isWorldCupPrivateMode()) {
      redirect(joinGroupRedirectPath(groupId));
    }
    notFound();
  }

  const group = await repo.getGroupById(groupId);
  if (!group) notFound();

  return { group, membership };
}

/** Owner-only pages; non-members go to join, members without owner role go to group home. */
export async function requireGroupOwnerPageAccess(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
): Promise<{ group: Group; membership: GroupMembership }> {
  const access = await requireGroupPageAccess(supabase, groupId, userId);
  if (!canManageContests(access.membership)) {
    redirect(`/groups/${groupId}`);
  }
  return access;
}
