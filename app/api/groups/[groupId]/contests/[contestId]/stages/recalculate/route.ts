import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { requireWorldCupOwner } from "@/lib/server/world-cup/guards";
import { recalculateStageScoring } from "@/lib/server/world-cup/recalculate-stage";

type RouteContext = { params: Promise<{ groupId: string; contestId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, contestId } = await context.params;
    await requireWorldCupOwner(auth.supabase, groupId, auth.user.id);

    const body = (await request.json()) as { stageKey?: string; reason?: string };
    if (!body.stageKey || !body.reason?.trim()) {
      return NextResponse.json({ error: "stageKey and reason are required" }, { status: 400 });
    }

    const result = await recalculateStageScoring(
      auth.supabase,
      contestId,
      body.stageKey,
      body.reason.trim(),
    );

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
