"use client";

import { useMemo, useState } from "react";
import { formatEasternDateTime } from "@/lib/utils/eastern-time";

export type PredictionStatsEvent = {
  eventId: string;
  label: string;
  kickoffUtc: string;
  homeTeam: string;
  awayTeam: string;
};

export type MemberPredictionRow = {
  displayName: string;
  predictedWinner: string | null;
};

export function PredictionStatsPanel({
  events,
  defaultEventId,
  predictionsByEventId,
}: {
  events: PredictionStatsEvent[];
  defaultEventId: string | null;
  predictionsByEventId: Record<string, MemberPredictionRow[]>;
}) {
  const [eventId, setEventId] = useState(defaultEventId ?? events[0]?.eventId ?? "");

  const selected = useMemo(
    () => events.find((e) => e.eventId === eventId),
    [events, eventId],
  );

  const rows = predictionsByEventId[eventId] ?? [];

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No matches are open yet. Predictions will show here once your organizer opens a round.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="stats-match" className="text-sm font-medium">
          Match
        </label>
        <select
          id="stats-match"
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
        >
          {events.map((ev) => (
            <option key={ev.eventId} value={ev.eventId}>
              {ev.label}
            </option>
          ))}
        </select>
      </div>

      {selected ? (
        <p className="text-sm text-muted-foreground">
          {selected.homeTeam} vs {selected.awayTeam} · Kickoff{" "}
          {formatEasternDateTime(selected.kickoffUtc)}
        </p>
      ) : null}

      <ul className="divide-y rounded-lg border">
        {rows.map((row) => (
          <li
            key={row.displayName}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
          >
            <span className="font-medium">{row.displayName}</span>
            <span className="text-muted-foreground">
              {row.predictedWinner ?? "— Not yet"}
            </span>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="px-4 py-3 text-sm text-muted-foreground">
            No predictions saved for this match yet.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
