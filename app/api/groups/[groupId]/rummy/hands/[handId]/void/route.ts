import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { RummyHandService } from "@/lib/server/rummy/hand-service";

type RouteContext = { params: Promise<{ groupId: string; handId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId, handId } = await context.params;
    const body = (await request.json()) as { voidReason?: string };

    if (!body.voidReason?.trim()) {
      return NextResponse.json({ error: "voidReason is required" }, { status: 400 });
    }

    const service = new RummyHandService(auth.supabase);
    await service.voidHand(groupId, auth.user.id, handId, body.voidReason.trim());

    return NextResponse.json({ ok: true });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
