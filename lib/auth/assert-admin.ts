import type { SupabaseClient } from "@supabase/supabase-js";

export async function assertAdminActor(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { ok: false, error: "Admin permissions required." };
  }
  return { ok: true };
}
