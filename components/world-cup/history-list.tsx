"use client";

import { useState } from "react";
import { MOBILE_LIST_INITIAL, MOBILE_LIST_STEP } from "@/lib/world-cup/mobile-list";
import { SeeMoreFooter } from "@/components/ui/see-more-footer";

export type HistoryLine = {
  id: string;
  label: string;
  pointsDelta: number;
  createdAt: string;
  voided: boolean;
  provisional: boolean;
};

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
      <ul className="space-y-2">
        {visible.map((item) => (
          <li key={item.id} className="rounded-lg border p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{item.label}</span>
              <span className="tabular-nums">
                {item.pointsDelta >= 0 ? "+" : ""}
                {item.pointsDelta} pts
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
            <p className="mt-1 text-muted-foreground">
              {new Date(item.createdAt).toLocaleString()}
            </p>
          </li>
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
