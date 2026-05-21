import { NextResponse } from "next/server";
import { GroupService } from "@/lib/server/groups/group-service";
import { requireGroupOwner } from "@/lib/server/groups/guards";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await context.params;
    await requireGroupOwner(auth.supabase, groupId, auth.user.id);

    const body = (await request.json()) as {
      action?: "remove" | "set_scorer" | "regenerate_invite";
      userId?: string;
      isScorer?: boolean;
    };

    const service = new GroupService(auth.supabase);
    const memberships = service.getMembershipService();

    switch (body.action) {
      case "regenerate_invite": {
        const inviteCode = await service.regenerateInviteCode(groupId);
        return NextResponse.json({ inviteCode });
      }
      case "remove": {
        if (!body.userId) {
          return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }
        await memberships.removeMember(groupId, body.userId);
        return NextResponse.json({ ok: true });
      }
      case "set_scorer": {
        if (!body.userId || typeof body.isScorer !== "boolean") {
          return NextResponse.json(
            { error: "userId and isScorer are required" },
            { status: 400 },
          );
        }
        await memberships.setScorer(groupId, body.userId, body.isScorer);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    return groupErrorResponse(error);
  }
}
