import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { requireWorldCupOwner } from "@/lib/server/world-cup/guards";
import { recalculateStageScoring } from "@/lib/server/world-cup/recalculate-stage";
import { resyncContestLedgerFromSeason } from "@/lib/server/world-cup/contest-ledger-mirror";
import { createServiceClient } from "@/lib/supabase/service";

type RouteContext = { params: Promise<{ groupId: string; contestId: string }> };

/** Re-score completed matches for a stage (applies wrong-pick penalties to ledger). */
export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, contestId } = await context.params;
    await requireWorldCupOwner(auth.supabase, groupId, auth.user.id);

    const body = (await request.json()) as { stageKey?: string };
    const stageKey = body.stageKey?.trim() || "round_of_32";

    const serviceSupabase = createServiceClient();

    if (stageKey === "round_of_32") {
      await serviceSupabase
        .from("contest_stage_scoring_rules")
        .update({ incorrect_penalty: -1, updated_at: new Date().toISOString() })
        .eq("contest_id", contestId)
        .eq("stage_key", "round_of_32")
        .or("incorrect_penalty.is.null,incorrect_penalty.eq.0");
    }

    const result = await recalculateStageScoring(
      serviceSupabase,
      contestId,
      stageKey,
      "repair_wrong_pick_penalties",
    );

    const resync = await resyncContestLedgerFromSeason(serviceSupabase, contestId);

    return NextResponse.json({
      ok: true,
      stageKey,
      ...result,
      mirrored: resync.mirrored,
      message:
        result.rescored > 0 || resync.mirrored > 0
          ? `Re-scored ${result.rescored} completed matches and synced ${resync.mirrored} events to the contest ledger. Wrong picks now use the configured penalty.`
          : "No completed matches found for this round. Confirm results are saved and matches are completed.",
    });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
