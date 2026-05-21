import Link from "next/link";
import { formatEasternDateTime } from "@/lib/utils/eastern-time";
import { worldCupCopy } from "@/lib/copy/world-cup";
import type { ScheduleEventRow } from "@/lib/server/world-cup/schedule-query";

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
}: {
  contestId: string;
  events: ScheduleEventRow[];
}) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No matches are open yet. Your group owner will open each round when it is time to play.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {events.map((ev) => (
        <li key={ev.eventId} className="rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Match {ev.matchNumber ?? "—"}
            </span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
              {statusLabel(ev.matchStatus, ev.lockAt)}
            </span>
          </div>
          <p className="mt-2 font-medium">
            {ev.homeTeam} vs {ev.awayTeam}
          </p>
          {ev.venueLabel ? (
            <p className="text-sm text-muted-foreground">{ev.venueLabel}</p>
          ) : null}
          <p className="mt-1 text-sm">
            Kickoff: {formatEasternDateTime(ev.kickoffUtc)}
          </p>
          <Link
            href={`/contests/${contestId}/events/${ev.eventId}`}
            className="mt-3 inline-block text-sm font-medium underline"
          >
            Make your pick
          </Link>
        </li>
      ))}
    </ul>
  );
}
