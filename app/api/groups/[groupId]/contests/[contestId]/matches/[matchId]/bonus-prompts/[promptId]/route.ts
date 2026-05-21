import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { requireWorldCupOwner } from "@/lib/server/world-cup/guards";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { MatchBonusRepository } from "@/lib/server/world-cup/match-bonus-repository";

type RouteContext = {
  params: Promise<{ groupId: string; contestId: string; matchId: string; promptId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, contestId, promptId } = await context.params;
    await requireWorldCupOwner(auth.supabase, groupId, auth.user.id);
    await new GroupContestService(auth.supabase).assertContestInGroup(contestId, groupId);

    const body = (await request.json()) as {
      promptText?: string;
      options?: { label: string; value: string }[];
      correctPoints?: number;
      incorrectPenalty?: number;
      correctAnswer?: string | null;
      isActive?: boolean;
    };

    const repo = new MatchBonusRepository(auth.supabase);
    await repo.updatePrompt(promptId, {
      promptText: body.promptText,
      correctPoints: body.correctPoints,
      incorrectPenalty: body.incorrectPenalty,
      correctAnswer: body.correctAnswer,
      isActive: body.isActive,
      options: body.options
        ?.map((o) => ({
          label: o.label?.trim() ?? "",
          value: o.value?.trim() ?? o.label?.trim() ?? "",
        }))
        .filter((o) => o.label.length > 0),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return groupErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, contestId, promptId } = await context.params;
    await requireWorldCupOwner(auth.supabase, groupId, auth.user.id);
    await new GroupContestService(auth.supabase).assertContestInGroup(contestId, groupId);

    await new MatchBonusRepository(auth.supabase).updatePrompt(promptId, { isActive: false });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
