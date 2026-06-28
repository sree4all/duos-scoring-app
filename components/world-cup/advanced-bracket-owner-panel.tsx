"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AdvancedBracketOfficial } from "@/lib/domain/world-cup/advanced-bracket";

export function AdvancedBracketOwnerPanel({
  groupId,
  contestId,
  official,
}: {
  groupId: string;
  contestId: string;
  official: AdvancedBracketOfficial | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function score(phase: "semi_finalists" | "finalists" | "winner") {
    setPending(phase);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/contests/${contestId}/advanced-bracket/score`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phase }),
        },
      );
      const data = (await res.json()) as {
        error?: string;
        rowsAwarded?: number;
        officialTeams?: string[];
      };
      if (!res.ok) throw new Error(data.error ?? "Scoring failed");
      setMessage(
        `Scored ${phase.replace("_", " ")}: ${data.rowsAwarded ?? 0} ledger rows (${(data.officialTeams ?? []).join(", ")}).`,
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scoring failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
      <h2 className="text-sm font-semibold">Organizer — bracket scoring</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Run after each stage ends. Scoring is separate from match predictions.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={Boolean(pending) || Boolean(official?.semiFinalistsScoredAt)}
          onClick={() => score("semi_finalists")}
        >
          {pending === "semi_finalists" ? "Scoring…" : "Score semi-finalists"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={Boolean(pending) || Boolean(official?.finalistsScoredAt)}
          onClick={() => score("finalists")}
        >
          {pending === "finalists" ? "Scoring…" : "Score finalists"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={Boolean(pending) || Boolean(official?.winnerScoredAt)}
          onClick={() => score("winner")}
        >
          {pending === "winner" ? "Scoring…" : "Score champion"}
        </Button>
      </div>
      {message ? <p className="mt-2 text-xs text-status-success">{message}</p> : null}
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </section>
  );
}
