import { NextResponse } from "next/server";
import { setActiveGroupIdCookie } from "@/lib/server/groups/active-context";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { groupId?: string };
    if (!body.groupId) {
      return NextResponse.json({ error: "groupId is required" }, { status: 400 });
    }

    await requireGroupMembership(auth.supabase, body.groupId, auth.user.id);
    await setActiveGroupIdCookie(body.groupId);

    return NextResponse.json({ groupId: body.groupId });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
