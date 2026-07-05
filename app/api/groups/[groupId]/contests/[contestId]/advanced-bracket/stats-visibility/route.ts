import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { isPlatformAdmin } from "@/lib/server/auth/admin-context";

type RouteContext = { params: Promise<{ groupId: string; contestId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, contestId } = await context.params;
    const isAdmin = await isPlatformAdmin(auth.supabase, auth.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "Only platform admins can change visibility" }, { status: 403 });
    }

    await new GroupContestService(auth.supabase).assertContestInGroup(contestId, groupId);

    const body = (await request.json()) as { visibleToMembers?: boolean };
    if (typeof body.visibleToMembers !== "boolean") {
      return NextResponse.json({ error: "visibleToMembers must be a boolean" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { error } = await auth.supabase.from("group_tournament_config").upsert(
      {
        group_id: groupId,
        season_year: 2026,
        advanced_bracket_stats_visible_to_members: body.visibleToMembers,
        updated_at: now,
      },
      { onConflict: "group_id,season_year" },
    );

    if (error) throw error;

    return NextResponse.json({ ok: true, visibleToMembers: body.visibleToMembers });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
