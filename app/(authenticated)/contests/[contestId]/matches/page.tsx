import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { listRevealedScheduleEvents } from "@/lib/server/world-cup/schedule-query";
import { StageRulesRepository } from "@/lib/server/world-cup/stage-rules-repository";
import { MatchScheduleList } from "@/components/world-cup/match-schedule-list";
import { StagePointsPanel } from "@/components/world-cup/stage-points-panel";
import { worldCupCopy } from "@/lib/copy/world-cup";
import { isWorldCupPrivateMode } from "@/lib/server/world-cup/flags";

type PageProps = { params: Promise<{ contestId: string }> };

export default async function ContestMatchesPage({ params }: PageProps) {
  const { contestId } = await params;
  const { supabase, user } = await requireUser();
  const activeGroupId = await resolveActiveGroupId(supabase, user.id);
  if (!activeGroupId) notFound();

  const membership = await requireGroupMembership(supabase, activeGroupId, user.id);
  const contest = await new GroupContestService(supabase).assertContestInGroup(
    contestId,
    activeGroupId,
  );

  const isOwner = membership.isOwner;
  const memberView = !isOwner;
  const events = await listRevealedScheduleEvents(supabase, contestId, memberView);
  const rules = await new StageRulesRepository(supabase).listForContest(contestId, memberView);

  const allRules = isOwner
    ? await new StageRulesRepository(supabase).listForContest(contestId, false)
    : [];
  const groupStageRevealed = allRules.some(
    (r) => r.stageKey === "group_stage" && r.revealedAt,
  );

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{worldCupCopy.nav.worldCupPicks}</h1>
        <p className="text-sm text-muted-foreground">{contest.name}</p>
      </header>

      {isOwner && !groupStageRevealed ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950">
          <p className="font-medium">Players cannot see matches yet</p>
          <p className="mt-1 text-muted-foreground">
            Reveal <strong>Group Stage</strong> on the rounds page so members can make picks.
            You can preview all imported matches below.
          </p>
          <Link
            href={`/groups/${activeGroupId}/world-cup/stages?contestId=${contestId}`}
            className="mt-2 inline-block font-medium underline"
          >
            Open rounds &amp; reveal Group Stage
          </Link>
        </div>
      ) : null}

      {memberView && events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{worldCupCopy.errors.notOpenYet}</p>
      ) : null}

      <div>
        <h2 className="text-sm font-semibold">How points work</h2>
        <div className="mt-2">
          <StagePointsPanel rules={rules.length > 0 ? rules : allRules} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold">Matches</h2>
        <div className="mt-2">
          <MatchScheduleList contestId={contestId} events={events} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href={`/contests/${contestId}/leaderboard`} className="underline">
          {worldCupCopy.nav.standings}
        </Link>
        <Link href={`/groups/${activeGroupId}`} className="underline">
          Group home
        </Link>
        {isOwner && isWorldCupPrivateMode() ? (
          <Link
            href={`/groups/${activeGroupId}/world-cup?contestId=${contestId}`}
            className="underline"
          >
            Organizer
          </Link>
        ) : null}
      </div>
    </section>
  );
}
