import { NextResponse } from "next/server";
import { GroupService } from "@/lib/server/groups/group-service";
import { applyActiveGroupIdCookie } from "@/lib/server/groups/active-context";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { isGroupCreationDisabled } from "@/lib/server/world-cup/flags";

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isGroupCreationDisabled()) {
      return NextResponse.json(
        { error: "New groups are disabled. Join with your invite code instead." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as { name?: string };
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    const service = new GroupService(auth.supabase);
    const group = await service.createGroup(body.name, auth.user.id);

    const response = NextResponse.json({
      groupId: group.id,
      name: group.name,
      inviteCode: group.currentInviteCode,
    });
    applyActiveGroupIdCookie(response, group.id);
    return response;
  } catch (error) {
    return groupErrorResponse(error);
  }
}
