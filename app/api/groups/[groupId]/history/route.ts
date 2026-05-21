import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import { listGroupHistoryForUser } from "@/lib/server/groups/history-query";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await context.params;
    await requireGroupMembership(auth.supabase, groupId, auth.user.id);

    const items = await listGroupHistoryForUser(auth.supabase, groupId, auth.user.id);
    return NextResponse.json({ items });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
