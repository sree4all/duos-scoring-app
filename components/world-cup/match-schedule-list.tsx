"use client";

import { useState, useEffect } from "react";
import { formatKickoffDisplay } from "@/lib/utils/kickoff-display";
import { worldCupCopy } from "@/lib/copy/world-cup";
import { isPredictionsLocked } from "@/lib/utils/match-lock";
import { allowsDrawPick } from "@/lib/domain/world-cup/match-outcome";
import type { MatchBonusPrompt } from "@/lib/domain/world-cup/match-bonus";
import type { StageScoringRule } from "@/lib/domain/world-cup/types";
import type { ScheduleEventRow } from "@/lib/server/world-cup/schedule-query";
import {
  PREDICTION_SCHEDULE_INITIAL,
  PREDICTION_SCHEDULE_STEP,
} from "@/lib/world-cup/mobile-list";
import { SeeMoreFooter } from "@/components/ui/see-more-footer";
import { MatchPickForm } from "@/components/world-cup/match-pick-form";
import { MatchBonusAnswerForm } from "@/components/world-cup/match-bonus-answer-form";
import { MatchOrganizerTools } from "@/components/world-cup/match-organizer-tools";
import { cn } from "@/lib/utils";

function statusLabel(status: string, kickoffUtc: string, lockAt: string | null): string {
  if (status === "completed") return worldCupCopy.matchStatus.done;
  if (isPredictionsLocked(kickoffUtc, lockAt)) return worldCupCopy.matchStatus.locked;
  if (status === "scheduled") return worldCupCopy.matchStatus.open;
  return worldCupCopy.matchStatus.scheduled;
}

function formatMatchHeading(ev: ScheduleEventRow): string {
  if (ev.title.toLowerCase().includes(" vs ")) return ev.title;
  const code = ev.title || `Match ${ev.matchNumber ?? "—"}`;
  return `${code} — ${ev.homeTeam} vs ${ev.awayTeam}`;
}

function formatStagePointsLine(rule: StageScoringRule | undefined): string | null {
  if (!rule) return null;
  const wrong =
    rule.incorrectPenalty === 0 ? "0" : String(rule.incorrectPenalty);
  return `${rule.stageName}: +${rule.correctPoints} correct, ${wrong} wrong`;
}

function formatShowingRange(visibleEnd: number, total: number): string {
  if (total === 0) return "No matches";
  return `Showing 1–${visibleEnd} of ${total} matches`;
}

function formatShowMoreLabel(
  visibleEnd: number,
  nextEnd: number,
  total: number,
): string {
  return `Show more (${visibleEnd + 1}–${nextEnd} of ${total})`;
}

function MatchCard({
  contestId,
  groupId,
  isOwner,
  ev,
  savedPick: initialSavedPick,
  showBonusNotPredicted,
  bonusPrompts,
  bonusAnswers,
  stageRule,
  matchWinner,
}: {
  contestId: string;
  groupId: string;
  isOwner: boolean;
  ev: ScheduleEventRow;
  savedPick: string | null;
  showBonusNotPredicted: boolean;
  bonusPrompts: MatchBonusPrompt[];
  bonusAnswers: Record<string, string>;
  stageRule?: StageScoringRule;
  matchWinner: string | null;
}) {
  const [savedPick, setSavedPick] = useState(initialSavedPick);
  const locked = isPredictionsLocked(ev.kickoffUtc, ev.lockAt);
  const hasPrediction = Boolean(savedPick);
  const allowDraw = allowsDrawPick(ev.stageKey);
  const openStatus = statusLabel(ev.matchStatus, ev.kickoffUtc, ev.lockAt);
  const stagePointsLine = formatStagePointsLine(stageRule);

  useEffect(() => {
    setSavedPick(initialSavedPick);
  }, [initialSavedPick]);

  return (
    <li className="neon-glass-card p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug sm:text-base">
          {formatMatchHeading(ev)}
        </h3>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs",
              openStatus === worldCupCopy.matchStatus.open
                ? "bg-neon-score-green/20 text-score-positive"
                : "bg-white/10 text-muted-foreground",
            )}
          >
            {openStatus}
          </span>
          {!locked ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs",
                hasPrediction
                  ? "bg-neon-score-green/20 text-score-positive"
                  : "bg-neon-score-red/20 text-score-negative",
              )}
            >
              {hasPrediction
                ? worldCupCopy.prediction.alreadyPredicted
                : worldCupCopy.prediction.duePrediction}
            </span>
          ) : null}
          {hasPrediction && showBonusNotPredicted ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200 sm:text-xs">
              {worldCupCopy.prediction.bonusNotPredicted}
            </span>
          ) : null}
        </div>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        {worldCupCopy.prediction.startLabel}: {formatKickoffDisplay(ev.kickoffUtc)}
      </p>
      {stagePointsLine ? (
        <p className="mt-0.5 text-xs font-medium text-score-positive">{stagePointsLine}</p>
      ) : null}

      <div className="mt-3 border-t border-white/10 pt-3">
        <MatchPickForm
          contestId={contestId}
          eventId={ev.eventId}
          matchId={ev.matchId}
          homeTeam={ev.homeTeam}
          awayTeam={ev.awayTeam}
          allowDraw={allowDraw}
          initialPick={savedPick}
          locked={locked}
          compact
          onSaved={setSavedPick}
        />
      </div>

      {bonusPrompts.length > 0 ? (
        <div className="mt-3 border-t border-white/10 pt-3">
          <MatchBonusAnswerForm
            contestId={contestId}
            eventId={ev.eventId}
            matchId={ev.matchId}
            prompts={bonusPrompts}
            initialAnswers={bonusAnswers}
            locked={locked}
            compact
          />
        </div>
      ) : (
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground sm:text-xs">
          {worldCupCopy.prediction.bonusWatchHint}
        </p>
      )}

      {isOwner ? (
        <div className="mt-3">
          <MatchOrganizerTools
            groupId={groupId}
            contestId={contestId}
            eventId={ev.eventId}
            matchId={ev.matchId}
            homeTeam={ev.homeTeam}
            awayTeam={ev.awayTeam}
            allowDraw={allowDraw}
            lockAt={ev.lockAt}
            initialWinner={matchWinner}
          />
        </div>
      ) : null}
    </li>
  );
}

export function MatchScheduleList({
  contestId,
  groupId,
  isOwner = false,
  events,
  userPickByEventId = {},
  bonusNotPredictedByEventId = {},
  bonusPromptsByMatchId = {},
  bonusAnswersByMatchId = {},
  stageRulesByKey = {},
  matchWinnerByMatchId = {},
}: {
  contestId: string;
  groupId: string;
  isOwner?: boolean;
  events: ScheduleEventRow[];
  userPickByEventId?: Record<string, string | null>;
  bonusNotPredictedByEventId?: Record<string, boolean>;
  bonusPromptsByMatchId?: Record<string, MatchBonusPrompt[]>;
  bonusAnswersByMatchId?: Record<string, Record<string, string>>;
  stageRulesByKey?: Record<string, StageScoringRule>;
  matchWinnerByMatchId?: Record<string, string | null>;
}) {
  const [visibleCount, setVisibleCount] = useState(PREDICTION_SCHEDULE_INITIAL);

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No matches are open yet. Your organizer will open each round when it is time to play.
      </p>
    );
  }

  const visible = events.slice(0, visibleCount);
  const remaining = events.length - visible.length;
  const nextEnd = Math.min(visibleCount + PREDICTION_SCHEDULE_STEP, events.length);

  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">
        {formatShowingRange(visible.length, events.length)}
      </p>
      <ul className="space-y-3">
        {visible.map((ev) => (
          <MatchCard
            key={ev.eventId}
            contestId={contestId}
            groupId={groupId}
            isOwner={isOwner}
            ev={ev}
            savedPick={userPickByEventId[ev.eventId] ?? null}
            showBonusNotPredicted={bonusNotPredictedByEventId[ev.eventId] ?? false}
            bonusPrompts={bonusPromptsByMatchId[ev.matchId] ?? []}
            bonusAnswers={bonusAnswersByMatchId[ev.matchId] ?? {}}
            stageRule={ev.stageKey ? stageRulesByKey[ev.stageKey] : undefined}
            matchWinner={matchWinnerByMatchId[ev.matchId] ?? null}
          />
        ))}
      </ul>
      <SeeMoreFooter
        remaining={remaining}
        onShowMore={() => setVisibleCount(nextEnd)}
        label={
          remaining > 0
            ? formatShowMoreLabel(visible.length, nextEnd, events.length)
            : undefined
        }
      />
    </div>
  );
}
