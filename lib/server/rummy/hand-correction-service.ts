import type { SupabaseClient } from "@supabase/supabase-js";
import { RummyHandService, type RecordHandInput } from "@/lib/server/rummy/hand-service";

export class RummyHandCorrectionService {
  private readonly hands: RummyHandService;

  constructor(private readonly supabase: SupabaseClient) {
    this.hands = new RummyHandService(supabase);
  }

  /**
   * Append-only correction: records a new hand linked to the prior hand.
   */
  async correctHand(
    groupId: string,
    userId: string,
    priorHandId: string,
    correctionReason: string,
    input: RecordHandInput,
  ): Promise<{ handId: string; handNo: number }> {
    if (!correctionReason.trim()) {
      throw new Error("correction_reason is required");
    }

    const { data: prior, error } = await this.supabase
      .from("rummy_hands")
      .select("id, contest_id, group_id, voided")
      .eq("id", priorHandId)
      .eq("group_id", groupId)
      .maybeSingle();

    if (error) throw error;
    if (!prior || prior.voided) throw new Error("Prior hand not found or voided");

    const result = await this.hands.recordHand(groupId, userId, {
      ...input,
      contestId: prior.contest_id as string,
    });

    const { error: linkErr } = await this.supabase
      .from("rummy_hands")
      .update({
        correction_of_hand_id: priorHandId,
        correction_reason: correctionReason,
      })
      .eq("id", result.handId);

    if (linkErr) throw linkErr;

    return result;
  }
}
