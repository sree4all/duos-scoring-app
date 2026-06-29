import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { mapGroupError } from "@/lib/server/groups/error-messages";
import { GroupPredictionAdapter } from "@/lib/server/groups/prediction-adapter";

type RouteContext = { params: Promise<{ groupId: string; contestId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId, contestId } = await context.params;
    const body = (await request.json()) as { matchId?: string; seasonYear?: number };

    if (!body.matchId) {
      return NextResponse.json({ error: "matchId is required" }, { status: 400 });
    }

    const adapter = new GroupPredictionAdapter(auth.supabase);
    const bridge = await adapter.assertOwnerCanScore(groupId, auth.user.id, contestId);
    const outcome = await adapter.scoreLinkedMatch(bridge, body.matchId, body.seasonYear ?? 2026);

    if (!outcome.ok) {
      return NextResponse.json({ error: mapGroupError(new Error(outcome.error)) }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      ledgerRows: outcome.ledgerRows,
      stageKey: outcome.stageKey,
      missPenalty: outcome.missPenalty,
    });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
