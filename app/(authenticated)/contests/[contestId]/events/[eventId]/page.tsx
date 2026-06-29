import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import {
  assertEventRevealedForMember,
  resolveEventStageKey,
} from "@/lib/server/world-cup/schedule-query";
import { allowsDrawPick } from "@/lib/domain/world-cup/match-outcome";
import { OwnerMatchResultForm } from "@/components/world-cup/owner-match-result-form";
import { formatKickoffDisplay } from "@/lib/utils/kickoff-display";
import { formatEasternDateTime } from "@/lib/utils/eastern-time";
import {
  isPredictionsLocked,
  resolvePredictionLockAtIso,
} from "@/lib/utils/match-lock";
import { MatchPickForm } from "@/components/world-cup/match-pick-form";
import { MatchBonusAnswerForm } from "@/components/world-cup/match-bonus-answer-form";
import { OwnerEventResultsForm } from "@/components/groups/owner-event-results-form";
import { OwnerMatchLockForm } from "@/components/world-cup/owner-match-lock-form";
import { OwnerMatchBonusPanel } from "@/components/world-cup/owner-match-bonus-panel";
import { AdminProxyPredictionPanel } from "@/components/world-cup/admin-proxy-prediction-panel";
import { MatchBonusRepository } from "@/lib/server/world-cup/match-bonus-repository";
import { buildLinkedMatchEventTitle } from "@/lib/domain/world-cup/match-event-title";
import { worldCupCopy } from "@/lib/copy/world-cup";
import {
  isPlatformAdmin,
  loadAdminGroupMembers,
} from "@/lib/server/auth/admin-context";

type PageProps = { params: Promise<{ contestId: string; eventId: string }> };

export default async function EventSubmissionPage({ params }: PageProps) {
  const { contestId, eventId } = await params;
  const { supabase, user } = await requireUser();
  const activeGroupId = await resolveActiveGroupId(supabase, user.id);
  if (!activeGroupId) notFound();

  const membership = await requireGroupMembership(supabase, activeGroupId, user.id);
  const isAdmin = await isPlatformAdmin(supabase, user.id);
  const adminMembers = isAdmin ? await loadAdminGroupMembers(supabase, activeGroupId) : [];
  await new GroupContestService(supabase).assertContestInGroup(contestId, activeGroupId);

  const { data: event } = await supabase
    .from("events")
    .select("id, title, lock_at, stage_key, source_match_id")
    .eq("id", eventId)
    .eq("contest_id", contestId)
    .maybeSingle();

  if (!event?.source_match_id) notFound();

  const reveal = await assertEventRevealedForMember(
    supabase,
    contestId,
    event.stage_key as string | null,
    {
      stage_key: event.stage_key as string | null,
      source_match_id: event.source_match_id as string | null,
    },
  );
  if (!reveal.ok) {
    return (
      <section className="space-y-4">
        <p className="text-sm">{reveal.message}</p>
        <Link href={`/contests/${contestId}/matches`} className="text-sm font-medium underline">
          Back to predictions
        </Link>
      </section>
    );
  }

  const matchId = event.source_match_id as string;
  const { data: match } = await supabase
    .from("matches")
    .select(
      "match_number, home_team, away_team, match_time_utc, kickoff_tz_offset, status, winner, stage_key",
    )
    .eq("id", matchId)
    .maybeSingle();

  if (!match) notFound();

  const pageTitle = buildLinkedMatchEventTitle(
    match.match_number as number | null,
    match.home_team as string,
    match.away_team as string,
  );

  const stageKey = await resolveEventStageKey(supabase, {
    stage_key: event.stage_key as string | null,
    source_match_id: event.source_match_id as string | null,
  });
  const allowDraw = allowsDrawPick(stageKey);

  const kickoffUtc = match.match_time_utc as string;
  const lockAt = resolvePredictionLockAtIso(kickoffUtc, event.lock_at as string | null);
  const locked = isPredictionsLocked(kickoffUtc, event.lock_at as string | null);

  const { data: existingPick } = await supabase
    .from("predictions")
    .select("predicted_winner")
    .eq("user_id", user.id)
    .eq("match_id", matchId)
    .maybeSingle();

  const bonusPrompts = await new MatchBonusRepository(supabase).listForMatch(matchId);
  const bonusAnswers: Record<string, string> = {};
  if (bonusPrompts.length > 0) {
    const { data: answerRows } = await supabase
      .from("prediction_bonus_answers")
      .select("prompt_id, answer_text")
      .eq("user_id", user.id)
      .eq("match_id", matchId);
    for (const row of answerRows ?? []) {
      bonusAnswers[row.prompt_id as string] = row.answer_text as string;
    }
  }

  return (
    <section className="space-y-5 pb-4">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Match prediction
        </p>
        <h1 className="text-xl font-semibold sm:text-2xl">{pageTitle}</h1>
        <p className="break-words text-base font-medium sm:text-lg">
          {match.home_team as string} vs {match.away_team as string}
        </p>
        <p className="text-sm text-muted-foreground">
          Kickoff:{" "}
          {formatKickoffDisplay(kickoffUtc)}
        </p>
        <p className="text-sm text-muted-foreground">
          Predictions lock: {formatEasternDateTime(lockAt)} Eastern
        </p>
      </header>

      <MatchPickForm
        contestId={contestId}
        eventId={eventId}
        matchId={matchId}
        homeTeam={match.home_team as string}
        awayTeam={match.away_team as string}
        allowDraw={allowDraw}
        initialPick={(existingPick?.predicted_winner as string) ?? null}
        locked={locked}
      />

      <MatchBonusAnswerForm
        contestId={contestId}
        eventId={eventId}
        matchId={matchId}
        prompts={bonusPrompts}
        initialAnswers={bonusAnswers}
        locked={locked}
      />

      {isAdmin ? (
        <AdminProxyPredictionPanel
          contestId={contestId}
          eventId={eventId}
          matchId={matchId}
          homeTeam={match.home_team as string}
          awayTeam={match.away_team as string}
          allowDraw={allowDraw}
          locked={locked}
          kickoffUtc={kickoffUtc}
          members={adminMembers}
          bonusPrompts={bonusPrompts}
        />
      ) : null}

      {membership.isOwner ? (
        <details className="rounded-lg border p-4 text-sm">
          <summary className="cursor-pointer font-medium">Organizer tools</summary>
          <div className="mt-4 space-y-4">
            <OwnerMatchBonusPanel
              groupId={activeGroupId}
              contestId={contestId}
              matchId={matchId}
            />
            <OwnerMatchLockForm
              groupId={activeGroupId}
              contestId={contestId}
              eventId={eventId}
              lockAt={lockAt}
            />
            <OwnerMatchResultForm
              groupId={activeGroupId}
              contestId={contestId}
              matchId={matchId}
              homeTeam={match.home_team as string}
              awayTeam={match.away_team as string}
              allowDraw={allowDraw}
              initialWinner={(match.winner as string | null) ?? null}
            />
            <OwnerEventResultsForm
              groupId={activeGroupId}
              contestId={contestId}
              matchId={matchId}
              eventId={eventId}
            />
          </div>
        </details>
      ) : null}

      <Link
        href={`/contests/${contestId}/matches`}
        className="inline-block text-sm font-medium underline"
      >
        ← Back to {worldCupCopy.nav.worldCupPredictions}
      </Link>
    </section>
  );
}
