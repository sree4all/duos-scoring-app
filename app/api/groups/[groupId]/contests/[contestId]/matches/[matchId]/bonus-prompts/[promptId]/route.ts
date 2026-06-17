import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { requireWorldCupOwner } from "@/lib/server/world-cup/guards";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { MatchBonusRepository } from "@/lib/server/world-cup/match-bonus-repository";
import { normalizeIncorrectPenalty } from "@/lib/domain/world-cup/match-bonus";
import { rescoreMatchIfCompleted } from "@/lib/server/world-cup/match-bonus-scoring-service";

type RouteContext = {
  params: Promise<{ groupId: string; contestId: string; matchId: string; promptId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, contestId, matchId, promptId } = await context.params;
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
      incorrectPenalty:
        body.incorrectPenalty !== undefined
          ? normalizeIncorrectPenalty(Number(body.incorrectPenalty))
          : undefined,
      correctAnswer: body.correctAnswer,
      isActive: body.isActive,
      options: body.options
        ?.map((o) => ({
          label: o.label?.trim() ?? "",
          value: o.value?.trim() ?? o.label?.trim() ?? "",
        }))
        .filter((o) => o.label.length > 0),
    });

    const officialAnswerSet = Boolean(body.correctAnswer?.trim());
    if (officialAnswerSet) {
      const scoreOutcome = await rescoreMatchIfCompleted(
        auth.supabase,
        groupId,
        contestId,
        matchId,
      );
      if (scoreOutcome && !scoreOutcome.ok) {
        return NextResponse.json({ error: scoreOutcome.error }, { status: 400 });
      }
      if (scoreOutcome?.ok) {
        return NextResponse.json({
          ok: true,
          scored: true,
          ledgerRows: scoreOutcome.ledgerRows,
        });
      }
    }

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
