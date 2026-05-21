import { NextResponse } from "next/server";
import { validatePublishReadiness } from "@/lib/server/generalized-scoring/publish-validation";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { requireGroupOwnerForContestConfig } from "@/lib/server/groups/guards";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await context.params;
    await requireGroupOwnerForContestConfig(auth.supabase, groupId, auth.user.id);

    const body = (await request.json()) as {
      action?: string;
      name?: string;
      formatLabel?: "prediction" | "rummy_points";
      contestId?: string;
      events?: {
        title: string;
        openAt: string;
        lockAt: string;
        sourceMatchId: string;
      }[];
      hasEvents?: boolean;
      hasScoringPreset?: boolean;
      hasValidLockPolicy?: boolean;
    };

    const contests = new GroupContestService(auth.supabase);

    if (body.action === "create_draft") {
      if (!body.name?.trim()) {
        return NextResponse.json({ error: "Contest name is required" }, { status: 400 });
      }
      const name = body.name.trim();
      const contest = await contests.createDraftContest(groupId, {
        name,
        formatLabel: body.formatLabel ?? "prediction",
      });
      const isWorldCup =
        (body.formatLabel ?? "prediction") === "prediction" &&
        (name.toLowerCase().includes("world cup") || name.toLowerCase().includes("fifa"));
      if (isWorldCup) {
        const { seedDefaultStageRules } = await import("@/lib/server/world-cup/seed-stage-rules");
        await seedDefaultStageRules(auth.supabase, contest.id, groupId);
      }
      return NextResponse.json({ ok: true, contestId: contest.id, worldCup: isWorldCup });
    }

    if (body.action === "save_events" && body.contestId && body.events) {
      await contests.assertContestInGroup(body.contestId, groupId);
      for (const ev of body.events) {
        if (!ev.title?.trim()) continue;
        const { error } = await auth.supabase.from("events").insert({
          contest_id: body.contestId,
          title: ev.title.trim(),
          open_at: ev.openAt || null,
          lock_at: ev.lockAt || null,
          source_match_id: ev.sourceMatchId || null,
          state: "scheduled_open",
        });
        if (error) throw error;
      }
      return NextResponse.json({ ok: true, contestId: body.contestId });
    }

    if (body.action === "publish" && body.contestId) {
      const validation = validatePublishReadiness({
        hasEvents: Boolean(body.hasEvents),
        hasScoringPreset: Boolean(body.hasScoringPreset),
        hasValidLockPolicy: Boolean(body.hasValidLockPolicy),
      });
      if (!validation.ok) {
        return NextResponse.json({
          ok: false,
          contestId: body.contestId,
          errors: validation.errors,
        });
      }
      await contests.publishContest(body.contestId);
      return NextResponse.json({ ok: true, contestId: body.contestId });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
