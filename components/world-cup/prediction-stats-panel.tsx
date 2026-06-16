"use client";

import { useMemo, useState } from "react";
import { formatKickoffDisplay } from "@/lib/utils/kickoff-display";
import { MOBILE_LIST_INITIAL, MOBILE_LIST_STEP } from "@/lib/world-cup/mobile-list";
import { SeeMoreFooter } from "@/components/ui/see-more-footer";
import { formatMatchPickLabel } from "@/lib/domain/world-cup/match-outcome";

export type PredictionStatsBonusPrompt = {
  id: string;
  promptText: string;
};

export type PredictionStatsEvent = {
  eventId: string;
  label: string;
  kickoffUtc: string;
  kickoffTzOffset?: string | null;
  homeTeam: string;
  awayTeam: string;
  bonusPrompts?: PredictionStatsBonusPrompt[];
};

export type MemberPredictionRow = {
  displayName: string;
  predictedWinner: string | null;
  bonusAnswers?: Record<string, string | null>;
};

function bonusColumnLabel(prompt: PredictionStatsBonusPrompt, count: number): string {
  if (count === 1) return "Bonus";
  const trimmed = prompt.promptText.trim();
  if (trimmed.length <= 28) return trimmed;
  return `${trimmed.slice(0, 25)}…`;
}

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
  const bonusPrompts = selected?.bonusPrompts ?? [];

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

      {bonusPrompts.length === 1 ? (
        <p className="text-sm text-muted-foreground">{bonusPrompts[0].promptText}</p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/20 text-left">
              <th className="px-4 py-2 font-medium">Player</th>
              <th className="px-4 py-2 font-medium">Winner</th>
              {bonusPrompts.map((prompt) => (
                <th
                  key={prompt.id}
                  className="max-w-[10rem] px-4 py-2 font-medium"
                  title={prompt.promptText}
                >
                  {bonusColumnLabel(prompt, bonusPrompts.length)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {shownRows.map((row) => (
              <tr key={row.displayName}>
                <td className="px-4 py-3 font-medium">{row.displayName}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.predictedWinner
                    ? formatMatchPickLabel(row.predictedWinner)
                    : "— Not yet"}
                </td>
                {bonusPrompts.map((prompt) => {
                  const answer = row.bonusAnswers?.[prompt.id]?.trim();
                  return (
                    <td
                      key={prompt.id}
                      className="max-w-[10rem] px-4 py-3 text-muted-foreground"
                      title={answer ?? undefined}
                    >
                      <span className="line-clamp-2">{answer || "— Not yet"}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={2 + bonusPrompts.length}
                  className="px-4 py-3 text-muted-foreground"
                >
                  No predictions saved for this match yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <SeeMoreFooter
        remaining={remainingRows}
        onShowMore={() =>
          setVisibleRows((n) => Math.min(n + MOBILE_LIST_STEP, rows.length))
        }
      />
    </div>
  );
}
