import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { requireGroupMembership } from "@/lib/server/groups/guards";

export async function withGroupScope<T>(
  supabase: SupabaseClient,
  userId: string,
  fn: (groupId: string) => Promise<T>,
  explicitGroupId?: string,
): Promise<T> {
  const groupId =
    explicitGroupId ?? (await resolveActiveGroupId(supabase, userId));
  if (!groupId) {
    throw new Error("No active group selected");
  }
  await requireGroupMembership(supabase, groupId, userId);
  return fn(groupId);
}
