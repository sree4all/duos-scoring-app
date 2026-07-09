"use client";

import { useState } from "react";
import { MOBILE_LIST_INITIAL, MOBILE_LIST_STEP } from "@/lib/world-cup/mobile-list";
import { SeeMoreFooter } from "@/components/ui/see-more-footer";
import type { HistoryLineKind } from "@/lib/domain/world-cup/history-line-detail";
import { cn } from "@/lib/utils";

export type HistoryLine = {
  id: string;
  kind: HistoryLineKind;
  pointsDelta: number;
  matchTitle: string | null;
  predictedWinner: string | null;
  actualWinner: string | null;
  bonusQuestion: string | null;
  chosenAnswer: string | null;
  correctAnswer: string | null;
  fallbackLabel: string | null;
  voided: boolean;
  provisional: boolean;
};

function formatPoints(delta: number): string {
  return `${delta >= 0 ? "+" : ""}${delta} pts`;
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

function lineHeading(item: HistoryLine): string {
  if (item.matchTitle) return item.matchTitle;
  return item.fallbackLabel ?? "Points";
}

function lineSubheading(item: HistoryLine): string | null {
  if (item.kind === "match_winner") return "Winner pick";
  if (item.kind === "match_winner_miss") return "Wrong winner pick";
  if (item.kind === "match_bonus") return "Bonus question";
  return null;
}

function HistoryLineCard({ item }: { item: HistoryLine }) {
  const subheading = lineSubheading(item);
  const isMatchLine =
    item.kind === "match_winner" || item.kind === "match_winner_miss";
  const isBonusLine = item.kind === "match_bonus";

  return (
    <li className="rounded-lg border bg-card p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <p className="font-semibold leading-snug">{lineHeading(item)}</p>
          {subheading ? (
            <p className="text-xs text-muted-foreground">{subheading}</p>
          ) : item.fallbackLabel && !item.matchTitle ? null : item.fallbackLabel ? (
            <p className="text-xs text-muted-foreground">{item.fallbackLabel}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span
            className={cn(
              "tabular-nums font-semibold",
              item.pointsDelta > 0
                ? "text-score-positive"
                : item.pointsDelta < 0
                  ? "text-score-negative"
                  : "",
            )}
          >
            {formatPoints(item.pointsDelta)}
          </span>
          {item.voided ? (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              voided
            </span>
          ) : null}
          {item.provisional ? (
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
              provisional
            </span>
          ) : null}
        </div>
      </div>

      {isMatchLine ? (
        <dl className="mt-3 space-y-2 border-t pt-3">
          <DetailRow label="Your pick" value={item.predictedWinner} />
          <DetailRow label="Actual winner" value={item.actualWinner} />
        </dl>
      ) : null}

      {isBonusLine ? (
        <dl className="mt-3 space-y-2 border-t pt-3">
          <DetailRow label="Question" value={item.bonusQuestion} />
          <DetailRow label="Your answer" value={item.chosenAnswer} />
          <DetailRow label="Correct answer" value={item.correctAnswer} />
        </dl>
      ) : null}

      {!isMatchLine && !isBonusLine && item.fallbackLabel ? (
        <p className="mt-2 text-muted-foreground">{item.fallbackLabel}</p>
      ) : null}
    </li>
  );
}

export function HistoryList({ items }: { items: HistoryLine[] }) {
  const [visibleCount, setVisibleCount] = useState(MOBILE_LIST_INITIAL);
  const visible = items.slice(0, visibleCount);
  const remaining = items.length - visible.length;

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No history yet for this group.</p>
    );
  }

  return (
    <div>
      <ul className="space-y-3">
        {visible.map((item) => (
          <HistoryLineCard key={item.id} item={item} />
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
