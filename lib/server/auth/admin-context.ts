import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminGroupMemberOption } from "@/components/world-cup/admin-proxy-prediction-panel";

export async function loadAdminGroupMembers(
  supabase: SupabaseClient,
  groupId: string,
): Promise<AdminGroupMemberOption[]> {
  const { data: memberRows } = await supabase
    .from("group_memberships")
    .select("user_id")
    .eq("group_id", groupId)
    .is("removed_at", null);

  const memberIds = (memberRows ?? []).map((row) => row.user_id as string);
  if (memberIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", memberIds);

  return (profiles ?? [])
    .map((profile) => ({
      userId: profile.id as string,
      displayName: ((profile.display_name as string) || "Player").trim() || "Player",
    }))
    .sort((a, b) =>
      a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" }),
    );
}

export async function isPlatformAdmin(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return profile?.role === "admin";
}
