"use client";

import { useMemo, useState } from "react";
import { formatKickoffDisplay } from "@/lib/utils/kickoff-display";
import { MOBILE_LIST_INITIAL, MOBILE_LIST_STEP } from "@/lib/world-cup/mobile-list";
import { SeeMoreFooter } from "@/components/ui/see-more-footer";
import { formatMatchPickLabel } from "@/lib/domain/world-cup/match-outcome";

export type PredictionStatsEvent = {
  eventId: string;
  label: string;
  kickoffUtc: string;
  kickoffTzOffset?: string | null;
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
  const [visibleRows, setVisibleRows] = useState(MOBILE_LIST_INITIAL);

  const selected = useMemo(
    () => events.find((e) => e.eventId === eventId),
    [events, eventId],
  );

  const rows = predictionsByEventId[eventId] ?? [];
  const shownRows = rows.slice(0, visibleRows);
  const remainingRows = rows.length - shownRows.length;

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
          className="neon-input mt-1 touch-manipulation text-base sm:text-sm"
          value={eventId}
          onChange={(e) => {
            setEventId(e.target.value);
            setVisibleRows(MOBILE_LIST_INITIAL);
          }}
        >
          {events.map((ev) => (
            <option key={ev.eventId} value={ev.eventId}>
              {ev.label}
            </option>
          ))}
        </select>
      </div>

      {selected ? (
        <p className="break-words text-sm text-muted-foreground">
          {selected.homeTeam} vs {selected.awayTeam} · Kickoff{" "}
          {formatKickoffDisplay(selected.kickoffUtc)}
        </p>
      ) : null}

      <ul className="divide-y rounded-lg border">
        {shownRows.map((row) => (
          <li
            key={row.displayName}
            className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="font-medium">{row.displayName}</span>
            <span className="break-words text-muted-foreground sm:text-right">
              {row.predictedWinner
                ? formatMatchPickLabel(row.predictedWinner)
                : "— Not yet"}
            </span>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="px-4 py-3 text-sm text-muted-foreground">
            No predictions saved for this match yet.
          </li>
        ) : null}
      </ul>

      <SeeMoreFooter
        remaining={remainingRows}
        onShowMore={() =>
          setVisibleRows((n) => Math.min(n + MOBILE_LIST_STEP, rows.length))
        }
      />
    </div>
  );
}
