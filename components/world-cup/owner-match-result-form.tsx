"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { worldCupCopy } from "@/lib/copy/world-cup";
import { MATCH_DRAW_PICK } from "@/lib/domain/world-cup/match-outcome";
import { cn } from "@/lib/utils";

export function OwnerMatchResultForm({
  groupId,
  contestId,
  matchId,
  homeTeam,
  awayTeam,
  allowDraw,
  initialWinner,
}: {
  groupId: string;
  contestId: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  allowDraw: boolean;
  initialWinner: string | null;
}) {
  const [winner, setWinner] = useState(initialWinner ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const options = allowDraw
    ? [homeTeam, MATCH_DRAW_PICK, awayTeam]
    : [homeTeam, awayTeam];

  async function saveResult() {
    if (!winner) return;
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/contests/${contestId}/matches/${matchId}/result`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ winner }),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not save result");
      setMessage(worldCupCopy.organizer.resultSaved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save result");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-3 rounded-lg border border-white/10 p-4">
      <h3 className="font-medium">{worldCupCopy.organizer.officialResult}</h3>
      <p className="text-sm text-muted-foreground">
        {allowDraw
          ? worldCupCopy.organizer.officialResultGroup
          : worldCupCopy.organizer.officialResultKnockout}
      </p>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <label
            key={opt}
            className={cn(
              "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border-2 px-3 py-2 text-sm transition-colors",
              winner === opt ? "border-primary bg-primary/5" : "border-white/10 hover:bg-white/10",
            )}
          >
            <input
              type="radio"
              name="official-winner"
              value={opt}
              checked={winner === opt}
              onChange={() => setWinner(opt)}
              className="h-4 w-4"
            />
            <span className="font-medium">{opt}</span>
          </label>
        ))}
      </div>
      <Button type="button" size="sm" disabled={pending || !winner} onClick={saveResult}>
        {worldCupCopy.organizer.saveResult}
      </Button>
      {message ? <p className="text-sm text-status-success">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
