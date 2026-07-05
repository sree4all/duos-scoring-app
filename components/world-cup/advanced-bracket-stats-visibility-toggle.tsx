"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { worldCupCopy } from "@/lib/copy/world-cup";

export function AdvancedBracketStatsVisibilityToggle({
  groupId,
  contestId,
  initialVisible,
}: {
  groupId: string;
  contestId: string;
  initialVisible: boolean;
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(initialVisible);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onToggle(next: boolean) {
    setPending(true);
    setError(null);
    const prev = visible;
    setVisible(next);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/contests/${contestId}/advanced-bracket/stats-visibility`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visibleToMembers: next }),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not update visibility");
      router.refresh();
    } catch (e) {
      setVisible(prev);
      setError(e instanceof Error ? e.message : "Could not update visibility");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{worldCupCopy.advancedBracket.statsVisibilityTitle}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {worldCupCopy.advancedBracket.statsVisibilityHint}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={visible}
          disabled={pending}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
            visible ? "bg-primary" : "bg-white/20",
          )}
          onClick={() => onToggle(!visible)}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform",
              visible ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {visible
          ? worldCupCopy.advancedBracket.statsVisibleToAll
          : worldCupCopy.advancedBracket.statsAdminOnly}
      </p>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
