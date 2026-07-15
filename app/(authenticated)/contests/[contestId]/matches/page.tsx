import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import {
  getActiveStageKeys,
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
import { AdvancedBracketStatsPanel } from "@/components/world-cup/advanced-bracket-stats-panel";
import { AdvancedBracketPredictionsForm } from "@/components/world-cup/advanced-bracket-predictions-form";
import { MatchBonusRepository } from "@/lib/server/world-cup/match-bonus-repository";
import type { MatchBonusPrompt } from "@/lib/domain/world-cup/match-bonus";
import type { StageScoringRule } from "@/lib/domain/world-cup/types";
import { worldCupCopy } from "@/lib/copy/world-cup";
import { isWorldCupPrivateMode } from "@/lib/server/world-cup/flags";
import { resolveContestPageBackground } from "@/lib/design/resolve-page-background";
import {
  getAdvancedBracketAccess,
  loadUserAdvancedBracketPicks,
} from "@/lib/server/world-cup/advanced-bracket-service";
import { loadAdvancedBracketStatsForContest } from "@/lib/server/world-cup/advanced-bracket-stats";
import { isAdvancedBracketStatsTabVisible } from "@/lib/utils/advanced-bracket-stats-tab";
import {
  loadForecastEligibility,
} from "@/lib/server/world-cup/round-of-32-teams";
import { PageHeroLayer } from "@/components/layout/page-hero-layer";
import {
  isPlatformAdmin,
  loadAdminGroupMembers,
} from "@/lib/server/auth/admin-context";

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
  const isAdmin = await isPlatformAdmin(supabase, user.id);
  const adminMembers = isAdmin ? await loadAdminGroupMembers(supabase, activeGroupId) : [];
  /** Predictions page always uses member view (revealed rounds only), including for owners. */
  const memberView = true;
  const allEvents = await listRevealedScheduleEvents(supabase, contestId, memberView);
  const upcomingEvents = listUpcomingScheduleEvents(allEvents);
  const rules = await new StageRulesRepository(supabase).listForContest(contestId, memberView);
  const activeStageKeys = getActiveStageKeys(allEvents);
  const activePointRules = rules.filter((r) => activeStageKeys.has(r.stageKey));
  const showPointsPanel = rules.length === 0 || activePointRules.length > 0;

  const matchIds = upcomingEvents.map((e) => e.matchId);
  const userPickByEventId: Record<string, string | null> = {};
  const bonusNotPredictedByEventId: Record<string, boolean> = {};
  const bonusPromptsByMatchId: Record<string, MatchBonusPrompt[]> = {};
  const bonusAnswersByMatchId: Record<string, Record<string, string>> = {};
  const matchWinnerByMatchId: Record<string, string | null> = {};
  const stageRulesByKey = Object.fromEntries(
    rules.map((r) => [r.stageKey, r]),
  ) as Record<string, StageScoringRule>;

  if (matchIds.length > 0) {
    const bonusRepo = new MatchBonusRepository(supabase);
    const [{ data: myPicks }, bonusPromptsMap, { data: bonusAnswerRows }, { data: matchRows }] =
      await Promise.all([
        supabase
          .from("predictions")
          .select("match_id, predicted_winner")
          .eq("user_id", user.id)
          .in("match_id", matchIds),
        bonusRepo.listForMatches(matchIds),
        supabase
          .from("prediction_bonus_answers")
          .select("prompt_id, match_id, answer_text")
          .eq("user_id", user.id)
          .in("match_id", matchIds),
        supabase.from("matches").select("id, winner").in("id", matchIds),
      ]);

    for (const row of matchRows ?? []) {
      matchWinnerByMatchId[row.id as string] = (row.winner as string | null) ?? null;
    }

    for (const [matchId, prompts] of bonusPromptsMap) {
      bonusPromptsByMatchId[matchId] = prompts;
    }

    const answersByMatch = new Map<string, Record<string, string>>();
    for (const row of bonusAnswerRows ?? []) {
      const matchId = row.match_id as string;
      const answers = answersByMatch.get(matchId) ?? {};
      answers[row.prompt_id as string] = row.answer_text as string;
      answersByMatch.set(matchId, answers);
    }
    for (const [matchId, answers] of answersByMatch) {
      bonusAnswersByMatchId[matchId] = answers;
    }

    const pickByMatch = new Map(
      (myPicks ?? []).map((p) => [p.match_id as string, p.predicted_winner as string]),
    );

    for (const ev of upcomingEvents) {
      userPickByEventId[ev.eventId] = pickByMatch.get(ev.matchId) ?? null;
      const promptIds = (bonusPromptsByMatchId[ev.matchId] ?? []).map((p) => p.id);
      const hasWinnerPick = Boolean(userPickByEventId[ev.eventId]);
      const answeredPromptIds = new Set(
        Object.keys(bonusAnswersByMatchId[ev.matchId] ?? {}),
      );
      const allBonusAnswered =
        promptIds.length > 0 && promptIds.every((id) => answeredPromptIds.has(id));
      bonusNotPredictedByEventId[ev.eventId] =
        hasWinnerPick && promptIds.length > 0 && !allBonusAnswered;
    }
  }

  const { events: statsEvents, predictionsByEventId } =
    await loadPredictionStatsForContest(supabase, contestId, activeGroupId, {
      memberView: true,
      viewerUserId: user.id,
      isOwner,
    });
  const defaultStatsEventId = pickDefaultStatsEventId(upcomingEvents);

  const [bracketAccess, forecastEligibility, bracketPicks, tournamentConfig] = await Promise.all([
    getAdvancedBracketAccess(supabase, contestId),
    loadForecastEligibility(supabase),
    loadUserAdvancedBracketPicks(supabase, contestId, user.id),
    supabase
      .from("group_tournament_config")
      .select("advanced_bracket_stats_visible_to_members")
      .eq("group_id", activeGroupId)
      .eq("season_year", 2026)
      .maybeSingle()
      .then(({ data }) => data),
  ]);

  const showAdvancedBracketStats = isAdvancedBracketStatsTabVisible(tournamentConfig, isAdmin);
  const advancedBracketStats = showAdvancedBracketStats
    ? await loadAdvancedBracketStatsForContest(supabase, contestId, activeGroupId)
    : { rows: [], official: { semiFinalistTeams: [], finalistTeams: [], winnerTeam: null } };

  const schedulePanel = (
    <div className="space-y-6">
      {memberView && upcomingEvents.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          {worldCupCopy.errors.notOpenYet}
        </div>
      ) : null}

      {showPointsPanel ? (
        <StagePointsPanel rules={activePointRules.length > 0 ? activePointRules : rules} />
      ) : null}

      <div>
        <h2 className="text-sm font-semibold">Match schedule</h2>
        <div className="mt-2">
          <MatchScheduleList
            contestId={contestId}
            groupId={activeGroupId}
            isOwner={isOwner}
            isAdmin={isAdmin}
            adminMembers={adminMembers}
            events={upcomingEvents}
            userPickByEventId={userPickByEventId}
            bonusNotPredictedByEventId={bonusNotPredictedByEventId}
            bonusPromptsByMatchId={bonusPromptsByMatchId}
            bonusAnswersByMatchId={bonusAnswersByMatchId}
            stageRulesByKey={stageRulesByKey}
            matchWinnerByMatchId={matchWinnerByMatchId}
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

  const advancedPanel = !bracketAccess.open ? (
    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
      {bracketAccess.message ?? worldCupCopy.advancedBracket.notOpenYet}
    </div>
  ) : forecastEligibility.eligible_teams.length === 0 ? (
    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
      Round of 32 teams are not available yet.
    </div>
  ) : (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{worldCupCopy.advancedBracket.subtitle}</p>
      <AdvancedBracketPredictionsForm
        contestId={contestId}
        eligibility={forecastEligibility}
        initialPicks={bracketPicks}
        locked={bracketAccess.locked}
      />
    </div>
  );

  const advancedStatsPanel = showAdvancedBracketStats ? (
    <AdvancedBracketStatsPanel
      rows={advancedBracketStats.rows}
      groupId={activeGroupId}
      contestId={contestId}
      canToggleVisibility={isAdmin}
      visibleToMembers={Boolean(tournamentConfig?.advanced_bracket_stats_visible_to_members)}
      officialSemiFinalists={advancedBracketStats.official.semiFinalistTeams}
      officialFinalists={advancedBracketStats.official.finalistTeams}
      officialWinner={advancedBracketStats.official.winnerTeam}
    />
  ) : null;

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

      <ContestMatchesTabs
        schedule={schedulePanel}
        stats={statsPanel}
        advanced={advancedPanel}
        advancedStats={bracketAccess.open && advancedStatsPanel ? advancedStatsPanel : undefined}
      />

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
