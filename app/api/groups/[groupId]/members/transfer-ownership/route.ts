import { NextResponse } from "next/server";
import { requireGroupOwner } from "@/lib/server/groups/guards";
import { GroupMembershipService } from "@/lib/server/groups/membership-service";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await context.params;
    await requireGroupOwner(auth.supabase, groupId, auth.user.id);

    const body = (await request.json()) as { toUserId?: string; demoteSelf?: boolean };
    if (!body.toUserId) {
      return NextResponse.json({ error: "toUserId is required" }, { status: 400 });
    }

    const memberships = new GroupMembershipService(auth.supabase);
    await memberships.transferOwnership(
      groupId,
      auth.user.id,
      body.toUserId,
      body.demoteSelf ?? true,
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
