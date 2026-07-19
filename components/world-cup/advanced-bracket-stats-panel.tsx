"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { MOBILE_LIST_INITIAL, MOBILE_LIST_STEP } from "@/lib/world-cup/mobile-list";
import { SeeMoreFooter } from "@/components/ui/see-more-footer";
import { AdvancedBracketStatsVisibilityToggle } from "@/components/world-cup/advanced-bracket-stats-visibility-toggle";
import type { ForecastTeamPickResult } from "@/lib/domain/world-cup/advanced-bracket";
import { cn } from "@/lib/utils";

export type MemberAdvancedBracketRow = {
  displayName: string;
  /** Raw picks (kept for callers); prefer *Results for display. */
  semiFinalistTeams: string[];
  finalistTeams: string[];
  winnerTeam: string | null;
  semiFinalistResults: ForecastTeamPickResult[];
  finalistResults: ForecastTeamPickResult[];
  winnerResult: ForecastTeamPickResult | null;
  /** Accumulated forecast points for ledger-scored phases (matches leaderboard). */
  points: number;
};

function CorrectnessMark({ correct }: { correct: boolean | null }) {
  if (correct === null) return null;
  if (correct) {
    return (
      <Check
        className="inline-block size-3.5 shrink-0 text-score-positive"
        aria-label="Correct"
        strokeWidth={3}
      />
    );
  }
  return (
    <X
      className="inline-block size-3.5 shrink-0 text-score-negative"
      aria-label="Incorrect"
      strokeWidth={3}
    />
  );
}

function TeamPickChips({ results }: { results: ForecastTeamPickResult[] }) {
  if (results.length === 0) {
    return <span className="text-muted-foreground">— Not yet</span>;
  }
  return (
    <ul className="flex flex-col gap-1">
      {results.map((r) => (
        <li
          key={r.team}
          className={cn(
            "flex items-center gap-1.5",
            r.correct === true && "text-score-positive",
            r.correct === false && "text-score-negative",
            r.correct === null && "text-muted-foreground",
          )}
        >
          <CorrectnessMark correct={r.correct} />
          <span>{r.team}</span>
        </li>
      ))}
    </ul>
  );
}

function WinnerCell({ result }: { result: ForecastTeamPickResult | null }) {
  if (!result) {
    return <span className="text-muted-foreground">— Not yet</span>;
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        result.correct === true && "text-score-positive",
        result.correct === false && "text-score-negative",
        result.correct === null && "text-muted-foreground",
      )}
    >
      <CorrectnessMark correct={result.correct} />
      {result.team}
    </span>
  );
}

function PointsCell({ points }: { points: number }) {
  return (
    <span
      className={cn(
        "tabular-nums font-semibold",
        points > 0 ? "text-score-positive" : "text-muted-foreground",
      )}
    >
      {points > 0 ? `+${points}` : points}
    </span>
  );
}

export function AdvancedBracketStatsPanel({
  rows,
  groupId,
  contestId,
  canToggleVisibility,
  visibleToMembers,
  officialSemiFinalists,
  officialFinalists,
  officialWinner,
}: {
  rows: MemberAdvancedBracketRow[];
  groupId: string;
  contestId: string;
  canToggleVisibility: boolean;
  visibleToMembers: boolean;
  officialSemiFinalists?: string[];
  officialFinalists?: string[];
  officialWinner?: string | null;
}) {
  const [visibleRows, setVisibleRows] = useState(MOBILE_LIST_INITIAL);
  const shownRows = rows.slice(0, visibleRows);
  const remainingRows = rows.length - shownRows.length;

  const showOfficial =
    (officialSemiFinalists && officialSemiFinalists.length > 0) ||
    (officialFinalists && officialFinalists.length > 0) ||
    Boolean(officialWinner?.trim());

  return (
    <div className="space-y-4">
      {canToggleVisibility ? (
        <AdvancedBracketStatsVisibilityToggle
          groupId={groupId}
          contestId={contestId}
          initialVisible={visibleToMembers}
        />
      ) : null}

      {showOfficial ? (
        <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
          <p className="font-medium">Official answers</p>
          <dl className="mt-2 grid gap-1 text-muted-foreground sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide">Semi-finalists</dt>
              <dd className="text-foreground">
                {officialSemiFinalists && officialSemiFinalists.length > 0
                  ? officialSemiFinalists.join(", ")
                  : "— Pending"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide">Finalists</dt>
              <dd className="text-foreground">
                {officialFinalists && officialFinalists.length > 0
                  ? officialFinalists.join(", ")
                  : "— Pending"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide">Champion</dt>
              <dd className="text-foreground">{officialWinner?.trim() || "— Pending"}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/20 text-left">
              <th className="px-4 py-2 font-medium">Player</th>
              <th className="px-4 py-2 font-medium">Semi-finalists</th>
              <th className="px-4 py-2 font-medium">Finalists</th>
              <th className="px-4 py-2 font-medium">Champion</th>
              <th className="px-4 py-2 font-medium text-right">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {shownRows.map((row) => (
              <tr key={row.displayName}>
                <td className="px-4 py-3 font-medium">{row.displayName}</td>
                <td className="px-4 py-3">
                  <TeamPickChips results={row.semiFinalistResults} />
                </td>
                <td className="px-4 py-3">
                  <TeamPickChips results={row.finalistResults} />
                </td>
                <td className="px-4 py-3">
                  <WinnerCell result={row.winnerResult} />
                </td>
                <td className="px-4 py-3 text-right">
                  <PointsCell points={row.points} />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-3 text-muted-foreground">
                  No members in this group yet.
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
