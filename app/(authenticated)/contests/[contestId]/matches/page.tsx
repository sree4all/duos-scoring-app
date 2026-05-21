import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { listRevealedScheduleEvents } from "@/lib/server/world-cup/schedule-query";
import { StageRulesRepository } from "@/lib/server/world-cup/stage-rules-repository";
import { loadPredictionStatsForContest } from "@/lib/server/world-cup/prediction-stats";
import { pickDefaultStatsEventId } from "@/lib/server/world-cup/pick-default-event";
import { MatchScheduleList } from "@/components/world-cup/match-schedule-list";
import { StagePointsPanel } from "@/components/world-cup/stage-points-panel";
import { ContestMatchesTabs } from "@/components/world-cup/contest-matches-tabs";
import { PredictionStatsPanel } from "@/components/world-cup/prediction-stats-panel";
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

  const matchIds = events.map((e) => e.matchId);
  const userPickByEventId: Record<string, string | null> = {};
  if (matchIds.length > 0) {
    const { data: myPicks } = await supabase
      .from("predictions")
      .select("match_id, predicted_winner")
      .eq("user_id", user.id)
      .in("match_id", matchIds);
    const pickByMatch = new Map(
      (myPicks ?? []).map((p) => [p.match_id as string, p.predicted_winner as string]),
    );
    for (const ev of events) {
      userPickByEventId[ev.eventId] = pickByMatch.get(ev.matchId) ?? null;
    }
  }

  const { events: statsEvents, predictionsByEventId } =
    await loadPredictionStatsForContest(supabase, contestId, activeGroupId, memberView);
  const defaultStatsEventId = pickDefaultStatsEventId(events);

  const schedulePanel = (
    <div className="space-y-6">
      {memberView && events.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          {worldCupCopy.errors.notOpenYet}
        </div>
      ) : null}

      <div>
        <h2 className="text-sm font-semibold">How points work</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Only rounds your organizer has opened are listed below.
        </p>
        <div className="mt-2">
          <StagePointsPanel rules={rules} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold">Match schedule</h2>
        <div className="mt-2">
          <MatchScheduleList
            contestId={contestId}
            events={events}
            userPickByEventId={userPickByEventId}
          />
        </div>
      </div>
    </div>
  );

  const statsPanel = (
    <PredictionStatsPanel
      events={statsEvents}
      defaultEventId={defaultStatsEventId}
      predictionsByEventId={predictionsByEventId}
    />
  );

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{worldCupCopy.nav.worldCupPredictions}</h1>
        <p className="text-sm text-muted-foreground">{contest.name}</p>
      </header>

      {isOwner && isWorldCupPrivateMode() ? (
        <p className="text-sm">
          <Link
            href={`/groups/${activeGroupId}/world-cup?contestId=${contestId}`}
            className="font-medium underline"
          >
            Organizer tools
          </Link>
        </p>
      ) : null}

      <ContestMatchesTabs schedule={schedulePanel} stats={statsPanel} />

      <div className="flex flex-wrap gap-3 border-t pt-4 text-sm">
        <Link href={`/contests/${contestId}/leaderboard`} className="underline">
          {worldCupCopy.nav.standings}
        </Link>
        <Link href={`/groups/${activeGroupId}`} className="underline">
          {worldCupCopy.nav.groups}
        </Link>
      </div>
    </section>
  );
}
