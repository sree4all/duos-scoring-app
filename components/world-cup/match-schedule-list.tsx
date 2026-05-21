"use client";

import Link from "next/link";
import { useState } from "react";
import { formatEasternDateTime } from "@/lib/utils/eastern-time";
import { worldCupCopy } from "@/lib/copy/world-cup";
import type { ScheduleEventRow } from "@/lib/server/world-cup/schedule-query";
import { MOBILE_LIST_INITIAL, MOBILE_LIST_STEP } from "@/lib/world-cup/mobile-list";
import { SeeMoreFooter } from "@/components/ui/see-more-footer";
import { cn } from "@/lib/utils";

function statusLabel(status: string, lockAt: string | null): string {
  const now = Date.now();
  if (status === "completed") return worldCupCopy.matchStatus.done;
  if (lockAt && new Date(lockAt).getTime() <= now) return worldCupCopy.matchStatus.locked;
  if (status === "scheduled") return worldCupCopy.matchStatus.open;
  return worldCupCopy.matchStatus.scheduled;
}

function MatchCard({
  contestId,
  ev,
  savedPick,
  showBonusNotPredicted,
}: {
  contestId: string;
  ev: ScheduleEventRow;
  savedPick: string | null;
  showBonusNotPredicted: boolean;
}) {
  const now = Date.now();
  const locked = Boolean(ev.lockAt && new Date(ev.lockAt).getTime() <= now);
  const hasPrediction = Boolean(savedPick);

  return (
    <li className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Match {ev.matchNumber ?? "—"}
        </span>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs">
          {statusLabel(ev.matchStatus, ev.lockAt)}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <span
          className={cn(
            "inline-block rounded-md px-2 py-0.5 text-xs font-semibold",
            hasPrediction
              ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
              : !locked
                ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                : "bg-muted text-muted-foreground",
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
        Kickoff: {formatEasternDateTime(ev.kickoffUtc)}
      </p>
      {hasPrediction ? (
        <p className="mt-1 text-sm">
          Your prediction: <strong className="break-words">{savedPick}</strong>
        </p>
      ) : null}

      <Link
        href={`/contests/${contestId}/events/${ev.eventId}`}
        className="mt-3 flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground touch-manipulation sm:min-h-10 sm:w-auto sm:inline-flex"
      >
        {hasPrediction
          ? worldCupCopy.prediction.viewOrUpdate
          : worldCupCopy.prediction.makePrediction}
      </Link>
    </li>
  );
}

export function MatchScheduleList({
  contestId,
  events,
  userPickByEventId = {},
  bonusNotPredictedByEventId = {},
}: {
  contestId: string;
  events: ScheduleEventRow[];
  userPickByEventId?: Record<string, string | null>;
  bonusNotPredictedByEventId?: Record<string, boolean>;
}) {
  const [visibleCount, setVisibleCount] = useState(MOBILE_LIST_INITIAL);

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No matches are open yet. Your organizer will open each round when it is time to play.
      </p>
    );
  }

  const visible = events.slice(0, visibleCount);
  const remaining = events.length - visible.length;

  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">
        Showing {visible.length} of {events.length} matches
      </p>
      <ul className="space-y-3">
        {visible.map((ev) => (
          <MatchCard
            key={ev.eventId}
            contestId={contestId}
            ev={ev}
            savedPick={userPickByEventId[ev.eventId] ?? null}
            showBonusNotPredicted={bonusNotPredictedByEventId[ev.eventId] ?? false}
          />
        ))}
      </ul>
      <SeeMoreFooter
        remaining={remaining}
        onShowMore={() =>
          setVisibleCount((n) => Math.min(n + MOBILE_LIST_STEP, events.length))
        }
        label={
          remaining > 0
            ? `See more matches (${Math.min(remaining, MOBILE_LIST_STEP)} of ${remaining})`
            : undefined
        }
      />
    </div>
  );
}
