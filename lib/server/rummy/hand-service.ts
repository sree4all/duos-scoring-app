import type { SupabaseClient } from "@supabase/supabase-js";
import type { PointsRummyPresetParams, RummyHandPlayerInput } from "@/lib/domain/rummy/types";
import { STANDARD_POINTS_RUMMY_PRESET } from "@/lib/domain/rummy/types";
import {
  computeHandPoints,
  validateHandInput,
} from "@/lib/server/rummy/preset-calculator";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import {
  requireGroupOwnerOrScorer,
  GroupAccessError,
} from "@/lib/server/groups/guards";
import { canRecordRummyHand } from "@/lib/server/groups/role-helpers";
import type { GroupMembership } from "@/lib/domain/groups/types";

export type RecordHandInput = {
  contestId: string;
  winnerParticipantId: string;
  players: RummyHandPlayerInput[];
  preset?: PointsRummyPresetParams;
};

export class RummyHandService {
  private readonly contests: GroupContestService;

  constructor(private readonly supabase: SupabaseClient) {
    this.contests = new GroupContestService(supabase);
  }

  async assertCanRecord(
    groupId: string,
    userId: string,
  ): Promise<GroupMembership> {
    return requireGroupOwnerOrScorer(this.supabase, groupId, userId);
  }

  private enforceWriteRole(membership: GroupMembership): void {
    if (!canRecordRummyHand(membership)) {
      throw new GroupAccessError(
        "Only group owners and designated scorers can record Rummy hands",
      );
    }
  }

  async recordHand(
    groupId: string,
    userId: string,
    input: RecordHandInput,
  ): Promise<{ handId: string; handNo: number }> {
    const membership = await this.assertCanRecord(groupId, userId);
    this.enforceWriteRole(membership);

    const validationError = validateHandInput(input.players);
    if (validationError) throw new Error(validationError);

    await this.contests.assertContestInGroup(input.contestId, groupId);

    const preset = input.preset ?? STANDARD_POINTS_RUMMY_PRESET;
    const computed = computeHandPoints(input.players, preset);

    const { count } = await this.supabase
      .from("rummy_hands")
      .select("*", { count: "exact", head: true })
      .eq("contest_id", input.contestId);

    const handNo = (count ?? 0) + 1;

    const { data: hand, error: handErr } = await this.supabase
      .from("rummy_hands")
      .insert({
        group_id: groupId,
        contest_id: input.contestId,
        hand_no: handNo,
        winner_participant_id: input.winnerParticipantId,
        preset_key: "points_rummy_standard",
        recorded_by: userId,
      })
      .select("id")
      .single();

    if (handErr) throw handErr;

    const playerRows = input.players.map((p) => ({
      hand_id: hand.id,
      participant_id: p.participantId,
      drop_type: p.dropType ?? "none",
      unmelded_points: p.unmeldedPoints ?? null,
      computed_points: computed[p.participantId] ?? 0,
    }));

    const { error: playersErr } = await this.supabase
      .from("rummy_hand_players")
      .insert(playerRows);

    if (playersErr) throw playersErr;

    for (const p of input.players) {
      const delta = computed[p.participantId] ?? 0;
      const { error: ledgerErr } = await this.supabase.from("contest_points_ledger").insert({
        contest_id: input.contestId,
        participant_id: p.participantId,
        action_type: "rummy_hand",
        points_delta: delta,
        reason_text: `Hand ${handNo}`,
        correlation_id: `rummy:${hand.id}:${p.participantId}`,
      });
      if (ledgerErr) throw ledgerErr;
    }

    return { handId: hand.id as string, handNo };
  }

  async voidHand(
    groupId: string,
    userId: string,
    handId: string,
    voidReason: string,
  ): Promise<void> {
    const membership = await this.assertCanRecord(groupId, userId);
    if (!membership.isOwner) {
      throw new GroupAccessError("Only group owners can void Rummy hands");
    }

    const { data: hand, error } = await this.supabase
      .from("rummy_hands")
      .select("id, contest_id, group_id, hand_no, voided")
      .eq("id", handId)
      .eq("group_id", groupId)
      .maybeSingle();

    if (error) throw error;
    if (!hand || hand.voided) throw new Error("Hand not found or already voided");

    const { error: voidErr } = await this.supabase
      .from("rummy_hands")
      .update({ voided: true, void_reason: voidReason })
      .eq("id", handId);

    if (voidErr) throw voidErr;

    const { data: players } = await this.supabase
      .from("rummy_hand_players")
      .select("participant_id, computed_points")
      .eq("hand_id", handId);

    for (const row of players ?? []) {
      const delta = -Number(row.computed_points ?? 0);
      await this.supabase.from("contest_points_ledger").insert({
        contest_id: hand.contest_id,
        participant_id: row.participant_id,
        action_type: "rummy_void",
        points_delta: delta,
        reason_text: voidReason,
        correlation_id: `rummy:void:${handId}:${row.participant_id}`,
      });
    }
  }
}
