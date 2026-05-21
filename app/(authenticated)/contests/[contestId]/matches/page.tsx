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

type PageProps = { params: Promise<{ contestId: string }> };

export default async function ContestMatchesPage({ params }: PageProps) {
  const { contestId } = await params;
  const { supabase, user } = await requireUser();
  const activeGroupId = await resolveActiveGroupId(supabase, user.id);
  if (!activeGroupId) notFound();

  await requireGroupMembership(supabase, activeGroupId, user.id);
  const contest = await new GroupContestService(supabase).assertContestInGroup(
    contestId,
    activeGroupId,
  );

  const events = await listRevealedScheduleEvents(supabase, contestId, true);
  const rules = await new StageRulesRepository(supabase).listForContest(contestId, true);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{worldCupCopy.nav.worldCupPicks}</h1>
        <p className="text-sm text-muted-foreground">{contest.name}</p>
      </header>

      <div>
        <h2 className="text-sm font-semibold">How points work</h2>
        <div className="mt-2">
          <StagePointsPanel rules={rules} />
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
      </div>
    </section>
  );
}
