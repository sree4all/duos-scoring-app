import { NextResponse } from "next/server";
import { GroupService } from "@/lib/server/groups/group-service";
import { applyActiveGroupIdCookie } from "@/lib/server/groups/active-context";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { inviteCode?: string };
    if (!body.inviteCode?.trim()) {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }

    const service = new GroupService(auth.supabase);
    const groupId = await service.joinByInviteCode(body.inviteCode, auth.user.id);

    const response = NextResponse.json({ groupId });
    applyActiveGroupIdCookie(response, groupId);
    return response;
  } catch (error) {
    return groupErrorResponse(error);
  }
}
