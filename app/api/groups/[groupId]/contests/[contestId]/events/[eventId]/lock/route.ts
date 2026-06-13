import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { requireWorldCupOwner } from "@/lib/server/world-cup/guards";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { defaultMatchLockAtIso } from "@/lib/utils/match-lock";

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

    const { data: event } = await auth.supabase
      .from("events")
      .select("source_match_id")
      .eq("id", eventId)
      .eq("contest_id", contestId)
      .maybeSingle();

    if (!event?.source_match_id) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { data: match } = await auth.supabase
      .from("matches")
      .select("match_time_utc")
      .eq("id", event.source_match_id as string)
      .maybeSingle();

    if (!match?.match_time_utc) {
      return NextResponse.json({ error: "Match kickoff not found" }, { status: 404 });
    }

    const latestAllowedLock = defaultMatchLockAtIso(match.match_time_utc as string);
    if (new Date(body.lockAt).getTime() > new Date(latestAllowedLock).getTime()) {
      return NextResponse.json(
        {
          error:
            "Lock time cannot be later than 30 minutes before kickoff. Choose an earlier time.",
        },
        { status: 400 },
      );
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
