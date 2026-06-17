import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createGroupPredictionBridge,
  GroupPredictionAdapter,
} from "@/lib/server/groups/prediction-adapter";

/** Re-run match scoring when a bonus official answer is set after the match is completed. */
export async function rescoreMatchIfCompleted(
  supabase: SupabaseClient,
  groupId: string,
  contestId: string,
  matchId: string,
): Promise<{ ok: true; ledgerRows: number } | { ok: false; error: string } | null> {
  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .select("status")
    .eq("id", matchId)
    .maybeSingle();

  if (matchErr) return { ok: false, error: matchErr.message };
  if (!match || match.status !== "completed") return null;

  const adapter = new GroupPredictionAdapter(supabase);
  const bridge = createGroupPredictionBridge(groupId, contestId);
  return adapter.scoreLinkedMatch(bridge, matchId);
}
