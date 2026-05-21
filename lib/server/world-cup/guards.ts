import type { SupabaseClient } from "@supabase/supabase-js";
import { requireGroupOwner } from "@/lib/server/groups/guards";
import { isWorldCupImportEnabled } from "@/lib/server/world-cup/flags";

export async function requireWorldCupOwner(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
): Promise<void> {
  await requireGroupOwner(supabase, groupId, userId);
}

export function assertWorldCupImportEnabled(): void {
  if (!isWorldCupImportEnabled()) {
    throw new Error("World Cup import is disabled on this server.");
  }
}
