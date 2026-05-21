import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { requireWorldCupOwner } from "@/lib/server/world-cup/guards";
import { StageRulesRepository } from "@/lib/server/world-cup/stage-rules-repository";

type RouteContext = { params: Promise<{ groupId: string; contestId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { contestId } = await context.params;
    const repo = new StageRulesRepository(auth.supabase);
    const rules = await repo.listForContest(contestId, false);
    return NextResponse.json({
      rules: rules.map((r) => ({
        stageKey: r.stageKey,
        stageName: r.stageName,
        stageOrder: r.stageOrder,
        correctPoints: r.correctPoints,
        incorrectPenalty: r.incorrectPenalty,
        revealedAt: r.revealedAt,
      })),
    });
  } catch (error) {
    return groupErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, contestId } = await context.params;
    await requireWorldCupOwner(auth.supabase, groupId, auth.user.id);

    const body = (await request.json()) as {
      stageKey: string;
      correctPoints?: number;
      incorrectPenalty?: number;
      revealed?: boolean;
    };

    if (!body.stageKey) {
      return NextResponse.json({ error: "stageKey is required" }, { status: 400 });
    }

    const repo = new StageRulesRepository(auth.supabase);
    await repo.updateStageRule(contestId, body.stageKey, {
      correctPoints: body.correctPoints,
      incorrectPenalty: body.incorrectPenalty,
      revealedAt: body.revealed === true ? new Date().toISOString() : body.revealed === false ? null : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
