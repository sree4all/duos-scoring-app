import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import {
  listRevealedScheduleEvents,
  listUpcomingScheduleEvents,
} from "@/lib/server/world-cup/schedule-query";
import { StageRulesRepository } from "@/lib/server/world-cup/stage-rules-repository";
import { loadPredictionStatsForContest } from "@/lib/server/world-cup/prediction-stats";
import { pickDefaultStatsEventId } from "@/lib/server/world-cup/pick-default-event";
import { MatchScheduleList } from "@/components/world-cup/match-schedule-list";
import { StagePointsPanel } from "@/components/world-cup/stage-points-panel";
import { ContestMatchesTabs } from "@/components/world-cup/contest-matches-tabs";
import { PredictionStatsPanel } from "@/components/world-cup/prediction-stats-panel";
import { worldCupCopy } from "@/lib/copy/world-cup";
import { isWorldCupPrivateMode } from "@/lib/server/world-cup/flags";
import { resolveContestPageBackground } from "@/lib/design/resolve-page-background";
import { PageHeroLayer } from "@/components/layout/page-hero-layer";

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
  /** Predictions page always uses member view (revealed rounds only), including for owners. */
  const memberView = true;
  const allEvents = await listRevealedScheduleEvents(supabase, contestId, memberView);
  const upcomingEvents = listUpcomingScheduleEvents(allEvents);
  const rules = await new StageRulesRepository(supabase).listForContest(contestId, memberView);

  const matchIds = upcomingEvents.map((e) => e.matchId);
  const userPickByEventId: Record<string, string | null> = {};
  const bonusNotPredictedByEventId: Record<string, boolean> = {};
  if (matchIds.length > 0) {
    const [{ data: myPicks }, { data: bonusPromptRows }, { data: bonusAnswerRows }] =
      await Promise.all([
        supabase
          .from("predictions")
          .select("match_id, predicted_winner")
          .eq("user_id", user.id)
          .in("match_id", matchIds),
        supabase
          .from("bonus_prompts")
          .select("id, match_id")
          .eq("scope", "match")
          .eq("is_active", true)
          .eq("season_year", 2026)
          .in("match_id", matchIds),
        supabase
          .from("prediction_bonus_answers")
          .select("prompt_id, match_id")
          .eq("user_id", user.id)
          .in("match_id", matchIds),
      ]);

    const pickByMatch = new Map(
      (myPicks ?? []).map((p) => [p.match_id as string, p.predicted_winner as string]),
    );
    const promptIdsByMatch = new Map<string, string[]>();
    for (const row of bonusPromptRows ?? []) {
      const matchId = row.match_id as string;
      const list = promptIdsByMatch.get(matchId) ?? [];
      list.push(row.id as string);
      promptIdsByMatch.set(matchId, list);
    }
    const answeredPromptIds = new Set(
      (bonusAnswerRows ?? []).map((a) => a.prompt_id as string),
    );

    for (const ev of upcomingEvents) {
      userPickByEventId[ev.eventId] = pickByMatch.get(ev.matchId) ?? null;
      const promptIds = promptIdsByMatch.get(ev.matchId) ?? [];
      const hasWinnerPick = Boolean(userPickByEventId[ev.eventId]);
      const allBonusAnswered =
        promptIds.length > 0 && promptIds.every((id) => answeredPromptIds.has(id));
      bonusNotPredictedByEventId[ev.eventId] =
        hasWinnerPick && promptIds.length > 0 && !allBonusAnswered;
    }
  }

  const { events: statsEvents, predictionsByEventId } =
    await loadPredictionStatsForContest(supabase, contestId, activeGroupId, memberView);
  const defaultStatsEventId = pickDefaultStatsEventId(upcomingEvents);

  const schedulePanel = (
    <div className="space-y-6">
      {memberView && upcomingEvents.length === 0 ? (
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
            events={upcomingEvents}
            userPickByEventId={userPickByEventId}
            bonusNotPredictedByEventId={bonusNotPredictedByEventId}
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

  const pageBackground = resolveContestPageBackground(
    contest,
    `/contests/${contestId}/matches`,
  );

  return (
    <section className="relative space-y-5 pb-4">
      {pageBackground ? <PageHeroLayer pageBackground={pageBackground} /> : null}
      <header className="relative z-[1]">
        <h1 className="text-title-dense">
          {worldCupCopy.nav.worldCupPredictions}
        </h1>
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
