"use client";

import { useState } from "react";
import { MOBILE_LIST_INITIAL, MOBILE_LIST_STEP } from "@/lib/world-cup/mobile-list";
import { SeeMoreFooter } from "@/components/ui/see-more-footer";
import type {
  HistoryMatchGroup,
  HistoryOtherLine,
} from "@/lib/domain/world-cup/history-match-groups";
import { cn } from "@/lib/utils";

export type HistoryListProps = {
  matches: HistoryMatchGroup[];
  other: HistoryOtherLine[];
};

function formatPoints(delta: number | null): string {
  if (delta === null) return "—";
  return `${delta >= 0 ? "+" : ""}${delta} pts`;
}

function PointsBadge({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span className="tabular-nums text-muted-foreground">—</span>;
  }
  return (
    <span
      className={cn(
        "tabular-nums font-semibold",
        delta > 0 ? "text-score-positive" : delta < 0 ? "text-score-negative" : "",
      )}
    >
      {formatPoints(delta)}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
      <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:w-32">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

function HistoryMatchCard({ group }: { group: HistoryMatchGroup }) {
  return (
    <li className="rounded-lg border bg-card p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold leading-snug">{group.matchTitle}</p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span
            className={cn(
              "tabular-nums text-xs font-medium uppercase tracking-wide",
              group.totalPoints > 0
                ? "text-score-positive"
                : group.totalPoints < 0
                  ? "text-score-negative"
                  : "text-muted-foreground",
            )}
          >
            {formatPoints(group.totalPoints)}
          </span>
          {group.voided ? (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              voided
            </span>
          ) : null}
        </div>
      </div>

      {group.winner ? (
        <section className="mt-3 space-y-2 border-t pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Winner pick
            </p>
            <PointsBadge delta={group.winner.pointsDelta} />
          </div>
          <dl className="space-y-2">
            <DetailRow label="Your pick" value={group.winner.predictedWinner} />
            <DetailRow label="Actual winner" value={group.winner.actualWinner} />
          </dl>
          {group.winner.provisional ? (
            <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
              provisional
            </span>
          ) : null}
        </section>
      ) : null}

      {group.bonuses.map((bonus) => (
        <section key={bonus.promptId} className="mt-3 space-y-2 border-t pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Bonus question
            </p>
            <PointsBadge delta={bonus.pointsDelta} />
          </div>
          <dl className="space-y-2">
            <DetailRow label="Question" value={bonus.question} />
            <DetailRow label="Your answer" value={bonus.chosenAnswer} />
            <DetailRow label="Correct answer" value={bonus.correctAnswer} />
          </dl>
        </section>
      ))}
    </li>
  );
}

function HistoryOtherCard({ line }: { line: HistoryOtherLine }) {
  return (
    <li className="rounded-lg border bg-card p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{line.label}</p>
        <div className="flex items-center gap-2">
          <PointsBadge delta={line.pointsDelta} />
          {line.voided ? (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              voided
            </span>
          ) : null}
          {line.provisional ? (
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
              provisional
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function HistoryList({ matches, other }: HistoryListProps) {
  const items = [...matches, ...other];
  const [visibleCount, setVisibleCount] = useState(MOBILE_LIST_INITIAL);
  const visibleMatches = matches.slice(0, visibleCount);
  const visibleOther =
    visibleCount > matches.length ? other.slice(0, visibleCount - matches.length) : [];
  const remaining = items.length - visibleMatches.length - visibleOther.length;

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No history yet for this group.</p>
    );
  }

  return (
    <div>
      <ul className="space-y-3">
        {visibleMatches.map((group) => (
          <HistoryMatchCard key={group.id} group={group} />
        ))}
        {visibleOther.map((line) => (
          <HistoryOtherCard key={line.id} line={line} />
        ))}
      </ul>
      <SeeMoreFooter
        remaining={remaining}
        onShowMore={() =>
          setVisibleCount((n) => Math.min(n + MOBILE_LIST_STEP, items.length))
        }
      />
    </div>
  );
}
