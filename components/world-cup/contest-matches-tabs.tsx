"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { worldCupCopy } from "@/lib/copy/world-cup";

type Tab = "schedule" | "stats" | "advanced" | "advancedStats";

export function ContestMatchesTabs({
  schedule,
  stats,
  advanced,
  advancedStats,
}: {
  schedule: React.ReactNode;
  stats: React.ReactNode;
  advanced?: React.ReactNode;
  advancedStats?: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("schedule");

  return (
    <div className="space-y-4">
      <div
        className="flex rounded-xl border border-white/10 bg-white/5 p-1"
        role="tablist"
        aria-label="Predictions views"
      >
        {(
          [
            ["schedule", worldCupCopy.nav.worldCupPredictions],
            ["stats", worldCupCopy.nav.predictionStats],
            ...(advanced
              ? [["advanced", worldCupCopy.nav.advancedPredictions] as const]
              : []),
            ...(advancedStats
              ? [["advancedStats", worldCupCopy.nav.advancedBracketStats] as const]
              : []),
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={cn(
              "min-h-11 flex-1 rounded-md px-2 py-2.5 text-sm font-medium transition-colors touch-manipulation sm:min-h-0 sm:px-3 sm:py-2",
              tab === id
                ? "bg-primary/25 text-white shadow-sm"
                : "text-muted-foreground hover:bg-white/10 hover:text-white",
            )}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === "schedule"
          ? schedule
          : tab === "stats"
            ? stats
            : tab === "advanced"
              ? advanced
              : advancedStats}
      </div>
    </div>
  );
}
