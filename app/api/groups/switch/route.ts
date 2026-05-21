import { NextResponse } from "next/server";
import { applyActiveGroupIdCookie } from "@/lib/server/groups/active-context";
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

    const response = NextResponse.json({ groupId: body.groupId });
    applyActiveGroupIdCookie(response, body.groupId);
    return response;
  } catch (error) {
    return groupErrorResponse(error);
  }
}
