import type { SupabaseClient } from "@supabase/supabase-js";
import { buildVoidReversalDelta } from "@/lib/server/generalized-scoring/voided-event-service";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";

export async function voidGroupContestEvent(
  supabase: SupabaseClient,
  groupId: string,
  contestId: string,
  eventId: string,
  voidReason: string,
  priorEventPoints: number,
): Promise<void> {
  const contests = new GroupContestService(supabase);
  await contests.assertContestInGroup(contestId, groupId);

  const reversal = buildVoidReversalDelta({ priorEventPoints });

  const { error: evErr } = await supabase
    .from("events")
    .update({
      voided: true,
      void_reason: voidReason,
      state: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("contest_id", contestId);

  if (evErr) throw evErr;

  if (reversal !== 0) {
    const { error: ledgerErr } = await supabase.from("contest_points_ledger").insert({
      contest_id: contestId,
      event_id: eventId,
      participant_id: "system",
      action_type: "void_reversal",
      points_delta: reversal,
      reason_text: voidReason,
      correlation_id: `void:${eventId}`,
    });

    if (ledgerErr) throw ledgerErr;
  }
}
