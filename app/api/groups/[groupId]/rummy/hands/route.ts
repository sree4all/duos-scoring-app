import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { RummyHandService } from "@/lib/server/rummy/hand-service";
import type { RummyHandPlayerInput } from "@/lib/domain/rummy/types";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await context.params;
    const body = (await request.json()) as {
      contestId?: string;
      winnerParticipantId?: string;
      players?: RummyHandPlayerInput[];
    };

    if (!body.contestId || !body.winnerParticipantId || !body.players?.length) {
      return NextResponse.json({ error: "Invalid hand payload" }, { status: 400 });
    }

    const service = new RummyHandService(auth.supabase);
    const result = await service.recordHand(groupId, auth.user.id, {
      contestId: body.contestId,
      winnerParticipantId: body.winnerParticipantId,
      players: body.players,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
