import type { SupabaseClient } from "@supabase/supabase-js";
import { applyMatchScoring, type MatchScoreOutcome } from "@/lib/scoring/match-scoring";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { requireGroupMembership, requireGroupOwner } from "@/lib/server/groups/guards";
import { scoreReadyAdvancedBracketPhases } from "@/lib/server/world-cup/advanced-bracket-service";
import { resolveEventStageKey } from "@/lib/server/world-cup/schedule-query";

export type GroupPredictionBridge = {
  groupId: string;
  contestId: string;
  tournamentScopeId?: string | null;
};

export function createGroupPredictionBridge(
  groupId: string,
  contestId: string,
  tournamentScopeId?: string | null,
): GroupPredictionBridge {
  return { groupId, contestId, tournamentScopeId };
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
      contest.tournament_scope_id ?? null,
    );
  }

  /** Score a match linked to a group contest event (winner + bonus points). */
  async scoreLinkedMatch(
    bridge: GroupPredictionBridge,
    matchId: string,
    seasonYear = 2026,
  ): Promise<MatchScoreOutcome> {
    await this.contests.assertContestInGroup(bridge.contestId, bridge.groupId);

    const { data: event, error: evErr } = await this.supabase
      .from("events")
      .select("id, contest_id, source_match_id, voided, stage_key")
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

    const stageKey =
      (await resolveEventStageKey(this.supabase, {
        stage_key: event.stage_key as string | null,
        source_match_id: matchId,
      })) ?? undefined;

    const outcome = await applyMatchScoring(this.supabase, matchId, seasonYear, {
      contestId: bridge.contestId,
      stageKey,
    });

    if (outcome.ok) {
      // Keep tournament forecast ledger aligned when knockout results unlock a phase
      // (e.g. Final match scoring also awards the champion forecast).
      try {
        await scoreReadyAdvancedBracketPhases(
          this.supabase,
          bridge.contestId,
          seasonYear,
        );
      } catch (forecastErr) {
        console.error(
          "match scoring: ready advanced-bracket phases failed",
          forecastErr instanceof Error ? forecastErr.message : forecastErr,
        );
      }
    }

    return outcome;
  }
}
