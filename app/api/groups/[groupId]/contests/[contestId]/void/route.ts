import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { requireWorldCupOwner } from "@/lib/server/world-cup/guards";
import { voidGroupContestEvent } from "@/lib/server/groups/prediction-void";

type RouteContext = { params: Promise<{ groupId: string; contestId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, contestId } = await context.params;
    await requireWorldCupOwner(auth.supabase, groupId, auth.user.id);

    const body = (await request.json()) as {
      eventId?: string;
      reason?: string;
      priorEventPoints?: number;
    };

    if (!body.eventId || !body.reason?.trim()) {
      return NextResponse.json({ error: "eventId and reason are required" }, { status: 400 });
    }

    await voidGroupContestEvent(
      auth.supabase,
      groupId,
      contestId,
      body.eventId,
      body.reason.trim(),
      body.priorEventPoints ?? 0,
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
