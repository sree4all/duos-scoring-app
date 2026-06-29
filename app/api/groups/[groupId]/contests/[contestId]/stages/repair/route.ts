import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { requireWorldCupOwner } from "@/lib/server/world-cup/guards";
import { recalculateStageScoring } from "@/lib/server/world-cup/recalculate-stage";

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

    const result = await recalculateStageScoring(
      auth.supabase,
      contestId,
      stageKey,
      "repair_wrong_pick_penalties",
    );

    return NextResponse.json({
      ok: true,
      stageKey,
      ...result,
      message:
        result.rescored > 0
          ? `Re-scored ${result.rescored} completed matches. Wrong picks now use the configured penalty.`
          : "No completed matches found for this round. Confirm results are saved and matches are completed.",
    });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
