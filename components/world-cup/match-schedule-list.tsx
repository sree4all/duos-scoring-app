import Link from "next/link";
import { formatEasternDateTime } from "@/lib/utils/eastern-time";
import { worldCupCopy } from "@/lib/copy/world-cup";
import type { ScheduleEventRow } from "@/lib/server/world-cup/schedule-query";
import { cn } from "@/lib/utils";

function statusLabel(status: string, lockAt: string | null): string {
  const now = Date.now();
  if (status === "completed") return worldCupCopy.matchStatus.done;
  if (lockAt && new Date(lockAt).getTime() <= now) return worldCupCopy.matchStatus.locked;
  if (status === "scheduled") return worldCupCopy.matchStatus.open;
  return worldCupCopy.matchStatus.scheduled;
}

export function MatchScheduleList({
  contestId,
  events,
  userPickByEventId = {},
}: {
  contestId: string;
  events: ScheduleEventRow[];
  userPickByEventId?: Record<string, string | null>;
}) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No matches are open yet. Your organizer will open each round when it is time to play.
      </p>
    );
  }

  const now = Date.now();

  return (
    <ul className="space-y-3">
      {events.map((ev) => {
        const locked = Boolean(ev.lockAt && new Date(ev.lockAt).getTime() <= now);
        const savedPick = userPickByEventId[ev.eventId] ?? null;
        const hasPrediction = Boolean(savedPick);

        return (
          <li key={ev.eventId} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Match {ev.matchNumber ?? "—"}
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                {statusLabel(ev.matchStatus, ev.lockAt)}
              </span>
            </div>

            <div
              className={cn(
                "mt-2 inline-block rounded-md px-2 py-0.5 text-xs font-semibold",
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
            </div>

            <p className="mt-2 text-lg font-semibold">
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
                Your prediction: <strong>{savedPick}</strong>
              </p>
            ) : null}

            <Link
              href={`/contests/${contestId}/events/${ev.eventId}`}
              className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              {hasPrediction
                ? worldCupCopy.prediction.viewOrUpdate
                : worldCupCopy.prediction.makePrediction}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
