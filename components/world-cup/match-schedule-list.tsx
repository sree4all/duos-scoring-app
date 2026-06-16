"use client";

import { useState, useEffect } from "react";
import { formatKickoffDisplay } from "@/lib/utils/kickoff-display";
import { worldCupCopy } from "@/lib/copy/world-cup";
import { isPredictionsLocked } from "@/lib/utils/match-lock";
import { allowsDrawPick, formatMatchPickLabel } from "@/lib/domain/world-cup/match-outcome";
import type { MatchBonusPrompt } from "@/lib/domain/world-cup/match-bonus";
import type { ScheduleEventRow } from "@/lib/server/world-cup/schedule-query";
import {
  PREDICTION_SCHEDULE_INITIAL,
  PREDICTION_SCHEDULE_STEP,
} from "@/lib/world-cup/mobile-list";
import { SeeMoreFooter } from "@/components/ui/see-more-footer";
import { MatchPickForm } from "@/components/world-cup/match-pick-form";
import { MatchBonusAnswerForm } from "@/components/world-cup/match-bonus-answer-form";
import { cn } from "@/lib/utils";

function statusLabel(status: string, kickoffUtc: string, lockAt: string | null): string {
  if (status === "completed") return worldCupCopy.matchStatus.done;
  if (isPredictionsLocked(kickoffUtc, lockAt)) return worldCupCopy.matchStatus.locked;
  if (status === "scheduled") return worldCupCopy.matchStatus.open;
  return worldCupCopy.matchStatus.scheduled;
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
  ev,
  savedPick: initialSavedPick,
  showBonusNotPredicted,
  bonusPrompts,
  bonusAnswers,
}: {
  contestId: string;
  ev: ScheduleEventRow;
  savedPick: string | null;
  showBonusNotPredicted: boolean;
  bonusPrompts: MatchBonusPrompt[];
  bonusAnswers: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [savedPick, setSavedPick] = useState(initialSavedPick);
  const locked = isPredictionsLocked(ev.kickoffUtc, ev.lockAt);

  useEffect(() => {
    setSavedPick(initialSavedPick);
  }, [initialSavedPick]);
  const hasPrediction = Boolean(savedPick);
  const allowDraw = allowsDrawPick(ev.stageKey);

  return (
    <li className="neon-glass-card p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Match {ev.matchNumber ?? "—"}
        </span>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs">
          {statusLabel(ev.matchStatus, ev.kickoffUtc, ev.lockAt)}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <span
          className={cn(
            "inline-block rounded-md px-2 py-0.5 text-xs font-semibold",
            hasPrediction
              ? "bg-neon-score-green/20 text-score-positive"
              : !locked
                ? "bg-neon-score-red/20 text-score-negative"
                : "bg-white/10 text-muted-foreground",
          )}
        >
          {hasPrediction
            ? worldCupCopy.prediction.alreadyPredicted
            : !locked
              ? worldCupCopy.prediction.duePrediction
              : "No prediction saved"}
        </span>
        {hasPrediction && showBonusNotPredicted ? (
          <span className="inline-block rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            {worldCupCopy.prediction.bonusNotPredicted}
          </span>
        ) : null}
      </div>

      <p className="mt-2 break-words text-base font-semibold leading-snug sm:text-lg">
        {ev.homeTeam} vs {ev.awayTeam}
      </p>
      {ev.venueLabel ? (
        <p className="text-sm text-muted-foreground">{ev.venueLabel}</p>
      ) : null}
      <p className="mt-1 text-sm text-muted-foreground">
        Kickoff: {formatKickoffDisplay(ev.kickoffUtc)}
      </p>
      {hasPrediction && !expanded ? (
        <p className="mt-1 text-sm">
          Your prediction:{" "}
          <strong className="break-words">{formatMatchPickLabel(savedPick!)}</strong>
        </p>
      ) : null}

      <button
        type="button"
        className="mt-3 flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground touch-manipulation sm:min-h-10 sm:w-auto sm:inline-flex"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
      >
        {expanded
          ? "Close"
          : hasPrediction
            ? worldCupCopy.prediction.viewOrUpdate
            : worldCupCopy.prediction.makePrediction}
      </button>

      {expanded ? (
        <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
          <MatchPickForm
            contestId={contestId}
            eventId={ev.eventId}
            matchId={ev.matchId}
            homeTeam={ev.homeTeam}
            awayTeam={ev.awayTeam}
            allowDraw={allowDraw}
            initialPick={savedPick}
            locked={locked}
            embedded
            onSaved={setSavedPick}
          />
          <MatchBonusAnswerForm
            contestId={contestId}
            eventId={ev.eventId}
            matchId={ev.matchId}
            prompts={bonusPrompts}
            initialAnswers={bonusAnswers}
            locked={locked}
          />
        </div>
      ) : null}
    </li>
  );
}

export function MatchScheduleList({
  contestId,
  events,
  userPickByEventId = {},
  bonusNotPredictedByEventId = {},
  bonusPromptsByMatchId = {},
  bonusAnswersByMatchId = {},
}: {
  contestId: string;
  events: ScheduleEventRow[];
  userPickByEventId?: Record<string, string | null>;
  bonusNotPredictedByEventId?: Record<string, boolean>;
  bonusPromptsByMatchId?: Record<string, MatchBonusPrompt[]>;
  bonusAnswersByMatchId?: Record<string, Record<string, string>>;
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
            ev={ev}
            savedPick={userPickByEventId[ev.eventId] ?? null}
            showBonusNotPredicted={bonusNotPredictedByEventId[ev.eventId] ?? false}
            bonusPrompts={bonusPromptsByMatchId[ev.matchId] ?? []}
            bonusAnswers={bonusAnswersByMatchId[ev.matchId] ?? {}}
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
