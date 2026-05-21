import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { requireWorldCupOwner } from "@/lib/server/world-cup/guards";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { setMatchOfficialResult } from "@/lib/server/world-cup/match-result-service";

type RouteContext = {
  params: Promise<{ groupId: string; contestId: string; matchId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, contestId, matchId } = await context.params;
    await requireWorldCupOwner(auth.supabase, groupId, auth.user.id);
    await new GroupContestService(auth.supabase).assertContestInGroup(contestId, groupId);

    const body = (await request.json()) as { winner?: string };
    if (!body.winner?.trim()) {
      return NextResponse.json({ error: "winner is required" }, { status: 400 });
    }

    const outcome = await setMatchOfficialResult(
      auth.supabase,
      contestId,
      matchId,
      body.winner,
    );

    if (!outcome.ok) {
      return NextResponse.json({ error: outcome.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
