import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { GroupRepository } from "@/lib/server/groups/repository";
import { isGroupScopingEnabled } from "@/lib/server/groups/flags";

export const ACTIVE_GROUP_COOKIE = "active_group_id";

export async function getActiveGroupIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_GROUP_COOKIE)?.value ?? null;
}

export async function setActiveGroupIdCookie(groupId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_GROUP_COOKIE, groupId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function resolveActiveGroupId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  if (!isGroupScopingEnabled()) return null;

  const cookieGroupId = await getActiveGroupIdFromCookie();
  const repo = new GroupRepository(supabase);

  if (cookieGroupId) {
    const membership = await repo.getMembership(cookieGroupId, userId);
    if (membership) return cookieGroupId;
  }

  const memberships = await repo.listMembershipsForUser(userId);
  if (memberships.length === 0) return null;

  const fallback = memberships[0]!.groupId;
  await setActiveGroupIdCookie(fallback);
  return fallback;
}
