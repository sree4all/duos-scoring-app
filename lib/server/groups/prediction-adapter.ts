import type { SupabaseClient } from "@supabase/supabase-js";
import { applyMatchScoring, type MatchScoreOutcome } from "@/lib/scoring/match-scoring";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { requireGroupMembership, requireGroupOwner } from "@/lib/server/groups/guards";

export type GroupPredictionBridge = {
  groupId: string;
  contestId: string;
  legacyTournamentScopeId?: string | null;
};

export function createGroupPredictionBridge(
  groupId: string,
  contestId: string,
  legacyTournamentScopeId?: string | null,
): GroupPredictionBridge {
  return { groupId, contestId, legacyTournamentScopeId };
}

export class GroupPredictionAdapter {
  private readonly contests: GroupContestService;

  constructor(private readonly supabase: SupabaseClient) {
    this.contests = new GroupContestService(supabase);
  }

  async assertMemberCanView(groupId: string, userId: string): Promise<void> {
    await requireGroupMembership(this.supabase, groupId, userId);
  }

  async assertOwnerCanScore(
    groupId: string,
    userId: string,
    contestId: string,
  ): Promise<GroupPredictionBridge> {
    await requireGroupOwner(this.supabase, groupId, userId);
    const contest = await this.contests.assertContestInGroup(contestId, groupId);
    return createGroupPredictionBridge(
      groupId,
      contestId,
      contest.legacy_tournament_scope_id ?? null,
    );
  }

  /**
   * Score a legacy match linked to a group contest event (winner + bonus parity).
   */
  async scoreLinkedMatch(
    bridge: GroupPredictionBridge,
    matchId: string,
    seasonYear = 2026,
  ): Promise<MatchScoreOutcome> {
    await this.contests.assertContestInGroup(bridge.contestId, bridge.groupId);

    const { data: event, error: evErr } = await this.supabase
      .from("events")
      .select("id, contest_id, source_match_id, voided")
      .eq("contest_id", bridge.contestId)
      .eq("source_match_id", matchId)
      .maybeSingle();

    if (evErr) throw evErr;
    if (!event) {
      return { ok: false, error: "No event linked to this match for the contest" };
    }
    if (event.voided) {
      return { ok: false, error: "Event is voided; scoring is blocked" };
    }

    return applyMatchScoring(this.supabase, matchId, seasonYear);
  }
}
