import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { requireWorldCupOwner } from "@/lib/server/world-cup/guards";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";

type RouteContext = {
  params: Promise<{ groupId: string; contestId: string; eventId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, contestId, eventId } = await context.params;
    await requireWorldCupOwner(auth.supabase, groupId, auth.user.id);
    await new GroupContestService(auth.supabase).assertContestInGroup(contestId, groupId);

    const body = (await request.json()) as { lockAt?: string };
    if (!body.lockAt) {
      return NextResponse.json({ error: "lockAt is required (ISO timestamp)" }, { status: 400 });
    }

    const { error } = await auth.supabase
      .from("events")
      .update({ lock_at: body.lockAt, updated_at: new Date().toISOString() })
      .eq("id", eventId)
      .eq("contest_id", contestId);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
