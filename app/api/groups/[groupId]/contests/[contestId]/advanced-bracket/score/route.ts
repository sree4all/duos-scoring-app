import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { requireWorldCupOwner } from "@/lib/server/world-cup/guards";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import type { AdvancedBracketScoringPhase } from "@/lib/domain/world-cup/advanced-bracket";
import { applyAdvancedBracketScoring } from "@/lib/server/world-cup/advanced-bracket-service";

type RouteContext = { params: Promise<{ groupId: string; contestId: string }> };

const VALID_PHASES: AdvancedBracketScoringPhase[] = ["semi_finalists", "finalists", "winner"];

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, contestId } = await context.params;
    await requireWorldCupOwner(auth.supabase, groupId, auth.user.id);
    await new GroupContestService(auth.supabase).assertContestInGroup(contestId, groupId);

    const body = (await request.json()) as { phase?: string };
    const phase = body.phase as AdvancedBracketScoringPhase | undefined;
    if (!phase || !VALID_PHASES.includes(phase)) {
      return NextResponse.json({ error: "phase must be semi_finalists, finalists, or winner" }, { status: 400 });
    }

    const result = await applyAdvancedBracketScoring(auth.supabase, contestId, phase);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      rowsAwarded: result.rowsAwarded,
      officialTeams: result.officialTeams,
    });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
