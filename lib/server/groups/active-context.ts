import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { GroupRepository } from "@/lib/server/groups/repository";
import { isGroupScopingEnabled } from "@/lib/server/groups/flags";

export const ACTIVE_GROUP_COOKIE = "active_group_id";

const ACTIVE_GROUP_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
};

/** Set active group on a Route Handler or middleware response (not in Server Components). */
export function applyActiveGroupIdCookie(response: NextResponse, groupId: string): void {
  response.cookies.set(ACTIVE_GROUP_COOKIE, groupId, ACTIVE_GROUP_COOKIE_OPTIONS);
}

export async function getActiveGroupIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_GROUP_COOKIE)?.value ?? null;
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

  return memberships[0]!.groupId;
}
