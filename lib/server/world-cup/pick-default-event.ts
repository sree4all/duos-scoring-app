import type { ScheduleEventRow } from "@/lib/server/world-cup/schedule-query";

/** Next open match on the schedule (by kickoff), for stats default selection. */
export function pickDefaultStatsEventId(events: ScheduleEventRow[]): string | null {
  if (events.length === 0) return null;

  const now = Date.now();
  const upcoming = events
    .filter((e) => {
      if (e.matchStatus === "completed") return false;
      if (e.lockAt && now > new Date(e.lockAt).getTime()) return false;
      return true;
    })
    .sort(
      (a, b) => new Date(a.kickoffUtc).getTime() - new Date(b.kickoffUtc).getTime(),
    );

  return upcoming[0]?.eventId ?? events[0]?.eventId ?? null;
}
