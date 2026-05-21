import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { requireWorldCupOwner } from "@/lib/server/world-cup/guards";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { MatchBonusRepository } from "@/lib/server/world-cup/match-bonus-repository";

type RouteContext = {
  params: Promise<{ groupId: string; contestId: string; matchId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, contestId, matchId } = await context.params;
    await new GroupContestService(auth.supabase).assertContestInGroup(contestId, groupId);

    const prompts = await new MatchBonusRepository(auth.supabase).listForMatch(matchId);
    return NextResponse.json({ prompts });
  } catch (error) {
    return groupErrorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, contestId, matchId } = await context.params;
    await requireWorldCupOwner(auth.supabase, groupId, auth.user.id);
    await new GroupContestService(auth.supabase).assertContestInGroup(contestId, groupId);

    const body = (await request.json()) as {
      promptText?: string;
      options?: { label: string; value: string }[];
      correctPoints?: number;
      incorrectPenalty?: number;
      correctAnswer?: string | null;
      seasonYear?: number;
    };

    if (!body.promptText?.trim()) {
      return NextResponse.json({ error: "Question text is required" }, { status: 400 });
    }

    const options = (body.options ?? [])
      .map((o) => ({ label: o.label?.trim() ?? "", value: o.value?.trim() ?? o.label?.trim() ?? "" }))
      .filter((o) => o.label.length > 0);

    if (options.length < 2) {
      return NextResponse.json({ error: "Add at least two answer choices" }, { status: 400 });
    }

    const prompt = await new MatchBonusRepository(auth.supabase).createPrompt({
      matchId,
      seasonYear: body.seasonYear ?? 2026,
      promptText: body.promptText,
      options,
      correctPoints: Number(body.correctPoints ?? 2),
      incorrectPenalty: Number(body.incorrectPenalty ?? 0),
      correctAnswer: body.correctAnswer ?? null,
    });

    return NextResponse.json({ prompt });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
