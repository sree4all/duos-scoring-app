import { NextResponse } from "next/server";
import { GroupMembershipService } from "@/lib/server/groups/membership-service";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await context.params;
    await requireGroupMembership(auth.supabase, groupId, auth.user.id);

    const memberships = new GroupMembershipService(auth.supabase);
    await memberships.leaveGroup(groupId, auth.user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
