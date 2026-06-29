import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { requireWorldCupOwner } from "@/lib/server/world-cup/guards";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { createServiceClient } from "@/lib/supabase/service";
import { buildMatchScoringAudit } from "@/lib/server/world-cup/match-scoring-audit";

type RouteContext = {
  params: Promise<{ groupId: string; contestId: string }>;
};

/** Owner-only: per-player expected vs ledger scoring for one match. */
export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, contestId } = await context.params;
    await requireWorldCupOwner(auth.supabase, groupId, auth.user.id);
    await new GroupContestService(auth.supabase).assertContestInGroup(contestId, groupId);

    const url = new URL(request.url);
    const matchNumber = Number(url.searchParams.get("matchNumber") ?? "73");
    if (!Number.isFinite(matchNumber) || matchNumber < 1) {
      return NextResponse.json({ error: "Invalid matchNumber" }, { status: 400 });
    }

    const service = createServiceClient();
    const audit = await buildMatchScoringAudit(service, contestId, groupId, matchNumber);
    if (!audit) {
      return NextResponse.json({ error: `Match ${matchNumber} not found` }, { status: 404 });
    }

    return NextResponse.json({ ok: true, audit });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
